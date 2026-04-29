'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ListingCard } from '@/components/marketplace/ListingCard'
import { InquiryForm } from '@/components/marketplace/InquiryForm'
import { MarketplaceDisclaimer } from '@/components/marketplace/MarketplaceDisclaimer'
import { MarketplaceEmptyState } from '@/components/marketplace/MarketplaceEmptyState'
import type { PublicListing } from '@/lib/marketplace/redact'

interface ListingPageClientProps {
  title: string
  description: string
  category: string
  emptyMessage?: string
}

const GOLD = '#C6A55A'
const MUTED = '#C9C2B3'
const REQUEST_TIMEOUT_MS = 4500

async function fetchWithTimeout(url: string) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    window.clearTimeout(timeoutId)
  }
}

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
      const res = await fetchWithTimeout(`/api/marketplace/listings?category=${encodeURIComponent(category)}&limit=24`)
      const data = await res.json()
      if (data.configured === false) setConfigured(false)
      setListings(data.listings ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setConfigured(false)
      setListings([])
      setTotal(0)
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
            {total} public listing{total !== 1 ? 's' : ''} displayed
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
        <MarketplaceEmptyState
          eyebrow="Checking current listings"
          title="Reviewing public listings for this category."
          description="If no reviewed inventory is available, this page will show a controlled empty state rather than implying unverified supply."
          actions={[
            { href: '/marketplace/submit-listing', label: 'Submit a Listing', variant: 'primary' },
            { href: '/marketplace/submit-wanted', label: 'Post a Wanted Request' },
          ]}
        />
      ) : !configured ? (
        <MarketplaceEmptyState
          eyebrow="Marketplace data unavailable"
          title="This section is not displaying public listings right now."
          description="Harbourview can still review relevant supply, surplus assets or buyer requirements through intake. No inventory is being invented or publicly listed until it has been reviewed."
          actions={[
            { href: '/marketplace/submit-listing', label: 'Submit a Listing', variant: 'primary' },
            { href: '/marketplace/submit-wanted', label: 'Post a Wanted Request' },
          ]}
        />
      ) : listings.length === 0 ? (
        <MarketplaceEmptyState
          title={`No public ${title.toLowerCase()} listings are currently displayed.`}
          description={emptyMessage ?? 'This category is open for reviewed submissions. Submit a relevant listing or post a wanted request so Harbourview can assess fit before any introduction is made.'}
          actions={[
            { href: '/marketplace/submit-listing', label: 'Submit a Listing', variant: 'primary' },
            { href: '/marketplace/submit-wanted', label: 'Post a Wanted Request' },
          ]}
        />
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
