import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicRegulatorySignalBySlug } from '@/lib/regulatory-signals/public'
import { REGULATORY_SIGNAL_TYPE_LABELS, REGULATORY_SIGNALS_DISCLAIMER } from '@/lib/regulatory-signals/constants'
import TierGate from '@/components/stripe/TierGate'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const signal = await getPublicRegulatorySignalBySlug(slug)
  if (!signal) return { title: 'Signal Not Found | Harbourview' }
  return {
    title: `${signal.headline} | Harbourview Signals`,
    description: signal.public_summary ?? 'Harbourview regulatory signal. Source-backed. Not legal or regulatory advice.',
  }
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ')
}

// Force dynamic rendering — page fetches live Supabase data at request time
export const dynamic = 'force-dynamic'

export default async function RegulatorySignalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const signal = await getPublicRegulatorySignalBySlug(slug)
  if (!signal) notFound()

  const countryHref = signal.country_name
    ? `/signals/countries/${signal.country_name.toLowerCase().replace(/\s+/g, '-')}`
    : null

  return (
    <main className="bg-[#020814] min-h-screen">
      <section className="py-16">
        <div className="page-container max-w-3xl">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-2 mb-8 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            <Link href="/signals" className="hover:text-gold transition-colors">Signals</Link>
            {countryHref && signal.country_name && (
              <>
                <span>/</span>
                <Link href={countryHref} className="hover:text-gold transition-colors">{signal.country_name}</Link>
              </>
            )}
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap gap-2 mb-5">
            {signal.signal_type && (
              <span className="rounded border border-gold/20 bg-gold/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold/70">
                {REGULATORY_SIGNAL_TYPE_LABELS[signal.signal_type as keyof typeof REGULATORY_SIGNAL_TYPE_LABELS] ?? formatLabel(signal.signal_type)}
              </span>
            )}
            {signal.impact_level && (
              <span className="rounded border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/40">
                Impact: {formatLabel(signal.impact_level)}
              </span>
            )}
            {signal.confidence && (
              <span className="rounded border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/40">
                Confidence: {formatLabel(signal.confidence)}
              </span>
            )}
            {signal.source_tier && (
              <span className="rounded border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/40">
                {formatLabel(signal.source_tier)}
              </span>
            )}
          </div>

          {/* Headline */}
          <h1 className="text-2xl font-semibold leading-tight text-white sm:text-3xl">{signal.headline}</h1>

          {/* Meta row */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/35">
            {signal.country_name && countryHref && (
              <Link href={countryHref} className="hover:text-gold transition-colors">{signal.country_name}</Link>
            )}
            {signal.regulator_name && <span>· {signal.regulator_name}</span>}
            {signal.signal_date && <span>· {signal.signal_date}</span>}
          </div>

          {/* Body */}
          <div className="mt-10 space-y-6">
            {signal.public_summary && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gold/60">Public summary</p>
                <p className="text-sm leading-7 text-white/70">{signal.public_summary}</p>
              </div>
            )}
            {signal.public_implication && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gold/60">Implication</p>
                <p className="text-sm leading-7 text-white/55">{signal.public_implication}</p>
              </div>
            )}
          </div>

          {/* Source — Intel Plus gated */}
          {signal.canonical_source_url && (
            <div className="mt-8">
              <TierGate required="intel" label="Source trail access requires Intel Plus">
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">Source reference</p>
                  <a
                    href={signal.canonical_source_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-xs text-gold/50 underline underline-offset-2 hover:text-gold transition-colors break-all"
                  >
                    {signal.canonical_source_url}
                  </a>
                </div>
              </TierGate>
            </div>
          )}

          {/* Review dates */}
          {(signal.published_at || signal.last_reviewed_at) && (
            <div className="mt-6 flex flex-wrap gap-4 text-[10px] text-white/25">
              {signal.published_at && <span>Published: {signal.published_at}</span>}
              {signal.last_reviewed_at && <span>· Reviewed: {signal.last_reviewed_at}</span>}
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-12 rounded-xl border border-white/8 bg-white/[0.02] p-5 text-xs leading-6 text-white/35">
            {REGULATORY_SIGNALS_DISCLAIMER}
          </div>

          {/* Back link */}
          <div className="mt-8 flex gap-4">
            <Link href="/signals" className="text-xs font-semibold uppercase tracking-widest text-gold/50 hover:text-gold transition-colors">
              ← All signals
            </Link>
            {countryHref && (
              <Link href={countryHref} className="text-xs font-semibold uppercase tracking-widest text-gold/50 hover:text-gold transition-colors">
                ← {signal.country_name} signals
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
