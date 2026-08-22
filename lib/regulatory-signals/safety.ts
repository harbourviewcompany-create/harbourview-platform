import type { PublicRegulatorySignal, RegulatorySignalRecord } from './types'

export const FORBIDDEN_REGULATORY_SIGNAL_PUBLIC_FIELDS = [
  'private_summary',
  'privateSummary',
  'commercial_relevance',
  'commercialRelevance',
  'compliance_relevance',
  'complianceRelevance',
  'private_notes',
  'privateNotes',
  'analyst_notes',
  'analystNotes',
  'rejection_reason',
  'rejectionReason',
  'source_url',
  'sourceUrl',
  'source_id',
  'sourceId',
  'primary_evidence_id',
  'primaryEvidenceId',
  'raw_excerpt',
  'rawExcerpt',
  'content_hash',
  'contentHash',
  'storage_path',
  'storagePath',
  'pdf_storage_path',
  'pdfStoragePath',
  'screenshot_storage_path',
  'screenshotStoragePath',
  'created_by',
  'createdBy',
  'updated_by',
  'updatedBy',
  'reviewed_by',
  'reviewedBy',
  'approved_by',
  'approvedBy',
  'published_by',
  'publishedBy',
  'marketplace_candidates',
  'source_registry',
] as const

export const FORBIDDEN_REGULATORY_SIGNAL_PUBLIC_STRINGS = [
  'deal flow',
  'buyer demand',
  'confirmed buyers',
  'supplier identity',
  'supplier contact',
  'private marketplace',
  'Harbourview Network activity',
  'introduction activity',
  'internal review',
  'analyst note',
  'raw excerpt',
  'content hash',
  'source snapshot',
  'storage path',
  'investment advice',
  'guaranteed market access',
  'exclusive route',
  'live demand',
  'pricing signal',
  'supplier_lead',
  'buyer_demand',
  'seller_listing',
  'converted_to_listing',
  'converted_to_supplier',
  'converted_to_wanted_request',
  'sourceEvidence',
  'internalReviewNotes',
  'sellerAuthorizationStatus',
  'verificationStatus',
  'availabilityStatus',
] as const

function normalizeRegulatorySignalLeakageText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ')
    .trim()
}

function normalizeRegulatorySignalFieldName(value: string): string {
  return normalizeRegulatorySignalLeakageText(value).replace(/[^a-z0-9]/g, '')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildNormalizedTermPattern(term: string): RegExp {
  const normalized = normalizeRegulatorySignalLeakageText(term)
  if (!normalized) return /(?!)/
  const body = normalized.split(' ').filter(Boolean).map(escapeRegExp).join('\\s*')
  return new RegExp(`(?:^|[^a-z0-9])${body}(?:[^a-z0-9]|$)`, 'i')
}

const FORBIDDEN_FIELD_NAMES = new Set(
  FORBIDDEN_REGULATORY_SIGNAL_PUBLIC_FIELDS.map(normalizeRegulatorySignalFieldName),
)

const FORBIDDEN_STRING_PATTERNS = FORBIDDEN_REGULATORY_SIGNAL_PUBLIC_STRINGS.map(buildNormalizedTermPattern)
const ALL_FORBIDDEN_TERM_PATTERNS = [
  ...FORBIDDEN_REGULATORY_SIGNAL_PUBLIC_FIELDS,
  ...FORBIDDEN_REGULATORY_SIGNAL_PUBLIC_STRINGS,
].map(buildNormalizedTermPattern)

export function containsForbiddenRegulatorySignalLeakage(value: string) {
  const normalized = normalizeRegulatorySignalLeakageText(value)
  return ALL_FORBIDDEN_TERM_PATTERNS.some((pattern) => pattern.test(normalized))
}

function findForbiddenStructuredLeakage(value: unknown): string | null {
  if (typeof value === 'string') {
    const normalized = normalizeRegulatorySignalLeakageText(value)
    const index = FORBIDDEN_STRING_PATTERNS.findIndex((pattern) => pattern.test(normalized))
    return index >= 0 ? FORBIDDEN_REGULATORY_SIGNAL_PUBLIC_STRINGS[index] : null
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const leaked = findForbiddenStructuredLeakage(item)
      if (leaked) return leaked
    }
    return null
  }

  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      if (FORBIDDEN_FIELD_NAMES.has(normalizeRegulatorySignalFieldName(key))) {
        return key
      }
      const leaked = findForbiddenStructuredLeakage(nested)
      if (leaked) return leaked
    }
  }

  return null
}

export function assertPublicRegulatorySignalSafe(signal: PublicRegulatorySignal) {
  const leaked = findForbiddenStructuredLeakage(signal)
  if (leaked) {
    throw new Error(`Forbidden regulatory Signal public leakage detected: ${leaked}`)
  }
}

export function toPublicRegulatorySignal(record: RegulatorySignalRecord): PublicRegulatorySignal | null {
  if (
    record.review_status !== 'published' ||
    record.public_safe !== true ||
    record.publish_to_public !== true ||
    !record.public_summary ||
    !record.public_implication
  ) {
    return null
  }

  const signal: PublicRegulatorySignal = {
    id: record.id,
    slug: record.slug,
    headline: record.headline,
    signal_type: record.signal_type,
    confidence: record.confidence,
    impact_level: record.impact_level,
    country_code: record.country_code,
    country_name: record.country_name,
    region: record.region,
    jurisdiction: record.jurisdiction,
    regulator_name: record.regulator_name,
    signal_date: record.signal_date,
    source_tier: record.source_tier,
    source_type: record.source_type,
    canonical_source_url: record.canonical_source_url,
    public_summary: record.public_summary,
    public_implication: record.public_implication,
    published_at: record.published_at,
    last_reviewed_at: record.last_reviewed_at,
    content_type: 'regulatory',
    confidence_score: null,
    corroboration_count: 1,
    original_language: null,
    original_language_label: null,
    translated: false,
    country_slug: null,
  }

  assertPublicRegulatorySignalSafe(signal)
  return signal
}

export function assertPublicationGate(record: RegulatorySignalRecord) {
  const blockers = [
    record.review_status !== 'in_review' && record.review_status !== 'published' ? 'Review status must be in_review before publication.' : null,
    !record.public_safe ? 'public_safe must be true.' : null,
    !record.publish_to_public ? 'publish_to_public must be true.' : null,
    !record.public_summary?.trim() ? 'Public summary is required.' : null,
    !record.public_implication?.trim() ? 'Public implication is required.' : null,
    !record.canonical_source_url?.trim() ? 'Canonical public source URL is required.' : null,
  ].filter((blocker): blocker is string => Boolean(blocker))

  if (blockers.length) {
    throw new Error(`Regulatory Signal publication blocked: ${blockers.join(' ')}`)
  }
}
