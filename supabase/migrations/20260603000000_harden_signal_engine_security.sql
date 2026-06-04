-- Harbourview Signal Engine security hardening.
-- Scope: signal-engine tables/functions only. Do not touch marketplace objects here.
-- Control reference: docs/control/signal-engine-hardening/EXECUTION_PLAN.md

begin;

create schema if not exists private;

comment on schema private is
  'Non-API schema for Harbourview database helper functions that must not be exposed through PostgREST RPC.';

revoke all on schema private from public;
revoke all on schema private from anon;

create or replace function private.is_signal_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role in ('admin', 'operator')
  );
$$;

comment on function private.is_signal_admin() is
  'Signal Engine RLS helper. Uses public.user_roles and lives outside exposed API schemas to avoid RPC exposure.';

revoke all on function private.is_signal_admin() from public;
revoke all on function private.is_signal_admin() from anon;
grant usage on schema private to authenticated;
grant execute on function private.is_signal_admin() to authenticated;

-- Remove exposed public-schema helper functions after replacing dependent policies.
-- These functions were RLS internals, not public RPC contract.
revoke all on function public.is_signal_admin() from public;
revoke all on function public.is_signal_admin() from anon;
revoke all on function public.is_signal_admin() from authenticated;

revoke all on function public.is_service_role() from public;
revoke all on function public.is_service_role() from anon;
revoke all on function public.is_service_role() from authenticated;

-- Ensure every Signal Engine table is schema-qualified, RLS-enabled, and policy-clean.
alter table public.source_documents force row level security;
alter table public.source_chunks force row level security;
alter table public.signal_duplicate_groups force row level security;
alter table public.signal_candidates force row level security;
alter table public.signal_evidence force row level security;
alter table public.signal_review_events force row level security;
alter table public.signal_jobs force row level security;
alter table public.signal_risk_flags force row level security;
alter table public.model_prompt_versions force row level security;
alter table public.model_call_logs force row level security;
alter table public.entities force row level security;
alter table public.signal_entity_mentions force row level security;
alter table public.signal_conversions force row level security;
alter table public.signal_processing_errors force row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'source_documents', 'source_chunks', 'signal_duplicate_groups',
    'signal_candidates', 'signal_evidence', 'signal_review_events',
    'signal_jobs', 'signal_risk_flags', 'model_prompt_versions',
    'model_call_logs', 'entities', 'signal_entity_mentions',
    'signal_conversions', 'signal_processing_errors'
  ]) loop
    execute format('drop policy if exists admin_all on public.%I', t);
    execute format(
      'create policy admin_all on public.%I for all to authenticated
       using (private.is_signal_admin())
       with check (private.is_signal_admin())',
      t
    );
  end loop;
end $$;

-- Keep the canonical V1 service-role write surface limited to processing tables.
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'signal_jobs', 'model_call_logs', 'signal_candidates',
    'signal_evidence', 'signal_processing_errors', 'source_chunks'
  ]) loop
    execute format('drop policy if exists service_role_write on public.%I', t);
    execute format('drop policy if exists service_role_update on public.%I', t);
    execute format(
      'create policy service_role_write on public.%I for insert to service_role with check (true)',
      t
    );
    execute format(
      'create policy service_role_update on public.%I for update to service_role using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- Drop legacy exposed helpers once no signal-engine policy depends on them.
drop function if exists public.is_signal_admin();
drop function if exists public.is_service_role();

commit;
