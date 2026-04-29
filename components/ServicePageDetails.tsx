import { Section, SectionHeadline, BodyText, CTAButton } from '@/components/ui'

export type ServiceDetailCard = {
  title: string
  body: string
}

export type ServiceOutput = {
  title: string
  body: string
}

export type ServicePageDetailsProps = {
  overview: string
  whoItIsFor: string[]
  whatHarbourviewDoes: ServiceDetailCard[]
  possibleOutputs: ServiceOutput[]
  badFit: string[]
  ctaLine: string
  ctaLabel?: string
}

const GOLD = '#C6A55A'
const MUTED = '#C9C2B3'
const OFF_WHITE = '#F5F1E8'

const cardStyle: React.CSSProperties = {
  border: '1px solid rgba(198,165,90,0.2)',
  borderRadius: '2px',
  backgroundColor: 'rgba(198,165,90,0.035)',
  padding: '24px',
}

const cardTitleStyle: React.CSSProperties = {
  margin: '0 0 10px',
  color: OFF_WHITE,
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '20px',
  fontWeight: 600,
  lineHeight: 1.25,
}

const cardBodyStyle: React.CSSProperties = {
  margin: 0,
  color: MUTED,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '14px',
  lineHeight: 1.72,
}

const listStyle: React.CSSProperties = {
  display: 'grid',
  gap: '12px',
  padding: 0,
  margin: 0,
  listStyle: 'none',
}

const listItemStyle: React.CSSProperties = {
  position: 'relative',
  paddingLeft: '18px',
  color: MUTED,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '14px',
  lineHeight: 1.7,
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={listStyle}>
      {items.map((item) => (
        <li key={item} style={listItemStyle}>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              top: '0.7em',
              width: '5px',
              height: '5px',
              borderRadius: '999px',
              backgroundColor: GOLD,
              opacity: 0.74,
            }}
          />
          {item}
        </li>
      ))}
    </ul>
  )
}

export function ServicePageDetails({
  overview,
  whoItIsFor,
  whatHarbourviewDoes,
  possibleOutputs,
  badFit,
  ctaLine,
  ctaLabel = 'Start a Confidential Inquiry',
}: ServicePageDetailsProps) {
  return (
    <>
      <Section>
        <div style={{ maxWidth: '760px', marginBottom: '42px' }}>
          <SectionHeadline>What this service is</SectionHeadline>
          <BodyText>{overview}</BodyText>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Who it is for</h3>
            <BulletList items={whoItIsFor} />
          </div>
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Poor fit when</h3>
            <BulletList items={badFit} />
          </div>
        </div>
      </Section>

      <Section dark>
        <SectionHeadline>What Harbourview does</SectionHeadline>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '30px' }}>
          {whatHarbourviewDoes.map((item) => (
            <article key={item.title} style={cardStyle}>
              <h3 style={cardTitleStyle}>{item.title}</h3>
              <p style={cardBodyStyle}>{item.body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeadline>Possible outputs</SectionHeadline>
        <p style={{ ...cardBodyStyle, maxWidth: '700px', marginBottom: '30px' }}>
          Outputs depend on fit, available information and the commercial question being assessed. They are not client case studies or claimed results.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {possibleOutputs.map((item) => (
            <article key={item.title} style={{ ...cardStyle, backgroundColor: 'rgba(8,20,35,0.46)' }}>
              <h3 style={{ ...cardTitleStyle, color: GOLD }}>{item.title}</h3>
              <p style={cardBodyStyle}>{item.body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section dark style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(20px,2.5vw,28px)', fontStyle: 'italic', color: OFF_WHITE, margin: '0 auto 32px', maxWidth: '720px' }}>
          {ctaLine}
        </p>
        <CTAButton href="/intake">{ctaLabel}</CTAButton>
      </Section>
    </>
  )
}
