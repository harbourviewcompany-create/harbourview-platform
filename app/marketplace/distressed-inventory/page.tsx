import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Distressed Inventory | Harbourview Exchange',
  description:
    'Public orientation for distressed inventory opportunities routed through Harbourview review.',
}

export default function DistressedInventoryCategoryPage() {
  return (
    <>
      <PublicHero
        eyebrow="Exchange — Distressed Inventory"
        title="Distressed inventory under controlled commercial review."
        actions={[
          { label: 'Browse Listings', href: '/marketplace/listings' },
          { label: 'Submit Opportunity', href: '/marketplace/sell', variant: 'secondary' },
        ]}
      >
        <p>
          Public summaries for distressed inventory appear after Harbourview review.
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
