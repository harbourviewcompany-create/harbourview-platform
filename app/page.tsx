import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { PublicLinkCard, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Harbourview | Market Access Intelligence and Commercial Network',
  description:
    'Harbourview provides controlled commercial intelligence, network access and reviewed inquiry pathways for serious participants in regulated cannabis and adjacent supply chains.',
  openGraph: {
    title: 'Harbourview | Market Access Intelligence and Commercial Network',
    description:
      'Controlled commercial intelligence, network access and reviewed inquiry pathways for serious participants in regulated cannabis and adjacent supply chains.',
  },
}

const publicSections = [
  {
    title: 'Harbourview Network',
    href: '/marketplace',
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
    title: 'Request Introduction',
    href: '/intake',
    eyebrow: 'Reviewed intake',
    body: 'Submit a confidential request for Harbourview review before any private routing or counterparty contact.',
  },
]

export default function HomePage() {
  return (
    <>
      <section className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden bg-[#01050d] text-white sm:min-h-[calc(100svh-80px)]">
        <Image
          src="/assets/harbourview-coming-soon-placeholder.svg"
          alt="Harbourview visual with gold globe and lighthouse"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />

        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(1,5,13,0.82)_0%,rgba(1,5,13,0.55)_48%,rgba(1,5,13,0.16)_76%),linear-gradient(180deg,rgba(1,5,13,0.16)_0%,rgba(1,5,13,0.28)_58%,rgba(1,5,13,0.82)_100%)]" />

        <div className="page-container flex min-h-[calc(100svh-72px)] items-end pb-9 pt-20 sm:min-h-[calc(100svh-80px)] sm:pb-12 lg:items-center lg:pb-0 lg:pt-10">
          <div className="max-w-2xl rounded-sm border border-gold/18 bg-[#01060f]/76 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.48)] backdrop-blur-md sm:p-8 lg:mt-[10vh]">
            <p className="mb-4 text-[10px] font-semibold uppercase leading-6 tracking-[0.34em] text-gold/82 sm:text-[11px]">
              Commercial intelligence and controlled network access
            </p>

            <h1 className="font-serif text-[2.65rem] leading-[0.99] tracking-[-0.05em] text-gold-pale sm:text-5xl lg:text-6xl">
              Market access backed by intelligence and relationships.
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-white/72 sm:text-base">
              Harbourview supports serious participants in regulated cannabis and adjacent supply chains through reviewed commercial pathways, public-safe intelligence and controlled inquiry handling.
            </p>

            <p className="mt-4 max-w-xl text-xs leading-6 text-white/54 sm:text-sm">
              Public pages expose controlled summaries only. Contact details, counterparties, transaction-sensitive information and internal review context are not published publicly.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/marketplace" className="btn-marketplace min-w-0 justify-center sm:min-w-[220px]">
                <span>Enter Harbourview Network</span>
                <span className="text-xl leading-none">→</span>
              </Link>

              <Link href="/intelligence" className="btn-intelligence min-w-0 justify-center sm:min-w-[220px]">
                <span>Request Intelligence</span>
                <span className="text-xl leading-none">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicSection id="public-sections" tone="navy">
        <SectionHeader
          eyebrow="Available public sections"
          title="A controlled gateway to the live Harbourview routes."
        >
          The live site now surfaces the public sections clearly while preserving review-first positioning and avoiding overclaims.
        </SectionHeader>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {publicSections.map((section) => (
            <PublicLinkCard key={section.href} href={section.href} eyebrow={section.eyebrow} title={section.title}>
              {section.body}
            </PublicLinkCard>
          ))}
        </div>
      </PublicSection>
    </>
  )
}
