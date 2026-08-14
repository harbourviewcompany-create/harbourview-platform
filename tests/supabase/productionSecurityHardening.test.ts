import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const baselineMigration = readFileSync(
  'supabase/migrations/20260804190000_production_security_hardening.sql',
  'utf8',
)
const closureMigration = readFileSync(
  'supabase/migrations/20260814124500_release_closure_security_hardening.sql',
  'utf8',
)
const assertions = readFileSync('supabase/tests/production_security_hardening.sql', 'utf8')
const authControl = readFileSync('scripts/configure-supabase-auth-production.mjs', 'utf8')

describe('production Supabase security hardening controls', () => {
  it('contains no synthetic deny policies or destructive business-data operations', () => {
    for (const migration of [baselineMigration, closureMigration]) {
      expect(migration).not.toMatch(/using\s*\(\s*false\s*\)/i)
      expect(migration).not.toMatch(/with\s+check\s*\(\s*false\s*\)/i)
      expect(migration).not.toMatch(/\b(truncate|drop\s+table|delete\s+from)\b/i)
    }
  })

  it('restores the advisor-reported signal views to caller-privilege execution', () => {
    expect(closureMigration).toContain(
      'alter view public.signals_intelligence_feed set (security_invoker = true)',
    )
    expect(closureMigration).toContain(
      'alter view public.signals_quality set (security_invoker = true)',
    )
    expect(closureMigration).toContain(
      'grant select on table public.signals_intelligence_feed to anon, authenticated, service_role',
    )
    expect(closureMigration).toContain(
      'grant select on table public.signals_quality to authenticated, service_role',
    )
  })

  it('starts SECURITY DEFINER browser execution closed and restores only the explicit policy-aware authenticated allowlist', () => {
    expect(closureMigration).toContain(
      "'revoke execute on function %I.%I(%s) from public, anon, authenticated'",
    )
    expect(closureMigration).toContain(
      "'grant execute on function %I.%I(%s) to service_role'",
    )

    for (const signature of [
      'api.get_command_centre_stats()',
      'api.get_corridor_stats(text)',
      'api.get_source_registry_coverage(text)',
      'api.regulatory_pending_changes_feed()',
      'api.submit_signal_relevance_feedback(text,text,text,text)',
      'public.hv_is_org_member(uuid)',
      'public.hv_is_platform_staff()',
      'public.is_genetics_admin_or_reviewer()',
      'public.is_harbourview_admin()',
      'public.is_hv_staff()',
      'public.current_user_tier()',
      'public.is_regulatory_tier_admin()',
    ]) {
      expect(closureMigration).toContain(`'${signature}'`)
    }

    for (const nonAllowlisted of [
      'api.get_recently_analyzed_signals(integer)',
      'api.get_signals_pending_analysis(integer,text)',
      'api.request_signal_analysis(text)',
      'api.save_signal_analysis(text,jsonb,text)',
      'public.is_service_role_or_signal_analyst()',
    ]) {
      expect(closureMigration).not.toContain(`'${nonAllowlisted}'`)
    }
  })

  it('pins the mutable helper search path and contains non-relocatable pg_net', () => {
    expect(closureMigration).toContain(
      'alter function public.hv_truncate_at_word_boundary(text, integer)',
    )
    expect(closureMigration).toContain('set search_path = pg_catalog, public')
    expect(closureMigration).toContain("where e.extname = 'pg_net'")
    expect(closureMigration).toContain('revoke usage on schema net from public, anon, authenticated')
  })

  it('keeps state validation in the zero-row SQL assertion suite', () => {
    expect(assertions).toContain('public_read_contract_missing')
    expect(assertions).toContain('internal_view_exposed')
    expect(assertions).toContain('anon_definer_execute')
    expect(assertions).toContain('authenticated_definer_execute')
  })

  it('locks the Auth leaked-password change to the production project and keeps it apply-gated', () => {
    expect(authControl).toContain("const PROJECT_REF = 'zvxdgdkukjrrwamdpqrg'")
    expect(authControl).toContain("const apply = process.argv.includes('--apply')")
    expect(authControl).toContain('password_hibp_enabled')
    expect(authControl).toContain('AbortSignal.timeout(MANAGEMENT_API_TIMEOUT_MS)')
    expect(authControl.match(/AbortSignal\.timeout\(MANAGEMENT_API_TIMEOUT_MS\)/g)).toHaveLength(2)
  })
})
