-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260925170448
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create or replace function public.refresh_depth_freshness_v2(p_limit integer default 500)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_seen int; v_upserted int:=0;
begin
  if coalesce(current_setting('request.jwt.claim.role',true),'') not in ('service_role','') and session_user not in ('postgres','supabase_admin') then raise exception 'service role required'; end if;
  with latest as (
    select sr.iso jurisdiction_key,sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_at,ss.raw_html_hash,sr.source_url,
           row_number() over(partition by sr.iso order by ss.captured_at desc) rn
    from public.source_registry sr join public.source_snapshots ss on ss.source_id=sr.id
    where sr.iso is not null and sr.iso<>'' and ss.fetch_status='success'
      and length(coalesce(ss.raw_html_hash,''))=64 and ss.captured_at is not null
      and exists(select 1 from public.countries c where c.iso_alpha2=sr.iso)
  ), chosen as (select * from latest where rn=1 limit greatest(1,least(coalesce(p_limit,500),1000)))
  select count(*) into v_seen from chosen;
  with latest as (
    select sr.iso jurisdiction_key,sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_at,ss.raw_html_hash,sr.source_url,
           row_number() over(partition by sr.iso order by ss.captured_at desc) rn
    from public.source_registry sr join public.source_snapshots ss on ss.source_id=sr.id
    where sr.iso is not null and sr.iso<>'' and ss.fetch_status='success'
      and length(coalesce(ss.raw_html_hash,''))=64 and ss.captured_at is not null
      and exists(select 1 from public.countries c where c.iso_alpha2=sr.iso)
  ), chosen as (select * from latest where rn=1 limit greatest(1,least(coalesce(p_limit,500),1000)))
  insert into public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
  select jurisdiction_key,'freshness','v1','structural_fact','applicable',
    jsonb_build_object('engine','derived-freshness-v2','captured_at',captured_at,'sha256',raw_html_hash,'source_url',source_url,'freshness_age_days',floor(extract(epoch from(now()-captured_at))/86400)),
    'Source snapshot captured at '||captured_at::text||'; SHA-256 integrity hash recorded.',
    source_registry_id,source_snapshot_id,source_url,captured_at::date,'verified',now()
  from chosen
  on conflict (jurisdiction_key,dimension_key,contract_version) where verification_status='verified'
  do update set evidence_payload=excluded.evidence_payload,evidence_quote=excluded.evidence_quote,
    source_registry_id=excluded.source_registry_id,source_snapshot_id=excluded.source_snapshot_id,
    source_url=excluded.source_url,effective_from=excluded.effective_from,verified_at=excluded.verified_at;
  get diagnostics v_upserted=row_count;
  perform public.recompute_depth_state_for_dimension('freshness');
  return jsonb_build_object('seen',v_seen,'upserted',v_upserted,'dimension','freshness');
end $$;
revoke all on function public.refresh_depth_freshness_v2(integer) from public,anon,authenticated;
grant execute on function public.refresh_depth_freshness_v2(integer) to service_role;
