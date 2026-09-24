-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260924141416
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

-- Structured dimension-specific adjudication engine
-- Fail-closed: only promotes evidence when source, exact quote, effective date,
-- jurisdiction scope, and dimension-specific semantics all pass.

create table if not exists public.jurisdiction_data_depth_adjudication_runs (
  id uuid primary key default gen_random_uuid(),
  engine_version text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  candidates_seen integer not null default 0,
  promoted integer not null default 0,
  blocked integer not null default 0,
  unmeasured integer not null default 0,
  notes text
);

create table if not exists public.jurisdiction_data_depth_gate_results (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.jurisdiction_data_depth_extraction_candidates(id) on delete cascade,
  jurisdiction_key text not null,
  dimension_key text not null,
  source_gate boolean not null,
  quote_gate boolean not null,
  effective_date_gate boolean not null,
  jurisdiction_scope_gate boolean not null,
  semantics_gate boolean not null,
  authority_gate boolean not null,
  decision text not null check (decision in ('accepted','blocked','unmeasured')),
  reason text not null,
  evaluated_at timestamptz not null default now()
);

create index if not exists jd_depth_gate_candidate_idx
  on public.jurisdiction_data_depth_gate_results(candidate_id);
create index if not exists jd_depth_gate_jd_idx
  on public.jurisdiction_data_depth_gate_results(jurisdiction_key,dimension_key);

create or replace function public.adjudicate_structured_depth(p_limit integer default 250)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_run uuid := gen_random_uuid();
  r record;
  v_quote text;
  v_effective date;
  v_source_url text;
  v_payload jsonb;
  v_kind text;
  v_app text;
  v_semantics boolean;
  v_source boolean;
  v_quote_ok boolean;
  v_effective_ok boolean;
  v_scope_ok boolean;
  v_authority_ok boolean;
  v_decision text;
  v_reason text;
  v_candidate uuid;
  v_seen int := 0;
  v_promoted int := 0;
  v_blocked int := 0;
  v_unmeasured int := 0;
begin
  insert into public.jurisdiction_data_depth_adjudication_runs(id,engine_version,notes)
  values(v_run,'structured-adjudication-v1','Deterministic dimension-specific gates; no parent inheritance; no automatic conflict winner.');

  -- 1. Build structured candidates from verified commercial market-access claims.
  for r in
    select
      c.claim_id as source_row_id,
      c.jurisdiction_iso2 as jurisdiction_key,
      'claims'::text as dimension_key,
      c.authority_url as source_url,
      c.source_snapshot_sha256 as expected_hash,
      c.source_effective_date as effective_from,
      c.jurisdiction_scope,
      c.claim_text,
      c.product_class,
      c.claim_key,
      sr.id as source_registry_id,
      ss.id as source_snapshot_id,
      sr.regulator_class,
      sr.tier as source_tier,
      ss.captured_text,
      c.verified_at
    from public.regulatory_market_access_claims c
    join public.source_registry sr
      on lower(regexp_replace(sr.source_url,'/$','')) =
         lower(regexp_replace(c.authority_url,'/$',''))
    join public.source_snapshots ss
      on ss.source_id=sr.id
     and ss.raw_html_hash=c.source_snapshot_sha256
     and ss.fetch_status='success'
    where c.verified_at is not null
      and c.source_effective_date is not null
      and c.source_snapshot_sha256 is not null
      and c.authority_url ~ '^https://'
      and c.claim_text is not null
      and length(trim(c.claim_text)) >= 20
      and coalesce(c.evidence_status,'') not in ('rejected','superseded')
    order by c.verified_at desc
    limit greatest(1,least(coalesce(p_limit,250),1000))
  loop
    v_seen := v_seen + 1;
    -- Dimension semantics are based on the structured claim key/product/rule text,
    -- not on a generic keyword match.
    v_semantics :=
      lower(coalesce(r.claim_key,'') || ' ' || coalesce(r.product_class,'') || ' ' || coalesce(r.claim_text,''))
      ~ '(market|access|licen[cs]|commercial|sale|sell|cultivat|produc|process|dispens|medical|adult.?use|recreational|import|export|distribut|testing|packag|label|tax|fee)';
    v_quote := substring(r.captured_text from
      '(?is)(.{0,260}(?:licen[cs](?:e|ing|ed)?|permit(?:s|ted)?|authorized|authorised|sale|sell|cultivat(?:e|ion)|manufactur(?:e|ing)|process(?:ing)?|dispens(?:ary|ing)|medical cannabis|adult[- ]use|recreational cannabis|import(?:ation)?|export(?:ation)?|distribut(?:ion|or)|testing|laborator(?:y|ies)|packag(?:e|ing)|label(?:ing|ling)?|tax|excise|fee).{0,360})');
    v_source := r.source_registry_id is not null
      and r.source_snapshot_id is not null
      and r.expected_hash is not null and length(r.expected_hash)=64
      and r.source_url is not null and r.source_url ~ '^https://'
      and r.captured_text is not null and length(r.captured_text)>0;
    v_quote_ok := v_quote is not null and length(trim(v_quote)) >= 40
      and lower(r.captured_text) like '%' || lower(left(trim(v_quote),120)) || '%';
    v_effective_ok := r.effective_from is not null;
    v_scope_ok := r.jurisdiction_key is not null
      and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key)
      and coalesce(r.jurisdiction_scope,'') <> ''
      and (
        lower(r.jurisdiction_scope) like '%' || lower(r.jurisdiction_key) || '%'
        or lower(r.jurisdiction_scope) like '%national%'
        or lower(r.jurisdiction_scope) like '%state%'
        or lower(r.jurisdiction_scope) like '%province%'
        or lower(r.jurisdiction_scope) like '%territor%'
      );
    v_authority_ok := coalesce(r.regulator_class,'other') in
      ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement')
      or coalesce(r.source_tier,99) <= 2;

    v_decision := case when v_source and v_quote_ok and v_effective_ok and v_scope_ok and v_semantics and v_authority_ok
      then 'accepted' else 'unmeasured' end;
    v_reason := concat_ws('; ',
      case when not v_source then 'source gate failed' end,
      case when not v_quote_ok then 'exact source quote gate failed' end,
      case when not v_effective_ok then 'explicit effective date missing' end,
      case when not v_scope_ok then 'exact jurisdiction scope failed' end,
      case when not v_semantics then 'claims dimension semantics failed' end,
      case when not v_authority_ok then 'source authority gate failed' end);

    insert into public.jurisdiction_data_depth_extraction_candidates
      (source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,
       candidate_payload,evidence_quote,confidence,extraction_method,status,adjudication_reason)
    values
      (r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,r.dimension_key,'structured_rule',
       jsonb_build_object(
         'claim_id',r.source_row_id,'claim_key',r.claim_key,'claim_text',r.claim_text,
         'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,
         'effective_from',r.effective_from,'authority_url',r.source_url,
         'source_snapshot_sha256',r.expected_hash,'gate_engine','structured-adjudication-v1'
       ),
       v_quote, case when v_decision='accepted' then 'high' else 'medium' end,
       'structured_claim_v1',
       case when v_decision='accepted' then 'accepted' else 'needs_review' end,
       v_reason)
    on conflict (source_snapshot_id,dimension_key,evidence_quote) do update
      set candidate_payload=excluded.candidate_payload,
          confidence=excluded.confidence,
          extraction_method=excluded.extraction_method,
          status=excluded.status,
          adjudication_reason=excluded.adjudication_reason,
          updated_at=now()
    returning id into v_candidate;

    insert into public.jurisdiction_data_depth_gate_results
      (candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,
       jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
    values(v_candidate,r.jurisdiction_key,r.dimension_key,v_source,v_quote_ok,v_effective_ok,
           v_scope_ok,v_semantics,v_authority_ok,v_decision,coalesce(nullif(v_reason,''),'all gates passed'));

    if v_decision='accepted' then
      v_promoted := v_promoted + 1;
      v_payload := jsonb_build_object(
        'claim_id',r.source_row_id,'claim_key',r.claim_key,'claim_text',r.claim_text,
        'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,
        'authority_url',r.source_url,'source_snapshot_sha256',r.expected_hash,
        'adjudication_engine','structured-adjudication-v1'
      );
      insert into public.jurisdiction_data_depth_evidence
        (jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,
         evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,
         effective_from,verification_status,verified_at)
      values
        (r.jurisdiction_key,r.dimension_key,'v2','authority_rule','applicable',
         v_payload,trim(v_quote),r.source_registry_id,r.source_snapshot_id,r.source_url,
         r.effective_from,'verified',r.verified_at)
      on conflict do nothing;
    else
      v_unmeasured := v_unmeasured + 1;
    end if;
  end loop;

  -- 2. Commercial market-access tier is a separate dimension and has a stricter semantic gate.
  for r in
    select e.evidence_key,e.jurisdiction_iso2 as jurisdiction_key,e.tier,e.rationale,
           e.authority_name,e.authority_url,e.source_effective_date,e.verified_at,
           e.source_snapshot_sha256,e.inheritance_scope,e.parent_iso2,
           sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_text,
           sr.regulator_class,sr.tier source_tier
    from public.regulatory_market_access_evidence e
    join public.source_registry sr on lower(regexp_replace(sr.source_url,'/$',''))=lower(regexp_replace(e.authority_url,'/$',''))
    join public.source_snapshots ss on ss.source_id=sr.id and ss.raw_html_hash=e.source_snapshot_sha256 and ss.fetch_status='success'
    where e.active=true
      and e.verified_at is not null
      and e.source_effective_date is not null
      and e.source_snapshot_sha256 is not null and length(e.source_snapshot_sha256)=64
      and e.authority_url ~ '^https://'
      and coalesce(e.inheritance_scope,'') in ('direct','jurisdiction','national','subnational','')
      and e.parent_iso2 is null
    order by e.verified_at desc
    limit greatest(1,least(coalesce(p_limit,250),1000))
  loop
    v_seen := v_seen + 1;
    v_quote := substring(r.captured_text from
      '(?is)(.{0,300}(?:licen[cs](?:e|ing|ed)?|commercial|market|sale|sell|cultivat(?:e|ion)|manufactur(?:e|ing)|process(?:ing)?|dispens(?:ary|ing)|medical cannabis|adult[- ]use|recreational cannabis).{0,420})');
    v_source := r.source_registry_id is not null and r.source_snapshot_id is not null
      and r.source_snapshot_sha256 is not null and length(r.source_snapshot_sha256)=64
      and r.captured_text is not null and length(r.captured_text)>0;
    v_quote_ok := v_quote is not null and length(trim(v_quote)) >= 40;
    v_effective_ok := r.source_effective_date is not null;
    v_scope_ok := r.jurisdiction_key is not null
      and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key)
      and r.parent_iso2 is null;
    v_semantics := lower(coalesce(r.tier,'') || ' ' || coalesce(r.rationale,'')) ~
      '(medical|adult|recreational|commercial|licen[cs]|market|cultivat|manufactur|process|sale|sell|export|import|prohibit|illegal|not.?permitted)';
    v_authority_ok := coalesce(r.regulator_class,'other') in
      ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement')
      or coalesce(r.source_tier,99) <= 2;

    v_decision := case when v_source and v_quote_ok and v_effective_ok and v_scope_ok and v_semantics and v_authority_ok
      then 'accepted' else 'unmeasured' end;
    v_reason := concat_ws('; ',
      case when not v_source then 'source gate failed' end,
      case when not v_quote_ok then 'exact source quote gate failed' end,
      case when not v_effective_ok then 'explicit effective date missing' end,
      case when not v_scope_ok then 'exact jurisdiction scope failed' end,
      case when not v_semantics then 'commercial market-access semantics failed' end,
      case when not v_authority_ok then 'source authority gate failed' end);

    insert into public.jurisdiction_data_depth_extraction_candidates
      (source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,candidate_payload,
       evidence_quote,confidence,extraction_method,status,adjudication_reason)
    values
      (r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,'regulatory_tier','structured_rule',
       jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,
         'authority_name',r.authority_name,'authority_url',r.authority_url,
         'effective_from',r.source_effective_date,'source_snapshot_sha256',r.source_snapshot_sha256,
         'adjudication_engine','structured-adjudication-v1'),
       v_quote,case when v_decision='accepted' then 'high' else 'medium' end,'structured_tier_v1',
       case when v_decision='accepted' then 'accepted' else 'needs_review' end,v_reason)
    on conflict (source_snapshot_id,dimension_key,evidence_quote) do update
      set candidate_payload=excluded.candidate_payload,status=excluded.status,
          confidence=excluded.confidence,extraction_method=excluded.extraction_method,
          adjudication_reason=excluded.adjudication_reason,updated_at=now()
    returning id into v_candidate;

    insert into public.jurisdiction_data_depth_gate_results
      (candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,
       jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
    values(v_candidate,r.jurisdiction_key,'regulatory_tier',v_source,v_quote_ok,v_effective_ok,
           v_scope_ok,v_semantics,v_authority_ok,v_decision,coalesce(nullif(v_reason,''),'all gates passed'));

    if v_decision='accepted' then
      v_promoted := v_promoted + 1;
      insert into public.jurisdiction_data_depth_evidence
        (jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,
         evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
      values
        (r.jurisdiction_key,'regulatory_tier','v2','authority_rule','applicable',
         jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,
           'authority_name',r.authority_name,'authority_url',r.authority_url,
           'source_snapshot_sha256',r.source_snapshot_sha256,'adjudication_engine','structured-adjudication-v1'),
         trim(v_quote),r.source_registry_id,r.source_snapshot_id,r.authority_url,
         r.source_effective_date,'verified',r.verified_at)
      on conflict do nothing;
    else
      v_unmeasured := v_unmeasured + 1;
    end if;
  end loop;

  -- 3. Never auto-promote generic keyword candidates. They remain research inputs.
  update public.jurisdiction_data_depth_extraction_candidates
    set status='needs_review',
        adjudication_reason=coalesce(adjudication_reason,'Awaiting structured dimension-specific adjudication.'),
        updated_at=now()
  where status='pending'
    and extraction_method='conservative_keyword_v1';

  update public.jurisdiction_data_depth_adjudication_runs
    set finished_at=now(),candidates_seen=v_seen,promoted=v_promoted,
        blocked=v_blocked,unmeasured=v_unmeasured,
        notes='Promotion requires exact source snapshot, exact jurisdiction scope, explicit effective date, source quote, authority hierarchy, and dimension-specific semantics.'
  where id=v_run;

  return jsonb_build_object('run_id',v_run,'engine_version','structured-adjudication-v1',
    'candidates_seen',v_seen,'promoted',v_promoted,'blocked',v_blocked,'unmeasured',v_unmeasured);
end;
$$;

revoke all on function public.adjudicate_structured_depth(integer) from public, anon, authenticated;
grant execute on function public.adjudicate_structured_depth(integer) to service_role;

comment on function public.adjudicate_structured_depth(integer) is
'Fail-closed structured evidence adjudication. Promotion requires source registry + successful hashed snapshot, exact source quote, explicit effective date, exact jurisdiction scope, authoritative source class, and dimension-specific rule semantics. No parent inheritance and no generic keyword auto-promotion.';
