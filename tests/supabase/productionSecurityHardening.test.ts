import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync('supabase/migrations/20260804190000_production_security_hardening.sql', 'utf8')
const authControl = readFileSync('scripts/configure-supabase-auth-production.mjs', 'utf8')

describe('production Supabase security hardening', () => {
  it('converts exposed views to security invoker and removes blanket application privileges', () => {
    expect(migration).toContain("alter view %I.%I set (security_invoker = true)")
    expect(migration).toContain('revoke all privileges on table %I.%I from anon, authenticated')
  })

  it('keeps policyless RLS tables explicitly deny-by-default', () => {
    expect(migration).toContain('deny_application_roles_until_reviewed')
    expect(migration).toContain('using (false) with check (false)')
  })

  it('makes SECURITY DEFINER service-only with an explicit authenticated allowlist', () => {
    expect(migration).toContain('where p.prosecdef')
    expect(migration).toContain('grant execute on %s %s to service_role')
    expect(migration).toContain("'api.get_command_centre_stats()'")
    expect(migration).toContain("'public.hv_is_platform_staff()'")
  })

  it('contains foreign tables and non-relocatable pg_net access', () => {
    expect(migration).toContain('information_schema.foreign_tables')
    expect(migration).toContain('revoke usage on schema net from anon, authenticated')
  })

  it('locks leaked-password protection to the production project and one config field', () => {
    expect(authControl).toContain("const PROJECT_REF = 'zvxdgdkukjrrwamdpqrg'")
    expect(authControl).toContain('JSON.stringify({ password_hibp_enabled: true })')
    expect(authControl).not.toContain('SUPABASE_SERVICE_ROLE_KEY')
  })
})
