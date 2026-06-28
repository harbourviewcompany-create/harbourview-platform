import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicRegulatorySignalsByType } from '@/lib/regulatory-signals/public'
import { REGULATORY_SIGNAL_TYPE_LABELS, REGULATORY_SIGNALS_DISCLAIMER } from '@/lib/regulatory-signals/constants'
import type { RegulatorySignalType } from '@/lib/regulatory-signals/types'
import { EmptyState, PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params
  const label = REGULATORY_SIGNAL_TYPE_LABELS[type as RegulatorySignalType] ?? type.replace(/_/g, ' ')
  return {
    title: `${label} | Harbourview Signals`,
    description: `Reviewed regulatory signals for ${label}. Public-safe, source-backed market intelligence for regulated cannabis participants.`,
  }
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ')
}

// Force dynamic rendering — page fetches live Supabase data at request time
export const dynamic = 'force-dynamic'

export default async function TypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params

  // Validate type is a known signal type
  const knownTypes = Object.keys(REGULATORY_SIGNAL_TYPE_LABELS)
  if (!knownTypes.includes(type)) return notFound()

  const signals = await getPublicRegulatorySignalsByType(type)
  const label = REGULATORY_SIGNAL_TYPE_LABELS[type as RegulatorySignalType]

  return (
    <main>
      <PublicHero
        eyebrow="Harbourview Signals"
        title={`${label}.`}
        compact
      >
        <p className="text-sm leading-7 text-white/58">
          {signals.length} reviewed public-safe signal{signals.length === 1 ? '' : 's'} in this category.
          Source-backed. Not legal or regulatory advice.
        </p>
      </PublicHero>

      <PublicSection tone="dark">
        <div className="mb-6">
          <Link href="/signals" className="text-xs font-semibold uppercase tracking-widest text-gold/60 hover:text-gold transition-colors">
            ← All signals
          </Link>
        </div>

        {signals.length === 0 ? (
          <EmptyState
            title="No published signals in this category yet."
            action={{ label: 'Request Intelligence', href: '/intelligence' }}
          >
            Harbourview publishes signals as they pass review. Submit an intelligence request for a deeper assessment.
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {signals
              .sort((a, b) => (b.signal_date ?? '').localeCompare(a.signal_date ?? ''))
              .map((signal) => (
                <Link key={signal.id} href={`/signals/${signal.slug}`} className="group block">
                  <PublicCard className="p-6 transition-colors hover:border-gold/30">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {signal.country_name && (
                        <span className="rounded border border-gold/20 bg-gold/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold/70">
                          {signal.country_name}
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
                    </div>

                    <h2 className="text-base font-semibold leading-snug text-white group-hover:text-gold transition-colors">
                      {signal.headline}
                    </h2>

                    {signal.public_summary && (
                      <p className="mt-2 text-sm leading-6 text-white/55 line-clamp-2">{signal.public_summary}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-white/30">
                      {signal.signal_date && <span>{signal.signal_date}</span>}
                      {signal.regulator_name && <span>· {signal.regulator_name}</span>}
                    </div>
                  </PublicCard>
                </Link>
              ))}
          </div>
        )}
      </PublicSection>

      <PublicSection tone="navy">
        <PublicCard muted className="p-5 text-xs leading-6 text-white/44">
          {REGULATORY_SIGNALS_DISCLAIMER}
        </PublicCard>
      </PublicSection>
    </main>
  )
}
