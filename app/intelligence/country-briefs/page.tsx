import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicCard, PublicHero, PublicSection, SectionHeader, FooterCta } from '@/components/PublicUi'
import { getPublicCountries } from '@/lib/server/countriesQuery'

export const metadata: Metadata = {
  title: 'Country Briefs | Harbourview Intelligence',
  description: 'Jurisdiction-level regulatory and market orientation for priority cannabis markets.',
}

const ACCESS_COLORS: Record<string, string> = {
  active: 'text-emerald-400',
  open: 'text-emerald-300',
  regulated: 'text-sky-400',
  emerging: 'text-amber-400',
  limited: 'text-orange-400',
  restricted: 'text-red-400',
  unknown: 'text-white/30',
}

const ACCESS_DOT: Record<string, string> = {
  active: 'bg-emerald-400',
  open: 'bg-emerald-300',
  regulated: 'bg-sky-400',
  emerging: 'bg-amber-400',
  limited: 'bg-orange-400',
  restricted: 'bg-red-400',
  unknown: 'bg-white/20',
}

export default async function CountryBriefsPage() {
  const countries = await getPublicCountries()

  return (
    <main className="bg-[#020814] text-white">
      <PublicHero
        eyebrow="Intelligence"
        title="Country Briefs"
        actions={[{ label: 'Request a Country Brief', href: '/contact' }]}
        aside={
          <PublicCard className="p-6 text-sm leading-7 text-white/62">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/66">Trust boundary</p>
            <p>Country brief content is orientation-level only. Route claims, counterparty details and commercial specifics are handled through reviewed private workflows.</p>
          </PublicCard>
        }
      >
        Jurisdiction-level regulatory and market orientation for {countries.length > 0 ? `${countries.length} priority` : 'priority'} cannabis markets.
        Briefs cover access pathway status, regulatory framework, licensing structure and commercial route context.
      </PublicHero>

      {countries.length > 0 && (
        <PublicSection tone="dark">
          <SectionHeader eyebrow="Coverage" title="Priority jurisdiction coverage">
            Public-safe regulatory orientation across medical, adult-use, import and export status.
          </SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {countries.map((country) => (
              <PublicCard key={country.id} className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-white text-base">{country.country_name}</h3>
                    <p className="text-xs text-white/40">{country.region}</p>
                  </div>
                  <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${ACCESS_DOT[country.market_access_status] ?? 'bg-white/20'}`} />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {[
                    ['Medical', country.medical_status],
                    ['Adult use', country.adult_use_status],
                    ['Import', country.import_status],
                    ['Export', country.export_status],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <span className="text-white/30 w-14 flex-shrink-0">{label}</span>
                      <span className={`capitalize ${ACCESS_COLORS[value ?? 'unknown'] ?? 'text-white/30'}`}>{value}</span>
                    </div>
                  ))}
                </div>
                {country.public_summary && (
                  <p className="text-xs text-white/50 leading-relaxed border-t border-white/10 pt-3 line-clamp-3">
                    {country.public_summary}
                  </p>
                )}
                {country.regulator_label && (
                  <p className="text-xs text-white/30">Regulator: {country.regulator_label}</p>
                )}
                {country.last_updated_label && (
                  <p className="text-xs text-white/20">Updated {country.last_updated_label}</p>
                )}
              </PublicCard>
            ))}
          </div>
        </PublicSection>
      )}

      <FooterCta
        title="Need deeper jurisdiction intelligence?"
        body="Submit a private request for route-specific context, counterparty intelligence or regulatory pathway review."
        actions={[{ label: 'Request Country Intelligence', href: '/contact' }]}
      />
    </main>
  )
}
