'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function DecisionButtons({ kind, id }: { kind: 'professionals' | 'suppliers'; id: string }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [pending, setPending] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function decide(action: 'approve' | 'reject') {
    setPending(action)
    setError(null)
    const res = await fetch(`/api/admin/applications/${kind}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setPending(null)
    if (res.ok) {
      startTransition(() => router.refresh())
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Request failed')
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-2">
        <button
          onClick={() => decide('approve')}
          disabled={pending !== null}
          className="rounded-lg border border-emerald-400/35 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-50"
        >
          {pending === 'approve' ? 'Approving…' : 'Approve'}
        </button>
        <button
          onClick={() => decide('reject')}
          disabled={pending !== null}
          className="rounded-lg border border-red-400/35 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-400/20 disabled:opacity-50"
        >
          {pending === 'reject' ? 'Rejecting…' : 'Reject'}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  )
}
