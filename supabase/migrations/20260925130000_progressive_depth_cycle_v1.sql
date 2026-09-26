-- Progressive depth cycle: continuously advance captured source material through
-- existing extraction/adjudication/state/research-queue stages without weakening
-- dimension-specific gates. Broken legacy metadata/extended engines are intentionally
-- not invoked by this orchestrator until separately repaired.
create or replace function public.run_progressive_depth_cycle_v1()
returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  v_lock boolean;
  v jsonb:='{}'::jsonb;
  x jsonb;
begin
  v_lock:=pg_try_advisory_lock(hashtextextended('harbourview:progressive-depth-cycle:v1',0));
  if not v_lock then
    return jsonb_build_object('status','skipped','reason','cycle_already_running');
  end if;
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
  exception when others then
    v:=v||jsonb_build_object('status','error','message',sqlerrm);
  end;
  perform pg_advisory_unlock(hashtextextended('harbourview:progressive-depth-cycle:v1',0));
  return v;
end $$;

revoke all on function public.run_progressive_depth_cycle_v1() from public,anon,authenticated;
grant execute on function public.run_progressive_depth_cycle_v1() to service_role;

do $$
begin
  if exists(select 1 from cron.job where jobname='harbourview-progressive-depth-cycle') then
    perform cron.unschedule('harbourview-progressive-depth-cycle');
  end if;
  perform cron.schedule('harbourview-progressive-depth-cycle','*/2 * * * *','select public.run_progressive_depth_cycle_v1();');
end $$;