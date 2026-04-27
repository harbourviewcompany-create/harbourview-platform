import type { Metadata } from 'next'
import { PageHero } from '@/components/PageHero'
import { Section, BodyText, CTAButton, CapabilityCard } from '@/components/ui'

export const metadata: Metadata = {
  title: 'What Harbourview Does | Cannabis Market Access and Intelligence',
  description: 'Harbourview supports commercial decision-making and market access across the global cannabis industry through intelligence, introductions and market-access services.',
}

export default function WhatWeDoPage() {
  return (
    <>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <PageHero
          headline="What Harbourview Does"
          subheadline="Harbourview supports commercial decision-making and market access across the global cannabis industry."
        />
      </div>

      <Section>
        <div style={{ maxWidth: '700px', marginBottom: '48px' }}>
          <BodyText>
            We help serious participants understand where opportunity exists, who is credible, what routes are viable and what needs to be reviewed before time, capital or reputation is committed.
          </BodyText>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <CapabilityCard
            title="Commercial Intelligence"
            items={[
              'Market landscape review',
              'Counterparty mapping',
              'Opportunity assessment',
              'Market-entry intelligence',
              'Competitive and route analysis',
              'Country expansion dossiers',
            ]}
          />
          <CapabilityCard
            title="Strategic Introductions"
            items={[
              'Buyer introductions',
              'Seller introductions',
              'Investor introductions',
              'Distributor and wholesaler introductions',
              'Brand and licensing introductions',
              'Clinical, pharmacy and medical network introductions',
              'Partner and service-provider introductions',
            ]}
          />
          <CapabilityCard
            title="Market Access"
            items={[
              'Import/export pathway understanding',
              'Document-readiness support',
              'Regulatory and government navigation through qualified partners',
              'Domestic and international commercial expansion',
              'Route-to-market assessment',
              'Ongoing advisory support',
            ]}
          />
        </div>
      </Section>

      <Section dark style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(20px,2.5vw,28px)', fontStyle: 'italic', color: '#F5F1E8', margin: '0 0 32px' }}>
          Ready to explore how Harbourview can support your commercial objectives?
        </p>
        <CTAButton href="/intake">Start with Harbourview</CTAButton>
      </Section>
    </>
  )
}
