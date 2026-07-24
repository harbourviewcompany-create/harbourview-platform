// lib/dashboard/confidenceScoring.ts
//
// Real, data-driven confidence scoring for the Command Centre BriefingRoom.
//
// Replaces the previous `buildConfidenceBars()` heuristic in CommandCentre.tsx,
// which derived every lane from a single `data_completeness` bucket plus a
// hardcoded offset (`base - 8`, `base - 12`, ...) — i.e. the per-lane numbers
// were cosmetic, not measured.
//
// Each lane here is computed from the actual per-lane data the dashboard
// already loads for the selected country, so the number reflects how much
// intelligence Harbourview genuinely holds for that jurisdiction × lane.
// Every lane also carries a human-readable `basis` string so the UI can show
// *why* the score is what it is, and an `available` flag so lanes with no data
// can be rendered honestly (grey / "coverage pending") instead of a fake %.
//
// NO 'server-only' — pure, deterministic, safe to import from a 'use client'
// component and to unit-test directly.

import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import type {
  CountryIntelProfile,
  PathwayData,
  LocalIntelData,
  SourceCoverageRow,
  MarketMetric,
} from '@/lib/dashboard/dashboardLiveData'

export interface ConfidenceLane {
  /** Stable lane key. */
  key: 'regulatory' | 'market' | 'pathway' | 'local' | 'education'
  /** Display label. */
  label: string
  /** 0–100 confidence score, measured from real per-lane data. */
  pct: number
  /** Whether any real data backs this lane (false → render as "coverage pending"). */
  available: boolean
  /** Short, human-readable explanation of what the score is measured from. */
  basis: string
}

export interface ConfidenceInputs {
  countryIntel?: CountryIntelProfile | null
  /** Signals already scoped to the active country/view (may include global fallbacks). */
  signals?: DashboardSignal[]
  /** Country label used to attribute signals to the active jurisdiction. */
  countryLabel?: string
  pathwayData?: PathwayData | null
  localIntel?: LocalIntelData | null
  sourceCoverage?: SourceCoverageRow[] | null
  marketMetrics?: MarketMetric[] | null
  /** Education categories available for this country/role view. */
  eduCategories?: unknown[] | null
  /** Recent education modules published for this view. */
  recentEduModules?: unknown[] | null
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)))

/**
 * Map an ordered checklist of "do we have this?" contributions to a score.
 * Each contribution adds its `weight` when `has` is true; the score is the
 * summed weight, clamped to [floor, ceil]. Keeping this explicit (rather than
 * a single magic bucket) is what makes each lane auditable.
 */
function score(
  contributions: Array<{ has: boolean; weight: number }>,
  { floor = 0, ceil = 96 }: { floor?: number; ceil?: number } = {},
): number {
  const total = contributions.reduce((s, c) => (c.has ? s + c.weight : s), 0)
  return clamp(total, floor, ceil)
}

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0

// ── Regulatory lane ──────────────────────────────────────────────────────────
// Measured from: registered source coverage for the country (regulator/trade/
// news tiers), the country's regulatory status/tier fields, and whether any
// live signals are attributed to the jurisdiction.
function regulatoryLane(input: ConfidenceInputs): ConfidenceLane {
  const coverage = input.sourceCoverage ?? []
  const regulatorSources = coverage
    .filter((r) => r.source_type === 'regulator' || r.tier === 1)
    .reduce((s, r) => s + r.count, 0)
  const totalSources = coverage.reduce((s, r) => s + r.count, 0)
  const intel = input.countryIntel
  const hasRegStatus =
    isNonEmptyString(intel?.market_access_status) || isNonEmptyString(intel?.regulatory_tier)
  const hasBriefingOutlook = isNonEmptyString(intel?.briefing_regulatory_outlook)
  const countrySignals = attributedSignals(input)
  const hasLiveSignal = countrySignals.length > 0

  const pct = score([
    { has: regulatorSources >= 1, weight: 30 },
    { has: regulatorSources >= 3, weight: 16 },
    { has: totalSources >= 8, weight: 12 },
    { has: hasRegStatus, weight: 20 },
    { has: hasBriefingOutlook, weight: 12 },
    { has: hasLiveSignal, weight: 10 },
  ])

  const available = totalSources > 0 || hasRegStatus
  const basis = available
    ? `${totalSources} registered source${totalSources === 1 ? '' : 's'}` +
      (regulatorSources ? ` (${regulatorSources} official)` : '') +
      (hasLiveSignal ? `, ${countrySignals.length} live signal${countrySignals.length === 1 ? '' : 's'}` : '')
    : 'No regulatory coverage recorded yet'

  return { key: 'regulatory', label: 'Regulatory', pct, available, basis }
}

// ── Market Data lane ─────────────────────────────────────────────────────────
// Measured from: number of market_metrics rows held for the country, the
// opportunity score, and market-access status.
function marketLane(input: ConfidenceInputs): ConfidenceLane {
  const metrics = input.marketMetrics ?? []
  const metricCount = metrics.length
  const opp = input.countryIntel?.opportunity_score ?? null
  const hasOpp = typeof opp === 'number' && opp > 0
  const hasAccessStatus = isNonEmptyString(input.countryIntel?.market_access_status)

  const pct = score([
    { has: metricCount >= 1, weight: 26 },
    { has: metricCount >= 5, weight: 18 },
    { has: metricCount >= 10, weight: 12 },
    { has: hasOpp, weight: 24 },
    { has: hasAccessStatus, weight: 20 },
  ])

  const available = metricCount > 0 || hasOpp
  const basis = available
    ? `${metricCount} market metric${metricCount === 1 ? '' : 's'}` +
      (hasOpp ? `, opportunity score ${Math.round(opp as number)}` : '')
    : 'No market metrics recorded yet'

  return { key: 'market', label: 'Market Data', pct, available, basis }
}

// ── Access Pathway lane ──────────────────────────────────────────────────────
// Measured from: whether a pathway template exists for the country/role, how
// many steps and requirements it defines, and how many requirements the org
// has verified.
function pathwayLane(input: ConfidenceInputs): ConfidenceLane {
  const p = input.pathwayData
  const hasTemplate = !!p?.template
  const stepCount = p?.steps?.length ?? 0
  const reqCount = p?.requirements?.length ?? 0
  const verified = (p?.requirementStatuses ?? []).filter((r) => r.status === 'verified').length

  const pct = score([
    { has: hasTemplate, weight: 34 },
    { has: stepCount >= 3, weight: 20 },
    { has: reqCount >= 1, weight: 20 },
    { has: reqCount >= 6, weight: 12 },
    { has: verified >= 1, weight: 10 },
  ])

  const available = hasTemplate || stepCount > 0
  const basis = available
    ? `${stepCount} step${stepCount === 1 ? '' : 's'}, ${reqCount} requirement${reqCount === 1 ? '' : 's'}` +
      (verified ? `, ${verified} verified` : '')
    : 'No access pathway mapped yet'

  return { key: 'pathway', label: 'Access Pathway', pct, available, basis }
}

// ── Local Intel lane ─────────────────────────────────────────────────────────
// Measured from: local intel coverage status and the counts of authorities,
// municipalities, operating notes (constraints/routes) and evidence coverage.
function localLane(input: ConfidenceInputs): ConfidenceLane {
  const li = input.localIntel
  const status = li?.coverageStatus ?? 'pending_research'
  const authorities = li?.authorities ? 1 : 0
  const municipalities = li?.municipalities?.length ?? 0
  const notes = (li?.constraints?.length ?? 0) + (li?.routes?.length ?? 0)
  const coverageItems = li?.coverage?.length ?? 0

  const pct = score([
    { has: status === 'available', weight: 34 },
    { has: authorities > 0, weight: 18 },
    { has: municipalities >= 1, weight: 16 },
    { has: notes >= 1, weight: 16 },
    { has: coverageItems >= 3, weight: 12 },
  ])

  // 'not_applicable' means the country has no subnational layer — that's a
  // definitive answer, not missing data, so treat the lane as available.
  const available = status !== 'pending_research' || municipalities > 0 || notes > 0
  const basis =
    status === 'not_applicable'
      ? 'No subnational layer for this jurisdiction'
      : available
        ? `${municipalities} subdivision${municipalities === 1 ? '' : 's'}, ${notes} operating note${notes === 1 ? '' : 's'}`
        : 'Local research pending'

  return { key: 'local', label: 'Local Intel', pct, available, basis }
}

// ── Education lane ───────────────────────────────────────────────────────────
// Measured from: how many education categories and recently-published modules
// are available for this view.
function educationLane(input: ConfidenceInputs): ConfidenceLane {
  const categories = input.eduCategories?.length ?? 0
  const recent = input.recentEduModules?.length ?? 0

  const pct = score([
    { has: categories >= 1, weight: 28 },
    { has: categories >= 4, weight: 22 },
    { has: categories >= 8, weight: 14 },
    { has: recent >= 1, weight: 20 },
    { has: recent >= 4, weight: 12 },
  ])

  const available = categories > 0 || recent > 0
  const basis = available
    ? `${categories} categor${categories === 1 ? 'y' : 'ies'}` +
      (recent ? `, ${recent} recent module${recent === 1 ? '' : 's'}` : '')
    : 'No education content mapped yet'

  return { key: 'education', label: 'Education', pct, available, basis }
}

/** Signals attributed to the active jurisdiction by market label match. */
function attributedSignals(input: ConfidenceInputs): DashboardSignal[] {
  const label = input.countryLabel?.trim().toLowerCase()
  const signals = input.signals ?? []
  if (!label || label === 'global market' || label === 'global') return []
  return signals.filter((s) => (s.market ?? '').trim().toLowerCase() === label)
}

/**
 * Build the five BriefingRoom confidence lanes from real per-lane data.
 * Deterministic and pure — same inputs always yield the same lanes.
 */
export function buildConfidenceLanes(input: ConfidenceInputs): ConfidenceLane[] {
  return [
    regulatoryLane(input),
    marketLane(input),
    pathwayLane(input),
    localLane(input),
    educationLane(input),
  ]
}

/**
 * Overall confidence — the mean of the lanes that actually have data. Lanes
 * with no coverage are excluded so a single well-covered lane isn't dragged to
 * near-zero by four "pending" lanes (and vice-versa). Returns 0 when nothing
 * is available.
 */
export function overallConfidence(lanes: ConfidenceLane[]): number {
  const scored = lanes.filter((l) => l.available)
  if (scored.length === 0) return 0
  return clamp(scored.reduce((s, l) => s + l.pct, 0) / scored.length)
}
