export type DashboardPanelState =
  | 'live'
  | 'partial'
  | 'static-orientation'
  | 'fallback-backed'
  | 'request-only'
  | 'review-required'
  | 'unavailable'

export type DashboardSection =
  | 'market'
  | 'education'
  | 'compliance'
  | 'signals'
  | 'opportunities'
  | 'intelligence'
  | 'connections'

export interface CountryRegistryRecord {
  slug: string
  iso2: string
  iso3: string
  displayName: string
  aliases: string[]
  region: string
  subregion: string
  globeFeatureId: string
  dashboardPath: string
  defaultDashboardSection: DashboardSection
  routeAvailability: 'available' | 'request-only' | 'unavailable'
  dashboardStatus: DashboardPanelState
  lastUpdated: string
  publicSummary: string
}

const SECTIONS: DashboardSection[] = ['market', 'education', 'compliance', 'signals', 'opportunities', 'intelligence', 'connections']

const fixtures: CountryRegistryRecord[] = [
  { slug: 'germany', iso2: 'DE', iso3: 'DEU', displayName: 'Germany', aliases: ['deutschland'], region: 'Europe', subregion: 'Western Europe', globeFeatureId: 'DEU', dashboardPath: '/dashboard/country/germany', defaultDashboardSection: 'market', routeAvailability: 'available', dashboardStatus: 'live', lastUpdated: '2026-05-28', publicSummary: 'Live dashboard with full market and compliance coverage.' },
  { slug: 'italy', iso2: 'IT', iso3: 'ITA', displayName: 'Italy', aliases: [], region: 'Europe', subregion: 'Southern Europe', globeFeatureId: 'ITA', dashboardPath: '/dashboard/country/italy', defaultDashboardSection: 'education', routeAvailability: 'available', dashboardStatus: 'partial', lastUpdated: '2026-05-28', publicSummary: 'Partial dashboard with active education and market summaries.' },
  { slug: 'new-zealand', iso2: 'NZ', iso3: 'NZL', displayName: 'New Zealand', aliases: ['aotearoa'], region: 'Oceania', subregion: 'Australia and New Zealand', globeFeatureId: 'NZL', dashboardPath: '/dashboard/country/new-zealand', defaultDashboardSection: 'compliance', routeAvailability: 'request-only', dashboardStatus: 'request-only', lastUpdated: '2026-05-28', publicSummary: 'Request-only dashboard pending enhanced source review.' },
  { slug: 'canada', iso2: 'CA', iso3: 'CAN', displayName: 'Canada', aliases: [], region: 'Americas', subregion: 'North America', globeFeatureId: 'CAN', dashboardPath: '/dashboard/country/canada', defaultDashboardSection: 'signals', routeAvailability: 'available', dashboardStatus: 'review-required', lastUpdated: '2026-05-28', publicSummary: 'Signals and opportunities require analyst review.' },
  { slug: 'united-states', iso2: 'US', iso3: 'USA', displayName: 'United States', aliases: ['usa', 'us'], region: 'Americas', subregion: 'North America', globeFeatureId: 'USA', dashboardPath: '/dashboard/country/united-states', defaultDashboardSection: 'market', routeAvailability: 'available', dashboardStatus: 'live', lastUpdated: '2026-05-28', publicSummary: 'Live country dashboard with extensive panel depth.' },
  { slug: 'united-kingdom', iso2: 'GB', iso3: 'GBR', displayName: 'United Kingdom', aliases: ['uk', 'great-britain'], region: 'Europe', subregion: 'Northern Europe', globeFeatureId: 'GBR', dashboardPath: '/dashboard/country/united-kingdom', defaultDashboardSection: 'market', routeAvailability: 'available', dashboardStatus: 'partial', lastUpdated: '2026-05-28', publicSummary: 'Core routes available with partial panel fidelity.' },
  { slug: 'portugal', iso2: 'PT', iso3: 'PRT', displayName: 'Portugal', aliases: [], region: 'Europe', subregion: 'Southern Europe', globeFeatureId: 'PRT', dashboardPath: '/dashboard/country/portugal', defaultDashboardSection: 'opportunities', routeAvailability: 'available', dashboardStatus: 'fallback-backed', lastUpdated: '2026-05-28', publicSummary: 'Fallback-backed opportunity route with advisory CTA.' },
  { slug: 'australia', iso2: 'AU', iso3: 'AUS', displayName: 'Australia', aliases: [], region: 'Oceania', subregion: 'Australia and New Zealand', globeFeatureId: 'AUS', dashboardPath: '/dashboard/country/australia', defaultDashboardSection: 'intelligence', routeAvailability: 'available', dashboardStatus: 'live', lastUpdated: '2026-05-28', publicSummary: 'Live intelligence and compliance panel coverage.' },
  { slug: 'colombia', iso2: 'CO', iso3: 'COL', displayName: 'Colombia', aliases: [], region: 'Americas', subregion: 'South America', globeFeatureId: 'COL', dashboardPath: '/dashboard/country/colombia', defaultDashboardSection: 'connections', routeAvailability: 'available', dashboardStatus: 'review-required', lastUpdated: '2026-05-28', publicSummary: 'Connections panel requires reviewed-access workflow.' },
  { slug: 'israel', iso2: 'IL', iso3: 'ISR', displayName: 'Israel', aliases: [], region: 'Asia', subregion: 'Western Asia', globeFeatureId: 'ISR', dashboardPath: '/dashboard/country/israel', defaultDashboardSection: 'market', routeAvailability: 'unavailable', dashboardStatus: 'unavailable', lastUpdated: '2026-05-28', publicSummary: 'Public dashboard unavailable; request confidential review.' },
]

const aliasPairs: Array<[string, string]> = [
  ['czech republic', 'czechia'], ['türkiye', 'turkey'], ["côte d’ivoire", 'ivory-coast'], ['south korea', 'republic-of-korea'], ['north korea', 'dprk'], ['russian federation', 'russia'], ['islamic republic of iran', 'iran'], ['bolivarian republic of venezuela', 'venezuela'], ['plurinational state of bolivia', 'bolivia'], ['united republic of tanzania', 'tanzania'], ['viet nam', 'vietnam'], ['lao pdr', 'laos'], ['syrian arab republic', 'syria'], ['republic of moldova', 'moldova'], ['republic of the congo', 'congo'], ['democratic republic of the congo', 'drc'], ['palestinian territory', 'palestine'], ['holland', 'netherlands'], ['kosovo', 'kosovo'], ['taiwan', 'taiwan'], ['hong kong', 'hong-kong'], ['macau', 'macau']
]

export const dashboardCountries = fixtures
export const dashboardSections = SECTIONS

const normalize = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
const bySlug = new Map(dashboardCountries.map((c) => [c.slug, c]))
const byIso2 = new Map(dashboardCountries.map((c) => [c.iso2.toLowerCase(), c]))
const byIso3 = new Map(dashboardCountries.map((c) => [c.iso3.toLowerCase(), c]))
const aliasMap = new Map<string, CountryRegistryRecord>()
for (const country of dashboardCountries) {
  aliasMap.set(normalize(country.displayName), country)
  country.aliases.forEach((alias) => aliasMap.set(normalize(alias), country))
}
aliasPairs.forEach(([alias, slug]) => {
  const target = bySlug.get(slug)
  if (target) aliasMap.set(normalize(alias), target)
})

export const getCountryBySlug = (slug: string) => bySlug.get(normalize(slug)) ?? null
export const getCountryByIso2 = (iso2: string) => byIso2.get(iso2.toLowerCase()) ?? null
export const getCountryByIso3 = (iso3: string) => byIso3.get(iso3.toLowerCase()) ?? null
export const getCountryByAlias = (alias: string) => aliasMap.get(normalize(alias)) ?? null
export const getDashboardCountryHref = (slug: string) => `/dashboard/country/${normalize(slug)}`
export const getDashboardSectionHref = (slug: string, section: DashboardSection) => `${getDashboardCountryHref(slug)}/${section}`
export function resolveCountryRouteParam(input: string) { return getCountryBySlug(input) ?? getCountryByAlias(input) ?? getCountryByIso2(input) ?? getCountryByIso3(input) }
export const isDashboardCountryAvailable = (slug: string) => ['available', 'request-only'].includes(getCountryBySlug(slug)?.routeAvailability ?? 'unavailable')

export const unresolvedCountryRecord = (featureId: string, name: string): CountryRegistryRecord => ({
  slug: normalize(name || featureId || 'unresolved-country'), iso2: 'ZZ', iso3: 'ZZZ', displayName: name || 'Unresolved Country', aliases: [], region: 'Unmapped', subregion: 'Unmapped', globeFeatureId: featureId, dashboardPath: '/dashboard/country/unresolved-country', defaultDashboardSection: 'market', routeAvailability: 'request-only', dashboardStatus: 'fallback-backed', lastUpdated: '2026-05-28', publicSummary: 'This geography is not yet in the canonical registry; safe fallback enabled.',
})
