import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('authority evidence tranche 005', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase/migrations/20260923023000_authority_evidence_tranche_005.sql'), 'utf8')
  test('contains five additional state authorities', () => {
    for (const key of ['US-VA','US-AL','US-AR','US-AZ','US-DE']) expect(sql).toContain(`'${key}'`)
  })
  test('captures Virginia current retail milestone without treating it as current sales', () => {
    expect(sql).toContain('"regulated_retail_sales_begin":"2027-07-01"')
    expect(sql).toContain('future_adult_use_retail_market')
  })
  test('uses verification metadata', () => {
    expect(sql).toContain("'verified','2026-09-23T00:00:00Z'")
  })
})
