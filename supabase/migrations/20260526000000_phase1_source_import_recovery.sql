begin;

create extension if not exists pgcrypto;

create or replace function public.hv_normalize_source_url(input_url text)
returns text
language sql
immutable
as $$
  select nullif(regexp_replace(lower(trim(both from coalesce(input_url, ''))), '/+$', ''), '');
$$;

create table if not exists public.source_import_batches (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null unique,
  source_version text not null,
  source_count_expected integer not null check (source_count_expected >= 0),
  records_received integer not null default 0 check (records_received >= 0),
  records_inserted integer not null default 0 check (records_inserted >= 0),
  records_updated integer not null default 0 check (records_updated >= 0),
  records_rejected integer not null default 0 check (records_rejected >= 0),
  checksum text,
  status text not null default 'received' check (status in ('received', 'processing', 'completed', 'failed')),
  error_summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.source_import_rejections (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null references public.source_import_batches(batch_id) on delete cascade,
  source_version text not null,
  row_index integer,
  raw_record jsonb not null,
  normalized_url text,
  rejection_reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists source_import_rejections_batch_id_idx on public.source_import_rejections(batch_id);
create index if not exists source_import_rejections_normalized_url_idx on public.source_import_rejections(normalized_url);

create unique index if not exists source_registry_normalized_url_unique_idx
  on public.source_registry (public.hv_normalize_source_url(source_url))
  where source_url is not null and public.hv_normalize_source_url(source_url) is not null;

create or replace function public.hv_source_import_adapter(input_type text)
returns text language sql immutable as $$
  select case
    when lower(coalesce(input_type, '')) in ('rss', 'rss feed', 'feed') then 'rss'
    when lower(coalesce(input_type, '')) in ('api', 'open api', 'json api') then 'api'
    else 'html_snapshot'
  end;
$$;

create or replace function public.hv_source_import_fetch_method(input_type text)
returns text language sql immutable as $$
  select case
    when lower(coalesce(input_type, '')) in ('rss', 'rss feed', 'feed') then 'rss'
    when lower(coalesce(input_type, '')) in ('api', 'open api', 'json api') then 'api'
    else 'html'
  end;
$$;

create or replace function public.hv_source_import_crawl_cadence(input_tier integer, input_type text)
returns text language sql immutable as $$
  select case
    when lower(coalesce(input_type, '')) in ('rss', 'rss feed', 'feed') then 'daily'
    when input_tier = 1 then 'daily'
    when input_tier = 2 then 'weekly'
    else 'monthly'
  end;
$$;

create or replace function public.hv_source_import_authority_level(input_tier integer)
returns text language sql immutable as $$
  select case when input_tier = 1 then 'primary' when input_tier = 2 then 'secondary' else 'supplementary' end;
$$;

create or replace function public.hv_source_import_region(input_country text)
returns text language sql immutable as $$
  select case
    when input_country in ('USA', 'United States', 'Canada', 'Mexico') then 'North America'
    when input_country in ('Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Uruguay', 'Paraguay', 'Ecuador', 'Bolivia') then 'Latin America'
    when input_country in ('UK', 'Germany', 'France', 'Netherlands', 'Poland', 'Czech Republic', 'Romania', 'Ukraine', 'Serbia', 'North Macedonia') then 'Europe'
    when input_country in ('Thailand', 'India', 'Japan', 'South Korea', 'Vietnam', 'Philippines', 'Indonesia', 'Malaysia', 'Singapore', 'Sri Lanka', 'Nepal') then 'Asia'
    when input_country in ('South Africa', 'Lesotho', 'Malawi', 'Zimbabwe', 'Zambia', 'Rwanda', 'Kenya', 'Uganda', 'Tanzania', 'Ghana', 'Nigeria', 'Morocco', 'Ethiopia') then 'Africa'
    when input_country in ('Australia', 'New Zealand') then 'Oceania'
    when input_country in ('Global', 'Europe', 'European Union', 'LATAM', 'Latin America', 'Africa', 'Asia', 'Pan-African', 'ASEAN') then input_country
    else null
  end;
$$;

create or replace function public.hv_source_import_signal_keywords(input_category text, input_subcategory text, input_notes text)
returns text[] language sql immutable as $$
  select array_remove(array[
    nullif(lower(trim(input_category)), ''),
    nullif(lower(trim(input_subcategory)), ''),
    case when coalesce(input_notes, '') ilike '%import%' then 'import' end,
    case when coalesce(input_notes, '') ilike '%export%' then 'export' end,
    case when coalesce(input_notes, '') ilike '%license%' or coalesce(input_notes, '') ilike '%licence%' then 'licensing' end,
    case when coalesce(input_notes, '') ilike '%clinical%' then 'clinical' end,
    case when coalesce(input_notes, '') ilike '%trial%' then 'clinical_trials' end,
    case when coalesce(input_notes, '') ilike '%hemp%' then 'hemp' end,
    case when coalesce(input_notes, '') ilike '%procurement%' or coalesce(input_notes, '') ilike '%tender%' then 'procurement' end,
    case when coalesce(input_notes, '') ilike '%court%' then 'court' end,
    case when coalesce(input_notes, '') ilike '%gazette%' then 'gazette' end,
    case when coalesce(input_notes, '') ilike '%customs%' then 'customs' end,
    case when coalesce(input_notes, '') ilike '%recall%' then 'recall' end
  ], null);
$$;

create or replace function public.import_source_registry_batch(
  p_batch_id text,
  p_source_version text,
  p_records jsonb,
  p_checksum text default null
)
returns table (batch_id text, received integer, inserted integer, updated integer, rejected integer, final_status text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_received integer := 0;
  v_inserted integer := 0;
  v_updated integer := 0;
  v_rejected integer := 0;
begin
  if p_batch_id is null or btrim(p_batch_id) = '' then raise exception 'batch_id is required'; end if;
  if p_source_version is null or btrim(p_source_version) = '' then raise exception 'source_version is required'; end if;
  if p_records is null or jsonb_typeof(p_records) <> 'array' then raise exception 'records must be a JSON array'; end if;

  v_received := jsonb_array_length(p_records);

  insert into public.source_import_batches (batch_id, source_version, source_count_expected, records_received, checksum, status, started_at)
  values (p_batch_id, p_source_version, v_received, v_received, p_checksum, 'processing', now())
  on conflict (batch_id) do update set
    source_version = excluded.source_version,
    source_count_expected = excluded.source_count_expected,
    records_received = excluded.records_received,
    checksum = excluded.checksum,
    records_inserted = 0,
    records_updated = 0,
    records_rejected = 0,
    status = 'processing',
    error_summary = null,
    started_at = now(),
    completed_at = null;

  delete from public.source_import_rejections where source_import_rejections.batch_id = p_batch_id;

  drop table if exists pg_temp.tmp_source_import_upserted;
  drop table if exists pg_temp.tmp_source_import_valid;
  drop table if exists pg_temp.tmp_source_import_records;

  create temp table tmp_source_import_records on commit drop as
  select
    row_number() over ()::integer as row_index,
    raw_record,
    nullif(btrim(raw_record->>'name'), '') as source_name,
    nullif(btrim(raw_record->>'url'), '') as source_url,
    public.hv_normalize_source_url(raw_record->>'url') as normalized_url,
    nullif(btrim(raw_record->>'category'), '') as category,
    nullif(btrim(raw_record->>'subcategory'), '') as subcategory,
    nullif(btrim(raw_record->>'type'), '') as source_type_raw,
    nullif(btrim(raw_record->>'country'), '') as country,
    nullif(btrim(raw_record->>'notes'), '') as notes,
    case when (raw_record->>'tier') ~ '^[0-9]+$' then (raw_record->>'tier')::integer else null end as tier
  from jsonb_array_elements(p_records) as raw_record;

  insert into public.source_import_rejections (batch_id, source_version, row_index, raw_record, normalized_url, rejection_reason)
  select p_batch_id, p_source_version, row_index, raw_record, normalized_url,
    concat_ws('; ',
      case when source_name is null then 'missing name' end,
      case when source_url is null then 'missing url' end,
      case when normalized_url is null then 'invalid normalized url' end,
      case when source_url is not null and source_url !~* '^https?://' then 'non-http url' end,
      case when country is null then 'missing country' end
    )
  from tmp_source_import_records
  where source_name is null or source_url is null or normalized_url is null or source_url !~* '^https?://' or country is null;

  get diagnostics v_rejected = row_count;

  create temp table tmp_source_import_valid on commit drop as
  select distinct on (normalized_url) *
  from tmp_source_import_records
  where source_name is not null and source_url is not null and normalized_url is not null and source_url ~* '^https?://' and country is not null
  order by normalized_url, tier nulls last, row_index;

  create temp table tmp_source_import_upserted (was_inserted boolean not null) on commit drop;

  with upserted as (
  insert into public.source_registry (
    source_name, source_type, source_url, jurisdiction, category_focus, fetch_method, allowed_use, terms_risk,
    review_frequency, is_active, country, subcategory, adapter, crawl_cadence, relevance_status, tier, notes,
    signal_keywords, region, authority_level, intelligence_pass, requires_translation, frequency
  )
  select
    left(source_name, 500), coalesce(source_type_raw, 'html'), source_url, country, category,
    public.hv_source_import_fetch_method(source_type_raw), 'index_reference_only', 'unknown',
    public.hv_source_import_crawl_cadence(tier, source_type_raw), true, country, subcategory,
    public.hv_source_import_adapter(source_type_raw), public.hv_source_import_crawl_cadence(tier, source_type_raw),
    'candidate', coalesce(tier, 3), notes, public.hv_source_import_signal_keywords(category, subcategory, notes),
    public.hv_source_import_region(country), public.hv_source_import_authority_level(coalesce(tier, 3)),
    1, false, public.hv_source_import_crawl_cadence(tier, source_type_raw)
  from tmp_source_import_valid
  on conflict ((public.hv_normalize_source_url(source_url))) where source_url is not null and public.hv_normalize_source_url(source_url) is not null
  do update set
    source_name = excluded.source_name,
    source_type = excluded.source_type,
    jurisdiction = excluded.jurisdiction,
    category_focus = excluded.category_focus,
    fetch_method = excluded.fetch_method,
    review_frequency = excluded.review_frequency,
    is_active = excluded.is_active,
    country = excluded.country,
    subcategory = excluded.subcategory,
    adapter = excluded.adapter,
    crawl_cadence = excluded.crawl_cadence,
    relevance_status = excluded.relevance_status,
    tier = excluded.tier,
    notes = excluded.notes,
    signal_keywords = excluded.signal_keywords,
    region = excluded.region,
    authority_level = excluded.authority_level,
    intelligence_pass = excluded.intelligence_pass,
    requires_translation = excluded.requires_translation,
    frequency = excluded.frequency,
    updated_at = now()
  returning (xmax = 0) as was_inserted
  )
  insert into tmp_source_import_upserted (was_inserted)
  select was_inserted from upserted;

  select count(*) filter (where was_inserted), count(*) filter (where not was_inserted)
  into v_inserted, v_updated
  from tmp_source_import_upserted;

  update public.source_import_batches
  set records_inserted = coalesce(v_inserted, 0), records_updated = coalesce(v_updated, 0), records_rejected = coalesce(v_rejected, 0),
      status = 'completed', completed_at = now(), error_summary = null
  where source_import_batches.batch_id = p_batch_id;

  return query select p_batch_id, v_received, coalesce(v_inserted, 0), coalesce(v_updated, 0), coalesce(v_rejected, 0), 'completed'::text;
exception when others then
  update public.source_import_batches set status = 'failed', error_summary = sqlerrm, completed_at = now()
  where source_import_batches.batch_id = p_batch_id;
  raise;
end;
$$;

revoke all on function public.import_source_registry_batch(text, text, jsonb, text) from public;
revoke all on function public.import_source_registry_batch(text, text, jsonb, text) from anon;
revoke all on function public.import_source_registry_batch(text, text, jsonb, text) from authenticated;
grant execute on function public.import_source_registry_batch(text, text, jsonb, text) to service_role;

alter table public.source_import_batches enable row level security;
alter table public.source_import_rejections enable row level security;

drop policy if exists "source_import_batches_admin_read" on public.source_import_batches;
create policy "source_import_batches_admin_read" on public.source_import_batches for select to authenticated using (
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin', 'operator'))
);

drop policy if exists "source_import_rejections_admin_read" on public.source_import_rejections;
create policy "source_import_rejections_admin_read" on public.source_import_rejections for select to authenticated using (
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin', 'operator'))
);

commit;
