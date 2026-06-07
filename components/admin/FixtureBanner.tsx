'use client'

interface Props {
  isFixture: boolean
  label?: string
}

export function FixtureBanner({ isFixture, label }: Props) {
  if (!isFixture) return null
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium"
      style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
    >
      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
      {label ?? 'Fixture data — DB table empty or service role key not configured'}
    </div>
  )
}
