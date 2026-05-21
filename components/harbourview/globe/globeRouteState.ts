export type GlobeMarketKey = 'germany' | 'portugal' | 'uk' | 'canada' | 'australia' | 'latam'
export type GlobeRoleKey = 'buyer' | 'seller' | 'exporter' | 'importer' | 'operator' | 'investor'
export type GlobeIntentKey = 'find-supply' | 'sell-export' | 'source-services' | 'request-intelligence' | 'private-intake'
export type GlobeRouteKind = 'default' | 'selected-market' | 'role-sheet' | 'intent-sheet' | 'multi-market' | 'fallback'

export type GlobeMarketOption = { key: GlobeMarketKey; label: string; summary: string }
export type GlobeRoleOption = { key: GlobeRoleKey; label: string }
export type GlobeIntentOption = { key: GlobeIntentKey; label: string }

export type GlobeRouteState = {
  kind: GlobeRouteKind
  selectedMarket: GlobeMarketOption | null
  selectedRole: GlobeRoleOption | null
  selectedIntent: GlobeIntentOption | null
  multiMarkets: GlobeMarketOption[]
  invalidParams: string[]
}

export const globeInteractionStateMap: Record<GlobeRouteKind, string> = {
  default: 'country-selection',
  'selected-market': 'market-focused',
  'role-sheet': 'role-focused',
  'intent-sheet': 'intent-focused',
  'multi-market': 'cross-market-compare',
  fallback: 'intake-fallback',
}

export const globeMarketOptions: GlobeMarketOption[] = [
  { key: 'germany', label: 'Germany', summary: 'EU-GMP import, distribution and pharmacy-access orientation.' },
  { key: 'portugal', label: 'Portugal', summary: 'Cultivation, processing, export and EU pathway context.' },
  { key: 'uk', label: 'United Kingdom', summary: 'Clinic, importer, specials and private-prescription pathway context.' },
  { key: 'canada', label: 'Canada', summary: 'Licensed producer, surplus, equipment and export-readiness context.' },
  { key: 'australia', label: 'Australia', summary: 'Importer, sponsor, clinic and product-access pathway context.' },
  { key: 'latam', label: 'Latin America', summary: 'Regional supply, licensing and market-access orientation.' },
]

export const globeRoleOptions: GlobeRoleOption[] = [
  { key: 'buyer', label: 'Buyer' },
  { key: 'seller', label: 'Seller' },
  { key: 'exporter', label: 'Exporter' },
  { key: 'importer', label: 'Importer' },
  { key: 'operator', label: 'Operator' },
  { key: 'investor', label: 'Investor' },
]

export const globeIntentOptions: GlobeIntentOption[] = [
  { key: 'find-supply', label: 'Find supply' },
  { key: 'sell-export', label: 'Sell or export' },
  { key: 'source-services', label: 'Source services' },
  { key: 'request-intelligence', label: 'Request intelligence' },
  { key: 'private-intake', label: 'Private intake' },
]

const marketMap = new Map(globeMarketOptions.map((market) => [market.key, market]))
const roleMap = new Map(globeRoleOptions.map((role) => [role.key, role]))
const intentMap = new Map(globeIntentOptions.map((intent) => [intent.key, intent]))

type ReadonlyURLSearchParamsLike = Pick<URLSearchParams, 'get' | 'toString'>

function firstParam(params: ReadonlyURLSearchParamsLike, key: string) {
  const value = params.get(key)
  return value && value.trim() ? value.trim().toLowerCase() : null
}

function parseList(value: string | null) {
  if (!value) return []
  return value.split(',').map((entry) => entry.trim().toLowerCase()).filter(Boolean)
}

export function parseGlobeRouteState(params: ReadonlyURLSearchParamsLike): GlobeRouteState {
  const invalidParams: string[] = []
  const marketKey = firstParam(params, 'market')
  const roleKey = firstParam(params, 'role')
  const intentKey = firstParam(params, 'intent')
  const route = firstParam(params, 'route')
  const marketList = parseList(firstParam(params, 'markets'))

  const selectedMarket = marketKey ? marketMap.get(marketKey as GlobeMarketKey) || null : null
  const selectedRole = roleKey ? roleMap.get(roleKey as GlobeRoleKey) || null : null
  const selectedIntent = intentKey ? intentMap.get(intentKey as GlobeIntentKey) || null : null
  const multiMarkets = marketList.map((entry) => marketMap.get(entry as GlobeMarketKey)).filter((entry): entry is GlobeMarketOption => Boolean(entry))

  if (marketKey && !selectedMarket) invalidParams.push(`market=${marketKey}`)
  if (roleKey && !selectedRole) invalidParams.push(`role=${roleKey}`)
  if (intentKey && !selectedIntent) invalidParams.push(`intent=${intentKey}`)
  if (route && route !== 'fallback') invalidParams.push(`route=${route}`)
  for (const entry of marketList) if (!marketMap.has(entry as GlobeMarketKey)) invalidParams.push(`markets=${entry}`)

  if (route === 'fallback' || invalidParams.length > 0) return { kind: 'fallback', selectedMarket, selectedRole, selectedIntent, multiMarkets, invalidParams }
  if (multiMarkets.length > 1) return { kind: 'multi-market', selectedMarket, selectedRole, selectedIntent, multiMarkets, invalidParams }
  if (selectedIntent) return { kind: 'intent-sheet', selectedMarket, selectedRole, selectedIntent, multiMarkets, invalidParams }
  if (selectedRole) return { kind: 'role-sheet', selectedMarket, selectedRole, selectedIntent, multiMarkets, invalidParams }
  if (selectedMarket) return { kind: 'selected-market', selectedMarket, selectedRole, selectedIntent, multiMarkets, invalidParams }
  return { kind: 'default', selectedMarket, selectedRole, selectedIntent, multiMarkets, invalidParams }
}

export function buildGlobeQuery(current: ReadonlyURLSearchParamsLike, updates: { market?: GlobeMarketKey | null; role?: GlobeRoleKey | null; intent?: GlobeIntentKey | null; markets?: GlobeMarketKey[] | null; route?: 'fallback' | null }) {
  const params = new URLSearchParams(current.toString())
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) params.delete(key)
    else if (Array.isArray(value)) params.set(key, value.join(','))
    else params.set(key, String(value))
  }
  return params.toString()
}
