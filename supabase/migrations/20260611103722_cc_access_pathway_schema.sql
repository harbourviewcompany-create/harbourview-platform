-- cc_access_pathway_schema: Access Pathway Command Centre tables
-- Applied: 2026-06-11; stub created to reconcile supabase migration history

create table if not exists public.cc_pathway_templates (
  id           uuid primary key default gen_random_uuid(),
  country_iso2 text not null,
  role_id      text not null,
  name         text not null,
  description  text,
  total_steps  int  not null default 6,
  is_active    bool not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (country_iso2, role_id)
);

create table if not exists public.cc_pathway_steps (
  id               uuid primary key default gen_random_uuid(),
  template_id      uuid not null references public.cc_pathway_templates(id) on delete cascade,
  step_number      int  not null,
  title            text not null,
  description      text,
  unlock_condition text not null default 'previous_step_complete',
  created_at       timestamptz not null default now(),
  unique (template_id, step_number)
);

create table if not exists public.cc_pathway_step_requirements (
  id            uuid primary key default gen_random_uuid(),
  step_id       uuid not null references public.cc_pathway_steps(id) on delete cascade,
  title         text not null,
  description   text,
  evidence_type text not null default 'document',
  is_required   bool not null default true,
  sort_order    int  not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.cc_org_pathway_progress (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null,
  template_id    uuid not null references public.cc_pathway_templates(id),
  current_step   int  not null default 1,
  status         text not null default 'in_progress',
  started_at     timestamptz not null default now(),
  completed_at   timestamptz,
  last_action_at timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (org_id, template_id)
);

create table if not exists public.cc_org_requirement_status (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null,
  requirement_id       uuid not null references public.cc_pathway_step_requirements(id),
  status               text not null default 'pending',
  evidence_document_id uuid,
  licence_id           uuid,
  notes                text,
  submitted_at         timestamptz,
  reviewed_at          timestamptz,
  reviewed_by          uuid,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (org_id, requirement_id)
);

create index if not exists cc_pathway_steps_template_id_idx
  on public.cc_pathway_steps(template_id);
create index if not exists cc_pathway_step_reqs_step_id_idx
  on public.cc_pathway_step_requirements(step_id);
create index if not exists cc_org_pathway_progress_org_id_idx
  on public.cc_org_pathway_progress(org_id);
create index if not exists cc_org_pathway_progress_template_id_idx
  on public.cc_org_pathway_progress(template_id);
create index if not exists cc_org_req_status_org_id_idx
  on public.cc_org_requirement_status(org_id);
create index if not exists cc_org_req_status_requirement_id_idx
  on public.cc_org_requirement_status(requirement_id);
create index if not exists cc_org_req_status_status_idx
  on public.cc_org_requirement_status(status)
  where status in ('in_review', 'verified');

alter table public.cc_pathway_templates         enable row level security;
alter table public.cc_pathway_steps             enable row level security;
alter table public.cc_pathway_step_requirements enable row level security;
alter table public.cc_org_pathway_progress      enable row level security;
alter table public.cc_org_requirement_status    enable row level security;

drop policy if exists cc_pathway_templates_auth_read         on public.cc_pathway_templates;
drop policy if exists cc_pathway_steps_auth_read             on public.cc_pathway_steps;
drop policy if exists cc_pathway_step_reqs_auth_read         on public.cc_pathway_step_requirements;
drop policy if exists cc_org_pathway_progress_member_read    on public.cc_org_pathway_progress;
drop policy if exists cc_org_pathway_progress_member_insert  on public.cc_org_pathway_progress;
drop policy if exists cc_org_pathway_progress_member_update  on public.cc_org_pathway_progress;
drop policy if exists cc_org_req_status_member_read          on public.cc_org_requirement_status;
drop policy if exists cc_org_req_status_member_insert        on public.cc_org_requirement_status;
drop policy if exists cc_org_req_status_member_update        on public.cc_org_requirement_status;

create policy cc_pathway_templates_auth_read
  on public.cc_pathway_templates for select to authenticated using (is_active = true);
create policy cc_pathway_steps_auth_read
  on public.cc_pathway_steps for select to authenticated using (true);
create policy cc_pathway_step_reqs_auth_read
  on public.cc_pathway_step_requirements for select to authenticated using (true);
create policy cc_org_pathway_progress_member_read
  on public.cc_org_pathway_progress for select to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_org_pathway_progress_member_insert
  on public.cc_org_pathway_progress for insert to authenticated
  with check (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_org_pathway_progress_member_update
  on public.cc_org_pathway_progress for update to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_org_req_status_member_read
  on public.cc_org_requirement_status for select to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_org_req_status_member_insert
  on public.cc_org_requirement_status for insert to authenticated
  with check (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_org_req_status_member_update
  on public.cc_org_requirement_status for update to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
