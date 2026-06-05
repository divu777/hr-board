import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'
import type { Candidate, CandidateStatus, UploadResponse } from '../types'

export function useCandidates(jobId: string) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get<Candidate[]>(`/jobs/${jobId}/candidates`)
      setCandidates(data)
    } catch {
      setError('Failed to load candidates')
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    if (jobId) fetchCandidates()
  }, [jobId])

  const uploadResume = useCallback(async (file: File): Promise<UploadResponse> => {
    const optimisticId = `optimistic-${Date.now()}`
    const optimistic: Candidate = {
      id: optimisticId,
      job_id: jobId,
      name: null,
      email: null,
      phone: null,
      resume_filename: file.name,
      parsed_resume: null,
      fit_score: null,
      fit_reasoning: null,
      strengths: null,
      gaps: null,
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setCandidates((prev) => [optimistic, ...prev])

    const form = new FormData()
    form.append('resume', file)
    const { data } = await api.post<UploadResponse>(`/jobs/${jobId}/candidates/upload`, form)

    setCandidates((prev) =>
      prev.map((c) => (c.id === optimisticId ? { ...optimistic, id: data.candidate_id } : c))
    )
    return data
  }, [jobId])

  const bulkUpload = useCallback(async (files: File[]): Promise<void> => {
    const form = new FormData()
    files.forEach((f) => form.append('resumes', f))
    await api.post(`/jobs/${jobId}/candidates/bulk-upload`, form)
    await fetchCandidates()
  }, [jobId, fetchCandidates])

  const updateCandidate = useCallback(async (id: string, payload: { status?: CandidateStatus; name?: string; email?: string }): Promise<Candidate> => {
    const { data } = await api.put<Candidate>(`/candidates/${id}`, payload)
    setCandidates((prev) => prev.map((c) => (c.id === id ? data : c)))
    return data
  }, [])

  const removeCandidate = useCallback(async (id: string): Promise<void> => {
    await api.delete(`/candidates/${id}`)
    setCandidates((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const patchCandidate = useCallback((updated: Candidate) => {
    setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }, [])

  return { candidates, loading, error, uploadResume, bulkUpload, updateCandidate, removeCandidate, patchCandidate, refetch: fetchCandidates }
}
