'use client'

import { FormEvent, useMemo, useState } from 'react'
import type { MarketCardModel } from './marketTypes'

type Props = {
  listings: MarketCardModel[]
  savedIds: Set<string>
  onToggleSaved: (id: string) => void
  onClearCompare: () => void
  onOpen: (id: string) => void
}

export function MarketplaceSelectionBar({ listings, savedIds, onToggleSaved, onClearCompare, onOpen }: Props) {
  const [showSaved, setShowSaved] = useState(false)
  const [showRfq, setShowRfq] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rfqStatus, setRfqStatus] = useState<string | null>(null)
  const saved = useMemo(() => listings.filter(item => savedIds.has(item.id)), [listings, savedIds])
  const selectedTitles = useMemo(() => listings.map(item => item.title), [listings])

  if (!listings.length && !saved.length) return null

  async function submitRfq(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setRfqStatus('Submitting…')
    const data = new FormData(event.currentTarget)
    data.set('listing_type', 'Wanted Request')
    data.set('listing_type_key', 'wanted_request')
    data.set('category_key', 'wanted_requests')
    data.set('title', String(data.get('title') || 'Marketplace RFQ'))
    data.set('message', [
      String(data.get('requirements') || '').trim(),
      `Shortlisted marketplace items: ${selectedTitles.join(' | ')}`,
      `Requested quantity: ${String(data.get('quantity') || '').trim()}`,
      `Target market: ${String(data.get('target_market') || '').trim()}`,
      `Required by: ${String(data.get('required_by') || '').trim()}`,
    ].filter(Boolean).join('\n'))

    try {
      const response = await fetch('/api/marketplace/submit', { method: 'POST', body: data })
      const result = (await response.json().catch(() => null)) as { message?: string; error?: string } | null
      setRfqStatus(response.ok
        ? result?.message ?? 'RFQ received. Harbourview will review the requirement before routing it to eligible parties.'
        : result?.error ?? 'RFQ submission failed. Please try again.')
      if (response.ok) event.currentTarget.reset()
    } catch {
      setRfqStatus('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="hvm2-selection-bar" aria-label="Marketplace workspace tools">
      <div className="hvm2-selection-actions">
        <button type="button" className="hvm2-selection-button" onClick={() => setShowSaved(value => !value)} aria-expanded={showSaved}>
          Saved <span>{saved.length}</span>
        </button>
        {listings.length ? (
          <button type="button" className="hvm2-selection-button hvm2-selection-button--active" onClick={() => setShowSaved(false)}>
            Compare <span>{listings.length}/3</span>
          </button>
        ) : null}
        {listings.length ? (
          <button type="button" className="hvm2-selection-button" onClick={() => { setShowSaved(false); setRfqStatus(null); setShowRfq(value => !value) }} aria-expanded={showRfq}>
            Request quotes
          </button>
        ) : null}
        {listings.length ? (
          <button type="button" className="hvm2-selection-clear" onClick={onClearCompare}>Clear compare</button>
        ) : null}
      </div>

      {showRfq ? (
        <div className="hvm2-selection-panel">
          <div>
            <strong>Request quotes</strong>
            <span>This creates a private wanted request from the selected catalogue/listing shortlist. No supplier is contacted automatically.</span>
          </div>
          <form onSubmit={submitRfq} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-xs uppercase tracking-[0.16em] opacity-60">RFQ title</span>
              <input name="title" required minLength={3} placeholder="e.g. Commercial packaging RFQ" className="mt-1 w-full rounded-xl border border-[#C6A55A]/20 bg-[#061322] px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] opacity-60">Quantity / volume</span>
              <input name="quantity" placeholder="e.g. 50,000 units" className="mt-1 w-full rounded-xl border border-[#C6A55A]/20 bg-[#061322] px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] opacity-60">Target market</span>
              <input name="target_market" placeholder="Country / region" className="mt-1 w-full rounded-xl border border-[#C6A55A]/20 bg-[#061322] px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] opacity-60">Required by</span>
              <input name="required_by" type="date" className="mt-1 w-full rounded-xl border border-[#C6A55A]/20 bg-[#061322] px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] opacity-60">Budget / price basis</span>
              <input name="price_or_budget" placeholder="Optional" className="mt-1 w-full rounded-xl border border-[#C6A55A]/20 bg-[#061322] px-3 py-2 text-sm" />
            </label>
            <label className="sm:col-span-2">
              <span className="text-xs uppercase tracking-[0.16em] opacity-60">Requirements</span>
              <textarea name="requirements" required rows={4} placeholder="Specs, certifications, delivery terms, jurisdiction constraints, or other requirements" className="mt-1 w-full rounded-xl border border-[#C6A55A]/20 bg-[#061322] px-3 py-2 text-sm" />
            </label>
            <div className="sm:col-span-2 rounded-xl border border-[#C6A55A]/10 bg-[#061322]/50 p-3 text-xs opacity-70">
              <strong>Shortlist:</strong> {selectedTitles.join(' · ')}
            </div>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={isSubmitting} className="rounded-full bg-[#C6A55A] px-5 py-2.5 text-sm font-semibold text-[#061322] disabled:opacity-50">
                {isSubmitting ? 'Submitting…' : 'Submit RFQ'}
              </button>
              <button type="button" onClick={() => setShowRfq(false)} className="rounded-full border border-[#C6A55A]/25 px-5 py-2.5 text-sm opacity-80">Cancel</button>
              {rfqStatus ? <span role="status" className="text-sm opacity-80">{rfqStatus}</span> : null}
            </div>
          </form>
        </div>
      ) : null}

      {showSaved ? (
        <div className="hvm2-selection-panel">
          <div>
            <strong>Saved procurement list</strong>
            <span>Stored on this device; no supplier or availability claims are created.</span>
          </div>
          {saved.length ? (
            <div className="hvm2-selection-list">
              {saved.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-3">
                  <button type="button" onClick={() => onOpen(item.id)} className="min-w-0 text-left">
                    <span className="block truncate">{item.title}</span>
                    <small>{item.category} · {item.priceDisplay}</small>
                  </button>
                  <button type="button" onClick={() => onToggleSaved(item.id)} className="shrink-0 text-xs opacity-60 hover:opacity-100" aria-label={`Remove ${item.title} from saved list`}>Remove</button>
                </div>
              ))}
            </div>
          ) : (
            <p>No saved items yet. Use Save on a listing to keep a shortlist.</p>
          )}
        </div>
      ) : listings.length ? (
        <div className="hvm2-selection-panel">
          <div>
            <strong>Compare selected listings</strong>
            <span>Select up to three listings to compare the commercial basics.</span>
          </div>
          <div className="hvm2-compare-grid">
            {listings.map(item => (
              <button key={item.id} type="button" onClick={() => onOpen(item.id)}>
                <strong>{item.title}</strong>
                <span>{item.category}</span>
                <span>{item.country || 'Jurisdiction not specified'}</span>
                <span>{item.priceDisplay}</span>
                <span>{item.badge || item.condition || 'Status not specified'}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
