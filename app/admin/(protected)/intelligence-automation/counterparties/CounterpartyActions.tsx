'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const ROLES = [
  'buyer', 'seller', 'importer', 'distributor', 'supplier', 'consultant',
  'equipment_vendor', 'packaging_supplier', 'logistics_provider', 'market_access_partner',
]

export function AddCounterpartyForm() {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    role: 'buyer',
    markets: '',
    categories: '',
    needsProfile: '',
    supplyProfile: '',
    notes: '',
  })

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  async function submit() {
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.markets.trim()) { setError('At least one market is required'); return }
    if (!form.categories.trim()) { setError('At least one category is required'); return }

    setError(null)
    setSubmitting(true)
    const res = await fetch('/api/admin/intelligence/counterparties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        role: form.role,
        markets: form.markets.split(',').map((m) => m.trim()).filter(Boolean),
        categories: form.categories.split(',').map((c) => c.trim()).filter(Boolean),
        needsProfile: form.needsProfile || undefined,
        supplyProfile: form.supplyProfile || undefined,
        notes: form.notes || undefined,
      }),
    })
    setSubmitting(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to add counterparty')
      return
    }

    setForm({ name: '', role: 'buyer', markets: '', categories: '', needsProfile: '', supplyProfile: '', notes: '' })
    setOpen(false)
    startTransition(() => router.refresh())
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-[#C6A55A]/40 bg-[#C6A55A]/10 px-4 py-2.5 text-sm font-medium text-[#C6A55A] transition hover:bg-[#C6A55A]/20"
      >
        + Add counterparty
      </button>
    )
  }

  const inputClass = 'w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-[#F5F1E8] placeholder-[#F5F1E8]/30 focus:border-[#C6A55A]/40 focus:outline-none'

  return (
    <div className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Add counterparty</p>
        <button onClick={() => setOpen(false)} className="text-[#F5F1E8]/40 hover:text-[#F5F1E8]/70 text-sm">✕</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]/70">Name *</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Rheingold Medical GmbH" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]/70">Role</label>
          <select value={form.role} onChange={(e) => update('role', e.target.value)} className={inputClass}>
            {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]/70">Markets * (comma-separated)</label>
          <input value={form.markets} onChange={(e) => update('markets', e.target.value)} placeholder="e.g. Germany, Australia" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]/70">Categories * (comma-separated)</label>
          <input value={form.categories} onChange={(e) => update('categories', e.target.value)} placeholder="e.g. cannabis inventory, genetics" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]/70">Needs profile</label>
          <input value={form.needsProfile} onChange={(e) => update('needsProfile', e.target.value)} placeholder="What they\'re looking to buy" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]/70">Supply profile</label>
          <input value={form.supplyProfile} onChange={(e) => update('supplyProfile', e.target.value)} placeholder="What they have to offer" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]/70">Notes</label>
          <input value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Optional context" className={inputClass} />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={submit}
          disabled={submitting}
          className="rounded-xl bg-[#C6A55A] px-5 py-2.5 text-sm font-medium text-[#081423] transition hover:bg-[#D8BC73] disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add counterparty'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-[#F5F1E8]/50 transition hover:text-[#F5F1E8]/80"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export function LogInteractionButton({ id, currentCount }: { id: string; currentCount: number }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)

  async function logInteraction() {
    setSubmitting(true)
    const res = await fetch(`/api/admin/intelligence/counterparties/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentInteractionCount: currentCount }),
    })
    setSubmitting(false)
    if (res.ok) startTransition(() => router.refresh())
  }

  return (
    <button
      onClick={logInteraction}
      disabled={submitting}
      className="mt-1 text-[10px] uppercase tracking-[0.1em] text-[#C6A55A]/70 transition hover:text-[#C6A55A] disabled:opacity-50"
    >
      {submitting ? 'Logging…' : '+ Log contact'}
    </button>
  )
}

const DOC_STATUSES = ['complete', 'partial', 'missing'] as const
type DocStatus = (typeof DOC_STATUSES)[number]

const docSelectColors: Record<DocStatus, string> = {
  complete: 'text-emerald-400 border-emerald-400/30',
  partial:  'text-amber-400 border-amber-400/30',
  missing:  'text-red-400 border-red-400/30',
}

export function DocStatusSelect({ id, status }: { id: string; status: DocStatus }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)
  const [value, setValue] = useState(status)

  async function updateStatus(next: DocStatus) {
    setValue(next)
    setSubmitting(true)
    const res = await fetch(`/api/admin/intelligence/counterparties/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentationStatus: next }),
    })
    setSubmitting(false)
    if (res.ok) {
      startTransition(() => router.refresh())
    } else {
      setValue(status)
    }
  }

  return (
    <select
      value={value}
      disabled={submitting}
      onChange={(e) => updateStatus(e.target.value as DocStatus)}
      className={`rounded-lg border bg-black/30 px-2 py-1 text-xs font-semibold uppercase tracking-[0.1em] disabled:opacity-50 ${docSelectColors[value]}`}
    >
      {DOC_STATUSES.map((s) => <option key={s} value={s} className="bg-[#0B1A2F] text-[#F5F1E8]">{s}</option>)}
    </select>
  )
}
