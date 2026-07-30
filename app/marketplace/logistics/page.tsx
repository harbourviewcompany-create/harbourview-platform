import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Logistics | Harbourview Exchange',
  description:
    'Public orientation for logistics and distribution pathways routed through Harbourview review.',
}

export default function LogisticsCategoryPage() {
  return (
    <>
      <PublicHero
        eyebrow="Exchange — Logistics"
        title="Distribution and logistics under controlled review."
        actions={[
          { label: 'Browse Listings', href: '/marketplace/listings' },
          { label: 'Submit Opportunity', href: '/marketplace/sell', variant: 'secondary' },
        ]}
      >
        <p>
          Public summaries for logistics and distribution capacity appear after Harbourview review.
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
