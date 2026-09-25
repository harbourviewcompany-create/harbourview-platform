create table if not exists public.jurisdiction_data_depth_extraction_candidates (
  id uuid primary key default gen_random_uuid(),
  source_snapshot_id uuid not null references public.source_snapshots(id) on delete cascade,
  source_registry_id uuid not null references public.source_registry(id) on delete cascade,
  jurisdiction_key text not null,
  dimension_key text not null,
  candidate_kind text not null check (candidate_kind in ('structured_rule','authority_statement','structural_fact','unresolved')),
  candidate_payload jsonb not null,
  evidence_quote text not null,
  confidence text not null check (confidence in ('high','medium','low')),
  extraction_method text not null,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','conflict','needs_review')),
  adjudication_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_snapshot_id,dimension_key,evidence_quote)
);

create table if not exists public.jurisdiction_data_depth_adjudications (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null,
  dimension_key text not null,
  decision text not null check (decision in ('accepted','blocked','unmeasured','not_applicable')),
  evidence_ids uuid[] not null default '{}',
  candidate_ids uuid[] not null default '{}',
  decision_reason text not null,
  decided_at timestamptz not null default now(),
  unique(jurisdiction_key,dimension_key)
);

create index if not exists idx_depth_extract_pending on public.jurisdiction_data_depth_extraction_candidates(status,created_at);
create index if not exists idx_depth_extract_snapshot on public.jurisdiction_data_depth_extraction_candidates(source_snapshot_id);
create index if not exists idx_depth_adjudication_cell on public.jurisdiction_data_depth_adjudications(jurisdiction_key,dimension_key);

create or replace function public.extract_depth_candidates(p_limit integer default 20)
returns integer
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  v_count integer := 0;
  r record;
  v_jurisdiction text;
  v_dim text;
  v_quote text;
begin
  for r in
    select ss.id,ss.source_id,ss.captured_url,ss.captured_text,sr.jurisdiction_code,sr.iso
    from public.source_snapshots ss
    join public.source_registry sr on sr.id=ss.source_id
    where ss.fetch_status='success'
      and coalesce(ss.processing_status,'pending')='pending'
      and ss.captured_text is not null
    order by ss.captured_at
    limit greatest(1,least(coalesce(p_limit,20),50))
  loop
    v_jurisdiction := coalesce(r.jurisdiction_code,r.iso);
    if v_jurisdiction is null then
      update public.source_snapshots set processing_status='needs_review',processed_at=now() where id=r.id;
      continue;
    end if;

    -- Conservative extraction: only create candidates when the source text contains
    -- explicit regulatory terms. Candidates are never evidence by themselves.
    for v_dim,v_quote in
      select * from (
        values
        ('regulatory_status', substring(r.captured_text from '(?is).{0,220}(legal|prohibited|medical cannabis|adult[- ]use|recreational cannabis).{0,220}')),
        ('pathways', substring(r.captured_text from '(?is).{0,220}(licen[cs]e|licen[cs]ing|permit|authorization).{0,220}')),
        ('import', substring(r.captured_text from '(?is).{0,220}(import|importation).{0,220}')),
        ('export', substring(r.captured_text from '(?is).{0,220}(export|exportation).{0,220}')),
        ('distribution', substring(r.captured_text from '(?is).{0,220}(distribution|distributor|wholesale).{0,220}')),
        ('testing', substring(r.captured_text from '(?is).{0,220}(testing|laboratory|lab testing).{0,220}')),
        ('packaging_labeling', substring(r.captured_text from '(?is).{0,220}(packaging|labelling|labeling).{0,220}')),
        ('tax_fees', substring(r.captured_text from '(?is).{0,220}(tax|excise|fee|fees).{0,220}')),
        ('commercial_activity', substring(r.captured_text from '(?is).{0,220}(sale|selling|cultivation|production|processing).{0,220}'))
      ) x(dim,q)
      where q is not null
    loop
      insert into public.jurisdiction_data_depth_extraction_candidates
        (source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,
         candidate_payload,evidence_quote,confidence,extraction_method)
      values
        (r.id,r.source_id,v_jurisdiction,v_dim,'authority_statement',
         jsonb_build_object('source_url',r.captured_url,'matched_dimension',v_dim),
         v_quote,'low','conservative_keyword_v1')
      on conflict (source_snapshot_id,dimension_key,evidence_quote) do nothing;
      v_count := v_count + 1;
    end loop;

    update public.source_snapshots
      set processing_status='extracted',processed_at=now(),intelligence_pass=coalesce(intelligence_pass,0)+1
    where id=r.id;
  end loop;
  return v_count;
end;
$$;

create or replace function public.adjudicate_depth_candidates(p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  r record;
  v_count integer := 0;
  v_ids uuid[];
begin
  for r in
    select c.jurisdiction_key,c.dimension_key,
           array_agg(c.id order by c.confidence desc,c.created_at) candidate_ids,
           count(*) n,
           count(distinct c.source_snapshot_id) source_count
    from public.jurisdiction_data_depth_extraction_candidates c
    where c.status='pending'
    group by c.jurisdiction_key,c.dimension_key
    order by min(c.created_at)
    limit greatest(1,least(coalesce(p_limit,100),500))
  loop
    select array_agg(id) into v_ids
    from public.jurisdiction_data_depth_extraction_candidates
    where jurisdiction_key=r.jurisdiction_key and dimension_key=r.dimension_key and status='pending';

    if r.n = 1 then
      update public.jurisdiction_data_depth_extraction_candidates
        set status='needs_review',
            adjudication_reason='Conservative extraction candidate requires source-specific human/structured adjudication; not auto-promoted.',
            updated_at=now()
      where id=any(v_ids);
      insert into public.jurisdiction_data_depth_adjudications
        (jurisdiction_key,dimension_key,decision,candidate_ids,decision_reason)
      values
        (r.jurisdiction_key,r.dimension_key,'unmeasured',v_ids,
         'Candidate extracted, but generic text matching is insufficient to establish an authoritative structured rule.')
      on conflict (jurisdiction_key,dimension_key) do update set
        decision='unmeasured',candidate_ids=excluded.candidate_ids,
        decision_reason=excluded.decision_reason,decided_at=now();
    else
      update public.jurisdiction_data_depth_extraction_candidates
        set status='conflict',
            adjudication_reason='Multiple candidate statements require explicit conflict resolution; no automatic winner.',
            updated_at=now()
      where id=any(v_ids);
      insert into public.jurisdiction_data_depth_adjudications
        (jurisdiction_key,dimension_key,decision,candidate_ids,decision_reason)
      values
        (r.jurisdiction_key,r.dimension_key,'blocked',v_ids,
         'Multiple candidate statements detected. No automatic winner is permitted.')
      on conflict (jurisdiction_key,dimension_key) do update set
        decision='blocked',candidate_ids=excluded.candidate_ids,
        decision_reason=excluded.decision_reason,decided_at=now();
    end if;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.extract_depth_candidates(integer) from public;
revoke all on function public.adjudicate_depth_candidates(integer) from public;
grant execute on function public.extract_depth_candidates(integer) to service_role;
grant execute on function public.adjudicate_depth_candidates(integer) to service_role;
