import type { Metadata } from 'next'
import { PageHero } from '@/components/PageHero'
import { Section, SectionHeadline, CTAButton } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Cannabis Market Access Support | Harbourview',
  description: 'Harbourview helps cannabis industry participants understand how to approach new commercial routes, domestic opportunities and international expansion.',
}

const supportAreas = [
  'Domestic growth opportunities',
  'International expansion',
  'Import/export pathway understanding',
  'Market-entry route review',
  'Partner and distributor discovery',
  'Country landscape assessment',
  'Document-readiness review',
  'Regulatory navigation through qualified partners',
  'Commercial route validation',
]

export default function MarketAccessPage() {
  return (
    <>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <PageHero
          headline="Market Access for Cannabis Operators and Industry Partners"
          subheadline="Harbourview helps cannabis industry participants understand how to approach new commercial routes, domestic opportunities and international expansion with better intelligence and stronger counterparties."
        />
      </div>

      <Section>
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
          Explore a market-access inquiry with Harbourview.
        </p>
        <CTAButton href="/intake">Explore a Market-Access Inquiry</CTAButton>
      </Section>
    </>
  )
}
