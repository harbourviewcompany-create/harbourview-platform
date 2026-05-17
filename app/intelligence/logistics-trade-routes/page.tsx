import type { Metadata } from 'next'
import IntelligenceModulePage from '../IntelligenceModulePage'

export const metadata: Metadata = {
  title: 'Logistics & Trade Routes',
  description:
    'Public-safe logistics and trade-route orientation for controlled cannabis supply chains, documentation and route feasibility review.',
}

export default function LogisticsTradeRoutesPage() {
  return (
    <IntelligenceModulePage
      content={{
        eyebrow: 'Trade-route intelligence',
        title: 'Logistics & Trade Routes',
        description:
          'Logistics and trade-route pages explain route feasibility questions, chain-of-custody themes and documentation review without exposing private shipment or counterparty details.',
        requestLabel: 'Request Route Brief',
        reviewItems: [
          'Route orientation can cover export readiness, importer alignment, distributor roles, chain-of-custody expectations and document discipline.',
          'Harbourview does not publish private shipment plans, route-sensitive counterparties, document packs or protected logistics arrangements.',
          'Public trade-route content supports education and request routing rather than transaction clearance.',
          'Sensitive route questions should move through confidential intake for reviewed handling.',
        ],
        boundaryItems: [
          'No shipment route is represented as cleared.',
          'No private logistics partner data is exposed.',
          'Document review remains a controlled workflow.',
        ],
      }}
    />
  )
}
