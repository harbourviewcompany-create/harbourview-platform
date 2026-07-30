import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Import Demand | Harbourview Exchange',
  description:
    'Public orientation for import-side demand routed through Harbourview review.',
}

export default function ImportDemandCategoryPage() {
  return (
    <>
      <PublicHero
        eyebrow="Exchange — Import Demand"
        title="Import-side demand under controlled review."
        actions={[
          { label: 'Browse Wanted', href: '/marketplace/wanted' },
          { label: 'Create Request', href: '/marketplace/sell?type=wanted', variant: 'secondary' },
        ]}
      >
        <p>
          Public summaries of import demand appear after Harbourview review. Private routing only.
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
