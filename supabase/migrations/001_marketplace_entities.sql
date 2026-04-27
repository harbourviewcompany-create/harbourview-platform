-- ============================================================
-- Harbourview Marketplace — Migration 001
-- All core marketplace entities
-- Run: npx supabase db push  (or paste into Supabase SQL editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── Listings ─────────────────────────────────────────────────────────────────

create type listing_status as enum (
  'pending_review',
  'approved',
  'rejected',
  'archived',
  'superseded'
);

create type listing_category as enum (
  'new-products',
  'used-surplus',
  'cannabis-inventory',
  'services',
  'business-opportunities'
);

create table listings (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  status              listing_status not null default 'pending_review',
  category            listing_category not null,
  product_type        text not null check (char_length(product_type) <= 200),
  region              text not null,
  price_range         text,
  specs_summary       text check (char_length(specs_summary) <= 1000),
  seller_type         text not null,
  -- Private fields — protected by RLS
  legal_entity_name   text,
  contact_name        text,
  contact_email       text,
  contact_phone       text,
  private_notes       text,
  internal_score      integer check (internal_score between 0 and 100),
  archived_at         timestamptz,
  superseded_by       uuid references listings(id) on delete set null
);

-- Updated_at trigger
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_updated_at before update on listings
  for each row execute function set_updated_at();

-- ── Buyer Requests ────────────────────────────────────────────────────────────

create type buyer_request_status as enum (
  'pending_review',
  'approved',
  'rejected',
  'archived'
);

create table buyer_requests (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  status              buyer_request_status not null default 'pending_review',
  product_type        text not null check (char_length(product_type) <= 200),
  region_interest     text not null,
  quantity_range      text,
  specs_requirements  text check (char_length(specs_requirements) <= 1000),
  buyer_type          text not null,
  -- Private
  legal_entity_name   text,
  contact_name        text,
  contact_email       text,
  contact_phone       text,
  private_notes       text,
  archived_at         timestamptz
);

create trigger buyer_requests_updated_at before update on buyer_requests
  for each row execute function set_updated_at();

-- ── Supplier Profiles ─────────────────────────────────────────────────────────

create table supplier_profiles (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  status                listing_status not null default 'pending_review',
  company_display_name  text,
  region                text not null,
  categories            listing_category[] not null default '{}',
  certifications        text[],
  brief_description     text check (char_length(brief_description) <= 500),
  -- Private
  legal_entity_name     text,
  contact_name          text,
  contact_email         text,
  archived_at           timestamptz
);

create trigger supplier_profiles_updated_at before update on supplier_profiles
  for each row execute function set_updated_at();

-- ── Marketplace Inquiries ─────────────────────────────────────────────────────

create type inquiry_status as enum ('new', 'reviewed', 'actioned');

create table marketplace_inquiries (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  listing_id        uuid references listings(id) on delete set null,
  buyer_request_id  uuid references buyer_requests(id) on delete set null,
  inquirer_name     text not null check (char_length(inquirer_name) <= 200),
  inquirer_email    text not null,
  inquirer_company  text,
  inquirer_type     text not null,
  message           text not null check (char_length(message) <= 3000),
  status            inquiry_status not null default 'new',
  ip_address        text,
  user_agent        text
);

-- ── Matches ───────────────────────────────────────────────────────────────────

create type match_status as enum (
  'proposed',
  'inquiry_received',
  'disclosure_requested',
  'disclosure_approved',
  'introduced',
  'closed_won',
  'closed_lost'
);

create table matches (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  listing_id        uuid references listings(id) on delete set null,
  buyer_request_id  uuid references buyer_requests(id) on delete set null,
  status            match_status not null default 'proposed',
  match_notes       text check (char_length(match_notes) <= 2000),
  introduced_at     timestamptz,
  closed_at         timestamptz,
  closed_outcome    text check (closed_outcome in ('won', 'lost'))
);

create trigger matches_updated_at before update on matches
  for each row execute function set_updated_at();

-- ── Disclosure Requests ───────────────────────────────────────────────────────

create type disclosure_status as enum ('requested', 'approved', 'declined');

create table disclosure_requests (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  match_id      uuid not null references matches(id) on delete cascade,
  requested_by  text not null,
  status        disclosure_status not null default 'requested',
  responded_at  timestamptz,
  notes         text check (char_length(notes) <= 1000)
);

-- ── Disclosure Approvals ──────────────────────────────────────────────────────

create table disclosure_approvals (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  disclosure_request_id uuid not null references disclosure_requests(id) on delete cascade,
  approved_by           text not null,
  approved_at           timestamptz not null default now(),
  notes                 text check (char_length(notes) <= 1000)
);

-- ── Status History ────────────────────────────────────────────────────────────

create type entity_type as enum (
  'listing',
  'buyer_request',
  'supplier_profile',
  'marketplace_inquiry',
  'match',
  'disclosure_request',
  'disclosure_approval'
);

create table status_history (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  entity_type  entity_type not null,
  entity_id    uuid not null,
  from_status  text,
  to_status    text not null,
  changed_by   text not null,
  reason       text
);

-- ── Internal Admin Notes ──────────────────────────────────────────────────────

create table internal_admin_notes (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  entity_type  entity_type not null,
  entity_id    uuid not null,
  note         text not null check (char_length(note) <= 5000),
  created_by   text not null
);

-- ── Audit Events ──────────────────────────────────────────────────────────────

create table audit_events (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  entity_type  entity_type not null,
  entity_id    uuid not null,
  action       text not null,
  actor        text not null,
  metadata     jsonb,
  ip_address   text
);

-- Indexes for common admin queries
create index idx_audit_events_entity on audit_events(entity_type, entity_id);
create index idx_audit_events_created on audit_events(created_at desc);
create index idx_listings_status on listings(status);
create index idx_listings_category on listings(category);
create index idx_buyer_requests_status on buyer_requests(status);
create index idx_matches_status on matches(status);
create index idx_inquiries_status on marketplace_inquiries(status);
