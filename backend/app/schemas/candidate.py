import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.candidate import CandidateStatus


class CandidateUpdate(BaseModel):
    status: CandidateStatus | None = None
    name: str | None = None
    email: str | None = None


class ParsedResume(BaseModel):
    name: str
    email: str
    phone: str
    skills: list[str]
    experience_years: int
    education: list[str]
    previous_roles: list[str]
    summary: str


class CandidateResponse(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    name: str | None
    email: str | None
    phone: str | None
    resume_filename: str
    parsed_resume: dict | None
    fit_score: int | None
    fit_reasoning: str | None
    strengths: list[str] | None
    gaps: list[str] | None
    status: CandidateStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UploadResponse(BaseModel):
    candidate_id: str
    task_id: str
    cached: bool = False
