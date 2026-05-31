'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type ReviewStatus = 'pending' | 'reviewed' | 'needs_action' | 'archived'

const ACTIONS: Partial<Record<ReviewStatus, { label: string; next: ReviewStatus; style: string }[]>> = {
  pending: [
    { label: 'Mark reviewed', next: 'reviewed',     style: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20' },
    { label: 'Needs action',  next: 'needs_action', style: 'border-red-400/40 bg-red-400/10 text-red-400 hover:bg-red-400/20' },
  ],
  reviewed: [
    { label: 'Archive', next: 'archived', style: 'border-white/10 bg-white/5 text-[#F5F1E8]/40 hover:text-[#F5F1E8]/70' },
  ],
  needs_action: [
    { label: 'Mark reviewed', next: 'reviewed', style: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20' },
    { label: 'Archive',       next: 'archived', style: 'border-white/10 bg-white/5 text-[#F5F1E8]/40 hover:text-[#F5F1E8]/70' },
  ],
}

export function EvidenceReviewActions({
  evidenceId,
  currentStatus,
}: {
  evidenceId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const actions = ACTIONS[currentStatus as ReviewStatus] ?? []
  if (!actions.length || currentStatus === 'archived') return null

  async function updateStatus(next: ReviewStatus) {
    setError(null)
    const res = await fetch(`/api/admin/intelligence/evidence/${evidenceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewStatus: next }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to update evidence status')
      return
    }
    startTransition(() => router.refresh())
  }

  return (
    <div className="flex gap-1.5 items-center flex-shrink-0">
      {actions.map(action => (
        <button
          key={action.next}
          onClick={() => updateStatus(action.next)}
          disabled={isPending}
          className={`rounded-lg border px-2 py-1 text-[10px] font-medium transition disabled:opacity-50 ${action.style}`}
        >
          {isPending ? '…' : action.label}
        </button>
      ))}
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  )
}
