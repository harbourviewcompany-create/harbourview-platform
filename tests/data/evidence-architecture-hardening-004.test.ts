import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('full-depth publication gate 004', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase/migrations/20260923040000_evidence_architecture_hardening_004.sql'), 'utf8')
  test('defines a strict publication gate distinct from diagnostic completeness', () => {
    expect(sql).toContain('v_jurisdiction_full_depth_publication_gate')
    expect(sql).toContain('publication_ready')
    expect(sql).toContain("h.jurisdiction_level <> 'unknown'")
    expect(sql).toContain('unknown_applicability')
    expect(sql).toContain('unresolved_cells')
    expect(sql).toContain('valid_primary_sources')
  })
  test('requires verified structured evidence to have qualifying snapshots', () => {
    expect(sql).toContain('verified_total')
    expect(sql).toContain('verified_with_snapshot')
    expect(sql).toContain('verified_structured_evidence_rows')
    expect(sql).toContain('verified_structured_rows_with_snapshot')
    expect(sql).toContain('coalesce(q.verified_total,0)=coalesce(q.verified_with_snapshot,0)')
  })
  test('keeps publication gate service-role assertion private', () => {
    expect(sql).toContain('revoke all on function public.assert_full_depth_publication_gate() from public, anon, authenticated')
    expect(sql).toContain('grant execute on function public.assert_full_depth_publication_gate() to service_role')
  })
})
