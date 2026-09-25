-- Idempotent freshness promotion. Uses the current unique verified-evidence
-- key as an upsert target so newer snapshots replace stale current evidence.
create or replace function public.refresh_depth_freshness_v2(p_limit integer default 500)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public
as $$
declare v_seen int; v_upserted int:=0;
begin
  with latest as (
    select sr.iso jurisdiction_key,sr.id source_registry_id,ss.id source_snapshot_id,
           ss.captured_at,ss.raw_html_hash,sr.source_url,
           row_number() over(partition by sr.iso order by ss.captured_at desc) rn
    from public.source_registry sr join public.source_snapshots ss on ss.source_id=sr.id
    where sr.iso is not null and sr.iso<>'' and ss.fetch_status='success'
      and length(coalesce(ss.raw_html_hash,''))=64 and ss.captured_at is not null
      and exists(select 1 from public.countries c where c.iso_alpha2=sr.iso)
  ), chosen as (select * from latest where rn=1 limit greatest(1,least(coalesce(p_limit,500),1000)))
  select count(*) into v_seen from chosen;
  with latest as (
    select sr.iso jurisdiction_key,sr.id source_registry_id,ss.id source_snapshot_id,
           ss.captured_at,ss.raw_html_hash,sr.source_url,
           row_number() over(partition by sr.iso order by ss.captured_at desc) rn
    from public.source_registry sr join public.source_snapshots ss on ss.source_id=sr.id
    where sr.iso is not null and sr.iso<>'' and ss.fetch_status='success'
      and length(coalesce(ss.raw_html_hash,''))=64 and ss.captured_at is not null
      and exists(select 1 from public.countries c where c.iso_alpha2=sr.iso)
  ), chosen as (select * from latest where rn=1 limit greatest(1,least(coalesce(p_limit,500),1000)))
  insert into public.jurisdiction_data_depth_evidence(
    jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,
    evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,
    effective_from,verification_status,verified_at)
  select jurisdiction_key,'freshness','v1','structural_fact','applicable',
    jsonb_build_object('engine','derived-freshness-v2','captured_at',captured_at,
      'sha256',raw_html_hash,'source_url',source_url,
      'freshness_age_days',floor(extract(epoch from(now()-captured_at))/86400)),
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

-- Continuously advances captured source material through the existing
-- dimension-specific extraction/adjudication/state pipeline.
create or replace function public.run_progressive_depth_cycle_v1()
returns jsonb language plpgsql security definer set search_path=pg_catalog,public
as $$
declare v_lock boolean; v jsonb:='{}'::jsonb; x jsonb;
begin
  v_lock:=pg_try_advisory_lock(hashtextextended('harbourview:progressive-depth-cycle:v1',0));
  if not v_lock then return jsonb_build_object('status','skipped','reason','cycle_already_running'); end if;
  begin
    begin select public.extract_depth_candidates(300) into x; v:=v||jsonb_build_object('extraction',x); exception when others then v:=v||jsonb_build_object('extraction',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.adjudicate_structured_depth(300) into x; v:=v||jsonb_build_object('structured_v2',x); exception when others then v:=v||jsonb_build_object('structured_v2',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.adjudicate_structured_pathway_regulator_v4(500) into x; v:=v||jsonb_build_object('pathway_regulator',x); exception when others then v:=v||jsonb_build_object('pathway_regulator',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.adjudicate_structured_commercial_rules_v5(500) into x; v:=v||jsonb_build_object('commercial_rules',x); exception when others then v:=v||jsonb_build_object('commercial_rules',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.adjudicate_structured_evidence_v6(500) into x; v:=v||jsonb_build_object('structured_evidence',x); exception when others then v:=v||jsonb_build_object('structured_evidence',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.adjudicate_structured_access_rules_v1(500) into x; v:=v||jsonb_build_object('access_rules',x); exception when others then v:=v||jsonb_build_object('access_rules',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.adjudicate_structured_status_format_v1(500) into x; v:=v||jsonb_build_object('status_format',x); exception when others then v:=v||jsonb_build_object('status_format',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.refresh_depth_freshness_v2(291) into x; v:=v||jsonb_build_object('freshness',x); exception when others then v:=v||jsonb_build_object('freshness',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.refresh_depth_research_queue(10000) into x; v:=v||jsonb_build_object('research_queue',x); exception when others then v:=v||jsonb_build_object('research_queue',jsonb_build_object('status','error','message',sqlerrm)); end;
    v:=v||jsonb_build_object('status','completed','completed_at',now());
  exception when others then v:=v||jsonb_build_object('status','error','message',sqlerrm); end;
  perform pg_advisory_unlock(hashtextextended('harbourview:progressive-depth-cycle:v1',0));
  return v;
end $$;

revoke all on function public.run_progressive_depth_cycle_v1() from public,anon,authenticated;
grant execute on function public.run_progressive_depth_cycle_v1() to service_role;

do $$
begin
  if exists(select 1 from cron.job where jobname='harbourview-progressive-depth-cycle') then perform cron.unschedule('harbourview-progressive-depth-cycle'); end if;
  perform cron.schedule('harbourview-progressive-depth-cycle','*/2 * * * *','select public.run_progressive_depth_cycle_v1();');
end $$;
-- Registry impact remains within the existing Harbourview Platform / Marketplace Supabase control boundary.
