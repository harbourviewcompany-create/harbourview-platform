/**
 * Market-access auto-apply: turn promoted regulatory signals into
 * structured market_access_events, then let api.promote_market_access_from_signals
 * update countries.regulatory_tier (the heat-map source of truth).
 *
 * Fully automatic. Kill switch: platform_feature_flags.market_access_auto_apply_enabled
 * Per-country freeze: countries.regulatory_tier_auto_frozen
 */

export type MarketAccessPathway =
  | 'medical'
  | 'adult_use'
  | 'import'
  | 'export'
  | 'commercial_retail'
  | 'hemp_cbd'
  | 'prohibition'

export type MarketAccessStatus =
  | 'legal_commercial_access'
  | 'medical_limited_trade'
  | 'domestic_only'
  | 'cbd_hemp_only'
  | 'prohibited'

export type MarketAccessDirection =
  | 'expanded'
  | 'restricted'
  | 'opened'
  | 'closed'
  | 'clarified'

export interface MarketAccessImpact {
  pathway: MarketAccessPathway
  direction: MarketAccessDirection
  proposed_status: MarketAccessStatus
  confidence: number
  evidence_snippet?: string
  as_of_date?: string | null
}

export interface EligibleSignal {
  id: string
  title_en?: string | null
  summary_en?: string | null
  country_iso2?: string | null
  source_id?: string | null
  url?: string | null
  quality_label?: string | null
  quality_confidence?: number | null
  content_type?: string | null
  reviewed?: boolean | null
}

const ELIGIBLE_QUALITY = new Set([
  'regulatory',
  'legislation',
  'official_notice',
  'signal',
])

const ELIGIBLE_CONTENT = new Set([
  'regulatory',
  'legislation',
  'official_notice',
  'gazette',
])

/** Hard eligibility gate before any LLM / rule extraction. */
export function isEligibleForMarketAccessExtraction(signal: EligibleSignal): boolean {
  if (!signal.id || !signal.country_iso2) return false
  const conf = signal.quality_confidence ?? 0
  if (conf < 0.8) return false
  if (signal.quality_label && ELIGIBLE_QUALITY.has(signal.quality_label)) return true
  if (signal.content_type && ELIGIBLE_CONTENT.has(signal.content_type)) return true
  // Reviewed regulatory rows without a quality_label still qualify
  if (signal.reviewed === true && conf >= 0.85) return true
  return false
}

/**
 * Deterministic rule extractor (no LLM required for v1).
 * Maps headline/summary keywords into pathway + proposed_status.
 * Confidence is damped by signal.quality_confidence.
 */
export function extractMarketAccessImpactsRuleBased(
  signal: EligibleSignal
): MarketAccessImpact[] {
  if (!isEligibleForMarketAccessExtraction(signal)) return []

  const text = `${signal.title_en ?? ''} ${signal.summary_en ?? ''}`.toLowerCase()
  const baseConf = Math.min(1, Math.max(0, signal.quality_confidence ?? 0.8))
  const impacts: MarketAccessImpact[] = []

  const push = (
    pathway: MarketAccessPathway,
    direction: MarketAccessDirection,
    proposed_status: MarketAccessStatus,
    boost: number,
    snippet: string
  ) => {
    impacts.push({
      pathway,
      direction,
      proposed_status,
      confidence: Math.min(0.99, baseConf * boost),
      evidence_snippet: snippet.slice(0, 280),
      as_of_date: null,
    })
  }

  // Legal commercial / export expansion
  if (
    /(licensed export|export (licence|license|hub|industry)|export-oriented|commercial retail|adult-use retail|pillar 2)/i.test(
      text
    )
  ) {
    push(
      'export',
      'expanded',
      'legal_commercial_access',
      0.95,
      signal.title_en ?? text
    )
  }

  // Medical access opening / expansion
  if (
    /(medical (cannabis|marijuana) (legal|programme|program|access)|prescription (access|pathway)|reimbursement)/i.test(
      text
    ) &&
    !/(no medical|reform under|under consideration)/i.test(text)
  ) {
    push(
      'medical',
      'expanded',
      'medical_limited_trade',
      0.9,
      signal.title_en ?? text
    )
  }

  // Domestic / adult-use / social clubs / home grow
  if (
    /(adult-use|social clubs|home (grow|cultivation)|personal cultivation|possession legal|decriminalis)/i.test(
      text
    )
  ) {
    push(
      'adult_use',
      'expanded',
      'domestic_only',
      0.88,
      signal.title_en ?? text
    )
  }

  // Hemp / CBD only
  if (
    /(industrial hemp|hemp (licensed|producer)|cbd (only|trade)|low-thc)/i.test(text) &&
    /(prohibit|illegal|banned)/i.test(text)
  ) {
    push('hemp_cbd', 'clarified', 'cbd_hemp_only', 0.9, signal.title_en ?? text)
  }

  // Restriction / prohibition
  if (
    /(ban(ned)?|prohibit(ed)?|repeal|recriminal|schedule i|death penalty)/i.test(text) &&
    /(cannabis|marijuana|thc)/i.test(text)
  ) {
    push('prohibition', 'restricted', 'prohibited', 0.92, signal.title_en ?? text)
  }

  return impacts
}

/** Map legend colour key used by the globe UI. */
export const HEATMAP_STATUS_TO_LEGEND: Record<
  MarketAccessStatus,
  { label: string; colorKey: string }
> = {
  legal_commercial_access: {
    label: 'Legal commercial access',
    colorKey: 'green',
  },
  medical_limited_trade: {
    label: 'Medical access, limited trade',
    colorKey: 'yellow',
  },
  domestic_only: {
    label: 'Domestic only',
    colorKey: 'orange',
  },
  cbd_hemp_only: {
    label: 'Hemp / CBD only',
    colorKey: 'cyan',
  },
  prohibited: {
    label: 'Prohibited',
    colorKey: 'red',
  },
}
