-- Harbourview Marketplace v1 baseline
-- Status: DRAFT FOR SECURITY REVIEW BEFORE APPLICATION
-- Canonical: PROJECT_CANONICAL.updated.md dated 2026-04-27
-- Rule: public views must be explicit, sanitized and must never SELECT *

create extension if not exists pgcrypto;

do $$ begin
  create type public.marketplace_section as enum (
    'new_products',
    'used_surplus',
    'cannabis_inventory',
    'wanted_requests',
    'services',
    'business_opportunities',
    'supplier_directory'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.marketplace_lifecycle_status as enum (
    'draft',
    'submitted',
    'under_review',
    'approved',
    'rejected',
    'published',
    'archived'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.marketplace_review_status as enum (
    'pending',
    'approved',
    'rejected',
    'changes_requested'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.marketplace_visibility as enum (
    'private',
    'unlisted',
    'public'
  );
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'role', ''),
    'anonymous'
  );
$$;

create or replace function public.is_marketplace_admin()
returns boolean
language sql
stable
as $$
  select public.current_app_role() in ('admin', 'owner', 'operator');
$$;

create table if not exists public.marketplace_suppliers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  supplier_type text not null,
  country text,
  region text,
  website_url text,
  public_summary text,
  capabilities text[] not null default '{}',
  certifications text[] not null default '{}',
  lifecycle_status public.marketplace_lifecycle_status not null default 'draft',
  review_status public.marketplace_review_status not null default 'pending',
  visibility public.marketplace_visibility not null default 'private',
  submitted_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint marketplace_suppliers_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.marketplace_suppliers(id) on delete set null,
  section public.marketplace_section not null,
  slug text not null unique,
  title text not null,
  short_description text not null,
  description text,
  category text not null,
  subcategory text,
  condition text,
  origin_country text,
  location_country text,
  location_region text,
  availability_status text not null default 'available',
  price_display text,
  minimum_order_display text,
  compliance_tags text[] not null default '{}',
  image_urls text[] not null default '{}',
  lifecycle_status public.marketplace_lifecycle_status not null default 'draft',
  review_status public.marketplace_review_status not null default 'pending',
  visibility public.marketplace_visibility not null default 'private',
  submitted_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint marketplace_listings_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.marketplace_wanted_requests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  short_description text not null,
  category text not null,
  subcategory text,
  target_country text,
  target_region text,
  quantity_display text,
  budget_display text,
  urgency text,
  compliance_requirements text[] not null default '{}',
  lifecycle_status public.marketplace_lifecycle_status not null default 'draft',
  review_status public.marketplace_review_status not null default 'pending',
  visibility public.marketplace_visibility not null default 'private',
  submitted_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint marketplace_wanted_requests_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.marketplace_inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.marketplace_listings(id) on delete set null,
  wanted_request_id uuid references public.marketplace_wanted_requests(id) on delete set null,
  supplier_id uuid references public.marketplace_suppliers(id) on delete set null,
  inquiry_type text not null default 'general',
  buyer_name text not null,
  buyer_company text,
  buyer_email text not null,
  buyer_phone text,
  buyer_country text,
  message text not null,
  consent_to_contact boolean not null default false,
  status text not null default 'new',
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint marketplace_inquiries_target_check check (
    listing_id is not null
    or wanted_request_id is not null
    or supplier_id is not null
  )
);

create table if not exists public.marketplace_listing_private (
  listing_id uuid primary key references public.marketplace_listings(id) on delete cascade,
  contact_name text,
  contact_email text,
  contact_phone text,
  supplier_legal_name text,
  source_url text,
  estimated_deal_value numeric(14,2),
  monetization_path text,
  lead_quality text,
  admin_priority integer,
  internal_notes text,
  analyst_notes text,
  reviewer_notes text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_wanted_private (
  wanted_request_id uuid primary key references public.marketplace_wanted_requests(id) on delete cascade,
  contact_name text,
  contact_email text,
  contact_phone text,
  buyer_legal_name text,
  estimated_deal_value numeric(14,2),
  monetization_path text,
  lead_quality text,
  admin_priority integer,
  internal_notes text,
  analyst_notes text,
  reviewer_notes text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_supplier_private (
  supplier_id uuid primary key references public.marketplace_suppliers(id) on delete cascade,
  legal_name text,
  contact_name text,
  contact_email text,
  contact_phone text,
  private_supplier_contacts jsonb not null default '[]'::jsonb,
  admin_priority integer,
  internal_notes text,
  analyst_notes text,
  reviewer_notes text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_review_queue (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  review_status public.marketplace_review_status not null default 'pending',
  assigned_to uuid references auth.users(id) on delete set null,
  reviewer_notes text,
  rejection_reason text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_review_queue_entity_type_check check (
    entity_type in ('listing', 'wanted_request', 'supplier', 'inquiry')
  )
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  request_id text,
  ip_hash text,
  user_agent_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists marketplace_listings_public_idx
  on public.marketplace_listings (section, category, published_at desc)
  where lifecycle_status = 'published'
    and review_status = 'approved'
    and visibility = 'public'
    and deleted_at is null;

create index if not exists marketplace_wanted_requests_public_idx
  on public.marketplace_wanted_requests (category, published_at desc)
  where lifecycle_status = 'published'
    and review_status = 'approved'
    and visibility = 'public'
    and deleted_at is null;

create index if not exists marketplace_suppliers_public_idx
  on public.marketplace_suppliers (supplier_type, country, display_name)
  where lifecycle_status = 'published'
    and review_status = 'approved'
    and visibility = 'public'
    and deleted_at is null;

create trigger set_marketplace_suppliers_updated_at
before update on public.marketplace_suppliers
for each row execute function public.set_updated_at();

create trigger set_marketplace_listings_updated_at
before update on public.marketplace_listings
for each row execute function public.set_updated_at();

create trigger set_marketplace_wanted_requests_updated_at
before update on public.marketplace_wanted_requests
for each row execute function public.set_updated_at();

create trigger set_marketplace_inquiries_updated_at
before update on public.marketplace_inquiries
for each row execute function public.set_updated_at();

create trigger set_marketplace_listing_private_updated_at
before update on public.marketplace_listing_private
for each row execute function public.set_updated_at();

create trigger set_marketplace_wanted_private_updated_at
before update on public.marketplace_wanted_private
for each row execute function public.set_updated_at();

create trigger set_marketplace_supplier_private_updated_at
before update on public.marketplace_supplier_private
for each row execute function public.set_updated_at();

create trigger set_marketplace_review_queue_updated_at
before update on public.marketplace_review_queue
for each row execute function public.set_updated_at();

alter table public.marketplace_suppliers enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.marketplace_wanted_requests enable row level security;
alter table public.marketplace_inquiries enable row level security;
alter table public.marketplace_listing_private enable row level security;
alter table public.marketplace_wanted_private enable row level security;
alter table public.marketplace_supplier_private enable row level security;
alter table public.marketplace_review_queue enable row level security;
alter table public.audit_events enable row level security;

create policy "Public may read approved suppliers"
on public.marketplace_suppliers
for select
to anon, authenticated
using (
  lifecycle_status = 'published'
  and review_status = 'approved'
  and visibility = 'public'
  and deleted_at is null
);

create policy "Public may read approved listings"
on public.marketplace_listings
for select
to anon, authenticated
using (
  lifecycle_status = 'published'
  and review_status = 'approved'
  and visibility = 'public'
  and deleted_at is null
);

create policy "Public may read approved wanted requests"
on public.marketplace_wanted_requests
for select
to anon, authenticated
using (
  lifecycle_status = 'published'
  and review_status = 'approved'
  and visibility = 'public'
  and deleted_at is null
);

create policy "Authenticated users may submit suppliers"
on public.marketplace_suppliers
for insert
to authenticated
with check (submitted_by = auth.uid());

create policy "Authenticated users may submit listings"
on public.marketplace_listings
for insert
to authenticated
with check (submitted_by = auth.uid());

create policy "Authenticated users may submit wanted requests"
on public.marketplace_wanted_requests
for insert
to authenticated
with check (submitted_by = auth.uid());

create policy "Anyone may submit marketplace inquiries"
on public.marketplace_inquiries
for insert
to anon, authenticated
with check (consent_to_contact = true);

create policy "Admins manage suppliers"
on public.marketplace_suppliers
for all
to authenticated
using (public.is_marketplace_admin())
with check (public.is_marketplace_admin());

create policy "Admins manage listings"
on public.marketplace_listings
for all
to authenticated
using (public.is_marketplace_admin())
with check (public.is_marketplace_admin());

create policy "Admins manage wanted requests"
on public.marketplace_wanted_requests
for all
to authenticated
using (public.is_marketplace_admin())
with check (public.is_marketplace_admin());

create policy "Admins manage inquiries"
on public.marketplace_inquiries
for all
to authenticated
using (public.is_marketplace_admin())
with check (public.is_marketplace_admin());

create policy "Admins manage listing private records"
on public.marketplace_listing_private
for all
to authenticated
using (public.is_marketplace_admin())
with check (public.is_marketplace_admin());

create policy "Admins manage wanted private records"
on public.marketplace_wanted_private
for all
to authenticated
using (public.is_marketplace_admin())
with check (public.is_marketplace_admin());

create policy "Admins manage supplier private records"
on public.marketplace_supplier_private
for all
to authenticated
using (public.is_marketplace_admin())
with check (public.is_marketplace_admin());

create policy "Admins manage review queue"
on public.marketplace_review_queue
for all
to authenticated
using (public.is_marketplace_admin())
with check (public.is_marketplace_admin());

create policy "Admins read audit events"
on public.audit_events
for select
to authenticated
using (public.is_marketplace_admin());

create policy "Authenticated users append audit events"
on public.audit_events
for insert
to authenticated
with check (actor_id = auth.uid() or public.is_marketplace_admin());

create or replace view public.marketplace_suppliers_public
with (security_invoker = true)
as
select
  s.id,
  s.slug,
  s.display_name,
  s.supplier_type,
  s.country,
  s.region,
  s.website_url,
  s.public_summary,
  s.capabilities,
  s.certifications,
  s.published_at,
  s.created_at
from public.marketplace_suppliers s
where s.lifecycle_status = 'published'
  and s.review_status = 'approved'
  and s.visibility = 'public'
  and s.deleted_at is null;

create or replace view public.marketplace_listings_public
with (security_invoker = true)
as
select
  l.id,
  l.supplier_id,
  s.display_name as supplier_display_name,
  l.section,
  l.slug,
  l.title,
  l.short_description,
  l.category,
  l.subcategory,
  l.condition,
  l.origin_country,
  l.location_country,
  l.location_region,
  l.availability_status,
  l.price_display,
  l.minimum_order_display,
  l.compliance_tags,
  l.image_urls,
  l.published_at,
  l.expires_at,
  l.created_at
from public.marketplace_listings l
left join public.marketplace_suppliers s on s.id = l.supplier_id
where l.lifecycle_status = 'published'
  and l.review_status = 'approved'
  and l.visibility = 'public'
  and l.deleted_at is null;

create or replace view public.marketplace_listing_detail_public
with (security_invoker = true)
as
select
  l.id,
  l.supplier_id,
  s.display_name as supplier_display_name,
  s.country as supplier_country,
  s.region as supplier_region,
  s.public_summary as supplier_public_summary,
  l.section,
  l.slug,
  l.title,
  l.short_description,
  l.description,
  l.category,
  l.subcategory,
  l.condition,
  l.origin_country,
  l.location_country,
  l.location_region,
  l.availability_status,
  l.price_display,
  l.minimum_order_display,
  l.compliance_tags,
  l.image_urls,
  l.published_at,
  l.expires_at,
  l.created_at
from public.marketplace_listings l
left join public.marketplace_suppliers s on s.id = l.supplier_id
where l.lifecycle_status = 'published'
  and l.review_status = 'approved'
  and l.visibility = 'public'
  and l.deleted_at is null;

create or replace view public.marketplace_wanted_requests_public
with (security_invoker = true)
as
select
  w.id,
  w.slug,
  w.title,
  w.short_description,
  w.category,
  w.subcategory,
  w.target_country,
  w.target_region,
  w.quantity_display,
  w.budget_display,
  w.urgency,
  w.compliance_requirements,
  w.published_at,
  w.expires_at,
  w.created_at
from public.marketplace_wanted_requests w
where w.lifecycle_status = 'published'
  and w.review_status = 'approved'
  and w.visibility = 'public'
  and w.deleted_at is null;

revoke all on public.marketplace_listing_private from anon, authenticated;
revoke all on public.marketplace_wanted_private from anon, authenticated;
revoke all on public.marketplace_supplier_private from anon, authenticated;
revoke all on public.marketplace_review_queue from anon;
revoke all on public.audit_events from anon;

grant select on public.marketplace_listings_public to anon, authenticated;
grant select on public.marketplace_listing_detail_public to anon, authenticated;
grant select on public.marketplace_wanted_requests_public to anon, authenticated;
grant select on public.marketplace_suppliers_public to anon, authenticated;
