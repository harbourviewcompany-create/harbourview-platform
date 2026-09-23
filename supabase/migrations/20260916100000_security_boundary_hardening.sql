-- Security boundary hardening, 2026-09-16
-- Replay-safe function identity handling uses pg_identify_object rather than
-- regprocedure casts. PostgreSQL requires regprocedure text input to contain
-- a complete function signature; catalog identity is already machine-readable.

begin;

create schema if not exists security;
revoke all on schema security from public, anon, authenticated;

create table if not exists security.rls_policy_exemptions (
  table_schema text not null,
  table_name text not null,
  classification text not null default 'service_only_or_definer_only',
  reason text not null,
  classified_at timestamptz not null default now(),
  primary key (table_schema, table_name),
  check (classification in ('service_only_or_definer_only', 'internal_only', 'manual_review'))
);
revoke all on security.rls_policy_exemptions from public, anon, authenticated;

insert into security.rls_policy_exemptions (table_schema, table_name, classification, reason)
select n.nspname,c.relname,'service_only_or_definer_only',
'RLS is enabled and there is intentionally no direct client policy; access must remain through trusted service-role or narrowly scoped SECURITY DEFINER paths.'
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where c.relkind in ('r','p') and c.relrowsecurity
and n.nspname in ('public','api','signals','regulatory_signals')
and not exists (select 1 from pg_policies p where p.schemaname=n.nspname and p.tablename=c.relname)
on conflict (table_schema,table_name) do nothing;

do $$
declare fn text;
targets constant text[] := array[
'api.get_airtable_sync_config()','api.hv_get_github_pat()','public.get_github_pat()',
'public.hv_get_llm_keys()','public.hv_get_gemini_key()','public.hv_get_gemini_keys_ordered()'];
begin
foreach fn in array targets loop
begin execute format('revoke execute on function %s from public, anon, authenticated',fn);
exception when undefined_function then null;
end;
end loop;
end $$;

-- Pin SECURITY DEFINER search paths for browser-exposed functions lacking one.
-- pg_identify_object returns the exact machine-readable object identity,
-- including a complete argument signature where required by ALTER FUNCTION.
do $$
declare r record;
begin
for r in
select (pg_identify_object('pg_proc'::regclass,p.oid,0)).identity as function_identity
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where p.prosecdef
and n.nspname in ('public','api','signals','regulatory_signals')
and (p.proconfig is null or not exists(select 1 from unnest(p.proconfig) c where c like 'search_path=%'))
and has_function_privilege(p.oid,'public','execute')
loop
execute format('alter function %s set search_path = pg_catalog, public, api, signals, regulatory_signals, extensions',r.function_identity);
end loop;
end $$;

grant execute on function api.get_corridor_stats(text) to anon, authenticated;

do $$
declare r record; using_expr text; check_expr text;
begin
for r in
select schemaname,tablename,policyname,qual,with_check from pg_policies
where schemaname in ('public','api','signals','regulatory_signals','storage')
and (coalesce(qual,'') ~ '(^|[^A-Za-z_])auth\\.uid\\(\\)' or coalesce(with_check,'') ~ '(^|[^A-Za-z_])auth\\.uid\\(\\)')
and (coalesce(qual,'') !~ '\\( SELECT auth\\.uid\\(\\)' or coalesce(with_check,'') !~ '\\( SELECT auth\\.uid\\(\\)')
loop
using_expr:=r.qual; check_expr:=r.with_check;
if using_expr is not null then using_expr:=regexp_replace(using_expr,'(^|[^A-Za-z_])auth\\.uid\\(\\)','\\1(SELECT auth.uid())','g'); end if;
if check_expr is not null then check_expr:=regexp_replace(check_expr,'(^|[^A-Za-z_])auth\\.uid\\(\\)','\\1(SELECT auth.uid())','g'); end if;
if using_expr is not null and btrim(using_expr)<>'' and length(using_expr)-length(replace(using_expr,'(',''))=length(using_expr)-length(replace(using_expr,')',''))
and (check_expr is null or (btrim(check_expr)<>'' and length(check_expr)-length(replace(check_expr,'(',''))=length(check_expr)-length(replace(check_expr,')','')))) then
if check_expr is null or btrim(check_expr)='' then
execute format('alter policy %I on %I.%I using (%s)',r.policyname,r.schemaname,r.tablename,using_expr);
else
execute format('alter policy %I on %I.%I using (%s) with check (%s)',r.policyname,r.schemaname,r.tablename,using_expr,check_expr);
end if;
elsif check_expr is not null and btrim(check_expr)<>'' and length(check_expr)-length(replace(check_expr,'(',''))=length(check_expr)-length(replace(check_expr,')','')) then
execute format('alter policy %I on %I.%I with check (%s)',r.policyname,r.schemaname,r.tablename,check_expr);
end if;
end loop;
end $$;

create index if not exists idx_intel_assertion_evidence_evidence_ref_id on public.intel_assertion_evidence(evidence_ref_id);
create index if not exists idx_intel_assertions_jurisdiction_id on public.intel_assertions(jurisdiction_id);
create index if not exists idx_intel_events_canonical_signal_id on public.intel_events(canonical_signal_id);
create index if not exists idx_intel_events_jurisdiction_id on public.intel_events(jurisdiction_id);
create index if not exists idx_intel_evidence_refs_hv_evidence_id on public.intel_evidence_refs(hv_evidence_id);
create index if not exists idx_intel_evidence_refs_source_registry_id on public.intel_evidence_refs(source_registry_id);
create index if not exists idx_intel_evidence_refs_source_snapshot_id on public.intel_evidence_refs(source_snapshot_id);
create index if not exists idx_market_entry_events_actor_user_id on public.market_entry_events(actor_user_id);

commit;