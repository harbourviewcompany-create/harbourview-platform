'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const APPROVE_ACTIONS = [
  { label: 'Approve',           status: 'approved',                      style: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20' },
  { label: 'Ready for outreach', status: 'ready_for_outreach',           style: 'border-purple-400/40 bg-purple-400/10 text-purple-400 hover:bg-purple-400/20' },
  { label: '→ Listing',         status: 'converted_to_listing',          style: 'border-teal-400/40 bg-teal-400/10 text-teal-400 hover:bg-teal-400/20' },
  { label: '→ Supplier',        status: 'converted_to_supplier',         style: 'border-teal-300/40 bg-teal-300/10 text-teal-300 hover:bg-teal-300/20' },
  { label: '→ Wanted req',      status: 'converted_to_wanted_request',   style: 'border-blue-400/40 bg-blue-400/10 text-blue-400 hover:bg-blue-400/20' },
  { label: '→ Dossier',         status: 'converted_to_dossier',          style: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20' },
]

const REJECT_ACTIONS = [
  { label: 'Reject',    status: 'rejected',   style: 'border-red-400/30 bg-red-400/5 text-red-400/70 hover:bg-red-400/15' },
  { label: 'Duplicate', status: 'duplicate',  style: 'border-white/10 bg-white/5 text-[#F5F1E8]/35 hover:text-[#F5F1E8]/60' },
  { label: 'Archive',   status: 'archived',   style: 'border-white/10 bg-white/5 text-[#F5F1E8]/30 hover:text-[#F5F1E8]/55' },
]

const ESCALATE_ACTIONS = [
  { label: 'Priority review',       status: 'priority_review',             style: 'border-red-400/40 bg-red-400/10 text-red-400 hover:bg-red-400/20' },
  { label: 'Needs source check',    status: 'needs_source_check',          style: 'border-amber-300/40 bg-amber-300/10 text-amber-300 hover:bg-amber-300/20' },
  { label: 'Needs contact enrich',  status: 'needs_contact_enrichment',    style: 'border-sky-400/40 bg-sky-400/10 text-sky-400 hover:bg-sky-400/20' },
  { label: 'Needs compliance',      status: 'needs_compliance_review',     style: 'border-orange-400/40 bg-orange-400/10 text-orange-400 hover:bg-orange-400/20' },
]

const TERMINAL_STATUSES = new Set([
  'rejected','duplicate','archived',
  'converted_to_listing','converted_to_supplier',
  'converted_to_wanted_request','converted_to_dossier',
  'outreach_sent',
])

export function SignalCandidateActions({
  candidateId,
  currentStatus,
}: {
  candidateId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  if (TERMINAL_STATUSES.has(currentStatus)) return null

  async function advance(status: string) {
    setError(null)
    const res = await fetch(`/api/admin/intelligence/signal-candidates/${candidateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to update candidate')
      return
    }
    startTransition(() => router.refresh())
  }

  return (
    <div className="flex flex-col gap-1.5 items-end">
      {/* Primary approve actions */}
      {APPROVE_ACTIONS.slice(0, expanded ? undefined : 2).map(a => (
        <button
          key={a.status}
          onClick={() => advance(a.status)}
          disabled={isPending}
          className={`rounded-xl border px-3 py-1.5 text-[11px] font-medium transition disabled:opacity-50 ${a.style}`}
        >
          {isPending ? '…' : a.label}
        </button>
      ))}

      {/* Expand/collapse for more actions */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="text-[10px] text-[#F5F1E8]/35 hover:text-[#F5F1E8]/60 transition"
      >
        {expanded ? '↑ fewer' : '↓ more actions'}
      </button>

      {expanded && (
        <>
          <div className="h-px w-full bg-white/10 my-1" />
          {/* Escalate actions */}
          {ESCALATE_ACTIONS.map(a => (
            <button
              key={a.status}
              onClick={() => advance(a.status)}
              disabled={isPending}
              className={`rounded-xl border px-3 py-1.5 text-[11px] font-medium transition disabled:opacity-50 ${a.style}`}
            >
              {isPending ? '…' : a.label}
            </button>
          ))}
          <div className="h-px w-full bg-white/10 my-1" />
          {/* Reject actions */}
          {REJECT_ACTIONS.map(a => (
            <button
              key={a.status}
              onClick={() => advance(a.status)}
              disabled={isPending}
              className={`rounded-xl border px-3 py-1.5 text-[11px] font-medium transition disabled:opacity-50 ${a.style}`}
            >
              {isPending ? '…' : a.label}
            </button>
          ))}
        </>
      )}

      {error && <p className="text-[10px] text-red-400 text-right max-w-[160px]">{error}</p>}
    </div>
  )
}
