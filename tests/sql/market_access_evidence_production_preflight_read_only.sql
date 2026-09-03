-- Strictly read-only production preflight for the evidence-backed Market Access cutover.
-- No DDL/DML. Safe to run before applying 20260831130000 / 20260831130500.

begin read only;

select
  current_database() as database_name,
  now() as observed_at,
  count(*) as renderable_rows,
  count(*) filter (where iso_alpha2 ~ '^[A-Z]{2}$') as country_or_territory_rows,
  count(*) filter (where iso_alpha2 like 'US-%') as us_state_dc_rows,
  count(*) filter (where iso_alpha2 like 'CA-%') as canada_subnational_rows,
  count(*) filter (where iso_alpha2 like 'AU-%') as australia_subnational_rows,
  count(*) filter (where iso_alpha2 like 'DE-%') as germany_subnational_rows
from public.countries
where iso_alpha2 is not null;

select
  count(*) filter (where regulatory_tier_origin = 'override') as legacy_override_rows,
  count(*) filter (where regulatory_tier_origin = 'auto') as legacy_auto_rows,
  count(*) filter (where regulatory_tier is null) as legacy_null_tier_rows,
  count(*) filter (where regulatory_tier_needs_review) as legacy_needs_review_rows
from public.countries
where iso_alpha2 is not null;

select version, name
from supabase_migrations.schema_migrations
where version in ('20260830140000','20260830141000')
order by version;

select
  exists (
    select 1
    from pg_index i
    join pg_class t on t.oid = i.indrelid
    join pg_attribute a on a.attrelid = t.oid and a.attnum = any(i.indkey)
    where t.oid = 'public.countries'::regclass
      and i.indisunique
      and a.attname = 'iso_alpha2'
  ) as iso_alpha2_has_unique_index,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'countries' and column_name = 'updated_at'
  ) as has_updated_at,
  exists (select 1 from pg_namespace where nspname = 'api') as has_api_schema;

select iso_alpha2, country_name, regulatory_tier, regulatory_tier_origin,
       regulatory_tier_source, regulatory_tier_reviewed_at,
       regulatory_tier_last_derived_at, regulatory_tier_needs_review
from public.countries
where iso_alpha2 is not null
order by iso_alpha2;

commit;
