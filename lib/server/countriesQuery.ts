import 'server-only'
import type { PublicCountryMapRecord } from '@/lib/intelligence/public-country-map'
import { publicCountryIntelligenceFixtures } from '@/lib/intelligence/fixtures'
import { countryOptions } from '@/config/globe/country-role-profiles'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const countryOptionByName = new Map(countryOptions.map((country) => [country.name, country]))

function statusFromPathways(pathways: string[], pathway: 'medical' | 'adultUse') {
  return pathways.includes(pathway) ? 'tracked' : 'unknown'
}

function fixtureToPublicCountry(fixture: (typeof publicCountryIntelligenceFixtures)[number]): PublicCountry {
  const option = countryOptionByName.get(fixture.country)

  return {
    id: `fixture-${fixture.slug}`,
    country_name: fixture.country,
    country_slug: fixture.slug,
    iso_alpha2: option?.iso2 ?? fixture.slug.slice(0, 2).toUpperCase(),
    iso_alpha3: '',
    region: fixture.region,
    subregion: null,
    market_access_status: fixture.reviewStatus === 'publicSafeSeed' ? 'tracked' : 'review-required',
    medical_status: statusFromPathways(fixture.pathways, 'medical'),
    adult_use_status: statusFromPathways(fixture.pathways, 'adultUse'),
    import_status: fixture.tradeRole.includes('import market') ? 'tracked' : 'unknown',
    export_status: fixture.tradeRole.includes('export market') ? 'tracked' : 'unknown',
    signals_status: 'fixture',
    opportunity_status: 'fixture',
    public_summary: fixture.publicSummary,
    data_completeness: fixture.reviewStatus === 'publicSafeSeed' ? 'full' : 'partial',
    last_updated_label: 'repo fixture',
    lat: fixture.coordinates?.lat ?? null,
    lng: fixture.coordinates?.lng ?? null,
    opportunity_categories: fixture.opportunityCategories,
    trade_roles: fixture.tradeRole,
    regulator_label: fixture.regulatorLabel ?? null,
  }
}

const staticPublicCountryFallback: PublicCountry[] = publicCountryIntelligenceFixtures.map(fixtureToPublicCountry)

export type PublicCountry = {
  id: string
  country_name: string
  country_slug: string
  iso_alpha2: string
  iso_alpha3: string
  region: string | null
  subregion: string | null
  market_access_status: string
  medical_status: string
  adult_use_status: string
  import_status: string
  export_status: string
  signals_status: string
  opportunity_status: string
  public_summary: string | null
  data_completeness: string
  last_updated_label: string | null
  lat: number | null
  lng: number | null
  opportunity_categories: string[] | null
  trade_roles: string[] | null
  regulator_label: string | null
}

const STATUS_TO_PATHWAY: Record<string, string[]> = {
  active: ['medical'],
  regulated: ['medical'],
  open: ['medical', 'adultUse'],
  emerging: ['medical'],
  limited: [],
  restricted: [],
  unknown: [],
}

function derivePathways(country: PublicCountry): string[] {
  const pathways = new Set<string>()
  ;(STATUS_TO_PATHWAY[country.medical_status] ?? []).forEach((p) => pathways.add(p))
  if (['active', 'open', 'emerging'].includes(country.adult_use_status)) pathways.add('adultUse')
  if (['active', 'open'].includes(country.import_status)) pathways.add('medical')
  return Array.from(pathways)
}

function deriveStatusLabel(country: PublicCountry): string {
  const med = country.medical_status
  const adult = country.adult_use_status
  if (med === 'open' || adult === 'open') return 'Legal adult-use and medical market'
  if (med === 'active') return adult === 'emerging' ? 'Medical market with adult-use development' : 'Medical market active'
  if (med === 'regulated') return 'Medical market regulated'
  if (med === 'emerging') return 'Emerging medical market'
  if (med === 'limited') return 'Limited medical access'
  return 'Monitoring only'
}

export function toCountryMapRecord(c: PublicCountry): PublicCountryMapRecord {
  return {
    slug: c.country_slug,
    country: c.country_name,
    region: c.region ?? 'Unknown',
    statusLabel: deriveStatusLabel(c),
    pathways: derivePathways(c) as PublicCountryMapRecord['pathways'],
    publicSummary: c.public_summary ?? 'Intelligence data available on request.',
    pathwaySummary: `Medical: ${c.medical_status} · Adult use: ${c.adult_use_status} · Import: ${c.import_status} · Export: ${c.export_status}`,
    opportunityCategories: c.opportunity_categories ?? [],
    tradeRole: c.trade_roles ?? [],
    regulatorLabel: c.regulator_label ?? undefined,
    coordinates: c.lat != null && c.lng != null ? { lat: c.lat, lng: c.lng } : undefined,
    reviewStatus: c.data_completeness === 'full' ? 'publicSafeSeed' : 'needsAnalystReview',
    isoAlpha2: c.iso_alpha2,
    reviewLabel: c.data_completeness === 'full' ? 'Public-safe seed data' : 'Pending analyst review',
  } as unknown as PublicCountryMapRecord
}

export async function getPublicCountries(): Promise<PublicCountry[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return staticPublicCountryFallback
  try {
    const params = new URLSearchParams({
      select: 'id,country_name,country_slug,iso_alpha2,iso_alpha3,region,subregion,market_access_status,medical_status,adult_use_status,import_status,export_status,signals_status,opportunity_status,public_summary,data_completeness,last_updated_label,lat,lng,opportunity_categories,trade_roles,regulator_label',
      order: 'country_name.asc',
    })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/countries?${params}`, {
      next: { revalidate: 3600 },
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Accept: 'application/json' },
    })
    if (!res.ok) return staticPublicCountryFallback
    const rows = await res.json()
    return rows.length > 0 ? rows : staticPublicCountryFallback
  } catch { return staticPublicCountryFallback }
}

export async function getCountriesAsMapRecords(): Promise<PublicCountryMapRecord[]> {
  const countries = await getPublicCountries()
  return countries.map(toCountryMapRecord)
}

export async function getPublicListings(): Promise<{ iso_alpha2: string; listing_count: number }[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []
  try {
    const params = new URLSearchParams({
      select: 'location_country,iso2:location_country.count()',
      status: 'eq.approved',
      public_visibility: 'eq.true',
    })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/listings?${params}`, {
      next: { revalidate: 3600 },
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    })
    if (!res.ok) return []
    return res.json()
  } catch { return [] }
}

export async function getPublicCountryBySlug(slug: string): Promise<PublicCountry | null> {
  const fallback = staticPublicCountryFallback.find((country) => country.country_slug === slug) ?? null
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return fallback
  try {
    const params = new URLSearchParams({ select: 'id,country_name,country_slug,iso_alpha2,iso_alpha3,region,subregion,market_access_status,medical_status,adult_use_status,import_status,export_status,signals_status,opportunity_status,public_summary,data_completeness,last_updated_label,lat,lng,opportunity_categories,trade_roles,regulator_label', country_slug: `eq.${slug}`, limit: '1' })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/countries?${params}`, {
      next: { revalidate: 3600 },
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    })
    if (!res.ok) return fallback
    const rows = await res.json()
    return rows[0] ?? fallback
  } catch { return fallback }
}
