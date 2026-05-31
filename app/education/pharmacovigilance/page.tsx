import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Pharmacovigilance & Safety Education | Harbourview Education',
  description:
    'Non-promotional pharmacovigilance and product safety education for medical cannabis operators, quality teams and regulated supply-chain participants.',
}

export default function PharmacovigilancePage() {
  return (
    <PublicSurfacePage
      eyebrow="Product safety education"
      title="Pharmacovigilance and product safety education for regulated cannabis markets."
      description="This route provides a public-safe orientation to pharmacovigilance principles, adverse event concepts, product complaint handling and recall readiness for medical cannabis operators, quality professionals and supply-chain participants. It does not provide regulatory safety advice, reporting authority or medical conclusions."
      boundary="This page is educational only. It does not provide regulatory reporting advice, safety signal assessment, medical opinion, product recall authorisation or jurisdiction-specific pharmacovigilance compliance conclusions."
      primaryAction={{ label: 'Request Safety Assessment', href: '/contact' }}
      secondaryAction={{ label: 'Speak Confidentially', href: '/intake', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'Pharmacovigilance foundations',
          title: 'Post-market safety concepts applicable to regulated medical cannabis',
          description: 'Pharmacovigilance frameworks that apply to pharmaceutical products increasingly intersect with medical cannabis as regulated markets mature.',
          items: [
            'Adverse event definition, seriousness assessment criteria, causality concepts and the distinction between expected and unexpected reactions.',
            'Spontaneous reporting systems, regulatory authority notification timelines and the role of marketing authorisation holders in safety reporting.',
            'Product complaint categories — quality defects, packaging failures, temperature excursions, contamination reports and mislabelling incidents.',
            'Signal detection concepts, benefit-risk assessment principles and the regulatory triggers for safety communications or label changes.',
            'Periodic safety reporting obligations for licensed operators in markets with pharmacovigilance frameworks applicable to medical cannabis.',
            'Patient and healthcare professional reporting channels, consumer complaint handling and escalation obligations at the pharmacy and distribution level.',
          ],
        },
        {
          eyebrow: 'Recall readiness',
          title: 'Batch traceability and withdrawal preparedness for cannabis operators',
          description: 'Recall readiness requires documentation infrastructure and clear internal escalation procedures that can be activated quickly when a quality or safety issue is identified.',
          items: [
            'Batch traceability requirements — the ability to identify all product from a specific batch, its distribution path, current location and whether it has been dispensed.',
            'Recall classification concepts — voluntary versus regulatory-directed, scope of recall and tier definitions that affect response timelines.',
            'Field safety communication obligations, customer and authority notification requirements and documentation of recall execution.',
            'Stock reconciliation, destruction or quarantine procedures and the regulatory documentation needed to close a recall record.',
            'Mock recall readiness — the internal drills and documentation tests that demonstrate the recall system works before it is needed.',
          ],
        },
      ]}
      footerTitle="Safety and recall matters require qualified handling."
      footerDescription="Specific adverse events, product safety signals, quality complaint escalation and recall readiness assessments should be handled through Harbourview intake for confidential, controlled review."
    />
  )
}
