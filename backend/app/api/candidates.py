import asyncio
import hashlib
import os
import uuid
from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.models.candidate import Candidate, CandidateStatus
from app.models.job import Job
from app.models.task import ResumeTask, TaskStatus
from app.models.user import User
from app.schemas.candidate import CandidateResponse, CandidateUpdate, UploadResponse
from app.api.deps import get_current_user
from app.services.task_queue import enqueue

router = APIRouter(tags=["candidates"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
UPLOAD_LIMIT = 20
UPLOAD_WINDOW = timedelta(hours=1)

# Per-user sliding-window timestamps and locks.
# Lock ensures check+append is atomic — no two coroutines can both pass
# the check before either records the timestamp.
_upload_timestamps: dict[str, list[datetime]] = defaultdict(list)
_upload_locks: dict[str, asyncio.Lock] = {}


def _get_lock(user_id: str) -> asyncio.Lock:
    # Lock creation itself is synchronous, so safe without a lock.
    if user_id not in _upload_locks:
        _upload_locks[user_id] = asyncio.Lock()
    return _upload_locks[user_id]


async def _check_rate_limit(user_id: str) -> None:
    async with _get_lock(user_id):
        now = datetime.utcnow()
        cutoff = now - UPLOAD_WINDOW
        # Prune expired entries inside the lock so count is always accurate.
        _upload_timestamps[user_id] = [t for t in _upload_timestamps[user_id] if t > cutoff]
        if len(_upload_timestamps[user_id]) >= UPLOAD_LIMIT:
            raise HTTPException(
                status_code=429,
                detail=f"Upload limit reached ({UPLOAD_LIMIT}/hour). Try again later.",
            )
        # Record only after confirming under the limit — inside the same lock.
        _upload_timestamps[user_id].append(now)


async def _get_owned_job(job_id: uuid.UUID, db: AsyncSession, user: User) -> Job:
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.recruiter_id != user.id:
        raise HTTPException(status_code=403, detail="Not your job")
    return job


@router.get("/jobs/{job_id}/candidates", response_model=list[CandidateResponse])
async def list_candidates(
    job_id: uuid.UUID,
    status: CandidateStatus | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_owned_job(job_id, db, current_user)
    q = select(Candidate).where(Candidate.job_id == job_id)
    if status:
        q = q.where(Candidate.status == status)
    if search:
        q = q.where(Candidate.name.ilike(f"%{search}%"))
    q = q.order_by(Candidate.fit_score.desc().nullslast(), Candidate.created_at.desc())
    q = q.offset((page - 1) * limit).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/jobs/{job_id}/candidates/upload", response_model=UploadResponse, status_code=201)
async def upload_resume(
    job_id: uuid.UUID,
    resume: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = await _get_owned_job(job_id, db, current_user)
    _check_rate_limit(str(current_user.id))

    if resume.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    file_bytes = await resume.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    resume_hash = hashlib.sha256(file_bytes).hexdigest()

    # idempotency: same resume for same job
    existing = await db.execute(
        select(ResumeTask).where(
            ResumeTask.job_id == job_id,
            ResumeTask.resume_hash == resume_hash,
        )
    )
    existing_task = existing.scalar_one_or_none()
    if existing_task:
        return UploadResponse(
            candidate_id=str(existing_task.candidate_id),
            task_id=str(existing_task.id),
            cached=True,
        )

    # save file
    upload_dir = os.path.join(settings.upload_dir, str(job_id))
    os.makedirs(upload_dir, exist_ok=True)
    safe_filename = f"{uuid.uuid4()}_{resume.filename}"
    with open(os.path.join(upload_dir, safe_filename), "wb") as f:
        f.write(file_bytes)

    # create candidate + task
    candidate = Candidate(job_id=job_id, resume_filename=safe_filename)
    db.add(candidate)
    await db.flush()

    task = ResumeTask(
        candidate_id=candidate.id,
        job_id=job_id,
        resume_hash=resume_hash,
    )
    db.add(task)
    await db.commit()
    await db.refresh(candidate)
    await db.refresh(task)

    await enqueue(candidate.id)

    return UploadResponse(candidate_id=str(candidate.id), task_id=str(task.id))


@router.post("/jobs/{job_id}/candidates/bulk-upload", status_code=201)
async def bulk_upload(
    job_id: uuid.UUID,
    resumes: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_owned_job(job_id, db, current_user)
    results = []
    for resume in resumes:
        try:
            # reuse single upload logic via internal call
            result = await upload_resume(job_id, resume, db, current_user)
            results.append({"filename": resume.filename, **result.model_dump()})
        except HTTPException as e:
            results.append({"filename": resume.filename, "error": e.detail})
    return results


@router.get("/candidates/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(
    candidate_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    await _get_owned_job(candidate.job_id, db, current_user)
    return candidate


@router.put("/candidates/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(
    candidate_id: uuid.UUID,
    payload: CandidateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    await _get_owned_job(candidate.job_id, db, current_user)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(candidate, field, value)
    candidate.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(candidate)
    return candidate


@router.delete("/candidates/{candidate_id}", status_code=204)
async def delete_candidate(
    candidate_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    await _get_owned_job(candidate.job_id, db, current_user)
    await db.delete(candidate)
    await db.commit()
