import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('full-depth dimension source registry', () => {
  const migration = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260922234500_full_depth_dimension_source_registry.sql'),
    'utf8',
  )

  test('records implementation state for all contract dimensions', () => {
    expect(migration).toContain("implementation_status in ('wired','partial','schema_gap')")
    expect(migration.match(/\('(?:[^']+)'\s*,\s*'2026-09-22\.v1'/g)?.length).toBe(32)
    expect(migration).toContain('v_jurisdiction_data_depth_contract_gaps')
  })

  test('schema gaps cannot be interpreted as evidence', () => {
    expect(migration).toContain("coalesce(s.implementation_status,'schema_gap') <> 'wired'")
    expect(migration).toContain("No dedicated jurisdiction-level access-rule relation")
    expect(migration).toContain("Requires dedicated immutable change-event history")
  })
})
