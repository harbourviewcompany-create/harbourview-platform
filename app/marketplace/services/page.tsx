import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Services | Harbourview Exchange',
  description:
    'Public orientation for professional and operational services routed through Harbourview review.',
}

export default function ServicesCategoryPage() {
  return (
    <>
      <PublicHero
        eyebrow="Exchange — Services"
        title="Reviewed service pathways for regulated operators."
        actions={[
          { label: 'Browse Listings', href: '/marketplace/listings' },
          { label: 'Submit Service', href: '/marketplace/sell', variant: 'secondary' },
        ]}
      >
        <p>
          Public summaries for operational, professional and support services appear after Harbourview review.
          Contact details and commercial terms stay private.
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
