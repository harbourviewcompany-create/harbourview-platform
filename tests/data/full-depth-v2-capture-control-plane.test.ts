import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('full-depth v2 capture control plane', () => {
  const migration = fs.readFileSync(
    path.join(process.cwd(),'supabase/migrations/20260924130000_full_depth_v2_capture_control_plane.sql'),
    'utf8',
  )

  it('is bound to the production 2026-09-23.v2 contract and exact 291 x 32 matrix', () => {
    expect(migration).toContain("contract_version='2026-09-23.v2'")
    expect(migration).toContain("v_dims<>32")
    expect(migration).toContain("v_jur<>291")
    expect(migration).toContain("v_jobs<>9312")
  })

  it('requires immutable source snapshot provenance for verified evidence', () => {
    expect(migration).toContain("fetch_status='success'")
    expect(migration).toContain("raw_html_hash")
    expect(migration).toContain("captured_text")
    expect(migration).toContain("sr.source_url=e.source_url")
    expect(migration).toContain("enforce_full_depth_v2_provenance")
  })

  it('keeps capture state separate from evidence completeness', () => {
    expect(migration).toContain("status in ('queued','capturing','captured','needs_review','complete','blocked')")
    expect(migration).toContain("v_jurisdiction_data_depth_v2_evidence_gate")
    expect(migration).toContain("PROVENANCE_NOT_QUALIFIED")
  })

  it('does not expose client write access to the capture queue', () => {
    expect(migration).toContain("revoke insert,update,delete on public.jurisdiction_data_depth_capture_jobs from anon,authenticated")
  })
})
