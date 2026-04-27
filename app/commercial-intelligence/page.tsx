import type { Metadata } from 'next'
import { PageHero } from '@/components/PageHero'
import { Section, SectionHeadline, BodyText, CTAButton } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Cannabis Commercial Intelligence | Harbourview',
  description: 'Harbourview helps organize fragmented industry knowledge into practical intelligence for operators, investors and partners evaluating commercial opportunities.',
}

const supportAreas = [
  'Market landscape reviews',
  'Opportunity screens',
  'Counterparty research',
  'Country expansion dossiers',
  'Commercial risk review',
  'Buyer and seller pathway review',
  'Partner mapping',
  'Route viability assessment',
]

export default function CommercialIntelligencePage() {
  return (
    <>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <PageHero
          headline="Commercial Intelligence for Better Cannabis Market Decisions"
          subheadline="Public information alone rarely explains what is actually happening in a cannabis market."
        />
      </div>

      <Section>
        <div style={{ maxWidth: '700px', marginBottom: '48px' }}>
          <BodyText>
            Harbourview helps organize fragmented industry knowledge into practical intelligence for operators, investors and partners evaluating commercial opportunities.
          </BodyText>
        </div>
        <SectionHeadline>Support Areas</SectionHeadline>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '32px' }}>
          {supportAreas.map((area) => (
            <div
              key={area}
              style={{
                padding: '20px 24px',
                border: '1px solid rgba(198,165,90,0.2)',
                borderRadius: '2px',
                backgroundColor: 'rgba(198,165,90,0.03)',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '15px',
                lineHeight: 1.6,
                color: '#C9C2B3',
              }}
            >
              {area}
            </div>
          ))}
        </div>
      </Section>

      <Section dark style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(20px,2.5vw,28px)', fontStyle: 'italic', color: '#F5F1E8', margin: '0 0 32px' }}>
          Submit an intelligence inquiry to Harbourview.
        </p>
        <CTAButton href="/intake">Submit an Intelligence Inquiry</CTAButton>
      </Section>
    </>
  )
}
