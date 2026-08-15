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
-- version 20260721041427.
--
-- Rewriting this file cannot affect production: 20260721041427 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create or replace function api.get_source_registry_coverage(p_iso2 text)
returns table (total_active int, tier1_count int, languages text[])
language plpgsql stable security definer set search_path to ''
as $function$
begin
  if p_iso2 is null then return; end if;
  return query
  select count(*)::int, count(*) filter (where r.tier = 1)::int,
         array_agg(distinct r.language) filter (where r.language is not null)
  from public.source_registry r
  where r.iso = upper(p_iso2) and r.is_active = true;
end;
$function$;

comment on function api.get_source_registry_coverage(text) is
  'Aggregate-only source_registry coverage summary (total active, tier-1 count, distinct languages) for a country. Returns no raw rows/URLs/adapter internals -- safe for logged-in dashboard users regardless of internal user_roles membership.';

revoke all on function api.get_source_registry_coverage(text) from public;
grant execute on function api.get_source_registry_coverage(text) to authenticated;
