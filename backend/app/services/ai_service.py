import re

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from app.schemas.ai import ParsedResume, FitScore


def _clean_email(raw: str) -> str:
    """Extract only the email address, strip any surrounding junk the LLM concatenates."""
    match = re.search(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', raw or '')
    return match.group(0) if match else ''

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

_parse_chain = (
    ChatPromptTemplate.from_messages([
        ("system", "You are a resume parser. Extract structured information from the resume text. Rules: email must be a valid format (user@domain.com) with no surrounding text or prefixes; phone must contain only digits, spaces, +, -, () characters; if a field is missing use an empty string or 0."),
        ("human", "{resume_text}"),
    ])
    | llm.with_structured_output(ParsedResume)
)

_fit_chain = (
    ChatPromptTemplate.from_messages([
        ("system", "You are a recruiter evaluating candidate fit. Score 0-100 based on how well the candidate matches the job. Be specific and honest."),
        ("human", "JOB DESCRIPTION:\n{job_description}\n\nCANDIDATE PROFILE:\nSkills: {skills}\nExperience: {experience_years} years\nPrevious roles: {previous_roles}\nSummary: {summary}"),
    ])
    | llm.with_structured_output(FitScore)
)


def _coerce_parsed(result) -> ParsedResume:
    if isinstance(result, dict):
        return ParsedResume(**result)
    return result


def _coerce_fit(result) -> FitScore:
    if isinstance(result, dict):
        return FitScore(**result)
    return result


async def parse_resume(text: str) -> ParsedResume:
    result = await _parse_chain.ainvoke({"resume_text": text})
    parsed = _coerce_parsed(result)
    parsed.email = _clean_email(parsed.email)
    return parsed


async def score_fit(parsed: ParsedResume, job_description: str) -> FitScore:
    result = await _fit_chain.ainvoke({
        "job_description": job_description,
        "skills": ", ".join(parsed.skills),
        "experience_years": parsed.experience_years,
        "previous_roles": ", ".join(parsed.previous_roles),
        "summary": parsed.summary,
    })
    return _coerce_fit(result)
