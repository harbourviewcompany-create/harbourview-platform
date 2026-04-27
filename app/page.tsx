import type { Metadata } from 'next'
import { CTAButton, Section, SectionHeadline, BodyText, GoldLabel } from '@/components/ui'
import { BOOKING_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Harbourview | Cannabis Market Access, Intelligence and Strategic Introductions',
  description:
    'Harbourview provides market access, commercial intelligence and strategic introductions for cannabis operators, investors, importers, exporters and industry partners worldwide.',
}

const whatWeHelpWith = [
  'Domestic commercial opportunities',
  'International expansion',
  'Market-entry intelligence',
  'Buyer and seller introductions',
  'Investor and partner discovery',
  'Import/export pathway understanding',
  'Regulatory and government navigation through qualified partners',
  'Document and compliance-readiness review',
  'Brand and distribution partnership introductions',
  'Country and market expansion dossiers',
  'Operator, clinician, pharmacist and physician network mapping',
  'Strategic market landscape reviews',
  'Commercial opportunity assessment',
]

const engagementTypes = [
  'Market intelligence dossiers',
  'Country expansion reviews',
  'Commercial opportunity screens',
  'Buyer and seller pathway reviews',
  'Partner introduction mandates',
  'Import/export readiness reviews',
  'Document and compliance-readiness checks',
  'Investor and strategic partner mapping',
  'Brand, distribution and licensing partnership support',
  'Ongoing advisory and market-access support',
]

const howItWorks = [
  { n: '01', title: 'Start with a light inquiry', body: 'Share what you are trying to do. The first step is intentionally brief.' },
  { n: '02', title: 'Harbourview reviews the objective', body: 'The commercial objective is assessed for clarity, fit and relevance.' },
  { n: '03', title: 'Routed by opportunity type', body: 'The inquiry is directed toward the most relevant capability area.' },
  { n: '04', title: 'Intelligence and pathways assessed', body: 'Relevant counterparties, intelligence or routes are evaluated.' },
  { n: '05', title: 'A next step is recommended', body: 'Clear direction is provided on how to proceed.' },
  { n: '06', title: 'Support where appropriate', body: 'Introductions, reviews or advisory work are initiated where there is a credible basis.' },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section style={{ padding: 'clamp(72px,10vw,120px) 24px clamp(64px,8vw,100px)', borderBottom: '1px solid rgba(198,165,90,0.15)', backgroundColor: '#0B1A2F' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <GoldLabel>International Cannabis Market Access</GoldLabel>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(36px,6vw,62px)', fontWeight: 600, lineHeight: 1.1, color: '#F5F1E8', margin: '0 0 28px' }}>
            Market access, intelligence and strategic introductions for the global cannabis industry.
          </h1>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 'clamp(16px,2vw,20px)', lineHeight: 1.7, color: '#C9C2B3', margin: '0 0 16px', maxWidth: '640px' }}>
            Harbourview helps cannabis operators, investors and industry partners understand markets, find credible counterparties and move faster with better information.
          </p>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '15px', lineHeight: 1.75, color: '#C9C2B3', opacity: 0.8, margin: '0 0 40px', maxWidth: '620px' }}>
            From domestic commercial opportunities to international expansion, partner discovery, import/export pathways, market intelligence and document readiness, Harbourview helps turn fragmented industry knowledge into actionable commercial direction.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <CTAButton href="/intake">Start with Harbourview</CTAButton>
            {BOOKING_URL && (
              <CTAButton href={BOOKING_URL} variant="outline">Book a Call</CTAButton>
            )}
          </div>
        </div>
      </section>

      {/* Why Harbourview Exists */}
      <Section dark>
        <div style={{ maxWidth: '760px' }}>
          <SectionHeadline>
            The cannabis industry is fragmented, relationship-driven and expensive to misunderstand.
          </SectionHeadline>
          <BodyText>
            The right intelligence network can save months of wasted outreach, reduce poor-fit introductions, prevent bad-market decisions and identify opportunities that are not visible through public research alone.
          </BodyText>
        </div>
      </Section>

      {/* What We Help With */}
      <Section>
        <SectionHeadline>What Harbourview Helps With</SectionHeadline>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', marginTop: '32px' }}>
          {whatWeHelpWith.map((item) => (
            <div
              key={item}
              style={{
                padding: '16px 20px',
                border: '1px solid rgba(198,165,90,0.18)',
                borderRadius: '2px',
                backgroundColor: 'rgba(198,165,90,0.03)',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '14px',
                lineHeight: 1.6,
                color: '#C9C2B3',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </Section>

      {/* Who We Work Across */}
      <Section dark>
        <SectionHeadline>Who Harbourview Works Across</SectionHeadline>
        <BodyText style={{ maxWidth: '700px' }}>
          Harbourview works across the cannabis industry, including cultivators, brands, manufacturers, processors, genetics companies, clinicians, physicians, pharmacists, investors, importers, exporters, distributors, consultants, service providers and strategic partners.
        </BodyText>
      </Section>

      {/* Engagement Types */}
      <Section>
        <SectionHeadline>Engagement Types</SectionHeadline>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginTop: '32px' }}>
          {engagementTypes.map((item) => (
            <div
              key={item}
              style={{
                padding: '18px 22px',
                border: '1px solid rgba(198,165,90,0.2)',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#C6A55A', marginTop: '8px', flexShrink: 0 }} />
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', lineHeight: 1.6, color: '#C9C2B3' }}>{item}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* How It Works */}
      <Section dark>
        <SectionHeadline>How It Works</SectionHeadline>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>
          {howItWorks.map((step) => (
            <div key={step.n} style={{ display: 'flex', gap: '20px' }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', color: 'rgba(198,165,90,0.3)', fontWeight: 600, flexShrink: 0, lineHeight: 1 }}>
                {step.n}
              </div>
              <div>
                <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '15px', fontWeight: 600, color: '#F5F1E8', margin: '0 0 8px' }}>{step.title}</p>
                <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', lineHeight: 1.65, color: '#C9C2B3', margin: 0 }}>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Final CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center', backgroundColor: '#081423', borderTop: '1px solid rgba(198,165,90,0.15)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(22px,3vw,32px)', fontWeight: 500, fontStyle: 'italic', color: '#F5F1E8', margin: '0 0 32px', lineHeight: 1.4 }}>
            Better information. Better relationships. Better commercial decisions.
          </p>
          <CTAButton href="/intake">Start with Harbourview</CTAButton>
        </div>
      </section>
    </>
  )
}
