-- Genetics Routing Operations V1
-- Private persistence layer for controlled genetics access requests and introduction events.

create table if not exists genetics_routing_records (
  id uuid primary key default gen_random_uuid(),
  profile_slug text not null,
  drop_id text not null,
  requester_company text not null,
  requester_country text,
  requester_email text not null,
  intent text not null,
  target_market text,
  score integer not null default 0 check (score between 0 and 100),
  score_band text not null,
  status text not null default 'new_request',
  buyer_permission_approved boolean not null default false,
  holder_permission_approved boolean not null default false,
  introduction_ready boolean not null default false,
  next_action text,
  private_intro_draft text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists genetics_routing_events (
  id uuid primary key default gen_random_uuid(),
  routing_record_id uuid references genetics_routing_records(id) on delete cascade,
  event_type text not null,
  event_summary text not null,
  actor text default 'system',
  private_notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_genetics_routing_records_status on genetics_routing_records(status);
create index if not exists idx_genetics_routing_records_score on genetics_routing_records(score desc);
create index if not exists idx_genetics_routing_events_record on genetics_routing_events(routing_record_id);

alter table genetics_routing_records enable row level security;
alter table genetics_routing_events enable row level security;

create policy genetics_routing_records_admin_operator_all
on genetics_routing_records
for all
using (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator')
  )
)
with check (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator')
  )
);

create policy genetics_routing_records_analyst_read
on genetics_routing_records
for select
using (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator', 'analyst')
  )
);

create policy genetics_routing_events_admin_operator_all
on genetics_routing_events
for all
using (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator')
  )
)
with check (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator')
  )
);

create policy genetics_routing_events_analyst_read
on genetics_routing_events
for select
using (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator', 'analyst')
  )
);
