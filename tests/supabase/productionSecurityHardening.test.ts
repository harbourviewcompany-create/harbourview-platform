import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync('supabase/migrations/20260804190000_production_security_hardening.sql', 'utf8')
const assertions = readFileSync('supabase/tests/production_security_hardening.sql', 'utf8')
const authControl = readFileSync('scripts/configure-supabase-auth-production.mjs', 'utf8')

describe('production Supabase security hardening', () => {
  it('defines an explicit public, preserved-contract, and internal view grant matrix', () => {
    expect(migration).toContain("('public','country_intel_public','public')")
    expect(migration).toContain("('public','marketplace_public_listings_v1','public')")
    expect(migration).toContain("('regulatory_signals','public_signals','public')")
    expect(migration).toContain("('public','ia_sources_live','preserve')")
    expect(migration).toContain("('api','hv_artifacts','internal')")
    expect(migration).toContain('alter view %I.%I set (security_invoker = true)')
    expect(migration).toContain('grant select on table %I.%I to anon, authenticated, service_role')
  })

  it('keeps policyless RLS tables deny-by-default without synthetic policies', () => {
    expect(migration).toContain("and not exists (select 1 from pg_policy p where p.polrelid = c.oid)")
    expect(migration).not.toContain('deny_application_roles_until_reviewed')
    expect(migration).not.toContain('using (false) with check (false)')
  })

  it('closes SECURITY DEFINER routines and restores only exact role allowlists', () => {
    expect(migration).toContain('where p.prosecdef')
    expect(migration).toContain("'api.get_command_centre_stats()'")
    expect(migration).toContain("'public.hv_is_platform_staff()'")
    expect(migration).not.toContain('grant execute on all functions')
    expect(assertions).toContain("'unauthorized_authenticated_execute'")
    expect(assertions).toContain("'anon_security_definer_execute'")
  })

  it('contains foreign tables and guards optional pg_net access', () => {
    expect(migration).toContain('information_schema.foreign_tables')
    expect(migration).toContain("if exists (select 1 from pg_namespace where nspname = 'net') then")
    expect(migration).toContain("execute 'revoke usage on schema net from public, anon, authenticated'")
    expect(migration).toContain("where n.nspname = 'net'")
    expect(migration).toContain("'grant execute on %s %s to service_role'")
  })

  it('asserts database state for public reads and internal denial', () => {
    expect(assertions).toContain("'anon_select_missing'")
    expect(assertions).toContain("'authenticated_select_missing'")
    expect(assertions).toContain("'anon_internal_access'")
    expect(assertions).toContain("'authenticated_internal_access'")
    expect(assertions).toContain("'security_invoker_missing'")
  })

  it('locks leaked-password protection to the production project and one config field', () => {
    expect(authControl).toContain("const PROJECT_REF = 'zvxdgdkukjrrwamdpqrg'")
    expect(authControl).toContain('JSON.stringify({ password_hibp_enabled: true })')
    expect(authControl).not.toContain('SUPABASE_SERVICE_ROLE_KEY')
  })
})
