import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Procurement Education | Harbourview Education',
  description:
    'Non-promotional procurement education for cannabis buyers, procurement teams and regulated supply-chain participants on documentation review and buyer readiness.',
}

export default function ProcurementPage() {
  return (
    <PublicSurfacePage
      eyebrow="Procurement education"
      title="Procurement education for regulated cannabis buyers and supply teams."
      description="This route provides a public-safe orientation to procurement documentation, supplier evaluation and buyer readiness for regulated cannabis supply chains. It does not provide sourcing recommendations, supplier endorsements or commercial terms advice."
      boundary="This page is educational only. It does not provide sourcing recommendations, supplier endorsements, pricing advice, commercial terms guidance or jurisdiction-specific procurement compliance conclusions."
      primaryAction={{ label: 'Submit a Wanted Request', href: '/marketplace/wanted' }}
      secondaryAction={{ label: 'Request Supplier Review', href: '/assessments', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'Procurement fundamentals',
          title: 'Documentation and evaluation concepts for regulated cannabis procurement',
          description: 'Regulated cannabis procurement requires systematic documentation review, supplier qualification and risk assessment before any commitment is made.',
          items: [
            'Supplier qualification documentation — licence status, GMP or GACP certificate, site audit status, insurance and corporate structure evidence.',
            'Product evaluation — CoA review, specification comparison, stability data adequacy, packaging format fit and shelf-life compliance.',
            'Substitution risk assessment — the consequences of changing supplier, product or batch mid-programme for quality continuity and regulatory standing.',
            'Import and distribution readiness — confirming the supplier\'s product can enter the destination market before procurement commitment.',
            'Commercial terms discipline — separating product quality evaluation from commercial negotiation to avoid quality compromise under pricing pressure.',
            'Due diligence documentation — the internal records of supplier evaluation, product review and procurement decision that support regulatory and audit readiness.',
          ],
        },
        {
          eyebrow: 'Buyer readiness',
          title: 'What procurement teams should organise before engaging qualified supply',
          description: 'Buyer readiness means being prepared to evaluate a supplier credibly — with clear specifications, documented requirements and an internal review process.',
          items: [
            'Product specifications — defined cannabinoid profile, product form, packaging format, batch size requirements and acceptable CoA parameters.',
            'Quality requirements — minimum certificate standards, accreditation requirements, audit access expectations and documentation completeness threshold.',
            'Regulatory requirements — import permit process timeline, narcotics authority notification, pharmacy admission requirements and controlled-drug documentation.',
            'Commercial requirements — minimum order quantities, lead time expectations, shelf-life requirements at delivery, payment terms and Incoterms preferences.',
            'Evaluation process — the internal steps from sample request through documentation review, quality assessment and procurement approval.',
          ],
        },
      ]}
      footerTitle="Procurement decisions require controlled evidence."
      footerDescription="Supplier qualification, product documentation review, import readiness assessment and procurement due diligence should be handled through Harbourview intake for confidential, qualified handling."
    />
  )
}
