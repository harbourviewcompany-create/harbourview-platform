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
import { HarbourviewGlobeClientLoader } from '@/components/harbourview/globe/HarbourviewGlobeClientLoader'
import {
  FooterCta,
  PublicCard,
  PublicLinkCard,
  PublicSection,
  SectionHeader,
} from '@/components/PublicUi'

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
] as const

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
] as const

const guardrails = [
  'No public counterparty exposure',
  'No guaranteed access claims',
  'No live commercial-route claims',
  'Reviewed inquiry routing only',
] as const

const workflowSteps = [
  'Discover public context and available pathways.',
  'Submit a request, listing, opportunity or institutional inquiry.',
  'Harbourview reviews fit, sensitivity and routing requirements.',
  'Sensitive commercial, regulatory and counterparty details remain private.',
  'Qualified introductions, assessments or intelligence requests proceed only after review.',
] as const

const audiences = [
  'Doctors and pharmacists',
  'Importers and distributors',
  'Cultivators and operators',
  'QA, labs and compliance teams',
  'Procurement and buyers',
  'Regulators and institutions',
  'Investors and acquirers',
] as const

const pathwaySteps = [
  {
    title: 'Discover',
    body: 'Identify relevant access signals, reviewed opportunity categories and country-specific pathways.',
  },
  {
    title: 'Screen',
    body: 'Assess fit, counterparty context, licence-sensitive requirements and route viability before engagement.',
  },
  {
    title: 'Connect',
    body: 'Route qualified inquiries and introductions through controlled Harbourview review.',
  },
] as const

const publicSections = entryPoints.map((section) => ({
  ...section,
  eyebrow: 'Public route',
}))

export default function HomePage() {
  return (
    <main className="bg-[#01050d] text-white">
      <section className="relative isolate overflow-hidden border-b border-gold/10 bg-[#01050d] py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_22%,rgba(198,165,90,0.18),transparent_34%),linear-gradient(135deg,rgba(11,26,47,0.92)_0%,rgba(1,5,13,1)_72%)]" />
        <HarbourviewGlobeClientLoader />

        <div className="page-container relative z-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.98fr)_minmax(320px,0.72fr)] lg:items-end">
            <div className="max-w-4xl">
              <p className="hero-eyebrow">Commercial intelligence and controlled market access</p>

              <h1 className="font-serif text-5xl leading-[0.96] tracking-[-0.055em] text-gold-pale sm:text-6xl lg:text-7xl">
                Market access backed by intelligence and relationships.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                Harbourview connects controlled network access, reviewed intelligence,
                regulatory signals, compliance pathways, clinical education and confidential
                inquiry routes for serious participants in regulated cannabis markets.
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/52 sm:text-base">
                Public pages support discovery and context. Sensitive commercial detail stays
                inside reviewed workflows. The globe is a brand signal, not a live-data claim.
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

      <section className="border-b border-gold/10 py-14 sm:py-18 lg:py-20">
        <div className="page-container">
          <div className="mb-9 max-w-3xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/72">
              Public sections
            </p>

            <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f4f1eb] sm:text-4xl">
              Core Harbourview areas now visible from the homepage.
            </h2>

            <p className="mt-5 text-base leading-8 text-white/60">
              Harbourview is organized around controlled discovery, reviewed intelligence,
              professional education, compliance orientation, assessment pathways and
              institutional collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {primarySections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="group rounded-sm border border-gold/10 bg-[#071425] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.26)] transition hover:border-gold/30 hover:bg-[#091a30] sm:p-7"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-gold/70">
                  {section.eyebrow}
                </p>

                <h3 className="mt-4 font-serif text-3xl leading-tight tracking-[-0.03em] text-[#f4f1eb]">
                  {section.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-white/58 sm:text-base">
                  {section.description}
                </p>

                <span className="mt-6 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold/82 transition group-hover:text-gold">
                  {section.cta}
                  <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-gold/10 bg-[#030b16] py-14 sm:py-18 lg:py-20">
        <div className="page-container">
          <div className="grid gap-5 lg:grid-cols-3">
            {secondarySections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="rounded-sm border border-gold/10 bg-[#030b16] p-6 transition hover:border-gold/30 hover:bg-[#071425]"
              >
                <h3 className="font-serif text-2xl tracking-[-0.03em] text-[#f4f1eb]">
                  {section.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-white/56">{section.description}</p>

                <span className="mt-6 inline-flex text-xs font-semibold uppercase tracking-[0.2em] text-gold/78">
                  Open section →
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8 rounded-sm border border-gold/10 bg-[#061120] p-5 text-xs leading-6 text-white/44 sm:text-sm sm:leading-7">
            Harbourview provides commercial intelligence, controlled network access and reviewed
            inquiry pathways. Public content is informational and does not constitute legal,
            regulatory, medical, investment or compliance advice.
          </div>
        </div>
      </section>

      <section className="border-b border-gold/10 py-14 sm:py-18 lg:py-20">
        <div className="page-container grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-sm border border-gold/12 bg-[#071425] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.28)] sm:p-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/72">
              How Harbourview works
            </p>

            <h2 className="font-serif text-3xl tracking-[-0.04em] text-[#f5f1e8] sm:text-4xl">
              Reviewed access, not open-contact routing.
            </h2>

            <ol className="mt-7 space-y-4 text-sm leading-7 text-white/62">
              {workflowSteps.map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/24 text-[11px] text-gold">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-sm border border-gold/12 bg-[#071425] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.28)] sm:p-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/72">
              Who Harbourview serves
            </p>

            <h2 className="font-serif text-3xl tracking-[-0.04em] text-[#f5f1e8] sm:text-4xl">
              Built for serious regulated-market stakeholders.
            </h2>

            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {audiences.map((audience) => (
                <div
                  key={audience}
                  className="rounded-sm border border-gold/10 bg-black/20 px-4 py-3 text-sm text-white/66"
                >
                  {audience}
                </div>
              ))}
            </div>

            <p className="mt-7 text-sm leading-7 text-white/54">
              Harbourview does not publish confidential counterparty, source or
              transaction-sensitive information on public pages. Inquiries are reviewed before
              routing.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-gold/10 bg-[#01050d] py-12 text-white sm:py-16">
        <div className="page-container grid gap-4 md:grid-cols-3">
          {pathwaySteps.map((step) => (
            <article
              key={step.title}
              className="rounded-sm border border-gold/12 bg-white/[0.025] p-5 sm:p-6"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/80">
                {step.title}
              </p>

              <p className="mt-4 text-sm leading-7 text-white/60">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <PublicSection id="public-sections" tone="navy">
        <SectionHeader
          eyebrow="Available public sections"
          title="A controlled gateway to the live Harbourview routes."
        >
          The live site now surfaces the public sections clearly while preserving review-first
          positioning and avoiding overclaims.
        </SectionHeader>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {publicSections.map((section) => (
            <PublicLinkCard
              key={section.href}
              href={section.href}
              eyebrow={section.eyebrow}
              title={section.title}
            >
              {section.body}
            </PublicLinkCard>
          ))}
        </div>
      </PublicSection>

      <section className="py-14 sm:py-18">
        <div className="page-container">
          <div className="rounded-sm border border-gold/12 bg-[linear-gradient(135deg,rgba(11,26,47,0.96)_0%,rgba(3,11,22,0.98)_100%)] p-7 text-center shadow-[0_24px_70px_rgba(0,0,0,0.32)] sm:p-10">
            <h2 className="font-serif text-3xl tracking-[-0.04em] text-[#f5f1e8] sm:text-4xl">
              Start with the right Harbourview pathway.
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-white/62 sm:text-base">
              Request access, ask for intelligence, review public compliance orientation or begin a
              confidential commercial conversation. Harbourview reviews fit and handles sensitive
              information through controlled private workflows.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/contact" className="btn-marketplace justify-center px-6 py-3 text-sm">
                Contact Harbourview
              </Link>

              <Link href="/intake" className="btn-intelligence justify-center px-6 py-3 text-sm">
                Request Introduction
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
