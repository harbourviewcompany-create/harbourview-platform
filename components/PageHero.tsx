interface PageHeroProps {
  headline: string
  subheadline?: string
  centered?: boolean
  children?: React.ReactNode
}

export function PageHero({ headline, subheadline, centered = false, children }: PageHeroProps) {
  return (
    <section
      style={{
        padding: '80px 24px 64px',
        borderBottom: '1px solid rgba(198,165,90,0.15)',
        textAlign: centered ? 'center' : 'left',
      }}
    >
      <div style={{ maxWidth: '800px', margin: centered ? '0 auto' : '0' }}>
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 600,
            lineHeight: 1.15,
            color: '#F5F1E8',
            margin: '0 0 24px',
          }}
        >
          {headline}
        </h1>
        {subheadline && (
          <p
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 'clamp(16px, 2vw, 19px)',
              lineHeight: 1.7,
              color: '#C9C2B3',
              margin: '0 0 32px',
              maxWidth: '680px',
              marginLeft: centered ? 'auto' : undefined,
              marginRight: centered ? 'auto' : undefined,
            }}
          >
            {subheadline}
          </p>
        )}
        {children}
      </div>
    </section>
  )
}
