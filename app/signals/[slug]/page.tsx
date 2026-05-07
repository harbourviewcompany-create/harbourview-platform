import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicRegulatorySignalBySlug } from '@/lib/regulatory-signals/public'
import { REGULATORY_SIGNALS_DISCLAIMER } from '@/lib/regulatory-signals/constants'

export default async function RegulatorySignalDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const signal = await getPublicRegulatorySignalBySlug(slug)
  if (!signal) notFound()

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/signals" className="mb-8 inline-block text-xs text-neutral-500 underline">
        Back to Signals
      </Link>

      <h1 className="text-3xl font-semibold">{signal.headline}</h1>

      <div className="mt-3 text-xs text-neutral-500">
        {signal.country_name || 'Global'} • {signal.signal_type} • {signal.signal_date} •{' '}
        {signal.confidence}
      </div>

      <section className="mt-8 space-y-5 text-sm leading-6">
        <p>{signal.public_summary}</p>
        <p className="text-neutral-500">{signal.public_implication}</p>
      </section>

      {signal.regulator_name && (
        <p className="mt-6 text-xs text-neutral-500">Regulator: {signal.regulator_name}</p>
      )}

      {signal.canonical_source_url && (
        <a
          href={signal.canonical_source_url}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-block text-xs text-neutral-500 underline"
        >
          View official or source-backed reference
        </a>
      )}

      <div className="mt-12 text-xs text-neutral-500">{REGULATORY_SIGNALS_DISCLAIMER}</div>
    </main>
  )
}