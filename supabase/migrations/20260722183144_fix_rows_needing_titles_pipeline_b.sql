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
-- version 20260722183144.
--
-- Rewriting this file cannot affect production: 20260722183144 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- api.rows_needing_titles still joined against public.signal_classifications
-- (Pipeline A's staging table, just deprecated in
-- deprecate_unused_stage3_pipeline_a.sql) to find rows needing an editorial
-- title. Pipeline B (the canonical, actually-live pipeline) writes
-- quality_label directly onto public.signals and never touches
-- signal_classifications, so this RPC could only ever reach rows classified
-- by the deprecated path. Verified live before this fix: of the 919 promoted
-- rows missing editorial_title, only 9 were reachable via the old join.
--
-- Fix: match on s.quality_label='signal' directly, dropping the dependency
-- on signal_classifications entirely. Same authorization check preserved
-- unchanged (service_role or admin/operator/analyst).
--
-- Rollback: restore the join on public.signal_classifications (see git
-- history of 20260721073000_fix_readonly_review_queue_rpcs_missing_authz.sql
-- for the prior body) -- not recommended, restores the near-total miss rate.

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
  where s.quality_label = 'signal'
    and s.editorial_title is null
    and not public.is_junk_headline(s.headline)
  order by s.created_at desc limit p_limit;
end;
$function$;
