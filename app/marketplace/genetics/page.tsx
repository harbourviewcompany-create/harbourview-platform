import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'
import { getPublicCultivarPassports } from '@/lib/genetics/queries'

export const metadata: Metadata = {
  title: 'Genetics | Harbourview Exchange',
  description:
    'Public cultivar passports and genetics programs under controlled commercial review. Access requests are reviewed before any introduction. No seed, clone, or plant-material offers on this surface.',
}

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}

export default async function GeneticsCategoryPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const country = (first(sp.country) ?? '').toUpperCase()
  const category = (first(sp.category) ?? '').toLowerCase()

  const all = await getPublicCultivarPassports()
  const filtered = all.filter((p) => {
    if (country && p.originCountryCode !== country) return false
    if (category && (p.cultivarCategory ?? '').toLowerCase() !== category) return false
    return true
  })

  const countries = Array.from(
    new Set(all.map((p) => p.originCountryCode).filter((c): c is string => Boolean(c))),
  ).sort()
  const categories = Array.from(
    new Set(all.map((p) => p.cultivarCategory).filter(Boolean)),
  ).sort() as string[]

  return (
    <>
      <PublicHero
        eyebrow="Exchange — Genetics"
        title="Genetics programs under controlled commercial review."
        actions={[
          { label: 'Request access', href: '/marketplace/genetics/request-access' },
          { label: 'Submit a program', href: '/marketplace/genetics/submit-program', variant: 'secondary' },
          { label: 'Confidential intake', href: '/intake', variant: 'secondary' },
        ]}
      >
        <p>
          Public cultivar passports list orientation-level summaries only. Access requests are reviewed
          before any introduction. This surface never offers seed, clone, pollen, or plant material.
        </p>
      </PublicHero>

      <PublicSection tone="navy">
        <SectionHeader
          eyebrow="Public passports"
          title={`${filtered.length} passport${filtered.length === 1 ? '' : 's'} visible`}
        >
          Filtered by origin and category when provided. Empty results mean no published public rows
          match — not that genetics activity is absent from the network.
        </SectionHeader>

        <form method="get" className="mb-8 flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
            Origin
            <select
              name="country"
              defaultValue={country}
              className="rounded-md border border-white/12 bg-[#0B1A2F] px-3 py-2 text-sm text-white"
            >
              <option value="">Any</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
            Category
            <select
              name="category"
              defaultValue={category}
              className="rounded-md border border-white/12 bg-[#0B1A2F] px-3 py-2 text-sm text-white"
            >
              <option value="">Any</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="self-end rounded-md bg-[#C6A55A] px-4 py-2 text-sm font-semibold text-[#081423]"
          >
            Filter
          </button>
        </form>

        {filtered.length === 0 ? (
          <PublicCard className="p-7 text-sm leading-7 text-white/62">
            No public cultivar passports match these filters yet. You can still{' '}
            <Link href="/marketplace/genetics/request-access" className="text-[#C6A55A] underline">
              request access
            </Link>{' '}
            or{' '}
            <Link href="/marketplace/genetics/submit-program" className="text-[#C6A55A] underline">
              submit a program
            </Link>{' '}
            for review.
          </PublicCard>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {filtered.map((p) => (
              <PublicCard key={p.id} className="flex flex-col p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold text-white">{p.displayName}</h3>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-white/40">
                    {p.claimStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="mt-2 text-xs text-white/45">
                  {[p.originCountryCode, p.originJurisdictionLabel, p.cultivarCategory?.replace(/_/g, ' ')]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <p className="mt-3 flex-1 text-sm leading-7 text-white/62">
                  {p.publicSummary.slice(0, 280)}
                  {p.publicSummary.length > 280 ? '…' : ''}
                </p>
                {p.evidenceScoreSummary && (
                  <p className="mt-2 text-xs text-[#C6A55A]/80">{p.evidenceScoreSummary}</p>
                )}
                {p.countryOpportunitiesPublic.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.countryOpportunitiesPublic.slice(0, 6).map((o) => (
                      <span
                        key={`${o.countryCode}-${o.opportunityType}`}
                        className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50"
                      >
                        {o.countryCode} · {o.opportunityType.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <Link
                    href={`/marketplace/genetics/${p.slug}`}
                    className="font-medium text-[#C6A55A] hover:underline"
                  >
                    View passport →
                  </Link>
                  <Link
                    href={`/marketplace/genetics/request-access?cultivar=${encodeURIComponent(p.slug)}`}
                    className="text-white/50 hover:text-white/80"
                  >
                    Request access
                  </Link>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-white/35">{p.publicDisclaimer}</p>
              </PublicCard>
            ))}
          </div>
        )}
      </PublicSection>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Boundary" title="Information and discussion only">
          Public genetics surfaces do not list inventory, prices, or transfer terms. Material
          movement remains outside Harbourview public pages and is subject to jurisdiction gates.
        </SectionHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PublicCard muted className="p-5 text-sm leading-7 text-white/58">
            Access requests are reviewed before introduction.
          </PublicCard>
          <PublicCard muted className="p-5 text-sm leading-7 text-white/58">
            Claim status reflects evidence review — not a guarantee of commercial availability.
          </PublicCard>
          <PublicCard muted className="p-5 text-sm leading-7 text-white/58">
            Country opportunity chips are discussion pathways, not open tenders.
          </PublicCard>
        </div>
      </PublicSection>
    </>
  )
}
