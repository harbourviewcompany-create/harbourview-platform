'use client'

import Link from 'next/link'
import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

const LISTING_TYPES = [
  'Supply — flower / biomass',
  'Supply — extracts / oil',
  'Supply — genetics / seeds',
  'Supply — finished products',
  'Demand — procurement request',
  'Equipment — new',
  'Equipment — distressed / surplus',
  'Business opportunity',
  'Services',
]

export function PostListingModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

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
          Post a listing
        </h2>
        <p className="mb-5 text-[12px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.5)' }}>
          Listings are reviewed by Harbourview before publication. A subscription is required to activate posting and be visible to counterparties.
        </p>

        <div className="mb-4">
          <label className="mb-1.5 block text-[11px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>
            Listing type
          </label>
          <select
            className="w-full rounded-lg bg-white/[0.05] px-3 py-2.5 text-[13px] outline-none"
            style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'var(--hv-text-primary)' }}
          >
            {LISTING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-[11px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>
            Headline
          </label>
          <input
            type="text"
            placeholder="e.g. EU-GMP certified flower, 500kg available, Canada origin"
            className="w-full rounded-lg bg-white/[0.05] px-3 py-2.5 text-[13px] outline-none placeholder:opacity-40"
            style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'var(--hv-text-primary)' }}
          />
        </div>

        <div className="mb-6">
          <label className="mb-1.5 block text-[11px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>
            Target markets
          </label>
          <input
            type="text"
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
          <Link
            href="/marketplace/sell"
            className="flex flex-[2] items-center justify-center rounded-xl py-2.5 text-[13px] transition-all"
            style={{ border: '1px solid rgba(198,165,90,0.35)', background: 'rgba(198,165,90,0.12)', color: 'var(--hv-champagne-300)' }}
          >
            Subscribe to post →
          </Link>
        </div>
      </div>
    </div>
  )
}
