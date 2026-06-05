import asyncio
import uuid
import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.task import ResumeTask, TaskStatus
from app.models.candidate import Candidate
from app.models.job import Job
from app.services.pdf_service import extract_text
from app.services.ai_service import parse_resume, score_fit

logger = logging.getLogger(__name__)

_queue: asyncio.Queue[uuid.UUID] = asyncio.Queue()
_sse_events: dict[uuid.UUID, asyncio.Event] = {}


def get_or_create_sse_event(candidate_id: uuid.UUID) -> asyncio.Event:
    if candidate_id not in _sse_events:
        _sse_events[candidate_id] = asyncio.Event()
    return _sse_events[candidate_id]


def notify_sse(candidate_id: uuid.UUID):
    event = _sse_events.get(candidate_id)
    if event:
        event.set()


def remove_sse_event(candidate_id: uuid.UUID):
    _sse_events.pop(candidate_id, None)


async def enqueue(candidate_id: uuid.UUID):
    await _queue.put(candidate_id)


async def _process_task(task: ResumeTask, db: AsyncSession):
    import os
    from app.config import settings

    task.status = TaskStatus.processing
    task.updated_at = datetime.utcnow()
    await db.commit()

    candidate_result = await db.execute(select(Candidate).where(Candidate.id == task.candidate_id))
    candidate = candidate_result.scalar_one()

    job_result = await db.execute(select(Job).where(Job.id == task.job_id))
    job = job_result.scalar_one()

    resume_path = os.path.join(settings.upload_dir, str(task.job_id), candidate.resume_filename)
    with open(resume_path, "rb") as f:
        pdf_bytes = f.read()

    text = extract_text(pdf_bytes)
    parsed = await parse_resume(text)
    fit = await score_fit(parsed, job.description + "\n\nRequirements:\n" + job.requirements)

    candidate.name = parsed.name
    candidate.email = parsed.email
    candidate.phone = parsed.phone
    candidate.parsed_resume = parsed.model_dump()
    candidate.fit_score = fit.score
    candidate.fit_reasoning = fit.reasoning
    candidate.strengths = fit.strengths
    candidate.gaps = fit.gaps
    candidate.updated_at = datetime.utcnow()

    task.status = TaskStatus.done
    task.updated_at = datetime.utcnow()
    await db.commit()

    notify_sse(task.candidate_id)


async def worker_loop(session_factory: async_sessionmaker):
    while True:
        candidate_id = await _queue.get()
        try:
            async with session_factory() as db:
                result = await db.execute(
                    select(ResumeTask).where(ResumeTask.candidate_id == candidate_id)
                )
                task = result.scalar_one_or_none()
                if not task or task.status == TaskStatus.done:
                    continue

                try:
                    await _process_task(task, db)
                except Exception as e:
                    logger.error(f"Task {task.id} failed: {e}")
                    task.retry_count += 1
                    task.error_message = str(e)

                    if task.retry_count < task.max_retries:
                        task.status = TaskStatus.pending
                        task.updated_at = datetime.utcnow()
                        await db.commit()
                        delay = 2 ** task.retry_count
                        await asyncio.sleep(delay)
                        await _queue.put(candidate_id)
                    else:
                        task.status = TaskStatus.failed
                        task.updated_at = datetime.utcnow()
                        await db.commit()
                        notify_sse(task.candidate_id)
        except Exception as e:
            logger.error(f"Worker error for candidate {candidate_id}: {e}")
        finally:
            _queue.task_done()


async def requeue_pending(session_factory: async_sessionmaker):
    async with session_factory() as db:
        result = await db.execute(
            select(ResumeTask).where(ResumeTask.status.in_([TaskStatus.pending, TaskStatus.processing]))
        )
        tasks = result.scalars().all()
        for task in tasks:
            task.status = TaskStatus.pending
            await _queue.put(task.candidate_id)
        if tasks:
            await db.commit()
            logger.info(f"Re-enqueued {len(tasks)} pending tasks from DB")
