import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.job import Job, JobStatus
from app.models.candidate import Candidate
from app.models.user import User
from app.schemas.job import JobCreate, JobUpdate, JobResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/jobs", tags=["jobs"])


async def _job_with_count(db: AsyncSession, job: Job) -> JobResponse:
    count_result = await db.execute(
        select(func.count(Candidate.id)).where(Candidate.job_id == job.id)
    )
    count = count_result.scalar_one()
    data = JobResponse.model_validate(job)
    data.candidate_count = count
    return data


def _assert_owner(job: Job, user: User):
    if job.recruiter_id != user.id:
        raise HTTPException(status_code=403, detail="Not your job")


@router.get("", response_model=list[JobResponse])
async def list_jobs(
    status: JobStatus | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Job).where(Job.recruiter_id == current_user.id)
    if status:
        q = q.where(Job.status == status)
    if search:
        q = q.where(Job.title.ilike(f"%{search}%"))
    q = q.order_by(Job.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(q)
    jobs = result.scalars().all()
    return [await _job_with_count(db, j) for j in jobs]


@router.post("", response_model=JobResponse, status_code=201)
async def create_job(
    payload: JobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = Job(**payload.model_dump(), recruiter_id=current_user.id)
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return await _job_with_count(db, job)


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    _assert_owner(job, current_user)
    return await _job_with_count(db, job)


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: uuid.UUID,
    payload: JobUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    _assert_owner(job, current_user)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(job, field, value)
    await db.commit()
    await db.refresh(job)
    return await _job_with_count(db, job)


@router.patch("/{job_id}/close", response_model=JobResponse)
async def close_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    _assert_owner(job, current_user)
    job.status = JobStatus.closed
    await db.commit()
    await db.refresh(job)
    return await _job_with_count(db, job)


@router.patch("/{job_id}/reopen", response_model=JobResponse)
async def reopen_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    _assert_owner(job, current_user)
    job.status = JobStatus.open
    await db.commit()
    await db.refresh(job)
    return await _job_with_count(db, job)
