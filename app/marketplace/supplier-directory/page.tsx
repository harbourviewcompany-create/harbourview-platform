'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { MarketplaceDisclaimer } from '@/components/marketplace/MarketplaceDisclaimer'
import type { PublicSupplierProfile } from '@/lib/marketplace/redact'

const GOLD = '#C6A55A'
const MUTED = '#C9C2B3'

function SupplierCard({ supplier }: { supplier: PublicSupplierProfile }) {
  return (
    <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(198,165,90,0.15)', borderRadius: '3px', padding: '24px' }}>
      <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#F5F1E8', margin: '0 0 8px' }}>
        {supplier.company_display_name ?? 'Verified Supplier'}
      </h3>
      <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: MUTED, margin: '0 0 12px' }}>📍 {supplier.region}</p>
      {supplier.brief_description && (
        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', lineHeight: '1.6', color: MUTED, margin: '0 0 12px' }}>
          {supplier.brief_description}
        </p>
      )}
      {supplier.certifications && supplier.certifications.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {supplier.certifications.map((cert) => (
            <span key={cert} style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: GOLD, backgroundColor: 'rgba(198,165,90,0.1)', padding: '2px 7px', borderRadius: '2px' }}>
              {cert}
            </span>
          ))}
        </div>
      )}
      <Link href="/intake" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', fontWeight: 600, color: GOLD, textDecoration: 'none', letterSpacing: '0.04em' }}>
        Inquire via Harbourview →
      </Link>
    </div>
  )
}

export default function SupplierDirectoryPage() {
  const [suppliers, setSuppliers] = useState<PublicSupplierProfile[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/marketplace/supplier-directory?limit=30')
      const data = await res.json()
      setSuppliers(data.suppliers ?? [])
    } catch { setSuppliers([]) }
    finally { setLoading(false) }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  return (
    <>
      <div style={{ marginBottom: '40px' }}>
        <Link href="/marketplace" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', color: GOLD, textDecoration: 'none', opacity: 0.8 }}>← Marketplace</Link>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 600, color: '#F5F1E8', margin: '16px 0 12px' }}>
          Supplier Directory
        </h1>
        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '15px', color: MUTED, lineHeight: '1.7', maxWidth: '600px', margin: 0 }}>
          Verified suppliers, manufacturers and service providers across regulated markets.
          All supplier introductions are facilitated by Harbourview.
        </p>
      </div>
      <MarketplaceDisclaimer />
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: MUTED, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px' }}>Loading directory…</div>
      ) : suppliers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', color: MUTED }}>Supplier profiles coming soon. Contact Harbourview to discuss supplier sourcing.</p>
          <Link href="/contact" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 22px', border: `1px solid ${GOLD}`, color: GOLD, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', textDecoration: 'none', borderRadius: '2px' }}>Contact Us</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {suppliers.map((s) => <SupplierCard key={s.id} supplier={s} />)}
        </div>
      )}
    </>
  )
}
