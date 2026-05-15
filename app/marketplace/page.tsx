import type { Metadata } from 'next'
import {
  AccessLaneCard,
  ButtonLink,
  PageHero,
  SectionFrame,
  SectionHeader,
  Surface,
  TrustBoundaryPanel,
} from '@/components/design-system/Institutional'

export const metadata: Metadata = {
  title: 'Network | Harbourview',
  description:
    'Harbourview Network is a controlled access layer for reviewed listings, wanted requests, opportunity submissions and regulated-market commercial routing.',
  openGraph: {
    title: 'Harbourview Network',
    description:
      'Controlled network access for public-safe commercial summaries, wanted requests and confidential regulated-market review.',
  },
}

const accessLanes = [
  {
    eyebrow: 'Reviewed listings',
    title: 'Public-safe opportunity summaries',
    href: '/marketplace/listings',
    cta: 'Review public summaries',
    body: 'Listings are presented as controlled commercial summaries. Private counterparty details, source material and terms remain out of public routes.',
  },
  {
    eyebrow: 'Buyer demand',
    title: 'Wanted requests as demand briefs',
    href: '/marketplace/wanted',
    cta: 'View wanted requests',
    body: 'Demand-side requirements are framed as reviewed briefs so suppliers can respond through Harbourview rather than expose sensitive details publicly.',
  },
  {
    eyebrow: 'Seller path',
    title: 'Submit an opportunity for review',
    href: '/marketplace/sell',
    cta: 'Submit opportunity',
    body: 'Supply, services, assets and access opportunities enter a qualification path before any publication or introduction decision.',
  },
  {
    eyebrow: 'Routed inquiry',
    title: 'Request commercial follow-up',
    href: '/marketplace/quote',
    cta: 'Request routing',
    body: 'Qualified buyers, sellers and participants can request review for a listing, category or commercial pathway without public disclosure.',
  },
]

const reviewSteps = [
  ['Classify', 'Harbourview separates listings, wanted requests, market access opportunities and confidential situations before routing.'],
  ['Sanitize', 'Public routes show summaries and categories only. Private evidence, counterparty material and commercial terms remain controlled.'],
  ['Route', 'Introductions and follow-up happen only after fit, jurisdiction, seriousness and disclosure level are reviewed.'],
]

export default function MarketplacePage() {
  return (
    <>
      <PageHero
        eyebrow="Harbourview Network"
        title="Controlled commercial access for reviewed regulated-market opportunities."
        primary={{ label: 'Submit Opportunity', href: '/marketplace/sell' }}
        secondary={{ label: 'View Wanted Requests', href: '/marketplace/wanted' }}
        tertiary={{ label: 'Request Routing', href: '/marketplace/quote' }}
        aside={<TrustBoundaryPanel />}
      >
        <p>
          The Network is not an open listing board. It is a public-safe entry layer for opportunity summaries, buyer demand and confidential commercial review.
        </p>
      </PageHero>

      <SectionFrame tone="deep">
        <SectionHeader eyebrow="Network lanes" title="Choose the pathway that matches the commercial situation.">
          <p>
            Each lane keeps public discovery separate from private qualification. Users should understand what they are authorizing before submitting or responding.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {accessLanes.map((lane) => (
            <AccessLaneCard key={lane.href} eyebrow={lane.eyebrow} title={lane.title} href={lane.href} cta={lane.cta}>
              {lane.body}
            </AccessLaneCard>
          ))}
        </div>
      </SectionFrame>

      <SectionFrame tone="editorial">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionHeader eyebrow="Review model" title="The network earns trust by limiting what is public." className="mb-0">
            <p>
              Public summaries should help qualified participants identify relevance. They should not publish private evidence, counterparties, commercial terms or analyst review context.
            </p>
          </SectionHeader>
          <div className="grid gap-4">
            {reviewSteps.map(([title, body], index) => (
              <Surface key={title} tone="form" className="rounded-[1.4rem] p-5">
                <div className="flex gap-4">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#a9873c]/35 text-xs font-semibold text-[#8f7130]">0{index + 1}</span>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#061527]">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[#435066]">{body}</p>
                  </div>
                </div>
              </Surface>
            ))}
          </div>
        </div>
      </SectionFrame>

      <SectionFrame tone="deep">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <SectionHeader eyebrow="Confidential path" title="Sensitive commercial situations should start in private review." className="mb-0">
            <p>
              If the opportunity includes sensitive counterparties, documents, source material, pricing, exclusivity or jurisdictional exposure, use the confidential intake route instead of public submission language.
            </p>
          </SectionHeader>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <ButtonLink href="/intake">Start Confidential Review</ButtonLink>
            <ButtonLink href="/intelligence" variant="secondary">View Intelligence</ButtonLink>
          </div>
        </div>
      </SectionFrame>
    </>
  )
}
