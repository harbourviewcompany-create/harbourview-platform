import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('evidence architecture hardening 001', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase/migrations/20260923030000_evidence_architecture_hardening_001.sql'), 'utf8')

  test('defines read-only provenance gates', () => {
    expect(sql).toContain('v_jurisdiction_evidence_provenance_gates')
    expect(sql).toContain('assert_full_depth_evidence_gates')
  })

  test('requires snapshot, verification and HTTPS provenance in the gate', () => {
    expect(sql).toContain('missing_snapshot_rows')
    expect(sql).toContain('missing_verification_rows')
    expect(sql).toContain('invalid_url_rows')
    expect(sql).toContain('source_snapshot_sha256')
  })

  test('checks subnational hierarchy instead of inheriting parent evidence', () => {
    expect(sql).toContain('wrong_level')
    expect(sql).toContain('wrong_parent')
    expect(sql).toContain('parent_jurisdiction_key')
  })

  test('does not silently upgrade existing evidence', () => {
    expect(sql).toContain('existing verified rows are not silently upgraded')
    expect(sql).toContain('Phase 1 is diagnostic enforcement')
  })
})
