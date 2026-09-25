-- Dimension-specific evidence adjudication contract and derived research queue.
-- Production equivalent was validated against project zvxdgdkukjrrwamdpqrg before commit.
create table if not exists public.jurisdiction_data_depth_dimension_gate_contract (
  dimension_key text primary key,
  contract_version text not null,
  evidence_kind text not null,
  requires_source_registry boolean not null default true,
  requires_source_snapshot boolean not null default true,
  requires_quote boolean not null default true,
  requires_effective_date boolean not null default true,
  semantic_rule text not null,
  authoritative_source_required boolean not null default true,
  parent_inheritance_allowed boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.jurisdiction_data_depth_dimension_gate_contract
(dimension_key,contract_version,evidence_kind,requires_source_registry,requires_source_snapshot,requires_quote,requires_effective_date,semantic_rule,authoritative_source_required,parent_inheritance_allowed)
values
('access_rules','v1','authority_rule',true,true,true,true,'access/possession/eligibility/age/conditions semantics',true,false),
('change_history','v1','authority_statement',true,true,true,true,'documented regulatory change with source evidence',true,false),
('freshness','v1','structural_fact',true,true,false,false,'captured snapshot age and SHA-256 integrity',true,false),
('uncertainty','v1','verified_research',true,true,true,false,'explicit conflict/blocked adjudication with evidence lineage',true,false),
('research_queue','v1','verified_research',false,false,false,false,'derived unresolved work queue; stored separately from authoritative evidence',false,false)
on conflict (dimension_key) do update set
 contract_version=excluded.contract_version,
 evidence_kind=excluded.evidence_kind,
 requires_source_registry=excluded.requires_source_registry,
 requires_source_snapshot=excluded.requires_source_snapshot,
 requires_quote=excluded.requires_quote,
 requires_effective_date=excluded.requires_effective_date,
 semantic_rule=excluded.semantic_rule,
 authoritative_source_required=excluded.authoritative_source_required,
 parent_inheritance_allowed=excluded.parent_inheritance_allowed,
 updated_at=now();

alter table public.jurisdiction_data_depth_dimension_gate_contract enable row level security;
revoke all on public.jurisdiction_data_depth_dimension_gate_contract from public;
grant select on public.jurisdiction_data_depth_dimension_gate_contract to service_role;

create table if not exists public.jurisdiction_data_depth_research_queue (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null,
  dimension_key text not null,
  status text not null,
  blocker_reason text,
  evidence_count integer not null default 0,
  priority integer not null default 50,
  source_snapshot_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(jurisdiction_key,dimension_key)
);
alter table public.jurisdiction_data_depth_research_queue enable row level security;
revoke all on public.jurisdiction_data_depth_research_queue from public;
grant select on public.jurisdiction_data_depth_research_queue to service_role;

create or replace function public.refresh_depth_research_queue(p_limit integer default 10000)
returns integer language plpgsql security definer set search_path=public as $$
declare n integer;
begin
  insert into jurisdiction_data_depth_research_queue
    (jurisdiction_key,dimension_key,status,blocker_reason,evidence_count,priority,source_snapshot_id)
  select s.jurisdiction_key,s.dimension_key,s.status,s.blocker_reason,s.evidence_count,
         case when s.status='blocked' then 10 else 50 end,
         (select e.source_snapshot_id from jurisdiction_data_depth_evidence e
          where e.jurisdiction_key=s.jurisdiction_key and e.source_snapshot_id is not null
          order by e.verified_at desc limit 1)
  from jurisdiction_data_depth_dimension_state s
  where s.status in ('unmeasured','blocked') and s.dimension_key<>'research_queue'
  limit p_limit
  on conflict(jurisdiction_key,dimension_key) do update set
    status=excluded.status, blocker_reason=excluded.blocker_reason,
    evidence_count=excluded.evidence_count, priority=excluded.priority,
    source_snapshot_id=coalesce(excluded.source_snapshot_id,jurisdiction_data_depth_research_queue.source_snapshot_id),
    updated_at=now();
  get diagnostics n=row_count;
  return n;
end $$;
revoke all on function public.refresh_depth_research_queue(integer) from public;
grant execute on function public.refresh_depth_research_queue(integer) to service_role;

create or replace function public.recompute_depth_state_for_dimension(p_dimension text)
returns integer language plpgsql security definer set search_path=public as $$
declare n integer;
begin
  update jurisdiction_data_depth_dimension_state s
  set evidence_count=coalesce(e.cnt,0),
      primary_source_count=coalesce(e.primary_cnt,0),
      latest_verified_at=e.latest_verified,
      confidence=e.confidence,
      evidence_basis=e.basis,
      status=case
        when e.cnt > 0 then 'complete'
        when s.status='blocked' then 'blocked'
        else 'unmeasured'
      end,
      last_evaluated_at=now(), updated_at=now()
  from (
    select s0.jurisdiction_key,
           count(e.id) cnt,
           count(distinct e.source_registry_id) filter(where e.source_registry_id is not null) primary_cnt,
           max(e.verified_at) latest_verified,
           case when bool_or((e.evidence_payload->>'confidence')='high') then 'high'
                when bool_or((e.evidence_payload->>'confidence')='medium') then 'medium'
                when bool_or((e.evidence_payload->>'confidence')='low') then 'low' else null end confidence,
           string_agg(distinct e.evidence_kind,', ' order by e.evidence_kind) basis
    from jurisdiction_data_depth_dimension_state s0
    left join jurisdiction_data_depth_evidence e
      on e.jurisdiction_key=s0.jurisdiction_key
     and e.dimension_key=s0.dimension_key
     and e.verification_status='verified'
    left join jurisdiction_data_depth_dimension_gate_contract g
      on g.dimension_key=s0.dimension_key
    where s0.dimension_key=p_dimension
      and (
        e.id is null
        or (
          (not coalesce(g.requires_source_registry,true) or e.source_registry_id is not null)
          and (not coalesce(g.requires_source_snapshot,true) or e.source_snapshot_id is not null)
          and (not coalesce(g.requires_quote,true) or nullif(btrim(e.evidence_quote),'') is not null)
          and (not coalesce(g.requires_effective_date,true) or e.effective_from is not null)
          and (not coalesce(g.parent_inheritance_allowed,false) or coalesce(e.evidence_payload->>'inherited_from','')='')
        )
      )
    group by s0.jurisdiction_key
  ) e
  where s.dimension_key=p_dimension and s.jurisdiction_key=e.jurisdiction_key;
  get diagnostics n=row_count;
  return n;
end $$;
revoke all on function public.recompute_depth_state_for_dimension(text) from public;
grant execute on function public.recompute_depth_state_for_dimension(text) to service_role;

create or replace function public.adjudicate_depth_source_metadata(p_limit integer default 1000)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_fresh integer:=0; v_change integer:=0;
begin
  with c as (
    select sr.iso jurisdiction_key,sr.id source_registry_id,ss.id source_snapshot_id,
           ss.captured_at,ss.raw_html_hash,sr.source_url,
           row_number() over(partition by sr.iso order by ss.captured_at desc) rn
    from source_registry sr join source_snapshots ss on ss.source_id=sr.id
    where sr.iso is not null and sr.iso<>'' and ss.fetch_status='success'
      and length(coalesce(ss.raw_html_hash,''))=64 and ss.captured_at is not null
      and exists(select 1 from countries x where x.iso_alpha2=sr.iso)
  )
  insert into jurisdiction_data_depth_evidence
    (jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,
     evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
  select c.jurisdiction_key,'freshness','v1','structural_fact','applicable',
    jsonb_build_object('engine','derived-freshness-v1','captured_at',c.captured_at,
      'sha256',c.raw_html_hash,'source_url',c.source_url,
      'freshness_age_days',floor(extract(epoch from(now()-c.captured_at))/86400)),
    'Source snapshot captured at '||c.captured_at::text||'; SHA-256 integrity hash recorded.',
    c.source_registry_id,c.source_snapshot_id,c.source_url,c.captured_at::date,'verified',now()
  from c where c.rn=1 and not exists(
    select 1 from jurisdiction_data_depth_evidence e
    where e.jurisdiction_key=c.jurisdiction_key and e.dimension_key='freshness'
      and e.source_snapshot_id=c.source_snapshot_id
  );
  get diagnostics v_fresh=row_count;

  with c as (
    select rpc.*,sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_text,sr.iso
    from regulatory_pending_changes rpc
    join source_registry sr on sr.source_url=rpc.source_url
    join lateral(
      select ss.* from source_snapshots ss
      where ss.source_id=sr.id and ss.fetch_status='success'
        and length(coalesce(ss.raw_html_hash,''))=64
        and rpc.expected_note is not null
        and ss.captured_text ilike '%'||left(rpc.expected_note,120)||'%'
      order by ss.captured_at desc limit 1
    ) ss on true
    where rpc.source_url is not null and rpc.expected_effective_date is not null
  )
  insert into jurisdiction_data_depth_evidence
    (jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,
     evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
  select c.iso,'change_history','v1','authority_statement','applicable',
    jsonb_build_object('engine','derived-change-history-v1','change_type',c.change_type,
      'current_value',c.current_value,'expected_value',c.expected_value,
      'expected_effective_date',c.expected_effective_date,'status',c.status),
    public.extract_structured_source_quote(c.captured_text,left(c.expected_note,120)),
    c.source_registry_id,c.source_snapshot_id,c.source_url,c.expected_effective_date,'verified',now()
  from c where c.iso is not null and exists(select 1 from countries x where x.iso_alpha2=c.iso)
    and not exists(
      select 1 from jurisdiction_data_depth_evidence e
      where e.jurisdiction_key=c.iso and e.dimension_key='change_history'
        and e.source_snapshot_id=c.source_snapshot_id
        and e.evidence_payload->>'change_type'=c.change_type
    );
  get diagnostics v_change=row_count;

  perform public.recompute_depth_state_for_dimension('freshness');
  perform public.recompute_depth_state_for_dimension('change_history');
  return jsonb_build_object('freshness_promoted',v_fresh,'change_history_promoted',v_change);
end $$;
revoke all on function public.adjudicate_depth_source_metadata(integer) from public;
grant execute on function public.adjudicate_depth_source_metadata(integer) to service_role;

create or replace function public.adjudicate_structured_access_rules_v1(p_limit integer default 500)
returns integer language plpgsql security definer set search_path=public as $$
declare n integer;
begin
  with p as (
    select rp.*,u.url from regulatory_pathways rp
    cross join lateral unnest(rp.source_urls) u(url)
    where rp.verification='verified' and rp.effective_date is not null
      and (rp.qualifying_conditions is not null or rp.prescriber_scope is not null
        or rp.min_age is not null or rp.reimbursement is not null
        or rp.summary is not null or rp.prescription_notes is not null)
    limit p_limit
  ), b as (
    select p.*,sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_text
    from p join source_registry sr on sr.source_url=p.url and sr.is_active=true
    join lateral(
      select ss.* from source_snapshots ss where ss.source_id=sr.id
        and ss.fetch_status='success' and length(coalesce(ss.raw_html_hash,''))=64
      order by ss.captured_at desc limit 1
    ) ss on true
    where p.iso_alpha2 is not null and exists(select 1 from countries c where c.iso_alpha2=p.iso_alpha2)
  ), q as (
    select b.*,public.extract_structured_source_quote(b.captured_text,
      coalesce(nullif(b.prescriber_scope,''),nullif(b.name,''),nullif(b.summary,''),'access')) quote
    from b
  )
  insert into jurisdiction_data_depth_evidence
    (jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,
     source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
  select q.iso_alpha2,'access_rules','v1','authority_rule','applicable',
    jsonb_build_object('engine','structured-access-rules-v1','pathway_id',q.id,
      'pathway_name',q.name,'pathway_type',q.pathway_type::text,
      'qualifying_conditions',q.qualifying_conditions,'prescriber_scope',q.prescriber_scope,
      'min_age',q.min_age,'reimbursement',q.reimbursement,'status',q.status,
      'effective_date',q.effective_date),
    q.quote,q.source_registry_id,q.source_snapshot_id,q.url,q.effective_date,'verified',now()
  from q where q.quote is not null and q.quote<>'' and not exists(
    select 1 from jurisdiction_data_depth_evidence e
    where e.jurisdiction_key=q.iso_alpha2 and e.dimension_key='access_rules'
      and e.evidence_payload->>'pathway_id'=q.id::text
  );
  get diagnostics n=row_count;
  perform public.recompute_depth_state_for_dimension('access_rules');
  return n;
end $$;
revoke all on function public.adjudicate_structured_access_rules_v1(integer) from public;
grant execute on function public.adjudicate_structured_access_rules_v1(integer) to service_role;
