export type MarketPriceConfidence = 'high' | 'medium' | 'low'

export type MarketPriceMetric = {
  value: number
  currency: 'CAD' | 'EUR' | 'GBP' | 'PLN' | 'NZD' | 'CHF'
  unit: 'kg' | 'g'
  basis: string
  asOf: string
  confidence: MarketPriceConfidence
  sourceLabel: string
  sourceType: 'official' | 'trade-data-analysis' | 'market-tracker'
}

export type MarketImportContext = {
  totalKg: number
  canadianKg?: number
  period: string
  sourceLabel: string
  sourceUpdatedAt: string
  confidence: MarketPriceConfidence
}

export type MarketEconomicsSnapshot = {
  iso2: string
  country: string
  upstreamPrice?: MarketPriceMetric
  downstreamPrice?: MarketPriceMetric
  importContext?: MarketImportContext
  note?: string
}

export const MARKET_ECONOMICS: readonly MarketEconomicsSnapshot[] = [
  {
    iso2: 'DE',
    country: 'Germany',
    upstreamPrice: {
      value: 2857,
      currency: 'CAD',
      unit: 'kg',
      basis: 'Canadian declared export value to Germany, H1 2026',
      asOf: '2026-06-30',
      confidence: 'high',
      sourceLabel: 'Statistics Canada trade data via Cannamonitor',
      sourceType: 'trade-data-analysis',
    },
    downstreamPrice: {
      value: 4.97,
      currency: 'EUR',
      unit: 'g',
      basis: 'Average of the lowest listed German pharmacy price for each tracked flower product',
      asOf: '2026-10-01',
      confidence: 'high',
      sourceLabel: 'Grammpreis',
      sourceType: 'market-tracker',
    },
    note: 'Declared Canadian export values are a directional upstream benchmark, not a like-for-like distributor contract.',
  },
  {
    iso2: 'AU',
    country: 'Australia',
    upstreamPrice: {
      value: 1179,
      currency: 'CAD',
      unit: 'kg',
      basis: 'Canadian declared export value to Australia, H1 2026',
      asOf: '2026-06-30',
      confidence: 'high',
      sourceLabel: 'Statistics Canada trade data via Cannamonitor',
      sourceType: 'trade-data-analysis',
    },
    importContext: {
      totalKg: 81119,
      canadianKg: 49107,
      period: '2025',
      sourceLabel: 'Australian Office of Drug Control',
      sourceUpdatedAt: '2026-08-19',
      confidence: 'high',
    },
    note: 'The 2025 ODC import total and Canadian-origin volume are physical-volume context and should not be read as a distributor purchase price.',
  },
  {
    iso2: 'MT',
    country: 'Malta',
    upstreamPrice: {
      value: 1880,
      currency: 'CAD',
      unit: 'kg',
      basis: 'Canadian declared export value to Malta, H1 2026',
      asOf: '2026-06-30',
      confidence: 'high',
      sourceLabel: 'Statistics Canada trade data via Cannamonitor',
      sourceType: 'trade-data-analysis',
    },
    note: 'The declared Canadian export value is an upstream trade benchmark and should not be treated as Maltese patient sell-through.',
  },
  {
    iso2: 'PT',
    country: 'Portugal',
    upstreamPrice: {
      value: 1490,
      currency: 'CAD',
      unit: 'kg',
      basis: 'Canadian declared export value to Portugal, H1 2026',
      asOf: '2026-06-30',
      confidence: 'high',
      sourceLabel: 'Statistics Canada trade data via Cannamonitor',
      sourceType: 'trade-data-analysis',
    },
    note: 'The declared Canadian export value is an upstream trade benchmark and is not a direct proxy for Portuguese patient demand.',
  },
  {
    iso2: 'CZ',
    country: 'Czechia',
    upstreamPrice: {
      value: 1336,
      currency: 'CAD',
      unit: 'kg',
      basis: 'Canadian declared export value to Czechia, H1 2026',
      asOf: '2026-06-30',
      confidence: 'high',
      sourceLabel: 'Statistics Canada trade data via Cannamonitor',
      sourceType: 'trade-data-analysis',
    },
    note: 'The declared Canadian export value is a directional trade benchmark; private importer and distributor contract terms are not public in this dataset.',
  },
  {
    iso2: 'PL',
    country: 'Poland',
    downstreamPrice: {
      value: 38.08,
      currency: 'PLN',
      unit: 'g',
      basis: 'Median of average pharmacy prices across 31 listed medical flower products',
      asOf: '2026-10-01',
      confidence: 'medium',
      sourceLabel: 'Kanaba / GdziePoLek market snapshot',
      sourceType: 'market-tracker',
    },
    note: 'This is a patient-level pharmacy comparator, not an importer or distributor purchase price.',
  },
  {
    iso2: 'GB',
    country: 'United Kingdom',
    downstreamPrice: {
      value: 8.87,
      currency: 'GBP',
      unit: 'g',
      basis: 'Average listed UK medical cannabis flower price across tracked flower products',
      asOf: '2026-10-06',
      confidence: 'medium',
      sourceLabel: 'LeafMe UK Medical Cannabis Price Index',
      sourceType: 'market-tracker',
    },
    note: 'Public UK B2B wholesale contracts are not transparent enough for a current like-for-like wholesale quote; this is a downstream comparator only.',
  },
  {
    iso2: 'NZ',
    country: 'New Zealand',
    downstreamPrice: {
      value: 10.5,
      currency: 'NZD',
      unit: 'g',
      basis: 'Lower end of the typical retail flower range reported for currently available products',
      asOf: '2026-09-11',
      confidence: 'medium',
      sourceLabel: 'Whakamana Cannabis Museum market review',
      sourceType: 'market-tracker',
    },
    note: 'Reported common retail range is approximately NZ$10.50–13.60/g; the single value shown is a conservative comparator, not a wholesale quote.',
  },
] as const

const byIso2 = new Map(MARKET_ECONOMICS.map((market) => [market.iso2, market]))

export function getMarketEconomics(iso2: string): MarketEconomicsSnapshot | undefined {
  return byIso2.get(iso2.toUpperCase())
}

export function formatMarketPrice(metric?: MarketPriceMetric): string {
  if (!metric) return '—'
  const locale = metric.currency === 'EUR' ? 'de-DE' : metric.currency === 'PLN' ? 'pl-PL' : 'en-CA'
  const value = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: metric.currency,
    maximumFractionDigits: metric.unit === 'kg' ? 0 : 2,
  }).format(metric.value)
  return `${value}/${metric.unit}`
}

export function isMarketPriceStale(metric: MarketPriceMetric, now = new Date()): boolean {
  const asOf = new Date(`${metric.asOf}T00:00:00Z`)
  if (Number.isNaN(asOf.getTime())) return true
  const ageMs = now.getTime() - asOf.getTime()
  return ageMs > 183 * 24 * 60 * 60 * 1000
}
