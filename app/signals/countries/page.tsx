import type { Metadata } from 'next'
import { getPublicRegulatorySignalCountries } from '@/lib/regulatory-signals/public'
import { REGULATORY_SIGNALS_DISCLAIMER } from '@/lib/regulatory-signals/constants'
import { EmptyState, PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Signals by Country | Harbourview Signals',
  description: 'Regulatory signal monitoring by jurisdiction. Public-safe, source-backed signals for tracked cannabis markets.',
}

export default async function CountriesPage() {
  const countries = await getPublicRegulatorySignalCountries()

  return (
    <main>
      <PublicHero
        eyebrow="Harbourview Signals"
        title="Regulatory signals by jurisdiction."
        compact
      >
        <p className="text-sm leading-7 text-white/58">
          Browse tracked jurisdictions. Each country page shows reviewed public-safe signals for that market.
        </p>
      </PublicHero>

      <PublicSection tone="dark">
        {countries.length === 0 ? (
          <EmptyState
            title="No jurisdictions with published signals yet."
            description="Harbourview publishes signals as they pass public-safe review. Check back or submit a country intelligence request."
            action={{ label: 'Request Country Intelligence', href: '/intelligence' }}
          />
        ) : (
          <>
            <SectionHeader
              eyebrow="Tracked jurisdictions"
              title={`${countries.length} jurisdiction${countries.length === 1 ? '' : 's'} with published signals`}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {countries.map((c) => (
                <a
                  key={c.countryName}
                  href={`/signals/countries/${c.countryName.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group block"
                >
                  <PublicCard className="p-5 transition-colors hover:border-gold/30">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {c.countryCode && (
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gold/60">{c.countryCode}</p>
                        )}
                        <p className="text-base font-semibold text-white group-hover:text-gold transition-colors">{c.countryName}</p>
                        {c.region && (
                          <p className="mt-0.5 text-xs text-white/40">{c.region}</p>
                        )}
                      </div>
                      <div className="shrink-0 rounded border border-white/10 bg-white/[0.03] px-2.5 py-1 text-center">
                        <span className="block text-lg font-semibold text-white">{c.count}</span>
                        <span className="block text-[10px] text-white/40">signal{c.count === 1 ? '' : 's'}</span>
                      </div>
                    </div>
                    {c.latestSignalDate && (
                      <p className="mt-3 text-[10px] text-white/30">Latest: {c.latestSignalDate}</p>
                    )}
                  </PublicCard>
                </a>
              ))}
            </div>
          </>
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
