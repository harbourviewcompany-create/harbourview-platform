import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('authority evidence tranche 002', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase/migrations/20260923010000_authority_evidence_tranche_002.sql'), 'utf8')

  test('contains official regulator authority records', () => {
    for (const key of ['US-CA','US-CO','US-MA','US-NY','US-IL','US-MI','US-NJ','US-OH','US-PA','US-FL','CA-ON','CA-BC','CA-AB','CA-QC','AU-NSW','AU-VIC','AU-QLD','AU-WA','AU-SA']) {
      expect(sql).toContain(`'${key}'`)
    }
  })

  test('authority rows carry source and verification metadata', () => {
    expect(sql).toContain('source_url')
    expect(sql).toContain('verification_status')
    expect(sql).toContain("'verified','2026-09-23T00:00:00Z'")
  })

  test('does not fabricate unresolved jurisdictions', () => {
    expect(sql).not.toContain("'US-VA'")
    expect(sql).not.toContain("'US-TX'")
    expect(sql).not.toContain("'AU-TAS'")
  })
})
