'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const OUTCOME_TYPES = [
  'intro_sent','intro_proposed','in_discussion','qualified','docs_received',
  'docs_requested','reviewed','buyer_passed','seller_passed','unresponsive',
  'weak_fit','dormant','valuable_relationship','converted_to_opportunity',
  'needs_future_follow_up','won','lost','ignored',
]

export function LogFeedbackForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    outcomeType:      'reviewed',
    counterpartyName: '',
    market:           '',
    category:         'cannabis inventory',
    scoreImpact:      'neutral' as 'positive' | 'negative' | 'neutral',
    routingImpact:    '',
    notes:            '',
  })

  function update(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError(null)
    setSuccess(false)
  }

  async function submit() {
    if (!form.market.trim()) { setError('Market is required'); return }
    if (!form.routingImpact.trim()) { setError('Routing impact description is required'); return }

    setError(null)
    const res = await fetch('/api/admin/intelligence/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outcomeType:      form.outcomeType,
        counterpartyName: form.counterpartyName || undefined,
        market:           form.market,
        category:         form.category,
        scoreImpact:      form.scoreImpact,
        routingImpact:    form.routingImpact,
        notes:            form.notes || undefined,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to log feedback')
      return
    }

    setSuccess(true)
    setForm({
      outcomeType: 'reviewed', counterpartyName: '', market: '',
      category: 'cannabis inventory', scoreImpact: 'neutral',
      routingImpact: '', notes: '',
    })
    setOpen(false)
    startTransition(() => router.refresh())
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-[#C6A55A]/40 bg-[#C6A55A]/10 px-4 py-2.5 text-sm font-medium text-[#C6A55A] transition hover:bg-[#C6A55A]/20"
      >
        + Log feedback event
      </button>
    )
  }

  const inputClass = 'w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-[#F5F1E8] placeholder-[#F5F1E8]/30 focus:border-[#C6A55A]/40 focus:outline-none'

  return (
    <div className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Log feedback event</p>
        <button onClick={() => setOpen(false)} className="text-[#F5F1E8]/40 hover:text-[#F5F1E8]/70 text-sm">✕</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]/70">Outcome type</label>
          <select value={form.outcomeType} onChange={e => update('outcomeType', e.target.value)} className={inputClass}>
            {OUTCOME_TYPES.map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]/70">Score impact</label>
          <select
            value={form.scoreImpact}
            onChange={e => update('scoreImpact', e.target.value as 'positive' | 'negative' | 'neutral')}
            className={inputClass}
          >
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]/70">Counterparty name</label>
          <input
            value={form.counterpartyName}
            onChange={e => update('counterpartyName', e.target.value)}
            placeholder="Optional — e.g. Rheingold Medical GmbH"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]/70">Market *</label>
          <input
            value={form.market}
            onChange={e => update('market', e.target.value)}
            placeholder="e.g. Germany"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]/70">Category</label>
          <input
            value={form.category}
            onChange={e => update('category', e.target.value)}
            placeholder="e.g. cannabis inventory"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]/70">Notes</label>
          <input
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            placeholder="Optional additional context"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]/70">Routing impact *</label>
          <input
            value={form.routingImpact}
            onChange={e => update('routingImpact', e.target.value)}
            placeholder="Describe the routing or scoring change this event triggers"
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">Feedback logged successfully.</p>}

      <div className="flex gap-3">
        <button
          onClick={submit}
          disabled={isPending}
          className="rounded-xl bg-[#C6A55A] px-5 py-2.5 text-sm font-medium text-[#081423] transition hover:bg-[#D8BC73] disabled:opacity-50"
        >
          {isPending ? 'Logging…' : 'Log event'}
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
