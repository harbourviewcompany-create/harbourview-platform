-- Relationship Intelligence V1
-- Private relationship intelligence layer for reliability, repeat-counterparty tracking and routing recommendations.

create table if not exists relationship_intelligence_profiles (
  id uuid primary key default gen_random_uuid(),
  counterparty_name text not null,
  counterparty_type text not null default 'company',
  associated_profile_slug text,
  associated_drop_ids text[] default '{}',
  preferred_markets text[] default '{}',
  avoided_markets text[] default '{}',
  relationship_strength_score integer not null default 0 check (relationship_strength_score between 0 and 100),
  reliability_score integer not null default 0 check (reliability_score between 0 and 100),
  responsiveness_score integer not null default 0 check (responsiveness_score between 0 and 100),
  execution_score integer not null default 0 check (execution_score between 0 and 100),
  successful_introductions_count integer not null default 0,
  failed_introductions_count integer not null default 0,
  repeat_counterparty_count integer not null default 0,
  last_successful_intro_at timestamptz,
  last_contact_at timestamptz,
  preferred_operator text,
  operator_notes text,
  private_relationship_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists relationship_intelligence_events (
  id uuid primary key default gen_random_uuid(),
  relationship_profile_id uuid references relationship_intelligence_profiles(id) on delete cascade,
  routing_record_id uuid references genetics_routing_records(id) on delete set null,
  event_type text not null,
  event_summary text not null,
  market text,
  outcome text,
  operator text,
  created_at timestamptz not null default now()
);

create index if not exists idx_relationship_intelligence_profiles_name
on relationship_intelligence_profiles(counterparty_name);

create index if not exists idx_relationship_intelligence_profiles_type
on relationship_intelligence_profiles(counterparty_type);

create index if not exists idx_relationship_intelligence_profiles_reliability
on relationship_intelligence_profiles(reliability_score desc);

create index if not exists idx_relationship_intelligence_profiles_strength
on relationship_intelligence_profiles(relationship_strength_score desc);

create index if not exists idx_relationship_intelligence_events_profile
on relationship_intelligence_events(relationship_profile_id);

alter table relationship_intelligence_profiles enable row level security;
alter table relationship_intelligence_events enable row level security;

create policy relationship_intelligence_profiles_admin_operator_all
on relationship_intelligence_profiles
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

create policy relationship_intelligence_profiles_analyst_read
on relationship_intelligence_profiles
for select
using (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator', 'analyst')
  )
);

create policy relationship_intelligence_events_admin_operator_all
on relationship_intelligence_events
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

create policy relationship_intelligence_events_analyst_read
on relationship_intelligence_events
for select
using (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator', 'analyst')
  )
);
