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
-- version 20260721105549.
--
-- Rewriting this file cannot affect production: 20260721105549 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

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
