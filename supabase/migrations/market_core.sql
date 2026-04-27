create table if not exists counterparties (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null check (length(trim(name)) >= 2),
  type text not null check (type in ('buyer','seller','investor','operator','distributor','pharmacy','processor','supplier','other')),
  jurisdiction text,
  website text,
  notes text,
  status text not null default 'active' check (status in ('active','watchlist','blocked','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null check (length(trim(title)) >= 3),
  status text not null default 'open' check (status in ('open','qualified','negotiation','closed','lost','archived')),
  counterparty_id uuid references counterparties(id) on delete set null,
  signal_id uuid references signals(id) on delete set null,
  value_estimate numeric,
  priority integer not null default 3 check (priority between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists market_audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table counterparties add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table deals add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table market_audit_events add column if not exists workspace_id uuid references workspaces(id) on delete cascade;

alter table signals add column if not exists score numeric not null default 0;
alter table signals add column if not exists linked_counterparty_id uuid references counterparties(id) on delete set null;

create index if not exists idx_counterparties_workspace_id on counterparties(workspace_id);
create index if not exists idx_counterparties_type on counterparties(type);
create index if not exists idx_counterparties_status on counterparties(status);
create index if not exists idx_deals_workspace_id on deals(workspace_id);
create index if not exists idx_deals_status on deals(status);
create index if not exists idx_deals_counterparty_id on deals(counterparty_id);
create index if not exists idx_deals_signal_id on deals(signal_id);
create index if not exists idx_market_audit_events_workspace_id on market_audit_events(workspace_id);
create index if not exists idx_market_audit_events_entity on market_audit_events(entity_type, entity_id);

alter table counterparties enable row level security;
alter table deals enable row level security;
alter table market_audit_events enable row level security;

drop policy if exists counterparties_authenticated_read on counterparties;
drop policy if exists counterparties_authenticated_write on counterparties;
drop policy if exists counterparties_workspace_read on counterparties;
drop policy if exists counterparties_workspace_write on counterparties;
create policy counterparties_workspace_read on counterparties for select to authenticated using (
  workspace_id = (select default_workspace_id from profiles where id = auth.uid())
);
create policy counterparties_workspace_write on counterparties for all to authenticated using (
  workspace_id = (select default_workspace_id from profiles where id = auth.uid())
  and exists (select 1 from profiles where id = auth.uid() and platform_role in ('admin','analyst'))
) with check (
  workspace_id = (select default_workspace_id from profiles where id = auth.uid())
  and exists (select 1 from profiles where id = auth.uid() and platform_role in ('admin','analyst'))
);

drop policy if exists deals_authenticated_read on deals;
drop policy if exists deals_authenticated_write on deals;
drop policy if exists deals_workspace_read on deals;
drop policy if exists deals_workspace_write on deals;
create policy deals_workspace_read on deals for select to authenticated using (
  workspace_id = (select default_workspace_id from profiles where id = auth.uid())
);
create policy deals_workspace_write on deals for all to authenticated using (
  workspace_id = (select default_workspace_id from profiles where id = auth.uid())
  and exists (select 1 from profiles where id = auth.uid() and platform_role in ('admin','analyst'))
) with check (
  workspace_id = (select default_workspace_id from profiles where id = auth.uid())
  and exists (select 1 from profiles where id = auth.uid() and platform_role in ('admin','analyst'))
);

drop policy if exists market_audit_authenticated_read on market_audit_events;
drop policy if exists market_audit_authenticated_insert on market_audit_events;
drop policy if exists market_audit_workspace_read on market_audit_events;
drop policy if exists market_audit_workspace_insert on market_audit_events;
create policy market_audit_workspace_read on market_audit_events for select to authenticated using (
  workspace_id = (select default_workspace_id from profiles where id = auth.uid())
);
create policy market_audit_workspace_insert on market_audit_events for insert to authenticated with check (
  workspace_id = (select default_workspace_id from profiles where id = auth.uid())
  and exists (select 1 from profiles where id = auth.uid() and platform_role in ('admin','analyst'))
);
