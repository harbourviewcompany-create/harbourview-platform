import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('authority evidence tranche 003', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase/migrations/20260923013000_authority_evidence_tranche_003.sql'), 'utf8')

  test('contains official state authority records', () => {
    for (const key of ['US-CT','US-MD','US-ME','US-OR','US-WA']) expect(sql).toContain(`'${key}'`)
  })

  test('records verification metadata and avoids invented dates', () => {
    expect(sql).toContain("'verified','2026-09-23T00:00:00Z'")
    expect(sql).toContain('effective_from')
    expect(sql).toContain('null')
  })

  test('uses official government sources', () => {
    for (const domain of ['portal.ct.gov','cannabis.maryland.gov','maine.gov','oregon.gov','doh.wa.gov']) {
      expect(sql).toContain(domain)
    }
  })
})
