import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Cultivation Equipment | Harbourview Exchange',
  description:
    'Public orientation for cultivation equipment routed through Harbourview review.',
}

export default function CultivationEquipmentCategoryPage() {
  return (
    <>
      <PublicHero
        eyebrow="Exchange — Cultivation Equipment"
        title="Cultivation systems under controlled commercial review."
        actions={[
          { label: 'Browse Listings', href: '/marketplace/listings' },
          { label: 'Submit Equipment', href: '/marketplace/sell', variant: 'secondary' },
        ]}
      >
        <p>
          Public summaries for cultivation equipment appear after Harbourview review.
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
