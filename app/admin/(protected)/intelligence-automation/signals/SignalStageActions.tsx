'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type SignalStage =
  | 'new'
  | 'needs_review'
  | 'qualified'
  | 'converted_to_opportunity'
  | 'linked_to_counterparty'
  | 'linked_to_market_pathway'
  | 'archived'

const NEXT_STAGE: Partial<Record<SignalStage, SignalStage>> = {
  new:              'needs_review',
  needs_review:     'qualified',
  qualified:        'converted_to_opportunity',
}

const NEXT_LABEL: Partial<Record<SignalStage, string>> = {
  new:              'Mark needs review',
  needs_review:     'Qualify',
  qualified:        'Convert to opportunity',
}

export function SignalStageActions({
  signalId,
  currentStage,
}: {
  signalId: string
  currentStage: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const stage = currentStage as SignalStage
  const nextStage = NEXT_STAGE[stage]
  const nextLabel = NEXT_LABEL[stage]

  async function advance(targetStage: SignalStage) {
    setError(null)
    const res = await fetch(`/api/admin/intelligence/signals/${signalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: targetStage }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to update signal stage')
      return
    }
    startTransition(() => router.refresh())
  }

  async function archive() {
    setError(null)
    const res = await fetch(`/api/admin/intelligence/signals/${signalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'archived' }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to archive signal')
      return
    }
    startTransition(() => router.refresh())
  }

  if (stage === 'archived' || stage === 'converted_to_opportunity' || stage === 'linked_to_counterparty' || stage === 'linked_to_market_pathway') {
    return null
  }

  return (
    <div className="flex flex-col gap-1.5 items-end">
      {nextStage && nextLabel && (
        <button
          onClick={() => advance(nextStage)}
          disabled={isPending}
          className="rounded-xl border border-[#C6A55A]/40 bg-[#C6A55A]/10 px-3 py-1.5 text-xs font-medium text-[#C6A55A] transition hover:bg-[#C6A55A]/20 disabled:opacity-50"
        >
          {isPending ? '…' : nextLabel}
        </button>
      )}
      <button
        onClick={archive}
        disabled={isPending}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#F5F1E8]/40 transition hover:text-[#F5F1E8]/70 disabled:opacity-50"
      >
        Archive
      </button>
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  )
}
