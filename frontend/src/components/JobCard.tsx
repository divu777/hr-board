import { useNavigate } from 'react-router-dom'
import type { Job } from '../types'

const typeLabel: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  remote: 'Remote',
}

export default function JobCard({ job }: { job: Job }) {
  const navigate = useNavigate()

  return (
    <div onClick={() => navigate(`/jobs/${job.id}`)} className="card-interactive p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-sm leading-snug" style={{ color: 'var(--color-text-primary)' }}>
          {job.title}
        </h3>
        <span className={`badge shrink-0 ${job.status === 'open' ? 'badge-success' : 'badge-neutral'}`}>
          {job.status}
        </span>
      </div>

      <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>{job.location}</p>

      <div className="flex items-center justify-between">
        <span className="badge badge-accent">{typeLabel[job.employment_type] ?? job.employment_type}</span>
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {job.candidate_count} candidate{job.candidate_count !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
