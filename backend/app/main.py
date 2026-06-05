import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, AsyncSessionLocal, Base
from app.models import User, Job, Candidate, ResumeTask  # noqa: ensure models registered
from app.api import auth, jobs, candidates, sse
from app.services.task_queue import worker_loop, requeue_pending


@asynccontextmanager
async def lifespan(app: FastAPI):
    # create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # re-enqueue tasks that were interrupted
    await requeue_pending(AsyncSessionLocal)

    # start background worker
    worker_task = asyncio.create_task(worker_loop(AsyncSessionLocal))
    yield
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="Gappeo Recruiter API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(candidates.router)
app.include_router(sse.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
