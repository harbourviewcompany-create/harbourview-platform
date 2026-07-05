'use client'

import { useState, useTransition } from 'react'
import { updateUserTier } from './actions'

const TIERS = [
  { value: 'free', label: 'Free' },
  { value: 'intel', label: 'Intel (paid)' },
  { value: 'operator', label: 'Operator' },
]

export function TierSelect({ userId, currentTier }: { userId: string; currentTier: string }) {
  const [tier, setTier] = useState(currentTier)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  function handleChange(next: string) {
    const previous = tier
    setTier(next)
    setStatus('idle')
    startTransition(async () => {
      const result = await updateUserTier(userId, next)
      if (result.ok) {
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 2000)
      } else {
        setTier(previous)
        setStatus('error')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={tier}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-xs font-medium text-[#F5F1E8] outline-none transition focus:border-[#C6A55A]/60 disabled:opacity-50"
      >
        {TIERS.map((t) => (
          <option key={t.value} value={t.value} className="bg-[#0B1A2F]">
            {t.label}
          </option>
        ))}
      </select>
      {isPending && <span className="text-[10px] text-[#F5F1E8]/40">saving…</span>}
      {status === 'saved' && <span className="text-[10px] text-emerald-400">saved</span>}
      {status === 'error' && <span className="text-[10px] text-red-400">failed</span>}
    </div>
  )
}
