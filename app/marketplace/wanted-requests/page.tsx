'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { WantedCard } from '@/components/marketplace/WantedCard'
import { InquiryForm } from '@/components/marketplace/InquiryForm'
import { MarketplaceDisclaimer } from '@/components/marketplace/MarketplaceDisclaimer'
import { MarketplaceEmptyState } from '@/components/marketplace/MarketplaceEmptyState'
import type { PublicBuyerRequest } from '@/lib/marketplace/redact'

const GOLD = '#C6A55A'
const MUTED = '#C9C2B3'

export default function WantedRequestsPage() {
  const [requests, setRequests] = useState<PublicBuyerRequest[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(true)
  const [inquiryRequestId, setInquiryRequestId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/marketplace/wanted?limit=24')
      const data = await res.json()
      if (data.configured === false) setConfigured(false)
      setRequests(data.requests ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setConfigured(false)
      setRequests([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  return (
    <>
      <div style={{ marginBottom: '40px' }}>
        <Link href="/marketplace" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', color: GOLD, textDecoration: 'none', opacity: 0.8 }}>
          ← Marketplace
        </Link>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 600, color: '#F5F1E8', margin: '16px 0 12px' }}>
          Wanted Requests
        </h1>
        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '15px', color: MUTED, lineHeight: '1.7', maxWidth: '600px', margin: '0 0 8px' }}>
          Active buyer and importer requirements. If you can supply what they need, contact Harbourview.
        </p>
        {!loading && configured && (
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', color: MUTED, opacity: 0.5 }}>
            {total} public wanted request{total !== 1 ? 's' : ''} displayed
          </p>
        )}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Link href="/marketplace/submit-wanted" style={{ display: 'inline-block', padding: '10px 22px', backgroundColor: GOLD, color: '#0B1A2F', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', fontWeight: 600, textDecoration: 'none', borderRadius: '2px' }}>
          Post a Wanted Request
        </Link>
      </div>

      <MarketplaceDisclaimer />

      {inquiryRequestId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setInquiryRequestId(null) }}>
          <div style={{ backgroundColor: '#0B1A2F', border: '1px solid rgba(198,165,90,0.2)', borderRadius: '4px', padding: '32px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', color: '#F5F1E8', margin: '0 0 24px' }}>Contact Harbourview</h2>
            <InquiryForm buyerRequestId={inquiryRequestId} onSuccess={() => setInquiryRequestId(null)} onCancel={() => setInquiryRequestId(null)} />
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: MUTED, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px' }}>Loading wanted requests…</div>
      ) : !configured ? (
        <MarketplaceEmptyState
          eyebrow="Marketplace data unavailable"
          title="Wanted requests are not displaying publicly right now."
          description="Harbourview can still review buyer requirements through the wanted request flow. Public requests are only displayed after review."
          actions={[{ href: '/marketplace/submit-wanted', label: 'Post a Wanted Request', variant: 'primary' }]}
        />
      ) : requests.length === 0 ? (
        <MarketplaceEmptyState
          title="No public wanted requests are currently displayed."
          description="Post a wanted request and Harbourview will review the requirement before making it visible or using it to source credible counterparties."
          actions={[{ href: '/marketplace/submit-wanted', label: 'Post a Wanted Request', variant: 'primary' }]}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {requests.map((r) => <WantedCard key={r.id} request={r} onInquire={setInquiryRequestId} />)}
        </div>
      )}
    </>
  )
}
