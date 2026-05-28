import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicSection, SectionHeader, FooterCta } from '@/components/PublicUi'
import { getCountriesAsMapRecords } from '@/lib/server/countriesQuery'
import { publicCountryIntelligenceFixtures } from '@/lib/intelligence/fixtures'
import { projectPublicCountryMapRecords } from '@/lib/intelligence/public-country-map'

export const metadata: Metadata = {
  title: 'Country Briefs | Harbourview Intelligence',
  description: 'Tracked alpha jurisdiction-level regulatory and market orientation for represented cannabis markets.',
}

function getReviewClass(reviewStatus: string) {
  if (reviewStatus === 'publicSafeSeed') return 'text-emerald-300'
  if (reviewStatus === 'needsAnalystReview') return 'text-amber-300'
  return 'text-white/40'
}

export default async function CountryBriefsPage() {
  const liveCountries = await getCountriesAsMapRecords()
  const fixtureCountries = projectPublicCountryMapRecords(publicCountryIntelligenceFixtures)
  const countries = liveCountries.length > 0 ? liveCountries : fixtureCountries
  const coverageSource = liveCountries.length > 0 ? 'approved public country records' : 'repo alpha fixture records'

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
        Harbourview currently publishes tracked alpha jurisdiction orientation for represented repository-backed markets only.
        This is partial coverage from {coverageSource}, not a complete global country brief library.
      </PublicHero>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Coverage" title={`${countries.length} represented jurisdictions in this alpha surface`}>
          Public-safe regulatory orientation is shown only where current repository data or approved public country records exist.
          Missing jurisdictions remain request-only until approved data is added.
        </SectionHeader>
        {countries.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {countries.map((country) => (
              <PublicCard key={country.slug} className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-white">{country.country}</h3>
                    <p className="text-xs text-white/40">{country.region}</p>
                  </div>
                  <span className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getReviewClass(country.reviewStatus)}`}>
                    {country.reviewLabel}
                  </span>
                </div>
                <p className="text-sm leading-7 text-white/62">{country.statusLabel}</p>
                <p className="border-t border-white/10 pt-3 text-xs leading-relaxed text-white/50">
                  {country.publicSummary}
                </p>
                {country.regulatorLabel && (
                  <p className="text-xs text-white/30">Regulator reference: {country.regulatorLabel}</p>
                )}
              </PublicCard>
            ))}
          </div>
        ) : (
          <PublicCard className="p-6 text-sm leading-7 text-white/62">
            No public country brief records are available in this environment. Country intelligence remains request-only until approved records are present.
          </PublicCard>
        )}
      </PublicSection>

      <FooterCta
        eyebrow="Intelligence access"
        title="Need deeper jurisdiction intelligence?"
        actions={[{ label: 'Request Country Intelligence', href: '/contact' }]}
      >
        Submit a private request for route-specific context, counterparty intelligence or regulatory pathway review.
      </FooterCta>
    </main>
  )
}
