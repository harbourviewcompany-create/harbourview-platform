import type { Metadata } from 'next'
import IntelligenceModulePage from '@/app/intelligence/IntelligenceModulePage'

export const metadata: Metadata = {
  title: 'Counterparty Intelligence | Harbourview Intelligence',
  description: 'Reviewed counterparty context for regulated-market importers, distributors, licensed producers, procurement bodies and institutional buyers.',
}

export default function CounterpartyIntelligencePage() {
  return (
    <IntelligenceModulePage
      content={{
        eyebrow: 'Intelligence / Counterparty',
        title: 'Reviewed counterparty context for regulated cannabis markets.',
        description:
          'Harbourview counterparty intelligence provides reviewed context on operators, importers, distributors, licensed producers, procurement bodies and institutional buyers — without publishing sensitive identities, contact paths or private commercial details.',
        requestLabel: 'Request Counterparty Intelligence',
        reviewItems: [
          'Operator role verification: publicly available evidence of a counterparty\'s claimed role, licence category, operating scope and commercial activities in regulated markets.',
          'Import and export alignment: reviewed context on whether a counterparty\'s claimed import, export, distribution or wholesale authorisation is consistent with public market evidence.',
          'Procurement body context: regulatory body mandate, procurement framework, preferred supplier eligibility and institutional contact pathway orientation for public bodies.',
          'Distribution network orientation: general market structure and distributor role mapping for priority jurisdictions, without publishing specific counterparty commercial terms.',
          'Due diligence preparation: publicly safe orientation on what categories of counterparty evidence Harbourview reviewers assess before introductions are routed.',
          'Licensing gap signals: publicly available signals of licence expiry, regulatory action, compliance concern or operating category mismatch relevant to a counterparty assessment.',
        ],
        boundaryItems: [
          'No private counterparty names, contact details, internal assessments, dossier findings or commercial intelligence is published on this public page.',
          'Counterparty intelligence requests involving specific named parties are routed through confidential intake — not contact or public request forms.',
          'Harbourview does not confirm, endorse, verify or rate specific counterparties on this public surface.',
        ],
      }}
    />
  )
}
