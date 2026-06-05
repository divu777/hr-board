import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../api/client'
import type { Job, JobCreate, JobUpdate, JobStatus } from '../types'

interface JobFilters {
  status?: JobStatus | ''
  search?: string
  page?: number
  skip?: boolean  // set true when hook used only for actions, not listing
}

export function useJobs(filters: JobFilters = {}) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const fetchJobs = useCallback(async (f: JobFilters) => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number> = { page: f.page || 1 }
      if (f.status) params.status = f.status
      if (f.search) params.search = f.search
      const { data } = await api.get<Job[]>('/jobs', { params })
      setJobs(data)
    } catch {
      setError('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (filters.skip) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchJobs(filters), filters.search !== undefined ? 300 : 0)
    return () => clearTimeout(debounceRef.current)
  }, [filters.status, filters.search, filters.page, filters.skip])

  const createJob = useCallback(async (payload: JobCreate): Promise<Job> => {
    const { data } = await api.post<Job>('/jobs', payload)
    setJobs((prev) => [data, ...prev])
    return data
  }, [])

  const updateJob = useCallback(async (id: string, payload: JobUpdate): Promise<Job> => {
    const { data } = await api.put<Job>(`/jobs/${id}`, payload)
    setJobs((prev) => prev.map((j) => (j.id === id ? data : j)))
    return data
  }, [])

  const closeJob = useCallback(async (id: string): Promise<Job> => {
    const { data } = await api.patch<Job>(`/jobs/${id}/close`)
    setJobs((prev) => prev.map((j) => (j.id === id ? data : j)))
    return data
  }, [])

  const reopenJob = useCallback(async (id: string): Promise<Job> => {
    const { data } = await api.patch<Job>(`/jobs/${id}/reopen`)
    setJobs((prev) => prev.map((j) => (j.id === id ? data : j)))
    return data
  }, [])

  const refetch = useCallback(() => fetchJobs(filters), [filters])

  return { jobs, loading, error, createJob, updateJob, closeJob, reopenJob, refetch }
}
