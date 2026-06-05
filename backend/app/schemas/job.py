import uuid
from datetime import datetime
from pydantic import BaseModel, field_validator
from app.models.job import EmploymentType, JobStatus


class JobCreate(BaseModel):
    title: str
    description: str
    requirements: str
    location: str
    employment_type: EmploymentType


class JobUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    requirements: str | None = None
    location: str | None = None
    employment_type: EmploymentType | None = None


class JobResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    requirements: str
    location: str
    employment_type: EmploymentType
    status: JobStatus
    candidate_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
