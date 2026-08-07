import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync('supabase/migrations/20260804190000_production_security_hardening.sql', 'utf8')
const assertions = readFileSync('supabase/tests/production_security_hardening.sql', 'utf8')
const authControl = readFileSync('scripts/configure-supabase-auth-production.mjs', 'utf8')

describe('production Supabase security hardening controls', () => {
  it('contains no synthetic deny policies or destructive business-data operations', () => {
    expect(migration).not.toMatch(/using\s*\(\s*false\s*\)/i)
    expect(migration).not.toMatch(/with\s+check\s*\(\s*false\s*\)/i)
    expect(migration).not.toMatch(/(truncate|drop\s+table|delete\s+from)/i)
  })

  it('uses explicit guarded view contracts and a guarded net-schema control', () => {
    expect(migration).toContain("if public.view_exists('public', 'marketplace_public_listings_v1') then")
    expect(migration).toContain('grant select on table public.marketplace_public_listings_v1 to anon, authenticated, service_role')
    expect(migration).toContain("if exists (select 1 from pg_namespace where nspname = 'net') then")
  })

  it('keeps state validation in the zero-row SQL assertion suite', () => {
    expect(assertions).toContain('public_read_contract_missing')
    expect(assertions).toContain('internal_view_exposed')
    expect(assertions).toContain('authenticated_definer_execute')
  })

  it('locks the Auth change to the production project and bounds Management API requests', () => {
    expect(authControl).toContain("const PROJECT_REF = 'zvxdgdkukjrrwamdpqrg'")
    expect(authControl).toContain('AbortSignal.timeout(MANAGEMENT_API_TIMEOUT_MS)')
    expect(authControl.match(/AbortSignal\.timeout\(MANAGEMENT_API_TIMEOUT_MS\)/g)).toHaveLength(2)
  })
})
