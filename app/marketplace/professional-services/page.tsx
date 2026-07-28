import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Professional Services | Harbourview Exchange',
  description:
    'Public orientation for professional services routed through Harbourview review.',
}

export default function ProfessionalServicesCategoryPage() {
  return (
    <>
      <PublicHero
        eyebrow="Exchange — Professional Services"
        title="Professional services under controlled commercial review."
        actions={[
          { label: 'Browse Listings', href: '/marketplace/listings' },
          { label: 'Submit Service', href: '/marketplace/sell', variant: 'secondary' },
        ]}
      >
        <p>
          Public summaries for professional service providers appear after Harbourview review.
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
