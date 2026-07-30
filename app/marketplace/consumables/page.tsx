import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Consumables | Harbourview Exchange',
  description:
    'Public orientation for packaging, cones, pouches, jars and other consumables routed through Harbourview review.',
}

export default function ConsumablesCategoryPage() {
  return (
    <>
      <PublicHero
        eyebrow="Exchange — Consumables"
        title="Packaging and operational inputs under controlled commercial review."
        actions={[
          { label: 'Browse Listings', href: '/marketplace/listings' },
          { label: 'Submit Supply', href: '/marketplace/sell', variant: 'secondary' },
        ]}
      >
        <p>
          Public summaries for cones, child-resistant pouches, jars, labels and related consumables appear on the
          listings board after Harbourview review. Contact details and commercial terms stay private.
        </p>
      </PublicHero>
      <PublicSection tone="navy">
        <PublicCard className="p-7 text-sm leading-7 text-white/62">
          Category orientation only. Availability, pricing and introductions are not automatic and remain subject to
          Harbourview review.
        </PublicCard>
      </PublicSection>
    </>
  )
}
