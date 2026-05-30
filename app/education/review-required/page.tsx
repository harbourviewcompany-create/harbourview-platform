import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Review Required Topics | Harbourview Education',
  description:
    'Higher-sensitivity education topics that require qualified review before Harbourview can distribute or discuss them publicly.',
}

export default function ReviewRequiredPage() {
  return (
    <PublicSurfacePage
      eyebrow="Controlled topic handling"
      title="Some education topics require review before Harbourview can respond."
      description="Certain topics in regulated cannabis markets carry medical, legal, regulatory or counterparty sensitivity that means Harbourview cannot respond through public education surfaces alone. This page explains what those topics are and how to route them properly."
      boundary="This page explains Harbourview's review model. It does not provide medical advice, legal advice, regulatory guidance or compliance opinions on any topic, including the topics listed below."
      primaryAction={{ label: 'Submit a Review Request', href: '/education/request' }}
      secondaryAction={{ label: 'Speak Confidentially', href: '/intake', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'Why some topics require review',
          title: 'Categories that cannot be handled through public education alone',
          description: 'Public education is appropriate for orientation, preparation and general professional literacy. It is not appropriate where the answer depends on private facts, qualified professional judgement or jurisdiction-specific legal or regulatory conclusions.',
          items: [
            'Clinical and dosing topics where the answer could vary by patient condition, product category, jurisdiction or professional standard.',
            'Legal and regulatory topics where the conclusion depends on the specific jurisdiction, licence type, product classification or regulatory body interpretation.',
            'Counterparty-specific topics where a conclusion would require verifying licence status, documentation, commercial history or identity.',
            'Transaction-specific topics where the question involves a specific shipment, contract, product batch, import permit or market-entry decision.',
            'Investment and financial topics where the answer could affect commercial decisions based on unverified market or company information.',
          ],
        },
        {
          eyebrow: 'How to route review-required topics',
          title: 'The appropriate intake paths for sensitive education requests',
          description: 'Harbourview routes sensitive topics through controlled channels that allow proper scoping, qualified handling and appropriate confidentiality.',
          items: [
            'Use the education request route for professional briefing requests that may involve controlled topics.',
            'Use the Harbourview intake for commercial, regulatory or counterparty questions that require private, reviewed handling.',
            'Use the contact route for institutional, partnership or collaboration enquiries.',
            'Harbourview will confirm whether a request can be handled, how it will be scoped and whether qualified third-party review is required.',
          ],
        },
      ]}
      footerTitle="When in doubt, route through intake."
      footerDescription="Harbourview would rather confirm the right handling path than provide a public response that overstates what education can safely address."
    />
  )
}
