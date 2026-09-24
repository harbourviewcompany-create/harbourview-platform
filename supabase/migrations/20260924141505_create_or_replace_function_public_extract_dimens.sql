-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260924141505
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create or replace function public.extract_dimension_quote(p_text text,p_dimension text)
returns text
language plpgsql
immutable
set search_path=pg_catalog
as $$
declare
  term text;
  terms text[];
  pos integer;
  start_pos integer;
  end_pos integer;
begin
  if p_text is null or length(p_text)<40 then return null; end if;
  terms := case p_dimension
    when 'claims' then array['licensed','licence','license','permit','authorized','authorised','medical cannabis','adult-use','adult use','recreational cannabis','commercial cannabis','import','export','distribution','cultivation','processing','sale','selling']
    when 'regulatory_tier' then array['licensed','licence','license','permit','authorized','authorised','medical cannabis','adult-use','adult use','recreational cannabis','commercial cannabis','import','export','distribution','cultivation','processing','sale','selling','prohibited','illegal']
    when 'pathways' then array['license','licence','licensing','permit','authorization','authorisation','application']
    when 'import' then array['import','importation','import permit']
    when 'export' then array['export','exportation','export permit']
    when 'distribution' then array['distribution','distributor','wholesale']
    when 'testing' then array['testing','laboratory','laboratories','lab testing']
    when 'packaging_labeling' then array['packaging','labelling','labeling']
    when 'tax_fees' then array['tax','excise','fee','fees']
    when 'commercial_activity' then array['sale','selling','cultivation','production','processing','commercial']
    else array[]::text[]
  end;
  foreach term in array terms loop
    pos := strpos(lower(p_text),lower(term));
    if pos > 0 then
      start_pos := greatest(1,pos-260);
      end_pos := least(length(p_text),pos+500);
      return trim(substring(p_text from start_pos for end_pos-start_pos+1));
    end if;
  end loop;
  return null;
end $$;
revoke all on function public.extract_dimension_quote(text,text) from public,anon,authenticated;
grant execute on function public.extract_dimension_quote(text,text) to service_role;

create or replace function public.adjudicate_structured_depth(p_limit integer default 250)
returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
 r record; q text; cand uuid; runid uuid:=gen_random_uuid();
 src_ok boolean; quote_ok boolean; eff_ok boolean; scope_ok boolean; sem_ok boolean; auth_ok boolean; ok boolean;
 reason text; seen int:=0; promoted int:=0; unmeasured int:=0;
begin
 insert into public.jurisdiction_data_depth_adjudication_runs(id,engine_version,notes)
 values(runid,'structured-adjudication-v2','Dimension-specific deterministic gates; fail closed; no parent inheritance; no generic keyword promotion.');

 -- Claims
 for r in
   select c.claim_id,c.jurisdiction_iso2 jurisdiction_key,c.claim_key,c.claim_text,c.product_class,c.jurisdiction_scope,
          c.authority_url,c.source_effective_date,c.source_snapshot_sha256,c.verified_at,
          sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_text,
          sr.regulator_class,sr.tier source_tier
   from public.regulatory_market_access_claims c
   join public.source_registry sr on lower(regexp_replace(sr.source_url,'/$',''))=lower(regexp_replace(c.authority_url,'/$',''))
   join public.source_snapshots ss on ss.source_id=sr.id and ss.raw_html_hash=c.source_snapshot_sha256 and ss.fetch_status='success'
   where c.verified_at is not null and c.source_effective_date is not null
     and c.source_snapshot_sha256 is not null and c.claim_text is not null
     and length(trim(c.claim_text))>=20 and c.authority_url ~ '^https://'
     and coalesce(c.evidence_status,'') not in ('rejected','superseded')
   order by c.verified_at desc
   limit greatest(1,least(coalesce(p_limit,250),1000))
 loop
   seen:=seen+1; q:=public.extract_dimension_quote(r.captured_text,'claims');
   src_ok:=r.source_registry_id is not null and r.source_snapshot_id is not null and length(r.source_snapshot_sha256)=64;
   quote_ok:=q is not null and length(q)>=40;
   eff_ok:=r.source_effective_date is not null;
   scope_ok:=r.jurisdiction_key is not null and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key)
             and coalesce(r.jurisdiction_scope,'')<>'' and lower(r.jurisdiction_scope)<>lower(coalesce(r.product_class,''));
   sem_ok:=lower(r.claim_key||' '||r.claim_text||' '||coalesce(r.product_class,'')) ~ '(access|market|licen|permit|commercial|medical|adult|recreational|sale|cultivat|produc|process|import|export|distribut|testing|packag|label|tax|fee)';
   auth_ok:=coalesce(r.regulator_class,'other') in ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement') or coalesce(r.source_tier,99)<=2;
   ok:=src_ok and quote_ok and eff_ok and scope_ok and sem_ok and auth_ok;
   reason:=concat_ws(';',case when not src_ok then 'source' end,case when not quote_ok then 'quote' end,case when not eff_ok then 'effective_date' end,case when not scope_ok then 'jurisdiction_scope' end,case when not sem_ok then 'semantics' end,case when not auth_ok then 'authority' end);
   insert into public.jurisdiction_data_depth_extraction_candidates(source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,candidate_payload,evidence_quote,confidence,extraction_method,status,adjudication_reason)
   values(r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,'claims','structured_rule',
     jsonb_build_object('claim_id',r.claim_id,'claim_key',r.claim_key,'claim_text',r.claim_text,'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,'effective_from',r.source_effective_date,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),
     q,case when ok then 'high' else 'medium' end,'structured_claim_v2',case when ok then 'accepted' else 'needs_review' end,coalesce(nullif(reason,''),'all gates passed'))
   on conflict(source_snapshot_id,dimension_key,evidence_quote) do update set candidate_payload=excluded.candidate_payload,confidence=excluded.confidence,extraction_method=excluded.extraction_method,status=excluded.status,adjudication_reason=excluded.adjudication_reason,updated_at=now()
   returning id into cand;
   insert into public.jurisdiction_data_depth_gate_results(candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
   values(cand,r.jurisdiction_key,'claims',src_ok,quote_ok,eff_ok,scope_ok,sem_ok,auth_ok,case when ok then 'accepted' else 'unmeasured' end,coalesce(nullif(reason,''),'all gates passed'));
   if ok then
     promoted:=promoted+1;
     insert into public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
     values(r.jurisdiction_key,'claims','v2','authority_rule','applicable',
       jsonb_build_object('claim_id',r.claim_id,'claim_key',r.claim_key,'claim_text',r.claim_text,'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),
       q,r.source_registry_id,r.source_snapshot_id,r.authority_url,r.source_effective_date,'verified',r.verified_at)
     on conflict do nothing;
   else unmeasured:=unmeasured+1; end if;
 end loop;

 -- Regulatory tier
 for r in
   select e.evidence_key,e.jurisdiction_iso2 jurisdiction_key,e.tier,e.rationale,e.authority_name,e.authority_url,
          e.source_effective_date,e.verified_at,e.source_snapshot_sha256,e.parent_iso2,e.inheritance_scope,
          sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_text,sr.regulator_class,sr.tier source_tier
   from public.regulatory_market_access_evidence e
   join public.source_registry sr on lower(regexp_replace(sr.source_url,'/$',''))=lower(regexp_replace(e.authority_url,'/$',''))
   join public.source_snapshots ss on ss.source_id=sr.id and ss.raw_html_hash=e.source_snapshot_sha256 and ss.fetch_status='success'
   where e.active=true and e.verified_at is not null and e.source_effective_date is not null
     and e.source_snapshot_sha256 is not null and length(e.source_snapshot_sha256)=64
     and e.authority_url ~ '^https://' and e.parent_iso2 is null
   order by e.verified_at desc
   limit greatest(1,least(coalesce(p_limit,250),1000))
 loop
   seen:=seen+1; q:=public.extract_dimension_quote(r.captured_text,'regulatory_tier');
   src_ok:=r.source_registry_id is not null and r.source_snapshot_id is not null and length(r.source_snapshot_sha256)=64;
   quote_ok:=q is not null and length(q)>=40;
   eff_ok:=r.source_effective_date is not null;
   scope_ok:=r.jurisdiction_key is not null and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key) and r.parent_iso2 is null;
   sem_ok:=lower(coalesce(r.tier,'')||' '||coalesce(r.rationale,'')) ~ '(medical|adult|recreational|commercial|licen|market|cultivat|manufactur|process|sale|sell|export|import|prohibit|illegal|permit)';
   auth_ok:=coalesce(r.regulator_class,'other') in ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement') or coalesce(r.source_tier,99)<=2;
   ok:=src_ok and quote_ok and eff_ok and scope_ok and sem_ok and auth_ok;
   reason:=concat_ws(';',case when not src_ok then 'source' end,case when not quote_ok then 'quote' end,case when not eff_ok then 'effective_date' end,case when not scope_ok then 'jurisdiction_scope' end,case when not sem_ok then 'commercial_market_access_semantics' end,case when not auth_ok then 'authority' end);
   insert into public.jurisdiction_data_depth_extraction_candidates(source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,candidate_payload,evidence_quote,confidence,extraction_method,status,adjudication_reason)
   values(r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,'regulatory_tier','structured_rule',
     jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,'authority_name',r.authority_name,'authority_url',r.authority_url,'effective_from',r.source_effective_date,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),
     q,case when ok then 'high' else 'medium' end,'structured_tier_v2',case when ok then 'accepted' else 'needs_review' end,coalesce(nullif(reason,''),'all gates passed'))
   on conflict(source_snapshot_id,dimension_key,evidence_quote) do update set candidate_payload=excluded.candidate_payload,confidence=excluded.confidence,extraction_method=excluded.extraction_method,status=excluded.status,adjudication_reason=excluded.adjudication_reason,updated_at=now()
   returning id into cand;
   insert into public.jurisdiction_data_depth_gate_results(candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
   values(cand,r.jurisdiction_key,'regulatory_tier',src_ok,quote_ok,eff_ok,scope_ok,sem_ok,auth_ok,case when ok then 'accepted' else 'unmeasured' end,coalesce(nullif(reason,''),'all gates passed'));
   if ok then
     promoted:=promoted+1;
     insert into public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
     values(r.jurisdiction_key,'regulatory_tier','v2','authority_rule','applicable',
       jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,'authority_name',r.authority_name,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),
       q,r.source_registry_id,r.source_snapshot_id,r.authority_url,r.source_effective_date,'verified',r.verified_at)
     on conflict do nothing;
   else unmeasured:=unmeasured+1; end if;
 end loop;

 update public.jurisdiction_data_depth_extraction_candidates
 set status='needs_review',adjudication_reason=coalesce(adjudication_reason,'Awaiting structured dimension-specific adjudication.'),updated_at=now()
 where status='pending' and extraction_method='conservative_keyword_v1';

 update public.jurisdiction_data_depth_adjudication_runs
 set finished_at=now(),candidates_seen=seen,promoted=promoted,unmeasured=unmeasured,
     notes='v2: source registry + successful hashed snapshot + exact quote + explicit effective date + exact jurisdiction scope + authority hierarchy + dimension semantics.'
 where id=runid;
 return jsonb_build_object('run_id',runid,'engine_version','structured-adjudication-v2','candidates_seen',seen,'promoted',promoted,'unmeasured',unmeasured);
end $$;
revoke all on function public.adjudicate_structured_depth(integer) from public,anon,authenticated;
grant execute on function public.adjudicate_structured_depth(integer) to service_role;
