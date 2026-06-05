import type { Candidate } from '../types'

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Analyzing
      </span>
    )
  }
  const cls = score >= 70 ? 'badge-success' : score >= 40 ? 'badge-warning' : 'badge-danger'
  return <span className={`badge font-semibold ${cls}`}>{score}</span>
}

const statusCls: Record<string, string> = {
  new: 'badge-info',
  reviewing: 'badge-warning',
  shortlisted: 'badge-success',
  rejected: 'badge-danger',
}

export default function CandidateCard({ candidate, onClick }: { candidate: Candidate; onClick: () => void }) {
  const isOptimistic = candidate.id.startsWith('optimistic-')

  return (
    <div
      onClick={!isOptimistic ? onClick : undefined}
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-150 ${
        isOptimistic ? 'opacity-60' : 'cursor-pointer'
      }`}
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      onMouseEnter={e => { if (!isOptimistic) e.currentTarget.style.borderColor = 'var(--color-accent)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: candidate.name ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
          {candidate.name ?? <em>Parsing resume…</em>}
        </p>
        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {candidate.resume_filename}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-3 shrink-0">
        <ScoreBadge score={candidate.fit_score} />
        <span className={`badge ${statusCls[candidate.status] ?? 'badge-neutral'}`}>{candidate.status}</span>
      </div>
    </div>
  )
}
