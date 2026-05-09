import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { PublicLinkCard, PublicSection, SectionHeader } from '@/components/PublicUi'

const primarySections = [
  {
    title: 'Harbourview Network',
    href: '/network',
    eyebrow: 'Network access',
    description:
      'Explore controlled commercial discovery across listings, wanted requests, suppliers and reviewed inquiry pathways.',
    cta: 'Enter Network',
  },
  {
    title: 'Intelligence',
    href: '/intelligence',
    eyebrow: 'Country and pathway review',
    description:
      'Review country-level commercial intelligence, route viability summaries and publication-controlled market-access context.',
    cta: 'Open Intelligence',
  },
  {
    title: 'Signals',
    href: '/signals',
    eyebrow: 'Policy movement',
    description:
      'Request source-backed review of regulatory, policy and commercial timing signals across controlled-market pathways.',
    cta: 'Review Signals',
  },
  {
    title: 'Compliance Pathways',
    href: '/compliance',
    eyebrow: 'Orientation only',
    description:
      'Browse public-safe regional compliance orientation for regulated cannabis operators before jurisdiction-specific review.',
    cta: 'View Pathways',
  },
]

const secondarySections = [
  {
    title: 'Clinical Education',
    href: '/network/clinical-education',
    description:
      'Access the public clinical education entry point for controlled cannabis-market context and stakeholder education.',
  },
  {
    title: 'Contact Harbourview',
    href: '/contact',
    description:
      'Start a confidential Harbourview conversation for commercial intelligence, network access or market-entry support.',
  },
  {
    title: 'Request Introduction',
    href: '/intake',
    description:
      'Use the controlled intake path when a commercial request needs review before any routing or introduction.',
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

const guardrails = [
  'No public counterparty exposure',
  'No guaranteed access claims',
  'No live deal-flow claims',
  'Reviewed inquiry routing only',
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
    href: '/network',
    eyebrow: 'Commercial network',
    body: 'Explore reviewed categories for products, inputs, services, wanted requests and commercial access pathways.',
  },
  {
    title: 'Intelligence',
    href: '/intelligence',
    eyebrow: 'Country pathway review',
    body: 'Review public-safe intelligence panels, market pathway context and controlled country-level summaries.',
  },
  {
    title: 'Signals',
    href: '/signals',
    eyebrow: 'Policy monitoring',
    body: 'Track source-backed regulatory and policy movement without fake live-claim positioning.',
  },
  {
    title: 'Compliance Pathways',
    href: '/compliance',
    eyebrow: 'Orientation only',
    body: 'Use public compliance orientation pages for pathway context, not legal advice or guaranteed eligibility.',
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

export default function HomePage() {
  return (
    <section className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden bg-[#01050d] text-white sm:min-h-[calc(100svh-80px)]">
      <Image
        src="/assets/harbourview-globe-hero-realistic.webp"
        alt="Harbourview realistic dark navy and gold globe visual"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
      />

      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(1,5,13,0.72)_0%,rgba(1,5,13,0.42)_42%,rgba(1,5,13,0.12)_72%),linear-gradient(180deg,rgba(1,5,13,0.1)_0%,rgba(1,5,13,0.18)_58%,rgba(1,5,13,0.74)_100%)]" />

      <div className="page-container flex min-h-[calc(100svh-72px)] items-end pb-10 pt-20 sm:min-h-[calc(100svh-80px)] sm:pb-12 lg:items-center lg:pb-0 lg:pt-10">
        <div className="max-w-xl rounded-sm border border-gold/18 bg-[#01060f]/72 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.48)] backdrop-blur-md sm:p-7 lg:ml-0 lg:mt-[18vh]">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.34em] text-gold/82 sm:text-[11px]">
            Harbourview platform staging
          </p>

          <h1 className="font-serif text-4xl leading-[0.98] tracking-[-0.045em] text-gold-pale sm:text-5xl lg:text-6xl">
            Full site opening soon.
          </h1>

          <p className="mt-5 max-w-lg text-sm leading-7 text-white/72 sm:text-base">
            Harbourview is preparing controlled commercial intelligence, network access and reviewed
            inquiry pathways for serious participants in regulated cannabis and adjacent supply chains.
          </p>

          <p className="mt-4 max-w-lg text-xs leading-6 text-white/54 sm:text-sm">
            Inquiries are reviewed before routing. Contact details, counterparties and
            transaction-sensitive information are not published publicly.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/contact" className="btn-marketplace min-w-0 justify-center sm:min-w-[210px]">
              <span>Contact Harbourview</span>
              <span className="text-xl leading-none">→</span>
            </Link>

            <Link href="/marketplace" className="btn-intelligence min-w-0 justify-center sm:min-w-[210px]">
              <span>Preview Network</span>
              <span className="text-xl leading-none">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
