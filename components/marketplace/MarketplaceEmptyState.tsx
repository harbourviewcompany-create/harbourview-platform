import Link from 'next/link'

interface MarketplaceEmptyStateAction {
  href: string
  label: string
  variant?: 'primary' | 'secondary'
}

interface MarketplaceEmptyStateProps {
  eyebrow?: string
  title: string
  description: string
  actions?: MarketplaceEmptyStateAction[]
}

const GOLD = '#C6A55A'
const NAVY = '#0B1A2F'
const MUTED = '#C9C2B3'
const OFF_WHITE = '#F5F1E8'

export function MarketplaceEmptyState({
  eyebrow = 'No public results displayed',
  title,
  description,
  actions = [],
}: MarketplaceEmptyStateProps) {
  return (
    <section
      aria-label={title}
      style={{
        backgroundColor: 'rgba(198,165,90,0.045)',
        border: '1px solid rgba(198,165,90,0.18)',
        borderRadius: '4px',
        padding: '40px 28px',
        textAlign: 'left',
        maxWidth: '760px',
        margin: '0 auto',
      }}
    >
      <p
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: GOLD,
          margin: '0 0 12px',
        }}
      >
        {eyebrow}
      </p>
      <h2
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(22px, 3vw, 30px)',
          fontWeight: 600,
          color: OFF_WHITE,
          margin: '0 0 12px',
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '14px',
          color: MUTED,
          lineHeight: '1.7',
          maxWidth: '620px',
          margin: actions.length > 0 ? '0 0 24px' : 0,
        }}
      >
        {description}
      </p>
      {actions.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {actions.map((action) => {
            const isPrimary = action.variant === 'primary'
            return (
              <Link
                key={`${action.href}-${action.label}`}
                href={action.href}
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  backgroundColor: isPrimary ? GOLD : 'transparent',
                  border: `1px solid ${GOLD}`,
                  color: isPrimary ? NAVY : GOLD,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  borderRadius: '2px',
                }}
              >
                {action.label}
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
