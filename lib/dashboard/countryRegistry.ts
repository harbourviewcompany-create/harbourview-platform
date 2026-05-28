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

export interface CountryDashboardRecord {
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
  routeAvailability: 'available' | 'limited' | 'unavailable'
  dashboardStatus: DashboardPanelState
  lastUpdated: string
  publicSummary: string
}

const mk = (r: Omit<CountryDashboardRecord, 'dashboardPath'>): CountryDashboardRecord => ({
  ...r,
  dashboardPath: `/dashboard/country/${r.slug}`,
})

export const countryRegistry: CountryDashboardRecord[] = [
  mk({ slug: 'germany', iso2: 'DE', iso3: 'DEU', displayName: 'Germany', aliases: ['deutschland'], region: 'Europe', subregion: 'Western Europe', globeFeatureId: 'DEU', defaultDashboardSection: 'market', routeAvailability: 'available', dashboardStatus: 'live', lastUpdated: '2026-05-28', publicSummary: 'Live market and compliance coverage for Germany.' }),
  mk({ slug: 'italy', iso2: 'IT', iso3: 'ITA', displayName: 'Italy', aliases: [], region: 'Europe', subregion: 'Southern Europe', globeFeatureId: 'ITA', defaultDashboardSection: 'market', routeAvailability: 'available', dashboardStatus: 'partial', lastUpdated: '2026-05-28', publicSummary: 'Partial dashboard with active market orientation.' }),
  mk({ slug: 'new-zealand', iso2: 'NZ', iso3: 'NZL', displayName: 'New Zealand', aliases: [], region: 'Oceania', subregion: 'Australia and New Zealand', globeFeatureId: 'NZL', defaultDashboardSection: 'education', routeAvailability: 'limited', dashboardStatus: 'review-required', lastUpdated: '2026-05-28', publicSummary: 'Review-required intelligence summaries available.' }),
  mk({ slug: 'canada', iso2: 'CA', iso3: 'CAN', displayName: 'Canada', aliases: [], region: 'North America', subregion: 'Northern America', globeFeatureId: 'CAN', defaultDashboardSection: 'signals', routeAvailability: 'available', dashboardStatus: 'live', lastUpdated: '2026-05-28', publicSummary: 'Live dashboard with high signal availability.' }),
  mk({ slug: 'united-states', iso2: 'US', iso3: 'USA', displayName: 'United States', aliases: ['united states of america', 'usa', 'us'], region: 'North America', subregion: 'Northern America', globeFeatureId: 'USA', defaultDashboardSection: 'compliance', routeAvailability: 'available', dashboardStatus: 'partial', lastUpdated: '2026-05-28', publicSummary: 'Partial federal-state synthesis and pathways.' }),
  mk({ slug: 'united-kingdom', iso2: 'GB', iso3: 'GBR', displayName: 'United Kingdom', aliases: ['uk', 'great britain'], region: 'Europe', subregion: 'Northern Europe', globeFeatureId: 'GBR', defaultDashboardSection: 'compliance', routeAvailability: 'available', dashboardStatus: 'live', lastUpdated: '2026-05-28', publicSummary: 'Live UK panel coverage and education views.' }),
  mk({ slug: 'portugal', iso2: 'PT', iso3: 'PRT', displayName: 'Portugal', aliases: [], region: 'Europe', subregion: 'Southern Europe', globeFeatureId: 'PRT', defaultDashboardSection: 'opportunities', routeAvailability: 'available', dashboardStatus: 'request-only', lastUpdated: '2026-05-28', publicSummary: 'Opportunity and request-first posture.' }),
  mk({ slug: 'australia', iso2: 'AU', iso3: 'AUS', displayName: 'Australia', aliases: [], region: 'Oceania', subregion: 'Australia and New Zealand', globeFeatureId: 'AUS', defaultDashboardSection: 'market', routeAvailability: 'available', dashboardStatus: 'partial', lastUpdated: '2026-05-28', publicSummary: 'Partial market and connection overviews.' }),
  mk({ slug: 'colombia', iso2: 'CO', iso3: 'COL', displayName: 'Colombia', aliases: [], region: 'Americas', subregion: 'South America', globeFeatureId: 'COL', defaultDashboardSection: 'signals', routeAvailability: 'limited', dashboardStatus: 'fallback-backed', lastUpdated: '2026-05-28', publicSummary: 'Fallback-backed dashboard for directional signals.' }),
  mk({ slug: 'israel', iso2: 'IL', iso3: 'ISR', displayName: 'Israel', aliases: [], region: 'Asia', subregion: 'Western Asia', globeFeatureId: 'ISR', defaultDashboardSection: 'intelligence', routeAvailability: 'available', dashboardStatus: 'unavailable', lastUpdated: '2026-05-28', publicSummary: 'Unavailable public dashboard; review channel available.' }),
]

const additionalAliases: Record<string, string> = {
  'czech republic': 'czechia', turkey: 'turkiye', 'ivory coast': 'cote-divoire', holland: 'netherlands',
  'south korea': 'south-korea', 'republic of korea': 'south-korea', 'north korea': 'north-korea', dprk: 'north-korea',
  russia: 'russia', 'russian federation': 'russia', iran: 'iran', 'islamic republic of iran': 'iran',
  venezuela: 'venezuela', 'bolivarian republic of venezuela': 'venezuela', bolivia: 'bolivia', 'plurinational state of bolivia': 'bolivia',
  tanzania: 'tanzania', 'united republic of tanzania': 'tanzania', 'viet nam': 'vietnam', laos: 'laos', 'lao pdr': 'laos',
  syria: 'syria', 'syrian arab republic': 'syria', moldova: 'moldova', 'republic of moldova': 'moldova',
  congo: 'congo', 'republic of the congo': 'congo', 'democratic republic of the congo': 'democratic-republic-of-the-congo', drc: 'democratic-republic-of-the-congo',
  palestine: 'palestine', 'palestinian territory': 'palestine', kosovo: 'kosovo', taiwan: 'taiwan', 'hong kong': 'hong-kong', macau: 'macau',
}

const slugIndex = new Map(countryRegistry.map((c) => [c.slug, c]))
const iso2Index = new Map(countryRegistry.map((c) => [c.iso2.toLowerCase(), c]))
const iso3Index = new Map(countryRegistry.map((c) => [c.iso3.toLowerCase(), c]))
const aliasIndex = new Map<string, CountryDashboardRecord>()
for (const c of countryRegistry) for (const a of [c.displayName, ...c.aliases]) aliasIndex.set(a.toLowerCase(), c)

export const dashboardSections: DashboardSection[] = ['market', 'education', 'compliance', 'signals', 'opportunities', 'intelligence', 'connections']

export const getCountryBySlug = (slug: string) => slugIndex.get(slug.toLowerCase()) ?? null
export const getCountryByIso2 = (iso2: string) => iso2Index.get(iso2.toLowerCase()) ?? null
export const getCountryByIso3 = (iso3: string) => iso3Index.get(iso3.toLowerCase()) ?? null
export const getCountryByAlias = (alias: string) => aliasIndex.get(alias.toLowerCase()) ?? null
export const getDashboardCountryHref = (country: CountryDashboardRecord | string) => `/dashboard/country/${typeof country === 'string' ? country : country.slug}`
export const getDashboardSectionHref = (country: CountryDashboardRecord | string, section: DashboardSection) => `${getDashboardCountryHref(country)}/${section}`
export const resolveCountryRouteParam = (param: string) => getCountryBySlug(param) ?? getCountryByIso2(param) ?? getCountryByIso3(param) ?? getCountryByAlias(param) ?? null
export const isDashboardCountryAvailable = (slug: string) => getCountryBySlug(slug)?.routeAvailability !== 'unavailable'

export const resolveGlobeCountryName = (name: string) => resolveCountryRouteParam(additionalAliases[name.toLowerCase()] ?? name)
