import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Used & Surplus | Harbourview Exchange',
  description:
    'Public orientation for used and surplus equipment routed through Harbourview review.',
}

export default function UsedSurplusCategoryPage() {
  return (
    <>
      <PublicHero
        eyebrow="Exchange — Used & Surplus"
        title="Used and surplus equipment under controlled review."
        actions={[
          { label: 'Browse Listings', href: '/marketplace/listings' },
          { label: 'Submit Asset', href: '/marketplace/sell', variant: 'secondary' },
        ]}
      >
        <p>
          Public summaries for used and surplus assets appear after Harbourview review.
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
