import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Regulatory Change Tracker | Harbourview Policy & Standards',
  description:
    'Public-safe regulatory change tracking entry point for cannabis policy, standards and market-access monitoring requests.',
}

export default function RegulatoryChangeTrackerPage() {
  return (
    <PublicSurfacePage
      eyebrow="HAR-40 regulatory change tracking"
      title="Track regulatory change without treating signals as legal outcomes."
      description="This route gives Harbourview a public entry point for regulatory-change monitoring, consultation awareness and standards tracking while keeping jurisdiction-specific legal conclusions in qualified review."
      boundary="This page is educational and comparative. It is not government guidance, legal advice, regulatory advice, compliance certification, licensing confirmation or transaction clearance."
      primaryAction={{ label: 'Request Change Tracking', href: '/contact' }}
      secondaryAction={{ label: 'Review Signals', href: '/signals', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'Tracking themes',
          title: 'What can be monitored publicly',
          description: 'The tracker frames themes and request paths rather than publishing unsupported conclusions.',
          items: [
            'Policy consultations, legislative proposals, agency notices, licensing model changes and standards discussions.',
            'Import/export, pharmacy, medical access, adult-use transition, product safety and market conduct developments.',
            'Jurisdictional changes that may affect operators, professionals, importers, distributors, investors or institutions.',
            'Signals that require source confidence review before being treated as commercially actionable.',
          ],
        },
        {
          eyebrow: 'Signal discipline',
          title: 'How public change tracking avoids overclaiming',
          description: 'Regulatory movement is useful only when confidence, status and unresolved issues are visible.',
          items: [
            'Separate proposed, adopted, effective, implemented and commercially observed developments.',
            'Avoid representing policy movement as licensing availability, product eligibility or market access approval.',
            'Use source-confidence and unresolved-issue language when facts remain incomplete.',
            'Route country-specific, product-specific or transaction-specific questions into reviewed private handling.',
          ],
        },
      ]}
      footerTitle="Need monitoring for a specific market or rule change?"
      footerDescription="Submit the jurisdiction, topic, source type, decision deadline and sensitivity level so Harbourview can determine whether the request belongs in public signals, private intelligence or qualified review."
    />
  )
}
