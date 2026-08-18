export const DIGEST_DELTA_STATUSES = [
  'new_event',
  'material_advancement',
  'unchanged_duplicate',
] as const

export type DigestDeltaStatus = (typeof DIGEST_DELTA_STATUSES)[number]

export const DIGEST_PRIORITY_DOMAINS = [
  'global_medical',
  'import_export_eu_gmp',
  'm_and_a',
  'licensing_regulatory',
  'commercial_distribution',
  'genetics',
  'formulations',
  'pharmaceutical_cannabinoid_technology',
  'other',
] as const

export type DigestPriorityDomain = (typeof DIGEST_PRIORITY_DOMAINS)[number]

export type DigestDeltaMetadata = {
  eventKey: string | null
  priorEventKey: string | null
  deltaStatus: DigestDeltaStatus | null
  advancementReason: string | null
  jurisdiction: string
  entities: string[]
  priorityDomain: DigestPriorityDomain
  verifiedFacts: string[]
  inferences: string[]
  competitivePositionChange: boolean
  competitivePositionDetail: string | null
}

export type DigestPresentationCandidate = {
  signalId: string
  eventKey: string
  deltaStatus: DigestDeltaStatus | null
  include: boolean
  priorityScore: number
}

const STATUS_SET = new Set<string>(DIGEST_DELTA_STATUSES)
const DOMAIN_SET = new Set<string>(DIGEST_PRIORITY_DOMAINS)

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean)
}

export function normalizeDigestDeltaMetadata(src: Record<string, unknown>): DigestDeltaMetadata {
  const rawStatus = stringOrNull(src.delta_status)
  const rawDomain = stringOrNull(src.priority_domain)
  return {
    eventKey: stringOrNull(src.event_key),
    priorEventKey: stringOrNull(src.prior_event_key),
    deltaStatus: rawStatus && STATUS_SET.has(rawStatus) ? rawStatus as DigestDeltaStatus : null,
    advancementReason: stringOrNull(src.advancement_reason),
    jurisdiction: stringOrNull(src.jurisdiction) ?? stringOrNull(src.market) ?? 'Global',
    entities: stringList(src.entities),
    priorityDomain: rawDomain && DOMAIN_SET.has(rawDomain) ? rawDomain as DigestPriorityDomain : 'other',
    verifiedFacts: stringList(src.verified_facts),
    inferences: stringList(src.inferences),
    competitivePositionChange: src.competitive_position_change === true,
    competitivePositionDetail: stringOrNull(src.competitive_position_detail),
  }
}

export function isDigestPresentationEligible(status: DigestDeltaStatus | null): boolean {
  return status === 'new_event' || status === 'material_advancement'
}

/**
 * Executable mirror of the SQL publication contract: eligible included items
 * are ordered by commercial priority and only the strongest record for a
 * canonical event may become a presentation card.
 */
export function selectDigestPresentationCandidates(
  candidates: DigestPresentationCandidate[],
  limit = 10,
): DigestPresentationCandidate[] {
  const selected = new Map<string, DigestPresentationCandidate>()
  const ordered = [...candidates]
    .filter(candidate => candidate.include && isDigestPresentationEligible(candidate.deltaStatus))
    .sort((a, b) => b.priorityScore - a.priorityScore || a.signalId.localeCompare(b.signalId))

  for (const candidate of ordered) {
    if (!selected.has(candidate.eventKey)) selected.set(candidate.eventKey, candidate)
  }

  return [...selected.values()].slice(0, Math.max(0, limit))
}

export const DIGEST_PRIORITY_DOMAIN_LABELS: Record<DigestPriorityDomain, string> = {
  global_medical: 'Global medical',
  import_export_eu_gmp: 'Import / export · EU-GMP',
  m_and_a: 'M&A',
  licensing_regulatory: 'Licensing / regulation',
  commercial_distribution: 'Commercial distribution',
  genetics: 'Genetics',
  formulations: 'Formulations',
  pharmaceutical_cannabinoid_technology: 'Pharmaceutical cannabinoid technology',
  other: 'Other',
}
