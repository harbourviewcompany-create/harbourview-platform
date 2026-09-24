import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('evidence architecture hardening 006', () => {
  const migration = readFileSync(join(process.cwd(), 'supabase/migrations/20260923042000_evidence_architecture_hardening_006.sql'), 'utf8')

  test('requires dimension-aware authority policy and applicability evidence', () => {
    expect(migration).toContain('jurisdiction_data_depth_dimension_authority_requirements')
    expect(migration).toContain('requires_dimension_specific_source')
    expect(migration).toContain('jurisdiction_data_depth_applicability_evidence')
    expect(migration).toContain('MISSING_APPLICABILITY_EVIDENCE')
    expect(migration).toContain('UNVERIFIED_APPLICABILITY')
    expect(migration).toContain('APPLICABILITY_SNAPSHOT_INVALID')
  })

  test('does not reference nonexistent source_snapshots columns', () => {
    expect(migration).not.toContain('ss.captured_url')
    expect(migration).not.toContain('ss.captured_title')
    expect(migration).not.toContain('ss.error_message')
  })

  test('enforces source binding through the actual source registry lineage', () => {
    expect(migration).toContain('r.source_url<>coalesce(sr.source_url,\'\')')
    expect(migration).toContain('source_snapshot_id')
    expect(migration).toContain('v_jurisdiction_verified_snapshot_gate')
  })

  test('exposes effective-date, conflict, and gate-reason diagnostics', () => {
    expect(migration).toContain('FUTURE_EFFECTIVE')
    expect(migration).toContain('EXPIRED')
    expect(migration).toContain('MULTIPLE_CURRENT_VERIFIED')
    expect(migration).toContain('v_jurisdiction_full_depth_gate_reasons')
    expect(migration).toContain('UNKNOWN_HIERARCHY')
  })
})
