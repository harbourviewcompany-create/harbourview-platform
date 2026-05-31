import type { Metadata } from 'next'
import IntelligenceModulePage from '@/app/intelligence/IntelligenceModulePage'

export const metadata: Metadata = {
  title: 'Licensing Pathways | Harbourview Intelligence',
  description: 'Regulatory licensing pathway context for import, export, cultivation, processing and distribution across priority jurisdictions.',
}

export default function LicensingPathwaysPage() {
  return (
    <IntelligenceModulePage
      content={{
        eyebrow: 'Intelligence / Licensing',
        title: 'Licensing pathway context for regulated cannabis market access.',
        description:
          'Harbourview licensing pathway intelligence orients operators around licence categories, authorisation requirements, pathway questions and jurisdiction-specific review needs — without providing legal advice, confirming eligibility or publishing private route analysis.',
        requestLabel: 'Request Licensing Pathway Intelligence',
        reviewItems: [
          'Cultivation licence categories: an orientation to cultivation authorisation types, GACP certificate requirements, output volume controls and export eligibility distinctions across priority source markets.',
          'Manufacturing and processing licences: GMP certification scope, secondary processing authorisation, product form permissions and the licence basis for export-ready batch production.',
          'Import authorisation frameworks: competent authority structures, narcotics import order processes, GDP requirements and importer qualification steps across tracked destination markets.',
          'Export licence and permit structures: export authorisation categories, narcotics export permit frameworks, phytosanitary requirements and Incoterm-relevant export responsibility.',
          'Wholesale and distribution authorisation: GDP-certified wholesale distribution licence categories, pharmacy supply permissions, controlled drug handling authorisations and re-export permissions.',
          'Special access and unlicensed pathways: compassionate use, named patient, special access scheme and temporary authorisation frameworks in jurisdictions where full market authorisation has not been granted.',
        ],
        boundaryItems: [
          'Pathway summaries are orientation-level only. They do not confirm licence eligibility, authorisation scope, route viability or legal sufficiency for any specific operator or transaction.',
          'Specific licensing questions involving products, batches, counterparties, contracts or active regulatory submissions are routed through private intake — not this public surface.',
          'Harbourview does not provide legal advice. Operators should verify licensing requirements with qualified local legal advisors and the relevant competent authority.',
        ],
      }}
    />
  )
}
