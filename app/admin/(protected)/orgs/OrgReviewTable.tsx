'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export type PendingOrgRow = {
  queue_id: string
  org_id: string
  priority: string
  created_at: string
  legal_name: string
  trade_name: string | null
  org_type: string
  jurisdiction_country: string
  verification_status: string
}

export default function OrgReviewTable({ rows }: { rows: PendingOrgRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [actingOn, setActingOn] = useState<string | null>(null)
  const [errorFor, setErrorFor] = useState<Record<string, string>>({})

  const act = (row: PendingOrgRow, verification_status: 'verified' | 'revoked') => {
    setActingOn(row.queue_id)
    setErrorFor(prev => ({ ...prev, [row.queue_id]: '' }))
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/verify-org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ org_id: row.org_id, verification_status, queue_id: row.queue_id }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          setErrorFor(prev => ({ ...prev, [row.queue_id]: json?.error || 'Action failed.' }))
          return
        }
        router.refresh()
      } catch {
        setErrorFor(prev => ({ ...prev, [row.queue_id]: 'Network error — please try again.' }))
      } finally {
        setActingOn(null)
      }
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F]">
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead className="bg-black/25 text-xs uppercase tracking-[0.18em] text-[#C6A55A]">
          <tr>
            <th className="p-4">Organization</th>
            <th className="p-4">Type</th>
            <th className="p-4">Jurisdiction</th>
            <th className="p-4">Priority</th>
            <th className="p-4">Created</th>
            <th className="p-4">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.length ? rows.map(row => (
            <tr key={row.queue_id} className="align-top text-[#F5F1E8]/75">
              <td className="p-4">
                <div className="font-medium text-[#F5F1E8]">{row.trade_name || row.legal_name}</div>
                {row.trade_name && <div className="mt-1 text-xs text-[#F5F1E8]/45">{row.legal_name}</div>}
              </td>
              <td className="p-4">{row.org_type}</td>
              <td className="p-4">{row.jurisdiction_country}</td>
              <td className="p-4">{row.priority}</td>
              <td className="p-4">{row.created_at}</td>
              <td className="p-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => act(row, 'verified')}
                    disabled={isPending && actingOn === row.queue_id}
                    className="rounded-full bg-[#C6A55A] px-3 py-1.5 text-xs font-semibold text-[#081423] disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => act(row, 'revoked')}
                    disabled={isPending && actingOn === row.queue_id}
                    className="rounded-full border border-red-300/40 px-3 py-1.5 text-xs font-semibold text-red-100 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
                {errorFor[row.queue_id] && (
                  <div className="mt-2 text-xs text-red-300">{errorFor[row.queue_id]}</div>
                )}
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={6} className="p-8 text-center text-[#F5F1E8]/55">No organizations pending verification.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
