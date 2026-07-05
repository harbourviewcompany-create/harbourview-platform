import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Compliance Readiness | Harbourview Education',
  description:
    'Public-safe compliance readiness education for regulated cannabis operators, exporters, importers and professional stakeholders.',
}

export default function ComplianceReadinessPage() {
  return (
    <PublicSurfacePage
      eyebrow="HAR-40 compliance education"
      title="Compliance readiness without legal or regulatory advice overclaiming."
      description="This education route gives operators and professional stakeholders a structured way to think about readiness, evidence, documentation and escalation before seeking qualified review."
      boundary="This page is educational only. It does not provide legal advice, regulatory advice, QP review, audit opinion, medical advice, import clearance, licence verification or compliance certification."
      primaryAction={{ label: 'Request Readiness Review', href: '/contact' }}
      secondaryAction={{ label: 'Speak Confidentially', href: '/intake', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'Readiness checklist',
          title: 'Evidence categories to organize before review',
          description: 'The public checklist is a preparation aid, not a certification gate or jurisdiction-specific legal requirement list.',
          items: [
            'Entity, site, licence, authorization and activity scope materials for the relevant role.',
            'Product, batch, quality, testing, stability, complaint and recall-readiness documentation where applicable.',
            'Supplier, importer, distributor, logistics, lab and professional-party information needed for route review.',
            'Country, product form, intended market, route assumptions and decision deadline clearly separated from confirmed facts.',
          ],
        },
        {
          eyebrow: 'Escalation triggers',
          title: 'When public education is not enough',
          description: 'These triggers should move the matter into qualified review rather than public self-assessment.',
          items: [
            'A specific shipment, product admission, QP release, importer permit, pharmacy channel or controlled-drug question is involved.',
            'A counterparty claims licence status, route access, buyer demand, seller availability or regulatory approval that must be verified.',
            'The decision could affect investment, export, import, patient supply, controlled substances, public claims or contractual exposure.',
            'Private documents, non-public emails, contracts, batch records, audit files or commercial terms are required to assess the matter.',
          ],
        },
      ]}
      footerTitle="Prepare the evidence before the commercial conversation."
      footerDescription="Use this route to structure readiness questions, then move sensitive facts and documents into reviewed handling before relying on any conclusion."
    />
  )
}
