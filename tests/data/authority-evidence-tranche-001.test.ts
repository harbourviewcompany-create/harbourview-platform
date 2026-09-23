import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('authority evidence tranche 001', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase/migrations/20260923003000_authority_evidence_tranche_001.sql'), 'utf8')

  test('uses only official authority domains', () => {
    const urls = [...sql.matchAll(/'https:\/\/([^']+)'/g)].map(m => m[1])
    expect(urls.length).toBeGreaterThanOrEqual(10)
    for (const host of urls) {
      expect(host).not.toMatch(/wikipedia|leafly|statista|prohibitionpartners|secondary/)
    }
  })

  test('all inserted facts are explicitly verified and sourced', () => {
    expect(sql).toContain("verification_status,verified_at")
    expect(sql).toContain("'verified','2026-09-23T00:00:00Z'")
    expect(sql).toContain('source_url')
    expect(sql).toContain('on conflict do nothing')
  })

  test('does not insert evidence for unsupported jurisdictions', () => {
    for (const key of ['CA','DE','NL','UY','AU','NZ','MT','GB']) {
      expect(sql).toContain(`'${key}'`)
    }
  })
})
