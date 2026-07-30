import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Qualified Access | Harbourview Exchange',
  description:
    'Public orientation for qualified access pathways routed through Harbourview review.',
}

export default function QualifiedAccessCategoryPage() {
  return (
    <>
      <PublicHero
        eyebrow="Exchange — Qualified Access"
        title="Qualified access pathways under controlled review."
        actions={[
          { label: 'Browse Listings', href: '/marketplace/listings' },
          { label: 'Request Access', href: '/intake', variant: 'secondary' },
        ]}
      >
        <p>
          Public orientation for qualified commercial access. Introductions require Harbourview review.
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
