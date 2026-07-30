import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'New Products | Harbourview Exchange',
  description:
    'Public orientation for new product opportunities routed through Harbourview review.',
}

export default function NewProductsCategoryPage() {
  return (
    <>
      <PublicHero
        eyebrow="Exchange — New Products"
        title="New product pathways under controlled commercial review."
        actions={[
          { label: 'Browse Listings', href: '/marketplace/listings' },
          { label: 'Submit Product', href: '/marketplace/sell', variant: 'secondary' },
        ]}
      >
        <p>
          Public-safe summaries for new product opportunities are published only after review.
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
