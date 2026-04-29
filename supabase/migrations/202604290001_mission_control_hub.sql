-- Harbourview Mission Control Hub
-- Persistence layer for missions, agent runs, audit decisions and execution state.

create extension if not exists pgcrypto;

create table if not exists public.mission_control_missions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null default 'New Mission',
  objective text not null default '',
  success_condition text not null default '',
  constraints text not null default '',
  source_material text not null default '',
  status text not null default 'Draft' check (status in ('Draft', 'Assigned', 'Returned', 'Audited', 'Approved', 'Executed')),
  accepted_findings text not null default '',
  rejected_findings text not null default '',
  contradictions text not null default '',
  final_decision text not null default '',
  next_action text not null default ''
);

create table if not exists public.mission_control_agent_outputs (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.mission_control_missions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  agent text not null check (agent in ('ChatGPT', 'Claude', 'Perplexity', 'Gemini')),
  output text not null default '',
  verdict text not null default '',
  blockers text not null default '',
  confidence text not null default '',
  provider text not null default '',
  model text not null default '',
  unique (mission_id, agent)
);

create table if not exists public.mission_control_audit_events (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.mission_control_missions(id) on delete cascade,
  created_at timestamptz not null default now(),
  action text not null,
  actor text not null default 'mission-control',
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists mission_control_missions_status_idx on public.mission_control_missions(status);
create index if not exists mission_control_missions_updated_at_idx on public.mission_control_missions(updated_at desc);
create index if not exists mission_control_agent_outputs_mission_idx on public.mission_control_agent_outputs(mission_id);
create index if not exists mission_control_audit_events_mission_idx on public.mission_control_audit_events(mission_id, created_at desc);

create or replace function public.touch_mission_control_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_mission_control_missions_updated_at on public.mission_control_missions;
create trigger touch_mission_control_missions_updated_at
before update on public.mission_control_missions
for each row execute function public.touch_mission_control_updated_at();

drop trigger if exists touch_mission_control_agent_outputs_updated_at on public.mission_control_agent_outputs;
create trigger touch_mission_control_agent_outputs_updated_at
before update on public.mission_control_agent_outputs
for each row execute function public.touch_mission_control_updated_at();

alter table public.mission_control_missions enable row level security;
alter table public.mission_control_agent_outputs enable row level security;
alter table public.mission_control_audit_events enable row level security;

-- No anonymous read/write policies. API routes must use service role server-side.
