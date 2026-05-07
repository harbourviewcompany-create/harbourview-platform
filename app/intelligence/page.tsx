import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Intelligence',
  description:
    'Commercial briefs, counterparty dossiers, and route-to-market analysis for operators, investors, and advisors in regulated markets.',
}

const intelligenceCards = [
  {
    title: 'Commercial Briefs',
    body: 'Structured analysis of market segments, regulatory environments and commercial opportunity in targeted regulated markets.',
  },
  {
    title: 'Counterparty Dossiers',
    body: 'Background and commercial assessment of prospective buyers, sellers and partners prior to introduction.',
  },
  {
    title: 'Route-to-Market Analysis',
    body: 'Assessment of market entry pathways, distribution channels and commercial positioning for operators entering new markets.',
  },
  {
    title: 'Bespoke Engagements',
    body: 'Custom research and advisory engagements for investors, operators and advisors with specific intelligence requirements.',
  },
]

export default function IntelligencePage() {
  return (
    <>
      <section className="border-b border-gold/10 bg-[#061120] py-16 text-white sm:py-20 lg:py-24">
        <div className="page-container">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="max-w-4xl">
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/78">
                Harbourview Intelligence
              </p>
              <h1 className="font-serif text-4xl leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
                Commercial intelligence for controlled market access decisions.
              </h1>
              <p className="mt-7 max-w-3xl text-base leading-8 text-white/64 sm:text-lg">
                Source-backed briefs, counterparty context and route-to-market
                analysis prepared for operators, investors and advisors evaluating
                regulated commercial opportunities and adjacent supply-chain pathways.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/contact" className="btn-marketplace justify-center">
                  Request Intelligence
                </Link>
                <Link href="/signals" className="btn-intelligence justify-center">
                  View Signals
                </Link>
              </div>
            </div>
            <aside className="rounded-sm border border-gold/12 bg-[linear-gradient(180deg,rgba(8,18,30,0.96)_0%,rgba(4,10,18,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
                Claim discipline
              </p>
              <p className="text-sm leading-7 text-white/58">
                Intelligence outputs are reviewed before use. Harbourview does not
                guarantee availability, introductions, pricing, transaction terms or
                regulatory outcomes.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-[#020814] py-14 sm:py-20">
        <div className="page-container">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-7">
            {intelligenceCards.map((card) => (
              <div
                key={card.title}
                className="rounded-sm border border-gold/12 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.28)]"
              >
                <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light"></div>
                <h3 className="mb-4 text-lg font-semibold text-[#f3efe7]">{card.title}</h3>
                <p className="text-sm leading-7 text-white/62">{card.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-sm border border-gold/10 bg-[#071425] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.26)] sm:mt-16 sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
                  Confidential engagement
                </p>
                <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-[#f4f1eb] sm:text-4xl">
                  Request a focused intelligence briefing.
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/58 sm:text-base">
                  Use this path for market-entry questions, counterparty screening,
                  country-specific access review, supplier route assessment or a
                  commercial signal requiring source-backed context.
                </p>
              </div>
              <Link href="/contact" className="btn-marketplace justify-center">
                Contact Harbourview
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
