'use client'

import { useState } from 'react'

type Verdict = 'helpful' | 'not_helpful' | 'stale'

export function SignalFeedbackButtons({
  signalId,
  surface = 'digest',
}: {
  signalId: string
  surface?: 'digest' | 'signals' | 'search'
}) {
  const [sent, setSent] = useState<Verdict | null>(null)
  const [busy, setBusy] = useState(false)

  async function send(verdict: Verdict) {
    if (busy || sent) return
    setBusy(true)
    try {
      const res = await fetch('/api/signals/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalId, verdict, surface }),
      })
      if (res.ok) setSent(verdict)
    } catch {
      /* silent — feedback must never break the feed */
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <span style={{ fontSize: 10, color: 'rgba(198,165,90,0.7)' }}>
        {sent === 'helpful' ? 'Thanks — noted as useful' : 'Thanks — we’ll improve from this'}
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
      <button
        type="button"
        disabled={busy}
        onClick={() => void send('helpful')}
        title="This is useful for my work"
        style={btnStyle}
      >
        Useful
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => void send('not_helpful')}
        title="Not relevant or low quality"
        style={btnStyle}
      >
        Not useful
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => void send('stale')}
        title="Already known or outdated"
        style={btnStyle}
      >
        Stale
      </button>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'rgba(243,240,234,0.55)',
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 999,
  padding: '3px 8px',
  cursor: 'pointer',
}
