import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      login(data.access_token)
      navigate('/jobs')
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>Gappeo</span>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Recruiter platform</p>
        </div>

        <div className="card p-8">
          <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Welcome back</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>Sign in to your account</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required className="input" placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required className="input" placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-md btn-primary w-full mt-2">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
            No account?{' '}
            <Link to="/register" className="font-medium hover:underline" style={{ color: 'var(--color-accent)' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
