-- HarbourView Phase 1 Source Import Verification
-- Target project ref: zvxdgdkukjrrwamdpqrg
-- Read-only verification only.

select
  now() as verified_at,
  current_database() as database_name,
  current_user as database_role;

select
  count(*)::integer as final_source_registry_count
from public.source_registry;

select
  count(*)::integer as import_batch_count,
  coalesce(sum(records_received), 0)::integer as total_records_received,
  coalesce(sum(records_inserted), 0)::integer as total_records_inserted,
  coalesce(sum(records_updated), 0)::integer as total_records_updated,
  coalesce(sum(records_rejected), 0)::integer as total_records_rejected,
  count(*) filter (where status = 'completed')::integer as completed_batches,
  count(*) filter (where status = 'failed')::integer as failed_batches,
  count(*) filter (where status <> 'completed')::integer as incomplete_batches
from public.source_import_batches;

select
  batch_id,
  source_version,
  source_count_expected,
  records_received,
  records_inserted,
  records_updated,
  records_rejected,
  status,
  error_summary,
  started_at,
  completed_at
from public.source_import_batches
order by batch_id;

with normalized as (
  select
    id,
    source_url,
    public.hv_normalize_source_url(source_url) as normalized_url
  from public.source_registry
  where source_url is not null
)
select
  normalized_url,
  count(*)::integer as duplicate_count
from normalized
where normalized_url is not null
group by normalized_url
having count(*) > 1
order by duplicate_count desc, normalized_url
limit 100;

select
  coalesce(country, '__NULL__') as country,
  count(*)::integer as count
from public.source_registry
group by coalesce(country, '__NULL__')
order by count desc, country;

select
  coalesce(adapter, '__NULL__') as adapter,
  count(*)::integer as count
from public.source_registry
group by coalesce(adapter, '__NULL__')
order by count desc, adapter;

select
  coalesce(source_type, '__NULL__') as source_type,
  count(*)::integer as count
from public.source_registry
group by coalesce(source_type, '__NULL__')
order by count desc, source_type;

select
  coalesce(tier::text, '__NULL__') as tier,
  count(*)::integer as count
from public.source_registry
group by coalesce(tier::text, '__NULL__')
order by tier;

select
  count(*) filter (where source_name is null or btrim(source_name) = '')::integer as missing_source_name,
  count(*) filter (where source_url is null or btrim(source_url) = '')::integer as missing_source_url,
  count(*) filter (where source_url is not null and source_url !~* '^https?://')::integer as non_http_url,
  count(*) filter (where country is null or btrim(country) = '')::integer as missing_country,
  count(*) filter (where adapter is null or btrim(adapter) = '')::integer as missing_adapter,
  count(*) filter (where fetch_method is null or btrim(fetch_method) = '')::integer as missing_fetch_method,
  count(*) filter (where crawl_cadence is null or btrim(crawl_cadence) = '')::integer as missing_crawl_cadence,
  count(*) filter (where public.hv_normalize_source_url(source_url) is null)::integer as missing_normalized_url
from public.source_registry;

select
  rejection_reason,
  count(*)::integer as count
from public.source_import_rejections
group by rejection_reason
order by count desc, rejection_reason;

select
  batch_id,
  row_index,
  normalized_url,
  rejection_reason,
  raw_record
from public.source_import_rejections
order by batch_id, row_index
limit 100;
