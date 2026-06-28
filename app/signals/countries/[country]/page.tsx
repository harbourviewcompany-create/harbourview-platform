import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicRegulatorySignalCountries, getPublicRegulatorySignals } from '@/lib/regulatory-signals/public'
import { REGULATORY_SIGNAL_TYPE_LABELS, REGULATORY_SIGNALS_DISCLAIMER } from '@/lib/regulatory-signals/constants'
import { EmptyState, PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params
  const displayName = country.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return {
    title: `${displayName} Regulatory Signals | Harbourview`,
    description: `Reviewed regulatory signals for ${displayName}. Public-safe, source-backed market intelligence for regulated cannabis participants.`,
  }
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ')
}

// Force dynamic rendering — page fetches live Supabase data at request time
export const dynamic = 'force-dynamic'

export default async function CountrySignalsPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params
  const displayName = country.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  // Verify country exists in published signals
  const countries = await getPublicRegulatorySignalCountries()
  const match = countries.find(
    (c) => c.countryName.toLowerCase().replace(/\s+/g, '-') === country
  )
  if (!match) return notFound()

  // Get all signals for this country
  const allSignals = await getPublicRegulatorySignals()
  const signals = allSignals.filter(
    (s) => s.country_name?.toLowerCase().replace(/\s+/g, '-') === country
  ).sort((a, b) => (b.signal_date ?? '').localeCompare(a.signal_date ?? ''))

  return (
    <main>
      <PublicHero
        eyebrow={`${match.countryCode ?? ''} · ${match.region ?? 'Tracked jurisdiction'}`}
        title={`${displayName} regulatory signals.`}
        compact
      >
        <p className="text-sm leading-7 text-white/58">
          {signals.length} reviewed public-safe signal{signals.length === 1 ? '' : 's'} for {displayName}.
          Source-backed. Not legal or regulatory advice.
        </p>
      </PublicHero>

      <PublicSection tone="dark">
        <div className="mb-6">
          <Link href="/signals/countries" className="text-xs font-semibold uppercase tracking-widest text-gold/60 hover:text-gold transition-colors">
            ← All jurisdictions
          </Link>
        </div>

        {signals.length === 0 ? (
          <EmptyState
            title="No published signals for this jurisdiction yet."
            action={{ label: 'Request Country Intelligence', href: '/intelligence' }}
          >
            Harbourview publishes signals as they pass review. Request country intelligence for a deeper assessment.
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {signals.map((signal) => (
              <Link key={signal.id} href={`/signals/${signal.slug}`} className="group block">
                <PublicCard className="p-6 transition-colors hover:border-gold/30">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="rounded border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                      {REGULATORY_SIGNAL_TYPE_LABELS[signal.signal_type as keyof typeof REGULATORY_SIGNAL_TYPE_LABELS] ?? formatLabel(signal.signal_type)}
                    </span>
                    <span className="rounded border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/40">
                      Impact: {formatLabel(signal.impact_level)}
                    </span>
                    <span className="rounded border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/40">
                      Confidence: {formatLabel(signal.confidence)}
                    </span>
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
