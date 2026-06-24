import { describe, expect, it } from 'vitest'
import { isAccessGrantActive, grantAllowsEvidence } from '@/lib/genetics/accessGrants'
import type { GeneticsAccessGrantRow } from '@/lib/genetics/types'

function makeGrant(overrides: Partial<GeneticsAccessGrantRow> = {}): GeneticsAccessGrantRow {
  return {
    id: 'grant-1',
    access_request_id: null,
    cultivar_id: 'cultivar-1',
    grantee_profile_id: 'profile-grantee',
    grantor_profile_id: 'profile-grantor',
    grantor_user_id: null,
    grant_scope: 'Provenance summary only.',
    allowed_evidence_item_ids: [],
    allowed_evidence_types: [],
    status: 'active',
    starts_at: new Date(Date.now() - 60_000).toISOString(),
    expires_at: null,
    revoked_at: null,
    revoked_by: null,
    revocation_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as GeneticsAccessGrantRow
}

describe('isAccessGrantActive', () => {
  it('is active for a started, non-expired, non-revoked, status=active grant', () => {
    expect(isAccessGrantActive(makeGrant())).toBe(true)
  })

  it('is not active before its starts_at', () => {
    expect(isAccessGrantActive(makeGrant({ starts_at: new Date(Date.now() + 60_000).toISOString() }))).toBe(false)
  })

  it('is not active after its expires_at', () => {
    expect(isAccessGrantActive(makeGrant({ expires_at: new Date(Date.now() - 1000).toISOString() }))).toBe(false)
  })

  it('is not active once revoked, even if otherwise within its window', () => {
    expect(isAccessGrantActive(makeGrant({ revoked_at: new Date().toISOString() }))).toBe(false)
  })

  it('is not active if status is not "active"', () => {
    expect(isAccessGrantActive(makeGrant({ status: 'suspended' as GeneticsAccessGrantRow['status'] }))).toBe(false)
  })
})

describe('grantAllowsEvidence', () => {
  const evidence = { id: 'evidence-1', cultivar_id: 'cultivar-1', evidence_type: 'provenance_note' as const }

  it('denies if the evidence belongs to a different cultivar than the grant', () => {
    const grant = makeGrant({ allowed_evidence_item_ids: ['evidence-1'] })
    expect(grantAllowsEvidence(grant, { ...evidence, cultivar_id: 'cultivar-2' }, 'profile-grantee')).toBe(false)
  })

  it('denies if the requesting profile is not the grantee', () => {
    const grant = makeGrant({ allowed_evidence_item_ids: ['evidence-1'] })
    expect(grantAllowsEvidence(grant, evidence, 'someone-else')).toBe(false)
  })

  it('denies if the grant is not currently active', () => {
    const grant = makeGrant({ allowed_evidence_item_ids: ['evidence-1'], revoked_at: new Date().toISOString() })
    expect(grantAllowsEvidence(grant, evidence, 'profile-grantee')).toBe(false)
  })

  it('allows when the specific evidence item id is in the allowlist', () => {
    const grant = makeGrant({ allowed_evidence_item_ids: ['evidence-1'] })
    expect(grantAllowsEvidence(grant, evidence, 'profile-grantee')).toBe(true)
  })

  it('allows when the evidence type (not just id) is in the allowlist', () => {
    const grant = makeGrant({ allowed_evidence_item_ids: [], allowed_evidence_types: ['provenance_note'] })
    expect(grantAllowsEvidence(grant, evidence, 'profile-grantee')).toBe(true)
  })

  it('denies when neither the item id nor its type is allowlisted', () => {
    const grant = makeGrant({ allowed_evidence_item_ids: ['some-other-evidence'], allowed_evidence_types: ['coa'] })
    expect(grantAllowsEvidence(grant, evidence, 'profile-grantee')).toBe(false)
  })
})
