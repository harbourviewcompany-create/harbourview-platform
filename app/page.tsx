import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

const guardrails = [
  'No public counterparty exposure',
  'No guaranteed access claims',
  'No live deal-flow claims',
  'Reviewed inquiry routing only',
]

const sections = [
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
]

export const metadata: Metadata = {
  title: 'Harbourview | Market Access Backed by Intelligence and Relationships',
  description:
    'Harbourview provides controlled network access, reviewed intelligence and market-access support for serious regulated-market participants.',
}

export default function HomePage() {
  return (
    <main className="bg-[#01050d] text-white">
      <section className="relative isolate overflow-hidden border-b border-gold/10 bg-[#01050d] py-16 sm:py-20 lg:py-24">
        <Image
          src="/assets/harbourview-globe-hero-v2.svg"
          alt="Harbourview gold globe and lighthouse visual"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(1,5,13,0.96)_0%,rgba(1,5,13,0.84)_44%,rgba(1,5,13,0.44)_72%,rgba(1,5,13,0.86)_100%),linear-gradient(180deg,rgba(1,5,13,0.22)_0%,rgba(1,5,13,0.82)_100%)]" />

        <div className="page-container">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.98fr)_minmax(320px,0.72fr)] lg:items-end">
            <div className="max-w-4xl">
              <p className="hero-eyebrow">Commercial intelligence and controlled market access</p>
              <h1 className="font-serif text-5xl leading-[0.96] tracking-[-0.055em] text-gold-pale sm:text-6xl lg:text-7xl">
                Market access backed by intelligence and relationships.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                Harbourview connects controlled network access, reviewed intelligence, regulatory signals, compliance pathways, clinical education and confidential inquiry routes.
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/52 sm:text-base">
                Public pages support discovery and context. Contact details, counterparties, route assessments and transaction-sensitive information are handled through reviewed private workflows.
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/78">Public gateway</p>
              <h2 className="mt-4 font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f4f1eb]">Available sections are open for review.</h2>
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
            <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f4f1eb] sm:text-4xl">Core Harbourview areas now visible from the homepage.</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {sections.map((section) => (
              <Link key={section.href} href={section.href} className="group rounded-sm border border-gold/10 bg-[#071425] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.26)] transition hover:border-gold/34 hover:bg-[#091a30] sm:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-gold/70">{section.eyebrow}</p>
                <h3 className="mt-4 font-serif text-3xl leading-tight tracking-[-0.03em] text-[#f4f1eb]">{section.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/58 sm:text-base">{section.body}</p>
                <span className="mt-6 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold/82 transition group-hover:text-gold">Open section →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-18">
        <div className="page-container">
          <div className="rounded-sm border border-gold/12 bg-[linear-gradient(135deg,rgba(11,26,47,0.96)_0%,rgba(3,11,22,0.98)_100%)] p-7 text-center shadow-[0_24px_70px_rgba(0,0,0,0.32)] sm:p-10">
            <h2 className="font-serif text-3xl tracking-[-0.04em] text-[#f5f1e8] sm:text-4xl">Start with the right Harbourview pathway.</h2>
            <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-white/62 sm:text-base">Request access, ask for intelligence, review public compliance orientation or begin a confidential commercial conversation.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/contact" className="btn-marketplace justify-center px-6 py-3 text-sm">Contact Harbourview</Link>
              <Link href="/intake" className="btn-intelligence justify-center px-6 py-3 text-sm">Request Introduction</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
