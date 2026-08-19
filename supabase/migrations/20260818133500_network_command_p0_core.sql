begin;

-- Network Command P0.
-- Canonical real-world identity remains public.entities.
-- Workspace membership remains the tenancy/security boundary.
-- Existing domain systems (operators/licences, genetics, marketplace, transactions,
-- intelligence and watchlists) remain canonical and are linked rather than copied.

create table public.network_missions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null,
  objective text not null,
  status text not null default 'active'
    check (status in ('active','paused','completed','archived')),
  country_iso2 text,
  target_country_iso2s text[] not null default '{}',
  target_date date,
  confidentiality text not null default 'workspace'
    check (confidentiality in ('workspace','restricted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint network_missions_name_chk check (length(btrim(name)) between 1 and 160),
  constraint network_missions_objective_chk check (length(btrim(objective)) between 1 and 2000),
  constraint network_missions_country_chk check (country_iso2 is null or country_iso2 ~ '^[A-Z]{2}$')
);

create index network_missions_workspace_status_idx
  on public.network_missions(workspace_id, status, updated_at desc);

create table public.network_mission_requirements (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.network_missions(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  requirement_type text not null,
  label text not null,
  description text,
  hard_requirement boolean not null default true,
  capability_code text,
  licence_activity text,
  country_iso2 text,
  expected_value jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active','satisfied','waived','archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint network_mission_requirements_type_chk check (length(btrim(requirement_type)) between 1 and 80),
  constraint network_mission_requirements_label_chk check (length(btrim(label)) between 1 and 240),
  constraint network_mission_requirements_country_chk check (country_iso2 is null or country_iso2 ~ '^[A-Z]{2}$')
);

create index network_mission_requirements_mission_idx
  on public.network_mission_requirements(mission_id, status, sort_order, created_at);

-- Resolution bridge only. This never becomes a second entity master.
create table public.network_source_entity_links (
  id uuid primary key default gen_random_uuid(),
  source_kind text not null,
  source_id text not null,
  entity_id uuid references public.entities(id) on delete set null,
  resolution_status text not null default 'unresolved'
    check (resolution_status in ('unresolved','candidate','resolved','rejected')),
  resolution_method text,
  confidence numeric(5,4),
  evidence_id uuid references public.hv_evidence(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint network_source_entity_links_kind_chk check (length(btrim(source_kind)) between 1 and 80),
  constraint network_source_entity_links_source_id_chk check (length(btrim(source_id)) between 1 and 240),
  constraint network_source_entity_links_confidence_chk check (confidence is null or confidence between 0 and 1),
  unique(source_kind, source_id)
);

create index network_source_entity_links_entity_idx
  on public.network_source_entity_links(entity_id)
  where entity_id is not null;
create index network_source_entity_links_queue_idx
  on public.network_source_entity_links(resolution_status, updated_at desc);

create table public.network_introductions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  mission_id uuid references public.network_missions(id) on delete set null,
  requester_user_id uuid not null references auth.users(id) on delete restrict,
  target_entity_id uuid references public.entities(id) on delete set null,
  target_source_kind text,
  target_source_id text,
  reason text not null,
  requested_disclosure_scope text not null default 'identity_and_business_context',
  status text not null default 'draft'
    check (status in (
      'draft','review','disclosure_pending','consent_pending','approved','introduced',
      'converted','declined','expired','closed'
    )),
  consent_required boolean not null default true,
  introduced_at timestamptz,
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint network_introductions_target_chk check (
    target_entity_id is not null
    or (target_source_kind is not null and length(btrim(target_source_kind)) > 0
        and target_source_id is not null and length(btrim(target_source_id)) > 0)
  ),
  constraint network_introductions_reason_chk check (length(btrim(reason)) between 1 and 2000)
);

create index network_introductions_workspace_status_idx
  on public.network_introductions(workspace_id, status, updated_at desc);
create index network_introductions_mission_idx
  on public.network_introductions(mission_id)
  where mission_id is not null;
create index network_introductions_target_entity_idx
  on public.network_introductions(target_entity_id)
  where target_entity_id is not null;

create table public.network_introduction_events (
  id uuid primary key default gen_random_uuid(),
  introduction_id uuid not null references public.network_introductions(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  from_status text,
  to_status text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint network_introduction_events_type_chk check (length(btrim(event_type)) between 1 and 100)
);

create index network_introduction_events_intro_idx
  on public.network_introduction_events(introduction_id, created_at desc);
create index network_introduction_events_workspace_idx
  on public.network_introduction_events(workspace_id, created_at desc);

create table public.network_interactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  mission_id uuid references public.network_missions(id) on delete set null,
  introduction_id uuid references public.network_introductions(id) on delete set null,
  entity_id uuid references public.entities(id) on delete set null,
  source_kind text,
  source_id text,
  interaction_type text not null,
  channel text,
  direction text not null default 'outbound'
    check (direction in ('outbound','inbound','mutual','internal')),
  occurred_at timestamptz not null default now(),
  summary text not null,
  outcome text,
  classification text not null default 'workspace'
    check (classification in ('workspace','restricted')),
  created_by uuid not null references auth.users(id) on delete restrict,
  supersedes_interaction_id uuid references public.network_interactions(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint network_interactions_subject_chk check (
    entity_id is not null
    or (source_kind is not null and length(btrim(source_kind)) > 0
        and source_id is not null and length(btrim(source_id)) > 0)
  ),
  constraint network_interactions_type_chk check (length(btrim(interaction_type)) between 1 and 100),
  constraint network_interactions_summary_chk check (length(btrim(summary)) between 1 and 4000),
  constraint network_interactions_supersedes_chk check (supersedes_interaction_id is null or supersedes_interaction_id <> id)
);

create index network_interactions_workspace_time_idx
  on public.network_interactions(workspace_id, occurred_at desc);
create index network_interactions_mission_idx
  on public.network_interactions(mission_id, occurred_at desc)
  where mission_id is not null;
create index network_interactions_entity_idx
  on public.network_interactions(entity_id, occurred_at desc)
  where entity_id is not null;
create index network_interactions_source_idx
  on public.network_interactions(source_kind, source_id, occurred_at desc)
  where source_kind is not null and source_id is not null;

create trigger network_missions_set_updated_at
before update on public.network_missions
for each row execute function public.hv_transaction_set_updated_at();

create trigger network_mission_requirements_set_updated_at
before update on public.network_mission_requirements
for each row execute function public.hv_transaction_set_updated_at();

create trigger network_source_entity_links_set_updated_at
before update on public.network_source_entity_links
for each row execute function public.hv_transaction_set_updated_at();

create trigger network_introductions_set_updated_at
before update on public.network_introductions
for each row execute function public.hv_transaction_set_updated_at();

-- PostgREST exposes only `api` in this project. Keep browser access on simple,
-- security-invoker views so base-table RLS remains authoritative.
create or replace view api.network_missions
with (security_invoker = true) as
select id, workspace_id, created_by, name, objective, status, country_iso2,
       target_country_iso2s, target_date, confidentiality, created_at, updated_at
from public.network_missions;

create or replace view api.network_mission_requirements
with (security_invoker = true) as
select id, mission_id, created_by, requirement_type, label, description,
       hard_requirement, capability_code, licence_activity, country_iso2,
       expected_value, status, sort_order, created_at, updated_at
from public.network_mission_requirements;

create or replace view api.network_introductions
with (security_invoker = true) as
select id, workspace_id, mission_id, requester_user_id, target_entity_id,
       target_source_kind, target_source_id, reason, requested_disclosure_scope,
       status, consent_required, introduced_at, outcome, created_at, updated_at
from public.network_introductions;

create or replace view api.network_introduction_events
with (security_invoker = true) as
select id, introduction_id, workspace_id, actor_user_id, event_type,
       from_status, to_status, detail, created_at
from public.network_introduction_events;

create or replace view api.network_interactions
with (security_invoker = true) as
select id, workspace_id, mission_id, introduction_id, entity_id, source_kind,
       source_id, interaction_type, channel, direction, occurred_at, summary,
       outcome, classification, created_by, supersedes_interaction_id, created_at
from public.network_interactions;

comment on table public.network_missions is 'Workspace-private commercial objectives used by Network Command. Workspaces remain the tenancy boundary.';
comment on table public.network_source_entity_links is 'Resolution bridge from domain records to public.entities; never a parallel entity registry.';
comment on table public.network_interactions is 'Workspace-private append-oriented relationship interaction memory.';
comment on table public.network_introductions is 'Controlled Network introduction lifecycle with disclosure and consent gates.';

commit;
