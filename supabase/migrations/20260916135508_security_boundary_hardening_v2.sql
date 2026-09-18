begin;
create schema if not exists security;
revoke all on schema security from public, anon, authenticated;
create table if not exists security.rls_policy_exemptions (table_schema text not null, table_name text not null, classification text not null default 'service_only_or_definer_only', reason text not null, classified_at timestamptz not null default now(), primary key (table_schema, table_name), check (classification in ('service_only_or_definer_only','internal_only','manual_review')));
revoke all on security.rls_policy_exemptions from public, anon, authenticated;
insert into security.rls_policy_exemptions(table_schema,table_name,classification,reason)
select n.nspname,c.relname,'service_only_or_definer_only','RLS is enabled and there is intentionally no direct client policy; access remains through trusted service-role or narrowly scoped SECURITY DEFINER paths.'
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where c.relkind in ('r','p') and c.relrowsecurity and n.nspname in ('public','api','signals','regulatory_signals')
and not exists(select 1 from pg_policies p where p.schemaname=n.nspname and p.tablename=c.relname)
on conflict(table_schema,table_name) do nothing;
revoke execute on function api.get_airtable_sync_config() from public, anon, authenticated;
revoke execute on function api.hv_get_github_pat() from public, anon, authenticated;
revoke execute on function public.get_github_pat() from public, anon, authenticated;
revoke execute on function public.hv_get_llm_keys() from public, anon, authenticated;
revoke execute on function public.hv_get_gemini_key() from public, anon, authenticated;
revoke execute on function public.hv_get_gemini_keys_ordered() from public, anon, authenticated;
grant execute on function api.get_corridor_stats(text) to anon, authenticated;
create index if not exists idx_intel_assertion_evidence_evidence_ref_id on public.intel_assertion_evidence(evidence_ref_id);
create index if not exists idx_intel_assertions_jurisdiction_id on public.intel_assertions(jurisdiction_id);
create index if not exists idx_intel_events_canonical_signal_id on public.intel_events(canonical_signal_id);
create index if not exists idx_intel_events_jurisdiction_id on public.intel_events(jurisdiction_id);
create index if not exists idx_intel_evidence_refs_hv_evidence_id on public.intel_evidence_refs(hv_evidence_id);
create index if not exists idx_intel_evidence_refs_source_registry_id on public.intel_evidence_refs(source_registry_id);
create index if not exists idx_intel_evidence_refs_source_snapshot_id on public.intel_evidence_refs(source_snapshot_id);
create index if not exists idx_market_entry_events_actor_user_id on public.market_entry_events(actor_user_id);
commit;
