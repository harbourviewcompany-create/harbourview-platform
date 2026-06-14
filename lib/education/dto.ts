import type { EducationClaimLike, PublicEducationDTO } from './types'
import { isPublishableEducationClaim } from './review-status'

export const PUBLIC_EDUCATION_DTO_ALLOWLIST = [
  'id',
  'slug',
  'title',
  'domain',
  'public_summary',
  'public_safe_summary',
  'jurisdiction_scope',
  'audience_roles',
  'topic',
  'module_type',
  'route_path',
  'visibility',
  'review_status',
  'last_verified_at',
  'content_blocks',
] as const

export const ADMIN_ONLY_EDUCATION_FIELDS = [
  'source_excerpt',
  'admin_notes',
  'reviewer',
  'conflict_notes',
  'private_archive_uri',
  'archive_uri',
  'evidence_hash',
  'source_scrape_metadata',
  'internal_scoring',
  'unpublished_claims',
  'do_not_publish_reason',
  'legal_risk_level',
  'clinical_risk_level',
  'medical_risk_level',
  'commercial_risk_level',
  'internal_review_history',
  'analyst_notes',
  'review_queue',
  'source_conflicts',
  'raw_claim',
  'claim_text',
  'support_type',
  'confidence',
  'is_primary_support',
  'clinical_review_required',
  'legal_review_required',
  'jurisdiction_unclear',
  'X_conflict_or_unverified',
] as const

export function assertNoAdminEducationFields(value: unknown, label = 'public education DTO') {
  const serialized = JSON.stringify(value)
  const hits = ADMIN_ONLY_EDUCATION_FIELDS.filter((field) => serialized.includes(field))
  if (hits.length > 0) {
    throw new Error(`${label} exposed admin-only education fields: ${hits.join(', ')}`)
  }
}

export function buildPublicEducationDTO(claim: EducationClaimLike): PublicEducationDTO | null {
  if (!isPublishableEducationClaim(claim)) return null

  const dto: PublicEducationDTO = {
    id: claim.id,
    slug: claim.slug ?? claim.claim_key,
    title: claim.title,
    domain: claim.domain,
    public_safe_summary: claim.public_safe_summary ?? null,
    jurisdiction_scope: claim.jurisdiction_scope ?? ['GLOBAL'],
    audience_roles: claim.audience_roles,
    visibility: 'public',
    review_status: 'published_source_backed',
    last_verified_at: claim.last_verified_at ?? null,
  }

  assertNoAdminEducationFields(dto)
  return dto
}
