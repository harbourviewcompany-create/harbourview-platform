export const GLOBE_MARKETS = [
  { slug: 'colombia', label: 'Colombia' },
  { slug: 'germany', label: 'Germany' },
  { slug: 'canada', label: 'Canada' },
  { slug: 'australia', label: 'Australia' },
  { slug: 'portugal', label: 'Portugal' },
] as const

export type GlobeMarketSlug = (typeof GLOBE_MARKETS)[number]['slug']
export type GlobeSheet = 'role' | 'intent' | 'multi' | 'fallback' | null

export type GlobeRouteState = {
  selectedMarkets: GlobeMarketSlug[]
  sheet: GlobeSheet
  fallback: boolean
  invalidParams: boolean
}

const marketSet = new Set<string>(GLOBE_MARKETS.map((market) => market.slug))

const normalizeSheet = (value: string | null): GlobeSheet => {
  if (value === 'role' || value === 'intent' || value === 'multi' || value === 'fallback') {
    return value
  }

  return null
}

export function parseGlobeRouteState(params: URLSearchParams): GlobeRouteState {
  const market = params.get('market')
  const markets = params.get('markets')
  const sheet = normalizeSheet(params.get('sheet'))

  let invalidParams = false
  const selected = new Set<GlobeMarketSlug>()

  if (market) {
    if (marketSet.has(market)) {
      selected.add(market as GlobeMarketSlug)
    } else {
      invalidParams = true
    }
  }

  if (markets) {
    for (const candidate of markets.split(',').map((item) => item.trim()).filter(Boolean)) {
      if (marketSet.has(candidate)) {
        selected.add(candidate as GlobeMarketSlug)
      } else {
        invalidParams = true
      }
    }
  }

  const selectedMarkets = [...selected]
  const fallback = params.get('fallback') === '1' || sheet === 'fallback'

  if (params.get('sheet') && !sheet) {
    invalidParams = true
  }

  return {
    selectedMarkets,
    sheet,
    fallback: fallback || invalidParams,
    invalidParams,
  }
}

export function createGlobeQueryString(state: GlobeRouteState): string {
  const nextParams = new URLSearchParams()

  if (state.selectedMarkets.length === 1) {
    nextParams.set('market', state.selectedMarkets[0])
  }

  if (state.selectedMarkets.length > 1) {
    nextParams.set('markets', state.selectedMarkets.join(','))
  }

  if (state.sheet) {
    nextParams.set('sheet', state.sheet)
  }

  if (state.fallback) {
    nextParams.set('fallback', '1')
  }

  const nextQuery = nextParams.toString()
  return nextQuery ? `?${nextQuery}` : ''
}
