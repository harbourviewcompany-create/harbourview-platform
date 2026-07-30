import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Genetics | Harbourview Exchange',
  description:
    'Public orientation for genetics programs and access requests routed through Harbourview review.',
}

export default function GeneticsCategoryPage() {
  return (
    <>
      <PublicHero
        eyebrow="Exchange — Genetics"
        title="Genetics programs under controlled commercial review."
        actions={[
          { label: 'Browse Listings', href: '/marketplace/listings' },
          { label: 'Confidential Intake', href: '/intake', variant: 'secondary' },
        ]}
      >
        <p>
          Public orientation for genetics and breeding programs. Access requests are reviewed before any introduction.
        </p>
      </PublicHero>
      <PublicSection tone="navy">
        <PublicCard className="p-7 text-sm leading-7 text-white/62">
          Category orientation only. Access and introductions are not automatic.
        </PublicCard>
      </PublicSection>
    </>
  )
}
