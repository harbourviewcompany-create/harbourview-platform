import type { EvidenceType, GeneticsAccessGrantRow, GeneticsAccessRequestRow } from './types'

export function isAccessGrantActive(grant: Pick<GeneticsAccessGrantRow, 'status' | 'starts_at' | 'expires_at' | 'revoked_at'>, at = new Date()) {
  const startsAt = new Date(grant.starts_at)
  const expiresAt = grant.expires_at ? new Date(grant.expires_at) : null
  return grant.status === 'active' && startsAt <= at && !grant.revoked_at && (!expiresAt || expiresAt > at)
}

export function grantAllowsEvidence(
  grant: Pick<GeneticsAccessGrantRow, 'cultivar_id' | 'grantee_profile_id' | 'allowed_evidence_item_ids' | 'allowed_evidence_types' | 'status' | 'starts_at' | 'expires_at' | 'revoked_at'>,
  evidence: { id: string; cultivar_id: string | null; evidence_type: EvidenceType },
  granteeProfileId: string,
  at = new Date(),
) {
  if (!evidence.cultivar_id || grant.cultivar_id !== evidence.cultivar_id) return false
  if (grant.grantee_profile_id !== granteeProfileId) return false
  if (!isAccessGrantActive(grant, at)) return false
  return grant.allowed_evidence_item_ids.includes(evidence.id) || grant.allowed_evidence_types.includes(evidence.evidence_type)
}

export function approvedRequestDoesNotGrantEvidence(request: Pick<GeneticsAccessRequestRow, 'status'>) {
  return request.status === 'approved_limited' || request.status === 'approved_full'
}
