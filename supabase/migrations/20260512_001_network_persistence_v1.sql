-- Harbourview Network Pass 4 persistence (additive schema + RLS only).
-- Private review tables are admin/operator-only. Public projection exposes published rows only.

create table if not exists public.network_review_items (
  id uuid primary key default gen_random_uuid(),
  object_type text not null,
  source_ref text,
  title_internal text not null,
  title_public_draft text,
  country_code text,
  country_label text,
  category_label text,
  review_status text not null default 'submitted',
  claim_risk text not null default 'medium',
  private_analyst_notes text,
  public_summary_draft text,
  suppressed_fields text[] not null default '{}'::text[],
  requires_legal_review boolean not null default false,
  requires_compliance_review boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint network_review_items_object_type_check check (
    object_type in ('country', 'category', 'listing', 'wanted_request', 'intelligence_brief')
  ),
  constraint network_review_items_review_status_check check (
    review_status in ('submitted', 'under_review', 'needs_clarification', 'approved_public_summary', 'rejected', 'archived')
  ),
  constraint network_review_items_claim_risk_check check (claim_risk in ('low', 'medium', 'high')),
  constraint network_review_items_title_internal_not_empty check (length(trim(title_internal)) > 0)
);

create table if not exists public.network_intelligence_summaries (
  id uuid primary key default gen_random_uuid(),
  review_item_id uuid not null references public.network_review_items(id) on delete cascade,
  summary_type text not null,
  summary_title text not null,
  summary_body text not null,
  confidence_label text,
  generated_by text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint network_intel_summaries_summary_type_check check (
    summary_type in ('internal_brief', 'public_draft', 'risk_assessment', 'redaction_note')
  ),
  constraint network_intel_summaries_summary_title_not_empty check (length(trim(summary_title)) > 0),
  constraint network_intel_summaries_summary_body_not_empty check (length(trim(summary_body)) > 0)
);

create table if not exists public.network_public_projections (
  id uuid primary key default gen_random_uuid(),
  review_item_id uuid not null unique references public.network_review_items(id) on delete restrict,
  object_type text not null,
  slug text not null,
  name text not null,
  public_summary text not null,
  country_label text,
  category_label text,
  published_state text not null default 'published',
  published_at timestamptz not null default now(),
  published_by uuid references auth.users(id) on delete set null,
  is_active boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint network_public_projections_object_type_check check (
    object_type in ('country', 'category', 'listing', 'wanted_request', 'intelligence_brief')
  ),
  constraint network_public_projections_published_state_check check (published_state in ('published', 'archived')),
  constraint network_public_projections_slug_not_empty check (length(trim(slug)) > 0),
  constraint network_public_projections_name_not_empty check (length(trim(name)) > 0),
  constraint network_public_projections_summary_not_empty check (length(trim(public_summary)) > 0),
  constraint network_public_projections_version_check check (version > 0),
  constraint network_public_projections_object_slug_version_key unique (object_type, slug, version)
);

create table if not exists public.network_review_events (
  id uuid primary key default gen_random_uuid(),
  review_item_id uuid not null references public.network_review_items(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  event_note text,
  event_payload jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint network_review_events_type_check check (
    event_type in ('created', 'status_changed', 'note_added', 'public_projection_requested', 'public_projection_approved', 'rejected', 'archived')
  )
);

create index if not exists network_review_items_status_created_idx
  on public.network_review_items (review_status, created_at desc);
create index if not exists network_review_items_type_risk_created_idx
  on public.network_review_items (object_type, claim_risk, created_at desc);
create index if not exists network_review_items_active_queue_idx
  on public.network_review_items (created_at desc)
  where review_status in ('submitted', 'under_review', 'needs_clarification');

create index if not exists network_intelligence_summaries_review_item_idx
  on public.network_intelligence_summaries (review_item_id, created_at desc);
create index if not exists network_intelligence_summaries_type_idx
  on public.network_intelligence_summaries (summary_type, created_at desc);

create index if not exists network_public_projections_published_idx
  on public.network_public_projections (published_state, is_active, published_at desc);
create unique index if not exists network_public_projections_slug_active_version_idx
  on public.network_public_projections (slug, is_active, version);

create index if not exists network_review_events_review_item_created_idx
  on public.network_review_events (review_item_id, created_at desc);
create index if not exists network_review_events_type_created_idx
  on public.network_review_events (event_type, created_at desc);

alter table public.network_review_items enable row level security;
alter table public.network_intelligence_summaries enable row level security;
alter table public.network_public_projections enable row level security;
alter table public.network_review_events enable row level security;

revoke all on public.network_review_items from anon;
revoke all on public.network_intelligence_summaries from anon;
revoke all on public.network_public_projections from anon;
revoke all on public.network_review_events from anon;

revoke all on public.network_review_items from authenticated;
revoke all on public.network_intelligence_summaries from authenticated;
revoke all on public.network_public_projections from authenticated;
revoke all on public.network_review_events from authenticated;

grant select, insert, update, delete on public.network_review_items to authenticated;
grant select, insert, update, delete on public.network_intelligence_summaries to authenticated;
grant select, insert, update, delete on public.network_public_projections to authenticated;
grant select, insert, update, delete on public.network_review_events to authenticated;
grant select on public.network_public_projections to anon;

drop policy if exists network_review_items_admin_operator_only on public.network_review_items;
drop policy if exists network_intelligence_summaries_admin_operator_only on public.network_intelligence_summaries;
drop policy if exists network_public_projections_admin_operator_only on public.network_public_projections;
drop policy if exists network_public_projections_published_read on public.network_public_projections;
drop policy if exists network_review_events_admin_operator_only on public.network_review_events;

create policy network_review_items_admin_operator_only
  on public.network_review_items
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('admin', 'operator')
    )
  )
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('admin', 'operator')
    )
  );

create policy network_intelligence_summaries_admin_operator_only
  on public.network_intelligence_summaries
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('admin', 'operator')
    )
  )
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('admin', 'operator')
    )
  );

create policy network_public_projections_published_read
  on public.network_public_projections
  for select
  to anon, authenticated
  using (published_state = 'published' and is_active = true);

create policy network_public_projections_admin_operator_only
  on public.network_public_projections
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('admin', 'operator')
    )
  )
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('admin', 'operator')
    )
  );

create policy network_review_events_admin_operator_only
  on public.network_review_events
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('admin', 'operator')
    )
  )
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('admin', 'operator')
    )
  );

comment on table public.network_review_items is 'Private canonical Harbourview Network review records. Admin/operator access only.';
comment on table public.network_intelligence_summaries is 'Private analyst intelligence summaries tied to review items. Admin/operator access only.';
comment on table public.network_public_projections is 'Public-safe Harbourview Network projection rows published through explicit review action.';
comment on table public.network_review_events is 'Private append-only audit ledger for Harbourview Network review actions.';
