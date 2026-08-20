import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

// ISR: marketplace listing data
export const revalidate = 1800

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Consumable ${id} | Harbourview Exchange`,
    description: 'Public consumable summary on Harbourview Exchange.',
  }
}

export default async function ConsumableDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <>
      <PublicHero
        eyebrow="Consumables"
        title="Reviewed consumable pathway"
        actions={[
          { label: 'Browse listings', href: '/marketplace/listings' },
          { label: 'Request review', href: '/marketplace/quote', variant: 'secondary' },
        ]}
      >
        <p>
          Public detail for consumable reference <span className="text-gold">{id}</span>. Full commercial context stays
          private pending Harbourview review.
        </p>
      </PublicHero>
      <PublicSection tone="navy">
        <PublicCard className="p-7 space-y-4 text-sm leading-7 text-white/62">
          <p>Contact details and terms are not shown on public pages.</p>
          <Link href="/marketplace/consumables" className="btn-marketplace inline-flex">
            Back to consumables
          </Link>
        </PublicCard>
      </PublicSection>
    </>
  )
}
