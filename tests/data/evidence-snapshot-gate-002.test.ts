import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('evidence snapshot gate 002', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase/migrations/20260923033000_evidence_snapshot_gate_002.sql'), 'utf8')

  test('requires a successful fetched snapshot with payload and SHA-256', () => {
    for (const token of ['qualifying_snapshot','snapshot_hash','fetched_at','http_status','raw_payload']) expect(sql).toContain(token)
    expect(sql).toContain("ss.http_status < 200 or ss.http_status >= 300")
    expect(sql).toContain("length(ss.raw_payload)=0")
  })

  test('links structured evidence to the snapshot gate', () => {
    for (const table of ['jurisdiction_regulatory_rules','jurisdiction_regulators','jurisdiction_regulatory_changes','jurisdiction_market_participants','jurisdiction_relationships','jurisdiction_opportunities']) {
      expect(sql).toContain(`public.${table}`)
    }
    expect(sql).toContain('v_jurisdiction_structured_evidence_provenance')
  })

  test('surfaces verified evidence lacking qualifying snapshots', () => {
    expect(sql).toContain('verified_without_qualifying_snapshot')
    expect(sql).toContain('affected_jurisdictions')
  })
})
