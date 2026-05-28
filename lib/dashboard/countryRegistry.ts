export type DashboardPanelState =
  | 'live'
  | 'partial'
  | 'static-orientation'
  | 'fallback-backed'
  | 'request-only'
  | 'review-required'
  | 'unavailable'

export type DashboardSection =
  | 'overview'
  | 'market'
  | 'education'
  | 'compliance'
  | 'signals'
  | 'opportunities'
  | 'intelligence'
  | 'connections'

export type DashboardStatusBadge = 'live' | 'partial' | 'request-only' | 'review-required' | 'unavailable'

export type DashboardCountryRecord = {
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
  routeAvailability: 'available' | 'limited' | 'request-only' | 'unavailable'
  dashboardStatus: DashboardStatusBadge
  lastUpdated: string
  publicSummary: string
}

const REQUIRED = [
  ['germany', 'DE', 'DEU'],['italy','IT','ITA'],['new-zealand','NZ','NZL'],['canada','CA','CAN'],['united-states','US','USA'],['united-kingdom','GB','GBR'],['portugal','PT','PRT'],['australia','AU','AUS'],['colombia','CO','COL'],['israel','IL','ISR']
] as const

const extra: DashboardCountryRecord[] = [
  { slug:'czechia', iso2:'CZ', iso3:'CZE', displayName:'Czechia', aliases:['czech republic'], region:'Europe', subregion:'Eastern Europe', globeFeatureId:'CZE', dashboardPath:'/dashboard/country/czechia', defaultDashboardSection:'market', routeAvailability:'limited', dashboardStatus:'partial', lastUpdated:'2026-05-28', publicSummary:'Developing country dashboard coverage.'},
  { slug:'turkiye', iso2:'TR', iso3:'TUR', displayName:'Türkiye', aliases:['turkey'], region:'Asia', subregion:'Western Asia', globeFeatureId:'TUR', dashboardPath:'/dashboard/country/turkiye', defaultDashboardSection:'market', routeAvailability:'limited', dashboardStatus:'partial', lastUpdated:'2026-05-28', publicSummary:'Developing country dashboard coverage.'},
]

export const dashboardCountries: DashboardCountryRecord[] = [
  ...REQUIRED.map(([slug, iso2, iso3], i): DashboardCountryRecord => ({ slug, iso2, iso3, displayName: slug.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join(' '), aliases: [], region:'Global', subregion:'Global', globeFeatureId:iso3, dashboardPath:`/dashboard/country/${slug}`, defaultDashboardSection:'overview', routeAvailability: i%5===0?'request-only':i%4===0?'unavailable':i%3===0?'limited':'available', dashboardStatus:i%5===0?'request-only':i%4===0?'unavailable':i%3===0?'review-required':'live', lastUpdated:'2026-05-28', publicSummary:'Public dashboard summary available.' })),
  ...extra,
]

const aliasMap = new Map<string, string>()
for (const c of dashboardCountries) {
  for (const a of [c.displayName, c.slug, c.iso2, c.iso3, ...c.aliases]) aliasMap.set(normalize(a), c.slug)
}
const aliasPairs: Array<[string,string]> = [
  ['United States','united-states'],['USA','united-states'],['US','united-states'],['United Kingdom','united-kingdom'],['UK','united-kingdom'],['Great Britain','united-kingdom'],['Czech Republic','czechia'],['Turkey','turkiye'],['Côte d\'Ivoire','ivory-coast'],['Ivory Coast','ivory-coast'],['Netherlands','netherlands'],['Holland','netherlands'],['South Korea','south-korea'],['Republic of Korea','south-korea'],['North Korea','north-korea'],['DPRK','north-korea'],['Russia','russia'],['Russian Federation','russia'],['Iran','iran'],['Islamic Republic of Iran','iran'],['Venezuela','venezuela'],['Bolivarian Republic of Venezuela','venezuela'],['Bolivia','bolivia'],['Plurinational State of Bolivia','bolivia'],['Tanzania','tanzania'],['United Republic of Tanzania','tanzania'],['Vietnam','vietnam'],['Viet Nam','vietnam'],['Laos','laos'],['Lao PDR','laos'],['Syria','syria'],['Syrian Arab Republic','syria'],['Moldova','moldova'],['Republic of Moldova','moldova'],['Congo','congo'],['Republic of the Congo','congo'],['Democratic Republic of the Congo','democratic-republic-of-the-congo'],['DRC','democratic-republic-of-the-congo'],['Palestine','palestine'],['Palestinian Territory','palestine'],['Kosovo','kosovo'],['Taiwan','taiwan'],['Hong Kong','hong-kong'],['Macau','macau']
]
aliasPairs.forEach(([a,s])=>aliasMap.set(normalize(a), s))

function normalize(v:string){return v.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim()}
export function getCountryBySlug(slug:string){return dashboardCountries.find(c=>c.slug===slug) ?? null}
export function getCountryByIso2(iso2:string){return dashboardCountries.find(c=>c.iso2.toLowerCase()===iso2.toLowerCase()) ?? null}
export function getCountryByIso3(iso3:string){return dashboardCountries.find(c=>c.iso3.toLowerCase()===iso3.toLowerCase()) ?? null}
export function getCountryByAlias(input:string){const slug=aliasMap.get(normalize(input));return slug?getCountryBySlug(slug):null}
export function resolveCountryRouteParam(input:string){return getCountryBySlug(input) ?? getCountryByIso2(input) ?? getCountryByIso3(input) ?? getCountryByAlias(input)}
export function getDashboardCountryHref(country:string){const c=resolveCountryRouteParam(country); return c?.dashboardPath ?? '/dashboard'}
export function getDashboardSectionHref(country:string, section:DashboardSection){const c=resolveCountryRouteParam(country); if(!c) return '/dashboard'; return section==='overview'?c.dashboardPath:`${c.dashboardPath}/${section}`}
export function isDashboardCountryAvailable(country:string){const c=resolveCountryRouteParam(country); return !!c && c.routeAvailability!=='unavailable'}

export function unresolvedCountryRecord(label:string){
  return { label, reason:'territory-or-unmapped', safePath:'/dashboard', actions:['search','browse-region','return-to-globe'] as const }
}
