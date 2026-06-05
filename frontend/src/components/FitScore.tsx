interface FitScoreProps {
  score: number
  reasoning: string
  strengths: string[]
  gaps: string[]
}

function scoreStyle(score: number) {
  if (score >= 70) return { stroke: '#16a34a', textColor: 'var(--color-success)', bg: 'var(--color-success-bg)' }
  if (score >= 40) return { stroke: '#ca8a04', textColor: 'var(--color-warning)', bg: 'var(--color-warning-bg)' }
  return { stroke: '#dc2626', textColor: 'var(--color-danger)', bg: 'var(--color-danger-bg)' }
}

export default function FitScore({ score, reasoning, strengths, gaps }: FitScoreProps) {
  const { stroke, textColor, bg } = scoreStyle(score)
  const r = 22
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ

  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: bg, borderColor: 'var(--color-border)' }}>
      <div className="flex items-center gap-4">
        <svg width="60" height="60" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r={r} fill="none" stroke="var(--color-border)" strokeWidth="5" />
          <circle
            cx="30" cy="30" r={r} fill="none"
            stroke={stroke} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 30 30)"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div>
          <p className="text-2xl font-bold leading-none" style={{ color: textColor }}>
            {score}<span className="text-sm font-normal" style={{ color: 'var(--color-text-secondary)' }}>/100</span>
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Fit Score</p>
        </div>
      </div>

      <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{reasoning}</p>

      {strengths.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Strengths</p>
          <div className="flex flex-wrap gap-1.5">
            {strengths.map(s => <span key={s} className="badge badge-success">{s}</span>)}
          </div>
        </div>
      )}

      {gaps.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Gaps</p>
          <div className="flex flex-wrap gap-1.5">
            {gaps.map(g => <span key={g} className="badge badge-warning">{g}</span>)}
          </div>
        </div>
      )}
    </div>
  )
}
