import type { Metadata } from 'next'
import IntelligenceModulePage from '../IntelligenceModulePage'

export const metadata: Metadata = {
  title: 'Regulatory Pathways',
  description:
    'Public-safe regulatory pathway orientation for market access, public-health safeguards and authority-facing considerations.',
}

export default function RegulatoryPathwaysPage() {
  return (
    <IntelligenceModulePage
      content={{
        eyebrow: 'Regulatory intelligence',
        title: 'Regulatory Pathways',
        description:
          'Regulatory pathway pages orient readers around access models, public-health safeguards, market conduct and authority-facing questions without presenting official guidance.',
        requestLabel: 'Request Regulatory Brief',
        reviewItems: [
          'Public orientation can cover medical access, adult-use transition, product-safety controls, quality expectations and market-conduct principles.',
          'Policy movement and regulatory signals are framed as reviewed public context rather than claims of confirmed deal flow or guaranteed access.',
          'Authority-facing resources can be routed toward policy and standards pages or institutional collaboration requests.',
          'Commercial teams can use confidential intake when regulatory questions involve specific products, documents, markets or counterparties.',
        ],
        boundaryItems: [
          'No government endorsement is implied.',
          'Signals are not published as confirmed legal outcomes.',
          'Sensitive route analysis remains private.',
        ],
      }}
    />
  )
}
