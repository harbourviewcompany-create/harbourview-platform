import type { Metadata } from 'next'
import { wantedRequests } from '@/lib/fixtures/wanted-requests'
import {
  AccessLaneCard,
  ButtonLink,
  DemandBriefCard,
  PageHero,
  SectionFrame,
  SectionHeader,
  Surface,
  TrustBoundaryPanel,
} from '@/components/design-system/Institutional'

export const metadata: Metadata = {
  title: 'Wanted Requests | Harbourview Network',
  description:
    'Review public-safe buyer demand briefs through Harbourview Network. Wanted requests are reviewed before supplier responses are routed privately.',
  openGraph: {
    title: 'Wanted Requests | Harbourview Network',
    description:
      'Public-safe demand briefs for regulated-market buyer requirements and private supplier routing.',
  },
}

const workflow = [
  ['Define', 'The buyer requirement is captured as category, market, timing, budget range and compliance constraints.'],
  ['Review', 'Harbourview checks fit and public-safety before a request is displayed or privately routed.'],
  ['Route', 'Supplier responses move through review rather than exposing buyer identity or private terms publicly.'],
]

export default function WantedRequestsPage() {
  return (
    <>
      <PageHero
        eyebrow="Buyer demand"
        title="Wanted requests presented as controlled demand briefs."
        primary={{ label: 'Create Wanted Request', href: '/marketplace/sell?type=wanted' }}
        secondary={{ label: 'Respond Through Review', href: '/marketplace/quote' }}
        aside={<TrustBoundaryPanel />}
        compact
      >
        <p>
          Wanted requests should feel like institutional demand signals, not classified ads. Public cards show relevance; private routing protects identity, evidence and terms.
        </p>
      </PageHero>

      <SectionFrame tone="editorial">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionHeader eyebrow="Demand workflow" title="Buyer confidence depends on clear review boundaries." className="mb-0">
            <p>
              The response path must make suppliers confident enough to engage while keeping buyer details and procurement context controlled.
            </p>
          </SectionHeader>
          <div className="grid gap-4">
            {workflow.map(([title, body], index) => (
              <Surface key={title} tone="form" className="rounded-[1.4rem] p-5">
                <div className="flex gap-4">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#a9873c]/35 text-xs font-semibold text-[#8f7130]">0{index + 1}</span>
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#061527]">{title}</h2>
                    <p className="mt-2 text-sm leading-7 text-[#435066]">{body}</p>
                  </div>
                </div>
              </Surface>
            ))}
          </div>
        </div>
      </SectionFrame>

      <SectionFrame tone="deep">
        <SectionHeader eyebrow="Reviewed demand" title="Public wanted requests">
          <p>
            These are public-safe summaries. Supplier qualification, buyer identity, source documents and commercial details remain outside public cards.
          </p>
        </SectionHeader>
        {wantedRequests.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {wantedRequests.map((request) => (
              <DemandBriefCard
                key={request.id}
                title={request.title}
                jurisdiction={request.location}
                timing={request.urgency === 'asap' ? 'ASAP' : request.urgency === 'within-30-days' ? 'Within 30 days' : 'Flexible'}
                budget={request.budget || request.price}
                tags={request.tags}
                href={`/marketplace/quote?requestId=${encodeURIComponent(request.id)}`}
              />
            ))}
          </div>
        ) : (
          <Surface tone="panel" className="rounded-[1.75rem] p-8 text-center">
            <h2 className="font-serif text-2xl tracking-[-0.03em] text-white">No public wanted requests are currently available.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/58">
              Demand may still be reviewed privately. Submit a wanted request or start confidential intake if the requirement is sensitive.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/marketplace/sell?type=wanted">Create Wanted Request</ButtonLink>
              <ButtonLink href="/intake" variant="secondary">Confidential Intake</ButtonLink>
            </div>
          </Surface>
        )}
      </SectionFrame>

      <SectionFrame tone="deep" className="pt-0">
        <div className="grid gap-5 lg:grid-cols-2">
          <AccessLaneCard eyebrow="Supplier path" title="Respond to a demand brief" href="/marketplace/quote" cta="Respond through review">
            Route fit, capability, market and timing through Harbourview before any private buyer context is shared.
          </AccessLaneCard>
          <AccessLaneCard eyebrow="Buyer path" title="Create a new wanted request" href="/marketplace/sell?type=wanted" cta="Create request">
            Capture a requirement as a public-safe brief or keep it fully confidential when the situation requires discretion.
          </AccessLaneCard>
        </div>
      </SectionFrame>
    </>
  )
}
