import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('full-depth dimension state matrix contract', () => {
  const migration = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260922233000_full_depth_dimension_state_matrix.sql'),
    'utf8',
  )

  test('defines explicit applicability and fail-closed statuses', () => {
    expect(migration).toContain("applicability in ('applicable','not_applicable','unknown')")
    expect(migration).toContain("status in ('complete','missing','blocked','stale','conflict','unmeasured')")
    expect(migration).toContain("count(*)=291*32")
    expect(migration).toContain("unknown_applicability_rows")
    expect(migration).toContain("full_depth_ready")
  })

  test('does not permit inherited data to masquerade as complete evidence', () => {
    expect(migration).not.toContain("when 'country_intel' then 'identity'")
    expect(migration).toContain("Unknown applicability is intentionally distinct from not-applicable")
    expect(migration).toContain("status in ('missing','blocked','stale','conflict','unmeasured')")
  })

  test('does not mutate the canonical jurisdiction facts during matrix construction', () => {
    expect(migration).not.toMatch(/insert\s+into\s+public\.countries/i)
    expect(migration).not.toMatch(/update\s+public\.countries/i)
    expect(migration).not.toMatch(/delete\s+from\s+public\.countries/i)
  })
})
