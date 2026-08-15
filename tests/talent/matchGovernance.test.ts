import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const match = readFileSync('supabase/migrations/20260815174000_talent_p0_match_engine.sql','utf8')

describe('Talent P0 matching governance', () => {
  it('versions match policy and records input versions/snapshots', () => {
    expect(match).toContain('talent-p0-baseline')
    expect(match).toContain('job_requirement_version_id')
    expect(match).toContain('taxonomy_version_id')
    expect(match).toContain('passport_snapshot_hash')
    expect(match).toContain('credential_snapshot_hash')
  })

  it('uses unresolved when evidence is missing rather than inventing qualification', () => {
    expect(match).toContain("v_state := 'unresolved'")
    expect(match).toContain('Harbourview does not infer qualification from job prose')
    expect(match).toContain("'satisfied','not_satisfied','unresolved','not_applicable'")
  })

  it('requires explicit active credential evidence to satisfy credential requirements', () => {
    expect(match).toContain("c.lifecycle_status='active_verified'")
    expect(match).toContain("c.lifecycle_status IN ('expired','suspended','revoked')")
  })

  it('invalidates old matches when requirement, Passport, credential, or privacy state changes', () => {
    expect(match).toContain('talent_requirements_invalidate_matches')
    expect(match).toContain('talent_capabilities_invalidate_matches')
    expect(match).toContain('talent_credentials_invalidate_matches')
    expect(match).toContain('talent_visibility_invalidate_matches')
  })
})
