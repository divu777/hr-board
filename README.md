# Gappeo — AI-Powered Recruiter Platform

Post jobs, collect resumes, and let AI score every candidate automatically.

Recruiters post a job opening, candidates apply by submitting their CV (PDF), and Gappeo parses each resume in the background — extracting skills, experience, and previous roles — then scores the candidate's fit against the job description. No manual screening needed.

---

## How it works

1. **Post a job** — add title, description, requirements, location, and employment type
2. **Upload resumes** — drag-drop one PDF or bulk-upload many at once
3. **AI parses & scores** — LangChain + GPT-4o-mini extracts candidate info and scores fit 0–100
4. **Real-time updates** — browser notified via SSE the moment parsing completes
5. **Filter & review** — search candidates by name, filter by status, sort by score
6. **Manage pipeline** — move candidates through New → Reviewing → Shortlisted → Rejected

---

## Features

- JWT auth (register / login) with specific error messages
- Full job CRUD — create, edit, close, reopen
- Async resume processing queue with idempotency (same CV + same job = no double parse)
- Exponential backoff retries (up to 3) on AI failures
- Per-user upload rate limiting (20/hour) with race-condition-safe asyncio lock
- SSE real-time parse notifications without polling
- Candidate filters: name search, status, fit score sort
- Sage Forest design system — token-based CSS, soothing greens

---

## Tech stack

| Layer | Stack |
|---|---|
| Backend | FastAPI, SQLAlchemy (async), PostgreSQL |
| AI | LangChain, GPT-4o-mini, pypdf |
| Auth | JWT (python-jose), bcrypt |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Infra | Docker, nginx (reverse proxy) |

---

## Local setup

**Prerequisites:** Docker + Docker Compose, an OpenAI API key

```bash
git clone https://github.com/divu777/hr-board.git
cd hr-board

cp .env.example .env
# Edit .env — fill in OPENAI_API_KEY and set a strong SECRET_KEY:
#   openssl rand -hex 32

docker-compose up --build
```

App runs at **http://localhost:80**

| Service | URL |
|---|---|
| Frontend | http://localhost:80 |
| Backend API | http://localhost:80/api |
| API docs | http://localhost:80/api/docs |

---

## Environment variables

```env
POSTGRES_USER=gappeo
POSTGRES_PASSWORD=gappeo
POSTGRES_DB=gappeo
DATABASE_URL=postgresql+asyncpg://gappeo:gappeo@db:5432/gappeo
SECRET_KEY=<openssl rand -hex 32>
OPENAI_API_KEY=sk-...
```

---

## Deployment

**Backend → Railway**
- New project → deploy from GitHub → root directory: `backend`
- Add PostgreSQL plugin (DATABASE_URL auto-linked)
- Set `SECRET_KEY` and `OPENAI_API_KEY` in Variables tab

**Frontend → Vercel**
- Import repo → root directory: `frontend` → framework: Vite
- Add env var: `VITE_API_URL=https://<your-railway-backend-url>`

---

## API overview

```
POST   /auth/register
POST   /auth/login

GET    /jobs
POST   /jobs
GET    /jobs/:id
PUT    /jobs/:id
PATCH  /jobs/:id/close
PATCH  /jobs/:id/reopen

GET    /jobs/:id/candidates
POST   /jobs/:id/candidates/upload
POST   /jobs/:id/candidates/bulk-upload
GET    /candidates/:id
PUT    /candidates/:id
DELETE /candidates/:id

GET    /events/candidates/:id     (SSE stream)
```

All job and candidate routes require `Authorization: Bearer <token>`.
