-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260925131055
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create or replace function public.promote_verified_discovered_authority_sources()
returns jsonb language plpgsql security definer set search_path=public
as $$
declare inserted_primary integer:=0; inserted_bindings integer:=0;
begin
  with candidates as (
    select distinct on (sr.iso)
      sr.iso jurisdiction_iso2,'national' jurisdiction_level,
      case when sr.regulator_class='official_gazette' then 'primary_gazette'
           when sr.regulator_class='legislature' then 'primary_government_legal'
           else 'primary_regulator' end source_class,
      sr.source_name authority_name,sr.source_url authority_url,
      coalesce(ss.captured_title,sr.source_name) source_title,
      ss.raw_html_hash source_snapshot_sha256,ss.captured_at verified_at
    from public.source_registry sr
    join public.source_snapshots ss on ss.source_id=sr.id
    where sr.iso is not null
      and sr.regulator_class in ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','procurement','medicine_license_registry')
      and sr.source_url like 'https://%' and sr.notes ilike '%source-discovery-engine%'
      and ss.fetch_status='success' and ss.captured_text is not null and length(trim(ss.captured_text))>0
      and ss.raw_html_hash ~ '^[0-9a-fA-F]{64}$'
    order by sr.iso,
      case sr.regulator_class when 'health_authority' then 1 when 'drug_control_authority' then 2 when 'official_gazette' then 3 when 'legislature' then 4 when 'medicine_license_registry' then 5 when 'customs_import_export' then 6 else 7 end,
      ss.captured_at desc
  ), ins as (
    insert into public.regulatory_market_access_primary_sources
      (jurisdiction_iso2,jurisdiction_level,parent_iso2,source_class,authority_name,authority_url,source_title,source_effective_date,source_snapshot_sha256,verified_at,expires_at,notes)
    select c.jurisdiction_iso2,c.jurisdiction_level,null,c.source_class,c.authority_name,c.authority_url,c.source_title,null,lower(c.source_snapshot_sha256),c.verified_at,c.verified_at+interval '30 days',
      'Promoted after source-discovery-engine live verification plus successful first-party snapshot; publication remains fail-closed.'
    from candidates c
    where not exists(select 1 from public.regulatory_market_access_primary_sources p where p.jurisdiction_iso2=c.jurisdiction_iso2)
    returning 1
  ) select count(*) into inserted_primary from ins;
  with cb as (
    select distinct p.jurisdiction_iso2 jurisdiction_key,d.dimension_key,p.authority_url,sr.id source_registry_id,p.source_snapshot_sha256
    from public.regulatory_market_access_primary_sources p
    join public.source_registry sr on lower(regexp_replace(trim(sr.source_url), '/+$',''))=lower(regexp_replace(trim(p.authority_url), '/+$',''))
      and sr.iso=p.jurisdiction_iso2 and sr.is_active=true and sr.crawl_allowed=true
    cross join public.jurisdiction_data_depth_dimensions d
    where p.jurisdiction_level='national' and p.authority_url like 'https://%'
  ), b as (
    insert into public.jurisdiction_data_depth_authority_bindings
      (jurisdiction_key,dimension_key,contract_version,source_registry_id,authority_url,expected_snapshot_sha256,binding_status,bound_at,updated_at)
    select jurisdiction_key,dimension_key,'2026-09-23.v2',source_registry_id,authority_url,lower(source_snapshot_sha256),'bound',now(),now() from cb
    on conflict (jurisdiction_key,dimension_key,contract_version) do update set source_registry_id=excluded.source_registry_id,authority_url=excluded.authority_url,expected_snapshot_sha256=excluded.expected_snapshot_sha256,binding_status='bound',updated_at=now()
    returning 1
  ) select count(*) into inserted_bindings from b;
  update public.jurisdiction_data_depth_capture_jobs j set status='queued',last_error=null,updated_at=now()
  where j.status='blocked' and j.contract_version='2026-09-23.v2'
    and exists(select 1 from public.jurisdiction_data_depth_authority_bindings b where b.jurisdiction_key=j.jurisdiction_key and b.dimension_key=j.dimension_key and b.contract_version=j.contract_version and b.binding_status='bound');
  return jsonb_build_object('primary_sources_inserted',inserted_primary,'bindings_upserted',inserted_bindings);
end; $$;
