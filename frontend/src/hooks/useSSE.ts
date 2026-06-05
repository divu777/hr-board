import { useEffect } from 'react'
import type { Candidate } from '../types'

interface SSEEvent {
  status: 'processing' | 'done' | 'failed' | 'timeout' | 'not_found'
  candidate?: Candidate
  error?: string
}

export function useSSE(candidateId: string | null, onUpdate: (candidate: Candidate) => void, onError?: (err: string) => void) {
  useEffect(() => {
    if (!candidateId) return
    const token = localStorage.getItem('token')
    if (!token) return

    const apiBase = import.meta.env.VITE_API_URL || '/api'
    const url = `${apiBase}/events/candidates/${candidateId}?token=${token}`
    const es = new EventSource(url)

    es.onmessage = (e) => {
      const data: SSEEvent = JSON.parse(e.data)
      if (data.status === 'done' && data.candidate) {
        onUpdate(data.candidate)
        es.close()
      } else if (data.status === 'failed' || data.status === 'timeout') {
        onError?.(data.error || data.status)
        es.close()
      }
    }

    es.onerror = () => {
      es.close()
    }

    return () => es.close()
  }, [candidateId])
}
