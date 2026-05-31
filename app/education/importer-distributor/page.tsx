import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Importer & Distributor Education | Harbourview Education',
  description:
    'Non-promotional education for cannabis importers, distributors and logistics providers on route feasibility, documentation and onboarding readiness.',
}

export default function ImporterDistributorPage() {
  return (
    <PublicSurfacePage
      eyebrow="Import and distribution education"
      title="Importer and distributor education for regulated cannabis market access."
      description="This route provides a public-safe orientation to the commercial, regulatory and documentation requirements for importing and distributing regulated cannabis. It does not provide import authorisation, distribution licence advice or jurisdiction-specific regulatory conclusions."
      boundary="This page is educational only. It does not provide import authorisation, distribution licence advice, controlled drug clearance, narcotics permit guidance or jurisdiction-specific regulatory conclusions."
      primaryAction={{ label: 'Request Import Assessment', href: '/assessments' }}
      secondaryAction={{ label: 'Explore Export & Import Readiness', href: '/education/export-import-readiness', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'Importer and distributor roles',
          title: 'Role definitions and responsibilities in regulated cannabis supply chains',
          description: 'Importers and distributors occupy distinct but overlapping roles in regulated cannabis markets, each with separate authorisation, documentation and quality obligations.',
          items: [
            'Importer role — the entity holding the import authorisation, responsible for customs clearance, narcotics permit compliance and receipt documentation.',
            'Wholesale distributor role — the entity holding the wholesale distribution authorisation, responsible for GDP compliance, storage, dispatch and traceability.',
            'Combined importer-distributor models where one entity holds both authorisations and manages the full post-border distribution chain.',
            'Third-party logistics provider role — the entity providing temperature-controlled storage or transport under GDP oversight from the authorised distributor.',
            'Pharmacy channel relationship — the distributor-to-pharmacy supply model, order management, controlled drug balance obligations and dispensing-ready product requirements.',
          ],
        },
        {
          eyebrow: 'Route and documentation readiness',
          title: 'What importers and distributors need to organize before commercial engagement',
          description: 'Import and distribution readiness requires evidence across the regulatory, quality, logistics and commercial dimensions before a route can be treated as viable.',
          items: [
            'Import authorisation scope, narcotics licence conditions, competent authority contact and permit application timelines for the receiving country.',
            'GDP certification, wholesale distribution authorisation scope, QP identity and temperature-controlled facility qualification evidence.',
            'Product-specific import documentation requirements — import order, CoA, GACP or GMP certificate, phytosanitary certificate and exporter authorisation.',
            'Logistics qualification — carrier agreements, temperature mapping, excursion management, chain-of-custody documentation and insurance coverage.',
            'Commercial and supply terms — minimum order quantities, lead times, shelf-life requirements at import, pricing structure and payment terms.',
            'Ongoing obligations — controlled drug balance reconciliation, quarterly reporting, GDP re-audit schedules and regulatory authority notifications.',
          ],
        },
      ]}
      footerTitle="Import and distribution routes require qualified review."
      footerDescription="Specific import permit, distribution authorisation, logistics qualification and route feasibility matters should be handled through Harbourview intake for confidential, controlled review."
    />
  )
}
