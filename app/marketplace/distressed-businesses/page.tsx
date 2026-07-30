import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Distressed Businesses | Harbourview Exchange',
  description:
    'Public orientation for distressed business opportunities routed through Harbourview review.',
}

export default function DistressedBusinessesCategoryPage() {
  return (
    <>
      <PublicHero
        eyebrow="Exchange — Distressed Businesses"
        title="Business opportunities under controlled commercial review."
        actions={[
          { label: 'Browse Listings', href: '/marketplace/listings' },
          { label: 'Submit Opportunity', href: '/marketplace/sell', variant: 'secondary' },
        ]}
      >
        <p>
          Public summaries for distressed business opportunities appear after Harbourview review.
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
