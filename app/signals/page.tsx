import type { Metadata } from 'next'

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
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Signals</h1>
          <p className="text-gray-300 max-w-2xl">
            Global policy and regulatory change monitoring for regulated
            cannabis, hemp/CBD and adjacent controlled-market pathways.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container space-y-6">
          {signals.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
              No published regulatory signals yet.
            </div>
          )}

          {signals.map((signal) => (
            <article
              key={signal.id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-navy">
                {signal.headline}
              </h2>
              <div className="mt-1 text-xs text-gray-500">
                {signal.country_name} • {signal.signal_type} •{' '}
                {signal.signal_date}
              </div>
              <p className="mt-3 text-sm text-gray-700">
                {signal.public_summary}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {signal.public_implication}
              </p>
              {signal.canonical_source_url && (
                <a
                  href={signal.canonical_source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-xs font-medium text-navy underline"
                >
                  View source
                </a>
              )}
            </article>
          ))}

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <h2 className="mb-3 text-xl font-bold text-navy">
              Request Signals Access
            </h2>
            <p className="mx-auto mb-6 max-w-2xl text-sm text-gray-500">
              Request early access to dated, source-backed regulatory monitoring
              for market access, compliance strategy and commercial timing.
            </p>
            <form className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row sm:items-end">
              <label htmlFor="signals-email" className="sr-only">
                Get notified when this launches
              </label>
              <input
                id="signals-email"
                name="email"
                type="email"
                placeholder="Get notified when this launches"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
              />
              <button type="submit" className="btn-primary shrink-0 px-6 py-2 text-sm">
                Notify Me
              </button>
            </form>
          </div>

          <div className="text-xs leading-relaxed text-gray-500">
            {REGULATORY_SIGNALS_DISCLAIMER}
          </div>
        </div>
      </section>
    </main>
  )
}