-- HISTORICAL RECOVERY ARTIFACT
-- Production migration version: 20260922101742
-- Recovered verbatim from production supabase_migrations.schema_migrations.statements.
-- DO NOT REPLAY: archival source only.

insert into public.jurisdiction_playbooks_research_queue
(country_code,country_name,region,subregion,queue_rank,playbook_status,research_notes)
select v.jurisdiction_key,v.country_name,v.region,v.subregion,
       row_number() over(order by v.populated_dimensions asc,v.jurisdiction_key) as queue_rank,
       'unresearched',
       'Auto-enqueued from live data-depth gaps on 2026-09-22. No regulatory facts inferred; authoritative-source research required.'
from public.v_jurisdiction_data_depth v
where not exists (
  select 1 from public.jurisdiction_playbooks_research_queue q
  where q.country_code=v.jurisdiction_key
);

