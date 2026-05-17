create table if not exists public.hub_connectors (
  id bigserial primary key,
  connector_key text unique not null,
  provider text not null,
  display_name text not null,
  status text not null,
  enabled boolean not null default false,
  credential_env_var text not null,
  authority_level text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.hub_credential_refs (
  id bigserial primary key, credential_name text not null, provider text not null, env_var_name text not null,
  project_name text, project_number text, secret_material_stored boolean not null default false, status text not null
);
create table if not exists public.hub_artifacts (
  id uuid primary key default gen_random_uuid(), content text not null, sensitivity text default 'internal', metadata jsonb default '{}'::jsonb, created_at timestamptz default now()
);
create table if not exists public.hub_ai_processing_runs (
  id uuid primary key default gen_random_uuid(), artifact_id uuid references public.hub_artifacts(id), connector_key text not null, operation text not null, status text not null, result_payload jsonb default '{}'::jsonb, created_at timestamptz default now()
);
create table if not exists public.hub_ai_proposals (
  id uuid primary key default gen_random_uuid(), run_id uuid references public.hub_ai_processing_runs(id), artifact_id uuid references public.hub_artifacts(id), proposal_type text not null, proposal_payload jsonb not null, status text not null default 'pending_review', created_at timestamptz default now()
);
create table if not exists public.hub_routing_proposals (
  id uuid primary key default gen_random_uuid(), run_id uuid references public.hub_ai_processing_runs(id), artifact_id uuid references public.hub_artifacts(id), proposal_payload jsonb not null, status text not null default 'pending_review', required_review boolean not null default true, created_at timestamptz default now()
);
create table if not exists public.hub_redaction_events (
  id bigserial primary key, run_id uuid references public.hub_ai_processing_runs(id), event_type text not null, event_count int not null default 1, created_at timestamptz default now()
);
alter table public.hub_connectors enable row level security;
alter table public.hub_credential_refs enable row level security;
alter table public.hub_artifacts enable row level security;
alter table public.hub_ai_processing_runs enable row level security;
alter table public.hub_ai_proposals enable row level security;
alter table public.hub_routing_proposals enable row level security;
alter table public.hub_redaction_events enable row level security;

drop policy if exists hub_deny_anon_connectors on public.hub_connectors;
create policy hub_deny_anon_connectors on public.hub_connectors for all to anon using (false) with check (false);

insert into public.hub_connectors (connector_key,provider,display_name,status,enabled,credential_env_var,authority_level)
values ('gemini','google_gemini','Gemini Hub Connector','disabled',false,'GEMINI_API_KEY','proposal_only')
on conflict (connector_key) do nothing;
insert into public.hub_credential_refs (credential_name,provider,env_var_name,project_name,project_number,secret_material_stored,status)
values ('Gemini API Key','google_gemini','GEMINI_API_KEY','projects/297981647601','297981647601',false,'active');
