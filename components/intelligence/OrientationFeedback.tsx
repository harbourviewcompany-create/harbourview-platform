'use client'

import { useState } from 'react'

type Surface =
  | 'corridor_plan'
  | 'corridor_coverage'
  | 'landed_cost'
  | 'logistics_simulator'
  | 'briefing'
  | 'other'

/**
 * Lightweight orientation feedback — no new tables.
 * Posts to /api/orientation-feedback → marketplace_inquiries.
 */
export function OrientationFeedback({
  surface,
  context,
}: {
  surface: Surface
  context?: string
}) {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(verdict: 'helpful' | 'incomplete' | 'wrong') {
    if (busy || sent) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/orientation-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surface, verdict, context: context ?? null }),
      })
      if (!res.ok) throw new Error('failed')
      setSent(true)
    } catch {
      setError('Could not record feedback. Try again later.')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <p className="text-xs text-amber-500/80">Thanks — this helps prioritise playbook and data work.</p>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">Was this orientation useful?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void send('helpful')}
          className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] uppercase tracking-wide text-zinc-300 hover:border-amber-600/50"
        >
          Useful
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void send('incomplete')}
          className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] uppercase tracking-wide text-zinc-300 hover:border-amber-600/50"
        >
          Incomplete
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void send('wrong')}
          className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] uppercase tracking-wide text-zinc-300 hover:border-amber-600/50"
        >
          Inaccurate
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
