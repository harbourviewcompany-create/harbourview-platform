import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Cannabis Inventory | Harbourview Exchange',
  description:
    'Public orientation for flower, distillate, isolates, softgels, tinctures and related inventory formats under Harbourview review.',
}

export default function CannabisInventoryCategoryPage() {
  return (
    <>
      <PublicHero
        eyebrow="Exchange — Cannabis Inventory"
        title="Reviewed inventory formats for qualified commercial routing."
        actions={[
          { label: 'Browse Listings', href: '/marketplace/listings' },
          { label: 'Submit Inventory', href: '/marketplace/sell', variant: 'secondary' },
        ]}
      >
        <p>
          Public-safe summaries for dried flower, extracts, isolates and finished formats are published only after
          review. This page does not list live stock or expose private counterparties.
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
