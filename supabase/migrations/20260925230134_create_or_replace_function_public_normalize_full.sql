-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260925230134
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create or replace function public.normalize_full_depth_contract_version()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $function$
begin
  if new.contract_version = 'v2' then
    new.contract_version := '2026-09-23.v2';
  end if;
  return new;
end
$function$;

drop trigger if exists aaa_normalize_full_depth_contract_version_trg on public.jurisdiction_data_depth_evidence;

create trigger aaa_normalize_full_depth_contract_version_trg
before insert or update on public.jurisdiction_data_depth_evidence
for each row execute function public.normalize_full_depth_contract_version();

update public.jurisdiction_data_depth_evidence e
set contract_version='2026-09-23.v2', updated_at=now()
where e.contract_version='v2'
  and e.verification_status='verified'
  and not exists (
    select 1 from public.jurisdiction_data_depth_evidence e2
    where e2.jurisdiction_key=e.jurisdiction_key
      and e2.dimension_key=e.dimension_key
      and e2.contract_version='2026-09-23.v2'
      and e2.verification_status='verified'
  );
