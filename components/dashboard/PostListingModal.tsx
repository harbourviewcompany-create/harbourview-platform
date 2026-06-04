'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  open: boolean
  onClose: () => void
}

const LISTING_TYPES = [
  { label: 'Supply — flower / biomass',        type: 'cannabis-inventory' },
  { label: 'Supply — extracts / oil',           type: 'cannabis-inventory' },
  { label: 'Supply — genetics / seeds',         type: 'new-products' },
  { label: 'Supply — finished products',        type: 'new-products' },
  { label: 'Demand — procurement request',      type: 'wanted' },
  { label: 'Equipment — new',                   type: 'used-surplus' },
  { label: 'Equipment — distressed / surplus',  type: 'used-surplus' },
  { label: 'Consumables & inputs',              type: 'consumables' },
  { label: 'Business opportunity',              type: 'business-opportunities' },
  { label: 'Services',                          type: 'services' },
]

export function PostListingModal({ open, onClose }: Props) {
  const router = useRouter()
  const [listingType, setListingType] = useState(LISTING_TYPES[0])
  const [headline, setHeadline] = useState('')
  const [markets, setMarkets] = useState('')

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

  const handleProceed = () => {
    const params = new URLSearchParams({ type: listingType.type })
    if (headline.trim()) params.set('headline', headline.trim())
    if (markets.trim()) params.set('markets', markets.trim())
    router.push(`/marketplace/sell?${params.toString()}`)
    onClose()
  }

  const isWanted = listingType.type === 'wanted'

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(3,7,13,0.9)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-[480px] rounded-2xl p-6"
        style={{ background: 'var(--hv-bg-900, #06101B)', border: '1px solid rgba(198,165,90,0.22)' }}
      >
        <h2 className="mb-1.5 font-serif text-[18px]" style={{ color: 'var(--hv-text-primary)' }}>
          {isWanted ? 'Post wanted demand' : 'Post a listing'}
        </h2>
        <p className="mb-5 text-[12px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.5)' }}>
          {isWanted
            ? 'Describe what you need to source. Harbourview reviews before routing supply responses privately.'
            : 'Listings are reviewed by Harbourview before publication. Contact details are never public.'}
        </p>

        <div className="mb-4">
          <label className="mb-1.5 block text-[11px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>
            Type
          </label>
          <select
            value={listingType.label}
            onChange={e => setListingType(LISTING_TYPES.find(t => t.label === e.target.value) ?? LISTING_TYPES[0])}
            className="w-full rounded-lg bg-white/[0.05] px-3 py-2.5 text-[13px] outline-none"
            style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'var(--hv-text-primary)' }}
          >
            {LISTING_TYPES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
          </select>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-[11px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>
            {isWanted ? 'What do you need?' : 'Headline'}
          </label>
          <input
            type="text"
            value={headline}
            onChange={e => setHeadline(e.target.value)}
            placeholder={isWanted ? 'e.g. EU-GMP flower, 100kg/month, Germany' : 'e.g. EU-GMP certified flower, 500kg available, Canada origin'}
            className="w-full rounded-lg bg-white/[0.05] px-3 py-2.5 text-[13px] outline-none placeholder:opacity-40"
            style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'var(--hv-text-primary)' }}
          />
        </div>

        <div className="mb-6">
          <label className="mb-1.5 block text-[11px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>
            {isWanted ? 'Target supply region' : 'Target markets'}
          </label>
          <input
            type="text"
            value={markets}
            onChange={e => setMarkets(e.target.value)}
            placeholder="e.g. Germany, Netherlands, Australia"
            className="w-full rounded-lg bg-white/[0.05] px-3 py-2.5 text-[13px] outline-none placeholder:opacity-40"
            style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'var(--hv-text-primary)' }}
          />
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-[13px] transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(243,240,234,0.5)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            className="flex flex-[2] items-center justify-center rounded-xl py-2.5 text-[13px] font-semibold transition-all"
            style={{ border: '1px solid rgba(198,165,90,0.35)', background: 'rgba(198,165,90,0.12)', color: 'var(--hv-champagne-300)' }}
          >
            Continue to submission →
          </button>
        </div>
      </div>
    </div>
  )
}
