export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'remote'
export type JobStatus = 'open' | 'closed'
export type CandidateStatus = 'new' | 'reviewing' | 'shortlisted' | 'rejected'

export interface Job {
  id: string
  title: string
  description: string
  requirements: string
  location: string
  employment_type: EmploymentType
  status: JobStatus
  candidate_count: number
  created_at: string
  updated_at: string
}

export interface ParsedResume {
  name: string
  email: string
  phone: string
  skills: string[]
  experience_years: number
  education: string[]
  previous_roles: string[]
  summary: string
}

export interface Candidate {
  id: string
  job_id: string
  name: string | null
  email: string | null
  phone: string | null
  resume_filename: string
  parsed_resume: ParsedResume | null
  fit_score: number | null
  fit_reasoning: string | null
  strengths: string[] | null
  gaps: string[] | null
  status: CandidateStatus
  created_at: string
  updated_at: string
}

export interface UploadResponse {
  candidate_id: string
  task_id: string
  cached: boolean
}

export interface JobCreate {
  title: string
  description: string
  requirements: string
  location: string
  employment_type: EmploymentType
}

export interface JobUpdate {
  title?: string
  description?: string
  requirements?: string
  location?: string
  employment_type?: EmploymentType
}
