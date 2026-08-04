import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync('supabase/migrations/20260804190000_production_security_hardening.sql', 'utf8')
const authControl = readFileSync('scripts/configure-supabase-auth-production.mjs', 'utf8')

describe('production Supabase security hardening', () => {
  it('uses an explicit view inventory, existence guard, and security-invoker execution', () => {
    expect(migration).toContain('public.view_exists(view_row.schema_name, view_row.relation_name)')
    expect(migration).toContain('alter view %I.%I set (security_invoker = true)')
    expect(migration).toContain('revoke all privileges on table %I.%I from public, anon, authenticated')
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
