import type { Metadata } from 'next'
import IntelligenceModulePage from '../IntelligenceModulePage'

export const metadata: Metadata = {
  title: 'Country Briefs',
  description:
    'Public-safe country intelligence orientation for regulated cannabis access models, market maturity and reviewed opportunity categories.',
}

export default function CountryBriefsPage() {
  return (
    <IntelligenceModulePage
      content={{
        eyebrow: 'Country intelligence',
        title: 'Country Briefs',
        description:
          'Country briefs orient serious operators around access models, commercial maturity, public policy posture and market-entry questions before a reviewed brief is requested.',
        requestLabel: 'Request Country Brief',
        reviewItems: [
          'Country status, market maturity and role of licensed importers, distributors, pharmacies, cultivators, processors or operators where public information supports it.',
          'Public-safe opportunity categories such as supply, demand, services, equipment, infrastructure, education, associations and institutional collaboration.',
          'Brief requests can ask Harbourview to review a jurisdiction without publishing sensitive source records, private counterparties or route assumptions.',
          'Country pages do not represent legal clearance, licensing confirmation, government endorsement or transaction approval.',
        ],
        boundaryItems: [
          'Raw source captures and analyst notes stay private.',
          'Import/export feasibility requires separate qualified review.',
          'Specific counterparties are not exposed on public pages.',
        ],
      }}
    />
  )
}
