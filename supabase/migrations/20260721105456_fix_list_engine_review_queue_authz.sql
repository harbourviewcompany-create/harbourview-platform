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
-- version 20260721105456.
--
-- Rewriting this file cannot affect production: 20260721105456 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

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
