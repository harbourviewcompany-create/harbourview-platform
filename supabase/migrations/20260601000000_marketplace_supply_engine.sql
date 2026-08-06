-- Harbourview Marketplace Supply Engine V1
-- Additive marketplace spine migration. Does not publish records.

begin;

create extension if not exists pgcrypto;

alter table public.listings
  add column if not exists marketplace_section text,
  add column if not exists public_visibility boolean not null default false,
  add column if not exists product_type text,
  add column if not exists region text,
  add column if not exists condition text,
  add column if not exists price_amount numeric,
  add column if not exists price_currency text not null default 'USD',
  add column if not exists price_display text,
  add column if not exists seller_type text,
  add column if not exists is_featured boolean not null default false,
  add column if not exists high_level_specs jsonb not null default '{}'::jsonb,
  add column if not exists private_specs jsonb not null default '{}'::jsonb,
  add column if not exists public_summary text,
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists seller_authorization_status text not null default 'unknown',
  add column if not exists monetization_path text not null default 'manual_review',
  add column if not exists review_status text not null default 'draft',
  add column if not exists source_candidate_id uuid null,
  add column if not exists expires_at timestamptz null,
  add column if not exists archived_at timestamptz null,
  add column if not exists created_by uuid null references auth.users(id) on delete set null,
  add column if not exists updated_by uuid null references auth.users(id) on delete set null;

create index if not exists listings_marketplace_public_idx
  on public.listings (public_visibility, status, is_featured, created_at desc)
  where archived_at is null;

create or replace view public.marketplace_public_listings_v1
with (security_invoker = true)
as
select
  id,
  slug,
  title,
  coalesce(public_summary, summary, description) as description,
  category,
  subcategory,
  coalesce(marketplace_section, category) as marketplace_section,
  product_type,
  coalesce(region, location_region, location_country, 'global') as region,
  condition,
  location_country,
  location_region,
  price_amount,
  price_currency,
  price_display,
  coalesce(seller_type, 'controlled_review') as seller_type,
  is_featured,
  high_level_specs,
  created_at
from public.listings
-- 'published' dropped 2026-08-05. public.listings.status carries production's
-- listing_status enum from 20260528033001, and that enum has exactly four
-- labels -- pending_review, approved, rejected, archived. 'published' is not
-- one of them, so the original predicate fails against the converted column:
--   invalid input value for enum listing_status: "published"
-- The two are equivalent after the conversion, which maps any legacy
-- 'published' row to 'approved' (the same publicly-visible state), so this
-- selects exactly the same rows.
--
-- Nothing is contradicted by narrowing it: this version is recorded in
-- supabase_migrations.schema_migrations with a null statements array, so
-- production captured no body for it, and the only other repository migration
-- that filtered listings on 'published' is this one.
where status = 'approved'
  and public_visibility = true
  and archived_at is null
  and (expires_at is null or expires_at > now());

revoke all on public.marketplace_public_listings_v1 from anon, authenticated;
grant select on public.marketplace_public_listings_v1 to anon, authenticated;

alter table public.source_registry
  add column if not exists source_owner text,
  add column if not exists category_keys text[] not null default '{}',
  add column if not exists allowed_record_types text[] not null default '{}',
  add column if not exists geography text,
  add column if not exists reliability_score integer,
  add column if not exists scrape_policy text not null default 'manual_only',
  add column if not exists access_method text not null default 'public_web',
  add column if not exists refresh_cadence text not null default 'monthly',
  add column if not exists last_successful_capture_at timestamptz,
  add column if not exists last_failed_capture_at timestamptz,
  add column if not exists source_status text not null default 'active',
  add column if not exists source_notes_private text;

alter table public.marketplace_candidates
  add column if not exists category_key text,
  add column if not exists subcategory_key text,
  add column if not exists listing_type_key text,
  add column if not exists record_type text,
  add column if not exists seller_name_private text,
  add column if not exists seller_url_private text,
  add column if not exists seller_contact_private text,
  add column if not exists seller_authorization_status text not null default 'unknown',
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists publication_status text not null default 'not_publishable',
  add column if not exists monetization_path text not null default 'manual_review',
  add column if not exists asking_price_text text,
  add column if not exists quantity_text text,
  add column if not exists private_specs jsonb not null default '{}'::jsonb,
  add column if not exists high_level_specs jsonb not null default '{}'::jsonb,
  add column if not exists required_documents jsonb not null default '[]'::jsonb,
  add column if not exists evidence_summary_private text,
  add column if not exists public_summary_draft text,
  add column if not exists public_payload jsonb not null default '{}'::jsonb,
  add column if not exists review_due_at timestamptz,
  add column if not exists expires_at timestamptz;

alter table public.marketplace_candidates
  drop constraint if exists marketplace_candidates_type_check,
  drop constraint if exists marketplace_candidates_category_check,
  drop constraint if exists marketplace_candidates_subcategory_check,
  drop constraint if exists marketplace_candidates_listing_type_check;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.marketplace_candidates'::regclass
      and conname = 'marketplace_candidates_category_key_check'
  ) then
    alter table public.marketplace_candidates
      add constraint marketplace_candidates_category_key_check
      check (
        category_key is null or category_key in (
          'consumables','packaging','new_products','used_surplus','cultivation_equipment','processing_equipment','lab_testing','logistics','services','professional_services','distressed_inventory','distressed_businesses','business_opportunities','export_ready','import_demand','cannabis_inventory','genetics','wanted_requests','qualified_access','education'
        )
      ) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.marketplace_candidates'::regclass
      and conname = 'marketplace_candidates_publication_status_check'
  ) then
    alter table public.marketplace_candidates
      add constraint marketplace_candidates_publication_status_check
      check (publication_status in ('not_publishable','draft_public_summary','needs_public_safety_review','approved_public_summary','published','private_only','rejected','archived')) not valid;
  end if;
end $$;

create index if not exists marketplace_candidates_supply_engine_queue_idx
  on public.marketplace_candidates (publication_status, verification_status, created_at desc);

create index if not exists marketplace_candidates_category_key_idx
  on public.marketplace_candidates (category_key, created_at desc);

comment on view public.marketplace_public_listings_v1 is 'Public-safe marketplace listing DTO view. Private seller, source, evidence, provenance, notes, scores and operator fields are intentionally excluded.';
comment on column public.listings.private_specs is 'Private marketplace details. Never expose in public DTOs or public DOM.';
comment on column public.marketplace_candidates.evidence_summary_private is 'Private evidence summary for operator review only.';

commit;
