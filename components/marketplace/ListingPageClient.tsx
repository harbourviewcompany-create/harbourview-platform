'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ListingCard } from '@/components/marketplace/ListingCard'
import { InquiryForm } from '@/components/marketplace/InquiryForm'
import { MarketplaceDisclaimer } from '@/components/marketplace/MarketplaceDisclaimer'
import type { PublicListing } from '@/lib/marketplace/redact'

interface ListingPageClientProps {
  title: string
  description: string
  category: string
  emptyMessage?: string
}

const GOLD = '#C6A55A'
const MUTED = '#C9C2B3'

export function ListingPageClient({
  title,
  description,
  category,
  emptyMessage,
}: ListingPageClientProps) {
  const [listings, setListings] = useState<PublicListing[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(true)
  const [inquiryListingId, setInquiryListingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/marketplace/listings?category=${encodeURIComponent(category)}&limit=24`)
      const data = await res.json()
      if (data.configured === false) setConfigured(false)
      setListings(data.listings ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setListings([])
    } finally {
      setLoading(false)
    }
  }, [category])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  return (
    <>
      <div style={{ marginBottom: '40px' }}>
        <Link
          href="/marketplace"
          style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', color: GOLD, textDecoration: 'none', opacity: 0.8 }}
        >
          ← Marketplace
        </Link>
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(26px, 3.5vw, 40px)',
            fontWeight: 600,
            color: '#F5F1E8',
            margin: '16px 0 12px',
          }}
        >
          {title}
        </h1>
        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '15px', color: MUTED, lineHeight: '1.7', maxWidth: '600px', margin: '0 0 8px' }}>
          {description}
        </p>
        {!loading && configured && (
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', color: MUTED, opacity: 0.5 }}>
            {total} listing{total !== 1 ? 's' : ''} available
          </p>
        )}
      </div>

      <MarketplaceDisclaimer />

      {/* Inquiry modal */}
      {inquiryListingId && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setInquiryListingId(null) }}
        >
          <div
            style={{
              backgroundColor: '#0B1A2F',
              border: '1px solid rgba(198,165,90,0.2)',
              borderRadius: '4px',
              padding: '32px',
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', color: '#F5F1E8', margin: '0 0 24px' }}>
              Submit Inquiry
            </h2>
            <InquiryForm
              listingId={inquiryListingId}
              onSuccess={() => setInquiryListingId(null)}
              onCancel={() => setInquiryListingId(null)}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: MUTED, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px' }}>
          Loading listings…
        </div>
      ) : !configured ? (
        <div
          style={{
            backgroundColor: 'rgba(198,165,90,0.05)',
            border: '1px solid rgba(198,165,90,0.15)',
            borderRadius: '3px',
            padding: '48px 32px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: '#F5F1E8', marginBottom: '12px' }}>
            Marketplace Launching Soon
          </p>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', color: MUTED, lineHeight: '1.7', maxWidth: '480px', margin: '0 auto 24px' }}>
            This marketplace section is being activated. In the meantime, submit your listing or
            wanted request directly through Harbourview intake.
          </p>
          <Link href="/intake" style={{ display: 'inline-block', padding: '10px 22px', backgroundColor: GOLD, color: '#0B1A2F', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', fontWeight: 600, textDecoration: 'none', borderRadius: '2px' }}>
            Submit via Intake
          </Link>
        </div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', color: MUTED }}>
            {emptyMessage ?? 'No listings in this category yet. Check back soon or submit your own.'}
          </p>
          <Link href="/marketplace/submit-listing" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 22px', border: `1px solid ${GOLD}`, color: GOLD, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', textDecoration: 'none', borderRadius: '2px' }}>
            Submit a Listing
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onInquire={setInquiryListingId} />
          ))}
        </div>
      )}
    </>
  )
}
