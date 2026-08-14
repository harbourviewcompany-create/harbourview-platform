'use client'

import { useEffect, useState } from 'react'
import { useListingDetail, type ListingDetail } from '@/hooks/useListingDetail'
import { StatusBadge } from './StatusBadge'
import { QuoteModal } from './QuoteModal'

interface Props {
  listingId: string | null
  onClose: () => void
  onRequestAccess?: (listingId: string) => void
  onWatch?: (listingId: string) => void
  onOpenDealRoom?: (roomId: string) => void
}

function formatTitle(input: string): string {
  return input
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(part => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatPrice(amount: number | null, currency: string, display: string | null): string | null {
  if (display) return display
  if (amount == null) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(amount)
}

export function ListingDetailModal({ listingId, onClose, onRequestAccess, onWatch, onOpenDealRoom }: Props) {
  const detail = useListingDetail(listingId)
  const [dealRoomState, setDealRoomState] = useState<'idle' | 'creating' | 'error'>('idle')

  async function handleOpenDealRoom(d: ListingDetail) {
    if (dealRoomState === 'creating') return
    setDealRoomState('creating')
    try {
      const res = await fetch('/api/marketplace/deal-rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: d.id, listingTitle: d.title }),
      })
      if (!res.ok) throw new Error('failed')
      const json = await res.json() as { roomId: string }
      setDealRoomState('idle')
      onOpenDealRoom?.(json.roomId)
    } catch {
      setDealRoomState('error')
    }
  }
  const [watchState, setWatchState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [quoteOpen, setQuoteOpen] = useState(false)

  useEffect(() => {
    if (!listingId) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [listingId, onClose])

  useEffect(() => {
    setWatchState('idle')
  }, [listingId])

  async function handleWatch(d: ListingDetail) {
    if (watchState === 'saving' || watchState === 'saved') return
    setWatchState('saving')
    try {
      const res = await fetch('/api/watchlist/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: 'marketplace_item',
          title: d.title,
          subtitle: formatTitle(d.subcategory ?? d.product_type ?? d.category),
          jurisdiction: d.location_region ?? d.location_country ?? d.region,
          ref_id: d.id,
        }),
      })
      if (res.status === 401) { window.location.href = '/sign-in'; return }
      if (!res.ok) throw new Error('watch failed')
      setWatchState('saved')
      onWatch?.(d.id)
    } catch {
      setWatchState('error')
    }
  }

  if (!listingId) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(3,7,13,0.9)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-[620px] max-h-[640px] overflow-y-auto rounded-2xl mx-4"
        style={{ background: 'var(--hv-bg-900, #06101B)', border: '1px solid rgba(198,165,90,0.22)' }}
      >
        {/* Head */}
        <div
          className="sticky top-0 px-5 py-5"
          style={{ background: 'var(--hv-bg-900)', borderBottom: '1px solid rgba(198,165,90,0.18)' }}
        >
          <button
            onClick={onClose}
            className="float-right text-lg transition-opacity hover:opacity-60"
            style={{ color: 'rgba(243,240,234,0.4)' }}
            aria-label="Close"
          >✕</button>
          <p className="mb-1 text-[9px] uppercase tracking-[0.18em]" style={{ color: 'var(--hv-champagne-400)' }}>
            Marketplace listing · Harbourview
          </p>
          {detail.status === 'ok' && (
            <h2 className="font-serif text-[24px] leading-tight" style={{ color: 'var(--hv-text-primary)' }}>
              {detail.data.title}
            </h2>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3.5 p-5">
          {(detail.status === 'idle' || detail.status === 'loading') && (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 animate-pulse rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
              ))}
            </div>
          )}

          {detail.status === 'ok' && (() => {
            const d = detail.data
            const isVerified = d.seller_type === 'verified_seller' || d.seller_type === 'licensed_operator'
            const price = formatPrice(d.price_amount, d.price_currency, d.price_display)
            const location = d.location_region ?? d.location_country ?? d.region

            return (
              <>
                {/* Status grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Category',     value: formatTitle(d.subcategory ?? d.product_type ?? d.category) },
                    { label: 'Jurisdiction', value: location },
                    { label: 'Verification', value: isVerified ? 'Verified' : 'Pending Review' },
                    { label: 'Price',        value: price ?? 'On request' },
                    ...(Number(d.average_rating) > 0 && Number(d.review_count) > 0
                      ? [{ label: 'Rating', value: `★ ${Number(d.average_rating).toFixed(1)} (${Number(d.review_count)})` }]
                      : []),
                  ].map(({ label, value }) => value && (
                    <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <p className="mb-1 text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>{label}</p>
                      <StatusBadge label={value} />
                    </div>
                  ))}
                </div>

                {/* Description */}
                {d.description && (
                  <div
                    className="rounded-xl border-l-2 p-3.5 text-[12px] leading-relaxed"
                    style={{ background: 'rgba(255,255,255,0.025)', borderLeftColor: 'rgba(198,165,90,0.3)', color: 'rgba(243,240,234,0.6)' }}
                  >
                    {d.description}
                  </div>
                )}

                {/* Specs */}
                {Object.keys(d.high_level_specs ?? {}).length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(d.high_level_specs)
                      .filter(([, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
                      .slice(0, 6)
                      .map(([k, v]) => (
                        <div key={k} className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <p className="text-[9px] uppercase tracking-[0.08em]" style={{ color: 'rgba(243,240,234,0.4)' }}>{formatTitle(k)}</p>
                          <p className="text-[12px]" style={{ color: 'rgba(243,240,234,0.75)' }}>{String(v)}</p>
                        </div>
                      ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-1 flex gap-2">
                  <button
                    onClick={() => setQuoteOpen(true)}
                    className="flex-1 rounded-xl py-2.5 text-center text-[12px] transition-all"
                    style={{ border: '1px solid rgba(198,165,90,0.3)', background: 'rgba(198,165,90,0.1)', color: 'var(--hv-champagne-300)' }}
                  >
                    Request access →
                  </button>
                  <button
                    onClick={() => handleWatch(d)}
                    disabled={watchState === 'saving' || watchState === 'saved'}
                    className="flex-1 rounded-xl py-2.5 text-center text-[12px] transition-all disabled:opacity-60"
                    style={{ border: '1px solid rgba(198,165,90,0.3)', background: 'rgba(198,165,90,0.1)', color: 'var(--hv-champagne-300)' }}
                  >
                    {watchState === 'saving' ? 'Watching…' : watchState === 'saved' ? 'Watching ✓' : watchState === 'error' ? 'Retry watch' : 'Watch →'}
                  </button>
                  <button
                    onClick={() => handleOpenDealRoom(d)}
                    disabled={dealRoomState === 'creating'}
                    className="flex-1 rounded-xl py-2.5 text-center text-[12px] transition-all disabled:opacity-60"
                    style={{ border: '1px solid rgba(198,165,90,0.3)', background: 'rgba(198,165,90,0.1)', color: 'var(--hv-champagne-300)' }}
                  >
                    {dealRoomState === 'creating' ? 'Opening…' : dealRoomState === 'error' ? 'Retry deal room' : 'Open deal room →'}
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded-xl px-4 py-2.5 text-[12px] transition-all"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(243,240,234,0.45)' }}
                  >
                    Close
                  </button>
                </div>
              </>
            )
          })()}

          {detail.status === 'error' && (
            <p className="text-[12px]" style={{ color: 'rgba(243,240,234,0.4)' }}>
              This listing is no longer available or has been removed.
            </p>
          )}
        </div>
      </div>
      <QuoteModal
        open={quoteOpen}
        listingTitle={detail.status === 'ok' ? detail.data.title : undefined}
        onClose={() => setQuoteOpen(false)}
        zIndex={210}
      />
    </div>
  )
}
