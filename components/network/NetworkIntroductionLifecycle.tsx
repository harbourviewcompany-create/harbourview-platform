'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { NetworkCommandDTO } from '@/lib/network/types'
import type { NetworkIntroductionStatus } from '@/lib/network/introductionStatus'

type LifecycleItem = {
  id: string
  candidateName: string
  status: string
}

type ManagementState = {
  id: string
  candidateName: string
  status: NetworkIntroductionStatus
  allowedTransitions: NetworkIntroductionStatus[]
  transitionAuthority: 'member' | 'staff'
}

function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

export default function NetworkIntroductionLifecycle() {
  const [items, setItems] = useState<LifecycleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [management, setManagement] = useState<ManagementState | null>(null)
  const [outcome, setOutcome] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/network/command', { cache: 'no-store' })
      const payload = await response.json() as { command?: NetworkCommandDTO; error?: string }
      if (!response.ok || !payload.command) throw new Error(payload.error || 'Introduction lifecycle is unavailable.')

      const deduped = new Map<string, LifecycleItem>()
      for (const candidate of payload.command.candidates) {
        const id = candidate.introduction.introductionId
        const status = candidate.introduction.status
        if (!id || !status) continue
        deduped.set(id, { id, candidateName: candidate.name, status })
      }
      setItems([...deduped.values()])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Introduction lifecycle is unavailable.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const activeItems = useMemo(
    () => items.filter(item => !['converted', 'declined', 'expired', 'closed'].includes(item.status)),
    [items],
  )

  async function openManagement(item: LifecycleItem) {
    setBusy(`load:${item.id}`)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(`/api/network/introduction-requests/${item.id}`, { cache: 'no-store' })
      const payload = await response.json() as {
        introduction?: { id: string; status: NetworkIntroductionStatus }
        allowedTransitions?: NetworkIntroductionStatus[]
        transitionAuthority?: 'member' | 'staff'
        error?: string
      }
      if (!response.ok || !payload.introduction || !payload.allowedTransitions || !payload.transitionAuthority) {
        throw new Error(payload.error || 'Introduction permissions are unavailable.')
      }
      setManagement({
        id: item.id,
        candidateName: item.candidateName,
        status: payload.introduction.status,
        allowedTransitions: payload.allowedTransitions,
        transitionAuthority: payload.transitionAuthority,
      })
      setOutcome('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Introduction permissions are unavailable.')
    } finally {
      setBusy(null)
    }
  }

  async function advance(toStatus: NetworkIntroductionStatus) {
    if (!management) return
    setBusy(`advance:${management.id}`)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(`/api/network/introduction-requests/${management.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          toStatus,
          outcome: outcome.trim() || null,
          detail: { surface: 'network_command_lifecycle' },
        }),
      })
      const payload = await response.json() as { introduction?: { status: string }; error?: string }
      if (!response.ok || !payload.introduction) throw new Error(payload.error || 'Introduction advancement failed.')
      setSuccess(`Introduction advanced to ${humanize(payload.introduction.status)}.`)
      setManagement(null)
      setOutcome('')
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Introduction advancement failed.')
    } finally {
      setBusy(null)
    }
  }

  if (loading && items.length === 0) return null
  if (activeItems.length === 0 && !error && !success) return null

  return (
    <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5" aria-labelledby="network-introduction-lifecycle-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--hv-gold)]/80">Controlled introductions</p>
          <h3 id="network-introduction-lifecycle-heading" className="mt-1 text-base font-semibold text-white">Lifecycle management</h3>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-white/55">Available transitions are resolved for the signed-in member or authorized staff actor and are enforced again by the database.</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 disabled:opacity-50">{loading ? 'Refreshing…' : 'Refresh'}</button>
      </div>

      {(error || success) && <div className="mt-3 text-sm" aria-live="polite">{error && <p className="text-red-300">{error}</p>}{success && <p className="text-emerald-300">{success}</p>}</div>}

      {activeItems.length > 0 && (
        <div className="mt-4 space-y-2">
          {activeItems.map(item => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-black/10 px-3 py-3">
              <div>
                <strong className="block text-sm text-white/90">{item.candidateName}</strong>
                <span className="text-xs text-white/50">Introduction · {humanize(item.status)}</span>
              </div>
              <button type="button" onClick={() => void openManagement(item)} disabled={busy === `load:${item.id}`} className="rounded-lg border border-[color:var(--hv-gold)]/30 px-3 py-2 text-xs font-semibold text-[color:var(--hv-gold)] disabled:opacity-50">{busy === `load:${item.id}` ? 'Checking…' : 'Manage'}</button>
            </div>
          ))}
        </div>
      )}

      {management && (
        <div className="mt-4 rounded-xl border border-[color:var(--hv-gold)]/20 bg-black/20 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <strong className="text-sm text-white">{management.candidateName}</strong>
              <p className="mt-1 text-xs text-white/55">Current: {humanize(management.status)} · {humanize(management.transitionAuthority)} authority</p>
            </div>
            <button type="button" onClick={() => setManagement(null)} className="text-xs text-white/50">Close</button>
          </div>
          {management.allowedTransitions.length > 0 ? (
            <>
              <label className="mt-4 block text-xs font-medium text-white/65">Outcome / note
                <input value={outcome} onChange={event => setOutcome(event.target.value)} maxLength={1000} className="mt-1 block w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none" placeholder="Optional lifecycle outcome" />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {management.allowedTransitions.map(status => (
                  <button key={status} type="button" onClick={() => void advance(status)} disabled={busy === `advance:${management.id}`} className="rounded-lg bg-[color:var(--hv-gold)] px-3 py-2 text-xs font-semibold text-[#07111F] disabled:opacity-50">Advance to {humanize(status)}</button>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-3 text-xs text-white/55">No further transition is available for this actor and lifecycle state.</p>
          )}
        </div>
      )}
    </section>
  )
}
