import { useState } from 'react'
import type { Candidate, CandidateStatus } from '../types'
import FitScore from './FitScore'

const STATUSES: CandidateStatus[] = ['new', 'reviewing', 'shortlisted', 'rejected']

interface Props {
  candidate: Candidate
  onClose: () => void
  onUpdate: (id: string, payload: { status?: CandidateStatus }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function CandidateModal({ candidate, onClose, onUpdate, onDelete }: Props) {
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const pr = candidate.parsed_resume

  async function handleStatus(status: CandidateStatus) {
    setUpdating(true)
    try { await onUpdate(candidate.id, { status }) } finally { setUpdating(false) }
  }

  async function handleDelete() {
    if (!confirm('Remove this candidate?')) return
    setDeleting(true)
    try { await onDelete(candidate.id) } finally { setDeleting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl" style={{ backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)' }}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h2 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>
              {candidate.name ?? <em style={{ color: 'var(--color-text-secondary)' }}>Name pending…</em>}
            </h2>
            {candidate.email && <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{candidate.email}</p>}
            {candidate.phone && <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{candidate.phone}</p>}
          </div>
          <button onClick={onClose} className="btn-sm btn-ghost ml-4 text-lg leading-none">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Fit Score */}
          {candidate.fit_score !== null && candidate.fit_reasoning ? (
            <FitScore
              score={candidate.fit_score}
              reasoning={candidate.fit_reasoning}
              strengths={candidate.strengths ?? []}
              gaps={candidate.gaps ?? []}
            />
          ) : (
            <div className="rounded-xl border p-4 text-sm text-center" style={{ backgroundColor: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
              AI analysis in progress…
            </div>
          )}

          {/* Parsed resume */}
          {pr && (
            <>
              {pr.skills.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-secondary)' }}>Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pr.skills.map(s => <span key={s} className="badge badge-accent">{s}</span>)}
                  </div>
                </div>
              )}

              {pr.experience_years > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-secondary)' }}>Experience</p>
                  <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{pr.experience_years} year{pr.experience_years !== 1 ? 's' : ''}</p>
                </div>
              )}

              {pr.previous_roles.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-secondary)' }}>Previous Roles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pr.previous_roles.map(r => <span key={r} className="badge badge-neutral">{r}</span>)}
                  </div>
                </div>
              )}

              {pr.education.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-secondary)' }}>Education</p>
                  <ul className="space-y-0.5">
                    {pr.education.map(e => <li key={e} className="text-sm" style={{ color: 'var(--color-text-primary)' }}>• {e}</li>)}
                  </ul>
                </div>
              )}

              {pr.summary && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-secondary)' }}>Summary</p>
                  <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{pr.summary}</p>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Status</label>
              <select
                value={candidate.status}
                onChange={e => handleStatus(e.target.value as CandidateStatus)}
                disabled={updating}
                className="input text-xs py-1 px-2 w-auto"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={handleDelete} disabled={deleting} className="btn-sm btn-danger">
              {deleting ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
