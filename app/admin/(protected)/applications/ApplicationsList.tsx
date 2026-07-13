'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { PendingProfessional, PendingSupplierProfile } from '@/lib/admin/applicationsQuery'

function fmt(d: string) {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(d))
}

function BioText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const maxChars = 200
  if (text.length <= maxChars) {
    return <p className="mt-2 max-w-xl text-xs leading-5 text-[#F5F1E8]/55">{text}</p>
  }
  return (
    <p className="mt-2 max-w-xl text-xs leading-5 text-[#F5F1E8]/55">
      {expanded ? text : `${text.slice(0, maxChars)}…`}{' '}
      <button
        onClick={() => setExpanded(v => !v)}
        className="text-[#C6A55A]/80 underline underline-offset-2 hover:text-[#C6A55A]"
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </p>
  )
}

function DecisionZone({ kind, id }: { kind: 'professionals' | 'suppliers'; id: string }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function decide(action: 'approve' | 'reject') {
    setPending(true)
    setError(null)
    const res = await fetch(`/api/admin/applications/${kind}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setPending(false)
    if (res.ok) {
      startTransition(() => router.refresh())
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Request failed')
      setConfirmAction(null)
    }
  }

  if (confirmAction) {
    return (
      <div className="flex min-w-[190px] flex-col items-end gap-2">
        <p className="text-right text-xs text-[#F5F1E8]/70">
          {confirmAction === 'approve' ? 'Approve' : 'Reject'} this application?
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirmAction(null)}
            disabled={pending}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-[#F5F1E8]/55 transition hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => decide(confirmAction)}
            disabled={pending}
            className={
              confirmAction === 'approve'
                ? 'rounded-lg border border-emerald-400/35 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-50'
                : 'rounded-lg border border-red-400/35 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-400/20 disabled:opacity-50'
            }
          >
            {pending
              ? confirmAction === 'approve' ? 'Approving…' : 'Rejecting…'
              : confirmAction === 'approve' ? 'Confirm approval' : 'Confirm rejection'}
          </button>
        </div>
        {error && <p className="text-[11px] text-red-400">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex min-w-[120px] flex-col items-end gap-1.5">
      <div className="flex gap-2">
        <button
          onClick={() => setConfirmAction('approve')}
          className="rounded-lg border border-emerald-400/35 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
        >
          Approve
        </button>
        <button
          onClick={() => setConfirmAction('reject')}
          className="rounded-lg border border-red-400/35 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-400/20"
        >
          Reject
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  )
}

export function ApplicationsList({
  professionals,
  suppliers,
}: {
  professionals: PendingProfessional[]
  suppliers: PendingSupplierProfile[]
}) {
  const [credFilter, setCredFilter] = useState('all')
  const [sellerFilter, setSellerFilter] = useState('all')

  const credTypes = [...new Set(professionals.map(p => p.credential_type))].sort()
  const sellerTypes = [...new Set(suppliers.map(s => s.seller_type))].sort()

  const filteredPros = credFilter === 'all' ? professionals : professionals.filter(p => p.credential_type === credFilter)
  const filteredSups = sellerFilter === 'all' ? suppliers : suppliers.filter(s => s.seller_type === sellerFilter)

  return (
    <div className="space-y-10">
      {/* Professionals */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#F5F1E8]/70">
            Professionals ({filteredPros.length}{credFilter !== 'all' ? ` of ${professionals.length}` : ''} pending)
          </h3>
          {credTypes.length > 1 && (
            <select
              value={credFilter}
              onChange={e => setCredFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-[#F5F1E8]/70 focus:outline-none"
            >
              <option value="all">All credentials</option>
              {credTypes.map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          )}
        </div>
        {filteredPros.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-[#F5F1E8]/45">
            No pending professional applications{credFilter !== 'all' ? ' for this credential type' : ''}.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredPros.map(p => (
              <div key={p.id} className="flex items-start justify-between gap-4 rounded-xl border border-[#C6A55A]/20 bg-[#0B1A2F] p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#F5F1E8]">
                    {p.full_name}{p.title ? `, ${p.title}` : ''}
                    <span className="ml-2 text-xs capitalize text-[#C6A55A]/80">
                      {p.credential_type.replace(/_/g, ' ')}
                    </span>
                  </p>
                  {p.institution && (
                    <p className="mt-0.5 text-xs text-[#F5F1E8]/45">
                      {p.institution}{p.institution_country ? ` · ${p.institution_country}` : ''}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-[#F5F1E8]/45">
                    Markets: {p.countries.join(', ') || '—'}
                  </p>
                  {p.specialties.length > 0 && (
                    <p className="mt-1 text-xs text-[#F5F1E8]/45">Specialties: {p.specialties.join(', ')}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {p.languages.length > 0 && (
                      <span className="text-[10px] text-[#F5F1E8]/35">
                        Languages: {p.languages.join(', ')}
                      </span>
                    )}
                    {p.accepts_referrals && (
                      <span className="rounded-full border border-emerald-400/25 px-2 py-0.5 text-[10px] text-emerald-400/70">
                        Accepts referrals
                      </span>
                    )}
                    {p.consultation_available && (
                      <span className="rounded-full border border-[#C6A55A]/25 px-2 py-0.5 text-[10px] text-[#C6A55A]/70">
                        Consultation available
                      </span>
                    )}
                  </div>
                  {p.bio_public && <BioText text={p.bio_public} />}
                  <p className="mt-2 text-[10px] text-[#F5F1E8]/30">Submitted {fmt(p.created_at)}</p>
                </div>
                <DecisionZone kind="professionals" id={p.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suppliers */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#F5F1E8]/70">
            Suppliers ({filteredSups.length}{sellerFilter !== 'all' ? ` of ${suppliers.length}` : ''} pending)
          </h3>
          {sellerTypes.length > 1 && (
            <select
              value={sellerFilter}
              onChange={e => setSellerFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-[#F5F1E8]/70 focus:outline-none"
            >
              <option value="all">All seller types</option>
              {sellerTypes.map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          )}
        </div>
        {filteredSups.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-[#F5F1E8]/45">
            No pending supplier applications{sellerFilter !== 'all' ? ' for this seller type' : ''}.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredSups.map(s => (
              <div key={s.id} className="flex items-start justify-between gap-4 rounded-xl border border-[#C6A55A]/20 bg-[#0B1A2F] p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#F5F1E8]">
                    {s.company_name ?? 'Unnamed company'}
                    <span className="ml-2 text-xs capitalize text-[#C6A55A]/80">
                      {s.seller_type.replace(/_/g, ' ')}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#F5F1E8]/45">
                    {s.contact_name ?? 'No contact name'}
                    {s.contact_email ? ` · ${s.contact_email}` : ''}
                    {s.capabilities?.hq_country ? ` · HQ: ${s.capabilities.hq_country}` : ''}
                    {s.capabilities?.regions_served?.length ? ` · Serves: ${s.capabilities.regions_served.join(', ')}` : ''}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.categories.map((c: string) => (
                      <span
                        key={c}
                        className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-[#F5F1E8]/55"
                      >
                        {c.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                  {s.description && <BioText text={s.description} />}
                  <p className="mt-2 text-[10px] text-[#F5F1E8]/30">Submitted {fmt(s.created_at)}</p>
                </div>
                <DecisionZone kind="suppliers" id={s.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
