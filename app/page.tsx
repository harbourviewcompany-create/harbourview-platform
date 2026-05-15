import type { Metadata } from 'next'
import { HarbourviewGlobeClientLoader } from '@/components/harbourview/globe/HarbourviewGlobeClientLoader'
import {
  AccessLaneCard,
  ButtonLink,
  IntelligenceSignalCard,
  SectionFrame,
  SectionHeader,
  Surface,
  TrustBoundaryPanel,
} from '@/components/design-system/Institutional'

export const metadata: Metadata = {
  title: 'Harbourview | Regulated-Market Intelligence and Controlled Network Access',
  description:
    'Harbourview combines public-safe market intelligence, controlled network access and confidential commercial review for regulated-market operators.',
  openGraph: {
    title: 'Harbourview | Regulated-Market Intelligence and Controlled Network Access',
    description:
      'A discreet intelligence-led access layer for reviewed opportunities, wanted requests and regulated-market commercial pathways.',
  },
}

const accessLanes = [
  {
    eyebrow: 'Network access',
    title: 'Reviewed commercial pathways',
    href: '/marketplace',
    body: 'Public-safe summaries, wanted requests and opportunity categories are separated from private counterparty and review material.',
  },
  {
    eyebrow: 'Intelligence layer',
    title: 'Country and pathway context',
    href: '/intelligence',
    body: 'Jurisdiction views and signals help operators understand market access before requesting confidential review.',
  },
  {
    eyebrow: 'Confidential routing',
    title: 'Private intake and qualification',
    href: '/intake',
    body: 'Sensitive situations start in a controlled review flow before any public visibility, introduction or transaction discussion.',
  },
]

const operatingPrinciples = [
  'Public surfaces describe opportunity classes and signal implications without exposing private evidence.',
  'Commercial interest is routed through review before any introduction, publication or counterparty disclosure.',
  'Marketplace, intelligence and intake paths remain visibly distinct so users understand what action they are taking.',
]

export default function HomePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#020812] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_4%,rgba(199,166,92,0.18),transparent_34%),radial-gradient(circle_at_78%_8%,rgba(29,78,121,0.24),transparent_44%)]" />
        <div className="page-container relative z-10 grid min-h-[calc(100vh-5rem)] gap-10 py-18 sm:py-22 lg:grid-cols-[1.03fr_0.97fr] lg:items-center lg:py-24">
          <div className="max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-gold/82">Harbourview</p>
            <h1 className="mt-5 font-serif text-5xl leading-[0.94] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
              Market access backed by intelligence and controlled relationships.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/68">
              Harbourview is a discreet commercial intelligence and network-access platform for regulated-market operators. Public discovery, private review and routed introductions stay deliberately separated.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="/marketplace">Enter Network</ButtonLink>
              <ButtonLink href="/intelligence" variant="secondary">View Intelligence</ButtonLink>
              <ButtonLink href="/intake" variant="quiet">Start Confidential Review</ButtonLink>
            </div>
          </div>
          <div className="relative min-h-[420px] lg:min-h-[620px]">
            <div className="absolute inset-0 opacity-90">
              <HarbourviewGlobeClientLoader />
            </div>
            <TrustBoundaryPanel className="absolute bottom-0 left-0 right-0 mx-auto max-w-xl backdrop-blur-md lg:left-auto lg:right-0" />
          </div>
        </div>
      </section>

      <SectionFrame tone="deep">
        <SectionHeader eyebrow="Platform structure" title="Three public paths. One controlled operating model.">
          <p>
            Harbourview separates discovery, intelligence and confidential review so regulated-market users are never pushed through a generic lead form or public marketplace pattern.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {accessLanes.map((lane) => (
            <AccessLaneCard key={lane.href} eyebrow={lane.eyebrow} title={lane.title} href={lane.href}>
              {lane.body}
            </AccessLaneCard>
          ))}
        </div>
      </SectionFrame>

      <SectionFrame tone="editorial">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionHeader eyebrow="Review discipline" title="Premium here means restraint, precision and controlled disclosure." className="mb-0">
            <p>
              Harbourview should not behave like a commodity listing board. Every route must clarify what is public, what is reviewed privately and what action the user is authorizing.
            </p>
          </SectionHeader>
          <div className="grid gap-4">
            {operatingPrinciples.map((principle, index) => (
              <Surface key={principle} tone="form" className="rounded-[1.4rem] p-5">
                <div className="flex gap-4">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#a9873c]/35 text-xs font-semibold text-[#8f7130]">0{index + 1}</span>
                  <p className="text-sm leading-7 text-[#334155]">{principle}</p>
                </div>
              </Surface>
            ))}
          </div>
        </div>
      </SectionFrame>

      <SectionFrame tone="deep">
        <SectionHeader eyebrow="Current public intelligence" title="Signals are presented as public-safe commercial context, not private evidence.">
          <p>
            The intelligence surface should show direction, status and implication while keeping source review, sensitive counterparty information and analyst notes out of public routes.
          </p>
        </SectionHeader>
        <div className="grid gap-5 lg:grid-cols-3">
          <IntelligenceSignalCard eyebrow="Signals" title="Regulatory movement" meta="Public-safe">
            Jurisdictional change and public regulatory movement are summarized for commercial interpretation before private review.
          </IntelligenceSignalCard>
          <IntelligenceSignalCard eyebrow="Network" title="Access lanes" meta="Reviewed">
            Buyer demand, supplier capability and commercial openings route through controlled intake rather than open publication.
          </IntelligenceSignalCard>
          <IntelligenceSignalCard eyebrow="Confidential" title="Private discussion" meta="Qualified">
            Sensitive opportunities begin with a restrained intake flow and review boundary before any introduction pathway.
          </IntelligenceSignalCard>
        </div>
      </SectionFrame>

      <SectionFrame tone="editorial">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <SectionHeader eyebrow="Next action" title="Start from the path that matches the commercial situation." className="mb-0">
            <p>
              Use Network for public-safe commercial discovery, Intelligence for market context, or Confidential Review when the situation should not be publicly exposed.
            </p>
          </SectionHeader>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <ButtonLink href="/marketplace">Enter Network</ButtonLink>
            <ButtonLink href="/intake" variant="secondary">Confidential Review</ButtonLink>
          </div>
        </div>
      </SectionFrame>
    </>
  )
}
