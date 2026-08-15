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
-- version 20260721105819.
--
-- Rewriting this file cannot affect production: 20260721105819 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

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
