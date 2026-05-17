import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Export & Import Readiness | Harbourview Education',
  description:
    'Public-safe education for cannabis export and import readiness, documentation discipline and route-review preparation.',
}

export default function ExportImportReadinessPage() {
  return (
    <PublicSurfacePage
      eyebrow="HAR-40 export/import education"
      title="Export and import readiness as a reviewed workflow."
      description="This route helps exporters, importers, distributors and advisors understand the categories of information that usually need to be organized before serious route review."
      boundary="This page is not legal advice, import/export approval, customs advice, controlled-drug advice, QP certification, licence verification or shipment clearance. Jurisdiction-specific matters require qualified review."
      primaryAction={{ label: 'Request Route Readiness Review', href: '/contact' }}
      secondaryAction={{ label: 'Submit Confidential Details', href: '/intake', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'Route-readiness map',
          title: 'Public-safe preparation categories',
          description: 'These categories help teams organize the facts needed before relying on a market-access route.',
          items: [
            'Exporter role, site, product category, production basis, quality-system evidence and documentation readiness.',
            'Importer role, local authorization basis, receiving site, release model, distribution pathway and pharmacy or channel context.',
            'Product form, batch documentation, testing package, stability status, packaging, labelling and controlled handling assumptions.',
            'Logistics, chain-of-custody, storage, insurance, customs, controlled-substance and route-specific escalation questions.',
          ],
        },
        {
          eyebrow: 'Decision discipline',
          title: 'Separate facts, assumptions and unresolved dependencies',
          description: 'A route should not be treated as viable until the unresolved dependencies are explicit.',
          items: [
            'Confirmed evidence should be separated from commercial claims and third-party representations.',
            'Unresolved licence, permit, QP, importer, product classification, testing or shipment-document questions should remain visible.',
            'Public pages should route the request; they should not certify that a product, company, shipment or market is ready.',
            'Private review should retain sensitive documents outside public routes and marketplace pages.',
          ],
        },
      ]}
      footerTitle="Route readiness requires controlled evidence."
      footerDescription="Use Harbourview intake when the request includes specific products, documents, counterparties, shipment plans or jurisdiction-specific assumptions."
    />
  )
}
