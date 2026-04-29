import type { Metadata } from 'next'
import { PageHero } from '@/components/PageHero'
import { ServicePageDetails } from '@/components/ServicePageDetails'

export const metadata: Metadata = {
  title: 'Cannabis Market Access Support | Harbourview',
  description: 'Harbourview helps cannabis industry participants assess market-entry routes, commercial pathways and counterparties before committing resources.',
}

export default function MarketAccessPage() {
  return (
    <>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <PageHero
          headline="Market Access for Regulated Cannabis Opportunities"
          subheadline="Harbourview helps serious operators, suppliers and investors assess where a route is commercially viable before time, money or credibility is committed."
        />
      </div>

      <ServicePageDetails
        overview="Market access is the disciplined assessment of whether a company can realistically enter, sell into or participate in a regulated cannabis market. Harbourview focuses on route viability, counterparty quality, commercial friction and the practical next steps required before an opportunity is pursued."
        whoItIsFor={[
          'Licensed operators assessing new domestic or international routes.',
          'Suppliers seeking qualified buyers, distributors, pharmacies, processors or local partners.',
          'Investors or strategic groups assessing whether a market is worth serious review.',
          'Market entrants that need commercial clarity before committing budget or executive time.',
        ]}
        badFit={[
          'The objective is only general promotion, media exposure or branding.',
          'The company is not ready to disclose basic product, license, route or commercial details.',
          'The request depends on legal advice, licensing execution or regulatory filing work handled by counsel.',
          'The goal is a broad introduction blast rather than a qualified market-access path.',
        ]}
        whatHarbourviewDoes={[
          {
            title: 'Clarifies the route',
            body: 'Reviews the target market, product type, buyer pathway, distribution logic and likely commercial blockers before recommending a direction.',
          },
          {
            title: 'Screens the market reality',
            body: 'Separates public-market noise from practical questions: who buys, who controls access, what evidence is needed and where the opportunity may fail.',
          },
          {
            title: 'Identifies credible counterparties',
            body: 'Maps relevant buyers, distributors, suppliers, operators or partners based on fit rather than volume of names.',
          },
          {
            title: 'Defines the next commercial move',
            body: 'Turns the review into a clearer action path, such as deeper intelligence, partner screening, controlled introduction or a no-go recommendation.',
          },
        ]}
        possibleOutputs={[
          {
            title: 'Market-Access Intelligence Brief',
            body: 'A concise decision brief covering route viability, market friction, required counterparties and recommended next move.',
          },
          {
            title: 'Route and Counterparty Screen',
            body: 'A structured view of potential buyer, distributor, supplier or partner pathways with fit and risk considerations.',
          },
          {
            title: 'Mandate Recommendation Memo',
            body: 'A recommendation on whether Harbourview should support the opportunity and what scope would make commercial sense.',
          },
        ]}
        ctaLine="Start with a controlled market-access inquiry before moving into the market."
        ctaLabel="Start a Market-Access Inquiry"
      />
    </>
  )
}
