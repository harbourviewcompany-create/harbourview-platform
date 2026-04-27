import type { Metadata } from 'next'
import { PageHero } from '@/components/PageHero'
import { Section, SectionHeadline, BodyText, CTAButton } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Cannabis Strategic Introductions | Harbourview',
  description: 'Harbourview supports targeted introductions across buyers, sellers, investors, distributors and clinical networks where there is a credible commercial reason to connect.',
}

const supportAreas = [
  'Buyer and seller introductions',
  'Investor and capital introductions',
  'Distributor and wholesaler introductions',
  'Import/export counterparties',
  'Brand and licensing partners',
  'Clinical and pharmacy networks',
  'Technology and service partners',
  'International operating partners',
]

export default function StrategicIntroductionsPage() {
  return (
    <>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <PageHero
          headline="Strategic Introductions Built on Commercial Fit"
          subheadline="Introductions only matter when the commercial logic is clear."
        />
      </div>

      <Section>
        <div style={{ maxWidth: '700px', marginBottom: '48px' }}>
          <BodyText>
            Harbourview supports targeted introductions across buyers, sellers, investors, distributors, operators, clinical networks, partners and service providers where there is a credible reason to connect.
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
          Start an introduction inquiry with Harbourview.
        </p>
        <CTAButton href="/intake">Start an Introduction Inquiry</CTAButton>
      </Section>
    </>
  )
}
