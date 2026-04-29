import type { Metadata } from 'next'
import { PageHero } from '@/components/PageHero'
import { ServicePageDetails } from '@/components/ServicePageDetails'

export const metadata: Metadata = {
  title: 'Cannabis Commercial Intelligence | Harbourview',
  description: 'Harbourview turns fragmented cannabis market information into practical intelligence for operators, investors and commercial decision-makers.',
}

export default function CommercialIntelligencePage() {
  return (
    <>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <PageHero
          headline="Commercial Intelligence for Better Cannabis Market Decisions"
          subheadline="Harbourview helps turn fragmented market information into decision-grade intelligence for operators, investors and partners evaluating serious commercial opportunities."
        />
      </div>

      <ServicePageDetails
        overview="Commercial intelligence is the process of turning scattered market information into a usable decision view. Harbourview focuses on what matters commercially: market reality, route viability, counterparty quality, buyer and seller pathways, friction points and the practical questions that must be answered before action."
        whoItIsFor={[
          'Operators evaluating a market, product lane, buyer pathway or partner opportunity.',
          'Investors and strategic groups that need a practical view before deeper diligence.',
          'Suppliers assessing where demand may exist and what route is credible.',
          'Executives who need a concise commercial read, not a generic market report.',
        ]}
        badFit={[
          'The need is a broad academic report with no commercial decision attached.',
          'The request depends on unverifiable claims, hidden assumptions or unavailable source material.',
          'The company wants guaranteed outcomes rather than a disciplined assessment.',
          'The work required is legal advice, financial advice or formal regulatory opinion.',
        ]}
        whatHarbourviewDoes={[
          {
            title: 'Frames the decision',
            body: 'Defines the exact commercial question, market, product lane, counterparties and decision threshold before research begins.',
          },
          {
            title: 'Separates signal from noise',
            body: 'Reviews available market information through a commercial lens and identifies what is useful, weak, missing or misleading.',
          },
          {
            title: 'Maps commercial pathways',
            body: 'Looks at buyer, seller, distributor, pharmacy, operator, investor or partner pathways where relevant to the inquiry.',
          },
          {
            title: 'Turns findings into action',
            body: 'Produces a practical view of what appears viable, what should be avoided and what must be validated next.',
          },
        ]}
        possibleOutputs={[
          {
            title: 'Commercial Intelligence Brief',
            body: 'A concise brief summarizing the market question, key findings, constraints, risks and recommended next move.',
          },
          {
            title: 'Opportunity Screen',
            body: 'A structured screen of a market, product lane, buyer route, seller route or partner opportunity.',
          },
          {
            title: 'Counterparty Research Snapshot',
            body: 'A focused view of relevant companies or partner types with commercial relevance, fit logic and open questions.',
          },
        ]}
        ctaLine="Use commercial intelligence before committing serious resources."
        ctaLabel="Start an Intelligence Inquiry"
      />
    </>
  )
}
