import type { Metadata } from 'next'
import Link from 'next/link'
import { MARKETPLACE_CATEGORIES } from '@/lib/marketplace/categories'
import { MarketplaceDisclaimer } from '@/components/marketplace/MarketplaceDisclaimer'

export const metadata: Metadata = {
  title: 'Marketplace',
  description:
    'Harbourview Marketplace — curated cannabis listings, wanted requests, supplier profiles and business opportunities across regulated global markets.',
}

const GOLD = '#C6A55A'
const MUTED = '#C9C2B3'

export default function MarketplacePage() {
  return (
    <>
      {/* Hero */}
      <div style={{ marginBottom: '48px' }}>
        <p
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: GOLD,
            marginBottom: '12px',
          }}
        >
          Harbourview Marketplace
        </p>
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 600,
            color: '#F5F1E8',
            margin: '0 0 20px',
            lineHeight: 1.2,
          }}
        >
          Controlled introductions across regulated cannabis markets.
        </h1>
        <p
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '16px',
            lineHeight: '1.7',
            color: MUTED,
            maxWidth: '640px',
            margin: '0 0 32px',
          }}
        >
          Harbourview curates listings, buyer requests, and supplier profiles across regulated
          jurisdictions. All inquiries are received by Harbourview. Counterparty identities are
          only disclosed following mutual screening and consent.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Link
            href="/marketplace/submit-listing"
            style={{
              display: 'inline-block',
              padding: '11px 24px',
              backgroundColor: GOLD,
              color: '#0B1A2F',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: '2px',
            }}
          >
            Submit a Listing
          </Link>
          <Link
            href="/marketplace/submit-wanted"
            style={{
              display: 'inline-block',
              padding: '11px 24px',
              backgroundColor: 'transparent',
              border: `1px solid ${GOLD}`,
              color: GOLD,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: '2px',
            }}
          >
            Post a Wanted Request
          </Link>
        </div>
      </div>

      <MarketplaceDisclaimer />

      {/* Category grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {MARKETPLACE_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.href}
            style={{ textDecoration: 'none' }}
          >
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(198,165,90,0.15)',
                borderRadius: '3px',
                padding: '28px',
                height: '100%',
                transition: 'border-color 0.2s, background-color 0.2s',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '14px' }}>
                {cat.icon}
              </span>
              <h2
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#F5F1E8',
                  margin: '0 0 10px',
                }}
              >
                {cat.label}
              </h2>
              <p
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: MUTED,
                  margin: 0,
                }}
              >
                {cat.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
