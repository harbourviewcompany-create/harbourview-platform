/**
 * Client-safe corridor simulator helpers (no server-only imports).
 * Used by logistics surfaces and the corridor-plan public page filters.
 */

import {
  TRADE_CORRIDORS,
  filterCorridors,
  type CorridorFilter,
  type TradeCorridor,
  PRODUCT_OPTIONS,
  COMPLIANCE_OPTIONS,
} from './tradeCorridors'

export { TRADE_CORRIDORS, filterCorridors, PRODUCT_OPTIONS, COMPLIANCE_OPTIONS }
export type { CorridorFilter, TradeCorridor }

export function simulateCorridorSelection(filter: CorridorFilter): {
  matched: TradeCorridor[]
  count: number
  lowestRisk: TradeCorridor | null
  highestRisk: TradeCorridor | null
} {
  const matched = filterCorridors(TRADE_CORRIDORS, filter)
  if (matched.length === 0) {
    return { matched, count: 0, lowestRisk: null, highestRisk: null }
  }
  const sorted = [...matched].sort((a, b) => a.riskScore - b.riskScore)
  return {
    matched,
    count: matched.length,
    lowestRisk: sorted[0] ?? null,
    highestRisk: sorted[sorted.length - 1] ?? null,
  }
}

export function corridorPlanHref(from: string, to: string, product?: string): string {
  const params = new URLSearchParams({
    origin: from,
    destination: to,
  })
  if (product && product !== 'any') params.set('product', product)
  return `/intelligence/corridor-plan?${params.toString()}`
}
