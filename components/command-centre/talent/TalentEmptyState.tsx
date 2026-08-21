'use client'

import { useState } from 'react'

interface TalentEmptyStateProps {
  jurisdiction?: string | null
  onClearFilters: () => void
}

export function TalentEmptyState({
  jurisdiction,
  onClearFilters,
}: TalentEmptyStateProps) {
  const [alertState, setAlertState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [alertMsg, setAlertMsg] = useState<string | null>(null)

  async function handleSetAlert() {
    setAlertState('loading')
    setAlertMsg(null)
    try {
      const res = await fetch('/api/talent/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: jurisdiction ? `Roles in ${jurisdiction}` : 'All open roles',
          jurisdictions: jurisdiction ? [jurisdiction] : [],
          frequency: 'daily',
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.status === 401) {
        setAlertState('error')
        setAlertMsg('Sign in to set a talent alert.')
        return
      }
      if (!res.ok) {
        throw new Error(body.error ?? 'Could not create alert')
      }
      setAlertState('done')
      setAlertMsg('Alert saved. We will notify you when matching roles appear.')
    } catch (e: any) {
      setAlertState('error')
      setAlertMsg(e?.message ?? 'Could not create alert')
    }
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-[#12181f] p-6 text-center">
      <p className="text-white/80 font-medium mb-2">
        No open roles
        {jurisdiction ? ` in ${jurisdiction}` : ''} right now
      </p>
      <p className="text-sm text-white/45 mb-5 leading-relaxed">
        Talent opportunities are reviewed and filtered to the active
        jurisdiction. Try broadening filters or set an alert for when new
        roles appear.
      </p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onClearFilters}
          className="rounded-xl border border-white/15 text-white/80 py-2.5 text-sm hover:bg-white/5"
        >
          Clear filters
        </button>
        <button
          type="button"
          disabled={alertState === 'loading' || alertState === 'done'}
          onClick={handleSetAlert}
          className="rounded-xl bg-amber-600/90 hover:bg-amber-500 disabled:opacity-50 text-black font-medium py-2.5 text-sm"
        >
          {alertState === 'done'
            ? 'Alert set'
            : alertState === 'loading'
              ? 'Saving…'
              : 'Set alert'}
        </button>
        {alertMsg && (
          <p
            className={`text-xs mt-1 ${
              alertState === 'error' ? 'text-red-300' : 'text-white/50'
            }`}
          >
            {alertMsg}
          </p>
        )}
      </div>
    </div>
  )
}
