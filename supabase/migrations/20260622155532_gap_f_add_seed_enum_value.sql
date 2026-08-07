-- Restore the production country data-completeness enum contract.
-- Historical zero-state replays may still have a text column at this point;
-- production already has the enum and therefore follows the idempotent path.

do $data_completeness_type$
begin
  if not exists (
    select 1
    from pg_type type_record
    join pg_namespace namespace_record on namespace_record.oid = type_record.typnamespace
    where namespace_record.nspname = 'public'
      and type_record.typname = 'data_completeness'
  ) then
    create type public.data_completeness as enum ('full', 'partial', 'stub');
  end if;
end
$data_completeness_type$;

alter type public.data_completeness
  add value if not exists 'seed' after 'stub';

do $countries_data_completeness_column$
declare
  current_type text;
begin
  select pg_catalog.format_type(attribute_record.atttypid, attribute_record.atttypmod)
  into current_type
  from pg_attribute attribute_record
  where attribute_record.attrelid = 'public.countries'::regclass
    and attribute_record.attname = 'data_completeness'
    and attribute_record.attnum > 0
    and not attribute_record.attisdropped;

  if current_type is null then
    alter table public.countries
      add column data_completeness public.data_completeness not null default 'stub';
  elsif current_type <> 'data_completeness' then
    -- PostgreSQL does not permit a column type change while a view depends on
    -- that column. The canonical view is recreated below with the same contract.
    drop view if exists public.v_jurisdiction_unified;

    alter table public.countries
      alter column data_completeness drop default;

    alter table public.countries
      alter column data_completeness type public.data_completeness
      using data_completeness::text::public.data_completeness;

    alter table public.countries
      alter column data_completeness set default 'stub'::public.data_completeness,
      alter column data_completeness set not null;
  else
    alter table public.countries
      alter column data_completeness set default 'stub'::public.data_completeness,
      alter column data_completeness set not null;
  end if;
end
$countries_data_completeness_column$;

create or replace view public.v_jurisdiction_unified
with (security_invoker = true)
as
select
  xref.canonical_iso2,
  xref.canonical_name,
  xref.hv_core_jurisdiction_iso_code,
  country.country_name,
  country.market_access_status,
  country.medical_status,
  country.adult_use_status,
  country.import_status,
  country.export_status,
  country.opportunity_score,
  country.data_completeness,
  country.regulator_label,
  country.public_summary as countries_public_summary,
  jurisdiction.jurisdiction_id,
  jurisdiction.data_release_status,
  jurisdiction.identity_verification_status,
  public_profile.public_summary as profile_public_summary,
  public_profile.confidence_band_public,
  public_profile.last_regulatory_verified_at
from public.jurisdiction_crossref xref
left join public.countries country
  on country.iso_alpha2 = xref.countries_iso2
left join public.jurisdictions jurisdiction
  on jurisdiction.jurisdiction_id = xref.jurisdictions_id
left join public.country_profiles_public public_profile
  on public_profile.jurisdiction_id = jurisdiction.jurisdiction_id;

revoke all privileges on table public.v_jurisdiction_unified
  from public, anon, authenticated;
grant select on table public.v_jurisdiction_unified
  to anon, authenticated, service_role;
