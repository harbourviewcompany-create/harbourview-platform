import type { Metadata } from 'next'
import IntelligenceModulePage from '@/app/intelligence/IntelligenceModulePage'

export const metadata: Metadata = {
  title: 'Logistics & Trade Routes | Harbourview Intelligence',
  description: 'Trade route context, logistics pathway orientation and documentation framework summaries for regulated cannabis corridors.',
}

export default function LogisticsTradeRoutesPage() {
  return (
    <IntelligenceModulePage
      content={{
        eyebrow: 'Intelligence / Logistics',
        title: 'Trade route and logistics pathway context for regulated cannabis corridors.',
        description:
          'Harbourview logistics intelligence provides orientation on trade corridors, documentation frameworks, cold chain requirements and qualified operator categories for regulated cannabis export and import — without publishing sensitive route detail, operator identities or commercial terms.',
        requestLabel: 'Request Logistics Intelligence',
        reviewItems: [
          'Corridor feasibility orientation: a public-safe overview of the documentation layers, regulatory requirements and common friction points for priority export-to-import corridors.',
          'Cold chain and temperature control requirements: GDP-aligned cold chain expectations for cannabis product categories, common logistics qualification standards and temperature excursion management concepts.',
          'Documentation framework summaries: the narcotics permit, phytosanitary certificate, CoA, commercial invoice, bill of lading, import order and customs declaration sequence across typical regulated cannabis routes.',
          'Third-party logistics qualification: an orientation to what GDP-compliant logistics providers are expected to demonstrate — facility qualification, carrier agreements, temperature mapping and chain-of-custody documentation.',
          'Incoterm relevance for regulated cannabis: how EXW, DAP, DDP and CIF allocate risk, customs responsibility and documentation duty between exporters and importers in regulated supply chains.',
          'Logistics risk categories: transit country narcotics controls, cold chain integrity risk, documentation completeness failure modes and carrier qualification gaps that typically appear in Harbourview route review.',
        ],
        boundaryItems: [
          'Public logistics intelligence does not confirm specific corridor viability, customs clearance, carrier availability, cost estimates or documentation sufficiency for any specific shipment.',
          'Operator-specific logistics questions involving active shipments, specific carriers, customs cases or documentation disputes are handled through private intake — not this surface.',
          'Harbourview does not provide freight forwarding, customs brokerage, legal or regulatory authority services.',
        ],
      }}
    />
  )
}
