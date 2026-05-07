import type { Metadata } from 'next'
import Link from 'next/link'

import { REGULATORY_SIGNALS_DISCLAIMER } from '@/lib/regulatory-signals/constants'
import { getPublicRegulatorySignals } from '@/lib/regulatory-signals/public'

export const metadata: Metadata = {
  title: 'Signals | Harbourview',
  description:
    'Global policy and regulatory change monitoring for regulated cannabis, hemp/CBD and adjacent controlled-market pathways.',
}

export default async function SignalsPage() {
  const signals = await getPublicRegulatorySignals()

  return (
    <main>
      <section className="border-b border-gold/10 bg-[#061120] py-16 text-white sm:py-20 lg:py-24">
        <div className="page-container">
          <div className="max-w-4xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/78">
              Harbourview Signals
            </p>
            <h1 className="font-serif text-4xl leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              Regulatory and policy change signals for controlled markets.
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-white/64 sm:text-lg">
              Source-backed monitoring for regulated cannabis, hemp/CBD and adjacent
              controlled-market pathways. Public summaries are informational only and
              do not guarantee market access, import eligibility or regulatory outcome.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/contact" className="btn-marketplace justify-center">
                Request Signal Review
              </Link>
              <Link href="/intelligence" className="btn-intelligence justify-center">
                Intelligence Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#020814] py-14 sm:py-20">
        <div className="page-container space-y-6">
          {signals.length === 0 && (
            <div className="rounded-sm border border-gold/10 bg-[#071425] p-7 text-sm leading-7 text-white/58 shadow-[0_18px_50px_rgba(0,0,0,0.26)]">
              No published regulatory signals yet. Harbourview can review a country,
              policy update or commercial pathway on request.
            </div>
          )}

          {signals.map((signal) => (
            <article
              key={signal.id}
              className="rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.28)]"
            >
              <h2 className="text-lg font-semibold text-[#f4f1eb]">{signal.headline}</h2>
              <div className="mt-2 text-xs uppercase tracking-[0.18em] text-gold/66">
                {signal.country_name} • {signal.signal_type} • {signal.signal_date}
              </div>
              <p className="mt-4 text-sm leading-7 text-white/66">{signal.public_summary}</p>
              <p className="mt-3 text-sm leading-7 text-white/50">{signal.public_implication}</p>
              {signal.canonical_source_url && (
                <a
                  href={signal.canonical_source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-xs font-semibold uppercase tracking-[0.16em] text-gold underline decoration-gold/40 underline-offset-4"
                >
                  View source
                </a>
              )}
            </article>
          ))}

          <div className="rounded-sm border border-gold/10 bg-[#071425] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.26)] sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
                  Request Signals Access
                </p>
                <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-[#f4f1eb] sm:text-4xl">
                  Need a dated, source-backed signal assessed?
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/58 sm:text-base">
                  Request review for market access, compliance strategy, commercial
                  timing or country-specific pathway monitoring.
                </p>
              </div>
              <Link href="/contact" className="btn-marketplace justify-center">
                Request Review
              </Link>
            </div>
          </div>

          <div className="rounded-sm border border-gold/10 bg-[#030b16] p-5 text-xs leading-6 text-white/44">
            {REGULATORY_SIGNALS_DISCLAIMER}
          </div>
        </div>
      </section>
    </main>
  )
}