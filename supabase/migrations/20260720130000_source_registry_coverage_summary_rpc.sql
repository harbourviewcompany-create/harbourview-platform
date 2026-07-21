-- Applied directly to production via Supabase MCP apply_migration on 2026-07-20.
-- This file reconciles the migration ledger (supabase_migrations.schema_migrations)
-- with the change already live in production.
--
-- Context: PR #1081 adds a "Registry Coverage" stat to the Evidence & Sources
-- page, backed by public.source_registry. That table's only RLS SELECT policy
-- (admin_operator_select) requires internal user_roles admin/operator staff --
-- it does not admit paying customers (user_profiles.tier). The api.source_registry
-- view is an unfiltered `select *` over the base table (source_url, adapter,
-- crawl_cadence, notes, last_error_log, locked_by, network_status, etc. --
-- internal crawler operational data). Broadening source_registry's RLS to admit
-- logged-in dashboard users would have handed every one of those columns to any
-- authenticated caller through that view, in violation of this repo's own
-- "no raw Supabase row without DTO projection" rule.
--
-- This RPC returns only the three aggregate fields the stat card actually needs
-- (no raw rows, no URLs/adapter/notes) and is granted to `authenticated` only --
-- the dashboard this feeds already requires login. source_registry's own RLS is
-- left untouched; crawler internals stay internal.
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
