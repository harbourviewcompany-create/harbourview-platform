import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Packaging | Harbourview Exchange',
  description:
    'Public orientation for packaging materials and systems routed through Harbourview review.',
}

export default function PackagingCategoryPage() {
  return (
    <>
      <PublicHero
        eyebrow="Exchange — Packaging"
        title="Packaging materials under controlled commercial review."
        actions={[
          { label: 'Browse Listings', href: '/marketplace/listings' },
          { label: 'Submit Supply', href: '/marketplace/sell', variant: 'secondary' },
        ]}
      >
        <p>
          Public-safe summaries for packaging systems and materials are published only after review.
        </p>
      </PublicHero>
      <PublicSection tone="navy">
        <PublicCard className="p-7 text-sm leading-7 text-white/62">
          Category orientation only. Availability and introductions are not automatic.
        </PublicCard>
      </PublicSection>
    </>
  )
}
