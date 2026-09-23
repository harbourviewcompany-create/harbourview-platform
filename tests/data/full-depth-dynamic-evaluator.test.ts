import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('full-depth dynamic evaluator', () => {
  const migration = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260923001000_full_depth_dynamic_evaluator.sql'),
    'utf8',
  )

  test('evaluates structured rule dimensions from verified evidence', () => {
    for (const dimension of [
      'access_rules',
      'commercial_activity',
      'import',
      'export',
      'distribution',
      'testing',
      'packaging_labeling',
      'tax_fees',
    ]) {
      expect(migration).toContain(`b.dimension_key='${dimension}'`)
    }
    expect(migration).toContain("verification_status='verified'")
  })

  test('keeps unknown applicability unresolved', () => {
    expect(migration).toContain("when b.applicability='unknown' then 'unmeasured'")
    expect(migration).toContain("when b.applicability='unknown' then 'Applicability has not been established.'")
  })

  test('uses current evidence for regulatory status and tier', () => {
    expect(migration).toContain('current_verified_evidence_rows')
    expect(migration).toContain('snapshotted_evidence_rows')
    expect(migration).toContain('c.verified_regulatory_tier')
    expect(migration).toContain('v_jurisdiction_verified_snapshot_gate')
    expect(migration).toContain('qualifying_current_rows')
    expect(migration).toContain('lower(e.source_snapshot_sha256)=lower(g.snapshot_hash)')
  })

  test('conflicts cannot become complete', () => {
    expect(migration).toContain("then 'conflict' else 'missing' end")
    expect(migration).toContain("evaluated_status in ('missing','blocked','stale','conflict','unmeasured')")
  })

  test('summary and integrity views consume evaluated status', () => {
    expect(migration).toContain('from public.v_jurisdiction_data_depth_evaluator')
    expect(migration).toContain('full_depth_ready')
  })
})
