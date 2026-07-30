import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Labs & Testing | Harbourview Exchange',
  description:
    'Public orientation for laboratory and testing services routed through Harbourview review.',
}

export default function LabsTestingCategoryPage() {
  return (
    <>
      <PublicHero
        eyebrow="Exchange — Labs & Testing"
        title="Laboratory and testing capacity under controlled review."
        actions={[
          { label: 'Browse Listings', href: '/marketplace/listings' },
          { label: 'Submit Service', href: '/marketplace/sell', variant: 'secondary' },
        ]}
      >
        <p>
          Public summaries for labs and testing providers appear after Harbourview review.
          Contact details remain private.
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
