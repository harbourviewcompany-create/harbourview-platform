import Link from 'next/link'

// Section wrapper
interface SectionProps {
  children: React.ReactNode
  dark?: boolean
  style?: React.CSSProperties
}

export function Section({ children, dark = false, style }: SectionProps) {
  return (
    <section
      style={{
        padding: '72px 24px',
        backgroundColor: dark ? '#081423' : '#0B1A2F',
        borderBottom: '1px solid rgba(198,165,90,0.1)',
        ...style,
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {children}
      </div>
    </section>
  )
}

// Section headline
export function SectionHeadline({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: 'clamp(24px, 3.5vw, 36px)',
        fontWeight: 600,
        lineHeight: 1.25,
        color: '#F5F1E8',
        margin: '0 0 24px',
      }}
    >
      {children}
    </h2>
  )
}

// Body text
export function BodyText({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '16px',
        lineHeight: 1.75,
        color: '#C9C2B3',
        margin: '0 0 20px',
        ...style,
      }}
    >
      {children}
    </p>
  )
}

// CTA Button
interface CTAButtonProps {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'outline'
  onClick?: () => void
}

export function CTAButton({ href, children, variant = 'primary', onClick }: CTAButtonProps) {
  const isPrimary = variant === 'primary'
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'inline-block',
        padding: '14px 28px',
        backgroundColor: isPrimary ? '#C6A55A' : 'transparent',
        color: isPrimary ? '#0B1A2F' : '#C6A55A',
        border: isPrimary ? 'none' : '1px solid rgba(198,165,90,0.5)',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textDecoration: 'none',
        borderRadius: '2px',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </Link>
  )
}

// Capability Card
interface CapabilityCardProps {
  title: string
  items: string[]
}

export function CapabilityCard({ title, items }: CapabilityCardProps) {
  return (
    <div
      style={{
        border: '1px solid rgba(198,165,90,0.22)',
        borderRadius: '3px',
        padding: '28px',
        backgroundColor: 'rgba(198,165,90,0.03)',
      }}
    >
      <h3
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '18px',
          fontWeight: 600,
          color: '#C6A55A',
          margin: '0 0 16px',
        }}
      >
        {title}
      </h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '14px',
              lineHeight: 1.6,
              color: '#C9C2B3',
              paddingLeft: '16px',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: '8px',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: '#C6A55A',
                opacity: 0.6,
              }}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

// Gold label / tag
export function GoldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#C6A55A',
        marginBottom: '16px',
      }}
    >
      {children}
    </span>
  )
}

// Divider
export function Divider() {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: '1px solid rgba(198,165,90,0.15)',
        margin: '48px 0',
      }}
    />
  )
}
