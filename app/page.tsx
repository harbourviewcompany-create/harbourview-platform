import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Harbourview | Controlled Commercial Network Access',
  description:
    'Harbourview provides controlled public access to its network, intelligence, signals, compliance pathways and inquiry routes.',
}

const primarySections = [
  {
    title: 'Harbourview Network',
    href: '/marketplace',
    eyebrow: 'Network access',
    description: 'Explore reviewed opportunity categories, wanted requests and controlled submission paths.',
    cta: 'Enter Network',
  },
  {
    title: 'Intelligence',
    href: '/intelligence',
    eyebrow: 'Market review',
    description: 'Review country-level commercial intelligence and publication-controlled pathway context.',
    cta: 'Open Intelligence',
  },
  {
    title: 'Signals',
    href: '/signals',
    eyebrow: 'Policy movement',
    description: 'Review source-backed regulatory, policy and timing signals across controlled-market pathways.',
    cta: 'Review Signals',
  },
  {
    title: 'Compliance Pathways',
    href: '/compliance',
    eyebrow: 'Orientation only',
    description: 'Browse public-safe compliance orientation before jurisdiction-specific review.',
    cta: 'View Pathways',
  },
]

const secondarySections = [
  {
    title: 'Clinical Education',
    href: '/network/clinical-education',
    description: 'Access the public clinical education entry point for controlled-market context.',
  },
  {
    title: 'Contact Harbourview',
    href: '/contact',
    description: 'Start a confidential Harbourview conversation for commercial intelligence or network access.',
  },
  {
    title: 'Request Introduction',
    href: '/intake',
    description: 'Use the controlled intake path when a commercial request needs review before routing.',
  },
]

const guardrails = [
  'No public counterparty exposure',
  'No guaranteed access claims',
  'No live deal-flow claims',
  'Reviewed inquiry routing only',
]

export default function HomePage() {
  return (
    <main className="bg-[#01050d] text-white">
      <section className="relative isolate overflow-hidden border-b border-gold/10 bg-[#01050d] py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_22%,rgba(198,165,90,0.18),transparent_34%),linear-gradient(135deg,rgba(11,26,47,0.92)_0%,rgba(1,5,13,1)_72%)]" />
        <div className="page-container">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.98fr)_minmax(320px,0.72fr)] lg:items-end">
            <div className="max-w-4xl">
              <p className="hero-eyebrow">Commercial intelligence and controlled market access</p>
              <h1 className="font-serif text-5xl leading-[0.96] tracking-[-0.055em] text-gold-pale sm:text-6xl lg:text-7xl">
                Market access backed by intelligence and relationships.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                Harbourview connects controlled network access, reviewed intelligence, regulatory signals,
                compliance pathways, clinical education and confidential inquiry routes.
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/52 sm:text-base">
                Public pages support discovery and context. Sensitive commercial information is handled through reviewed private workflows.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/marketplace" className="btn-marketplace justify-center">
                  <span>Enter Network</span>
                  <span className="text-xl leading-none">→</span>
                </Link>
                <Link href="/intelligence" className="btn-intelligence justify-center">
                  <span>Open Intelligence</span>
                  <span className="text-xl leading-none">→</span>
                </Link>
              </div>
            </div>
            <aside className="rounded-sm border border-gold/14 bg-[#04101e]/78 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.38)] backdrop-blur-md sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/78">Public gateway</p>
              <h2 className="mt-4 font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f4f1eb]">
                Available sections are open for review.
              </h2>
              <div className="mt-6 grid gap-3">
                {guardrails.map((guardrail) => (
                  <div key={guardrail} className="rounded-sm border border-gold/10 bg-white/[0.035] px-4 py-3 text-sm text-white/66">
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
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/72">Public sections</p>
            <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f4f1eb] sm:text-4xl">
              Core Harbourview areas now visible from the homepage.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {primarySections.map((section) => (
              <Link key={section.href} href={section.href} className="group rounded-sm border border-gold/10 bg-[#071425] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.26)] transition hover:border-gold/34 hover:bg-[#091a30] sm:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-gold/70">{section.eyebrow}</p>
                <h3 className="mt-4 font-serif text-3xl leading-tight tracking-[-0.03em] text-[#f4f1eb]">{section.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/58 sm:text-base">{section.description}</p>
                <span className="mt-6 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold/82 transition group-hover:text-gold">
                  {section.cta}
                  <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-18 lg:py-20">
        <div className="page-container">
          <div className="grid gap-5 lg:grid-cols-3">
            {secondarySections.map((section) => (
              <Link key={section.href} href={section.href} className="rounded-sm border border-gold/10 bg-[#030b16] p-6 transition hover:border-gold/34 hover:bg-[#071425]">
                <h3 className="font-serif text-2xl tracking-[-0.03em] text-[#f4f1eb]">{section.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/56">{section.description}</p>
                <span className="mt-6 inline-flex text-xs font-semibold uppercase tracking-[0.2em] text-gold/78">Open section →</span>
              </Link>
            ))}
          </div>
          <div className="mt-8 rounded-sm border border-gold/10 bg-[#061120] p-5 text-xs leading-6 text-white/44 sm:text-sm sm:leading-7">
            Harbourview provides commercial intelligence, controlled network access and reviewed inquiry pathways. Public content is informational and does not constitute legal, regulatory or compliance advice.
          </div>
        </div>
      </section>
    </main>
  )
}
