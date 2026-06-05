from pydantic import BaseModel, Field


class ParsedResume(BaseModel):
    name: str
    email: str
    phone: str
    skills: list[str]
    experience_years: int
    education: list[str]
    previous_roles: list[str]
    summary: str


class FitScore(BaseModel):
    score: int = Field(..., ge=0, le=100)
    reasoning: str
    strengths: list[str]
    gaps: list[str]
