-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260920170252
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create or replace function public.hv_rules_analysis(p_limit integer default 50)
returns integer language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_count integer;
begin
with candidates as (
 select s.id, left(btrim(s.headline),500) headline, left(btrim(coalesce(s.summary,s.headline)),700) summary,
 s.cat,s.score,s.verification,s.source
 from public.signals s
 where s.reviewed=true and s.headline is not null and s.analysis is null
 order by s.score desc nulls last,s.date desc
 limit least(greatest(coalesce(p_limit,50),1),50)
), updated as (
 update public.signals s set
 analysis=jsonb_build_object(
 'what_changed',case
   when c.summary is null or c.summary='' then c.headline
   when length(c.summary)>length(c.headline)+30 and position(lower(c.headline) in lower(c.summary))=1 then left(btrim(substr(c.summary,length(c.headline)+1)),650)
   else c.headline end,
 'who_is_affected',case
   when lower(coalesce(c.cat,''))~'regulat|compliance|law|policy|licen|permit|government' then 'Operators, compliance teams, and businesses subject to the affected regulatory or market requirements.'
   when lower(coalesce(c.summary,''))~'investor|stock|share|market' then 'Investors and market participants exposed to the reported company, sector, or market development.'
   else 'Organizations and market participants directly exposed to the reported development.' end,
 'deadline',null,
 'recommended_action',case when coalesce(c.score,0)>=80 then 'Review the underlying source and assess whether the development requires an operational, compliance, or monitoring response.' else 'Monitor the underlying source and verify the development before taking material operational action.' end,
 'confidence_rationale',case when nullif(btrim(c.verification),'') is not null then 'Rules-based analysis using recorded signal text and metadata; source verification is marked "'||btrim(c.verification)||'".' else 'Rules-based analysis using recorded signal text and metadata; source verification metadata is limited.' end,
 'analysis_quality',case when lower(coalesce(c.source,''))~'source engine' or lower(coalesce(c.summary,''))~'home|search|menu|watchlist|featured|copyright' then 'limited_source_text' else 'rules_based' end
 ),
 analysis_generated_at=now(),analysis_backend='rules-v1'
 from candidates c where s.id=c.id returning 1)
select count(*) into v_count from updated; return v_count;
end $$;
