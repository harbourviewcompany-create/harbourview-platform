export const PUBLIC_CONFIDENCE_THRESHOLD = 70

export const publicExposureLevels = ['public_safe', 'public_summary_only'] as const
export const nonPublicExposureLevels = [
  'restricted_internal',
  'admin_only',
  'legal_review_required',
  'do_not_publish',
] as const

export const publicEvidenceStatuses = ['verified', 'partially_verified'] as const
export const publicReviewStatuses = ['approved_public'] as const

export type ExposureLevel = (typeof publicExposureLevels)[number] | (typeof nonPublicExposureLevels)[number]
export type EvidenceStatus =
  | 'verified'
  | 'partially_verified'
  | 'conflicting'
  | 'stale'
  | 'machine_extracted_unreviewed'
  | 'human_review_required'
  | 'native_language_review_required'
  | 'legal_review_required'
  | 'no_public_evidence_found'
  | 'not_applicable'
export type ReviewStatus =
  | 'unreviewed'
  | 'in_review'
  | 'approved_public'
  | 'approved_internal'
  | 'rejected'
  | 'needs_human_review'
  | 'needs_native_language_review'
  | 'needs_legal_review'
  | 'not_applicable'
export type LegalStatus =
  | 'legal'
  | 'conditionally_legal'
  | 'prohibited'
  | 'not_regulated'
  | 'unclear'
  | 'mixed'
  | 'unknown'
  | 'not_applicable'
export type OperationalStatus =
  | 'operational'
  | 'partially_operational'
  | 'announced_not_operational'
  | 'suspended'
  | 'not_operational'
  | 'unknown'
  | 'not_applicable'

export interface CannabisJurisdictionRecord {
  id: string
  slug: string
  display_name: string
  jurisdiction_type: string
  region: string | null
  parent?: {
    id: string
    slug: string
    display_name: string
    jurisdiction_type: string
  } | null
}

export interface CannabisSourceRecord {
  id: string
  title: string
  publisher: string | null
  canonical_url: string | null
  source_type: string
  accessed_at: string | null
  archive_path?: string | null
  raw_text_path?: string | null
  screenshot_path?: string | null
  pdf_path?: string | null
  extraction_log?: unknown
  content_hash?: string | null
  notes_internal?: string | null
  reviewer_notes?: string | null
  exposure_level?: ExposureLevel
  review_status?: ReviewStatus
  evidence_status?: EvidenceStatus
}

export interface CannabisEvidenceLinkRecord {
  subject_table: string
  subject_id: string
  evidence_claim_id: string | null
  source_document_id: string | null
  relationship_type: 'supports' | 'contradicts' | 'supersedes' | 'clarifies' | 'background'
}

export interface CannabisContradictionRecord {
  subject_table: string
  subject_id: string | null
  field_name: string | null
  status: 'open' | 'under_review' | 'resolved' | 'superseded' | 'dismissed'
}

export interface PublicSafetyFields {
  id: string
  confidence_score: number
  evidence_status: EvidenceStatus
  review_status: ReviewStatus
  exposure_level: ExposureLevel
  verified_at: string | null
}

export interface CannabisLegalRegimeRecord extends PublicSafetyFields {
  jurisdiction: CannabisJurisdictionRecord
  plant_product_category_slug: string
  activity: string
  legal_status: LegalStatus
  operational_status: OperationalStatus
  public_summary: string | null
  notes_internal?: string | null
  reviewer_notes?: string | null
  raw_extraction_text?: string | null
  unverified_lead?: string | null
}

export interface CannabisRegulatoryAuthorityRecord extends PublicSafetyFields {
  jurisdiction: CannabisJurisdictionRecord
  name: string
  regulator_type: string
  official_url: string | null
  contact_url?: string | null
  notes_public: string | null
  notes_internal?: string | null
  private_contact_data?: unknown
}

export interface CannabisLicenceRegisterRecord extends PublicSafetyFields {
  jurisdiction: CannabisJurisdictionRecord
  name: string
  register_url: string | null
  is_public: boolean
  extraction_status: string
  public_summary: string | null
  notes_internal?: string | null
  scrape_failures?: unknown
}

export interface PublicCannabisSourceDTO {
  title: string
  publisher: string | null
  canonicalUrl: string | null
  sourceType: string
  accessedAt: string | null
}

export interface PublicCannabisJurisdictionDTO {
  id: string
  name: string
  slug: string
  type: string
  region: string | null
  parent: {
    id: string
    name: string
    slug: string
    type: string
  } | null
}

export interface PublicCannabisLegalStatusSummaryDTO {
  id: string
  jurisdiction: PublicCannabisJurisdictionDTO
  categorySlug: string
  activity: string
  legalStatus: LegalStatus
  operationalStatus: OperationalStatus
  publicSummary: string | null
  confidenceBand: PublicConfidenceBand
  lastVerifiedAt: string | null
  sources: PublicCannabisSourceDTO[]
  disclaimer: string
}

export interface PublicCannabisRegulatorDTO {
  id: string
  jurisdiction: PublicCannabisJurisdictionDTO
  name: string
  regulatorType: string
  officialUrl: string | null
  confidenceBand: PublicConfidenceBand
  lastVerifiedAt: string | null
  sources: PublicCannabisSourceDTO[]
}

export interface PublicCannabisLicenceRegisterDTO {
  id: string
  jurisdiction: PublicCannabisJurisdictionDTO
  name: string
  registerUrl: string | null
  availability: 'verified_public_register' | 'verified_register_not_public' | 'not_public_safe'
  publicSummary: string | null
  confidenceBand: PublicConfidenceBand
  lastVerifiedAt: string | null
  sources: PublicCannabisSourceDTO[]
}

export type PublicConfidenceBand = 'high' | 'medium' | 'minimum_public_threshold'

export function confidenceBand(score: number): PublicConfidenceBand {
  if (score >= 90) return 'high'
  if (score >= 80) return 'medium'
  return 'minimum_public_threshold'
}

export function toPublicJurisdictionDTO(jurisdiction: CannabisJurisdictionRecord): PublicCannabisJurisdictionDTO {
  return {
    id: jurisdiction.id,
    name: jurisdiction.display_name,
    slug: jurisdiction.slug,
    type: jurisdiction.jurisdiction_type,
    region: jurisdiction.region,
    parent: jurisdiction.parent
      ? {
          id: jurisdiction.parent.id,
          name: jurisdiction.parent.display_name,
          slug: jurisdiction.parent.slug,
          type: jurisdiction.parent.jurisdiction_type,
        }
      : null,
  }
}

export function toPublicSourceDTO(source: CannabisSourceRecord): PublicCannabisSourceDTO {
  return {
    title: source.title,
    publisher: source.publisher,
    canonicalUrl: source.canonical_url,
    sourceType: source.source_type,
    accessedAt: source.accessed_at,
  }
}

export function isPublicSafeFact(input: {
  fact: PublicSafetyFields
  evidenceLinks: CannabisEvidenceLinkRecord[]
  sources: CannabisSourceRecord[]
  contradictions?: CannabisContradictionRecord[]
  publicConfidenceThreshold?: number
}): boolean {
  const threshold = input.publicConfidenceThreshold ?? PUBLIC_CONFIDENCE_THRESHOLD
  const hasSourceBackedEvidence = input.evidenceLinks.some(
    (link) => link.relationship_type === 'supports' && Boolean(link.evidence_claim_id || link.source_document_id),
  )
  const hasPublicSource = input.sources.length > 0
  const hasUnresolvedContradiction = (input.contradictions ?? []).some(
    (contradiction) => contradiction.status === 'open' || contradiction.status === 'under_review',
  )

  return (
    hasSourceBackedEvidence &&
    hasPublicSource &&
    input.fact.confidence_score >= threshold &&
    publicReviewStatuses.includes(input.fact.review_status as (typeof publicReviewStatuses)[number]) &&
    publicEvidenceStatuses.includes(input.fact.evidence_status as (typeof publicEvidenceStatuses)[number]) &&
    publicExposureLevels.includes(input.fact.exposure_level as (typeof publicExposureLevels)[number]) &&
    !hasUnresolvedContradiction
  )
}

export function toPublicLegalStatusSummaryDTO(input: {
  regime: CannabisLegalRegimeRecord
  evidenceLinks: CannabisEvidenceLinkRecord[]
  sources: CannabisSourceRecord[]
  contradictions?: CannabisContradictionRecord[]
}): PublicCannabisLegalStatusSummaryDTO | null {
  if (!isPublicSafeFact({ fact: input.regime, evidenceLinks: input.evidenceLinks, sources: input.sources, contradictions: input.contradictions })) {
    return null
  }

  return {
    id: input.regime.id,
    jurisdiction: toPublicJurisdictionDTO(input.regime.jurisdiction),
    categorySlug: input.regime.plant_product_category_slug,
    activity: input.regime.activity,
    legalStatus: input.regime.legal_status,
    operationalStatus: input.regime.operational_status,
    publicSummary: input.regime.public_summary,
    confidenceBand: confidenceBand(input.regime.confidence_score),
    lastVerifiedAt: input.regime.verified_at,
    sources: input.sources.map(toPublicSourceDTO),
    disclaimer: 'Public summary only; not legal, medical, treatment, compliance, import/export, prescribing, pharmacy, or licence eligibility advice.',
  }
}

export function toPublicRegulatorDTO(input: {
  authority: CannabisRegulatoryAuthorityRecord
  evidenceLinks: CannabisEvidenceLinkRecord[]
  sources: CannabisSourceRecord[]
  contradictions?: CannabisContradictionRecord[]
}): PublicCannabisRegulatorDTO | null {
  if (!isPublicSafeFact({ fact: input.authority, evidenceLinks: input.evidenceLinks, sources: input.sources, contradictions: input.contradictions })) {
    return null
  }

  return {
    id: input.authority.id,
    jurisdiction: toPublicJurisdictionDTO(input.authority.jurisdiction),
    name: input.authority.name,
    regulatorType: input.authority.regulator_type,
    officialUrl: input.authority.official_url,
    confidenceBand: confidenceBand(input.authority.confidence_score),
    lastVerifiedAt: input.authority.verified_at,
    sources: input.sources.map(toPublicSourceDTO),
  }
}

export function toPublicLicenceRegisterDTO(input: {
  register: CannabisLicenceRegisterRecord
  evidenceLinks: CannabisEvidenceLinkRecord[]
  sources: CannabisSourceRecord[]
  contradictions?: CannabisContradictionRecord[]
}): PublicCannabisLicenceRegisterDTO | null {
  if (!isPublicSafeFact({ fact: input.register, evidenceLinks: input.evidenceLinks, sources: input.sources, contradictions: input.contradictions })) {
    return null
  }

  return {
    id: input.register.id,
    jurisdiction: toPublicJurisdictionDTO(input.register.jurisdiction),
    name: input.register.name,
    registerUrl: input.register.register_url,
    availability: input.register.is_public ? 'verified_public_register' : 'verified_register_not_public',
    publicSummary: input.register.public_summary,
    confidenceBand: confidenceBand(input.register.confidence_score),
    lastVerifiedAt: input.register.verified_at,
    sources: input.sources.map(toPublicSourceDTO),
  }
}

export function hasForbiddenPublicCannabisFields(value: unknown): boolean {
  const serialized = JSON.stringify(value)
  return [
    'notes_internal',
    'reviewer_notes',
    'raw_excerpt',
    'raw_extraction_text',
    'extraction_log',
    'archive_path',
    'raw_text_path',
    'screenshot_path',
    'pdf_path',
    'content_hash',
    'private_contact_data',
    'scrape_failures',
    'unverified_lead',
    'commercial_notes',
    'contradiction_internal',
  ].some((field) => serialized.includes(field))
}
