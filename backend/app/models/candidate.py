import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
import enum

from app.database import Base


class CandidateStatus(str, enum.Enum):
    new = "new"
    reviewing = "reviewing"
    shortlisted = "shortlisted"
    rejected = "rejected"


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    resume_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    parsed_resume: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    fit_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fit_reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)
    strengths: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    gaps: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[CandidateStatus] = mapped_column(SAEnum(CandidateStatus), default=CandidateStatus.new, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
