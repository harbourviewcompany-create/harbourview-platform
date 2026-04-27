import type { PublicListing } from '@/lib/marketplace/redact'

interface ListingCardProps {
  listing: PublicListing
  onInquire?: (listingId: string) => void
}

const GOLD = '#C6A55A'
const MUTED = '#C9C2B3'
const DARK = '#0B1A2F'
const CARD_BG = 'rgba(255,255,255,0.03)'
const BORDER = 'rgba(198,165,90,0.15)'

export function ListingCard({ listing, onInquire }: ListingCardProps) {
  return (
    <div
      style={{
        backgroundColor: CARD_BG,
        border: `1px solid ${BORDER}`,
        borderRadius: '3px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Category badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: GOLD,
            backgroundColor: 'rgba(198,165,90,0.1)',
            padding: '3px 8px',
            borderRadius: '2px',
          }}
        >
          {listing.category.replace(/-/g, ' ')}
        </span>
        <span
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '11px',
            color: MUTED,
            opacity: 0.7,
          }}
        >
          {listing.seller_type}
        </span>
      </div>

      {/* Product type */}
      <h3
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '18px',
          fontWeight: 600,
          color: '#F5F1E8',
          margin: 0,
        }}
      >
        {listing.product_type}
      </h3>

      {/* Region + price */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {listing.region && (
          <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: MUTED }}>
            📍 {listing.region}
          </span>
        )}
        {listing.price_range && (
          <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: MUTED }}>
            💰 {listing.price_range}
          </span>
        )}
      </div>

      {/* Specs summary */}
      {listing.specs_summary && (
        <p
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '13px',
            lineHeight: '1.6',
            color: MUTED,
            margin: 0,
          }}
        >
          {listing.specs_summary}
        </p>
      )}

      {/* CTA */}
      <div style={{ marginTop: '8px' }}>
        <button
          onClick={() => onInquire?.(listing.id)}
          style={{
            display: 'inline-block',
            padding: '9px 18px',
            backgroundColor: 'transparent',
            border: `1px solid ${GOLD}`,
            color: GOLD,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            borderRadius: '2px',
            transition: 'background-color 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = GOLD
            e.currentTarget.style.color = DARK
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = GOLD
          }}
        >
          Submit Inquiry via Harbourview
        </button>
      </div>

      {/* Timestamp */}
      <p
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '11px',
          color: MUTED,
          opacity: 0.4,
          margin: 0,
        }}
      >
        Listed {new Date(listing.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
      </p>
    </div>
  )
}
