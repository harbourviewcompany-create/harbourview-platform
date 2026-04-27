alter table signals add column if not exists content_hash text;

create unique index if not exists idx_signals_workspace_content_hash on signals(workspace_id, content_hash) where content_hash is not null;

create table if not exists ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','processing','completed','failed')),
  input jsonb not null,
  result jsonb not null default '{}'::jsonb,
  error text,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists opportunity_triggers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  signal_id uuid references signals(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  trigger_type text not null check (trigger_type in ('auto_deal','outbound','review')),
  priority integer not null default 3 check (priority between 1 and 5),
  status text not null default 'queued' check (status in ('queued','ready','sent','dismissed','failed')),
  reason text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ingestion_jobs_workspace_status on ingestion_jobs(workspace_id,status,created_at);
create index if not exists idx_opportunity_triggers_workspace_status on opportunity_triggers(workspace_id,status,priority,created_at);
create index if not exists idx_opportunity_triggers_signal_id on opportunity_triggers(signal_id);
create index if not exists idx_opportunity_triggers_deal_id on opportunity_triggers(deal_id);

alter table ingestion_jobs enable row level security;
alter table opportunity_triggers enable row level security;

drop policy if exists ingestion_jobs_workspace_read on ingestion_jobs;
drop policy if exists ingestion_jobs_workspace_write on ingestion_jobs;
create policy ingestion_jobs_workspace_read on ingestion_jobs for select to authenticated using (workspace_id = (select default_workspace_id from profiles where id = auth.uid()));
create policy ingestion_jobs_workspace_write on ingestion_jobs for all to authenticated using (workspace_id = (select default_workspace_id from profiles where id = auth.uid()) and exists (select 1 from profiles where id = auth.uid() and platform_role in ('admin','analyst'))) with check (workspace_id = (select default_workspace_id from profiles where id = auth.uid()) and exists (select 1 from profiles where id = auth.uid() and platform_role in ('admin','analyst')));

drop policy if exists opportunity_triggers_workspace_read on opportunity_triggers;
drop policy if exists opportunity_triggers_workspace_write on opportunity_triggers;
create policy opportunity_triggers_workspace_read on opportunity_triggers for select to authenticated using (workspace_id = (select default_workspace_id from profiles where id = auth.uid()));
create policy opportunity_triggers_workspace_write on opportunity_triggers for all to authenticated using (workspace_id = (select default_workspace_id from profiles where id = auth.uid()) and exists (select 1 from profiles where id = auth.uid() and platform_role in ('admin','analyst'))) with check (workspace_id = (select default_workspace_id from profiles where id = auth.uid()) and exists (select 1 from profiles where id = auth.uid() and platform_role in ('admin','analyst')));
