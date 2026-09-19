/**
 * Lightweight coverage map: which domains are live vs reference for a market.
 * Operator-facing; not a full ISO2×topic warehouse (that remains backlog).
 */

export type CoverageTier = 'live' | 'mixed' | 'reference' | 'unknown'

export type CoverageCell = {
  domain: string
  label: string
  tier: CoverageTier
  note?: string
}

export type CoverageMapSnapshot = {
  countryIso2: string
  cells: CoverageCell[]
  liveCount: number
  mixedCount: number
  referenceCount: number
  computedAt: string
}

/** Default domain grid used until per-country telemetry is richer. */
const DOMAIN_GRID: Array<{ domain: string; label: string; defaultTier: CoverageTier; note?: string }> = [
  { domain: 'signals', label: 'Intelligence feed', defaultTier: 'live', note: 'Pipeline promotions' },
  { domain: 'regulatory', label: 'Regulatory watch', defaultTier: 'live' },
  { domain: 'marketplace', label: 'Marketplace', defaultTier: 'live' },
  { domain: 'pathway', label: 'Access pathway', defaultTier: 'mixed', note: 'Playbook + live gates' },
  { domain: 'evidence', label: 'Evidence / research', defaultTier: 'mixed' },
  { domain: 'clinical', label: 'Clinical', defaultTier: 'mixed' },
  { domain: 'prices', label: 'Price intel', defaultTier: 'mixed' },
  { domain: 'banking', label: 'Banking directory', defaultTier: 'reference' },
  { domain: 'logistics', label: 'Logistics directory', defaultTier: 'reference' },
  { domain: 'insurance', label: 'Insurance directory', defaultTier: 'reference' },
]

export function buildCoverageMapSnapshot(
  countryIso2: string,
  overrides?: Partial<Record<string, CoverageTier>>,
): CoverageMapSnapshot {
  const cells: CoverageCell[] = DOMAIN_GRID.map((d) => ({
    domain: d.domain,
    label: d.label,
    tier: overrides?.[d.domain] ?? d.defaultTier,
    note: d.note,
  }))
  return {
    countryIso2: countryIso2.toUpperCase(),
    cells,
    liveCount: cells.filter((c) => c.tier === 'live').length,
    mixedCount: cells.filter((c) => c.tier === 'mixed').length,
    referenceCount: cells.filter((c) => c.tier === 'reference').length,
    computedAt: new Date().toISOString(),
  }
}
