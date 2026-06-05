import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useJobs } from '../hooks/useJobs'
import { useCandidates } from '../hooks/useCandidates'
import { useSSE } from '../hooks/useSSE'
import CandidateCard from '../components/CandidateCard'
import ResumeUpload from '../components/ResumeUpload'
import CandidateModal from '../components/CandidateModal'
import type { Job, Candidate, JobUpdate } from '../types'

const EMP_TYPES = ['full_time', 'part_time', 'contract', 'remote'] as const

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<JobUpdate>({})
  const [saving, setSaving] = useState(false)
  const [closing, setClosing] = useState(false)
  const [reopening, setReopening] = useState(false)
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [pendingSSEId, setPendingSSEId] = useState<string | null>(null)
  const [candidateSearch, setCandidateSearch] = useState('')
  const [candidateStatus, setCandidateStatus] = useState('')
  const [scoreSort, setScoreSort] = useState<'desc' | 'asc' | ''>('desc')

  const { updateJob, closeJob, reopenJob } = useJobs({ skip: true })
  const { candidates, loading, uploadResume, bulkUpload, updateCandidate, removeCandidate, patchCandidate } = useCandidates(id!)

  useSSE(pendingSSEId, (updated) => {
    patchCandidate(updated)
    setPendingSSEId(null)
    if (selected?.id === updated.id) setSelected(updated)
  })

  useEffect(() => {
    if (!id) return
    api.get<Job>(`/jobs/${id}`).then(({ data }) => {
      setJob(data)
      setEditForm({ title: data.title, description: data.description, requirements: data.requirements, location: data.location, employment_type: data.employment_type })
    })
  }, [id])

  async function handleSave() {
    if (!job) return
    setSaving(true)
    try { const u = await updateJob(job.id, editForm); setJob(u); setEditing(false) }
    finally { setSaving(false) }
  }

  async function handleClose() {
    if (!job) return
    setClosing(true)
    try { const u = await closeJob(job.id); setJob(u) }
    finally { setClosing(false) }
  }

  async function handleReopen() {
    if (!job) return
    setReopening(true)
    try { const u = await reopenJob(job.id); setJob(u) }
    finally { setReopening(false) }
  }

  async function handleUpload(file: File) {
    const result = await uploadResume(file)
    if (!result.cached) setPendingSSEId(result.candidate_id)
  }

  if (!job) {
    return (
      <div>
        <div className="skeleton h-6 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/jobs')} className="btn-sm btn-ghost">← Back</button>
          <span className={`badge ${job.status === 'open' ? 'badge-success' : 'badge-neutral'}`}>{job.status}</span>
        </div>
        {job.status === 'open' && (
          <button onClick={handleClose} disabled={closing} className="btn-sm btn-secondary">
            {closing ? 'Closing…' : 'Close Job'}
          </button>
        )}
        {job.status === 'closed' && (
          <button onClick={handleReopen} disabled={reopening} className="btn-sm btn-primary">
            {reopening ? 'Reopening…' : 'Reopen Job'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Info */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Job Details</h2>
            {!editing
              ? <button onClick={() => setEditing(true)} className="btn-sm btn-ghost" style={{ color: 'var(--color-accent)' }}>Edit</button>
              : <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="btn-sm btn-ghost">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="btn-sm btn-primary">{saving ? 'Saving…' : 'Save'}</button>
                </div>
            }
          </div>

          {editing ? (
            <div className="space-y-3">
              <input value={editForm.title ?? ''} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="input" placeholder="Title" />
              <input value={editForm.location ?? ''} onChange={e => setEditForm({ ...editForm, location: e.target.value })} className="input" placeholder="Location" />
              <select value={editForm.employment_type ?? ''} onChange={e => setEditForm({ ...editForm, employment_type: e.target.value as any })} className="input">
                {EMP_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
              <textarea rows={3} value={editForm.description ?? ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="input resize-none" placeholder="Description" />
              <textarea rows={3} value={editForm.requirements ?? ''} onChange={e => setEditForm({ ...editForm, requirements: e.target.value })} className="input resize-none" placeholder="Requirements" />
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{job.title}</h3>
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-neutral">{job.location}</span>
                <span className="badge badge-accent">{job.employment_type.replace('_', ' ')}</span>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-secondary)' }}>Description</p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>{job.description}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-secondary)' }}>Requirements</p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>{job.requirements}</p>
              </div>
            </div>
          )}
        </div>

        {/* Candidates */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Candidates <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>({candidates.length})</span>
            </h2>
          </div>

          <ResumeUpload onUpload={handleUpload} onBulkUpload={files => bulkUpload(files)} disabled={job.status === 'closed'} />

          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 gap-2" style={{ gridTemplateColumns: '1fr auto auto' }}>
            <input
              type="text"
              placeholder="Search by name…"
              value={candidateSearch}
              onChange={e => setCandidateSearch(e.target.value)}
              className="input text-sm min-w-0"
            />
            <select
              value={candidateStatus}
              onChange={e => setCandidateStatus(e.target.value)}
              className="input text-sm"
              style={{ width: '130px' }}
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="reviewing">Reviewing</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={scoreSort}
              onChange={e => setScoreSort(e.target.value as 'desc' | 'asc' | '')}
              className="input text-sm"
              style={{ width: '140px' }}
            >
              <option value="desc">↓ High score</option>
              <option value="asc">↑ Low score</option>
              <option value="">No sort</option>
            </select>
          </div>

          {(() => {
            let filtered = candidates
            if (candidateSearch.trim()) {
              const q = candidateSearch.toLowerCase()
              filtered = filtered.filter(c => (c.name ?? '').toLowerCase().includes(q))
            }
            if (candidateStatus) {
              filtered = filtered.filter(c => c.status === candidateStatus)
            }
            if (scoreSort === 'desc') {
              filtered = [...filtered].sort((a, b) => (b.fit_score ?? -1) - (a.fit_score ?? -1))
            } else if (scoreSort === 'asc') {
              filtered = [...filtered].sort((a, b) => (a.fit_score ?? -1) - (b.fit_score ?? -1))
            }
            return (
              <div className="mt-3 space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {loading && [...Array(3)].map((_, i) => <div key={i} className="skeleton h-14" />)}
                {!loading && candidates.length === 0 && (
                  <p className="text-sm text-center py-10" style={{ color: 'var(--color-text-secondary)' }}>
                    No candidates yet — upload a resume to start
                  </p>
                )}
                {!loading && candidates.length > 0 && filtered.length === 0 && (
                  <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-secondary)' }}>
                    No candidates match the current filters
                  </p>
                )}
                {filtered.map(c => (
                  <CandidateCard key={c.id} candidate={c} onClick={() => setSelected(c)} />
                ))}
              </div>
            )
          })()}
        </div>
      </div>

      {selected && (
        <CandidateModal
          candidate={selected}
          onClose={() => setSelected(null)}
          onUpdate={async (cid, payload) => { const u = await updateCandidate(cid, payload); setSelected(u) }}
          onDelete={async (cid) => { await removeCandidate(cid); setSelected(null) }}
        />
      )}
    </div>
  )
}
