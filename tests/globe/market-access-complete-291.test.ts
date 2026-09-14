import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260913154800_market_access_evidence_complete_127.sql',
)

const sql = readFileSync(migrationPath, 'utf8')
const expected = ['PR', 'AE', 'GD', 'BA', 'LC', 'EE', 'LA', 'BE', 'BJ', 'NA', 'BT', 'GE', 'LB', 'PK', 'MY', 'FJ', 'GM', 'BS', 'AG', 'SV', 'FK', 'CV', 'CD', 'AM', 'FO', 'SZ', 'LI', 'SM', 'AO', 'EG', 'BO', 'CU', 'KH', 'ET', 'BZ', 'BN', 'ID', 'KM', 'PH', 'VN', 'AD', 'BF', 'BI', 'CM', 'CI', 'DJ', 'LR', 'DM', 'DO', 'NI', 'BH', 'NP', 'RO', 'DZ', 'CF', 'TD', 'GQ', 'ER', 'GA', 'GN', 'GW', 'LY', 'MG', 'ML', 'MR', 'MU', 'MZ', 'NE', 'CG', 'ST', 'SN', 'SC', 'SL', 'SO', 'SS', 'SD', 'TG', 'TN', 'UG', 'EH', 'GL', 'GT', 'HT', 'HN', 'SR', 'VE', 'AF', 'AZ', 'BD', 'HK', 'IR', 'IQ', 'JO', 'KZ', 'KW', 'KG', 'MV', 'MN', 'MM', 'KP', 'OM', 'PS', 'QA', 'SA', 'SY', 'TW', 'TJ', 'TL', 'TM', 'UZ', 'YE', 'VA', 'IS', 'XK', 'LV', 'MC', 'ME', 'KI', 'MH', 'FM', 'NR', 'PW', 'PG', 'WS', 'SB', 'TO', 'TV']
const allowed = new Set(['prohibited', 'cbd_hemp_only', 'medical_limited_trade', 'domestic_only', 'legal_commercial_access'])

const matches = [...sql.matchAll(/'hv-mkt-complete-([a-z]{2})-20260913','([A-Z]{2})','([^']+)'/g)]
  .map(([, keyIso, iso, tier]) => ({ keyIso, iso, tier }))

describe('complete 291-jurisdiction Market Access evidence migration', () => {
  it('contains exactly the 127 production evidence-gap jurisdictions', () => {
    expect(matches).toHaveLength(expected.length)
    const seen = new Set<string>()
    for (const row of matches) {
      expect(row.keyIso.toUpperCase()).toBe(row.iso)
      expect(expected).toContain(row.iso)
      expect(seen.has(row.iso)).toBe(false)
      expect(allowed.has(row.tier)).toBe(true)
      seen.add(row.iso)
    }
    expect([...seen].sort()).toEqual([...expected].sort())
  })

  it('refreshes verified tiers and asserts the 291-row completion invariant', () => {
    expect(sql).toContain("select * from api.refresh_verified_market_access_tiers('market-access-complete-127-20260913')")
    expect(sql).toContain('v_total <> 291')
    expect(sql).toContain('v_published <> 291')
    expect(sql).toContain('v_missing <> 0')
  })
})
