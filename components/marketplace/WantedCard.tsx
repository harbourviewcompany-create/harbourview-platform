import type { PublicBuyerRequest } from '@/lib/marketplace/redact'

interface WantedCardProps {
  request: PublicBuyerRequest
  onInquire?: (requestId: string) => void
}

const GOLD = '#C6A55A'
const MUTED = '#C9C2B3'
const DARK = '#0B1A2F'
const CARD_BG = 'rgba(255,255,255,0.03)'
const BORDER = 'rgba(198,165,90,0.15)'

export function WantedCard({ request, onInquire }: WantedCardProps) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#8BB8D4',
            backgroundColor: 'rgba(139,184,212,0.1)',
            padding: '3px 8px',
            borderRadius: '2px',
          }}
        >
          WANTED
        </span>
        <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '11px', color: MUTED, opacity: 0.7 }}>
          {request.buyer_type}
        </span>
      </div>

      <h3
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '18px',
          fontWeight: 600,
          color: '#F5F1E8',
          margin: 0,
        }}
      >
        {request.product_type}
      </h3>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: MUTED }}>
          📍 {request.region_interest}
        </span>
        {request.quantity_range && (
          <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: MUTED }}>
            📦 {request.quantity_range}
          </span>
        )}
      </div>

      {request.specs_requirements && (
        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', lineHeight: '1.6', color: MUTED, margin: 0 }}>
          {request.specs_requirements}
        </p>
      )}

      <div style={{ marginTop: '8px' }}>
        <button
          onClick={() => onInquire?.(request.id)}
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
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = GOLD; e.currentTarget.style.color = DARK }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = GOLD }}
        >
          Contact Harbourview About This
        </button>
      </div>

      <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '11px', color: MUTED, opacity: 0.4, margin: 0 }}>
        Posted {new Date(request.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
      </p>
    </div>
  )
}
