-- Applied directly to production via Supabase MCP apply_migration on 2026-07-21.
-- This file reconciles the migration ledger with the change already live in production.
--
-- Found via a proactive get_advisors security scan: five SECURITY DEFINER functions
-- in api that mutate public.signals had no internal authorization check -- only
-- PostgREST grants gated them, and all five were granted to anon/authenticated.
-- Same vulnerability class as the api.set_regulatory_tier / api.accept_classifier_tier
-- gap fixed earlier (see 20260711170000_fix_regulatory_tier_rpc_missing_authz.sql):
-- the app-level admin gate (lib/signals-engine/admin.ts is only ever called from an
-- internal admin page) was never enforced at the database layer, so anyone with the
-- public anon key could call these RPCs directly via /rest/v1/rpc/... and:
--   - approve_engine_signal / reject_engine_signal: mark any signal reviewed/approved
--     or rejected, with a fully spoofable reviewed_by
--   - bulk_approve_engine_queue: called with zero arguments, mass-approves the entire
--     SOURCE_ENGINE review queue platform-wide
--   - apply_editorial_title: rewrite any signal's public-facing headline/title/blurb
--   - save_signal_analysis: inject arbitrary JSON into the "analysis" shown to
--     dashboard users as commercial intelligence guidance
--
-- Checked public.signals.reviewed_by / analysis_backend for anomalous values before
-- fixing -- all values are legitimate internal pipeline identifiers (auto:v1,
-- automated-truncation-pattern-cleanup, openai). No evidence of prior exploitation.
--
-- Fix: added public.is_genetics_admin_or_reviewer() (existing helper, checks
-- user_roles.role in ('admin','operator','analyst')) as the first statement in all
-- five functions -- broader than admin-only since these are ordinary day-to-day
-- signal-review actions, not admin-restricted ones.
--
-- api.apply_editorial_title also has a legitimate service-role caller
-- (supabase/functions/hv-classify/index.ts calls it with SUPABASE_SERVICE_ROLE_KEY as
-- part of the automated titling pipeline). Service-role JWTs have no user_roles row,
-- so a bare is_genetics_admin_or_reviewer() check would have broken that pipeline.
-- Gated on `(select auth.role()) is distinct from 'service_role' and not
-- is_genetics_admin_or_reviewer()` instead, admitting both callers. Confirmed via
-- grep that none of the other four functions have any service-role caller anywhere
-- in the repo, so they get the plain admin/operator/analyst-only check.

create or replace function api.approve_engine_signal(p_id text, p_user_id text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  UPDATE public.signals SET reviewed = true, action = 'approved', reviewed_by = p_user_id, reviewed_at = now() WHERE id = p_id;
  RETURN FOUND;
END;
$function$;

create or replace function api.reject_engine_signal(p_id text, p_user_id text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  UPDATE public.signals SET reviewed = false, action = 'rejected', reviewed_by = p_user_id, reviewed_at = now() WHERE id = p_id;
  RETURN FOUND;
END;
$function$;

create or replace function api.bulk_approve_engine_queue(p_country text default null, p_min_score integer default 0, p_user_id text default null)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE v_count INT;
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  UPDATE public.signals s SET reviewed = true, action = 'approved', reviewed_by = p_user_id, reviewed_at = now()
  WHERE s.cat = 'SOURCE_ENGINE' AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.score >= p_min_score
    AND (p_country IS NULL OR s.country = p_country);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

create or replace function api.apply_editorial_title(p_signal_id text, p_title text, p_blurb text)
returns integer
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare n int;
begin
  if (select auth.role()) is distinct from 'service_role' and not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role or service_role required' using errcode = '42501';
  end if;
  update public.signals
    set editorial_title=p_title, editorial_blurb=p_blurb, headline=p_title,
        summary=coalesce(nullif(p_blurb,''), summary)
  where id=p_signal_id;
  get diagnostics n = row_count;
  return n;
end$function$;

create or replace function api.save_signal_analysis(p_signal_id text, p_analysis jsonb, p_backend text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  UPDATE public.signals
  SET analysis = p_analysis,
      analysis_generated_at = now(),
      analysis_backend = p_backend
  WHERE id = p_signal_id;
  RETURN FOUND;
END;
$function$;
