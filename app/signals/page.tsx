import { getPublicRegulatorySignals } from '@/lib/regulatory-signals/public'
import { REGULATORY_SIGNALS_DISCLAIMER } from '@/lib/regulatory-signals/constants'

export default async function SignalsPage() {
  const signals = await getPublicRegulatorySignals()

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold mb-4">Signals</h1>
      <p className="text-sm text-neutral-500 mb-8">
        Global policy and regulatory change monitoring for regulated cannabis, hemp/CBD and adjacent controlled-market pathways.
      </p>

      <div className="space-y-6">
        {signals.length === 0 && (
          <div className="text-sm text-neutral-400">No published regulatory signals yet.</div>
        )}

        {signals.map((signal) => (
          <div key={signal.id} className="border border-neutral-800 rounded-lg p-4">
            <h2 className="text-lg font-medium">{signal.headline}</h2>
            <div className="text-xs text-neutral-500 mt-1">
              {signal.country_name} • {signal.signal_type} • {signal.signal_date}
            </div>
            <p className="text-sm mt-2">{signal.public_summary}</p>
            <p className="text-sm text-neutral-400 mt-2">{signal.public_implication}</p>
            {signal.canonical_source_url && (
              <a href={signal.canonical_source_url} target="_blank" className="text-xs text-neutral-400 underline mt-2 inline-block">
                View source
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="text-xs text-neutral-500 mt-12">
        {REGULATORY_SIGNALS_DISCLAIMER}
      </div>
    </main>
  )
}
