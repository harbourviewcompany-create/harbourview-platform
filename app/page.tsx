import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { HarbourviewGlobeClientLoader } from '@/components/harbourview/globe/HarbourviewGlobeClientLoader'
import HarbourviewGlobeRouteController from '@/components/harbourview/globe/HarbourviewGlobeRouteController'
import { PublicCard, PublicLinkCard, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Harbourview | Controlled Market Access Intelligence',
  description:
    'Harbourview provides reviewed commercial intelligence, controlled network access and confidential inquiry routing for serious participants in regulated cannabis markets.',
  openGraph: {
    title: 'Harbourview | Controlled Market Access Intelligence',
    description:
      'Reviewed commercial intelligence, controlled network access and confidential inquiry routing for regulated-market participants.',
  },
}

const gatewayControls = [
  'No public counterparty exposure',
  'No guaranteed access claims',
  'No live commercial-route claims',
  'Reviewed inquiry routing only',
] as const

const publicSections = [
  {
    eyebrow: 'Network access',
    title: 'Harbourview Network',
    href: '/network',
    action: 'Enter Network',
    body: 'Explore controlled commercial discovery across listings, wanted requests, reviewed categories and inquiry pathways.',
  },
  {
    eyebrow: 'Market review',
    title: 'Intelligence',
    href: '/intelligence',
    action: 'Open Intelligence',
    body: 'Review country-level commercial intelligence and publication-controlled pathway context.',
  },
  {
    eyebrow: 'Policy movement',
    title: 'Signals',
    href: '/signals',
    action: 'Review Signals',
    body: 'Review source-backed regulatory, policy and timing signals across controlled-market pathways.',
  },
  {
    eyebrow: 'Orientation only',
    title: 'Compliance Pathways',
    href: '/compliance',
    action: 'View Pathways',
    body: 'Browse public-safe compliance orientation before jurisdiction-specific review.',
  },
  {
    eyebrow: 'Clinical context',
    title: 'Clinical Education',
    href: '/education',
    action: 'Open Section',
    body: 'Access the public clinical education entry point for controlled-market context.',
  },
  {
    eyebrow: 'Confidential intake',
    title: 'Contact Harbourview',
    href: '/contact',
    action: 'Open Section',
    body: 'Start a confidential Harbourview conversation for commercial intelligence or network access.',
  },
  {
    eyebrow: 'Reviewed routing',
    title: 'Request Introduction',
    href: '/reviewed-connections',
    action: 'Open Section',
    body: 'Use the controlled intake path when a commercial request needs review before routing.',
  },
] as const

const howItWorks = [
  'Discover public context and available pathways.',
  'Submit a request, listing, opportunity or institutional inquiry.',
  'Harbourview reviews fit, sensitivity and routing requirements.',
  'Sensitive commercial, regulatory and counterparty details remain private.',
  'Qualified introductions, assessments or intelligence requests proceed only after review.',
] as const

const servedStakeholders = [
  'Doctors and pharmacists',
  'Importers and distributors',
  'Cultivators and operators',
  'QA, labs and compliance teams',
  'Procurement and buyers',
  'Regulators and institutions',
  'Investors and acquirers',
] as const

const reviewModel = [
  {
    label: 'Discover',
    body: 'Identify relevant access signals, reviewed opportunity categories and country-specific pathways.',
  },
  {
    label: 'Screen',
    body: 'Assess fit, counterparty context, licence-sensitive requirements and route viability before engagement.',
  },
  {
    label: 'Connect',
    body: 'Route qualified inquiries and introductions through controlled Harbourview review.',
  },
] as const

export default function HomePage() {
  return (
    <main className="bg-[#01050d] text-white">
      <section className="relative isolate overflow-hidden border-b border-gold/10 bg-[#01050d] py-10 sm:py-16 lg:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_22%,rgba(198,165,90,0.16),transparent_30%),linear-gradient(135deg,rgba(11,26,47,0.92)_0%,rgba(1,5,13,1)_72%)]" />
        <HarbourviewGlobeClientLoader />
        <Suspense fallback={null}>
          <HarbourviewGlobeRouteController />
        </Suspense>

        <div className="page-container relative z-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.58fr)] lg:items-end">
            <div className="max-w-5xl">
              <p className="hero-eyebrow max-w-[20rem] text-[10px] leading-[1.85] sm:max-w-none sm:text-[11px]">
                Commercial intelligence and controlled market access
              </p>

              <h1 className="max-w-[23rem] font-serif text-[clamp(3.1rem,14.2vw,4.25rem)] leading-[0.94] tracking-[-0.06em] text-gold-pale sm:max-w-5xl sm:text-6xl lg:text-7xl">
                Market access backed by intelligence and relationships.
              </h1>

              <div className="mt-6 max-w-[23rem] space-y-4 text-[15px] leading-[1.72] text-white/76 sm:max-w-3xl sm:text-lg sm:leading-8">
                <p>
                  Harbourview connects controlled network access, reviewed intelligence, regulatory signals, compliance pathways, clinical education and confidential inquiry routes for serious participants in regulated cannabis markets.
                </p>

                <p className="text-white/66">
                  Public pages support discovery and context. Sensitive commercial, regulatory and counterparty details stay inside reviewed workflows. The globe is a brand signal, not a live-data claim.
                </p>
              </div>

              <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
                <Link href="/network" className="btn-marketplace min-h-[62px] justify-center px-5 text-center text-[12px] sm:min-h-[56px]">
                  <span>Enter Network</span>
                  <span className="text-xl leading-none">→</span>
                </Link>

                <Link href="/intelligence" className="btn-intelligence min-h-[62px] justify-center px-5 text-center text-[12px] sm:min-h-[56px]">
                  <span>Request Intelligence</span>
                  <span className="text-xl leading-none">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicSection id="public-sections" tone="dark" className="py-12 sm:py-16">
        <SectionHeader
          eyebrow="Full-platform map"
          title="The public site routes into every major Harbourview pillar."
        >
          Explore Harbourview by role, market, commercial intent, source methodology, education, governance and reviewed connection pathways while sensitive evidence and counterparty detail remain protected.
        </SectionHeader>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {publicSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(8,22,39,0.96)_0%,rgba(4,13,25,0.99)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition-all duration-200 hover:border-gold/30 hover:bg-[#0b1626] sm:p-7"
            >
              <p className="mb-7 text-[10px] font-semibold uppercase tracking-[0.34em] text-gold/66">{section.eyebrow}</p>
              <h3 className="font-serif text-[2.55rem] leading-[0.98] tracking-[-0.055em] text-[#f5f1e8] sm:text-5xl lg:text-4xl">
                {section.title}
              </h3>
              <p className="mt-6 text-[15px] leading-[1.75] text-white/72 sm:text-base">{section.body}</p>
              <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/88 transition-colors group-hover:text-gold">
                {section.action}
                <span aria-hidden="true" className="ml-3 text-lg leading-none">→</span>
              </p>
            </Link>
          ))}
        </div>

        <PublicCard muted className="mt-8 p-6 sm:p-8">
          <p className="text-[15px] leading-[1.85] text-white/72 sm:text-base">
            Harbourview provides commercial intelligence, controlled network access and reviewed inquiry pathways. Public content is informational and does not constitute legal, regulatory, medical, investment or compliance advice.
          </p>
        </PublicCard>
      </PublicSection>

      <PublicSection id="reviewed-access" tone="navy" className="py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <PublicCard className="border-white/72 p-6 sm:border-gold/10 sm:p-8">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.34em] text-white/86">
              How Harbourview works
            </p>
            <h2 className="font-serif text-[2.6rem] leading-[1.02] tracking-[-0.055em] text-[#f5f1e8] sm:text-5xl">
              Reviewed access, not open-contact routing.
            </h2>

            <ol className="mt-8 grid gap-6">
              {howItWorks.map((item, index) => (
                <li key={item} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 text-[15px] leading-[1.75] text-white/76 sm:text-base">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/72 text-sm text-gold/86">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </PublicCard>

          <PublicCard className="border-white/72 p-6 sm:border-gold/10 sm:p-8">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.34em] text-white/86">
              Who Harbourview serves
            </p>
            <h2 className="font-serif text-[2.6rem] leading-[1.02] tracking-[-0.055em] text-[#f5f1e8] sm:text-5xl">
              Built for serious regulated-market stakeholders.
            </h2>

            <div className="mt-8 grid gap-3">
              {servedStakeholders.map((stakeholder) => (
                <div key={stakeholder} className="rounded-sm border border-gold/10 bg-black/16 px-4 py-4 text-[15px] leading-7 text-white/78 sm:text-base">
                  {stakeholder}
                </div>
              ))}
            </div>

            <p className="mt-8 text-[15px] leading-[1.85] text-white/72 sm:text-base">
              Harbourview does not publish confidential counterparty, source or transaction-sensitive information on public pages. Inquiries are reviewed before routing.
            </p>
          </PublicCard>
        </div>
      </PublicSection>

      <PublicSection id="review-model" tone="dark" className="py-12 sm:py-16">
        <div className="grid gap-5 lg:grid-cols-3">
          {reviewModel.map((step) => (
            <PublicCard key={step.label} className="border-white/72 p-6 sm:border-gold/10 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-gold/66">{step.label}</p>
              <p className="mt-6 text-[15px] leading-[1.85] text-white/56 sm:text-base">
                {step.body}
              </p>
            </PublicCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection id="available-routes" tone="navy" className="py-12 sm:py-16">
        <SectionHeader
          eyebrow="Available public sections"
          title="A controlled gateway to the live Harbourview routes."
        >
          The live site surfaces public sections clearly while preserving review-first positioning and avoiding overclaims.
        </SectionHeader>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {availableRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="group rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition-all duration-200 hover:border-gold/30 hover:bg-[#0b1626]"
            >
              <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.26em] text-gold/68">Public section</p>
              <div className="mb-7 h-px w-16 bg-gradient-to-r from-gold to-gold-light opacity-80 transition-opacity group-hover:opacity-100" />
              <h3 className="text-2xl font-semibold text-[#f5f1e8]">{route.title}</h3>
              <p className="mt-5 text-sm leading-7 text-white/64">{route.body}</p>
            </Link>
          ))}
        </div>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/network" className="btn-marketplace justify-center px-6 py-3 text-sm">
            Enter Network
          </Link>

          <Link href="/intake" className="btn-intelligence justify-center px-6 py-3 text-sm">
            Speak Confidentially
          </Link>
        </div>
      </PublicSection>
    </main>
  )
}
