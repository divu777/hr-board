import asyncio
import json
import uuid
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sse_starlette.sse import EventSourceResponse

from app.database import get_db
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.task import ResumeTask, TaskStatus
from app.models.user import User
from app.api.deps import get_current_user
from app.services.task_queue import get_or_create_sse_event, remove_sse_event

router = APIRouter(tags=["sse"])


@router.get("/events/candidates/{candidate_id}")
async def candidate_events(
    candidate_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # verify ownership
    candidate_result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = candidate_result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    job_result = await db.execute(select(Job).where(Job.id == candidate.job_id))
    job = job_result.scalar_one()
    if job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    async def event_generator():
        task_result = await db.execute(select(ResumeTask).where(ResumeTask.candidate_id == candidate_id))
        task = task_result.scalar_one_or_none()

        if not task:
            yield {"data": json.dumps({"status": "not_found"})}
            return

        if task.status == TaskStatus.done:
            c_result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
            c = c_result.scalar_one()
            yield {"data": json.dumps({"status": "done", "candidate": _serialize(c)})}
            return

        if task.status == TaskStatus.failed:
            yield {"data": json.dumps({"status": "failed", "error": task.error_message})}
            return

        yield {"data": json.dumps({"status": "processing"})}

        event = get_or_create_sse_event(candidate_id)
        try:
            await asyncio.wait_for(event.wait(), timeout=120)
        except asyncio.TimeoutError:
            yield {"data": json.dumps({"status": "timeout"})}
            return
        finally:
            remove_sse_event(candidate_id)

        # open a fresh session — original may have expired after long wait
        from app.database import AsyncSessionLocal
        async with AsyncSessionLocal() as fresh_db:
            c_result = await fresh_db.execute(select(Candidate).where(Candidate.id == candidate_id))
            final_candidate = c_result.scalar_one()
            t_result = await fresh_db.execute(select(ResumeTask).where(ResumeTask.candidate_id == candidate_id))
            final_task = t_result.scalar_one()

        if final_task.status == TaskStatus.done:
            yield {"data": json.dumps({"status": "done", "candidate": _serialize(final_candidate)})}
        else:
            yield {"data": json.dumps({"status": "failed", "error": final_task.error_message})}

    return EventSourceResponse(event_generator())


def _serialize(candidate: Candidate) -> dict:
    return {
        "id": str(candidate.id),
        "job_id": str(candidate.job_id),
        "name": candidate.name,
        "email": candidate.email,
        "phone": candidate.phone,
        "resume_filename": candidate.resume_filename,
        "parsed_resume": candidate.parsed_resume,
        "fit_score": candidate.fit_score,
        "fit_reasoning": candidate.fit_reasoning,
        "strengths": candidate.strengths,
        "gaps": candidate.gaps,
        "status": candidate.status,
    }
