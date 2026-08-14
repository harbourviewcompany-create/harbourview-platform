-- Harbourview release-closure security hardening — 2026-08-14.
--
-- Scope:
--   * restore caller-privilege execution for the two advisor-reported signal views;
--   * remove browser-role EXECUTE from SECURITY DEFINER routines except the
--     repository-audited authenticated allowlist;
--   * pin hv_truncate_at_word_boundary to an explicit search_path;
--   * contain pg_net because the extension is non-relocatable on this project.
--
-- This migration changes privileges/execution context only. It does not rewrite
-- application rows. Supabase leaked-password protection is a Management API
-- setting and is intentionally handled by scripts/configure-supabase-auth-production.mjs,
-- not by database DDL.

-- The intelligence feed is intentionally public-safe. security_invoker makes
-- underlying public.signals / public.ia_signals grants and RLS authoritative.
do $$
begin
  if to_regclass('public.signals_intelligence_feed') is not null then
    alter view public.signals_intelligence_feed set (security_invoker = true);
    revoke all privileges on table public.signals_intelligence_feed from public, anon, authenticated;
    grant select on table public.signals_intelligence_feed to anon, authenticated, service_role;
  end if;

  if to_regclass('public.signals_quality') is not null then
    alter view public.signals_quality set (security_invoker = true);
    revoke all privileges on table public.signals_quality from public, anon, authenticated;
    grant select on table public.signals_quality to authenticated, service_role;
  end if;
end
$$;

-- SECURITY DEFINER functions must not inherit callable browser access through
-- PUBLIC. Start closed for application roles, preserve service-role execution,
-- then restore only the repository-audited authenticated allowlist below.
do $$
declare
  routine record;
begin
  for routine in
    select
      n.nspname as schema_name,
      p.proname as routine_name,
      pg_get_function_identity_arguments(p.oid) as identity_arguments
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.prosecdef
      and n.nspname in ('public', 'api', 'signals', 'regulatory_signals')
  loop
    execute format(
      'revoke execute on function %I.%I(%s) from public, anon, authenticated',
      routine.schema_name,
      routine.routine_name,
      routine.identity_arguments
    );
    execute format(
      'grant execute on function %I.%I(%s) to service_role',
      routine.schema_name,
      routine.routine_name,
      routine.identity_arguments
    );
  end loop;
end
$$;

-- Exact authenticated SECURITY DEFINER allowlist already enforced by
-- supabase/tests/production_security_hardening.sql. Missing optional routines
-- are skipped so replay remains safe across environments.
do $$
declare
  signature text;
  authenticated_allowlist constant text[] := array[
    'api.get_command_centre_stats()',
    'api.get_corridor_stats(text)',
    'api.get_source_registry_coverage(text)',
    'api.regulatory_pending_changes_feed()',
    'api.submit_signal_relevance_feedback(text,text,text,text)',
    'api.is_verified_clinician(uuid)',
    'api.clinical_has_active_consent(uuid,text)',
    'api.clinical_request_verification(text,text,text,uuid)',
    'public.hv_is_org_member(uuid)',
    'public.hv_is_platform_staff()',
    'public.is_genetics_admin_or_reviewer()',
    'public.is_hv_staff()',
    'public.current_user_tier()',
    'public.is_regulatory_tier_admin()'
  ];
begin
  foreach signature in array authenticated_allowlist
  loop
    if to_regprocedure(signature) is not null then
      execute format('grant execute on function %s to authenticated', signature);
    end if;
  end loop;
end
$$;

-- Advisor finding: mutable search_path. The function needs only built-ins and
-- public objects, so keep pg_catalog first and public explicit.
alter function public.hv_truncate_at_word_boundary(text, integer)
  set search_path = pg_catalog, public;

-- pg_net is installed in public at the extension level and reports
-- extrelocatable=false on production. Relocation is therefore not a safe DDL
-- option. Contain its callable `net` routines instead: browser roles do not
-- receive direct asynchronous network primitives; database-owner/service-role
-- routines can still invoke them through their own execution context.
do $$
declare
  routine record;
begin
  if exists (select 1 from pg_extension where extname = 'pg_net') then
    if exists (select 1 from pg_namespace where nspname = 'net') then
      revoke usage on schema net from public, anon, authenticated;
      grant usage on schema net to service_role;
    end if;

    for routine in
      select
        n.nspname as schema_name,
        p.proname as routine_name,
        pg_get_function_identity_arguments(p.oid) as identity_arguments
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      join pg_depend d on d.objid = p.oid and d.deptype = 'e'
      join pg_extension e on e.oid = d.refobjid
      where e.extname = 'pg_net'
    loop
      execute format(
        'revoke execute on function %I.%I(%s) from public, anon, authenticated',
        routine.schema_name,
        routine.routine_name,
        routine.identity_arguments
      );
      execute format(
        'grant execute on function %I.%I(%s) to service_role',
        routine.schema_name,
        routine.routine_name,
        routine.identity_arguments
      );
    end loop;
  end if;
end
$$;
