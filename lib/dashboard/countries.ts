import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { canadaProvinceProfiles, canadaProvinceBySlug, canadaProvinceByIso2 } from '@/data/globe/canada-province-profiles'
import { usStateProfiles, usStateByIso2, usStateBySlug, usStateByAbbr } from '@/data/globe/us-state-profiles'
import type {
  CountryDashboardPanels,
  CountryDashboardSummary,
  DashboardPanelCopy,
  DashboardPanelState,
  DashboardSectionSlug,
  GlobeRouteSourceEventType,
  GlobeRoutingEventPayload,
  RouteAvailability,
} from './contracts'

export const dashboardSections: DashboardSectionSlug[] = [
  'market',
  'education',
  'compliance',
  'signals',
  'opportunities',
  'intelligence',
  'connections',
]

const REQUIRED_ALIAS_GROUPS: Record<string, string[]> = {
  'united-states': ['United States', 'USA', 'US'],
  'united-kingdom': ['United Kingdom', 'UK', 'Great Britain'],
  czechia: ['Czechia', 'Czech Republic'],
  turkiye: ['Türkiye', 'Turkey'],
  'cote-divoire': ['Côte d’Ivoire', 'Cote d Ivoire', 'Ivory Coast'],
  netherlands: ['Netherlands', 'Holland'],
  'south-korea': ['South Korea', 'Republic of Korea'],
  'north-korea': ['North Korea', 'DPRK'],
  russia: ['Russia', 'Russian Federation'],
  iran: ['Iran', 'Islamic Republic of Iran'],
  venezuela: ['Venezuela', 'Bolivarian Republic of Venezuela'],
  bolivia: ['Bolivia', 'Plurinational State of Bolivia'],
  tanzania: ['Tanzania', 'United Republic of Tanzania'],
  vietnam: ['Vietnam', 'Viet Nam'],
  laos: ['Laos', 'Lao PDR'],
  syria: ['Syria', 'Syrian Arab Republic'],
  moldova: ['Moldova', 'Republic of Moldova'],
  'congo-republic': ['Congo', 'Republic of the Congo'],
  'democratic-republic-of-the-congo': ['Democratic Republic of the Congo', 'DRC'],
  palestine: ['Palestine', 'Palestinian Territory'],
  kosovo: ['Kosovo'],
  taiwan: ['Taiwan'],
  'hong-kong': ['Hong Kong'],
  macau: ['Macau'],
}

const fixtureStatusBySlug: Record<string, DashboardPanelState> = {
  germany: 'live',
  italy: 'partial',
  'new-zealand': 'request-only',
  canada: 'live',
  brazil: 'live',
  'united-states': 'partial',
  'united-kingdom': 'review-required',
  portugal: 'fallback-backed',
  australia: 'static-orientation',
  colombia: 'request-only',
  israel: 'unavailable',
}

const fixtureSummaries: Record<string, string> = {
  germany: 'Live country console for medical-market posture, compliance routing, signals, and reviewed opportunity intake.',
  italy: 'Partial country console with reviewed orientation and request-routed country intelligence.',
  'new-zealand': 'Request-only country console for private market, compliance, and connection review.',
  canada: 'Live country console for supply-chain posture, market education, and dashboard section routing.',
  brazil: 'Live commercial operating dashboard for marketplace workflows, trade access, professional education, readiness gates, and supporting movement.',
  'united-states': 'Partial country console with state-sensitive orientation and reviewed routing boundaries.',
  'united-kingdom': 'Review-required country console for medical-market orientation and private routing.',
  portugal: 'Fallback-backed country console for EU-adjacent production and export orientation.',
  australia: 'Static orientation country console for market, education, and signal routing.',
  colombia: 'Request-only country console for export posture and opportunity review intake.',
  israel: 'Unavailable country console with safe request-review and return-to-globe routing only.',
}

const countryOverrides: Record<string, Partial<CountryDashboardSummary>> = {
  'united-states': { iso2: 'US', iso3: 'USA', displayName: 'United States', region: 'Americas', subregion: 'North America' },
  'united-kingdom': { iso2: 'GB', iso3: 'GBR', displayName: 'United Kingdom', region: 'Europe', subregion: 'Northern Europe' },
  czechia: { iso2: 'CZ', iso3: 'CZE', displayName: 'Czechia', region: 'Europe', subregion: 'Eastern Europe' },
  turkiye: { iso2: 'TR', iso3: 'TUR', displayName: 'Türkiye', region: 'Asia', subregion: 'Western Asia' },
  'cote-divoire': { iso2: 'CI', iso3: 'CIV', displayName: 'Côte d’Ivoire', region: 'Africa', subregion: 'Western Africa' },
  'south-korea': { iso2: 'KR', iso3: 'KOR', displayName: 'South Korea', region: 'Asia', subregion: 'Eastern Asia' },
  'north-korea': { iso2: 'KP', iso3: 'PRK', displayName: 'North Korea', region: 'Asia', subregion: 'Eastern Asia' },
  russia: { iso2: 'RU', iso3: 'RUS', displayName: 'Russia', region: 'Europe', subregion: 'Eastern Europe' },
  iran: { iso2: 'IR', iso3: 'IRN', displayName: 'Iran', region: 'Asia', subregion: 'Southern Asia' },
  'congo-republic': { iso2: 'CG', iso3: 'COG', displayName: 'Republic of the Congo', region: 'Africa', subregion: 'Middle Africa' },
  'democratic-republic-of-the-congo': { iso2: 'CD', iso3: 'COD', displayName: 'Democratic Republic of the Congo', region: 'Africa', subregion: 'Middle Africa' },
  palestine: { iso2: 'PS', iso3: 'PSE', displayName: 'Palestine', region: 'Asia', subregion: 'Western Asia' },
  kosovo: { iso2: 'XK', iso3: 'XKX', displayName: 'Kosovo', region: 'Europe', subregion: 'Southern Europe' },
  taiwan: { iso2: 'TW', iso3: 'TWN', displayName: 'Taiwan', region: 'Asia', subregion: 'Eastern Asia' },
  'hong-kong': { iso2: 'HK', iso3: 'HKG', displayName: 'Hong Kong', region: 'Asia', subregion: 'Eastern Asia' },
  macau: { iso2: 'MO', iso3: 'MAC', displayName: 'Macau', region: 'Asia', subregion: 'Eastern Asia' },
}

const slugAliases: Record<string, string> = {
  'united-states-of-america': 'united-states',
  usa: 'united-states',
  us: 'united-states',
  'great-britain': 'united-kingdom',
  uk: 'united-kingdom',
  'czech-republic': 'czechia',
  turkey: 'turkiye',
  'cote-divoire': 'cote-divoire',
  'cote-d-ivoire': 'cote-divoire',
  'ivory-coast': 'cote-divoire',
  holland: 'netherlands',
  'republic-of-korea': 'south-korea',
  'korea-republic': 'south-korea',
  'dem-rep-korea': 'north-korea',
  'democratic-peoples-republic-of-korea': 'north-korea',
  dprk: 'north-korea',
  'korea-dprk': 'north-korea',
  'russian-federation': 'russia',
  'islamic-republic-of-iran': 'iran',
  'bolivarian-republic-of-venezuela': 'venezuela',
  'plurinational-state-of-bolivia': 'bolivia',
  'united-republic-of-tanzania': 'tanzania',
  'viet-nam': 'vietnam',
  'lao-pdr': 'laos',
  'syrian-arab-republic': 'syria',
  'republic-of-moldova': 'moldova',
  congo: 'congo-republic',
  'republic-of-the-congo': 'congo-republic',
  drc: 'democratic-republic-of-the-congo',
  'democratic-republic-of-congo': 'democratic-republic-of-the-congo',
  'palestinian-territory': 'palestine',
}

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function canonicalSlug(value: string) {
  const raw = slugify(value)
  return slugAliases[raw] ?? raw
}

function routeAvailabilityFor(state: DashboardPanelState): RouteAvailability {
  const available = state !== 'unavailable'
  return {
    market: available,
    education: available,
    compliance: available,
    signals: available,
    opportunities: available,
    intelligence: available,
    connections: state === 'live' || state === 'partial' || state === 'review-required',
  }
}

export function getDashboardCountryHref(slug: string) {
  return `/dashboard/country/${canonicalSlug(slug)}`
}

export function getDashboardSectionHref(slug: string, section: DashboardSectionSlug) {
  return `${getDashboardCountryHref(slug)}/${section}`
}

function panelCopy(state: DashboardPanelState, label: string): DashboardPanelCopy {
  const copyByState: Record<DashboardPanelState, Omit<DashboardPanelCopy, 'state' | 'label'>> = {
    live: { summary: `${label} is available in the dashboard console.`, emptyState: 'Live public dashboard orientation is available.', ctaLabel: 'Open live panel' },
    partial: { summary: `${label} has partial public orientation and reviewed follow-up paths.`, emptyState: 'Partial dashboard context is available; request review for deeper routing.', ctaLabel: 'Open partial panel' },
    'static-orientation': { summary: `${label} is static orientation content only.`, emptyState: 'Static orientation is shown while live sources remain outside the public surface.', ctaLabel: 'View orientation' },
    'fallback-backed': { summary: `${label} is backed by fallback orientation content.`, emptyState: 'Fallback content is shown because live records are not currently published.', ctaLabel: 'View fallback' },
    'request-only': { summary: `${label} is available through Harbourview request review.`, emptyState: 'Submit a request for Harbourview review before routing or disclosure.', ctaLabel: 'Request review' },
    'review-required': { summary: `${label} requires Harbourview review before deeper routing.`, emptyState: 'Review is required before this panel can be treated as current intelligence.', ctaLabel: 'Request review' },
    unavailable: { summary: `${label} is unavailable on the public dashboard.`, emptyState: 'This panel is not available; return to the globe or choose another country.', ctaLabel: 'Return to globe' },
  }

  return { state, label, ...copyByState[state] }
}

function makePanel(slug: string, section: DashboardSectionSlug, state: DashboardPanelState, label: string) {
  const stateCopy = panelCopy(state, label)
  const actions = [
    { label: stateCopy.ctaLabel, href: getDashboardSectionHref(slug, section), section, intent: 'section' as const },
    { label: 'Request Harbourview review', href: `/contact?intent=dashboard-review&country=${slug}&section=${section}`, section, intent: 'review-request' as const },
  ]

  return { state, publicSummary: stateCopy.summary, stateCopy, actions }
}

function buildPanels(slug: string, status: DashboardPanelState): CountryDashboardPanels {
  return {
    market: { ...makePanel(slug, 'market', status, 'Market posture'), marketPosture: panelCopy(status, 'Market posture').summary },
    education: { ...makePanel(slug, 'education', status === 'unavailable' ? 'unavailable' : 'partial', 'Education status'), educationStatus: panelCopy(status === 'unavailable' ? 'unavailable' : 'partial', 'Education status').summary },
    compliance: { ...makePanel(slug, 'compliance', status === 'live' ? 'partial' : 'review-required', 'Compliance status'), complianceStatus: panelCopy(status === 'live' ? 'partial' : 'review-required', 'Compliance status').summary },
    signals: { ...makePanel(slug, 'signals', status === 'unavailable' ? 'unavailable' : 'fallback-backed', 'Signal availability'), signalAvailability: panelCopy(status === 'unavailable' ? 'unavailable' : 'fallback-backed', 'Signal availability').summary },
    opportunities: { ...makePanel(slug, 'opportunities', status === 'unavailable' ? 'unavailable' : 'request-only', 'Opportunity status'), opportunityStatus: panelCopy(status === 'unavailable' ? 'unavailable' : 'request-only', 'Opportunity status').summary },
    intelligence: { ...makePanel(slug, 'intelligence', status === 'unavailable' ? 'unavailable' : 'static-orientation', 'Intelligence status'), intelligenceStatus: panelCopy(status === 'unavailable' ? 'unavailable' : 'static-orientation', 'Intelligence status').summary },
    connections: { ...makePanel(slug, 'connections', status === 'live' ? 'partial' : status === 'unavailable' ? 'unavailable' : 'review-required', 'Reviewed connections'), connectionStatus: panelCopy(status === 'live' ? 'partial' : status === 'unavailable' ? 'unavailable' : 'review-required', 'Reviewed connections').summary },
  }
}

function makeCountry(input: { displayName: string; iso2: string; iso3: string; region?: string; subregion?: string; globeFeatureId?: string }): CountryDashboardSummary {
  const slug = canonicalSlug(input.displayName)
  const override = countryOverrides[slug]
  const displayName = override?.displayName ?? input.displayName
  const dashboardStatus = fixtureStatusBySlug[slug] ?? 'fallback-backed'
  const aliases = REQUIRED_ALIAS_GROUPS[slug] ?? [displayName]
  const dashboardPath = getDashboardCountryHref(slug)

  return {
    slug,
    iso2: override?.iso2 ?? input.iso2,
    iso3: override?.iso3 ?? input.iso3,
    displayName,
    aliases,
    region: override?.region ?? input.region ?? 'Global',
    subregion: override?.subregion ?? input.subregion ?? 'Unspecified',
    globeFeatureId: input.globeFeatureId ?? input.iso3,
    dashboardPath,
    defaultDashboardSection: 'market',
    routeAvailability: routeAvailabilityFor(dashboardStatus),
    dashboardStatus,
    lastUpdated: '2026-05-28',
    publicSummary: fixtureSummaries[slug] ?? `${displayName} has a dashboard-safe country routing record. Detailed intelligence remains review-gated until Harbourview publishes country-specific panels.`,
    panels: buildPanels(slug, dashboardStatus),
  }
}

const naturalEarthRecords = naturalEarthCountriesPayload.countries.map((country) => makeCountry({
  displayName: country.name,
  iso2: country.iso2,
  iso3: country.iso3,
  globeFeatureId: country.iso3,
}))

const supplementalRecords = ['kosovo', 'taiwan', 'hong-kong', 'macau']
  .map((slug) => countryOverrides[slug])
  .filter((country): country is Partial<CountryDashboardSummary> & { displayName: string; iso2: string; iso3: string } => Boolean(country?.displayName && country.iso2 && country.iso3))
  .map((country) => makeCountry({ displayName: country.displayName, iso2: country.iso2, iso3: country.iso3, region: country.region, subregion: country.subregion, globeFeatureId: country.iso3 }))

const dedupedCountries = new Map<string, CountryDashboardSummary>()
for (const country of [...naturalEarthRecords, ...supplementalRecords]) {
  dedupedCountries.set(country.slug, country)
}

export const countries = [...dedupedCountries.values()].sort((a, b) => a.displayName.localeCompare(b.displayName))
export const fixtureCountries = countries.filter((country) => Object.hasOwn(fixtureStatusBySlug, country.slug))

const bySlug = new Map(countries.map((country) => [country.slug, country]))
const byIso2 = new Map(countries.map((country) => [country.iso2.toLowerCase(), country]))
const byIso3 = new Map(countries.map((country) => [country.iso3.toLowerCase(), country]))
const byAlias = new Map<string, CountryDashboardSummary>()

for (const country of countries) {
  byAlias.set(slugify(country.displayName), country)
  byAlias.set(country.iso2.toLowerCase(), country)
  byAlias.set(country.iso3.toLowerCase(), country)
  for (const alias of country.aliases) {
    byAlias.set(slugify(alias), country)
    byAlias.set(alias.toLowerCase(), country)
  }
}

for (const [alias, slug] of Object.entries(slugAliases)) {
  const country = bySlug.get(slug)
  if (country) byAlias.set(alias, country)
}

export function getCountryBySlug(slug?: string | null) {
  if (!slug) return null
  return bySlug.get(canonicalSlug(slug)) ?? null
}

export function getCountryByIso2(iso2?: string | null) {
  if (!iso2) return null
  return byIso2.get(iso2.toLowerCase()) ?? null
}

export function getCountryByIso3(iso3?: string | null) {
  if (!iso3) return null
  return byIso3.get(iso3.toLowerCase()) ?? null
}

export function getCountryByAlias(alias?: string | null) {
  if (!alias) return null
  return byAlias.get(slugify(alias)) ?? byAlias.get(alias.toLowerCase()) ?? null
}

export function resolveCountryRouteParam(value?: string | null) {
  if (!value) return undefined

  // ── Canada provinces ──────────────────────────────────────────────────────
  // Matches: slug ('ontario'), ISO 3166-2 ('CA-ON').
  const province = canadaProvinceBySlug[value] ?? canadaProvinceByIso2[value.toUpperCase()] ?? null
  if (province) {
    const parent = getCountryBySlug('canada')
    return {
      iso2: province.iso2,
      iso3: province.iso2.replace('-', ''),
      displayName: province.name,
      slug: province.slug,
      region: 'Americas',
      subregion: 'North America',
      aliases: [province.abbreviation],
      dashboardStatus: province.dashboardStatus,
      defaultDashboardSection: 'market' as DashboardSectionSlug,
      globeFeatureId: province.iso2,
      lastUpdated: '2026-05-30',
      dashboardPath: `/dashboard/country/${province.slug}`,
      publicSummary: `Province-level cannabis intelligence for ${province.name}. Regulated under Canadian federal law with province-specific retail authority.`,
      panels: buildPanels(province.slug, province.dashboardStatus),
      routeAvailability: routeAvailabilityFor(province.dashboardStatus),
      parentIso2: 'CA',
      parentSlug: 'canada',
      parentDisplayName: 'Canada',
      parentDashboardSummary: parent,
      regulatoryAuthority: province.retailAuthority,
      regulatoryNotes: province.keyNotes,
    } as CountryDashboardSummary & {
      parentIso2: string
      parentSlug: string
      parentDisplayName: string
      parentDashboardSummary: typeof parent
      regulatoryAuthority: string
      regulatoryNotes: string
    }
  }

  // ── US states ─────────────────────────────────────────────────────────────
  // Matches: full slug ('illinois', 'new-york') or explicit ISO 3166-2 ('US-IL').
  // Bare 2-letter values ('IL', 'IN', 'DE'…) intentionally fall through to
  // country resolution below — prevents collision with sovereign ISO2 codes
  // (IL=Israel, IN=India, DE=Germany, CO=Colombia, GA=Georgia, OR=unknown).
  // Globe clicks produce 'US-XX' — caught by isExplicitStateIso2.
  const isStateSlug = value.length > 3 || (value.includes('-') && !value.toUpperCase().startsWith('CA-'))
  const isExplicitStateIso2 = value.toUpperCase().startsWith('US-')
  const state =
    (isStateSlug || isExplicitStateIso2)
      ? (usStateBySlug[value] ?? usStateByIso2[value.toUpperCase()] ?? null)
      : null

  if (state) {
    return {
      iso2: state.iso2,
      // Use the ISO 3166-2 code (state.iso2 = 'US-MI') rather than the
      // fabricated 'USA-MI' which rendered visibly in the page header.
      iso3: state.iso2,
      displayName: state.name,
      slug: state.slug,
      region: 'Americas',
      subregion: 'North America',
      aliases: [state.abbreviation, `${state.name} USA`, `${state.name}, USA`],
      dashboardStatus: state.dashboardStatus,
      defaultDashboardSection: 'market' as DashboardSectionSlug,
      globeFeatureId: state.iso2,
      lastUpdated: '2026-05-30',
      dashboardPath: `/dashboard/country/${state.slug}`,
      publicSummary: `State-level cannabis intelligence for ${state.name}. Each state operates its own regulatory framework independently from federal law.`,
      // Build panels from the state's own dashboardStatus so the overview badge
      // and panel states are consistent (previously inherited US parent panels).
      panels: buildPanels(state.slug, state.dashboardStatus),
      routeAvailability: routeAvailabilityFor(state.dashboardStatus),
      parentIso2: 'US',
      parentSlug: 'united-states',
      parentDisplayName: 'United States',
      parentDashboardSummary: getCountryBySlug('united-states'),
    } as CountryDashboardSummary & {
      parentIso2: string
      parentSlug: string
      parentDisplayName: string
      parentDashboardSummary: ReturnType<typeof getCountryBySlug>
    }
  }

  // ── Countries ─────────────────────────────────────────────────────────────
  // Bare 2-letter values land here: IL→Israel, IN→India, DE→Germany, etc.
  return getCountryBySlug(value) ?? getCountryByIso2(value) ?? getCountryByIso3(value) ?? getCountryByAlias(value)
}

export function isDashboardCountryAvailable(slug: string) {
  return getCountryBySlug(slug)?.dashboardStatus !== 'unavailable'
}

export function getDashboardSafeUnresolvedCountry(name: string) {
  return {
    reason: 'unresolved-country',
    name,
    dashboardPath: '/dashboard',
    routeAvailability: 'unavailable' as const,
    publicSummary: 'This globe feature is not mapped to a canonical Harbourview dashboard country record.',
  }
}

export function createGlobeRoutingPayload(country: CountryDashboardSummary, sourceEventType: GlobeRouteSourceEventType, selectedDashboardSection?: DashboardSectionSlug): GlobeRoutingEventPayload {
  return {
    slug: country.slug,
    displayName: country.displayName,
    iso2: country.iso2,
    sourceEventType,
    routeTarget: selectedDashboardSection ? getDashboardSectionHref(country.slug, selectedDashboardSection) : country.dashboardPath,
    timestamp: new Date().toISOString(),
    dashboardAvailability: country.dashboardStatus,
    selectedDashboardSection,
  }
}
