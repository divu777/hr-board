import { useState, useRef, DragEvent } from 'react'

interface ResumeUploadProps {
  onUpload: (file: File) => Promise<void>
  onBulkUpload: (files: File[]) => Promise<void>
  disabled?: boolean
}

export default function ResumeUpload({ onUpload, onBulkUpload, disabled }: ResumeUploadProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const bulkRef = useRef<HTMLInputElement>(null)

  function validate(file: File): string | null {
    if (file.type !== 'application/pdf') return 'Only PDF files accepted'
    if (file.size > 10 * 1024 * 1024) return 'File exceeds 10 MB limit'
    return null
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError('')
    setUploading(true)
    try {
      if (files.length === 1) {
        const err = validate(files[0])
        if (err) { setError(err); return }
        await onUpload(files[0])
      } else {
        const arr = Array.from(files)
        for (const f of arr) { const e = validate(f); if (e) { setError(e); return } }
        await onBulkUpload(arr)
      }
    } catch {
      setError('Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const borderColor = dragging ? 'var(--color-accent)' : 'var(--color-border)'
  const bg = dragging ? 'var(--color-accent-light)' : 'var(--color-surface-alt)'

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className="rounded-lg border-2 border-dashed p-5 text-center transition-colors duration-150"
        style={{
          borderColor,
          backgroundColor: bg,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {uploading ? 'Uploading…' : 'Drop PDF here or click to browse'}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>PDF only · max 10 MB</p>
      </div>

      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={e => handleFiles(e.target.files)} />

      <div className="flex justify-end mt-2">
        <button
          disabled={disabled || uploading}
          onClick={() => bulkRef.current?.click()}
          className="text-xs font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: 'var(--color-accent)' }}
        >
          Bulk upload (multiple PDFs)
        </button>
      </div>

      <input ref={bulkRef} type="file" accept="application/pdf" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />

      {error && <p className="mt-2 text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  )
}
