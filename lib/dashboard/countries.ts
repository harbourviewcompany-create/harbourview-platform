import type { CountryDashboardSummary, DashboardPanelState, DashboardSection } from './contracts'

const status = (state: DashboardPanelState, summary: string) => ({ state, summary, actions: [] })

const baseCountries: CountryDashboardSummary[] = [
  ['germany','DE','DEU','Germany','Europe','Western Europe','live'],
  ['italy','IT','ITA','Italy','Europe','Southern Europe','partial'],
  ['new-zealand','NZ','NZL','New Zealand','Oceania','Australia and New Zealand','request-only'],
  ['canada','CA','CAN','Canada','Americas','North America','live'],
  ['united-states','US','USA','United States','Americas','North America','live'],
  ['united-kingdom','GB','GBR','United Kingdom','Europe','Northern Europe','partial'],
  ['portugal','PT','PRT','Portugal','Europe','Southern Europe','review-required'],
  ['australia','AU','AUS','Australia','Oceania','Australia and New Zealand','partial'],
  ['colombia','CO','COL','Colombia','Americas','South America','fallback-backed'],
  ['israel','IL','ISR','Israel','Asia','Western Asia','unavailable'],
].map(([slug,iso2,iso3,displayName,region,subregion,dashboardStatus]) => ({
  slug, iso2, iso3, displayName, region, subregion,
  aliases: [], globeFeatureId: slug, dashboardPath: `/dashboard/country/${slug}`,
  defaultDashboardSection: 'market' as DashboardSection,
  routeAvailability: dashboardStatus as DashboardPanelState,
  dashboardStatus: dashboardStatus as DashboardPanelState,
  lastUpdated: '2026-05-28',
  publicSummary: `${displayName} dashboard orientation and routing profile.`,
  panels: {
    market: status(dashboardStatus as DashboardPanelState, `${displayName} market panel`),
    education: status('partial', `${displayName} education panel`),
    compliance: status('review-required', `${displayName} compliance panel`),
    signals: status('fallback-backed', `${displayName} signals panel`),
    opportunities: status('request-only', `${displayName} opportunities panel`),
    intelligence: status('static-orientation', `${displayName} intelligence panel`),
    connections: status('unavailable', `${displayName} connections panel`),
  }
}))

const aliasMap: Record<string, string> = {
  usa: 'united-states', us: 'united-states', 'united states': 'united-states',
  uk: 'united-kingdom', 'great britain': 'united-kingdom',
  'czech republic': 'czechia', turkey: 'turkiye', 'ivory coast': 'cote-divoire', holland: 'netherlands',
  'south korea': 'korea-republic', 'republic of korea': 'korea-republic', 'north korea': 'korea-dprk', dprk: 'korea-dprk',
  'russian federation': 'russia', 'islamic republic of iran': 'iran', 'bolivarian republic of venezuela': 'venezuela',
  'plurinational state of bolivia': 'bolivia', 'united republic of tanzania': 'tanzania', 'viet nam': 'vietnam',
  'lao pdr': 'laos', 'syrian arab republic': 'syria', 'republic of moldova': 'moldova', congo: 'congo-republic',
  drc: 'congo-democratic-republic', 'palestinian territory': 'palestine'
}

export const countries = baseCountries
export const dashboardSections: Exclude<DashboardSection,'overview'>[] = ['market','education','compliance','signals','opportunities','intelligence','connections']

const bySlug = new Map(countries.map((c) => [c.slug, c]))
const byIso2 = new Map(countries.map((c) => [c.iso2.toLowerCase(), c]))
const byIso3 = new Map(countries.map((c) => [c.iso3.toLowerCase(), c]))

export const getCountryBySlug = (slug?: string | null) => (slug ? bySlug.get(slug.toLowerCase()) ?? null : null)
export const getCountryByIso2 = (iso2?: string | null) => (iso2 ? byIso2.get(iso2.toLowerCase()) ?? null : null)
export const getCountryByIso3 = (iso3?: string | null) => (iso3 ? byIso3.get(iso3.toLowerCase()) ?? null : null)
export const getCountryByAlias = (alias?: string | null) => {
  if (!alias) return null
  const key = alias.toLowerCase().trim()
  return getCountryBySlug(aliasMap[key] ?? key)
}
export const resolveCountryRouteParam = (value?: string | null) => getCountryBySlug(value) ?? getCountryByIso2(value) ?? getCountryByIso3(value) ?? getCountryByAlias(value)
export const getDashboardCountryHref = (slug: string) => `/dashboard/country/${slug}`
export const getDashboardSectionHref = (slug: string, section: Exclude<DashboardSection,'overview'>) => `${getDashboardCountryHref(slug)}/${section}`
export const isDashboardCountryAvailable = (slug: string) => (getCountryBySlug(slug)?.dashboardStatus ?? 'unavailable') !== 'unavailable'
export const getDashboardSafeUnresolvedCountry = (name: string) => ({ reason: 'unresolved-country', name, dashboardPath: '/dashboard', routeAvailability: 'unavailable' as const })
