import { sanitizeRestrictedClaimText, publicClaimStatusFor, hasReviewedEvidenceForPublicClaim } from './restrictedClaims'
import type {
  CannabisCategory,
  ClaimReviewStatus,
  ClaimStatus,
  CultivarAliasRow,
  CultivarCategory,
  CultivarCountryOpportunityRow,
  CultivarPassportRow,
  GeneticsAccessRequestRow,
  GeneticsAuditEventRow,
  GeneticsClaimReviewRow,
  GeneticsCollaborationProjectRow,
  GeneticsEvidenceItemRow,
  GeneticsProfileRow,
  GeneticsServiceProviderRow,
  OpportunityType,
} from './types'

export type PublicCountryOpportunityDTO = {
  countryCode: string
  jurisdictionLabel: string | null
  opportunityType: OpportunityType
  status: string
  materialTransferStatus: 'information_only' | 'discussion_only' | 'none'
  jurisdictionGateStatus: 'not_assessed' | 'information_only' | 'review_required'
  publicNote: string | null
  cta: 'Request licensing discussion' | 'Request trial discussion' | 'Start collaboration' | 'Request verification'
}

export type PublicEvidenceSummaryDTO = {
  id: string
  evidenceType: string
  title: string
  sourceLabel: string | null
  sourceDate: string | null
  jurisdictionLabel: string | null
  claimStatus: ClaimStatus
  publicSummary: string | null
}

export type PublicCollaborationProjectDTO = {
  id: string
  slug: string
  title: string
  projectType: string
  status: string
  countryCode: string | null
  jurisdictionLabel: string | null
  publicSummary: string
  evidenceNeeded: string | null
  cta: 'Start collaboration'
}

export type PublicCultivarPassportDTO = {
  id: string
  slug: string
  displayName: string
  publicSummary: string
  breederDisplayName: string | null
  rightsHolderDisplayName: string | null
  originCountryCode: string | null
  originJurisdictionLabel: string | null
  cultivarCategory: CultivarCategory
  cannabisCategory: CannabisCategory | null
  claimStatus: ClaimStatus
  evidenceScoreSummary: string | null
  verificationSummary: string | null
  publicDisclaimer: string
  aliasesPublic: string[]
  countryOpportunitiesPublic: PublicCountryOpportunityDTO[]
  publicEvidenceSummaries: PublicEvidenceSummaryDTO[]
  publicCollaborationProjects: PublicCollaborationProjectDTO[]
  accessRequestCtas: Array<'Request access' | 'Request verification' | 'Request licensing discussion' | 'Request trial discussion' | 'Start collaboration' | 'Contact rights holder' | 'View public passport'>
}

export type InternalCultivarPassportDTO = PublicCultivarPassportDTO & {
  ownerUserId: string | null
  claimReviewStatus: ClaimReviewStatus
  privateEvidenceMetadata: Array<Pick<GeneticsEvidenceItemRow, 'id' | 'title' | 'evidence_type' | 'visibility' | 'review_status' | 'private_notes' | 'file_path' | 'file_is_private' | 'expires_at'>>
  accessRequests: Array<Pick<GeneticsAccessRequestRow, 'id' | 'request_type' | 'target_country_code' | 'declared_purpose' | 'status' | 'requires_nda' | 'requires_licence_review' | 'requires_admin_review' | 'review_notes_private'>>
  countryOpportunityReviewFields: Array<Pick<CultivarCountryOpportunityRow, 'id' | 'private_note' | 'requires_admin_review' | 'review_status' | 'material_transfer_status' | 'jurisdiction_gate_status'>>
}

export type AdminGeneticsReviewDTO = {
  cultivars: Array<{
    id: string
    slug: string
    displayName: string
    claimStatus: ClaimStatus
    claimReviewStatus: ClaimReviewStatus
    restrictedClaimFlags: string[]
    materialTransferFlags: string[]
  }>
  claimReviews: Array<Pick<GeneticsClaimReviewRow, 'id' | 'claim_label' | 'claim_status' | 'review_status' | 'public_note' | 'private_note' | 'created_at'>>
  evidenceQueue: Array<Pick<GeneticsEvidenceItemRow, 'id' | 'title' | 'evidence_type' | 'visibility' | 'claim_status' | 'review_status' | 'private_notes' | 'file_path' | 'file_is_private' | 'expires_at'>>
  accessRequests: Array<Pick<GeneticsAccessRequestRow, 'id' | 'request_type' | 'target_country_code' | 'declared_purpose' | 'status' | 'requires_nda' | 'requires_licence_review' | 'requires_admin_review' | 'review_notes_private'>>
  auditEvents: Array<Pick<GeneticsAuditEventRow, 'id' | 'event_type' | 'entity_type' | 'entity_id' | 'public_summary' | 'private_metadata' | 'created_at'>>
}

const unsafePublicKeys = ['private_notes', 'private_note', 'file_path', 'review_notes_private', 'private_metadata', 'owner_user_id', 'created_by', 'reviewer_user_id']

export function assertPublicCultivarPassportDTO(value: PublicCultivarPassportDTO) {
  const serialized = JSON.stringify(value)
  for (const key of unsafePublicKeys) {
    if (serialized.includes(key)) throw new Error(`Private genetics field leaked into public cultivar DTO: ${key}`)
  }
  return value
}

function opportunityCta(opportunityType: OpportunityType): PublicCountryOpportunityDTO['cta'] {
  if (opportunityType === 'trial_discussion') return 'Request trial discussion'
  if (opportunityType === 'research_collaboration' || opportunityType === 'tissue_culture_project') return 'Start collaboration'
  if (opportunityType === 'verification_request') return 'Request verification'
  return 'Request licensing discussion'
}

export function toPublicCultivarPassportDTO(input: {
  cultivar: CultivarPassportRow
  aliases: CultivarAliasRow[]
  breeder?: GeneticsProfileRow | null
  rightsHolder?: GeneticsProfileRow | null
  opportunities: CultivarCountryOpportunityRow[]
  evidence: GeneticsEvidenceItemRow[]
  collaborations: GeneticsCollaborationProjectRow[]
}): PublicCultivarPassportDTO {
  const reviewedEvidence = input.evidence.find(hasReviewedEvidenceForPublicClaim)
  const claimStatus = publicClaimStatusFor(input.cultivar.claim_status, input.cultivar.claim_review_status, Boolean(reviewedEvidence))
  const dto: PublicCultivarPassportDTO = {
    id: input.cultivar.id,
    slug: input.cultivar.slug,
    displayName: sanitizeRestrictedClaimText(input.cultivar.display_name, reviewedEvidence) ?? input.cultivar.display_name,
    publicSummary: sanitizeRestrictedClaimText(input.cultivar.public_summary, reviewedEvidence) ?? '',
    breederDisplayName: input.breeder?.display_name ?? null,
    rightsHolderDisplayName: input.rightsHolder?.display_name ?? null,
    originCountryCode: input.cultivar.origin_country_code,
    originJurisdictionLabel: input.cultivar.origin_jurisdiction_label,
    cultivarCategory: input.cultivar.cultivar_category,
    cannabisCategory: input.cultivar.cannabis_category,
    claimStatus,
    evidenceScoreSummary: sanitizeRestrictedClaimText(input.cultivar.evidence_score_summary, reviewedEvidence),
    verificationSummary: sanitizeRestrictedClaimText(input.cultivar.verification_summary, reviewedEvidence),
    publicDisclaimer: input.cultivar.public_disclaimer,
    aliasesPublic: input.aliases.filter((alias) => alias.is_public).map((alias) => sanitizeRestrictedClaimText(alias.alias, reviewedEvidence) ?? alias.alias),
    countryOpportunitiesPublic: input.opportunities
      .filter((opportunity) => ['open_to_discussion', 'invite_only', 'not_assessed'].includes(opportunity.status))
      .map((opportunity) => ({
        countryCode: opportunity.country_code,
        jurisdictionLabel: opportunity.jurisdiction_label,
        opportunityType: opportunity.opportunity_type,
        status: opportunity.status,
        materialTransferStatus: (['information_only', 'discussion_only', 'none'].includes(opportunity.material_transfer_status) ? opportunity.material_transfer_status : 'none') as PublicCountryOpportunityDTO['materialTransferStatus'],
        jurisdictionGateStatus: (['information_only', 'review_required', 'not_assessed'].includes(opportunity.jurisdiction_gate_status) ? opportunity.jurisdiction_gate_status : 'not_assessed') as PublicCountryOpportunityDTO['jurisdictionGateStatus'],
        publicNote: sanitizeRestrictedClaimText(opportunity.public_note, reviewedEvidence),
        cta: opportunityCta(opportunity.opportunity_type),
      })),
    publicEvidenceSummaries: input.evidence
      .filter((item) => item.visibility === 'public_summary')
      .map((item) => ({
        id: item.id,
        evidenceType: item.evidence_type,
        title: sanitizeRestrictedClaimText(item.title, item) ?? item.title,
        sourceLabel: item.source_label,
        sourceDate: item.source_date,
        jurisdictionLabel: item.jurisdiction_label,
        claimStatus: publicClaimStatusFor(item.claim_status, item.review_status, hasReviewedEvidenceForPublicClaim(item)),
        publicSummary: sanitizeRestrictedClaimText(item.public_summary, item),
      })),
    publicCollaborationProjects: input.collaborations
      .filter((project) => project.visibility === 'public_summary')
      .map((project) => ({
        id: project.id,
        slug: project.slug,
        title: sanitizeRestrictedClaimText(project.title, reviewedEvidence) ?? project.title,
        projectType: project.project_type,
        status: project.status,
        countryCode: project.country_code,
        jurisdictionLabel: project.jurisdiction_label,
        publicSummary: sanitizeRestrictedClaimText(project.public_summary, reviewedEvidence) ?? '',
        evidenceNeeded: sanitizeRestrictedClaimText(project.evidence_needed, reviewedEvidence),
        cta: 'Start collaboration',
      })),
    accessRequestCtas: ['Request access', 'Request verification', 'Request licensing discussion', 'Request trial discussion', 'Start collaboration', 'Contact rights holder', 'View public passport'],
  }
  return assertPublicCultivarPassportDTO(dto)
}

export function toInternalCultivarPassportDTO(publicDto: PublicCultivarPassportDTO, input: { cultivar: CultivarPassportRow; evidence: GeneticsEvidenceItemRow[]; accessRequests: GeneticsAccessRequestRow[]; opportunities: CultivarCountryOpportunityRow[] }): InternalCultivarPassportDTO {
  return {
    ...publicDto,
    ownerUserId: input.cultivar.owner_user_id,
    claimReviewStatus: input.cultivar.claim_review_status,
    privateEvidenceMetadata: input.evidence.map(({ id, title, evidence_type, visibility, review_status, private_notes, file_path, file_is_private, expires_at }) => ({ id, title, evidence_type, visibility, review_status, private_notes, file_path, file_is_private, expires_at })),
    accessRequests: input.accessRequests.map(({ id, request_type, target_country_code, declared_purpose, status, requires_nda, requires_licence_review, requires_admin_review, review_notes_private }) => ({ id, request_type, target_country_code, declared_purpose, status, requires_nda, requires_licence_review, requires_admin_review, review_notes_private })),
    countryOpportunityReviewFields: input.opportunities.map(({ id, private_note, requires_admin_review, review_status, material_transfer_status, jurisdiction_gate_status }) => ({ id, private_note, requires_admin_review, review_status, material_transfer_status, jurisdiction_gate_status })),
  }
}

export function toAdminGeneticsReviewDTO(input: { cultivars: CultivarPassportRow[]; opportunities: CultivarCountryOpportunityRow[]; evidence: GeneticsEvidenceItemRow[]; accessRequests: GeneticsAccessRequestRow[]; claimReviews: GeneticsClaimReviewRow[]; auditEvents: GeneticsAuditEventRow[] }): AdminGeneticsReviewDTO {
  return {
    cultivars: input.cultivars.map((cultivar) => ({
      id: cultivar.id,
      slug: cultivar.slug,
      displayName: cultivar.display_name,
      claimStatus: cultivar.claim_status,
      claimReviewStatus: cultivar.claim_review_status,
      restrictedClaimFlags: input.claimReviews.filter((review) => review.cultivar_id === cultivar.id && ['needs_evidence', 'submitted', 'disputed'].includes(review.review_status)).map((review) => review.claim_label),
      materialTransferFlags: input.opportunities.filter((opportunity) => opportunity.cultivar_id === cultivar.id && !['none', 'information_only', 'discussion_only'].includes(opportunity.material_transfer_status)).map((opportunity) => `${opportunity.country_code}: ${opportunity.material_transfer_status}`),
    })),
    claimReviews: input.claimReviews.map(({ id, claim_label, claim_status, review_status, public_note, private_note, created_at }) => ({ id, claim_label, claim_status, review_status, public_note, private_note, created_at })),
    evidenceQueue: input.evidence.map(({ id, title, evidence_type, visibility, claim_status, review_status, private_notes, file_path, file_is_private, expires_at }) => ({ id, title, evidence_type, visibility, claim_status, review_status, private_notes, file_path, file_is_private, expires_at })),
    accessRequests: input.accessRequests.map(({ id, request_type, target_country_code, declared_purpose, status, requires_nda, requires_licence_review, requires_admin_review, review_notes_private }) => ({ id, request_type, target_country_code, declared_purpose, status, requires_nda, requires_licence_review, requires_admin_review, review_notes_private })),
    auditEvents: input.auditEvents.map(({ id, event_type, entity_type, entity_id, public_summary, private_metadata, created_at }) => ({ id, event_type, entity_type, entity_id, public_summary, private_metadata, created_at })),
  }
}

export type GeneticsServiceProviderDTO = Pick<GeneticsServiceProviderRow, 'id' | 'service_category' | 'service_summary' | 'country_code' | 'jurisdiction_label' | 'verification_level'> & { displayName: string }
