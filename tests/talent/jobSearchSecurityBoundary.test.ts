import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  'supabase/migrations/20260815161000_talent_p0_job_search_security_boundary.sql',
  'utf8',
)

describe('Talent P0 legacy job_search security boundary', () => {
  it('removes browser schema access and broad client-read policies', () => {
    expect(migration).toContain('REVOKE USAGE ON SCHEMA job_search FROM anon, authenticated')
    expect(migration).toContain("DROP POLICY IF EXISTS %I ON job_search.%I', 'client read access'")
    expect(migration).toContain('REVOKE ALL PRIVILEGES ON TABLE job_search.%I FROM anon, authenticated')
  })

  it('preserves service-role access for legacy/operator compatibility', () => {
    expect(migration).toContain('GRANT USAGE ON SCHEMA job_search TO service_role')
    expect(migration).toContain('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA job_search TO service_role')
  })

  it('does not delete or rewrite legacy job_search records', () => {
    expect(migration).not.toMatch(/\b(delete|truncate)\s+from\s+job_search\./i)
    expect(migration).not.toMatch(/\bdrop\s+table\s+job_search\./i)
  })
})
