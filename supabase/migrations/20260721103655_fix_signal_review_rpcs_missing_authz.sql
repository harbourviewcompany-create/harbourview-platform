-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260721103655.
--
-- Rewriting this file cannot affect production: 20260721103655 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

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
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
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
