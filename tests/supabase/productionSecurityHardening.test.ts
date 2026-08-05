import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync('supabase/migrations/20260804190000_production_security_hardening.sql', 'utf8')
const assertions = readFileSync('supabase/tests/production_security_hardening.sql', 'utf8')
const authControl = readFileSync('scripts/configure-supabase-auth-production.mjs', 'utf8')

describe('production Supabase security hardening', () => {
  it('uses an explicit view inventory, existence guard, and security-invoker execution', () => {
    expect(migration).toContain('create or replace function public.view_exists(p_schema text, p_view text)')
    expect(migration).toContain("if public.view_exists('api', 'hv_artifacts') then")
    expect(migration).toContain('set (security_invoker = true)')
    expect(migration).toContain('revoke all privileges on table api.hv_artifacts from public, anon, authenticated')
    expect(migration).toContain('grant select on table api.hv_artifacts to service_role')
  })

  it('keeps policyless RLS tables deny-by-default without synthetic policies', () => {
    expect(migration).toContain("and not exists (select 1 from pg_policy p where p.polrelid = c.oid)")
    expect(migration).not.toContain('deny_application_roles_until_reviewed')
    expect(migration).not.toContain('using (false) with check (false)')
  })

  it('closes SECURITY DEFINER routines and restores only explicit allowlists', () => {
    expect(migration).toContain('where p.prosecdef')
    expect(migration).toContain("'api.get_command_centre_stats()'")
    expect(migration).toContain("'public.hv_is_platform_staff()'")
    expect(migration).not.toContain('grant execute on all functions')
  })

  it('keeps external digest and enrichment routines service-role only', () => {
    expect(migration).toContain("to_regprocedure('public.run_editorial_digest()')")
    expect(migration).toContain('grant execute on function public.run_editorial_digest() to service_role')
    expect(migration).toContain("to_regprocedure('public.run_country_intel_enrichment()')")
    expect(migration).toContain('grant execute on function public.run_country_intel_enrichment() to service_role')
    expect(assertions).toContain("('anon', 'public.run_editorial_digest()', false)")
    expect(assertions).toContain("('authenticated', 'public.run_editorial_digest()', false)")
    expect(assertions).toContain("('service_role', 'public.run_editorial_digest()', true)")
    expect(assertions).toContain("('anon', 'public.run_country_intel_enrichment()', false)")
    expect(assertions).toContain("('authenticated', 'public.run_country_intel_enrichment()', false)")
    expect(assertions).toContain("('service_role', 'public.run_country_intel_enrichment()', true)")
  })

  it('contains foreign tables and non-relocatable pg_net access', () => {
    expect(migration).toContain('information_schema.foreign_tables')
    expect(migration).toContain('revoke usage on schema net from public, anon, authenticated')
  })

  it('locks leaked-password protection to the production project and one config field', () => {
    expect(authControl).toContain("const PROJECT_REF = 'zvxdgdkukjrrwamdpqrg'")
    expect(authControl).toContain('JSON.stringify({ password_hibp_enabled: true })')
    expect(authControl).not.toContain('SUPABASE_SERVICE_ROLE_KEY')
  })
})