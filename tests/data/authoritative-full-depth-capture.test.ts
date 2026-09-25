import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('authoritative full-depth capture', () => {
  const root = process.cwd()
  const migration = fs.readFileSync(path.join(root,'supabase/migrations/20260923131000_authoritative_full_depth_evidence_store.sql'),'utf8')
  const queue = fs.readFileSync(path.join(root,'supabase/migrations/20260923130000_authoritative_full_depth_capture_queue.sql'),'utf8')
  const worker = fs.readFileSync(path.join(root,'supabase/functions/full-depth-authority-capture/index.ts'),'utf8')

  it('creates an exact 291 x 32 durable capture queue', () => {
    expect(queue).toContain("cross join public.jurisdiction_data_depth_dimensions")
    expect(queue).toContain("d.contract_version='2026-09-22.v1'")
    expect(queue).toContain("unique(jurisdiction_key, dimension_key)")
  })

  it('requires snapshot lineage and exact source binding for evidence', () => {
    expect(migration).toContain("source_registry_id uuid not null")
    expect(migration).toContain("source_snapshot_id uuid not null")
    expect(migration).toContain("evidence_quote text not null")
    expect(migration).toContain("verification_status")
  })

  it('fails closed when source text cannot support the extracted quote', () => {
    expect(worker).toContain('quote_not_found_in_snapshot')
    expect(worker).toContain('SOURCE_CAPTURED_BUT_DIMENSION_NOT_DIRECTLY_SUPPORTED')
    expect(worker).toContain('status:"needs_review"')
  })

  it('does not allow parent-jurisdiction source fallback', () => {
    expect(worker).not.toContain('parent_jurisdiction_key')
    expect(worker).not.toContain('p_iso')
    expect(worker).toContain('jurisdiction_code.eq')
    expect(worker).toContain('contract_version", "2026-09-23.v2')
    expect(worker).toContain('fetch_status: response.ok ? "success" : "http_error"')
    expect(worker).not.toContain('captured_url: source.source_url')
    expect(worker).not.toContain('captured_title: source.source_name')
    expect(worker).not.toContain('error_message:')
    expect(worker).not.toContain('language_detected:')
    expect(worker).not.toContain('word_count:')
    expect(worker).not.toContain('requires_translation:')
  })

  it('uses a first-party captured source as the only extraction input', () => {
    expect(worker).toContain('source.source_url')
    expect(worker).toContain('snapshot.captured_text.slice(0,180000)')
    expect(worker).toContain('Use ONLY the supplied captured first-party authority text')
  })
})
