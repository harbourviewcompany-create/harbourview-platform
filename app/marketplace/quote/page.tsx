import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Request Quote | Harbourview Exchange',
  description:
    'Submit a confidential quote or introduction request through Harbourview review.',
}

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string }>
}) {
  const params = await searchParams
  const listingLabel = params.listing?.trim()

  return (
    <>
      <PublicHero
        eyebrow="Exchange — Quote Request"
        title="Request a reviewed commercial pathway."
        actions={[
          { label: 'Confidential Intake', href: '/intake' },
          { label: 'Browse Listings', href: '/marketplace/listings', variant: 'secondary' },
        ]}
      >
        <p>
          {listingLabel
            ? `You are requesting review related to “${listingLabel}”. Harbourview will assess fit before any introduction.`
            : 'Describe the listing or requirement you want reviewed. Harbourview assesses fit before any introduction.'}
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Quote requests remain private. Responses and introductions are never automatic.
        </p>
      </PublicHero>
      <PublicSection tone="navy">
        <PublicCard className="p-7 text-sm leading-7 text-white/62">
          Use confidential intake to submit counterparty context, volume, markets and timing. Public pages never expose
          private contact details or internal review notes.
        </PublicCard>
      </PublicSection>
    </>
  )
}
