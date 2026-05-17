import type { Metadata } from 'next'
import IntelligenceModulePage from '../IntelligenceModulePage'

export const metadata: Metadata = {
  title: 'Licensing Pathways',
  description:
    'Public-safe licensing pathway orientation for regulated cannabis market access, importer and distributor roles and documentation expectations.',
}

export default function LicensingPathwaysPage() {
  return (
    <IntelligenceModulePage
      content={{
        eyebrow: 'Licensing pathways',
        title: 'Licensing Pathways',
        description:
          'Licensing pathway pages explain market-entry roles, documentation themes and review questions without implying eligibility, approval or legal advice.',
        requestLabel: 'Request Pathway Review',
        reviewItems: [
          'Importer, distributor, pharmacy, cultivation, processing, product registration and operator-role pathways can be mapped at a public-safe level.',
          'Harbourview separates general pathway orientation from jurisdiction-specific legal, regulatory or compliance determinations.',
          'Documentation expectations can be framed for review readiness without publishing private document packs or counterparty materials.',
          'Operators can route licensing-pathway questions into confidential intake when the request involves sensitive markets or commercial strategy.',
        ],
        boundaryItems: [
          'No public page confirms license eligibility.',
          'No legal or regulatory advice is created by this route.',
          'Private documentation review requires controlled intake.',
        ],
      }}
    />
  )
}
