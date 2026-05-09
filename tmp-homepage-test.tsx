import Link from 'next/link'
import type { Metadata } from 'next'

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

      <PublicSection tone="navy">
        <SectionHeader eyebrow="Public sections" title="Start from the right Harbourview entry point.">
          Each section is structured for controlled discovery and reviewed routing.
        </SectionHeader>

        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {primarySections.map((section) => (
            <PublicLinkCard
              key={section.href}
              href={section.href}
              eyebrow={section.eyebrow}
              title={section.title}
            >
              <span className="block">{section.description}</span>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold/78">
                {section.cta}
                <span aria-hidden="true">→</span>
              </span>
            </PublicLinkCard>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {secondarySections.map((section) => (
            <PublicLinkCard key={section.href} href={section.href} eyebrow="Supporting route" title={section.title}>
              {section.description}
            </PublicLinkCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="How Harbourview works" title="Discovery stays public. Routing stays controlled.">
          Harbourview supports discovery without exposing sensitive commercial detail on public pages.
        </SectionHeader>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          <PublicCard className="p-6 sm:p-7">
            <ol className="space-y-4">
              {workflowSteps.map((step, index) => (
                <li
                  key={step}
                  className="grid gap-3 border-b border-gold/10 pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[44px_minmax(0,1fr)]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/16 bg-gold/10 font-semibold text-gold-light">
                    {index + 1}
                  </div>
                  <p className="pt-1 text-sm leading-7 text-white/68 sm:text-base">{step}</p>
                </li>
              ))}
            </ol>
          </PublicCard>

          <PublicCard muted className="p-6 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/74">
              Operating boundary
            </p>
            <h3 className="mt-4 font-serif text-2xl leading-tight tracking-[-0.03em] text-[#f5f1e8]">
              Public-safe by default.
            </h3>
            <div className="mt-6 space-y-3">
              {guardrails.map((guardrail) => (
                <div
                  key={guardrail}
                  className="rounded-sm border border-gold/10 bg-white/[0.035] px-4 py-3 text-sm text-white/66"
                >
                  {guardrail}
                </div>
              ))}
            </div>
          </PublicCard>
        </div>
      </PublicSection>

      <PublicSection tone="navy">
        <SectionHeader eyebrow="Qualified audiences" title="Built for serious participants across regulated-market pathways.">
          Harbourview supports disciplined commercial discovery for operators, institutions and market-access stakeholders.
        </SectionHeader>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <PublicCard className="p-6 sm:p-7">
            <div className="flex flex-wrap gap-3">
              {audiences.map((audience) => (
                <span
                  key={audience}
                  className="inline-flex rounded-full border border-gold/12 bg-white/[0.03] px-4 py-2 text-sm text-white/68"
                >
                  {audience}
                </span>
              ))}
            </div>
          </PublicCard>

          <div className="grid gap-5 md:grid-cols-3">
            {pathwaySteps.map((step) => (
              <PublicCard key={step.title} className="p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/72">
                  {step.title}
                </p>
                <p className="mt-4 text-sm leading-7 text-white/62">{step.body}</p>
              </PublicCard>
            ))}
          </div>
        </div>
      </PublicSection>

      <FooterCta
        eyebrow="Confidential next step"
        title="Use Harbourview through the correct route from the start."
        actions={[
          { label: 'Enter Network', href: '/marketplace' },
          { label: 'Request Introduction', href: '/intake', variant: 'secondary' },
        ]}
      >
        Begin with the public section that matches your objective, then move into reviewed
        intake or intelligence workflows when the request becomes commercially sensitive.
      </FooterCta>
    </main>
  )
}
