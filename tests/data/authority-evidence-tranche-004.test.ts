import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('authority evidence tranche 004', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase/migrations/20260923020000_authority_evidence_tranche_004.sql'), 'utf8')

  test('contains four additional state authorities', () => {
    for (const key of ['US-NV','US-MN','US-MO','US-NM']) expect(sql).toContain(`'${key}'`)
  })

  test('uses official state sources', () => {
    for (const domain of ['ccb.nv.gov','mn.gov/ocm','health.mo.gov','nm.gov']) expect(sql).toContain(domain)
  })

  test('records verification metadata', () => {
    expect(sql).toContain("'verified','2026-09-23T00:00:00Z'")
    expect(sql).toContain('effective_from')
  })
})
