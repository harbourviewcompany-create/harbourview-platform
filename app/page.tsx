import Link from 'next/link'
import type { Metadata } from 'next'

const entryPoints = [
  {
    title: 'Network',
    href: '/network',
    body: 'Controlled commercial discovery across listings, wanted requests, suppliers and reviewed inquiry pathways.',
  },
  {
    title: 'Opportunities',
    href: '/opportunities',
    body: 'Reviewed commercial openings, country access opportunities, distribution mandates and strategic partnerships.',
  },
  {
    title: 'Intelligence',
    href: '/intelligence',
    body: 'Country, pathway, category and public-safe intelligence for disciplined market-access decisions.',
  },
  {
    title: 'Education',
    href: '/education',
    body: 'Non-promotional education for clinical, pharmacy, quality, commercial and regulatory stakeholders.',
  },
  {
    title: 'Policy & Standards',
    href: '/policy-standards',
    body: 'Regulator-facing policy resources, standards context, public-health safeguards and market conduct principles.',
  },
  {
    title: 'Assessments',
    href: '/assessments',
    body: 'Controlled intake pathways for readiness, route feasibility, documentation and due diligence preparedness.',
  },
  {
    title: 'Institutional Partnerships',
    href: '/institutional-partnerships',
    body: 'Collaboration paths for regulators, associations, universities, pharmacy groups, labs and standards bodies.',
  },
]

const workflowSteps = [
  'Discover public context and available pathways.',
  'Submit a request, listing, opportunity or institutional inquiry.',
  'Harbourview reviews fit, sensitivity and routing requirements.',
  'Sensitive commercial, regulatory and counterparty details remain private.',
  'Qualified introductions, assessments or intelligence requests proceed only after review.',
]

const audiences = [
  'Doctors and pharmacists',
  'Importers and distributors',
  'Cultivators and operators',
  'QA, labs and compliance teams',
  'Procurement and buyers',
  'Regulators and institutions',
  'Investors and acquirers',
]
import { HarbourviewGlobeClientLoader } from '@/components/harbourview/globe/HarbourviewGlobeClientLoader'
import { PublicLinkCard, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Harbourview | Market Access Backed by Intelligence and Relationships',
  description:
    'Harbourview provides controlled network access, reviewed intelligence, professional education and institutional pathways for serious participants in regulated cannabis markets.',
  openGraph: {
    title: 'Harbourview | Market Access Backed by Intelligence and Relationships',
    description:
      'Controlled network access, reviewed intelligence, education and institutional pathways for regulated cannabis markets.',
  },
}

const primarySections = [
  {
    title: 'Harbourview Network',
    href: '/marketplace',
    eyebrow: 'Network access',
    description:
      'Explore controlled commercial discovery across listings, wanted requests, reviewed categories and inquiry pathways.',
    cta: 'Enter Network',
  },
  {
    title: 'Intelligence',
    href: '/intelligence',
    eyebrow: 'Market review',
    description:
      'Review country-level commercial intelligence and publication-controlled pathway context.',
    cta: 'Open Intelligence',
  },
  {
    title: 'Signals',
    href: '/signals',
    eyebrow: 'Policy movement',
    description:
      'Review source-backed regulatory, policy and timing signals across controlled-market pathways.',
    cta: 'Review Signals',
  },
  {
    title: 'Compliance Pathways',
    href: '/compliance',
    eyebrow: 'Orientation only',
    description:
      'Browse public-safe compliance orientation before jurisdiction-specific review.',
    cta: 'View Pathways',
  },
]

const secondarySections = [
  {
    title: 'Clinical Education',
    href: '/network/clinical-education',
    description:
      'Access the public clinical education entry point for controlled-market context.',
  },
  {
    title: 'Contact Harbourview',
    href: '/contact',
    description:
      'Start a confidential Harbourview conversation for commercial intelligence or network access.',
  },
  {
    title: 'Request Introduction',
    href: '/intake',
    description:
      'Use the controlled intake path when a commercial request needs review before routing.',
  },
]

const guardrails = [
  'No public counterparty exposure',
  'No guaranteed access claims',
  'No live commercial-route claims',
  'Reviewed inquiry routing only',
]

const workflowSteps = [
  'Discover public context and available pathways.',
  'Submit a request, listing, opportunity or institutional inquiry.',
  'Harbourview reviews fit, sensitivity and routing requirements.',
  'Sensitive commercial, regulatory and counterparty details remain private.',
  'Qualified introductions, assessments or intelligence requests proceed only after review.',
]

const audiences = [
  'Doctors and pharmacists',
  'Importers and distributors',
  'Cultivators and operators',
  'QA, labs and compliance teams',
  'Procurement and buyers',
  'Regulators and institutions',
  'Investors and acquirers',
]

const pathwaySteps = [
  {
    title: 'Discover',
    body: 'Identify relevant access signals, reviewed opportunity categories and country-specific commercial pathways.',
  },
  {
    title: 'Screen',
    body: 'Assess category fit, counterparty context, licence-sensitive requirements and route viability before engagement.',
  },
  {
    title: 'Connect',
    body: 'Route qualified inquiries, wanted requests and introductions through controlled Harbourview review without public contact disclosure.',
  },
]

const publicSections = [
  {
    title: 'Harbourview Network',
    href: '/marketplace',
    eyebrow: 'Commercial network',
    body: 'Explore reviewed opportunities, wanted requests and controlled inquiry pathways.',
  },
  {
    title: 'Intelligence',
    href: '/intelligence',
    eyebrow: 'Country pathway review',
    body: 'Review public-safe country, route and access-pathway context.',
  },
  {
    title: 'Signals',
    href: '/signals',
    eyebrow: 'Policy monitoring',
    body: 'Review source-backed regulatory and commercial timing signals.',
  },
  {
    title: 'Compliance Pathways',
    href: '/compliance',
    eyebrow: 'Orientation only',
    body: 'Use public orientation pages for pathway context, not legal advice.',
  },
  {
    title: 'Clinical Education',
    href: '/network/clinical-education',
    eyebrow: 'Education pathway',
    body: 'Access controlled clinical education positioning for regulated commercial audiences.',
  },
  {
    title: 'Contact Harbourview',
    href: '/contact',
    eyebrow: 'Confidential contact',
    body: 'Start a controlled Harbourview conversation for commercial intelligence, network access or market-entry support.',
  },
  {
    title: 'Request Introduction',
    href: '/intake',
    eyebrow: 'Reviewed intake',
    body: 'Submit a confidential request for Harbourview review before any private routing or counterparty contact.',
  },
]

export default function HomePage() {
  return (
    <main className="bg-[#01050d] text-white">
      <section className="relative isolate overflow-hidden border-b border-gold/10 bg-[#01050d] py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_22%,rgba(198,165,90,0.18),transparent_34%),linear-gradient(135deg,rgba(11,26,47,0.92)_0%,rgba(1,5,13,1)_72%)]" />
        <HarbourviewGlobeClientLoader />

        <div className="page-container relative z-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.98fr)_minmax(320px,0.72fr)] lg:items-end">
            <div className="max-w-4xl">
              <p className="hero-eyebrow">
                Commercial intelligence and controlled market access
              </p>

              <h1 className="font-serif text-5xl leading-[0.96] tracking-[-0.055em] text-gold-pale sm:text-6xl lg:text-7xl">
                Market access backed by intelligence and relationships.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                Harbourview connects controlled network access, reviewed intelligence,
                regulatory signals, compliance pathways, clinical education and confidential
                inquiry routes for serious participants in regulated cannabis markets.
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/52 sm:text-base">
                Public pages support discovery and context. Contact details, counterparties,
                route assessments and transaction-sensitive information are handled through
                reviewed private workflows.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/marketplace" className="btn-marketplace justify-center">
                  <span>Enter Network</span>
                  <span className="text-xl leading-none">→</span>
                </Link>

                <Link href="/intelligence" className="btn-intelligence justify-center">
                  <span>Request Intelligence</span>
                  <span className="text-xl leading-none">→</span>
                </Link>
              </div>
            </div>

            <aside className="rounded-sm border border-gold/14 bg-[#04101e]/78 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.38)] backdrop-blur-md sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/78">
                Public gateway
              </p>

              <h2 className="mt-4 font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f4f1eb]">
                Available sections are open for review.
              </h2>

              <div className="mt-6 grid gap-3">
                {guardrails.map((guardrail) => (
                  <div
                    key={guardrail}
                    className="rounded-sm border border-gold/10 bg-white/[0.035] px-4 py-3 text-sm text-white/66"
                  >
                    {guardrail}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Keep the remaining sections from the fix/main-syntax-typecheck-prereq-v2 side:
          Public sections
          Secondary sections
          How Harbourview works
          Who Harbourview serves
          Pathway steps
          PublicSection / PublicLinkCard gateway
          Final CTA section
      */}
    </main>
  )
}
