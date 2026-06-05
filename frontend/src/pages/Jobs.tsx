import { useState, FormEvent } from 'react'
import { useJobs } from '../hooks/useJobs'
import JobCard from '../components/JobCard'
import type { JobCreate, JobStatus } from '../types'

const EMP_TYPES = ['full_time', 'part_time', 'contract', 'remote'] as const

export default function Jobs() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<JobStatus | ''>('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<JobCreate>({ title: '', description: '', requirements: '', location: '', employment_type: 'full_time' })
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  const { jobs, loading, error, createJob } = useJobs({ search, status: status || undefined })

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      await createJob(form)
      setShowCreate(false)
      setForm({ title: '', description: '', requirements: '', location: '', employment_type: 'full_time' })
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || 'Failed to create job')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Job Openings</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{jobs.length} position{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-md btn-primary">
          + New Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text" placeholder="Search by title…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="input max-w-xs"
        />
        <select
          value={status} onChange={e => setStatus(e.target.value as JobStatus | '')}
          className="input w-auto"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* States */}
      {error && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-40" />)}
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="text-center py-24" style={{ color: 'var(--color-text-secondary)' }}>
          <p className="text-3xl mb-3">📋</p>
          <p className="font-medium">No jobs yet</p>
          <p className="text-sm mt-1">Create your first opening above</p>
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map(job => <JobCard key={job.id} job={job} />)}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl p-6" style={{ backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>New Job Opening</h2>
              <button onClick={() => setShowCreate(false)} className="btn-sm btn-ghost text-lg">×</button>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid #fecaca' }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              {[
                { label: 'Job Title', key: 'title', placeholder: 'e.g. Senior Backend Engineer' },
                { label: 'Location', key: 'location', placeholder: 'e.g. Remote / New York' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>{label}</label>
                  <input required value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="input" placeholder={placeholder} />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Employment Type</label>
                <select value={form.employment_type} onChange={e => setForm({ ...form, employment_type: e.target.value as any })} className="input">
                  {EMP_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>

              {[
                { label: 'Description', key: 'description', placeholder: 'What will this person do?' },
                { label: 'Requirements', key: 'requirements', placeholder: 'Skills, years of experience, etc.' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>{label}</label>
                  <textarea required rows={3} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="input resize-none" placeholder={placeholder} />
                </div>
              ))}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-md btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={creating} className="btn-md btn-primary flex-1">{creating ? 'Creating…' : 'Create Job'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
