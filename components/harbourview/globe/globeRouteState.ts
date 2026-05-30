import { allCountryAndProvinceOptions as countryOptions } from '@/config/globe/country-role-profiles'
import { intentProfiles } from '@/config/globe/intent-profiles'
import { roleProfiles } from '@/config/globe/role-profiles'
import { resolveGlobeRoute } from '@/lib/globe/route-resolver'
import type { IntentId, RoleId } from '@/types/globe-router'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const marketIsoByKey = {
  germany: 'DE',
  portugal: 'PT',
  uk: 'GB',
  canada: 'CA',
  australia: 'AU',
  latam: 'LATAM',
} as const

export type GlobeMarketKey = keyof typeof marketIsoByKey
export type GlobeRoleKey = RoleId
export type GlobeIntentKey = IntentId
export type GlobeRouteKind = 'default' | 'selected-market' | 'role-sheet' | 'intent-sheet' | 'multi-market' | 'fallback'

export type GlobeMarketOption = { key: GlobeMarketKey; label: string; summary: string; iso2s: string[] }
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

const countryName = (iso2: string) => countryOptions.find((c) => c.iso2 === iso2)?.name ?? iso2

export const globeMarketOptions: GlobeMarketOption[] = [
  { key: 'germany', label: countryName('DE'), summary: 'EU-GMP import, distribution and pharmacy-access orientation.', iso2s: ['DE'] },
  { key: 'portugal', label: countryName('PT'), summary: 'Cultivation, processing, export and EU pathway context.', iso2s: ['PT'] },
  { key: 'uk', label: countryName('GB'), summary: 'Clinic, importer, specials and private-prescription pathway context.', iso2s: ['GB'] },
  { key: 'canada', label: countryName('CA'), summary: 'Licensed producer, surplus, equipment and export-readiness context.', iso2s: ['CA'] },
  { key: 'australia', label: countryName('AU'), summary: 'Importer, sponsor, clinic and product-access pathway context.', iso2s: ['AU'] },
  { key: 'latam', label: 'Latin America', summary: 'Regional supply, licensing and market-access orientation.', iso2s: ['CO', 'UY'] },
]

export const globeRoleOptions: GlobeRoleOption[] = roleProfiles.map((role) => ({ key: role.id, label: role.shortLabel }))
export const globeIntentOptions: GlobeIntentOption[] = intentProfiles.map((intent) => ({ key: intent.id, label: intent.label }))

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

function hasResolverFallback(selectedIntent: GlobeIntentOption | null, selectedRole: GlobeRoleOption | null, selectedMarket: GlobeMarketOption | null, multiMarkets: GlobeMarketOption[]) {
  if (!selectedIntent) return false

  const selectedIso2s = multiMarkets.length > 0
    ? multiMarkets.flatMap((market) => market.iso2s)
    : (selectedMarket?.iso2s ?? [])

  const result = resolveGlobeRoute({
    source: 'globe_router',
    mode: selectedIso2s.length > 1 ? 'multi_market' : 'single_market',
    countryIso2: selectedIso2s[0],
    countryIso2s: selectedIso2s,
    roleId: selectedRole?.key,
    intentId: selectedIntent.key,
  })

  return result.status === 'fallback'
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

  if (route === 'fallback' || invalidParams.length > 0 || hasResolverFallback(selectedIntent, selectedRole, selectedMarket, multiMarkets)) {
    return { kind: 'fallback', selectedMarket, selectedRole, selectedIntent, multiMarkets, invalidParams }
  }
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
