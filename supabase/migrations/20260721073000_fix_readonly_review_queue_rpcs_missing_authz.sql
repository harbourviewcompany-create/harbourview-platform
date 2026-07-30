-- Applied directly to production via Supabase MCP apply_migration on 2026-07-21
-- (six separate apply_migration calls, one per function -- see EVIDENCE_LOG.md for why).
-- This file reconciles the migration ledger with the changes already live in production.
--
-- Follow-up to 20260721063000_fix_signal_review_rpcs_missing_authz.sql: that migration
-- fixed 5 write-mutating SECURITY DEFINER functions on public.signals with no internal
-- authorization check. The same get_advisors scan also flagged 6 read-only functions
-- with the identical gap -- lower severity (information disclosure of an internal
-- review queue, not a write/mutation), but still a real exposure: any anon/authenticated
-- caller could read the full unreviewed SOURCE_ENGINE signal queue (headline, summary,
-- source URL, verification tier, per-country breakdown) via /rest/v1/rpc/....
--
-- Callers checked via grep before fixing:
--   - list_engine_review_queue, count_engine_review_queue, list_engine_review_countries:
--     called only from lib/signals-engine/admin.ts (browser, real user session) --
--     plain is_genetics_admin_or_reviewer() check.
--   - get_signals_pending_analysis: no caller anywhere in the repo currently (part of
--     an evolving "signal analysis layer" feature alongside save_signal_analysis,
--     already fixed in the prior migration) -- given the plain check now so it's safe
--     whenever it is wired up.
--   - pool_rows_needing_classification, rows_needing_titles: called by
--     supabase/functions/hv-classify/index.ts via SUPABASE_SERVICE_ROLE_KEY, same as
--     apply_editorial_title in the prior migration. Converted from `language sql` to
--     `language plpgsql` (SQL-language functions can't use IF/RAISE) and given the same
--     `auth.role() = 'service_role' OR is_genetics_admin_or_reviewer()` carve-out.
--
-- Validation: live-tested `select * from api.list_engine_review_countries();` with no
-- privileged session -- raised 42501 insufficient_privilege as expected. Confirmed via
-- pg_proc.prosrc inspection all 6 carry the check and only the two hv-classify callers
-- carry the service-role carve-out.

create or replace function api.list_engine_review_queue(p_country text default null, p_min_score integer default 0, p_limit integer default 50)
returns table(id text, date timestamp with time zone, cat text, headline text, summary text, source text, url text, verification text, tier text, lang text, country text, score integer, reviewed boolean, action text, reviewed_by text, reviewed_at timestamp with time zone, created_at timestamp with time zone)
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  RETURN QUERY
  SELECT s.id, s.date, s.cat, s.headline, s.summary, s.source, s.url, s.verification, s.tier, s.lang, s.country, s.score, s.reviewed, s.action, s.reviewed_by, s.reviewed_at, s.created_at
  FROM public.signals s
  WHERE s.cat = 'SOURCE_ENGINE'
    AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.score >= p_min_score
    AND (p_country IS NULL OR s.country = p_country)
  ORDER BY s.score DESC NULLS LAST, s.date DESC NULLS LAST
  LIMIT p_limit;
END;
$function$;

create or replace function api.count_engine_review_queue(p_country text default null, p_min_score integer default 0)
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
  SELECT count(*) INTO v_count
  FROM public.signals s
  WHERE s.cat = 'SOURCE_ENGINE'
    AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.score >= p_min_score
    AND (p_country IS NULL OR s.country = p_country);
  RETURN v_count;
END;
$function$;

create or replace function api.list_engine_review_countries()
returns table(country text)
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  RETURN QUERY
  SELECT DISTINCT s.country FROM public.signals s
  WHERE s.cat = 'SOURCE_ENGINE' AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.country IS NOT NULL
  ORDER BY s.country ASC;
END;
$function$;

create or replace function api.get_signals_pending_analysis(p_limit integer default 20, p_signal_id text default null)
returns table(id text, date timestamp with time zone, cat text, headline text, summary text, source text, country text, score integer, verification text)
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  RETURN QUERY
  SELECT s.id, s.date, s.cat, s.headline, s.summary, s.source, s.country, s.score, s.verification
  FROM public.signals s
  WHERE s.reviewed = true
    AND s.analysis IS NULL
    AND s.headline IS NOT NULL
    AND (p_signal_id IS NULL OR s.id = p_signal_id)
  ORDER BY s.date DESC NULLS LAST
  LIMIT p_limit;
END;
$function$;

create or replace function api.pool_rows_needing_classification(p_limit integer default 50)
returns table(signal_id text, headline text, summary text)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  if (select auth.role()) is distinct from 'service_role' and not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role or service_role required' using errcode = '42501';
  end if;
  return query
  select s.id, s.headline, s.summary
  from public.signals s
  where s.reviewed=false and s.cat='SOURCE_ENGINE'
    and not exists (select 1 from public.signal_classifications c where c.signal_id=s.id)
    and public.signal_bucket(s.url) in ('gov','press')
    and s.url !~* 'google\.|/search\?'
    and s.date >= now() - interval '30 days'
  order by (case when public.signal_bucket(s.url)='gov' then 0 else 1 end), s.date desc nulls last
  limit p_limit;
end;
$function$;

create or replace function api.rows_needing_titles(p_limit integer default 25)
returns table(signal_id text, headline text, summary text)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  if (select auth.role()) is distinct from 'service_role' and not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role or service_role required' using errcode = '42501';
  end if;
  return query
  select s.id, s.headline, s.summary
  from public.signals s
  join public.signal_classifications c on c.signal_id = s.id and c.quality_label='signal'
  where s.editorial_title is null and not public.is_junk_headline(s.headline)
  order by s.created_at desc limit p_limit;
end;
$function$;
