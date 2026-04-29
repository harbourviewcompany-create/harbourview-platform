import type { Metadata } from 'next'
import { PageHero } from '@/components/PageHero'
import { ServicePageDetails } from '@/components/ServicePageDetails'

export const metadata: Metadata = {
  title: 'Cannabis Strategic Introductions | Harbourview',
  description: 'Harbourview supports controlled strategic introductions where there is a credible commercial reason for buyers, sellers, investors, distributors or partners to connect.',
}

export default function StrategicIntroductionsPage() {
  return (
    <>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <PageHero
          headline="Strategic Introductions Built on Commercial Fit"
          subheadline="Harbourview supports controlled introductions where the reason to connect is specific, credible and commercially relevant."
        />
      </div>

      <ServicePageDetails
        overview="Strategic introductions are not name-sharing or broad networking. Harbourview looks for a real commercial reason to connect parties, including buyer-seller fit, distribution logic, market-entry relevance, investor interest, supplier capability, service need or partnership alignment."
        whoItIsFor={[
          'Buyers, sellers, distributors, suppliers or operators with a defined commercial objective.',
          'Companies seeking qualified counterparties rather than open networking lists.',
          'Investors, strategic groups or operators assessing specific market relationships.',
          'Participants that can explain what they need and why a counterpart would care.',
        ]}
        badFit={[
          'The request is a generic introduction blast with no clear commercial logic.',
          'The company cannot explain its offer, requirement, mandate, product or decision authority.',
          'The introduction would rely on exaggerated claims, weak fit or unclear value to the other party.',
          'The desired outcome requires legal, financial or regulatory advice rather than a commercial introduction path.',
        ]}
        whatHarbourviewDoes={[
          {
            title: 'Tests the reason to connect',
            body: 'Clarifies why the introduction should exist, what each side may want and whether the commercial logic is strong enough to proceed.',
          },
          {
            title: 'Screens counterparties',
            body: 'Assesses fit based on market, product, route, capability, buyer or seller profile and relevant constraints.',
          },
          {
            title: 'Controls disclosure',
            body: 'Keeps sensitive identity and commercial details controlled until the opportunity has enough fit to justify a conversation.',
          },
          {
            title: 'Prepares the approach',
            body: 'Frames the introduction around a clear commercial reason, reducing wasted outreach and improving the quality of the first conversation.',
          },
        ]}
        possibleOutputs={[
          {
            title: 'Counterparty Screen',
            body: 'A focused assessment of relevant buyers, sellers, partners, distributors, suppliers or investors based on fit logic.',
          },
          {
            title: 'Introduction Readiness Note',
            body: 'A short view of whether the party is ready to be introduced, what must be clarified and what should be withheld.',
          },
          {
            title: 'Controlled Introduction Path',
            body: 'A recommended approach for moving from screened interest to a direct conversation when fit is credible.',
          },
        ]}
        ctaLine="Start with fit before asking for access."
        ctaLabel="Start an Introduction Inquiry"
      />
    </>
  )
}
