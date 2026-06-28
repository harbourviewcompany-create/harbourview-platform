import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getComplianceRegion, complianceRegions } from '@/lib/compliance/regions'
import { getCountriesByRegion, maturityLabels, confidenceLabels } from '@/lib/compliance/safePublicCompliance'
import type { ComplianceRegionSlug } from '@/lib/compliance/types'
import { coreComplianceDisclaimer } from '@/lib/compliance/disclaimers'
import { PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const { region: regionSlug } = await params
  const region = getComplianceRegion(regionSlug)
  if (!region) return { title: 'Region Not Found | Harbourview' }
  return {
    title: `${region!.name} Compliance Pathways | Harbourview`,
    description: `${region!.summary} Public-safe orientation only.`,
  }
}

// Force dynamic rendering — page fetches live Supabase data at request time
export const dynamic = 'force-dynamic'

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const { region: regionSlug } = await params
  const region = getComplianceRegion(regionSlug)
  if (!region) return notFound()
  // notFound() throws, so region is defined from here — TypeScript needs the assertion

  const countries = getCountriesByRegion(regionSlug as ComplianceRegionSlug)
    .sort((a, b) => a.country.localeCompare(b.country))

  return (
    <main>
      <PublicHero
        eyebrow="Compliance / Regions"
        title={`${region!.name} compliance pathways.`}
        compact
      >
        <p className="text-sm leading-7 text-white/58 max-w-2xl">{region!.summary}</p>
      </PublicHero>

      <PublicSection tone="dark">
        {/* Region context card */}
        <div className="mb-8 max-w-3xl">
          <div className="mb-1 flex items-center gap-2">
            <Link href="/compliance" className="text-[10px] font-semibold uppercase tracking-widest text-gold/50 hover:text-gold transition-colors">
              Compliance
            </Link>
            <span className="text-[10px] text-white/20">/</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">{region!.name}</span>
          </div>
        </div>

        <div className="mb-8 rounded-sm border border-gold/12 bg-[#071426]/82 p-6 sm:p-8 max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/70 mb-3">Commercial focus</p>
          <p className="text-sm leading-7 text-white/65">{region!.commercialFocus}</p>
        </div>

        {/* Country grid */}
        <SectionHeader
          eyebrow={`${countries.length} jurisdiction${countries.length === 1 ? '' : 's'}`}
          title={`Tracked ${region!.name} markets.`}
        />

        {countries.length === 0 ? (
          <PublicCard muted className="p-6 text-sm text-white/44">
            No jurisdictions tracked in this region yet. Harbourview adds markets as review capacity allows.
          </PublicCard>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((country) => (
              <Link
                key={country.slug}
                href={`/compliance/country-pathways/${country.slug}`}
                className="group block"
              >
                <PublicCard className="p-5 h-full transition-colors hover:border-gold/30">
                  <p className="text-base font-semibold text-white group-hover:text-gold transition-colors">
                    {country.country}
                  </p>
                  <p className="mt-1 text-xs text-white/38">
                    {maturityLabels[country.maturityLevel]}
                  </p>
                  {country.pathwaySummary && (
                    <p className="mt-3 text-xs leading-5 text-white/45 line-clamp-2">
                      {country.pathwaySummary}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] uppercase tracking-wider text-white/30">
                      {country.reviewStatus.replace(/_/g, ' ')}
                    </span>
                    <span className="rounded border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] uppercase tracking-wider text-white/30">
                      {confidenceLabels[country.sourceConfidence]}
                    </span>
                  </div>
                </PublicCard>
              </Link>
            ))}
          </div>
        )}
      </PublicSection>

      <PublicSection tone="navy">
        <div className="flex flex-wrap gap-3 mb-6">
          {complianceRegions.filter(r => r.slug !== regionSlug).map(r => (
            <Link
              key={r.slug}
              href={`/compliance/regions/${r.slug}`}
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/50 hover:border-gold/30 hover:text-gold transition-colors"
            >
              {r.name}
            </Link>
          ))}
        </div>
        <PublicCard muted className="p-5 text-xs leading-6 text-white/44">
          {coreComplianceDisclaimer}
        </PublicCard>
      </PublicSection>
    </main>
  )
}
