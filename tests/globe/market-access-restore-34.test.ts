import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260913150000_restore_34_market_access_evidence_standing_bar.sql',
)

const sql = readFileSync(migrationPath, 'utf8')
const expected = [
  'AL','AR','BG','BY','CH','CL','CN','CY','EC','GY','HR','HU','IN','JP','KE','KN','LK',
  'LT','MD','MX','NG','PY','RS','RU','RW','SE','SG','SI','SK','TH','TR','TZ','VC','VU',
]

describe('restore retired market-access evidence', () => {
  it('targets exactly the 34 retired evidence keys', () => {
    const matches = [...sql.matchAll(/'hv-mkt-([a-z]{2})-20260907'/g)]
      .map(([, iso]) => iso.toUpperCase())
    const unique = [...new Set(matches)]
    expect(unique).toHaveLength(expected.length)
    expect(unique.sort()).toEqual([...expected].sort())
  })

  it('runs before the 127-row completion tranche and refreshes publication', () => {
    expect(sql).toContain("select * from api.refresh_verified_market_access_tiers('market-access-restore-34-20260913')")
    expect(sql).toContain('v_published <> 164')
    expect(sql).toContain('v_missing <> 127')
  })
})

// Registry Impact: no project identity or canonical registry mapping changes.
