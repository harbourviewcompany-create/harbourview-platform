import type { Metadata } from 'next'
import { DynamicMarketplaceIntakeForm } from '@/components/marketplace/DynamicMarketplaceIntakeForm'
import { resolveMarketplaceListingTypeOption } from '@/lib/marketplace/listingTypeOptions'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Submit Listing | Harbourview',
  description:
    'Submit supply, services, wanted requests or commercial opportunities through Harbourview Network. Contact details are not public and Harbourview reviews submissions before routing.',
}

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; headline?: string; markets?: string }>
}) {
  const params = await searchParams
  const initialListingType = resolveMarketplaceListingTypeOption(params.type)
  const initialHeadline = params.headline ?? ''
  const initialMarkets = params.markets ?? ''
  const isWanted = initialListingType === 'Wanted Request'

  return (
    <>
      <PublicHero
        eyebrow={isWanted ? 'Wanted Request Intake' : 'Marketplace Supply Intake'}
        title={isWanted ? 'Create a private buyer requirement.' : 'Submit supply, assets, services, or commercial opportunities.'}
        compact
      >
        <p>
          {isWanted
            ? 'Describe what you want to buy or source, where it is needed, target quantity, budget, timing and any required documentation.'
            : 'Submit consumables, equipment, used or surplus assets, distressed opportunities, services or other marketplace supply for Harbourview operator review.'}
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Submissions remain private by default. Public visibility, seller exposure and buyer introductions are never automatic.
        </p>
      </PublicHero>

      <PublicSection tone="navy">
        <div className="mx-auto max-w-4xl">
          <PublicCard className="mb-7 p-5 text-sm leading-7 text-white/62">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
              Controlled marketplace review
            </p>
            <p>
              Harbourview reviews category fit, authority, commercial relevance, public/private boundaries and routing context before any public summary, buyer inquiry or commercial introduction is created.
            </p>
          </PublicCard>
          <DynamicMarketplaceIntakeForm defaultType={initialListingType} defaultHeadline={initialHeadline} defaultMarkets={initialMarkets} />
        </div>
      </PublicSection>
    </>
  )
}
