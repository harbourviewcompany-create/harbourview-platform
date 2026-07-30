import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Export Ready | Harbourview Exchange',
  description:
    'Public orientation for export-ready supply routed through Harbourview review.',
}

export default function ExportReadyCategoryPage() {
  return (
    <>
      <PublicHero
        eyebrow="Exchange — Export Ready"
        title="Export-oriented supply under controlled commercial review."
        actions={[
          { label: 'Browse Listings', href: '/marketplace/listings' },
          { label: 'Submit Supply', href: '/marketplace/sell', variant: 'secondary' },
        ]}
      >
        <p>
          Public summaries for export-ready inventory and capacity appear after Harbourview review.
        </p>
      </PublicHero>
      <PublicSection tone="navy">
        <PublicCard className="p-7 text-sm leading-7 text-white/62">
          Category orientation only. Publication and introductions are not automatic.
        </PublicCard>
      </PublicSection>
    </>
  )
}
