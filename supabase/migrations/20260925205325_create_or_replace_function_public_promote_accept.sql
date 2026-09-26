-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260925205325
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create or replace function public.promote_accepted_full_depth_candidates(p_limit integer default 5000) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare n int:=0; jobs int:=0; r record;
begin
 for r in
   select c.*,g.jurisdiction_key g_jurisdiction,g.dimension_key g_dimension,s.source_url registered_url,
          coalesce((c.candidate_payload->>'effective_from')::date,
                   (c.candidate_payload->>'source_effective_date')::date,
                   (c.candidate_payload->>'source_date')::date,
                   (c.candidate_payload->>'expected_date')::date,
                   (c.candidate_payload->>'effective_at')::date) eff
   from public.jurisdiction_data_depth_gate_results g
   join public.jurisdiction_data_depth_extraction_candidates c on c.id=g.candidate_id
   join public.source_registry s on s.id=c.source_registry_id
   where g.decision='accepted'
     and c.status='accepted'
     and c.source_snapshot_id is not null
     and c.source_registry_id is not null
     and c.evidence_quote is not null
     and c.evidence_quote <> '[NO_EXACT_SOURCE_QUOTE]'
   order by g.evaluated_at desc
   limit greatest(1,least(coalesce(p_limit,5000),10000))
 loop
   insert into public.jurisdiction_data_depth_evidence
     (jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
   values
     (r.g_jurisdiction,r.g_dimension,'2026-09-23.v2',
      case when r.candidate_kind='structural_fact' then 'structural_fact' else 'authority_statement' end,
      'applicable',r.candidate_payload,r.evidence_quote,r.source_registry_id,r.source_snapshot_id,r.registered_url,r.eff,'verified',now())
   on conflict do nothing;
   if found then n:=n+1; end if;
 end loop;

 update public.jurisdiction_data_depth_capture_jobs j
 set status='complete',
     source_registry_id=e.source_registry_id,
     source_snapshot_id=e.source_snapshot_id,
     extracted_at=coalesce(e.verified_at,now()),
     completed_at=coalesce(j.completed_at,now()),
     last_error=null,
     updated_at=now()
 from (
   select distinct on (jurisdiction_key,dimension_key)
          jurisdiction_key,dimension_key,source_registry_id,source_snapshot_id,verified_at
   from public.jurisdiction_data_depth_evidence
   where contract_version='2026-09-23.v2' and verification_status='verified'
   order by jurisdiction_key,dimension_key,verified_at desc
 ) e
 where j.jurisdiction_key=e.jurisdiction_key
   and j.dimension_key=e.dimension_key
   and j.contract_version='2026-09-23.v2'
   and j.status<>'complete';
 get diagnostics jobs=row_count;
 return jsonb_build_object('promoted',n,'jobs_completed',jobs,'contract_version','2026-09-23.v2');
end $$;
