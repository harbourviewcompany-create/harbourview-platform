
-- RECOVERY BEGIN 20260808190500_reconcile_marketplace_image_trust_contract.sql
-- Reconcile the production marketplace_item_images table with the repository's
-- marketplace image trust contract.
--
-- Production currently carries the older 17-column listing-image table while
-- the 20260605000000 trust-layer migration is recorded in the migration ledger.
-- Because that migration used CREATE TABLE IF NOT EXISTS, the legacy relation
-- survived without the trust columns. The public image query therefore cannot
-- select item_id/image_class/image_role/rights_status/... and returns no media.
--
-- This migration is additive for the legacy relation and idempotent for a clean
-- replay where the trust-layer shape already exists. It preserves legacy
-- columns and data, upgrades legacy approved listing imagery where enough data
-- exists, restores the intended RLS/storage boundary and recreates the public
-- API view with the existing public allowlist only.

create schema if not exists api;

do $$
begin
  create type public.marketplace_image_class as enum (
    'REAL_ITEM_EVIDENCE',
    'MANUFACTURER_CATALOGUE',
    'HARBOURVIEW_ILLUSTRATIVE',
    'ADMIN_PRIVATE_EVIDENCE'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.marketplace_image_role as enum (
    'CARD',
    'HERO',
    'GALLERY',
    'DETAIL',
    'CATEGORY_TILE',
    'SELLER_PROFILE',
    'ADMIN_REVIEW',
    'SOCIAL_PREVIEW',
    'PLACEHOLDER'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.marketplace_image_rights_status as enum (
    'SELLER_PROVIDED',
    'MANUFACTURER_PERMITTED',
    'HARBOURVIEW_CREATED',
    'PUBLIC_SOURCE_REVIEWED',
    'UNKNOWN'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.marketplace_image_source_type as enum (
    'SELLER_UPLOAD',
    'SUPPLIER_UPLOAD',
    'MANUFACTURER_CATALOGUE',
    'HARBOURVIEW_CREATED',
    'PUBLIC_SOURCE',
    'ADMIN_UPLOAD',
    'UNKNOWN'
  );
exception when duplicate_object then null;
end $$;

alter table public.marketplace_item_images
  add column if not exists item_id uuid,
  add column if not exists image_class public.marketplace_image_class,
  add column if not exists image_role public.marketplace_image_role,
  add column if not exists rights_status public.marketplace_image_rights_status,
  add column if not exists source_type public.marketplace_image_source_type,
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists source_reference text,
  add column if not exists original_storage_bucket text,
  add column if not exists original_storage_path text,
  add column if not exists edited_storage_bucket text,
  add column if not exists edited_storage_path text,
  add column if not exists public_storage_bucket text,
  add column if not exists public_storage_path text,
  add column if not exists thumbnail_url text,
  add column if not exists hero_url text,
  add column if not exists gallery_url text,
  add column if not exists social_url text,
  add column if not exists caption text,
  add column if not exists is_evidence_image boolean not null default false,
  add column if not exists is_illustrative boolean not null default false,
  add column if not exists adobe_edit_summary text,
  add column if not exists content_credentials_status text,
  add column if not exists content_credentials_reference text,
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists file_mime_type text,
  add column if not exists checksum_sha256 text,
  add column if not exists replaced_by_image_id uuid,
  add column if not exists uploaded_by uuid;

alter table public.marketplace_item_images
  alter column image_role set default 'GALLERY',
  alter column rights_status set default 'UNKNOWN',
  alter column source_type set default 'UNKNOWN';

-- Preserve the legacy uploader contract while making those rows readable by
-- the canonical trust-layer projection. This block only runs where the legacy
-- columns exist; a clean replay of the current trust-layer table skips it.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'marketplace_item_images'
      and column_name = 'listing_id'
  ) then
    execute $sql$
      update public.marketplace_item_images
      set
        item_id = coalesce(item_id, listing_id),
        image_class = coalesce(image_class, 'REAL_ITEM_EVIDENCE'::public.marketplace_image_class),
        image_role = coalesce(
          image_role,
          case when coalesce(is_primary, false)
            then 'CARD'::public.marketplace_image_role
            else 'GALLERY'::public.marketplace_image_role
          end
        ),
        rights_status = coalesce(rights_status, 'SELLER_PROVIDED'::public.marketplace_image_rights_status),
        source_type = coalesce(source_type, 'SELLER_UPLOAD'::public.marketplace_image_source_type),
        thumbnail_url = coalesce(thumbnail_url, public_url),
        hero_url = coalesce(hero_url, public_url),
        gallery_url = coalesce(gallery_url, public_url),
        is_evidence_image = true,
        file_mime_type = coalesce(file_mime_type, mime_type)
      where listing_id is not null
    $sql$;

    -- The legacy table used lower-case review statuses. Translate only the
    -- public-approved state; pending/rejected legacy rows remain non-public.
    update public.marketplace_item_images
    set review_status = 'APPROVED_PUBLIC'
    where review_status::text = 'approved'
      and item_id is not null
      and public_url is not null;
  end if;
end $$;

update public.marketplace_item_images
set
  image_role = coalesce(image_role, 'GALLERY'::public.marketplace_image_role),
  rights_status = coalesce(rights_status, 'UNKNOWN'::public.marketplace_image_rights_status),
  source_type = coalesce(source_type, 'UNKNOWN'::public.marketplace_image_source_type)
where image_role is null
   or rights_status is null
   or source_type is null;

create index if not exists idx_marketplace_item_images_item_id
  on public.marketplace_item_images(item_id);
create index if not exists idx_marketplace_item_images_review_status
  on public.marketplace_item_images(review_status);
create index if not exists idx_marketplace_item_images_rights_status
  on public.marketplace_item_images(rights_status);
create index if not exists idx_marketplace_item_images_class
  on public.marketplace_item_images(image_class);
create index if not exists idx_marketplace_item_images_public_item
  on public.marketplace_item_images(item_id, image_role)
  where review_status = 'APPROVED_PUBLIC';

-- NOT VALID preserves any historic non-public legacy rows while enforcing the
-- trust contract for subsequent writes. The production table is currently
-- empty, so these constraints can be validated in the release pass after the
-- migration is applied.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_item_images_public_requires_approved'
      and conrelid = 'public.marketplace_item_images'::regclass
  ) then
    alter table public.marketplace_item_images
      add constraint marketplace_item_images_public_requires_approved
      check (public_url is null or review_status::text = 'APPROVED_PUBLIC') not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_item_images_unknown_rights_not_public'
      and conrelid = 'public.marketplace_item_images'::regclass
  ) then
    alter table public.marketplace_item_images
      add constraint marketplace_item_images_unknown_rights_not_public
      check (rights_status::text <> 'UNKNOWN' or public_url is null) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_item_images_admin_private_not_public'
      and conrelid = 'public.marketplace_item_images'::regclass
  ) then
    alter table public.marketplace_item_images
      add constraint marketplace_item_images_admin_private_not_public
      check (image_class::text <> 'ADMIN_PRIVATE_EVIDENCE' or public_url is null) not valid;
  end if;
end $$;

alter table public.marketplace_item_images enable row level security;

-- The legacy permissive policy would otherwise OR with the trust policy and
-- allow a lower-case `approved` row through without rights/image-class gates.
drop policy if exists public_read_approved_images on public.marketplace_item_images;
drop policy if exists "Public can read approved public marketplace images" on public.marketplace_item_images;
drop policy if exists "Admins can read all marketplace images" on public.marketplace_item_images;
drop policy if exists "Admins can insert marketplace images" on public.marketplace_item_images;
drop policy if exists "Admins can update marketplace images" on public.marketplace_item_images;
drop policy if exists "Admins can delete marketplace images" on public.marketplace_item_images;

create policy "Public can read approved public marketplace images"
on public.marketplace_item_images
for select
to anon, authenticated
using (
  review_status::text = 'APPROVED_PUBLIC'
  and rights_status::text <> 'UNKNOWN'
  and image_class::text <> 'ADMIN_PRIVATE_EVIDENCE'
  and item_id is not null
  and public_url is not null
);

create policy "Admins can read all marketplace images"
on public.marketplace_item_images
for select
to authenticated
using (public.is_harbourview_admin());

create policy "Admins can insert marketplace images"
on public.marketplace_item_images
for insert
to authenticated
with check (public.is_harbourview_admin());

create policy "Admins can update marketplace images"
on public.marketplace_item_images
for update
to authenticated
using (public.is_harbourview_admin())
with check (public.is_harbourview_admin());

create policy "Admins can delete marketplace images"
on public.marketplace_item_images
for delete
to authenticated
using (public.is_harbourview_admin());

grant select on public.marketplace_item_images to anon;
grant select, insert, update, delete on public.marketplace_item_images to authenticated;
grant select, insert, update, delete on public.marketplace_item_images to service_role;

-- Restore the storage buckets and admin write policies that the trust-layer
-- migration intended to own. Existing seller self-serve policies for the
-- submissions/ prefix are preserved.
insert into storage.buckets (id, name, public)
values
  ('marketplace-item-originals', 'marketplace-item-originals', false),
  ('marketplace-item-working', 'marketplace-item-working', false),
  ('marketplace-item-public', 'marketplace-item-public', true)
on conflict (id) do nothing;

drop policy if exists "Admins can upload marketplace originals" on storage.objects;
drop policy if exists "Admins can read marketplace originals" on storage.objects;
drop policy if exists "Admins can update marketplace originals" on storage.objects;
drop policy if exists "Admins can upload marketplace working edits" on storage.objects;
drop policy if exists "Admins can read marketplace working edits" on storage.objects;
drop policy if exists "Admins can update marketplace working edits" on storage.objects;
drop policy if exists "Admins can upload approved public marketplace derivatives" on storage.objects;
drop policy if exists "Admins can update approved public marketplace derivatives" on storage.objects;

create policy "Admins can upload marketplace originals"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'marketplace-item-originals' and public.is_harbourview_admin());

create policy "Admins can read marketplace originals"
on storage.objects
for select
to authenticated
using (bucket_id = 'marketplace-item-originals' and public.is_harbourview_admin());

create policy "Admins can update marketplace originals"
on storage.objects
for update
to authenticated
using (bucket_id = 'marketplace-item-originals' and public.is_harbourview_admin())
with check (bucket_id = 'marketplace-item-originals' and public.is_harbourview_admin());

create policy "Admins can upload marketplace working edits"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'marketplace-item-working' and public.is_harbourview_admin());

create policy "Admins can read marketplace working edits"
on storage.objects
for select
to authenticated
using (bucket_id = 'marketplace-item-working' and public.is_harbourview_admin());

create policy "Admins can update marketplace working edits"
on storage.objects
for update
to authenticated
using (bucket_id = 'marketplace-item-working' and public.is_harbourview_admin())
with check (bucket_id = 'marketplace-item-working' and public.is_harbourview_admin());

create policy "Admins can upload approved public marketplace derivatives"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'marketplace-item-public' and public.is_harbourview_admin());

create policy "Admins can update approved public marketplace derivatives"
on storage.objects
for update
to authenticated
using (bucket_id = 'marketplace-item-public' and public.is_harbourview_admin())
with check (bucket_id = 'marketplace-item-public' and public.is_harbourview_admin());

-- Recreate the exposed API view with the exact public DTO allowlist. The live
-- production view still has the pre-trust-layer listing_id/storage_path shape.
drop view if exists api.marketplace_item_images;
create view api.marketplace_item_images
with (security_invoker = true)
as
select
  id,
  item_id,
  image_class,
  image_role,
  source_type,
  public_url,
  thumbnail_url,
  hero_url,
  gallery_url,
  social_url,
  alt_text,
  caption,
  is_illustrative,
  review_status,
  rights_status
from public.marketplace_item_images;

grant select on api.marketplace_item_images to anon, authenticated, service_role;

comment on table public.marketplace_item_images is
  'Harbourview marketplace image trust layer reconciled with the legacy listing-image relation. Public rendering is gated by APPROVED_PUBLIC review, known rights, non-private class and public URL.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260808190500','reconcile_marketplace_image_trust_contract','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260808190500_reconcile_marketplace_image_trust_contract.sql

-- RECOVERY BEGIN 20260808205222_harden_marketplace_item_images_anon_grants.sql
REVOKE INSERT, UPDATE, DELETE ON TABLE public.marketplace_item_images FROM anon;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260808205222','harden_marketplace_item_images_anon_grants','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260808205222_harden_marketplace_item_images_anon_grants.sql

-- RECOVERY BEGIN 20260810220951_noop_marker_do_not_use.sql
select 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260810220951','noop_marker_do_not_use','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260810220951_noop_marker_do_not_use.sql

-- RECOVERY BEGIN 20260810221004_pr1307_media_rollout_verifier.sql
select 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260810221004','pr1307_media_rollout_verifier','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260810221004_pr1307_media_rollout_verifier.sql

-- RECOVERY BEGIN 20260810223000_source_expansion_wave1_structured_authorities.sql
-- Harbourview Source Expansion — Wave 1 structured authoritative sources
-- Control artifact: Harbourview_Source_Expansion_Audit_2026-08-10.xlsx
-- Audit SHA-256: 8a3e2df8c9c6fc7a8afc593229c3ec3e2b3299fcae7e63f813ea13de3d17b000
--
-- Scope:
--   SX-0005 ClinicalTrials.gov API
--   SX-0056 Federal Register API
--   SX-0054 FDA recalls / enforcement reports (drug + food endpoints)
--
-- This migration only configures source_registry. It does not fetch sources,
-- execute extraction, or publish intelligence during migration execution.
--
-- SX-0005 and SX-0056 already exist in production under stable UUIDs, but their
-- original creation is not reconstructible from the repository's zero-state
-- migration history. Use idempotent UUID-bound upserts so a fresh replay creates
-- the same two source identities while an existing production row retains its
-- health/history fields (last_checked_at, failure state, locks, etc.).

-- SX-0005: replace the existing generic HTML treatment of the ClinicalTrials.gov
-- v2 endpoint with record-level structured JSON capture.
INSERT INTO public.source_registry (
  id, source_name, source_url, jurisdiction, country, iso, region,
  is_active, requires_translation, language, adapter, crawl_cadence,
  relevance_status, tier, requires_auth, source_type, crawl_allowed,
  content_type, metadata
)
VALUES (
  'f1eba08c-6704-484c-b6c4-d9d6a452e9c3'::uuid,
  'ClinicalTrials.gov — Cannabis Studies',
  'https://clinicaltrials.gov/api/v2/studies?query.term=%28cannabis%20OR%20cannabidiol%20OR%20cannabinoid%20OR%20marijuana%29&pageSize=100',
  'Global', 'USA', 'US', 'Global',
  true, false, 'en', 'api', 'daily',
  'active', 1, false, 'scientific', true,
  ARRAY['research']::text[],
  jsonb_build_object(
    'audit_source_id', 'SX-0005',
    'source_class', 'clinical_scientific_registry',
    'structured_fetch', true,
    'records_path', 'studies',
    'identity_path', 'protocolSection.identificationModule.nctId',
    'title_path', 'protocolSection.identificationModule.briefTitle',
    'record_url_template', 'https://clinicaltrials.gov/study/{id}',
    'max_records', 100,
    'event_types', jsonb_build_array('trial_start', 'trial_status_change', 'trial_completion', 'trial_results'),
    'evidence_authority', 'primary_registry',
    'refresh_expectation', 'weekday_daily'
  )
)
ON CONFLICT (id) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  source_url = EXCLUDED.source_url,
  source_type = EXCLUDED.source_type,
  adapter = EXCLUDED.adapter,
  crawl_cadence = EXCLUDED.crawl_cadence,
  relevance_status = EXCLUDED.relevance_status,
  is_active = EXCLUDED.is_active,
  crawl_allowed = EXCLUDED.crawl_allowed,
  content_type = EXCLUDED.content_type,
  metadata = COALESCE(public.source_registry.metadata, '{}'::jsonb) || EXCLUDED.metadata,
  updated_at = now();

-- SX-0056: convert the dormant Federal Register HTML search into the JSON API.
-- FederalRegister.gov is used for monitoring/discovery; downstream legal evidence
-- should retain the document's official-PDF/govinfo provenance when available.
INSERT INTO public.source_registry (
  id, source_name, source_url, jurisdiction, country, iso, region,
  is_active, requires_translation, language, adapter, crawl_cadence,
  relevance_status, tier, requires_auth, source_type, crawl_allowed,
  content_type, metadata
)
VALUES (
  'ea49c5e6-5bb0-4080-a66e-fe42d1f7034f'::uuid,
  'Federal Register — Cannabis Rulemaking Pipeline',
  'https://www.federalregister.gov/api/v1/documents.json?per_page=100&order=newest&conditions%5Bterm%5D=cannabis',
  NULL, NULL, NULL, 'north_america',
  true, false, 'en', 'api', 'daily',
  'active', 2, false, 'government_official', true,
  ARRAY['regulatory']::text[],
  jsonb_build_object(
    'audit_source_id', 'SX-0056',
    'source_class', 'government_gazette_rulemaking',
    'structured_fetch', true,
    'records_path', 'results',
    'identity_path', 'document_number',
    'title_path', 'title',
    'url_path', 'html_url',
    'max_records', 100,
    'event_types', jsonb_build_array('proposed_rule', 'final_rule', 'notice', 'hearing', 'effective_date_change'),
    'evidence_authority', 'official_information_interface',
    'legal_verification_required', 'govinfo_official_edition'
  )
)
ON CONFLICT (id) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  source_url = EXCLUDED.source_url,
  source_type = EXCLUDED.source_type,
  adapter = EXCLUDED.adapter,
  crawl_cadence = EXCLUDED.crawl_cadence,
  relevance_status = EXCLUDED.relevance_status,
  is_active = EXCLUDED.is_active,
  crawl_allowed = EXCLUDED.crawl_allowed,
  content_type = EXCLUDED.content_type,
  metadata = COALESCE(public.source_registry.metadata, '{}'::jsonb) || EXCLUDED.metadata,
  updated_at = now();

-- SX-0054: drug enforcement/recall records from FDA RES via openFDA.
INSERT INTO public.source_registry (
  source_name, source_url, jurisdiction, country, iso, region,
  is_active, requires_translation, language, adapter, crawl_cadence,
  relevance_status, tier, requires_auth, source_type, crawl_allowed,
  content_type, metadata, last_checked_at, consecutive_failures
)
VALUES (
  'openFDA — Cannabis Drug Recall Enforcement',
  'https://api.fda.gov/drug/enforcement.json?search=cannabis&limit=100',
  'USA', 'United States', 'US', 'North America',
  true, false, 'en', 'api', 'weekly',
  'active', 1, false, 'regulator_official', true,
  ARRAY['regulatory']::text[],
  jsonb_build_object(
    'audit_source_id', 'SX-0054',
    'audit_child', 'drug_enforcement',
    'source_class', 'recall_enforcement',
    'structured_fetch', true,
    'records_path', 'results',
    'identity_path', 'recall_number',
    'title_path', 'product_description',
    'max_records', 100,
    'event_types', jsonb_build_array('recall', 'market_withdrawal', 'quality_defect', 'enforcement'),
    'evidence_authority', 'primary_regulator_dataset',
    'dataset', 'FDA Recall Enterprise System'
  ),
  NULL, 0
)
ON CONFLICT (source_url) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  jurisdiction = EXCLUDED.jurisdiction,
  country = EXCLUDED.country,
  iso = EXCLUDED.iso,
  region = EXCLUDED.region,
  is_active = EXCLUDED.is_active,
  language = EXCLUDED.language,
  adapter = EXCLUDED.adapter,
  crawl_cadence = EXCLUDED.crawl_cadence,
  relevance_status = EXCLUDED.relevance_status,
  tier = EXCLUDED.tier,
  requires_auth = EXCLUDED.requires_auth,
  source_type = EXCLUDED.source_type,
  crawl_allowed = EXCLUDED.crawl_allowed,
  content_type = EXCLUDED.content_type,
  metadata = COALESCE(public.source_registry.metadata, '{}'::jsonb) || EXCLUDED.metadata,
  updated_at = now();

-- SX-0054 child endpoint: FDA RES food recalls captures cannabis/CBD ingestible
-- products that do not belong in the drug endpoint.
INSERT INTO public.source_registry (
  source_name, source_url, jurisdiction, country, iso, region,
  is_active, requires_translation, language, adapter, crawl_cadence,
  relevance_status, tier, requires_auth, source_type, crawl_allowed,
  content_type, metadata, last_checked_at, consecutive_failures
)
VALUES (
  'openFDA — Cannabis Food Recall Enforcement',
  'https://api.fda.gov/food/enforcement.json?search=cannabis&limit=100',
  'USA', 'United States', 'US', 'North America',
  true, false, 'en', 'api', 'weekly',
  'active', 1, false, 'regulator_official', true,
  ARRAY['regulatory']::text[],
  jsonb_build_object(
    'audit_source_id', 'SX-0054',
    'audit_child', 'food_enforcement',
    'source_class', 'recall_enforcement',
    'structured_fetch', true,
    'records_path', 'results',
    'identity_path', 'recall_number',
    'title_path', 'product_description',
    'max_records', 100,
    'event_types', jsonb_build_array('recall', 'market_withdrawal', 'quality_defect', 'enforcement'),
    'evidence_authority', 'primary_regulator_dataset',
    'dataset', 'FDA Recall Enterprise System'
  ),
  NULL, 0
)
ON CONFLICT (source_url) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  jurisdiction = EXCLUDED.jurisdiction,
  country = EXCLUDED.country,
  iso = EXCLUDED.iso,
  region = EXCLUDED.region,
  is_active = EXCLUDED.is_active,
  language = EXCLUDED.language,
  adapter = EXCLUDED.adapter,
  crawl_cadence = EXCLUDED.crawl_cadence,
  relevance_status = EXCLUDED.relevance_status,
  tier = EXCLUDED.tier,
  requires_auth = EXCLUDED.requires_auth,
  source_type = EXCLUDED.source_type,
  crawl_allowed = EXCLUDED.crawl_allowed,
  content_type = EXCLUDED.content_type,
  metadata = COALESCE(public.source_registry.metadata, '{}'::jsonb) || EXCLUDED.metadata,
  updated_at = now();

-- Migration-local assertions: fail rather than silently claiming Wave 1 coverage.
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.source_registry
  WHERE metadata->>'audit_source_id' IN ('SX-0005', 'SX-0054', 'SX-0056')
    AND is_active = true
    AND relevance_status = 'active'
    AND adapter = 'api'
    AND crawl_allowed = true
    AND COALESCE((metadata->>'structured_fetch')::boolean, false) = true;

  IF v_count <> 4 THEN
    RAISE EXCEPTION 'Wave 1 source assertion failed: expected 4 active structured API rows, found %', v_count;
  END IF;

  IF EXISTS (
    SELECT source_url
    FROM public.source_registry
    GROUP BY source_url
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Wave 1 source assertion failed: duplicate source_url detected';
  END IF;
END;
$$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260810223000','source_expansion_wave1_structured_authorities','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260810223000_source_expansion_wave1_structured_authorities.sql

-- RECOVERY BEGIN 20260811010000_transaction_identity_foundation.sql
-- Harbourview native transaction system: Stage 1 identity foundation.
-- Additive only. Existing workspaces remain tenancy/security boundaries.
-- The Signal Engine already owns public.entities; this migration upgrades that table in place.

create type public.hv_entity_kind as enum (
  'company','government','regulator','laboratory','university','farm','cooperative','investor','association','person','other'
);
create type public.hv_alias_type as enum (
  'legal_name','trade_name','brand_name','former_name','regulatory_name','abbreviation','registry_name','other'
);
create type public.hv_facility_status as enum (
  'unknown','active','inactive','suspended','closed','proposed'
);

create or replace function public.hv_transaction_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Repository replay already creates this table in 20260430000001_signal_engine_schema.sql.
-- CREATE IF NOT EXISTS keeps this migration safe for drifted environments where that historical
-- migration is absent while preserving the existing Signal Engine PK and signal_entity_mentions FKs.
create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null default 'other',
  name text not null,
  website text,
  domain text,
  country text,
  region text,
  verification_status text not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.entities
  add column if not exists entity_kind public.hv_entity_kind,
  add column if not exists legal_name text,
  add column if not exists display_name text,
  add column if not exists normalized_name text,
  add column if not exists country_iso2 text,
  add column if not exists registry_identifier text,
  add column if not exists registry_authority text,
  add column if not exists linkedin_url text,
  add column if not exists classification public.hv_classification not null default 'internal',
  add column if not exists public_eligible boolean not null default false,
  add column if not exists valid_from date,
  add column if not exists valid_to date,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references auth.users(id) on delete set null,
  add column if not exists superseded_by uuid references public.entities(id) on delete set null;

update public.entities
set
  entity_kind = coalesce(
    entity_kind,
    case lower(coalesce(entity_type,''))
      when 'company' then 'company'::public.hv_entity_kind
      when 'operator' then 'company'::public.hv_entity_kind
      when 'organization' then 'company'::public.hv_entity_kind
      when 'organisation' then 'company'::public.hv_entity_kind
      when 'government' then 'government'::public.hv_entity_kind
      when 'regulator' then 'regulator'::public.hv_entity_kind
      when 'laboratory' then 'laboratory'::public.hv_entity_kind
      when 'lab' then 'laboratory'::public.hv_entity_kind
      when 'university' then 'university'::public.hv_entity_kind
      when 'farm' then 'farm'::public.hv_entity_kind
      when 'cooperative' then 'cooperative'::public.hv_entity_kind
      when 'investor' then 'investor'::public.hv_entity_kind
      when 'association' then 'association'::public.hv_entity_kind
      when 'person' then 'person'::public.hv_entity_kind
      else 'other'::public.hv_entity_kind
    end
  ),
  legal_name = coalesce(legal_name, name),
  display_name = coalesce(display_name, name),
  normalized_name = coalesce(normalized_name, lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))),
  country_iso2 = coalesce(
    country_iso2,
    case when country ~ '^[A-Za-z]{2}$' then upper(country) else null end
  );

alter table public.entities
  alter column entity_kind set not null,
  alter column display_name set not null,
  alter column normalized_name set not null;

alter table public.entities
  add constraint entities_country_iso2_chk check (country_iso2 is null or country_iso2 ~ '^[A-Z]{2}$'),
  add constraint entities_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from),
  add constraint entities_superseded_chk check (superseded_by is null or superseded_by <> id),
  add constraint entities_normalized_name_chk check (length(btrim(normalized_name)) > 0);

create unique index entities_registry_identity_uidx
  on public.entities (registry_authority, registry_identifier)
  where registry_authority is not null and registry_identifier is not null and superseded_by is null;
create index if not exists entities_normalized_name_idx on public.entities (normalized_name);
create index if not exists entities_country_kind_idx on public.entities (country_iso2, entity_kind);
create index if not exists entities_transaction_verification_idx on public.entities (verification_status, public_eligible);

create trigger entities_transaction_set_updated_at
before update on public.entities
for each row execute function public.hv_transaction_set_updated_at();

create table public.entity_aliases (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  alias_type public.hv_alias_type not null,
  country_iso2 text,
  source_evidence_id uuid references public.hv_evidence(id) on delete set null,
  valid_from date,
  valid_to date,
  classification public.hv_classification not null default 'internal',
  created_at timestamptz not null default now(),
  constraint entity_aliases_country_iso2_chk check (country_iso2 is null or country_iso2 ~ '^[A-Z]{2}$'),
  constraint entity_aliases_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint entity_aliases_normalized_chk check (length(btrim(normalized_alias)) > 0),
  unique (entity_id, normalized_alias, alias_type)
);
create index entity_aliases_normalized_idx on public.entity_aliases (normalized_alias);
create index entity_aliases_evidence_idx on public.entity_aliases (source_evidence_id) where source_evidence_id is not null;

create table public.entity_facilities (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  facility_type text not null,
  country_iso2 text not null,
  region text,
  city text,
  address_text text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  status public.hv_facility_status not null default 'unknown',
  classification public.hv_classification not null default 'internal',
  public_eligible boolean not null default false,
  valid_from date,
  valid_to date,
  source_evidence_id uuid references public.hv_evidence(id) on delete set null,
  superseded_by uuid references public.entity_facilities(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entity_facilities_country_iso2_chk check (country_iso2 ~ '^[A-Z]{2}$'),
  constraint entity_facilities_coordinates_chk check (
    (latitude is null and longitude is null)
    or (latitude between -90 and 90 and longitude between -180 and 180)
  ),
  constraint entity_facilities_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint entity_facilities_superseded_chk check (superseded_by is null or superseded_by <> id)
);
create index entity_facilities_entity_idx on public.entity_facilities (entity_id);
create index entity_facilities_geo_idx on public.entity_facilities (country_iso2, region, city);
create unique index entity_facilities_identity_uidx
  on public.entity_facilities (entity_id, normalized_name, country_iso2, coalesce(region,''))
  where superseded_by is null;

create trigger entity_facilities_set_updated_at
before update on public.entity_facilities
for each row execute function public.hv_transaction_set_updated_at();

-- Nullable bridges only: no existing consumer changes.
alter table public.cannabis_operators
  add column if not exists entity_id uuid references public.entities(id) on delete set null;
alter table public.ia_counterparties
  add column if not exists entity_id uuid references public.entities(id) on delete set null;
alter table public.operator_licences
  add column if not exists entity_id uuid references public.entities(id) on delete set null,
  add column if not exists facility_id uuid references public.entity_facilities(id) on delete set null;

create index if not exists cannabis_operators_entity_idx on public.cannabis_operators (entity_id) where entity_id is not null;
create index if not exists ia_counterparties_entity_idx on public.ia_counterparties (entity_id) where entity_id is not null;
create index if not exists operator_licences_entity_idx on public.operator_licences (entity_id) where entity_id is not null;
create index if not exists operator_licences_facility_idx on public.operator_licences (facility_id) where facility_id is not null;

comment on table public.entities is 'Signal Engine entity registry upgraded as Harbourview canonical neutral identity root. Never substitutes for workspaces tenancy/security.';
comment on table public.entity_aliases is 'Source-backed historical, legal, trade, brand and registry names for canonical entities.';
comment on table public.entity_facilities is 'Canonical external facility identity. Workspace-private hv_facilities remains a separate member dossier.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260811010000','transaction_identity_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260811010000_transaction_identity_foundation.sql

-- RECOVERY BEGIN 20260811011000_transaction_product_account_foundation.sql
-- Harbourview native transaction system: Stage 2 product/batch + economic-account foundation.

create type public.hv_product_status as enum (
  'unknown','active','discontinued','reformulated','withdrawn','recalled','superseded'
);
create type public.hv_batch_status as enum (
  'unknown','manufactured','released','held','recalled','expired','depleted','destroyed'
);
create type public.hv_account_status as enum (
  'candidate','qualified','active','inactive','superseded'
);
create type public.hv_account_member_role as enum (
  'contracting_entity','budget_owner','procurement_entity','operating_entity','subsidiary','parent','licence_holder','facility','other'
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public.entities(id) on delete set null,
  brand_entity_id uuid references public.entities(id) on delete set null,
  facility_id uuid references public.entity_facilities(id) on delete set null,
  product_format_id uuid references public.product_formats(id) on delete set null,
  name text not null,
  brand_name text,
  sku text,
  variant text,
  product_category text not null,
  description text,
  formulation jsonb not null default '{}'::jsonb,
  package_size numeric,
  package_unit text,
  status public.hv_product_status not null default 'unknown',
  classification public.hv_classification not null default 'internal',
  public_eligible boolean not null default false,
  valid_from date,
  valid_to date,
  source_evidence_id uuid references public.hv_evidence(id) on delete set null,
  superseded_by uuid references public.products(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_package_size_chk check (package_size is null or package_size >= 0),
  constraint products_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint products_superseded_chk check (superseded_by is null or superseded_by <> id)
);
create unique index products_entity_sku_uidx
  on public.products (entity_id, sku)
  where entity_id is not null and sku is not null and superseded_by is null;
create unique index products_entity_name_variant_uidx
  on public.products (entity_id, lower(name), coalesce(lower(variant),''))
  where entity_id is not null and sku is null and superseded_by is null;
create index products_format_idx on public.products (product_format_id) where product_format_id is not null;
create index products_entity_idx on public.products (entity_id) where entity_id is not null;
create index products_status_idx on public.products (status, public_eligible);
create trigger products_set_updated_at
before update on public.products
for each row execute function public.hv_transaction_set_updated_at();

create table public.product_batches (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  batch_code text not null,
  facility_id uuid references public.entity_facilities(id) on delete set null,
  licence_id uuid references public.operator_licences(id) on delete set null,
  manufactured_at date,
  released_at date,
  expires_at date,
  quantity numeric,
  quantity_unit text,
  status public.hv_batch_status not null default 'unknown',
  classification public.hv_classification not null default 'internal',
  source_evidence_id uuid references public.hv_evidence(id) on delete set null,
  valid_from timestamptz,
  valid_to timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_batches_quantity_chk check (quantity is null or quantity >= 0),
  constraint product_batches_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint product_batches_release_after_manufacture_chk check (
    released_at is null or manufactured_at is null or released_at >= manufactured_at
  ),
  constraint product_batches_expiry_after_manufacture_chk check (
    expires_at is null or manufactured_at is null or expires_at >= manufactured_at
  ),
  constraint product_batches_expiry_after_release_chk check (
    expires_at is null or released_at is null or expires_at >= released_at
  ),
  unique (product_id, batch_code)
);
create index product_batches_batch_code_idx on public.product_batches (batch_code);
create index product_batches_facility_idx on public.product_batches (facility_id) where facility_id is not null;
create index product_batches_licence_idx on public.product_batches (licence_id) where licence_id is not null;
create index product_batches_manufactured_idx on public.product_batches (manufactured_at desc) where manufactured_at is not null;
create trigger product_batches_set_updated_at
before update on public.product_batches
for each row execute function public.hv_transaction_set_updated_at();

create table public.economic_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  primary_entity_id uuid references public.entities(id) on delete set null,
  country_iso2 text,
  region text,
  status public.hv_account_status not null default 'candidate',
  budget_owner_entity_id uuid references public.entities(id) on delete set null,
  procurement_owner_entity_id uuid references public.entities(id) on delete set null,
  classification public.hv_classification not null default 'confidential',
  valid_from date,
  valid_to date,
  superseded_by uuid references public.economic_accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint economic_accounts_country_iso2_chk check (country_iso2 is null or country_iso2 ~ '^[A-Z]{2}$'),
  constraint economic_accounts_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint economic_accounts_superseded_chk check (superseded_by is null or superseded_by <> id)
);
create index economic_accounts_normalized_name_idx on public.economic_accounts (normalized_name);
create index economic_accounts_primary_entity_idx on public.economic_accounts (primary_entity_id) where primary_entity_id is not null;
create index economic_accounts_status_idx on public.economic_accounts (status);
create trigger economic_accounts_set_updated_at
before update on public.economic_accounts
for each row execute function public.hv_transaction_set_updated_at();

create table public.economic_account_members (
  id uuid primary key default gen_random_uuid(),
  economic_account_id uuid not null references public.economic_accounts(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  operator_licence_id uuid references public.operator_licences(id) on delete cascade,
  facility_id uuid references public.entity_facilities(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  member_role public.hv_account_member_role not null,
  is_primary boolean not null default false,
  valid_from date,
  valid_to date,
  source_evidence_id uuid references public.hv_evidence(id) on delete set null,
  classification public.hv_classification not null default 'confidential',
  created_at timestamptz not null default now(),
  constraint economic_account_members_one_target_chk check (
    num_nonnulls(entity_id, operator_licence_id, facility_id, workspace_id) = 1
  ),
  constraint economic_account_members_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create index economic_account_members_account_idx on public.economic_account_members (economic_account_id);
create index economic_account_members_entity_idx on public.economic_account_members (entity_id) where entity_id is not null;
create index economic_account_members_licence_idx on public.economic_account_members (operator_licence_id) where operator_licence_id is not null;
create index economic_account_members_facility_idx on public.economic_account_members (facility_id) where facility_id is not null;
create index economic_account_members_workspace_idx on public.economic_account_members (workspace_id) where workspace_id is not null;

create or replace function public.hv_validate_economic_account_membership_period()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_key text;
  new_period daterange;
begin
  target_key := case
    when new.entity_id is not null then 'entity:' || new.entity_id::text
    when new.operator_licence_id is not null then 'licence:' || new.operator_licence_id::text
    when new.facility_id is not null then 'facility:' || new.facility_id::text
    when new.workspace_id is not null then 'workspace:' || new.workspace_id::text
    else null
  end;

  if target_key is null then
    raise exception 'economic account membership target is required';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(new.economic_account_id::text || '|' || new.member_role::text || '|' || target_key, 0)
  );

  new_period := daterange(
    coalesce(new.valid_from, '-infinity'::date),
    coalesce(new.valid_to, 'infinity'::date),
    '[)'
  );

  if exists (
    select 1
    from public.economic_account_members existing
    where existing.economic_account_id = new.economic_account_id
      and existing.member_role = new.member_role
      and existing.id is distinct from new.id
      and existing.entity_id is not distinct from new.entity_id
      and existing.operator_licence_id is not distinct from new.operator_licence_id
      and existing.facility_id is not distinct from new.facility_id
      and existing.workspace_id is not distinct from new.workspace_id
      and daterange(
        coalesce(existing.valid_from, '-infinity'::date),
        coalesce(existing.valid_to, 'infinity'::date),
        '[)'
      ) && new_period
  ) then
    raise exception 'economic account membership period overlaps an existing membership for %', target_key;
  end if;

  return new;
end;
$$;

create trigger economic_account_members_validate_period
before insert or update of economic_account_id, entity_id, operator_licence_id, facility_id, workspace_id, member_role, valid_from, valid_to
on public.economic_account_members
for each row execute function public.hv_validate_economic_account_membership_period();

-- Existing marketplace records remain snapshots/offers; these are nullable canonical bridges only.
-- Stage 6 converts the current public table-wide SELECT/INSERT/UPDATE grants to legacy-column allowlists
-- so these internal bridge identifiers are neither publicly readable nor publicly writable.
alter table public.listings
  add column if not exists product_id uuid references public.products(id) on delete set null,
  add column if not exists economic_account_id uuid references public.economic_accounts(id) on delete set null;
alter table public.buyer_requests
  add column if not exists product_id uuid references public.products(id) on delete set null,
  add column if not exists economic_account_id uuid references public.economic_accounts(id) on delete set null,
  add column if not exists opportunity_id uuid references public.opportunities(id) on delete set null;

create index if not exists listings_product_idx on public.listings (product_id) where product_id is not null;
create index if not exists listings_economic_account_idx on public.listings (economic_account_id) where economic_account_id is not null;
create index if not exists buyer_requests_product_idx on public.buyer_requests (product_id) where product_id is not null;
create index if not exists buyer_requests_economic_account_idx on public.buyer_requests (economic_account_id) where economic_account_id is not null;
create index if not exists buyer_requests_opportunity_idx on public.buyer_requests (opportunity_id) where opportunity_id is not null;

comment on table public.products is 'Canonical product/SKU identity; marketplace listings remain commercial offer snapshots.';
comment on table public.product_batches is 'Batch-level identity for COA, inventory, testing and compliance evidence.';
comment on table public.economic_accounts is 'Commercial buying/contracting unit. Never substitutes for workspaces tenancy/security.';
comment on table public.economic_account_members is 'Temporal consolidation of entities, licences, facilities or workspaces into one economic buying/contracting account; non-overlapping periods may rejoin later.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260811011000','transaction_product_account_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260811011000_transaction_product_account_foundation.sql

-- RECOVERY BEGIN 20260811012000_transaction_core_foundation.sql
-- Harbourview native transaction system: Stage 3 transaction core.

create type public.hv_transaction_stage as enum (
  'discovery','qualified','evidence_requested','diligence','economics_validated','proposal','negotiation','contracted','transacting','completed','lost','cancelled','archived'
);
create type public.hv_transaction_type as enum (
  'sale','purchase','testing_service','manufacturing_service','distribution','licensing','market_access','partnership','procurement','acquisition','investment','advisory','other'
);
create type public.hv_party_role as enum (
  'buyer','seller','supplier','manufacturer','laboratory','distributor','importer','exporter','regulator','government','implementation_partner','university','investor','advisor','harbourview','other'
);
create type public.hv_network_status as enum (
  'identified','qualifying','active','contracted','completed','abandoned','archived'
);
create type public.hv_visibility_scope as enum (
  'platform_only','transaction_parties','specific_party','public_projection'
);

create or replace function public.hv_transaction_network_key(
  jurisdiction_code text,
  buyer_account_id uuid,
  seller_account_id uuid,
  transaction_object text,
  commercial_period text
)
returns text
language plpgsql
immutable
strict
set search_path = public
as $$
begin
  if jurisdiction_code like '%|%'
     or transaction_object like '%|%'
     or commercial_period like '%|%' then
    raise exception 'transaction network key inputs cannot contain pipe separators';
  end if;

  if length(btrim(jurisdiction_code)) = 0
     or length(btrim(transaction_object)) = 0
     or length(btrim(commercial_period)) = 0 then
    raise exception 'transaction network key inputs cannot be empty';
  end if;

  return concat_ws('|',
    'NETWORK',
    upper(btrim(jurisdiction_code)),
    buyer_account_id::text,
    seller_account_id::text,
    lower(regexp_replace(btrim(transaction_object), '\s+', '-', 'g')),
    upper(regexp_replace(btrim(commercial_period), '\s+', '-', 'g'))
  );
end;
$$;

create table public.transaction_networks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  jurisdiction_code text,
  trigger_artifact_id uuid references public.hv_artifacts(id) on delete set null,
  trigger_signal_id text,
  commercial_thesis text,
  transaction_object_type text not null,
  status public.hv_network_status not null default 'identified',
  double_count_key text not null,
  classification public.hv_classification not null default 'confidential',
  valid_from timestamptz,
  valid_to timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transaction_networks_key_chk check (double_count_key like 'NETWORK|%'),
  constraint transaction_networks_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from),
  unique (double_count_key)
);
create index transaction_networks_status_idx on public.transaction_networks (status);
create index transaction_networks_jurisdiction_idx on public.transaction_networks (jurisdiction_code) where jurisdiction_code is not null;
create index transaction_networks_trigger_artifact_idx on public.transaction_networks (trigger_artifact_id) where trigger_artifact_id is not null;
create trigger transaction_networks_set_updated_at
before update on public.transaction_networks
for each row execute function public.hv_transaction_set_updated_at();

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  network_id uuid references public.transaction_networks(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  economic_account_id uuid references public.economic_accounts(id) on delete set null,
  transaction_type public.hv_transaction_type not null,
  title text not null,
  description text,
  stage public.hv_transaction_stage not null default 'discovery',
  jurisdiction_code text,
  currency text,
  target_decision_date date,
  expected_close_date date,
  contracted_at timestamptz,
  completed_at timestamptz,
  lost_at timestamptz,
  loss_reason text,
  classification public.hv_classification not null default 'confidential',
  created_by uuid references auth.users(id) on delete set null,
  owned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_currency_chk check (currency is null or currency ~ '^[A-Z]{3}$'),
  constraint transactions_completed_stage_chk check (completed_at is null or stage in ('completed','archived')),
  constraint transactions_lost_stage_chk check (lost_at is null or stage in ('lost','archived')),
  constraint transactions_terminal_outcome_chk check (not (completed_at is not null and lost_at is not null))
);
create index transactions_network_idx on public.transactions (network_id) where network_id is not null;
create index transactions_opportunity_idx on public.transactions (opportunity_id) where opportunity_id is not null;
create index transactions_account_idx on public.transactions (economic_account_id) where economic_account_id is not null;
create index transactions_stage_idx on public.transactions (stage, target_decision_date);
create index transactions_owner_idx on public.transactions (owned_by) where owned_by is not null;
create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.hv_transaction_set_updated_at();

create table public.transaction_parties (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  economic_account_id uuid references public.economic_accounts(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  party_role public.hv_party_role not null,
  contracting_entity boolean not null default false,
  budget_owner boolean not null default false,
  procurement_owner boolean not null default false,
  signatory_required boolean not null default false,
  signatory_status text,
  visibility_scope public.hv_visibility_scope not null default 'platform_only',
  classification public.hv_classification not null default 'confidential',
  valid_from timestamptz,
  valid_to timestamptz,
  created_at timestamptz not null default now(),
  constraint transaction_parties_target_chk check (num_nonnulls(entity_id, economic_account_id, workspace_id) >= 1),
  constraint transaction_parties_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint transaction_parties_specific_visibility_chk check (visibility_scope <> 'specific_party'),
  constraint transaction_parties_id_transaction_unique unique (id, transaction_id)
);
create unique index transaction_parties_identity_uidx
  on public.transaction_parties (
    transaction_id,
    party_role,
    coalesce(entity_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(economic_account_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(workspace_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
create index transaction_parties_transaction_idx on public.transaction_parties (transaction_id);
create index transaction_parties_workspace_idx on public.transaction_parties (workspace_id) where workspace_id is not null;
create index transaction_parties_account_idx on public.transaction_parties (economic_account_id) where economic_account_id is not null;

-- Existing-domain compatibility changes are nullable foreign-key bridges only.
-- Existing APIs continue reading their existing fields.
alter table public.opportunities
  add column if not exists entity_id uuid references public.entities(id) on delete set null,
  add column if not exists economic_account_id uuid references public.economic_accounts(id) on delete set null,
  add column if not exists trigger_artifact_id uuid references public.hv_artifacts(id) on delete set null,
  add column if not exists transaction_network_id uuid references public.transaction_networks(id) on delete set null;

alter table public.matches
  add column if not exists opportunity_id uuid references public.opportunities(id) on delete set null,
  add column if not exists transaction_network_id uuid references public.transaction_networks(id) on delete set null;

alter table public.deal_rooms
  add column if not exists transaction_id uuid references public.transactions(id) on delete set null;
create unique index if not exists deal_rooms_transaction_uidx on public.deal_rooms (transaction_id) where transaction_id is not null;

-- engagements/commissions exist on the live project but are production-drift tables that are not
-- defined by the repository migration replay. Guard these bridges so fresh repository replays remain valid.
alter table if exists public.engagements
  add column if not exists economic_account_id uuid references public.economic_accounts(id) on delete set null,
  add column if not exists transaction_id uuid references public.transactions(id) on delete set null;
alter table if exists public.commissions
  add column if not exists transaction_id uuid references public.transactions(id) on delete set null;

create index if not exists opportunities_entity_idx on public.opportunities (entity_id) where entity_id is not null;
create index if not exists opportunities_economic_account_idx on public.opportunities (economic_account_id) where economic_account_id is not null;
create index if not exists opportunities_transaction_network_idx on public.opportunities (transaction_network_id) where transaction_network_id is not null;
create index if not exists matches_opportunity_idx on public.matches (opportunity_id) where opportunity_id is not null;
create index if not exists matches_transaction_network_idx on public.matches (transaction_network_id) where transaction_network_id is not null;

do $$
begin
  if to_regclass('public.engagements') is not null then
    execute 'create index if not exists engagements_economic_account_idx on public.engagements (economic_account_id) where economic_account_id is not null';
    execute 'create index if not exists engagements_transaction_idx on public.engagements (transaction_id) where transaction_id is not null';
  end if;
  if to_regclass('public.commissions') is not null then
    execute 'create index if not exists commissions_transaction_idx on public.commissions (transaction_id) where transaction_id is not null';
  end if;
end;
$$;

comment on table public.transaction_networks is 'Economic grouping/double-counting control. IA graph remains the discovery graph.';
comment on table public.transactions is 'Canonical Harbourview-facilitated commercial transaction; deal_rooms remain execution/collaboration surfaces.';
comment on table public.transaction_parties is 'Generic transaction participant model used for contracting roles and participant-safe authorization.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260811012000','transaction_core_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260811012000_transaction_core_foundation.sql

-- RECOVERY BEGIN 20260811013000_transaction_assertion_diligence_foundation.sql
-- Harbourview native transaction system: Stage 4 assertions, evidence lineage and diligence.

create type public.hv_assertion_status as enum (
  'unverified','supported','verified','conflicted','rejected','superseded','expired'
);
create type public.hv_assertion_value_type as enum (
  'text','numeric','boolean','date','timestamp','json','entity_ref'
);
create type public.hv_diligence_status as enum (
  'not_requested','requested','received','validating','passed','failed','waived','expired'
);
create type public.hv_diligence_requirement_type as enum (
  'licence','coa','invoice','purchase_order','rate_card','inventory','batch_record','testing_record','certificate','contract','corporate_record','insurance','banking','tax','procurement','authorization','identity','other'
);

create table public.assertions (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null,
  subject_id uuid not null,
  predicate text not null,
  value_type public.hv_assertion_value_type not null,
  value_text text,
  value_numeric numeric,
  value_boolean boolean,
  value_date date,
  value_timestamp timestamptz,
  value_json jsonb,
  value_entity_id uuid references public.entities(id) on delete set null,
  unit text,
  status public.hv_assertion_status not null default 'unverified',
  confidence_score numeric(5,2),
  source_authority_score numeric(5,2),
  evidence_quality_score numeric(5,2),
  freshness_score numeric(5,2),
  confidence_reason text,
  observed_at timestamptz,
  valid_from timestamptz,
  valid_to timestamptz,
  next_review_at timestamptz,
  decay_policy text,
  classification public.hv_classification not null default 'internal',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  supersedes_assertion_id uuid references public.assertions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assertions_subject_type_chk check (length(btrim(subject_type)) > 0),
  constraint assertions_predicate_chk check (length(btrim(predicate)) > 0),
  constraint assertions_value_count_chk check (
    num_nonnulls(value_text, value_numeric, value_boolean, value_date, value_timestamp, value_json, value_entity_id) = 1
  ),
  constraint assertions_value_type_chk check (
    (value_type = 'text' and value_text is not null) or
    (value_type = 'numeric' and value_numeric is not null) or
    (value_type = 'boolean' and value_boolean is not null) or
    (value_type = 'date' and value_date is not null) or
    (value_type = 'timestamp' and value_timestamp is not null) or
    (value_type = 'json' and value_json is not null) or
    (value_type = 'entity_ref' and value_entity_id is not null)
  ),
  constraint assertions_confidence_chk check (confidence_score is null or confidence_score between 0 and 100),
  constraint assertions_authority_chk check (source_authority_score is null or source_authority_score between 0 and 100),
  constraint assertions_evidence_quality_chk check (evidence_quality_score is null or evidence_quality_score between 0 and 100),
  constraint assertions_freshness_chk check (freshness_score is null or freshness_score between 0 and 100),
  constraint assertions_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint assertions_supersedes_chk check (supersedes_assertion_id is null or supersedes_assertion_id <> id)
);
create index assertions_subject_idx on public.assertions (subject_type, subject_id);
create index assertions_predicate_idx on public.assertions (predicate, status);
create index assertions_review_due_idx on public.assertions (next_review_at) where next_review_at is not null;
create index assertions_supersedes_idx on public.assertions (supersedes_assertion_id) where supersedes_assertion_id is not null;
create trigger assertions_set_updated_at
before update on public.assertions
for each row execute function public.hv_transaction_set_updated_at();

create table public.evidence_links (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.hv_evidence(id) on delete cascade,
  evidence_document_id uuid references public.hv_evidence_documents(id) on delete set null,
  subject_type text not null,
  subject_id uuid not null,
  link_type text not null,
  supports boolean not null default true,
  weight numeric(5,2),
  classification public.hv_classification not null default 'internal',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint evidence_links_weight_chk check (weight is null or weight between 0 and 100),
  constraint evidence_links_subject_chk check (length(btrim(subject_type)) > 0),
  constraint evidence_links_type_chk check (length(btrim(link_type)) > 0),
  unique (evidence_id, subject_type, subject_id, link_type)
);
create index evidence_links_subject_idx on public.evidence_links (subject_type, subject_id);
create index evidence_links_document_idx on public.evidence_links (evidence_document_id) where evidence_document_id is not null;

create table public.diligence_requirements (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  economic_account_id uuid references public.economic_accounts(id) on delete set null,
  party_id uuid,
  requirement_type public.hv_diligence_requirement_type not null,
  name text not null,
  description text,
  required boolean not null default true,
  requested_date_from date,
  requested_date_to date,
  requested_fields jsonb not null default '[]'::jsonb,
  acceptable_substitutes jsonb not null default '[]'::jsonb,
  matching_keys jsonb not null default '[]'::jsonb,
  validation_rules jsonb not null default '[]'::jsonb,
  status public.hv_diligence_status not null default 'not_requested',
  due_at timestamptz,
  received_at timestamptz,
  validated_at timestamptz,
  validated_by uuid references auth.users(id) on delete set null,
  fulfilled_evidence_id uuid references public.hv_evidence(id) on delete set null,
  classification public.hv_classification not null default 'confidential',
  visibility_scope public.hv_visibility_scope not null default 'platform_only',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diligence_requested_period_chk check (
    requested_date_to is null or requested_date_from is null or requested_date_to >= requested_date_from
  ),
  constraint diligence_specific_party_chk check (
    visibility_scope <> 'specific_party' or party_id is not null
  ),
  constraint diligence_validation_status_chk check (
    status not in ('passed','failed') or validated_at is not null
  ),
  constraint diligence_party_transaction_fk foreign key (party_id, transaction_id)
    references public.transaction_parties(id, transaction_id)
    on delete no action
);
create index diligence_requirements_transaction_idx on public.diligence_requirements (transaction_id, status);
create index diligence_requirements_account_idx on public.diligence_requirements (economic_account_id) where economic_account_id is not null;
create index diligence_requirements_party_idx on public.diligence_requirements (party_id) where party_id is not null;
create index diligence_requirements_due_idx on public.diligence_requirements (due_at) where due_at is not null;
create unique index diligence_requirements_active_uidx
  on public.diligence_requirements (transaction_id, requirement_type, name)
  where status not in ('waived','expired');
create trigger diligence_requirements_set_updated_at
before update on public.diligence_requirements
for each row execute function public.hv_transaction_set_updated_at();

comment on table public.assertions is 'Evidence-backed typed claims about canonical subjects. Verification is independent from transaction probability.';
comment on table public.evidence_links is 'Generic lineage links that reuse hv_evidence/hv_evidence_documents instead of creating another evidence vault.';
comment on table public.diligence_requirements is 'Transaction-specific primary-evidence requests and validation contracts. Specific-party requirements are FK-bound to a party in the same transaction.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260811013000','transaction_assertion_diligence_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260811013000_transaction_assertion_diligence_foundation.sql

-- RECOVERY BEGIN 20260811014000_transaction_economics_decisions_foundation.sql
-- Harbourview native transaction system: Stage 5 append-only economics + transaction decisions.

create type public.hv_economics_metric_type as enum (
  'estimated_gtv','modeled_gtv','evidenced_gtv','contracted_gtv','transacted_gtv',
  'harbourview_addressable_revenue','harbourview_accrued_revenue','harbourview_invoiced_revenue','harbourview_collected_revenue',
  'cost','gross_margin','other'
);
create type public.hv_economics_basis as enum (
  'unknown','scenario','modeled','primary_evidence','contract','invoice','settlement'
);
create type public.hv_economics_status as enum (
  'draft','provisional','validated','superseded','void'
);
create type public.hv_transaction_decision_type as enum (
  'qualify','advance','hold','reject','approve_diligence','reject_diligence','approve_economics','select_counterparty',
  'authorize_proposal','authorize_contract','close_won','close_lost','cancel','reopen'
);
create type public.hv_decision_status as enum (
  'pending','approved','rejected','superseded'
);

create table public.transaction_economics_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete restrict,
  network_id uuid references public.transaction_networks(id) on delete restrict,
  metric_type public.hv_economics_metric_type not null,
  basis public.hv_economics_basis not null,
  status public.hv_economics_status not null default 'draft',
  amount numeric(20,6),
  currency text,
  quantity numeric(20,6),
  quantity_unit text,
  unit_rate numeric(20,6),
  formula_text text,
  calculation_inputs jsonb not null default '{}'::jsonb,
  evidence_id uuid references public.hv_evidence(id) on delete restrict,
  assertion_id uuid references public.assertions(id) on delete restrict,
  contract_document_id uuid references public.hv_evidence_documents(id) on delete restrict,
  effective_at timestamptz,
  recognized_at timestamptz,
  scenario_only boolean not null default false,
  recognition_key text not null,
  visibility_scope public.hv_visibility_scope not null default 'platform_only',
  specific_party_id uuid,
  classification public.hv_classification not null default 'confidential',
  supersedes_entry_id uuid references public.transaction_economics_entries(id) on delete restrict,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint transaction_economics_amount_chk check (
    amount is null or amount >= 0 or metric_type = 'gross_margin'
  ),
  constraint transaction_economics_quantity_chk check (quantity is null or quantity >= 0),
  constraint transaction_economics_rate_chk check (unit_rate is null or unit_rate >= 0),
  constraint transaction_economics_currency_chk check (currency is null or currency ~ '^[A-Z]{3}$'),
  constraint transaction_economics_key_chk check (length(btrim(recognition_key)) > 0),
  constraint transaction_economics_specific_party_chk check (
    visibility_scope <> 'specific_party' or specific_party_id is not null
  ),
  constraint transaction_economics_specific_party_transaction_fk foreign key (specific_party_id, transaction_id)
    references public.transaction_parties(id, transaction_id)
    on delete restrict,
  constraint transaction_economics_primary_evidence_chk check (
    basis <> 'primary_evidence' or evidence_id is not null or assertion_id is not null
  ),
  constraint transaction_economics_contract_chk check (
    basis <> 'contract' or contract_document_id is not null
  ),
  constraint transaction_economics_transacted_basis_chk check (
    metric_type <> 'transacted_gtv' or basis in ('primary_evidence','invoice','settlement')
  ),
  constraint transaction_economics_scenario_chk check (
    (scenario_only and basis = 'scenario') or (not scenario_only and basis <> 'scenario')
  ),
  constraint transaction_economics_supersedes_chk check (supersedes_entry_id is null or supersedes_entry_id <> id)
);
create index transaction_economics_transaction_idx on public.transaction_economics_entries (transaction_id, metric_type, created_at desc);
create index transaction_economics_network_idx on public.transaction_economics_entries (network_id, metric_type) where network_id is not null;
create index transaction_economics_recognition_idx on public.transaction_economics_entries (recognition_key, status, scenario_only);
create index transaction_economics_supersedes_idx on public.transaction_economics_entries (supersedes_entry_id) where supersedes_entry_id is not null;
create index transaction_economics_evidence_idx on public.transaction_economics_entries (evidence_id) where evidence_id is not null;

create or replace function public.hv_validate_economics_recognition_chain()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  current_leaf uuid;
  parent_tx uuid;
  parent_key text;
begin
  -- Serialize authoritative inserts by recognition event. Without this lock, two concurrent
  -- first inserts can both observe no current leaf and double-book the same economic event.
  if new.status = 'validated' and not new.scenario_only then
    perform pg_advisory_xact_lock(hashtextextended(new.recognition_key, 0));
  end if;

  if new.supersedes_entry_id is not null then
    select transaction_id, recognition_key
      into parent_tx, parent_key
      from public.transaction_economics_entries
     where id = new.supersedes_entry_id;

    if parent_tx is null then
      raise exception 'supersedes_entry_id % does not exist', new.supersedes_entry_id;
    end if;
    if parent_tx <> new.transaction_id or parent_key <> new.recognition_key then
      raise exception 'economics supersession must remain in the same transaction and recognition_key';
    end if;
  end if;

  if new.status = 'validated' and not new.scenario_only then
    select e.id
      into current_leaf
      from public.transaction_economics_entries e
     where e.recognition_key = new.recognition_key
       and e.status = 'validated'
       and not e.scenario_only
       and not exists (
         select 1
           from public.transaction_economics_entries child
          where child.supersedes_entry_id = e.id
            and child.status = 'validated'
            and not child.scenario_only
       )
     order by e.created_at desc, e.id desc
     limit 1;

    if current_leaf is not null and new.supersedes_entry_id is distinct from current_leaf then
      raise exception 'validated recognition_key % already has current entry %; replacement must explicitly supersede it',
        new.recognition_key, current_leaf;
    end if;
  end if;

  return new;
end;
$$;

create trigger transaction_economics_recognition_chain
before insert on public.transaction_economics_entries
for each row execute function public.hv_validate_economics_recognition_chain();

create or replace function public.hv_prevent_economics_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'transaction_economics_entries is append-only; insert a superseding entry instead';
end;
$$;

create trigger transaction_economics_append_only
before update or delete on public.transaction_economics_entries
for each row execute function public.hv_prevent_economics_mutation();

create table public.transaction_decisions (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  decision_type public.hv_transaction_decision_type not null,
  status public.hv_decision_status not null default 'pending',
  decision_note text,
  previous_stage public.hv_transaction_stage,
  new_stage public.hv_transaction_stage,
  evidence_ids uuid[] not null default '{}'::uuid[],
  assertion_ids uuid[] not null default '{}'::uuid[],
  economics_entry_ids uuid[] not null default '{}'::uuid[],
  decided_by uuid not null references auth.users(id) on delete restrict,
  decided_at timestamptz not null default now(),
  classification public.hv_classification not null default 'confidential',
  supersedes_decision_id uuid references public.transaction_decisions(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint transaction_decisions_stage_change_chk check (
    new_stage is null or previous_stage is distinct from new_stage
  ),
  constraint transaction_decisions_supersedes_chk check (supersedes_decision_id is null or supersedes_decision_id <> id)
);
create index transaction_decisions_transaction_idx on public.transaction_decisions (transaction_id, decided_at desc);
create index transaction_decisions_type_idx on public.transaction_decisions (decision_type, status);

-- commissions exists on the live project but is production drift, so the bridge is replay-safe.
alter table if exists public.commissions
  add column if not exists economics_entry_id uuid references public.transaction_economics_entries(id) on delete set null;
do $$
begin
  if to_regclass('public.commissions') is not null then
    execute 'create index if not exists commissions_economics_entry_idx on public.commissions (economics_entry_id) where economics_entry_id is not null';
  end if;
end;
$$;

comment on table public.transaction_economics_entries is 'Append-only economics ledger. Stronger evidence is appended with supersedes_entry_id; authoritative inserts are serialized by recognition key; GTV and Harbourview revenue remain distinct metrics.';
comment on table public.transaction_decisions is 'Evidence/economics-aware commercial decisions, separate from hv_review_decisions publication governance.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260811014000','transaction_economics_decisions_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260811014000_transaction_economics_decisions_foundation.sql

-- RECOVERY BEGIN 20260811015000_transaction_rls_views_import_staging.sql
-- Harbourview native transaction system: Stage 6 authorization, safe views, audit hooks and controlled fixture staging.
-- No canonical transaction table is anonymously readable. Public exposure remains DTO/projection based.

create or replace function public.hv_has_transaction_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
      from public.user_roles ur
     where ur.user_id = auth.uid()
       and ur.role = any(allowed_roles)
  );
$$;

create or replace function public.hv_is_transaction_participant(target_transaction uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
      from public.transaction_parties tp
      join public.workspace_members wm on wm.workspace_id = tp.workspace_id
     where tp.transaction_id = target_transaction
       and tp.workspace_id is not null
       and wm.user_id = auth.uid()
       and wm.status = 'active'
       and (tp.valid_from is null or tp.valid_from <= now())
       and (tp.valid_to is null or tp.valid_to > now())
  );
$$;

create or replace function public.hv_is_specific_transaction_party(target_party uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
      from public.transaction_parties tp
      join public.workspace_members wm on wm.workspace_id = tp.workspace_id
     where tp.id = target_party
       and tp.workspace_id is not null
       and wm.user_id = auth.uid()
       and wm.status = 'active'
       and (tp.valid_from is null or tp.valid_from <= now())
       and (tp.valid_to is null or tp.valid_to > now())
  );
$$;

create or replace function public.hv_transaction_economics_key(
  network_key text,
  target_transaction uuid,
  target_metric public.hv_economics_metric_type,
  economic_event text,
  target_currency text
)
returns text
language sql
immutable
set search_path = public
as $$
  select concat_ws('|',
    'ECON',
    coalesce(nullif(btrim(network_key), ''), concat('TX|', target_transaction::text)),
    target_metric::text,
    lower(regexp_replace(btrim(economic_event), '\s+', '-', 'g')),
    upper(btrim(target_currency))
  );
$$;

alter table public.transaction_economics_entries
  add constraint transaction_economics_recognition_prefix_chk check (recognition_key like 'ECON|%');

revoke all on function public.hv_has_transaction_role(text[]) from public, anon;
revoke all on function public.hv_is_transaction_participant(uuid) from public, anon;
revoke all on function public.hv_is_specific_transaction_party(uuid) from public, anon;
revoke all on function public.hv_transaction_economics_key(text,uuid,public.hv_economics_metric_type,text,text) from public, anon;
grant execute on function public.hv_has_transaction_role(text[]) to authenticated, service_role;
grant execute on function public.hv_is_transaction_participant(uuid) to authenticated, service_role;
grant execute on function public.hv_is_specific_transaction_party(uuid) to authenticated, service_role;
grant execute on function public.hv_transaction_economics_key(text,uuid,public.hv_economics_metric_type,text,text) to authenticated, service_role;

-- Controlled workbook fixture staging. It stores source rows before reviewed canonical resolution.
create table public.transaction_import_staging (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null,
  record_kind text not null,
  source_workbook_hash text not null,
  source_sheet text not null,
  source_row_key text not null,
  payload jsonb not null,
  fixture_expected_counts jsonb not null default '{"master_records":165,"execution_packages":69,"economic_accounts":64,"transaction_networks":10}'::jsonb,
  validation_status text not null default 'pending',
  resolved_entity_id uuid references public.entities(id) on delete set null,
  resolved_account_id uuid references public.economic_accounts(id) on delete set null,
  resolved_network_id uuid references public.transaction_networks(id) on delete set null,
  resolved_transaction_id uuid references public.transactions(id) on delete set null,
  validation_errors jsonb not null default '[]'::jsonb,
  classification public.hv_classification not null default 'restricted',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint transaction_import_record_kind_chk check (
    record_kind in ('master_record','execution_package','economic_account','transaction_network')
  ),
  constraint transaction_import_validation_status_chk check (
    validation_status in ('pending','resolved','unresolved','conflicted','rejected')
  ),
  constraint transaction_import_hash_chk check (length(btrim(source_workbook_hash)) >= 32),
  unique (import_batch_id, record_kind, source_sheet, source_row_key)
);
create index transaction_import_staging_batch_idx on public.transaction_import_staging (import_batch_id, record_kind, validation_status);
create index transaction_import_staging_entity_idx on public.transaction_import_staging (resolved_entity_id) where resolved_entity_id is not null;
create index transaction_import_staging_account_idx on public.transaction_import_staging (resolved_account_id) where resolved_account_id is not null;

-- RLS is enabled before authenticated privileges are granted.
alter table public.entities enable row level security;
alter table public.entity_aliases enable row level security;
alter table public.entity_facilities enable row level security;
alter table public.products enable row level security;
alter table public.product_batches enable row level security;
alter table public.economic_accounts enable row level security;
alter table public.economic_account_members enable row level security;
alter table public.transaction_networks enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_parties enable row level security;
alter table public.assertions enable row level security;
alter table public.evidence_links enable row level security;
alter table public.diligence_requirements enable row level security;
alter table public.transaction_economics_entries enable row level security;
alter table public.transaction_decisions enable row level security;
alter table public.transaction_import_staging enable row level security;

-- Anonymous access to canonical transaction data is explicitly denied at the grant layer.
revoke all on table
  public.entities, public.entity_aliases, public.entity_facilities, public.products, public.product_batches,
  public.economic_accounts, public.economic_account_members, public.transaction_networks, public.transactions,
  public.transaction_parties, public.assertions, public.evidence_links, public.diligence_requirements,
  public.transaction_economics_entries, public.transaction_decisions, public.transaction_import_staging
from anon;

grant select, insert, update, delete on table
  public.entities, public.entity_aliases, public.entity_facilities, public.products, public.product_batches,
  public.economic_accounts, public.economic_account_members, public.transaction_networks, public.transactions,
  public.transaction_parties, public.assertions, public.evidence_links, public.diligence_requirements,
  public.transaction_decisions, public.transaction_import_staging
to authenticated;
grant select, insert on table public.transaction_economics_entries to authenticated;

grant all on table
  public.entities, public.entity_aliases, public.entity_facilities, public.products, public.product_batches,
  public.economic_accounts, public.economic_account_members, public.transaction_networks, public.transactions,
  public.transaction_parties, public.assertions, public.evidence_links, public.diligence_requirements,
  public.transaction_economics_entries, public.transaction_decisions, public.transaction_import_staging
to service_role;

-- Internal canonical tables: analysts/reviewers read, operators/admins write.
create policy entities_internal_read on public.entities for select to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer'])));
create policy entities_internal_write on public.entities for all to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])))
with check ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])));

create policy entity_aliases_internal_read on public.entity_aliases for select to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer'])));
create policy entity_aliases_internal_write on public.entity_aliases for all to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])))
with check ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])));

create policy entity_facilities_internal_read on public.entity_facilities for select to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer'])));
create policy entity_facilities_internal_write on public.entity_facilities for all to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])))
with check ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])));

create policy products_internal_read on public.products for select to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer'])));
create policy products_internal_write on public.products for all to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])))
with check ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])));

create policy product_batches_internal_read on public.product_batches for select to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer'])));
create policy product_batches_internal_write on public.product_batches for all to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])))
with check ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])));

create policy economic_accounts_internal_read on public.economic_accounts for select to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer'])));
create policy economic_accounts_internal_write on public.economic_accounts for all to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])))
with check ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])));

create policy economic_account_members_internal_read on public.economic_account_members for select to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer'])));
create policy economic_account_members_internal_write on public.economic_account_members for all to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])))
with check ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])));

create policy transaction_networks_internal_read on public.transaction_networks for select to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer'])));
create policy transaction_networks_internal_write on public.transaction_networks for all to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])))
with check ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])));

create policy assertions_internal_read on public.assertions for select to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer'])));
create policy assertions_internal_write on public.assertions for all to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])))
with check ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])));

create policy evidence_links_internal_read on public.evidence_links for select to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer'])));
create policy evidence_links_internal_write on public.evidence_links for all to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])))
with check ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])));

create policy transaction_decisions_internal_read on public.transaction_decisions for select to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer'])));
create policy transaction_decisions_internal_write on public.transaction_decisions for all to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])))
with check ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])));

create policy transaction_import_internal_read on public.transaction_import_staging for select to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer'])));
create policy transaction_import_internal_write on public.transaction_import_staging for all to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])))
with check ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])));

-- Transaction participants may only read transactions in which an active workspace membership is explicitly a party.
create policy transactions_internal_or_party_read on public.transactions for select to authenticated
using (
  (select public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer']))
  or public.hv_is_transaction_participant(id)
);
create policy transactions_internal_write on public.transactions for all to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])))
with check ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])));

create policy transaction_parties_internal_or_party_read on public.transaction_parties for select to authenticated
using (
  (select public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer']))
  or public.hv_is_transaction_participant(transaction_id)
);
create policy transaction_parties_internal_write on public.transaction_parties for all to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])))
with check ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])));

create policy diligence_internal_or_shared_read on public.diligence_requirements for select to authenticated
using (
  (select public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer']))
  or (
    public.hv_is_transaction_participant(transaction_id)
    and (
      visibility_scope = 'transaction_parties'
      or (visibility_scope = 'specific_party' and party_id is not null and public.hv_is_specific_transaction_party(party_id))
    )
  )
);
create policy diligence_internal_write on public.diligence_requirements for all to authenticated
using ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])))
with check ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])));

-- Harbourview fee, margin and revenue-recognition metrics are never participant-readable by default.
create policy transaction_economics_internal_or_shared_read on public.transaction_economics_entries for select to authenticated
using (
  (select public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer']))
  or (
    public.hv_is_transaction_participant(transaction_id)
    and metric_type not in (
      'harbourview_addressable_revenue','harbourview_accrued_revenue','harbourview_invoiced_revenue','harbourview_collected_revenue','gross_margin'
    )
    and (
      visibility_scope = 'transaction_parties'
      or (visibility_scope = 'specific_party' and specific_party_id is not null and public.hv_is_specific_transaction_party(specific_party_id))
    )
  )
);
create policy transaction_economics_internal_insert on public.transaction_economics_entries for insert to authenticated
with check ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])));

-- Current authoritative economics are leaf entries in the immutable supersession chain.
create view public.transaction_current_economics_v1
with (security_invoker = true)
as
select e.*
from public.transaction_economics_entries e
where e.status = 'validated'
  and not e.scenario_only
  and not exists (
    select 1
    from public.transaction_economics_entries child
    where child.supersedes_entry_id = e.id
      and child.status = 'validated'
      and not child.scenario_only
  );

create view public.transaction_portfolio_economics_v1
with (security_invoker = true)
as
select metric_type, currency, count(*) as recognized_events, sum(amount) as amount
from public.transaction_current_economics_v1
where amount is not null
group by metric_type, currency;

create view public.transaction_diligence_readiness_v1
with (security_invoker = true)
as
select
  transaction_id,
  count(*) filter (where required) as required_count,
  count(*) filter (where required and status in ('received','validating','passed')) as received_count,
  count(*) filter (where required and status = 'passed') as passed_count,
  bool_and((not required) or status in ('passed','waived')) as minimum_gate_satisfied
from public.diligence_requirements
group by transaction_id;

create view public.transaction_party_safe_v1
with (security_invoker = true)
as
select
  t.id as transaction_id,
  t.title,
  t.transaction_type,
  t.stage,
  t.jurisdiction_code,
  t.target_decision_date,
  t.expected_close_date,
  p.id as party_id,
  p.party_role,
  p.entity_id,
  p.economic_account_id,
  p.workspace_id,
  p.contracting_entity,
  p.signatory_required,
  p.signatory_status
from public.transactions t
join public.transaction_parties p on p.transaction_id = t.id;

create view public.transaction_participant_economics_v1
with (security_invoker = true)
as
select
  id,
  transaction_id,
  network_id,
  metric_type,
  basis,
  amount,
  currency,
  quantity,
  quantity_unit,
  unit_rate,
  effective_at,
  recognized_at,
  recognition_key
from public.transaction_current_economics_v1
where metric_type not in (
  'harbourview_addressable_revenue','harbourview_accrued_revenue','harbourview_invoiced_revenue','harbourview_collected_revenue','gross_margin'
);

create view public.transaction_lineage_v1
with (security_invoker = true)
as
select
  e.id as economics_entry_id,
  e.transaction_id,
  e.metric_type,
  e.basis,
  e.amount,
  e.currency,
  e.recognition_key,
  a.id as assertion_id,
  a.subject_type,
  a.subject_id,
  a.predicate,
  a.status as assertion_status,
  ev.id as evidence_id,
  ev.content_hash,
  ev.captured_at as evidence_captured_at,
  ev.classification as evidence_classification
from public.transaction_current_economics_v1 e
left join public.assertions a on a.id = e.assertion_id
left join public.hv_evidence ev on ev.id = e.evidence_id;

revoke all on public.transaction_current_economics_v1 from anon;
revoke all on public.transaction_portfolio_economics_v1 from anon;
revoke all on public.transaction_diligence_readiness_v1 from anon;
revoke all on public.transaction_party_safe_v1 from anon;
revoke all on public.transaction_participant_economics_v1 from anon;
revoke all on public.transaction_lineage_v1 from anon;
grant select on public.transaction_current_economics_v1 to authenticated, service_role;
grant select on public.transaction_portfolio_economics_v1 to authenticated, service_role;
grant select on public.transaction_diligence_readiness_v1 to authenticated, service_role;
grant select on public.transaction_party_safe_v1 to authenticated, service_role;
grant select on public.transaction_participant_economics_v1 to authenticated, service_role;
grant select on public.transaction_lineage_v1 to authenticated, service_role;

-- Existing audit tables remain canonical. New commercial state transitions append to them.
create or replace function public.hv_audit_transaction_state()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_events(entity_type, entity_id, action, actor, actor_user_id, metadata)
    values ('transaction', new.id, 'transaction_created', coalesce(auth.uid()::text,'system'), auth.uid(),
      jsonb_build_object('stage', new.stage::text, 'transaction_type', new.transaction_type::text));
    insert into public.status_history(entity_type, entity_id, from_status, to_status, changed_by, reason)
    values ('transaction', new.id, null, new.stage::text, coalesce(auth.uid()::text,'system'), 'transaction created');
  elsif new.stage is distinct from old.stage then
    insert into public.audit_events(entity_type, entity_id, action, actor, actor_user_id, metadata)
    values ('transaction', new.id, 'transaction_stage_changed', coalesce(auth.uid()::text,'system'), auth.uid(),
      jsonb_build_object('from_stage', old.stage::text, 'to_stage', new.stage::text));
    insert into public.status_history(entity_type, entity_id, from_status, to_status, changed_by, reason)
    values ('transaction', new.id, old.stage::text, new.stage::text, coalesce(auth.uid()::text,'system'), 'transaction stage changed');
  end if;
  return new;
end;
$$;

create trigger transactions_audit_state
after insert or update of stage on public.transactions
for each row execute function public.hv_audit_transaction_state();

create or replace function public.hv_audit_economics_insert()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.audit_events(entity_type, entity_id, action, actor, actor_user_id, metadata)
  values ('transaction', new.transaction_id, 'transaction_economics_appended', coalesce(auth.uid()::text,'system'), auth.uid(),
    jsonb_build_object(
      'economics_entry_id', new.id,
      'metric_type', new.metric_type::text,
      'basis', new.basis::text,
      'status', new.status::text,
      'recognition_key', new.recognition_key,
      'scenario_only', new.scenario_only
    ));
  return new;
end;
$$;
create trigger transaction_economics_audit_insert
after insert on public.transaction_economics_entries
for each row execute function public.hv_audit_economics_insert();

create or replace function public.hv_audit_diligence_state()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.audit_events(entity_type, entity_id, action, actor, actor_user_id, metadata)
    values ('transaction', new.transaction_id, 'diligence_status_changed', coalesce(auth.uid()::text,'system'), auth.uid(),
      jsonb_build_object(
        'diligence_requirement_id', new.id,
        'requirement_type', new.requirement_type::text,
        'status', new.status::text,
        'previous_status', case when tg_op = 'UPDATE' then old.status::text else null end
      ));
  end if;
  return new;
end;
$$;
create trigger diligence_requirements_audit_state
after insert or update of status on public.diligence_requirements
for each row execute function public.hv_audit_diligence_state();

create or replace function public.hv_audit_transaction_decision()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.audit_events(entity_type, entity_id, action, actor, actor_user_id, metadata)
  values ('transaction', new.transaction_id, 'transaction_decision_recorded', coalesce(auth.uid()::text,'system'), auth.uid(),
    jsonb_build_object(
      'transaction_decision_id', new.id,
      'decision_type', new.decision_type::text,
      'decision_status', new.status::text,
      'new_stage', new.new_stage::text
    ));
  return new;
end;
$$;
create trigger transaction_decisions_audit_insert
after insert on public.transaction_decisions
for each row execute function public.hv_audit_transaction_decision();

revoke all on function public.hv_audit_transaction_state() from public, anon, authenticated;
revoke all on function public.hv_audit_economics_insert() from public, anon, authenticated;
revoke all on function public.hv_audit_diligence_state() from public, anon, authenticated;
revoke all on function public.hv_audit_transaction_decision() from public, anon, authenticated;

comment on table public.transaction_import_staging is 'Controlled workbook fixture staging only. No automatic canonical or production import.';
comment on view public.transaction_portfolio_economics_v1 is 'Deduplicated current validated economics by immutable recognition chain; scenario rows are excluded.';
comment on view public.transaction_participant_economics_v1 is 'Participant-safe economics projection excluding Harbourview fee, margin and revenue-recognition metrics.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260811015000','transaction_rls_views_import_staging','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260811015000_transaction_rls_views_import_staging.sql

-- RECOVERY BEGIN 20260811015100_transaction_boundary_hardening.sql
-- Harbourview native transaction system: Stage 6b boundary hardening.
-- Preserve existing marketplace privilege shape while making new internal bridge identifiers
-- inaccessible and unwritable through any broad anon/authenticated table grants.

create or replace function public.hv_transaction_economics_key(
  network_key text,
  target_transaction uuid,
  target_metric public.hv_economics_metric_type,
  economic_event text,
  target_currency text
)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  parent_key text;
begin
  if target_transaction is null or target_metric is null or economic_event is null or target_currency is null then
    raise exception 'economics recognition-key transaction, metric, event and currency are required';
  end if;
  if economic_event like '%|%' or target_currency like '%|%' then
    raise exception 'economics recognition-key inputs cannot contain pipe separators';
  end if;
  if length(btrim(economic_event)) = 0 or length(btrim(target_currency)) = 0 then
    raise exception 'economics recognition-key inputs cannot be empty';
  end if;
  if target_currency !~ '^[A-Za-z]{3}$' then
    raise exception 'economics recognition-key currency must be a three-letter code';
  end if;

  parent_key := coalesce(nullif(btrim(network_key), ''), concat('TX|', target_transaction::text));
  if parent_key not like 'NETWORK|%' and parent_key not like 'TX|%' then
    raise exception 'economics recognition-key parent must begin with NETWORK| or TX|';
  end if;
  if parent_key ~ '[\r\n]' then
    raise exception 'economics recognition-key parent cannot contain line breaks';
  end if;

  return concat_ws('|',
    'ECON',
    parent_key,
    target_metric::text,
    lower(regexp_replace(btrim(economic_event), '\s+', '-', 'g')),
    upper(btrim(target_currency))
  );
end;
$$;

revoke all on function public.hv_transaction_economics_key(text,uuid,public.hv_economics_metric_type,text,text) from public, anon;
grant execute on function public.hv_transaction_economics_key(text,uuid,public.hv_economics_metric_type,text,text) to authenticated, service_role;

-- Convert any pre-existing table-wide SELECT/INSERT/UPDATE privileges to column allowlists.
-- Crucially, this preserves the privilege *shape*: a role only receives a column-level privilege
-- when it already held the corresponding table-level privilege before this migration. This avoids
-- broadening a stricter fresh/staging environment merely because production currently has broad grants.
do $$
declare
  relation_name text;
  grantee_name text;
  privilege_name text;
  excluded_columns text[];
  allowed_columns text;
  had_table_privilege boolean;
begin
  foreach relation_name in array array['listings','buyer_requests'] loop
    if to_regclass('public.' || relation_name) is null then
      continue;
    end if;

    excluded_columns := case relation_name
      when 'listings' then array['product_id','economic_account_id']::text[]
      when 'buyer_requests' then array['product_id','economic_account_id','opportunity_id']::text[]
    end;

    select string_agg(format('%I', a.attname), ', ' order by a.attnum)
      into allowed_columns
      from pg_attribute a
     where a.attrelid = to_regclass('public.' || relation_name)
       and a.attnum > 0
       and not a.attisdropped
       and not (a.attname = any(excluded_columns));

    if allowed_columns is null then
      raise exception 'cannot build legacy-column allowlist for %', relation_name;
    end if;

    foreach grantee_name in array array['anon','authenticated'] loop
      foreach privilege_name in array array['SELECT','INSERT','UPDATE'] loop
        had_table_privilege := has_table_privilege(
          grantee_name,
          format('public.%I', relation_name),
          privilege_name
        );

        execute format(
          'revoke %s on table public.%I from %I',
          privilege_name,
          relation_name,
          grantee_name
        );

        if had_table_privilege then
          execute format(
            'grant %s (%s) on table public.%I to %I',
            privilege_name,
            allowed_columns,
            relation_name,
            grantee_name
          );
        end if;
      end loop;
    end loop;
  end loop;
end;
$$;

comment on column public.listings.product_id is 'Internal canonical product bridge. Not exposed through anon/authenticated marketplace column grants.';
comment on column public.listings.economic_account_id is 'Internal economic-account bridge. Not exposed through anon/authenticated marketplace column grants.';
comment on column public.buyer_requests.product_id is 'Internal canonical product bridge. Public request submission cannot set or read this column directly.';
comment on column public.buyer_requests.economic_account_id is 'Internal economic-account bridge. Public request submission cannot set or read this column directly.';
comment on column public.buyer_requests.opportunity_id is 'Internal opportunity bridge. Public request submission cannot set or read this column directly.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260811015100','transaction_boundary_hardening','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260811015100_transaction_boundary_hardening.sql

-- RECOVERY BEGIN 20260811140000_seed_jurisdictions_identity_from_countries.sql
-- Seed public.jurisdictions from public.countries + jurisdiction_crossref.
--
-- Production 2026-08-10: jurisdictions = 0 rows, jurisdiction_crossref = 203.
-- Decision Intel Stage 0 (#1309) leaves jurisdiction linkage null until this
-- identity registry exists. Identity-only: data_release_status remains
-- seeded_identity_pending_regulated_market_review (no market claims).
--
-- Idempotent. jurisdiction_id format matches lib/country-data identity rows:
--   country_area:<ISO-3166-1 alpha-3>

begin;

-- 1. Insert missing jurisdiction identity rows from countries.
insert into public.jurisdictions (
  jurisdiction_id,
  slug,
  canonical_name,
  display_name,
  iso_alpha3,
  un_region_name,
  un_subregion_name,
  jurisdiction_type,
  identity_verification_status,
  data_release_status
)
select
  'country_area:' || upper(c.iso_alpha3) as jurisdiction_id,
  c.country_slug as slug,
  c.country_name as canonical_name,
  c.country_name as display_name,
  upper(c.iso_alpha3) as iso_alpha3,
  null::text as un_region_name,
  null::text as un_subregion_name,
  'country_or_area'::text as jurisdiction_type,
  'verified_identity_only'::text as identity_verification_status,
  'seeded_identity_pending_regulated_market_review'::text as data_release_status
from public.countries c
where c.iso_alpha3 is not null
  and length(trim(c.iso_alpha3)) = 3
  and c.country_slug is not null
  and length(trim(c.country_slug)) > 0
on conflict (jurisdiction_id) do nothing;

-- Slug uniqueness: skip rows whose slug is already owned by a different id.
-- (Handled by ON CONFLICT only on PK above; if slug collides, insert fails
-- for that row — use a guarded insert for remaining slug conflicts.)
insert into public.jurisdictions (
  jurisdiction_id,
  slug,
  canonical_name,
  display_name,
  iso_alpha3,
  jurisdiction_type,
  identity_verification_status,
  data_release_status
)
select
  'country_area:' || upper(c.iso_alpha3),
  c.country_slug || '-' || lower(c.iso_alpha3),
  c.country_name,
  c.country_name,
  upper(c.iso_alpha3),
  'country_or_area',
  'verified_identity_only',
  'seeded_identity_pending_regulated_market_review'
from public.countries c
where c.iso_alpha3 is not null
  and length(trim(c.iso_alpha3)) = 3
  and not exists (
    select 1 from public.jurisdictions j
    where j.jurisdiction_id = 'country_area:' || upper(c.iso_alpha3)
  )
  and exists (
    select 1 from public.jurisdictions j2
    where j2.slug = c.country_slug
  )
on conflict (jurisdiction_id) do nothing;

-- 2. Bridge crossref → jurisdictions when still null.
update public.jurisdiction_crossref x
set jurisdictions_id = 'country_area:' || upper(c.iso_alpha3)
from public.countries c
where x.jurisdictions_id is null
  and c.iso_alpha3 is not null
  and length(trim(c.iso_alpha3)) = 3
  and (
    c.iso_alpha2 = x.countries_iso2
    or c.iso_alpha2 = x.canonical_iso2
  )
  and exists (
    select 1 from public.jurisdictions j
    where j.jurisdiction_id = 'country_area:' || upper(c.iso_alpha3)
  );

-- 3. Minimal public profile rows so public_country_profile_dto is non-empty
-- for identity pages (still review-pending regulated claims).
insert into public.country_profiles_public (
  profile_id,
  jurisdiction_id,
  slug,
  public_display_name,
  public_region,
  public_subregion,
  public_status_label,
  public_summary,
  confidence_band_public,
  public_dto_allowed,
  admin_evidence_excluded_from_public
)
select
  'profile:' || j.jurisdiction_id,
  j.jurisdiction_id,
  j.slug,
  j.display_name,
  j.un_region_name,
  j.un_subregion_name,
  'Identity only — regulated claims pending review',
  'Canonical jurisdiction identity. Regulated-market status is not asserted by this seed.',
  'identity',
  true,
  true
from public.jurisdictions j
where not exists (
  select 1 from public.country_profiles_public p
  where p.jurisdiction_id = j.jurisdiction_id
)
on conflict (profile_id) do nothing;

-- 4. Import-run audit row (optional observability).
insert into public.country_data_import_runs (
  import_run_id,
  package_name,
  package_version,
  expected_jurisdiction_count,
  loaded_jurisdiction_count,
  dry_run,
  completed_at,
  status,
  evidence_json
)
select
  'seed-jurisdictions-identity-20260811',
  'seed_jurisdictions_identity_from_countries',
  '20260811140000',
  (select count(*)::integer from public.countries where iso_alpha3 is not null),
  (select count(*)::integer from public.jurisdictions),
  false,
  now(),
  'completed',
  jsonb_build_object(
    'source', 'public.countries',
    'crossref_linked', (
      select count(*) from public.jurisdiction_crossref
      where jurisdictions_id is not null
    )
  )
where not exists (
  select 1 from public.country_data_import_runs
  where import_run_id = 'seed-jurisdictions-identity-20260811'
);

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260811140000','seed_jurisdictions_identity_from_countries','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260811140000_seed_jurisdictions_identity_from_countries.sql

-- RECOVERY BEGIN 20260812000445_source_registry_regulator_class_and_discovery_jobs.sql
-- Adds a structured 7-class regulator taxonomy to source_registry so coverage
-- per (country, class) can be queried programmatically instead of inferred
-- from source_name text. Backfills the classes for sources added in the
-- 2026-08-11 chat sourcing pass. Also adds a job-log table for the new
-- automated source-discovery pipeline (mirrors the _digest_jobs / intelligence_jobs
-- pattern already used elsewhere in this schema).

ALTER TABLE public.source_registry
  ADD COLUMN IF NOT EXISTS regulator_class text
    CHECK (regulator_class IN (
      'health_authority','drug_control_authority','official_gazette',
      'legislature','customs_import_export','procurement',
      'medicine_license_registry','other'
    )) DEFAULT 'other';

CREATE INDEX IF NOT EXISTS idx_source_registry_iso_regclass
  ON public.source_registry (iso, regulator_class)
  WHERE regulator_class IS NOT NULL AND regulator_class <> 'other';

-- Backfill this session's health_authority additions
UPDATE public.source_registry SET regulator_class = 'health_authority'
WHERE iso IN ('IQ','BH','QA','OM','MN','BD','KG','TJ','SO','SS','SD','RU','PS','YE','XK','SY','KI')
  AND regulator_class = 'other'
  AND notes ILIKE '%chat sourcing pass%'
  AND source_name ILIKE '%health%' OR source_name ILIKE '%medical%' OR source_name ILIKE '%moh%';

-- Backfill Kuwait's drug control authority addition
UPDATE public.source_registry SET regulator_class = 'drug_control_authority'
WHERE iso = 'KW' AND source_url = 'https://www.moi.gov.kw/main/sections/anti-drug?culture=en';

CREATE TABLE IF NOT EXISTS public.source_discovery_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  provider_used text,
  pairs_attempted int DEFAULT 0,
  candidates_found int DEFAULT 0,
  candidates_verified_live int DEFAULT 0,
  sources_inserted int DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'running',
  detail jsonb DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.source_discovery_jobs IS 'Job log for the automated source-discovery-engine edge function (fills remaining regulator_class gaps in source_registry via grounded LLM web search + live URL verification). Added 2026-08-11.';
COMMENT ON COLUMN public.source_registry.regulator_class IS '7-class official-source taxonomy matching source_expansion_coverage_queue.required_source_classes_next. Added 2026-08-11.';

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260812000445','source_registry_regulator_class_and_discovery_jobs','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260812000445_source_registry_regulator_class_and_discovery_jobs.sql

-- RECOVERY BEGIN 20260812090000_structured_tabular_authority_sources.sql
-- Harbourview structured tabular authority sources
--
-- Adds record-level source-engine capture for authoritative HTML tables that were
-- previously reduced to one opaque page snapshot or handled through manual workbook
-- acquisition. This migration configures source_registry only. It does not fetch,
-- promote, publish, or mutate downstream intelligence during migration execution.
--
-- Verified source scope as of 2026-08-12:
--   Health Canada: complete published cultivator/processor/medical-seller table.
--   ODC cultivators/producers: consent-based public list, not the full licence universe.
--   ODC manufacturers/importers: consent-based public lists, not the full licence universe.
--   TGA product list: products supplied through SAS/AP 2025-07-01..2025-12-31 and
--                     reported by sponsors within the required reporting window;
--                     inclusion does not guarantee current availability.

INSERT INTO public.source_registry (
  source_name, source_url, jurisdiction, country, iso, region,
  is_active, requires_translation, language, adapter, crawl_cadence,
  relevance_status, tier, requires_auth, source_type, crawl_allowed,
  content_type, metadata, last_checked_at, consecutive_failures
)
VALUES
(
  'Health Canada — Licensed Cannabis Cultivators, Processors and Medical Sellers',
  'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/industry-licensees-applicants/licensed-cultivators-processors-sellers.html',
  'Canada', 'Canada', 'CA', 'North America',
  true, false, 'en', 'html_snapshot', 'daily',
  'active', 1, false, 'regulator_official', true,
  ARRAY['regulatory']::text[],
  jsonb_build_object(
    'source_class', 'cannabis_licence_registry',
    'structured_fetch', true,
    'structured_format', 'html_table',
    'table_index', 0,
    'header_rows', 2,
    'columns', jsonb_build_array(
      'licence_holder', 'province_territory', 'licences',
      'authorized_sale_provincial_territorial', 'authorized_sale_registered_patients',
      'client_care_phone', 'initial_licensing_date'
    ),
    'identity_columns', jsonb_build_array('licence_holder', 'province_territory', 'initial_licensing_date'),
    'title_column', 'licence_holder',
    'max_records', 2500,
    'event_types', jsonb_build_array('licence_added', 'licence_changed', 'sale_authorization_changed', 'licence_removed'),
    'evidence_authority', 'primary_regulator_registry',
    'coverage_claim', 'all_current_cultivators_processors_and_sellers_in_published_table',
    'export_capability_inference_allowed', false
  ),
  NULL, 0
),
(
  'Australia ODC — Medicinal Cannabis Cultivators and Producers',
  'https://www.odc.gov.au/medicinal-cannabis/list-approved-medicinal-cannabis-cultivators-and-producers-australia',
  'Australia', 'Australia', 'AU', 'Oceania',
  true, false, 'en', 'html_snapshot', 'weekly',
  'active', 1, false, 'regulator_official', true,
  ARRAY['regulatory']::text[],
  jsonb_build_object(
    'source_class', 'medicinal_cannabis_licence_registry',
    'structured_fetch', true,
    'structured_format', 'html_table',
    'table_index', 0,
    'identity_columns', jsonb_build_array('licence_holder'),
    'title_column', 'licence_holder',
    'max_records', 500,
    'event_types', jsonb_build_array('public_licence_holder_added', 'licensed_activity_changed', 'public_licence_holder_removed'),
    'evidence_authority', 'primary_regulator_public_disclosure',
    'coverage_claim', 'consent_based_public_subset_only',
    'full_licence_universe', false
  ),
  NULL, 0
),
(
  'Australia ODC — Medicinal Cannabis Manufacturers and Importers',
  'https://www.odc.gov.au/medicinal-cannabis/list-approved-manufacturers-and-suppliers-medicinal-cannabis-products',
  'Australia', 'Australia', 'AU', 'Oceania',
  true, false, 'en', 'html_snapshot', 'weekly',
  'active', 1, false, 'regulator_official', true,
  ARRAY['regulatory']::text[],
  jsonb_build_object(
    'source_class', 'medicinal_cannabis_manufacturer_importer_registry',
    'structured_fetch', true,
    'structured_format', 'html_table',
    'columns', jsonb_build_array('name', 'contact_details'),
    'identity_columns', jsonb_build_array('_table_label', 'name'),
    'title_column', 'name',
    'max_records', 500,
    'event_types', jsonb_build_array('public_manufacturer_added', 'public_importer_added', 'public_supplier_removed'),
    'evidence_authority', 'primary_regulator_public_disclosure',
    'table_roles', jsonb_build_object('Manufacturers', 'manufacturer', 'Importers', 'importer'),
    'coverage_claim', 'consent_based_public_subset_only',
    'full_licence_universe', false
  ),
  NULL, 0
),
(
  'Australia TGA — Medicinal Cannabis SAS/AP Product and Sponsor List',
  'https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list',
  'Australia', 'Australia', 'AU', 'Oceania',
  true, false, 'en', 'html_snapshot', 'weekly',
  'active', 1, false, 'regulator_official', true,
  ARRAY['regulatory']::text[],
  jsonb_build_object(
    'source_class', 'medicinal_cannabis_product_sponsor_registry',
    'structured_fetch', true,
    'structured_format', 'html_table',
    'columns', jsonb_build_array('dosage_form', 'active_ingredients', 'qty_per_dosage_unit', 'name_of_sponsor'),
    'identity_columns', jsonb_build_array('_table_label', 'dosage_form', 'active_ingredients', 'qty_per_dosage_unit', 'name_of_sponsor'),
    'title_column', 'name_of_sponsor',
    'max_records', 2500,
    'event_types', jsonb_build_array('product_reported', 'product_removed_from_reporting_window', 'sponsor_changed'),
    'evidence_authority', 'primary_regulator_sponsor_reporting',
    'reporting_window_start', '2025-07-01',
    'reporting_window_end', '2025-12-31',
    'published_updated_at', '2026-03-25',
    'availability_guaranteed', false,
    'coverage_claim', 'sas_ap_supplied_and_timely_sponsor_reported_products_only'
  ),
  NULL, 0
)
ON CONFLICT (source_url) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  jurisdiction = EXCLUDED.jurisdiction,
  country = EXCLUDED.country,
  iso = EXCLUDED.iso,
  region = EXCLUDED.region,
  is_active = EXCLUDED.is_active,
  requires_translation = EXCLUDED.requires_translation,
  language = EXCLUDED.language,
  adapter = EXCLUDED.adapter,
  crawl_cadence = EXCLUDED.crawl_cadence,
  relevance_status = EXCLUDED.relevance_status,
  tier = EXCLUDED.tier,
  requires_auth = EXCLUDED.requires_auth,
  source_type = EXCLUDED.source_type,
  crawl_allowed = EXCLUDED.crawl_allowed,
  content_type = EXCLUDED.content_type,
  metadata = COALESCE(public.source_registry.metadata, '{}'::jsonb) || EXCLUDED.metadata,
  updated_at = now();

DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.source_registry
  WHERE source_url IN (
    'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/industry-licensees-applicants/licensed-cultivators-processors-sellers.html',
    'https://www.odc.gov.au/medicinal-cannabis/list-approved-medicinal-cannabis-cultivators-and-producers-australia',
    'https://www.odc.gov.au/medicinal-cannabis/list-approved-manufacturers-and-suppliers-medicinal-cannabis-products',
    'https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list'
  )
    AND is_active = true
    AND relevance_status = 'active'
    AND crawl_allowed = true
    AND COALESCE((metadata->>'structured_fetch')::boolean, false) = true
    AND metadata->>'structured_format' = 'html_table'
    AND jsonb_array_length(COALESCE(metadata->'identity_columns', '[]'::jsonb)) > 0;

  IF v_count <> 4 THEN
    RAISE EXCEPTION 'Structured authority source assertion failed: expected 4 active tabular sources, found %', v_count;
  END IF;

  IF EXISTS (
    SELECT source_url
    FROM public.source_registry
    GROUP BY source_url
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Structured authority source assertion failed: duplicate source_url detected';
  END IF;
END;
$$;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260812090000','structured_tabular_authority_sources','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260812090000_structured_tabular_authority_sources.sql

-- RECOVERY BEGIN 20260812121948_seed_jurisdictions_identity_from_countries.sql
-- Seed public.jurisdictions from public.countries + jurisdiction_crossref.
--
-- Production 2026-08-10: jurisdictions = 0 rows, jurisdiction_crossref = 203.
-- Decision Intel Stage 0 (#1309) leaves jurisdiction linkage null until this
-- identity registry exists. Identity-only: data_release_status remains
-- seeded_identity_pending_regulated_market_review (no market claims).
--
-- Idempotent. jurisdiction_id format matches lib/country-data identity rows:
--   country_area:<ISO-3166-1 alpha-3>

begin;

insert into public.jurisdictions (
  jurisdiction_id, slug, canonical_name, display_name, iso_alpha3,
  un_region_name, un_subregion_name, jurisdiction_type,
  identity_verification_status, data_release_status
)
select
  'country_area:' || upper(c.iso_alpha3), c.country_slug, c.country_name, c.country_name,
  upper(c.iso_alpha3), null::text, null::text, 'country_or_area'::text,
  'verified_identity_only'::text, 'seeded_identity_pending_regulated_market_review'::text
from public.countries c
where c.iso_alpha3 is not null
  and length(trim(c.iso_alpha3)) = 3
  and c.country_slug is not null
  and length(trim(c.country_slug)) > 0
on conflict (jurisdiction_id) do nothing;

insert into public.jurisdictions (
  jurisdiction_id, slug, canonical_name, display_name, iso_alpha3,
  jurisdiction_type, identity_verification_status, data_release_status
)
select
  'country_area:' || upper(c.iso_alpha3), c.country_slug || '-' || lower(c.iso_alpha3),
  c.country_name, c.country_name, upper(c.iso_alpha3), 'country_or_area',
  'verified_identity_only', 'seeded_identity_pending_regulated_market_review'
from public.countries c
where c.iso_alpha3 is not null
  and length(trim(c.iso_alpha3)) = 3
  and not exists (
    select 1 from public.jurisdictions j
    where j.jurisdiction_id = 'country_area:' || upper(c.iso_alpha3)
  )
  and exists (
    select 1 from public.jurisdictions j2 where j2.slug = c.country_slug
  )
on conflict (jurisdiction_id) do nothing;

update public.jurisdiction_crossref x
set jurisdictions_id = 'country_area:' || upper(c.iso_alpha3)
from public.countries c
where x.jurisdictions_id is null
  and c.iso_alpha3 is not null
  and length(trim(c.iso_alpha3)) = 3
  and (c.iso_alpha2 = x.countries_iso2 or c.iso_alpha2 = x.canonical_iso2)
  and exists (
    select 1 from public.jurisdictions j
    where j.jurisdiction_id = 'country_area:' || upper(c.iso_alpha3)
  );

insert into public.country_profiles_public (
  profile_id, jurisdiction_id, slug, public_display_name, public_region,
  public_subregion, public_status_label, public_summary,
  confidence_band_public, public_dto_allowed, admin_evidence_excluded_from_public
)
select
  'profile:' || j.jurisdiction_id, j.jurisdiction_id, j.slug, j.display_name,
  j.un_region_name, j.un_subregion_name,
  'Identity only — regulated claims pending review',
  'Canonical jurisdiction identity. Regulated-market status is not asserted by this seed.',
  'identity', true, true
from public.jurisdictions j
where not exists (
  select 1 from public.country_profiles_public p where p.jurisdiction_id = j.jurisdiction_id
)
on conflict (profile_id) do nothing;

insert into public.country_data_import_runs (
  import_run_id, package_name, package_version, expected_jurisdiction_count,
  loaded_jurisdiction_count, dry_run, completed_at, status, evidence_json
)
select
  'seed-jurisdictions-identity-20260811',
  'seed_jurisdictions_identity_from_countries',
  '20260811140000',
  (select count(*)::integer from public.countries where iso_alpha3 is not null),
  (select count(*)::integer from public.jurisdictions),
  false, now(), 'completed',
  jsonb_build_object(
    'source', 'public.countries',
    'crossref_linked', (select count(*) from public.jurisdiction_crossref where jurisdictions_id is not null)
  )
where not exists (
  select 1 from public.country_data_import_runs
  where import_run_id = 'seed-jurisdictions-identity-20260811'
);

commit;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260812121948','seed_jurisdictions_identity_from_countries','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260812121948_seed_jurisdictions_identity_from_countries.sql

-- RECOVERY BEGIN 20260812234207_source_discovery_attempts_tracking.sql
-- Reconciliation commit, 2026-08-13.
--
-- This migration was applied directly to the live project on 2026-08-12
-- 23:42:07 UTC and was never committed, so `Compare repository and live
-- migration ledgers` reported `applied_not_committed: 20260812234207` and
-- failed on every open pull request. The body below is the exact SQL recorded
-- in `supabase_migrations.schema_migrations` for that version, reproduced
-- verbatim so the repository once again describes production. Nothing is
-- re-applied: the statement is `CREATE TABLE IF NOT EXISTS`, and the table
-- already exists.
--
-- Observed while reconciling, deliberately NOT changed here because that would
-- reintroduce the drift this commit exists to close: the table has RLS
-- disabled. It is not exposed — `anon` and `authenticated` both have no SELECT
-- privilege, so only the service role reaches it — but the absence of RLS is a
-- latent risk if a grant is ever added. Enabling RLS is a separate, reviewable
-- change.

-- Without attempt-memory, source-discovery-engine re-selects the same
-- permanently-failing (iso, class) pairs every run (confirmed live: 5 runs,
-- barely past Afghanistan) since a failed attempt never leaves the "missing"
-- set. This table lets the function prioritize never-tried pairs first, then
-- oldest-attempted, so it actually advances through the full country list
-- instead of stalling on the first alphabetical country.

CREATE TABLE IF NOT EXISTS public.source_discovery_attempts (
  iso text NOT NULL,
  regulator_class text NOT NULL,
  attempt_count int NOT NULL DEFAULT 0,
  last_attempted_at timestamptz,
  last_provider text,
  last_succeeded boolean,
  last_error text,
  PRIMARY KEY (iso, regulator_class)
);

COMMENT ON TABLE public.source_discovery_attempts IS 'Attempt-memory for source-discovery-engine so it advances through the full (country, regulator_class) space instead of re-retrying the same failing pairs every run forever. Added 2026-08-12.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260812234207','source_discovery_attempts_tracking','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260812234207_source_discovery_attempts_tracking.sql

-- RECOVERY BEGIN 20260813000000_baseline_capture_untracked_auth_verifiers.sql
-- Baseline capture: four secret-verification functions with NO history
-- anywhere in supabase_migrations.schema_migrations -- not a stub, not a
-- differently-named file elsewhere, genuinely zero ledger record. Same
-- untracked-origin pattern documented in
-- 20260723084446_baseline_hv_intelligence_pipeline.sql: built live via
-- direct execute_sql calls with no migration, doc, or handoff entry ever
-- created for them, discovered by cross-checking every live public/api
-- function in production against this repository's full migration history.
--
-- All four are live, in active use (cron secret verification and the
-- GitHub PAT accessor's plpgsql sibling), and already correctly locked
-- down in production -- confirmed via pg_proc.proacl before writing this,
-- not assumed: none grant execute to anon, authenticated, or PUBLIC.
-- Postgres's default (EXECUTE granted to PUBLIC on function creation) is
-- already closed repo-wide by 20260807001000_revoke_data_api_default_
-- privileges_on_public.sql and 20260804190000_production_security_
-- hardening.sql, both of which predate this capture, so no explicit
-- REVOKE is added here -- doing so would imply these functions were ever
-- exposed, which the ACL check shows they were not. Bodies are verbatim
-- from live pg_get_functiondef.
--
-- public.hv_get_github_pat(): plpgsql sibling of public.get_github_pat()
-- (restored separately in 20260710190300_github_pat_vault_rpc.sql, which
-- does have ledger history). Same purpose, different implementation --
-- checks vault secret GITHUB_PAT first, falls back to hv_github_pat if
-- unset. Both accessors are in live use; neither supersedes the other in
-- the ledger, so both are restored rather than picking one.

CREATE OR REPLACE FUNCTION public.hv_get_github_pat()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  token text;
begin
  select decrypted_secret
    into token
    from vault.decrypted_secrets
   where name = 'GITHUB_PAT';

  if token is null then
    select decrypted_secret
      into token
      from vault.decrypted_secrets
     where name = 'hv_github_pat';
  end if;

  return token;
end;
$function$;

CREATE OR REPLACE FUNCTION api.hv_get_github_pat()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'api', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  token text;
begin
  select decrypted_secret
    into token
    from vault.decrypted_secrets
   where name = 'GITHUB_PAT';

  if token is null then
    select decrypted_secret
      into token
      from vault.decrypted_secrets
     where name = 'hv_github_pat';
  end if;

  return token;
end;
$function$;

-- Bridge-key verifier (distinct from api.hv_bridge_key_matches, restored
-- separately -- same secret, two independent implementations, both live).
CREATE OR REPLACE FUNCTION public.verify_hv_bridge_key(candidate text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'hv_github_bridge_caller_secret' and decrypted_secret = candidate
  );
$function$;

CREATE OR REPLACE FUNCTION api.verify_hv_bridge_key(candidate text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'api', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
  select public.verify_hv_bridge_key(candidate);
$function$;

-- Pipeline cron secret verifier.
CREATE OR REPLACE FUNCTION public.verify_hv_cron_secret(candidate text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'hv_pipeline_cron_shared_secret' and decrypted_secret = candidate
  );
$function$;

CREATE OR REPLACE FUNCTION api.verify_hv_cron_secret(candidate text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'api', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
  select public.verify_hv_cron_secret(candidate);
$function$;

-- Source-engine cron secret verifier. Digest-compares (constant-time
-- equality check via sha256, not a plain `=`) to avoid leaking the secret
-- byte-by-byte through response timing, same rationale as
-- api.hv_bridge_key_matches above. No api.* wrapper exists in production
-- for this one -- confirmed, not assumed.
CREATE OR REPLACE FUNCTION public.verify_source_engine_cron_secret(candidate text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  expected text;
begin
  if candidate is null or length(candidate) < 32 then
    return false;
  end if;

  select decrypted_secret into expected
  from vault.decrypted_secrets
  where name = 'harbourview_source_engine_cron_secret'
  limit 1;

  if expected is null or length(expected) < 32 then
    return false;
  end if;

  return encode(digest(candidate, 'sha256'), 'hex') = encode(digest(expected, 'sha256'), 'hex');
end;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260813000000','baseline_capture_untracked_auth_verifiers','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260813000000_baseline_capture_untracked_auth_verifiers.sql

-- RECOVERY BEGIN 20260813010000_baseline_capture_pipeline_task_queue.sql
-- Baseline capture: pipeline_tasks / dead_letter_tasks task-queue tables and
-- claim_pipeline_tasks / complete_pipeline_task / fail_pipeline_task, plus
-- bulk_load_sources, hv_audit_publication, hv_requeue_failed_embed_jobs, and
-- hv_trigger_embed/extract/score -- 9 functions and 2 tables, none with a
-- real creator anywhere in this repository. Found via the same full
-- public/api function audit that turned up 48 untracked-origin objects
-- (see docs/control/EVIDENCE_LOG.md).
--
-- Some ledger history exists for a few of these (20260618144144,
-- 20260629015325, 20260701111452, 20260701191146, 20260701191208,
-- 20260720200000), but it's scattered ALTERs and header-format iterations
-- across six migrations rather than one clean creator -- notably
-- fix_cron_trigger_auth_headers and its _v2 both touch hv_trigger_extract/
-- score's headers. Reassembling that chain risks landing on an
-- intermediate, superseded state. Captured the converged live definitions
-- directly instead (verbatim pg_get_functiondef / information_schema),
-- same approach as the auth-verifier baseline capture in this session.
--
-- pipeline_tasks/dead_letter_tasks: verified RLS is enabled with only a
-- service-role-all policy on each (pg_policies), confirmed before writing,
-- not assumed -- matches the pattern every other task-queue table in this
-- repo uses.

CREATE TYPE public.queue_status AS ENUM ('queued', 'claimed', 'done', 'failed', 'dead');

CREATE TABLE public.pipeline_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_name text NOT NULL,
  task_type text NOT NULL,
  payload jsonb NOT NULL,
  priority integer NOT NULL DEFAULT 100,
  status public.queue_status NOT NULL DEFAULT 'queued'::public.queue_status,
  available_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  claimed_by text,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  last_error text,
  idempotency_key text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  UNIQUE (queue_name, idempotency_key)
);

CREATE INDEX pipeline_tasks_claim_idx ON public.pipeline_tasks
  USING btree (queue_name, status, available_at, priority DESC, created_at);

ALTER TABLE public.pipeline_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role all pipeline_tasks" ON public.pipeline_tasks
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.dead_letter_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_task_id uuid,
  queue_name text NOT NULL,
  task_type text NOT NULL,
  payload jsonb NOT NULL,
  failure_reason text,
  attempts integer NOT NULL,
  moved_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dead_letter_tasks_original_task ON public.dead_letter_tasks
  USING btree (original_task_id);

ALTER TABLE public.dead_letter_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role all dead_letter_tasks" ON public.dead_letter_tasks
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.claim_pipeline_tasks(p_queue_name text, p_worker_name text, p_limit integer DEFAULT 10)
 RETURNS SETOF pipeline_tasks
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
begin
  return query
  with claimed as (
    update public.pipeline_tasks
       set status = 'claimed',
           claimed_at = now(),
           claimed_by = p_worker_name,
           attempts = attempts + 1
     where id in (
       select id
         from public.pipeline_tasks
        where queue_name = p_queue_name
          and status = 'queued'
          and available_at <= now()
        order by priority desc, created_at
        limit p_limit
        for update skip locked
     )
     returning *
  )
  select * from claimed;
end;
$function$;

CREATE OR REPLACE FUNCTION public.complete_pipeline_task(p_task_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
begin
  update public.pipeline_tasks
     set status = 'done',
         finished_at = now()
   where id = p_task_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.fail_pipeline_task(p_task_id uuid, p_error text, p_retry_delay_seconds integer DEFAULT 300)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  v_task public.pipeline_tasks;
begin
  select * into v_task from public.pipeline_tasks where id = p_task_id;

  if not found then
    return;
  end if;

  if v_task.attempts >= v_task.max_attempts then
    update public.pipeline_tasks
       set status = 'dead',
           last_error = p_error
     where id = p_task_id;

    insert into public.dead_letter_tasks (
      original_task_id,
      queue_name,
      task_type,
      payload,
      failure_reason,
      attempts
    )
    values (
      v_task.id,
      v_task.queue_name,
      v_task.task_type,
      v_task.payload,
      p_error,
      v_task.attempts
    );
  else
    update public.pipeline_tasks
       set status = 'queued',
           claimed_at = null,
           claimed_by = null,
           available_at = now() + make_interval(secs => p_retry_delay_seconds),
           last_error = p_error
     where id = p_task_id;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.bulk_load_sources(p_sources jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  v_source jsonb;
  v_count  integer := 0;
  v_adapter text;
  v_tier    integer;
BEGIN
  FOR v_source IN SELECT value FROM jsonb_array_elements(p_sources)
  LOOP
    v_adapter := CASE lower(v_source->>'type')
      WHEN 'rss' THEN 'rss'
      WHEN 'api' THEN 'api'
      ELSE 'html_snapshot'
    END;

    BEGIN
      v_tier := (v_source->>'tier')::integer;
    EXCEPTION WHEN OTHERS THEN
      v_tier := 2;
    END;

    INSERT INTO public.source_registry (
      source_name, source_url, source_type, jurisdiction,
      country, subcategory, language, tier,
      adapter, crawl_cadence, relevance_status,
      fetch_method, is_active, notes
    ) VALUES (
      v_source->>'name',
      v_source->>'url',
      COALESCE(lower(v_source->>'type'), 'html'),
      v_source->>'country',
      v_source->>'country',
      v_source->>'subcategory',
      'en',
      v_tier,
      v_adapter,
      'daily',
      'active',
      'manual_url',
      true,
      v_source->>'notes'
    )
    ON CONFLICT DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.hv_audit_publication()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_events (entity_type, entity_id, action, actor, metadata)
    VALUES (
      'hv_public_feed',
      NEW.id,
      'publication.' || NEW.status,
      coalesce(NEW.approved_by::text, 'system'),
      jsonb_build_object(
        'artifact_id', NEW.artifact_id,
        'feed_type', NEW.feed_type,
        'previous_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.hv_requeue_failed_embed_jobs()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE v_count INTEGER;
BEGIN
  UPDATE hv_processing_jobs
  SET status         = 'pending',
      last_error     = NULL,
      next_retry_at  = NULL,
      updated_at     = now()
  WHERE job_type     = 'embed'
    AND status       = 'failed'
    AND attempt_count < max_attempts;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

-- hv_trigger_embed/extract/score: cron-invoked HTTP dispatchers to this
-- project's own edge functions. Note the hardcoded bearer token below is
-- this project's ANON key (decode it: role=anon), not a secret credential
-- -- it's the same key already shipped in every client-side request the
-- Command Centre app makes, and is meant to be public. Restored verbatim
-- rather than "improved" to a dynamic lookup, since this is a restoration
-- of the exact live contract, not a redesign; worth someone deciding later
-- whether to move it to a vault-backed reference for consistency with
-- hv_trigger_extract's own x-harbourview-cron-caller header two lines
-- below, which already does that correctly.
CREATE OR REPLACE FUNCTION public.hv_trigger_embed()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
  SELECT net.http_post(
    url     := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-embed-worker',
    headers := jsonb_build_object(
      'Content-Type',              'application/json',
      'Authorization',             'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eGRnZGt1a2pycndhbWRwcXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDMxNzUsImV4cCI6MjA5MjgxOTE3NX0.MEGWEsDpJO3964Ef2G2Cbo-Q5JKT46WB1xtlXE-ue5M',
      'x-harbourview-cron-caller', 'pg_cron_hv_embed'
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
$function$;

CREATE OR REPLACE FUNCTION public.hv_trigger_extract()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
  SELECT net.http_post(
    url     := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-extract',
    params  := jsonb_build_object('limit','10'),
    headers := jsonb_build_object(
      'Content-Type',              'application/json',
      'Authorization',             'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eGRnZGt1a2pycndhbWRwcXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDMxNzUsImV4cCI6MjA5MjgxOTE3NX0.MEGWEsDpJO3964Ef2G2Cbo-Q5JKT46WB1xtlXE-ue5M',
      'x-harbourview-cron-caller', (select decrypted_secret from vault.decrypted_secrets where name = 'hv_pipeline_cron_shared_secret')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
$function$;

CREATE OR REPLACE FUNCTION public.hv_trigger_score()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
  SELECT net.http_post(
    url     := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-score',
    params  := jsonb_build_object('limit','30'),
    headers := jsonb_build_object(
      'Content-Type',              'application/json',
      'Authorization',             'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eGRnZGt1a2pycndhbWRwcXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDMxNzUsImV4cCI6MjA5MjgxOTE3NX0.MEGWEsDpJO3964Ef2G2Cbo-Q5JKT46WB1xtlXE-ue5M',
      'x-harbourview-cron-caller', 'pg_cron_hv_score'
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260813010000','baseline_capture_pipeline_task_queue','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260813010000_baseline_capture_pipeline_task_queue.sql

-- RECOVERY BEGIN 20260813010001_extend_supply_catalog_equipment_to_australia.sql
-- Extend the same generic equipment/cultivation/lab supply SKUs already
-- extended to Germany (see 20260812190000_extend_supply_catalog_equipment_to_germany.sql)
-- to Australia (AU). Same exclusion logic applies to consumer packaging.
--
-- Rationale (researched this session):
-- Australia's cannabis framework is medical-only nationwide, regulated by
-- the TGA under the Therapeutic Goods Act / TGO 93. There is no legal
-- recreational retail channel anywhere in the country -- the ACT permits
-- personal possession and home cultivation only, and every purchase there
-- is still a supply offence for the seller. Medicinal cannabis packaging
-- must meet TGO 93 (child-resistant closures except for plant material,
-- specific label content under section 15) and imported product requires
-- GMP-equivalent evidence -- requirements this catalog cannot currently
-- verify or claim compliance with per-SKU. The TGA is also actively
-- enforcing against unlawful advertising of medicinal cannabis (e.g.
-- ongoing Federal Court proceedings against at least one operator as of
-- mid-2026), which is a real reason to be conservative about what gets
-- listed as available in this market.
--
-- As with Germany: extending only the generic, non-cannabis-branded
-- equipment/cultivation/lab/consumables SKUs (35 of 68) to AU, since selling
-- grow lights, nutrients, lab consumables, and production machinery to
-- licensed Australian cultivators/manufacturers is legitimate and does not
-- implicate TGO 93 consumer-packaging or advertising rules the way listing
-- branded consumer packaging would. No compliance_flags.AU claims added.
--
-- Application provenance:
-- Earlier PR history stated that this update had already been applied directly
-- to the live project. The August 14 exact-head migration-drift evidence does
-- not record version 20260813010000 in the live migration ledger, so this file
-- must be treated as repository-only pending unless separate evidence proves an
-- ad-hoc live data update. The update is replay-safe for rows already containing
-- AU because the predicate excludes them.

update public.listings
set target_countries = array_append(target_countries, 'AU')
where sold_by_harbourview = true
and product_type in (
  'grow_media','nutrients','trellis','cloning_supply','propagation_kit','grow_light','irrigation',
  'lab_supply','lab_equipment','curing_supply','humidity_pack','shipping_supply',
  'pre_roll_machine','shredder','scale','sealing_equipment','capping_equipment',
  'labeling_equipment','filling_equipment','packing_equipment','concentrate_supply','tincture_supply'
)
and not ('AU' = any(target_countries));


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260813010001','extend_supply_catalog_equipment_to_australia','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260813010001_extend_supply_catalog_equipment_to_australia.sql

-- RECOVERY BEGIN 20260813020000_baseline_capture_reporting_and_triggers.sql
-- Baseline capture: 12 more untracked-origin functions from the same
-- 48-function audit (see docs/control/EVIDENCE_LOG.md). Bodies and
-- search_path verbatim from live pg_get_functiondef; grants below match
-- current live proacl exactly (checked via pg_proc.proacl before writing,
-- not assumed) -- some of these genuinely are anon/authenticated-executable
-- in production today and that's preserved as-is, since changing it would
-- be an unrequested behavior change, not a restoration.
--
-- is_service_role_or_signal_analyst included here as a dependency of
-- api.get_recently_analyzed_signals below, not because it's a reporting or
-- trigger function itself -- found while checking that function's
-- dependencies actually exist, same as the pipeline_tasks/dead_letter_tasks
-- discovery in the previous batch.

CREATE OR REPLACE FUNCTION public.is_service_role_or_signal_analyst()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
  select auth.role() = 'service_role' or public.is_genetics_admin_or_reviewer();
$function$;

CREATE OR REPLACE FUNCTION api.get_recently_analyzed_signals(p_limit integer DEFAULT 10)
 RETURNS TABLE(id text, headline text, summary text, country text, score integer, analysis jsonb, analysis_backend text, analysis_generated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'api', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN
  if not public.is_service_role_or_signal_analyst() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  RETURN QUERY
  SELECT s.id, s.headline, s.summary, s.country, s.score, s.analysis, s.analysis_backend, s.analysis_generated_at
  FROM public.signals s
  WHERE s.analysis IS NOT NULL
  ORDER BY s.analysis_generated_at DESC NULLS LAST
  LIMIT LEAST(p_limit, 25);
END;
$function$;
-- Matches live: PUBLIC and authenticated both currently have execute.
-- The function gates on caller role internally (raises 42501 otherwise),
-- so the grant alone doesn't expose the data -- preserved as-is.
GRANT EXECUTE ON FUNCTION api.get_recently_analyzed_signals(integer) TO PUBLIC;
GRANT EXECUTE ON FUNCTION api.get_recently_analyzed_signals(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.countries_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.countries_set_updated_at() TO PUBLIC;

CREATE OR REPLACE FUNCTION public.get_country_status(p_iso2 text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'country_name',           country_name,
    'iso_alpha2',             iso_alpha2,
    'region',                 region,
    'subregion',              subregion,
    'market_access_status',   market_access_status::text,
    'medical_status',         medical_status::text,
    'adult_use_status',       adult_use_status::text,
    'import_status',          import_status::text,
    'export_status',          export_status::text,
    'signals_status',         signals_status::text,
    'opportunity_score',      opportunity_score,
    'data_completeness',      data_completeness::text,
    'public_summary',         public_summary,
    'trade_roles',            trade_roles,
    'opportunity_categories', opportunity_categories,
    'regulator_label',        regulator_label,
    'last_updated_label',     last_updated_label
  )
  INTO v_result
  FROM countries
  WHERE iso_alpha2 = UPPER(p_iso2)
  LIMIT 1;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_watchlist_items(p_org_id uuid, p_type text DEFAULT NULL::text, p_limit integer DEFAULT 25, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, item_type text, ref_id text, title text, subtitle text, tags text[], jurisdiction text, confidence_pct integer, latest_change_at timestamp with time zone, latest_change_note text, next_action text, watch_status text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN
  -- Verify caller is a member of this org
  IF NOT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = p_org_id AND user_id = (SELECT auth.uid())
  ) THEN
    RAISE EXCEPTION 'not_a_member';
  END IF;

  RETURN QUERY
  SELECT
    w.id, w.item_type, w.ref_id, w.title, w.subtitle,
    w.tags, w.jurisdiction, w.confidence_pct,
    w.latest_change_at, w.latest_change_note, w.next_action,
    w.watch_status, w.created_at, w.updated_at
  FROM cc_watchlist_items w
  WHERE w.org_id      = p_org_id
    AND w.watch_status = 'active'
    AND (p_type IS NULL OR w.item_type = p_type)
  ORDER BY w.latest_change_at DESC NULLS LAST, w.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_watchlist_notification_summary(p_org_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_result  JSON;
BEGIN
  -- Verify caller is a member of this org
  IF NOT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = p_org_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'not_a_member';
  END IF;

  SELECT json_build_object(
    'total_alerts',     COUNT(*) FILTER (WHERE NOT is_read AND NOT is_snoozed),
    'awaiting_review',  COUNT(*) FILTER (WHERE NOT is_read AND NOT is_snoozed AND notification_type = 'alert'),
    'resolved',         COUNT(*) FILTER (WHERE is_read AND created_at > now() - INTERVAL '7 days'),
    'snoozed',          COUNT(*) FILTER (WHERE is_snoozed AND (snoozed_until IS NULL OR snoozed_until > now()))
  )
  INTO v_result
  FROM cc_watchlist_notifications
  WHERE user_id = v_user_id
    AND org_id  = p_org_id;

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_signals_semantic(p_query_embedding vector, p_match_count integer DEFAULT 20, p_country text DEFAULT NULL::text, p_category text DEFAULT NULL::text, p_min_similarity double precision DEFAULT 0.0)
 RETURNS TABLE(id text, headline text, summary text, country text, cat text, pri text, score integer, source text, url text, date timestamp with time zone, similarity double precision)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN
  RETURN QUERY
    SELECT
      s.id,
      s.headline,
      s.summary,
      s.country,
      s.cat,
      s.pri,
      s.score,
      s.source,
      s.url,
      s.date,
      (1 - (s.embedding_1024 <=> p_query_embedding))::double precision AS similarity
    FROM public.signals s
    WHERE
      s.embedding_1024 IS NOT NULL
      AND (p_country  IS NULL OR s.country = p_country)
      AND (p_category IS NULL OR s.cat     = p_category)
      AND (1 - (s.embedding_1024 <=> p_query_embedding)) >= p_min_similarity
    ORDER BY s.embedding_1024 <=> p_query_embedding
    LIMIT p_match_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_deal_rooms_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;
GRANT EXECUTE ON FUNCTION public.set_deal_rooms_updated_at() TO PUBLIC;

CREATE OR REPLACE FUNCTION public.set_hv_professionals_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;
GRANT EXECUTE ON FUNCTION public.set_hv_professionals_updated_at() TO PUBLIC;

CREATE OR REPLACE FUNCTION public.set_jurisdiction_playbooks_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;
GRANT EXECUTE ON FUNCTION public.set_jurisdiction_playbooks_updated_at() TO PUBLIC;

CREATE OR REPLACE FUNCTION public.sync_ia_market_graph()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  v_markets int := 0;
  v_sources int := 0;
  v_edges int := 0;
begin
  -- Market entities
  with agg as (
    select market,
           count(distinct source_name) as connections,
           count(*) as signals,
           max(detected_at) as last_seen
    from ia_signals
    where stage <> 'archived' and coalesce(market,'') <> ''
    group by market
  )
  insert into ia_graph_entities (id, type, label, market, category, connection_count, signal_count, last_activity)
  select 'gr-ent-' || md5('market:' || market), 'market', market, market, null, connections, signals, last_seen::date
  from agg
  on conflict (id) do update set
    connection_count = excluded.connection_count,
    signal_count      = excluded.signal_count,
    last_activity     = excluded.last_activity,
    updated_at        = now();
  get diagnostics v_markets = row_count;

  -- Source entities (only sources that have produced at least one signal)
  with agg as (
    select source_name,
           count(distinct market) as connections,
           count(*) as signals,
           max(detected_at) as last_seen
    from ia_signals
    where coalesce(source_name,'') <> ''
    group by source_name
  )
  insert into ia_graph_entities (id, type, label, market, category, connection_count, signal_count, last_activity)
  select 'gr-ent-' || md5('source:' || source_name), 'source', source_name, null, null, connections, signals, last_seen::date
  from agg
  on conflict (id) do update set
    connection_count = excluded.connection_count,
    signal_count      = excluded.signal_count,
    last_activity     = excluded.last_activity,
    updated_at        = now();
  get diagnostics v_sources = row_count;

  -- Edges: source generated_signal -> market
  with agg as (
    select source_name, market, count(*) as n, min(detected_at) as first_seen
    from ia_signals
    where coalesce(source_name,'') <> '' and coalesce(market,'') <> ''
    group by source_name, market
  )
  insert into ia_graph_edges (id, type, from_label, to_label, strength, evidenced, created_at)
  select 'gr-edge-' || md5(source_name || '->' || market),
         'generated_signal', source_name, market,
         case when n >= 5 then 'strong' when n >= 2 then 'medium' else 'weak' end,
         true, first_seen
  from agg
  on conflict (id) do update set
    strength = excluded.strength;
  get diagnostics v_edges = row_count;

  return jsonb_build_object('ok', true, 'markets', v_markets, 'sources', v_sources, 'edges', v_edges);
end;
$function$;

CREATE OR REPLACE FUNCTION public.trg_auto_promote_snapshot()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  v_promoted integer;
BEGIN
  IF NEW.processing_status = 'extracted'
    AND (OLD.processing_status IS DISTINCT FROM 'extracted')
    AND NEW.signal_candidates IS NOT NULL
  THEN
    SELECT public.promote_snapshot_to_signals(NEW.id) INTO v_promoted;
    RAISE LOG 'Auto-promoted % signals from snapshot %', v_promoted, NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260813020000','baseline_capture_reporting_and_triggers','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260813020000_baseline_capture_reporting_and_triggers.sql

-- RECOVERY BEGIN 20260813030000_baseline_capture_misc_functions.sql
-- Baseline capture: final 11 functions from the 48-function untracked-origin
-- audit (see docs/control/EVIDENCE_LOG.md and the three preceding batches
-- in this repair series). Bodies and search_path verbatim from live
-- pg_get_functiondef. Table dependencies checked before writing (all
-- present: education_modules/tracks/_education_regen_jobs,
-- marketplace_candidates, marketplace_inquiries, local_authorities,
-- jurisdiction_playbooks, user_profiles, subscriptions).
--
-- Grants preserved exactly as live, checked via pg_proc.proacl before
-- writing: api.request_signal_analysis is authenticated-executable (gates
-- on caller role internally via is_service_role_or_signal_analyst, same
-- pattern as api.get_recently_analyzed_signals in the previous batch), and
-- hv_clean_scraped_headline/norm_headline/promote_inquiry_to_candidate/
-- sync_playbook_regulators carry PUBLIC execute predating this repo's
-- default-privilege closure. Not tightening -- out of scope for a
-- restoration.
--
-- smoke_close_marketplace_inquiry / smoke_verify_marketplace_inquiry:
-- test-harness RPCs, tightly regex-gated to a specific smoke-test email/
-- marker pattern and a fixed inquiry_type allowlist -- reviewed the input
-- validation before restoring, not just copied.

CREATE OR REPLACE FUNCTION public.norm_headline(h text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
  select btrim(regexp_replace(lower(regexp_replace(coalesce(h,''), '\s+[-–]\s+[^-–]+$', '')), '[^a-z0-9 ]', '', 'g'))
$function$;
GRANT EXECUTE ON FUNCTION public.norm_headline(text) TO PUBLIC;

CREATE OR REPLACE FUNCTION public.hv_clean_scraped_headline(raw text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  v TEXT;
  probe_len INT;
  probe TEXT;
  repeat_pos INT;
BEGIN
  IF raw IS NULL THEN RETURN raw; END IF;

  v := replace(raw,   '&nbsp;', ' ');
  v := replace(v,     '&amp;',  '&');
  v := replace(v,     '&lt;',   '<');
  v := replace(v,     '&gt;',   '>');
  v := replace(v,     '&#39;',  '''');
  v := replace(v,     '&quot;', '"');
  v := regexp_replace(v, '\s{2,}', ' ', 'g');
  v := trim(v);

  -- Detect duplicate title: probe first 40 chars, look for repeat
  probe_len := LEAST(40, length(v) / 2);
  IF probe_len < 15 THEN RETURN v; END IF;

  probe := left(v, probe_len);
  repeat_pos := strpos(substring(v FROM probe_len + 1), probe);

  IF repeat_pos > 0 THEN
    -- Trim to everything before the repeat begins
    v := trim(left(v, probe_len + repeat_pos - 1));
    -- Also strip trailing " - SourceName" suffix if present
    v := regexp_replace(v, '\s+-\s+\S+\s*$', '');
    RETURN trim(v);
  END IF;

  RETURN v;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.hv_clean_scraped_headline(text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.hv_clean_scraped_headline(text) TO anon;
GRANT EXECUTE ON FUNCTION public.hv_clean_scraped_headline(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.hv_truncate_at_word_boundary(p_text text, p_max_len integer)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT CASE
    WHEN p_text IS NULL THEN NULL
    WHEN length(p_text) <= p_max_len THEN p_text
    ELSE coalesce(nullif(regexp_replace(left(p_text, p_max_len), '\s+\S*$', ''), ''), left(p_text, p_max_len)) || '…'
  END;
$function$;

CREATE OR REPLACE FUNCTION public.score_signal_from_snapshot(p_pass integer, p_lead integer, p_keywords integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  v_lane_r  integer := 0;
  v_lane_e  integer := 0;
  v_lane_t  integer := 0;
  v_score   integer := 0;
  v_pri     text    := 'MONITOR';
BEGIN
  -- Regulatory lane (R): official gazettes and parliamentary committees
  IF p_pass IN (1, 2) THEN
    v_lane_r := CASE
      WHEN p_lead >= 12 THEN 3
      WHEN p_lead >= 6  THEN 2
      ELSE 1
    END;
  END IF;

  -- Economic lane (E): procurement and MDB signals
  IF p_pass IN (3, 4) THEN
    v_lane_e := CASE
      WHEN p_lead >= 24 THEN 3
      WHEN p_lead >= 12 THEN 2
      ELSE 1
    END;
  END IF;

  -- Trade lane (T): all passes contribute, weighted by lead time
  v_lane_t := CASE
    WHEN p_lead >= 18 THEN 3
    WHEN p_lead >= 8  THEN 2
    WHEN p_lead >= 3  THEN 1
    ELSE 0
  END;

  -- Base score from keyword density + lead time + pass
  v_score := (p_keywords * 5)
           + (COALESCE(p_lead, 0) * 2)
           + (COALESCE(p_pass, 1) * 10);

  v_score := LEAST(v_score, 99);

  -- Priority classification
  v_pri := CASE
    WHEN v_score >= 75 THEN 'URGENT'
    WHEN v_score >= 50 THEN 'HIGH'
    WHEN v_score >= 30 THEN 'MONITOR'
    ELSE 'LOW'
  END;

  RETURN jsonb_build_object(
    'lane_r', v_lane_r,
    'lane_e', v_lane_e,
    'lane_t', v_lane_t,
    'score',  v_score,
    'pri',    v_pri
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.smoke_close_marketplace_inquiry(p_email text, p_marker text, p_inquiry_type text)
 RETURNS TABLE(id uuid, inquiry_type text, review_status text, contact_email text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  target_id         uuid;
  v_run_from_email  text;
  v_run_from_marker text;
BEGIN
  v_run_from_email  := replace(split_part(p_email,  'smoke+', 2), '@harbourview.local', '');
  v_run_from_marker := replace(p_marker, 'HARBOURVIEW_BROWSER_SMOKE_TEST:', '');

  IF p_email IS NULL
    OR p_email  !~ '^smoke\+browser-[a-zA-Z0-9\-]+@harbourview\.local$'
    OR p_marker IS NULL
    OR p_marker !~ '^HARBOURVIEW_BROWSER_SMOKE_TEST:browser-[a-zA-Z0-9\-]+$'
    OR v_run_from_email <> v_run_from_marker
    OR p_inquiry_type NOT IN ('quote_routing', 'listing_submission', 'wanted_request_submission')
  THEN
    RAISE EXCEPTION 'invalid smoke close input';
  END IF;

  SELECT mi.id INTO target_id
  FROM public.marketplace_inquiries mi
  WHERE lower(mi.contact_email) = lower(p_email)
    AND mi.inquiry_type = p_inquiry_type
    AND mi.message LIKE '%' || p_marker || '%'
  ORDER BY mi.created_at DESC
  LIMIT 1;

  IF target_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.marketplace_inquiries mi
  SET review_status  = 'closed',
      internal_notes = coalesce(mi.internal_notes || E'\n', '') || p_marker || ': closed by controlled marketplace smoke RPC.',
      updated_at     = now()
  WHERE mi.id = target_id;

  RETURN QUERY
  SELECT mi.id, mi.inquiry_type, mi.review_status, mi.contact_email, mi.created_at
  FROM public.marketplace_inquiries mi
  WHERE mi.id = target_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.smoke_verify_marketplace_inquiry(p_email text, p_marker text, p_inquiry_type text)
 RETURNS TABLE(id uuid, inquiry_type text, review_status text, contact_email text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  v_run_from_email  text;
  v_run_from_marker text;
BEGIN
  v_run_from_email  := replace(split_part(p_email,  'smoke+', 2), '@harbourview.local', '');
  v_run_from_marker := replace(p_marker, 'HARBOURVIEW_BROWSER_SMOKE_TEST:', '');

  IF p_email IS NULL
    OR p_email  !~ '^smoke\+browser-[a-zA-Z0-9\-]+@harbourview\.local$'
    OR p_marker IS NULL
    OR p_marker !~ '^HARBOURVIEW_BROWSER_SMOKE_TEST:browser-[a-zA-Z0-9\-]+$'
    OR v_run_from_email <> v_run_from_marker
    OR p_inquiry_type NOT IN ('quote_routing', 'listing_submission', 'wanted_request_submission')
  THEN
    RAISE EXCEPTION 'invalid smoke verifier input';
  END IF;

  RETURN QUERY
  SELECT mi.id, mi.inquiry_type, mi.review_status, mi.contact_email, mi.created_at
  FROM public.marketplace_inquiries mi
  WHERE lower(mi.contact_email) = lower(p_email)
    AND mi.inquiry_type = p_inquiry_type
    AND mi.message LIKE '%' || p_marker || '%'
  ORDER BY mi.created_at DESC
  LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.promote_inquiry_to_candidate()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  v_title text;
  v_desc  text;
  v_cat   text;

  -- helpers to parse "key: value" lines from the structured block
  v_headline   text;
  v_ltype      text;
  v_cat_key    text;
BEGIN
  IF NEW.listing_id IS NOT NULL THEN RETURN NEW; END IF;
  IF COALESCE(NEW.inquiry_type,'') NOT IN (
    'listing_submission','supply_submission','sell',
    'new_listing','wanted_request','submit_listing',
    'wanted_request_submission'
  ) THEN RETURN NEW; END IF;

  -- Parse key: value lines from the structured block appended by the form
  v_headline := (SELECT trim(split_part(line, ': ', 2))
                 FROM unnest(string_to_array(NEW.message, E'\n')) AS line
                 WHERE trim(line) LIKE 'listing_headline:%' LIMIT 1);
  v_ltype    := (SELECT trim(split_part(line, ': ', 2))
                 FROM unnest(string_to_array(NEW.message, E'\n')) AS line
                 WHERE trim(line) LIKE 'listing_type:%' LIMIT 1);
  v_cat_key  := (SELECT trim(split_part(line, ': ', 2))
                 FROM unnest(string_to_array(NEW.message, E'\n')) AS line
                 WHERE trim(line) LIKE 'category_key:%' LIMIT 1);

  v_title := COALESCE(
    NULLIF(v_headline, ''),
    NULLIF(v_ltype, ''),
    CONCAT('Intake from ', COALESCE(NEW.contact_company, NEW.contact_name, 'Unknown'))
  );
  v_cat   := COALESCE(NULLIF(v_cat_key,''), 'consumables');
  v_desc  := COALESCE(NULLIF(trim(NEW.message),''), 'No description provided');

  INSERT INTO public.marketplace_candidates (
    candidate_type, marketplace_category,
    title_internal, description_internal,
    status, source_id, source_name,
    raw_payload, confidence, discovered_at
  ) VALUES (
    'intake_form', v_cat,
    v_title, v_desc,
    'needs_review', NEW.id::text, 'intake_form',
    jsonb_build_object(
      'inquiry_id',      NEW.id,
      'contact_name',    NEW.contact_name,
      'contact_email',   NEW.contact_email,
      'contact_company', NEW.contact_company,
      'contact_phone',   NEW.contact_phone,
      'listing_type',    v_ltype,
      'raw_message',     NEW.message
    ),
    0.5, NEW.created_at
  );

  RETURN NEW;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.promote_inquiry_to_candidate() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_inquiry_to_candidate() TO anon;
GRANT EXECUTE ON FUNCTION public.promote_inquiry_to_candidate() TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_playbook_regulators(p_country text DEFAULT NULL::text)
 RETURNS TABLE(updated_country text, regulators_count integer)
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
begin
  return query
  with new_regs as (
    select
      la.country_code,
      jsonb_agg(
        jsonb_build_object(
          'name',    la.authority_name,
          'role',    la.authority_role,
          'country', la.country_code,
          'tier',    la.org_tier,
          'website', coalesce(
            (select elem->>'website'
             from public.jurisdiction_playbooks jp2,
                  jsonb_array_elements(jp2.key_regulators) elem
             where jp2.country_iso2 = la.country_code
               and lower(elem->>'name') ilike '%' || lower(split_part(la.authority_name, ' (', 1)) || '%'
             limit 1),
            null
          )
        )
        order by la.display_order
      ) as merged
    from public.local_authorities la
    where la.org_tier in ('top','mid')
      and (p_country is null or la.country_code = p_country)
    group by la.country_code
  ),
  updated as (
    update public.jurisdiction_playbooks jp
    set
      key_regulators = nr.merged,
      updated_at     = now()
    from new_regs nr
    where jp.country_iso2 = nr.country_code
    returning jp.country_iso2, jsonb_array_length(nr.merged) as cnt
  )
  select country_iso2::text, cnt::int from updated;
end;
$function$;
GRANT EXECUTE ON FUNCTION public.sync_playbook_regulators(text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_playbook_regulators(text) TO anon;
GRANT EXECUTE ON FUNCTION public.sync_playbook_regulators(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_subscription_tier()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN
  IF NEW.status = 'active' OR NEW.status = 'trialing' THEN
    UPDATE public.user_profiles SET tier = NEW.tier, updated_at = now()
    WHERE id = NEW.user_id;
  ELSIF OLD.status IN ('active','trialing') AND NEW.status NOT IN ('active','trialing') THEN
    -- Downgrade: check if any other active sub exists
    IF NOT EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE user_id = NEW.user_id AND status IN ('active','trialing') AND id != NEW.id
    ) THEN
      UPDATE public.user_profiles SET tier = 'free', updated_at = now()
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fire_education_batch(p_count integer DEFAULT 6)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  v_key text;
  v_mod record;
  v_req bigint;
  v_fired text[] := '{}';
  v_pre text;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  if v_key is null then return jsonb_build_object('ok',false,'reason','no vault key'); end if;

  v_pre := 'You are writing an in-depth professional education module for Harbourview, a B2B cannabis market intelligence platform used by industry operators, importers, investors, and clinicians. Write in a measured, expert, non-hyped voice -- a seasoned practitioner explaining hard-won knowledge to a competent peer who wants genuine depth, not an overview.

Follow EXACTLY this five-section structure, each section 3500-6000 characters of substantive prose: 1) "Why This Matters", 2) "The Core Framework", 3) "How This Plays Out in Practice", 4) "Common Pitfalls", 5) "Key Takeaways".

DEPTH REQUIREMENTS: Use concrete, illustrative specifics to teach -- worked numeric examples, realistic scenarios, specific decision criteria a practitioner actually applies, and step-by-step reasoning. Walk through an actual calculation, describe a representative timeline with rough durations, or trace a specific decision path.

HONESTY RULE (critical): When you use a specific number, timeline, cost, or scenario as a teaching example, frame it explicitly as illustrative -- e.g. "consider a distributor moving roughly 500kg per quarter", "a typical EU-GMP readiness timeline might run 12-18 months". Do NOT present illustrative figures as verified current market data, and do NOT invent named real companies, fake citations, specific dated events, or statistics attributed to real sources.

Return ONLY a JSON array of exactly 5 objects (no markdown, no prose outside JSON): [{"section_order": 1, "heading": "Why This Matters", "body": "..."}, ...].';

  for v_mod in
    select m.id, m.slug, m.title, m.description, t.title as track
    from education_modules m
    left join education_tracks t on t.id::text = m.track_id
    where m.publication_state='published'
      and m.content_review_status is distinct from 'ai_generated_pending_review'
      and not exists (select 1 from _education_regen_jobs j where j.module_id = m.id::text)
    order by m.slug limit p_count
  loop
    v_req := net.http_post(
      url := 'https://api.anthropic.com/v1/messages',
      headers := jsonb_build_object('x-api-key', v_key, 'anthropic-version','2023-06-01','content-type','application/json'),
      body := jsonb_build_object('model','claude-sonnet-4-6','max_tokens',12000,
        'messages', jsonb_build_array(jsonb_build_object('role','user','content',
          v_pre || E'\n\nMODULE TITLE: ' || v_mod.title
                || E'\nTRACK: ' || coalesce(v_mod.track,'')
                || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,'')))),
      timeout_milliseconds := 150000
    );
    insert into _education_regen_jobs (request_id, module_id, module_slug) values (v_req, v_mod.id::text, v_mod.slug);
    v_fired := array_append(v_fired, v_mod.slug);
  end loop;

  return jsonb_build_object('ok', true, 'fired', array_length(v_fired,1), 'modules', to_jsonb(v_fired));
end;
$function$;

CREATE OR REPLACE FUNCTION api.request_signal_analysis(p_signal_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'api', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  v_req_id bigint;
  v_status int;
  v_body jsonb;
  v_waited numeric := 0;
BEGIN
  if not public.is_service_role_or_signal_analyst() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;

  IF NOT EXISTS (SELECT 1 FROM public.signals WHERE id = p_signal_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'signal_not_found');
  END IF;

  IF EXISTS (SELECT 1 FROM public.signals WHERE id = p_signal_id AND analysis IS NOT NULL) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_analyzed');
  END IF;

  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'hv_edge_function_base_url') ||
           '/hv-signal-analysis?signal_id=' || p_signal_id,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'hv_edge_anon_key'),
      'x-harbourview-cron-caller', 'pg_cron_hv_signal_analysis'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 28000
  ) INTO v_req_id;

  -- Normal case (healthy LLM credits): first provider succeeds in ~2-5s.
  -- Worst case (all 3 providers fail/exhausted, sequential fallback): can
  -- take close to the edge function's own 28s http timeout. Bound set to
  -- cover the worst case with headroom -- callers on Vercel should confirm
  -- their function/route timeout exceeds ~30s, or treat this as fire-and-poll
  -- from the client instead of a single blocking request.
  LOOP
    PERFORM pg_sleep(0.5);
    v_waited := v_waited + 0.5;
    SELECT status_code, content::jsonb INTO v_status, v_body
    FROM net._http_response WHERE id = v_req_id;
    EXIT WHEN v_status IS NOT NULL OR v_waited >= 30;
  END LOOP;

  IF v_status IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'timed_out', 'request_id', v_req_id);
  END IF;

  IF v_status <> 200 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'edge_function_error', 'status', v_status, 'detail', v_body);
  END IF;

  RETURN v_body;
END;
$function$;
GRANT EXECUTE ON FUNCTION api.request_signal_analysis(text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION api.request_signal_analysis(text) TO authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260813030000','baseline_capture_misc_functions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260813030000_baseline_capture_misc_functions.sql

-- RECOVERY BEGIN 20260813120000_rls_initplan_scalar_subselect.sql
-- Performance: evaluate auth.* once per query instead of once per row.
--
-- `get_advisors(type: performance)` reports 13 `auth_rls_initplan` findings.
-- A bare `auth.role()` / `auth.uid()` inside a policy expression is re-evaluated
-- for every candidate row. Wrapping the call in a scalar subselect lets Postgres
-- hoist it into an InitPlan that runs once per query. The value is identical --
-- both functions are STABLE -- so this is a planner change, not a policy change.
-- No policy's name, command, roles, or permissiveness is altered; only the
-- expression is rewritten, via ALTER POLICY.
--
-- Guarded on policy existence for two reasons:
--   1. `job_search` is not created by any migration in this repository. The
--      schema and its tables exist only in the live project (undocumented, and
--      separately flagged). An unguarded ALTER would therefore fail every clean
--      rebuild, every Supabase preview branch, and the Global Reg OS postgres
--      validation harness.
--   2. It keeps the migration a safe no-op wherever a policy is already absent.
--
-- Deliberately NOT touched: `job_search.gmail_tokens` also has a policy named
-- `service role full access`, but its qual is the constant `true` with roles
-- `{service_role}`. It calls no auth function, is not one of the 13 findings,
-- and needs no change.

-- 1. job_search: ten policies sharing one shape.
--    Audited before writing -- each is PERMISSIVE, cmd ALL, roles {public},
--    qual `(auth.role() = 'service_role'::text)`, with_check NULL.
DO $$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'companies',
    'jobs',
    'applications',
    'resume_versions',
    'contacts',
    'outreach_messages',
    'settings_legacy_single_row',
    'settings',
    'opportunities',
    'prospects'
  ] LOOP
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'job_search'
        AND tablename = target_table
        AND policyname = 'service role full access'
    ) THEN
      EXECUTE format(
        'ALTER POLICY %I ON job_search.%I USING ((SELECT auth.role()) = ''service_role''::text)',
        'service role full access',
        target_table
      );
    END IF;
  END LOOP;
END $$;

-- 2. public.ia_extraction_failures -- SELECT, roles {public}.
--    The IN (SELECT ...) subquery is preserved exactly; only the auth.uid()
--    call on the left-hand side is hoisted.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ia_extraction_failures'
      AND policyname = 'Admins can view extraction failures'
  ) THEN
    ALTER POLICY "Admins can view extraction failures"
      ON public.ia_extraction_failures
      USING (
        (SELECT auth.uid()) IN (
          SELECT users.id
          FROM auth.users
          WHERE ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)
        )
      );
  END IF;
END $$;

-- 3. public.signal_relevance_feedback -- roles {authenticated}.
--    The SELECT policy carries a USING expression; the INSERT policy carries
--    only WITH CHECK, so each is altered on the clause it actually has.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'signal_relevance_feedback'
      AND policyname = 'signal_relevance_feedback_select_own'
  ) THEN
    ALTER POLICY signal_relevance_feedback_select_own
      ON public.signal_relevance_feedback
      USING ((SELECT auth.uid()) = user_id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'signal_relevance_feedback'
      AND policyname = 'signal_relevance_feedback_insert_own'
  ) THEN
    ALTER POLICY signal_relevance_feedback_insert_own
      ON public.signal_relevance_feedback
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260813120000','rls_initplan_scalar_subselect','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260813120000_rls_initplan_scalar_subselect.sql

-- RECOVERY BEGIN 20260813184000_restore_hv_org_snapshots_foundation.sql
-- Restore the missing organization snapshot relation consumed by the existing
-- generate-org-snapshot Edge Function. Production currently has no
-- public.hv_org_snapshots relation. The writer is updated alongside this
-- migration to target the public relation directly with the service role.
--
-- This migration is intentionally isolated from the commercial-graph work:
-- snapshots remain a private derived cache owned by the workspace/KYB estate.

create table if not exists public.hv_org_snapshots (
  org_id uuid primary key references public.workspaces(id) on delete cascade,
  legal_name text,
  trade_name text,
  org_type text,
  jurisdiction_country text,
  verification_status text not null default 'unverified',
  slug text,
  completeness_score double precision not null default 0,
  completeness_band text not null default 'incomplete',
  verification_level text not null default 'none',
  export_readiness_band text not null default 'not_ready',
  passport_last_computed_at timestamptz,
  active_licence_count integer not null default 0 check (active_licence_count >= 0),
  licence_types text[] not null default '{}',
  facility_count integer not null default 0 check (facility_count >= 0),
  verified_doc_count integer not null default 0 check (verified_doc_count >= 0),
  marketplace_listing_count integer not null default 0 check (marketplace_listing_count >= 0),
  has_export_licence boolean not null default false,
  has_coa boolean not null default false,
  member_since timestamptz,
  updated_at timestamptz not null default now(),
  constraint hv_org_snapshots_verification_status_check check (
    verification_status in ('unverified', 'pending_review', 'verified', 'suspended', 'revoked')
  ),
  constraint hv_org_snapshots_completeness_band_check check (
    completeness_band in ('incomplete', 'partial', 'substantial', 'complete')
  ),
  constraint hv_org_snapshots_verification_level_check check (
    verification_level in ('none', 'basic', 'standard', 'enhanced')
  ),
  constraint hv_org_snapshots_export_band_check check (
    export_readiness_band in ('not_ready', 'partial', 'ready', 'verified')
  )
);

comment on table public.hv_org_snapshots is
  'Private derived organization snapshot generated from workspace, passport, licence, facility, evidence and marketplace state.';
comment on column public.hv_org_snapshots.org_id is
  'One snapshot per workspace. Primary key is also the workspaces FK and the Edge Function upsert conflict key.';

alter table public.hv_org_snapshots enable row level security;

-- The generated snapshot is readable by members of its own organization and
-- fully manageable by Harbourview platform staff. Writes from normal org
-- sessions are intentionally absent: generation is server/service controlled.
drop policy if exists hv_org_snapshots_org_member_select on public.hv_org_snapshots;
create policy hv_org_snapshots_org_member_select
  on public.hv_org_snapshots
  as permissive
  for select
  to authenticated
  using (public.hv_is_org_member(org_id));

drop policy if exists hv_org_snapshots_staff_all on public.hv_org_snapshots;
create policy hv_org_snapshots_staff_all
  on public.hv_org_snapshots
  as permissive
  for all
  to authenticated
  using (public.hv_is_platform_staff())
  with check (public.hv_is_platform_staff());

drop policy if exists hv_org_snapshots_service_all on public.hv_org_snapshots;
create policy hv_org_snapshots_service_all
  on public.hv_org_snapshots
  as permissive
  for all
  to service_role
  using (true)
  with check (true);

revoke all on table public.hv_org_snapshots from public, anon, authenticated;
grant select on table public.hv_org_snapshots to authenticated;
grant all privileges on table public.hv_org_snapshots to service_role;

-- No api.hv_org_snapshots projection is created. There is no current reader
-- requiring it, and the service writer now targets public.hv_org_snapshots
-- explicitly so the private derived cache does not gain unnecessary API surface.

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260813184000','restore_hv_org_snapshots_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260813184000_restore_hv_org_snapshots_foundation.sql

-- RECOVERY BEGIN 20260813210000_alert_on_edge_http_errors.sql
-- Alert on edge-function calls that failed, which pg_cron cannot see.
--
-- pg_cron marks a job 'succeeded' when net.http_post enqueues the request. The
-- edge function's actual response is recorded separately in net._http_response
-- and was, until now, unasserted. On 2026-08-13 cron reported 33/33 jobs green
-- over 24 hours while 17 of 61 responses were failures:
--
--     400 x 6   Anthropic: "Your credit balance is too low"        (hourly, :40)
--     500 x 6   "permission denied for function
--               get_tables_missing_from_api_schema"                (hourly, :12)
--     none x 5  Timeout of 25000 ms                                (:00 / :30)
--
-- This adds one assertion in the style this function already documents: assert
-- the fact that must hold if the stage genuinely worked, rather than trusting
-- the stage to report its own health.
--
-- Only the new `edge_http_errors` branch is added. Every existing branch is
-- reproduced byte-for-byte from 20260730222221_hv_pipeline_alerts_outcome_assertions.sql,
-- and this file is generated from that one rather than retyped.

create or replace function public.hv_pipeline_alerts()
returns table(alert_key text, severity text, value text, detail text)
language sql
security definer
set search_path to 'public'
as $function$
  select 'feed_stale',
         case when h > 96 then 'critical' when h > 48 then 'warning' else 'ok' end,
         round(h)::text || 'h',
         'hours since newest promoted signal date; ingest runs daily so >48h means promotion is not keeping up'
  from (select extract(epoch from (now() - max(date)))/3600 as h
        from public.signals where reviewed) f

  union all
  select 'no_recent_promotions',
         case when n = 0 then 'critical' else 'ok' end,
         n::text,
         'signals promoted in the last 48h; zero while ingestion runs means the promote path is broken'
  from (select count(*) n from public.signals
        where reviewed and reviewed_at > now() - interval '48 hours') p

  union all
  select 'dispatch_http_errors',
         case when n > 0 then 'critical' else 'ok' end,
         n::text,
         'unharvested dispatch jobs whose HTTP response was 4xx/5xx; any non-zero means a stage is failing every call'
  from (
    select count(*) n from (
      select j.request_id from public.hv_classify_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
      union all
      select j.request_id from public.hv_entity_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
      union all
      select j.request_id from public.hv_embed_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
      union all
      select j.request_id from public.hv_translation_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
    ) e) d

  union all
  -- Structural rescan check: a signal already dispatched must not be eligible again.
  select 'extraction_rescan',
         case when n > 50 then 'critical' when n > 0 then 'warning' else 'ok' end,
         n::text,
         'signals already entity-dispatched yet still eligible for dispatch; >0 means the once-only guard has regressed'
  from (
    select count(*) n
    from public.signals s
    where s.quality_label = 'signal'
      and s.entities_extracted_at is null
      and exists (select 1 from public.hv_entity_jobs j where j.signal_id = s.id and j.harvested)
  ) rs

  union all
  select 'digest_stale',
         case when h > 72 then 'critical' when h > 48 then 'warning' else 'ok' end,
         round(h)::text || 'h',
         'hours since the last published daily_digest; the digest job reports success when it skips, so only freshness reveals it'
  from (select extract(epoch from (now() - max(generated_at)))/3600 as h
        from public.daily_digest where status='published') dg

  union all
  select 'budget_below_ingest',
         case when ceiling_per_day < ingest_per_day then 'critical'
              when ceiling_per_day < ingest_per_day * 1.5 then 'warning' else 'ok' end,
         ceiling_per_day::text || '/day vs ' || round(ingest_per_day)::text || ' ingested/day',
         'classify daily ceiling versus actual ingest rate; at or below parity the backlog can never clear'
  from (
    select (select daily_ceiling from public.hv_dispatch_budget where stage='classify') as ceiling_per_day,
           (select count(*)::numeric/7 from public.signals where created_at > now() - interval '7 days') as ingest_per_day
  ) b

  union all
  select 'cron_failures',
         case when n > 3 then 'critical' when n > 0 then 'warning' else 'ok' end,
         n::text,
         'failed pipeline cron runs in the last 2h'
  from (select count(*) n from cron.job_run_details d
        join cron.job j on j.jobid=d.jobid
        where d.status='failed' and d.start_time > now() - interval '2 hours'
          and j.jobname like 'hv-%') c

  union all
  select 'harvest_backlog',
         case when n > 500 then 'critical' when n > 200 then 'warning' else 'ok' end,
         n::text,
         'unharvested jobs across all stages; a rising count means a harvest step is not running'
  from (select (select count(*) from public.hv_classify_jobs where not harvested)
             + (select count(*) from public.hv_embed_jobs where not harvested)
             + (select count(*) from public.hv_translation_jobs where not harvested)
             + (select count(*) from public.hv_entity_jobs where not harvested) as n) hb

  union all
  -- Every classifier_version in use must have a gate_passed row, else promotion for
  -- those rows halts silently. Checks all versions present, not just one guessed row.
  select 'classifier_gate',
         case when n_ungated > 0 then 'critical' else 'ok' end,
         coalesce(versions, 'none'),
         'classifier versions on signals lacking a gate_passed=true validation row; any such version cannot promote'
  from (
    select count(*) filter (where not coalesce(cv.gate_passed,false)) as n_ungated,
           string_agg(v.classifier_version || '=' || coalesce(cv.gate_passed::text,'no_row'), ', ' order by v.classifier_version) as versions
    from (select distinct classifier_version from public.signals where classifier_version is not null) v
    left join public.classifier_validation cv on cv.classifier_version = v.classifier_version
  ) g

  union all
  -- pg_cron reports success when net.http_post *enqueues* a request, not when the
  -- edge function succeeds. On 2026-08-13 that hid three permanently failing jobs
  -- while cron showed 33/33 green for 24h: an hourly Anthropic 400 (credit balance),
  -- an hourly schema-drift-monitor 500 (permission denied), and a recurring 25s
  -- timeout. dispatch_http_errors does not cover these -- it only inspects
  -- unharvested *dispatch* jobs, and cron-invoked functions are not dispatch jobs.
  --
  -- Asserts the outcome (a 2xx actually came back) rather than trusting the caller.
  select 'edge_http_errors',
         case when n > 0 then 'critical' else 'ok' end,
         n::text,
         'non-2xx or timed-out edge-function responses in the last 2h; pg_cron reports these as succeeded'
  from (
    select count(*) as n
    from net._http_response
    where created > now() - interval '2 hours'
      and (status_code is null or status_code < 200 or status_code >= 300)
  ) eh

  union all
  -- Classification is the gate every downstream stage depends on: a signal with a
  -- null quality_label can never reach quality_label='signal', so it can never be
  -- promoted, so the feed goes stale. On 2026-08-12 the Anthropic classifier began
  -- returning 400 "credit balance is too low"; classification silently stopped and
  -- the first visible symptom was feed_stale two days later, because every stage in
  -- between reported success.
  --
  -- Asserts that ingested signals are actually getting labelled. Ingest is hourly,
  -- so anything unclassified beyond 6h means the classifier is not keeping up.
  select 'classification_stalled',
         case when n > 0 then 'critical' else 'ok' end,
         n::text,
         'signals ingested >6h ago with no quality_label; unclassified rows can never promote'
  from (
    select count(*) as n
    from public.signals
    where quality_label is null
      and created_at < now() - interval '6 hours'
      and created_at > now() - interval '7 days'
  ) cs;
$function$;

comment on function public.hv_pipeline_alerts() is
  'Outcome-based pipeline assertions. Each row asserts a fact that must hold if a stage genuinely '
  'worked, rather than trusting the stage to report its own health -- every 2026-07-30 staleness '
  'incident was invisible to exit-code monitoring. severity <> ''ok'' is a breach. '
  'edge_http_errors (added 2026-08-13) covers cron-invoked edge functions, whose failures pg_cron '
  'reports as successes.';

-- Operator-plane only: SECURITY DEFINER over internal pipeline state. Unchanged.
revoke execute on function public.hv_pipeline_alerts() from public, anon, authenticated;
grant  execute on function public.hv_pipeline_alerts() to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260813210000','alert_on_edge_http_errors','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260813210000_alert_on_edge_http_errors.sql

-- RECOVERY BEGIN 20260813213000_grant_schema_drift_probes_to_service_role.sql
-- Repair schema-drift-monitor, which had been failing hourly with:
--
--     {"ok":false,"error":"permission denied for function get_tables_missing_from_api_schema"}
--
-- Cause. The edge function's client is configured `db: { schema: "api" }`, so it
-- calls api.get_tables_missing_from_api_schema(). That wrapper is SECURITY
-- INVOKER with public on its search_path, so it runs as the caller
-- (service_role) and reaches public.get_tables_missing_from_api_schema(), which
-- is SECURITY DEFINER with EXECUTE revoked from everyone --
-- whose ACL lists postgres alone. service_role could reach the wrapper but not its
-- target, so every hourly run 500'd.
--
-- pg_cron reported those runs as succeeded, because it reports on enqueueing the
-- request rather than on the response, so the failure was invisible. The job
-- that exists to detect drift was itself disabled by a permission drift.
--
-- Fix. Grant EXECUTE on the two public SECURITY DEFINER probes to service_role
-- only. Deliberately NOT granted to anon or authenticated: the api wrappers are
-- SECURITY INVOKER, so an anon or authenticated caller keeps its own identity
-- through the wrapper and is still refused at the public boundary. That is what
-- keeps the pre-existing anon grant on the wrappers harmless, and it is why this
-- is the minimal correct fix rather than relaxing the wrapper to DEFINER --
-- which would hand anon the ability to enumerate schema drift.
--
-- Verified in production immediately after applying, by probing each role:
--
--     role anon           -> DENIED, permission denied for function
--     role authenticated  -> DENIED, permission denied for function
--     role service_role   -> SUCCEEDED, 94 rows returned
--
-- (94 = tables currently missing from the api schema, the backlog this monitor
-- was unable to report while broken.)
--
-- Applied to production 2026-08-13 and committed forward here so the repository
-- continues to describe the database. Re-granting is idempotent and a no-op.

grant execute on function public.get_tables_missing_from_api_schema() to service_role;
grant execute on function public.get_functions_missing_from_api_schema() to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260813213000','grant_schema_drift_probes_to_service_role','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260813213000_grant_schema_drift_probes_to_service_role.sql

-- RECOVERY BEGIN 20260814121500_clinical_evidence_spine.sql
-- Clinical evidence spine P0.
-- Public, non-patient, provenance-bearing evidence records only.
-- This schema is deliberately separate from marketplace products, cultivar/genetics
-- records, patient data, recommendations and prescriptions.

create table if not exists public.clinical_condition_terms (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null unique,
  aliases text[] not null default '{}',
  vocabulary_source text,
  source_url text,
  verified_at timestamptz,
  review_status text not null default 'under_review'
    check (review_status in ('published', 'under_review', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_condition_source_https check (source_url is null or source_url ~ '^https://')
);

create table if not exists public.clinical_evidence_records (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  condition_term_id uuid references public.clinical_condition_terms(id) on delete set null,
  condition_label text,
  condition_aliases text[] not null default '{}',
  population text,
  intervention text,
  formulation text,
  cannabinoids text[] not null default '{}',
  intervention_class text not null
    check (intervention_class in (
      'regulated-cannabinoid-drug', 'general-cannabis', 'cannabinoid-isolate',
      'cannabis-derived-formulation', 'non-cannabis', 'not-applicable'
    )),
  comparator text,
  outcome text,
  evidence_type text not null
    check (evidence_type in (
      'regulation', 'regulatory-guidance', 'clinical-guideline', 'systematic-review',
      'meta-analysis', 'randomized-trial', 'observational-study',
      'pharmacovigilance-signal', 'product-monograph', 'other'
    )),
  evidence_strength text not null
    check (evidence_strength in ('high', 'moderate', 'low', 'very-low', 'ungraded', 'conflicted')),
  evidence_strength_method text,
  uncertainty text,
  conflict_status text not null default 'none'
    check (conflict_status in ('none', 'mixed', 'material-conflict')),
  jurisdictions text[] not null default '{}',
  profession_relevance text[] not null default '{}',
  primary_source_title text not null,
  primary_source_publisher text not null,
  primary_source_url text not null,
  primary_source_id text,
  publication_date date,
  effective_date date,
  verified_at timestamptz not null,
  supersession_state text not null default 'current'
    check (supersession_state in ('current', 'superseded', 'partially-superseded')),
  superseded_by_id uuid references public.clinical_evidence_records(id) on delete set null,
  review_status text not null default 'under-review'
    check (review_status in ('published', 'under-review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_evidence_source_https check (primary_source_url ~ '^https://')
);

create table if not exists public.clinical_evidence_change_events (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid references public.clinical_evidence_records(id) on delete set null,
  event_type text not null
    check (event_type in ('published', 'updated', 'superseded', 'conflict-detected', 'conflict-resolved')),
  title text not null,
  summary text not null,
  materiality text not null default 'medium'
    check (materiality in ('low', 'medium', 'high')),
  jurisdictions text[] not null default '{}',
  profession_relevance text[] not null default '{}',
  occurred_at timestamptz not null,
  verified_at timestamptz not null,
  primary_source_title text not null,
  primary_source_publisher text not null,
  primary_source_url text not null,
  primary_source_id text,
  review_status text not null default 'under-review'
    check (review_status in ('published', 'under-review')),
  created_at timestamptz not null default now(),
  constraint clinical_evidence_change_source_https check (primary_source_url ~ '^https://')
);

create index if not exists idx_clinical_evidence_condition
  on public.clinical_evidence_records (lower(condition_label));
create index if not exists idx_clinical_evidence_verified
  on public.clinical_evidence_records (verified_at desc);
create index if not exists idx_clinical_evidence_changes_occurred
  on public.clinical_evidence_change_events (occurred_at desc);
create index if not exists idx_clinical_condition_terms_name
  on public.clinical_condition_terms (lower(canonical_name));

alter table public.clinical_condition_terms enable row level security;
alter table public.clinical_evidence_records enable row level security;
alter table public.clinical_evidence_change_events enable row level security;

-- Only reviewed/public records are readable from browser-facing roles.
drop policy if exists clinical_condition_terms_public_read on public.clinical_condition_terms;
create policy clinical_condition_terms_public_read
  on public.clinical_condition_terms for select to anon, authenticated
  using (review_status = 'published');

drop policy if exists clinical_evidence_records_public_read on public.clinical_evidence_records;
create policy clinical_evidence_records_public_read
  on public.clinical_evidence_records for select to anon, authenticated
  using (review_status = 'published');

drop policy if exists clinical_evidence_change_events_public_read on public.clinical_evidence_change_events;
create policy clinical_evidence_change_events_public_read
  on public.clinical_evidence_change_events for select to anon, authenticated
  using (
    review_status = 'published'
    and (
      evidence_record_id is null
      or exists (
        select 1 from public.clinical_evidence_records r
        where r.id = clinical_evidence_change_events.evidence_record_id
          and r.review_status = 'published'
      )
    )
  );

grant select on public.clinical_condition_terms to anon, authenticated;
grant select on public.clinical_evidence_records to anon, authenticated;
grant select on public.clinical_evidence_change_events to anon, authenticated;
grant all on public.clinical_condition_terms to service_role;
grant all on public.clinical_evidence_records to service_role;
grant all on public.clinical_evidence_change_events to service_role;

-- Deterministic server-side search across the complete reviewed evidence set.
-- SECURITY INVOKER preserves the table RLS boundary for anon/authenticated callers.
create or replace function public.search_clinical_evidence_records(
  p_query text default '',
  p_jurisdiction text default null,
  p_limit integer default 20
)
returns setof public.clinical_evidence_records
language sql
stable
security invoker
set search_path = public
as $function$
  select r.*
  from public.clinical_evidence_records r
  where r.review_status = 'published'
    and (p_jurisdiction is null or p_jurisdiction = any(r.jurisdictions))
    and (
      btrim(coalesce(p_query, '')) = ''
      or lower(coalesce(r.condition_label, '')) like '%' || lower(btrim(p_query)) || '%'
      or exists (select 1 from unnest(r.condition_aliases) a where lower(a) like '%' || lower(btrim(p_query)) || '%')
      or lower(r.title) like '%' || lower(btrim(p_query)) || '%'
      or lower(r.summary) like '%' || lower(btrim(p_query)) || '%'
      or lower(coalesce(r.population, '')) like '%' || lower(btrim(p_query)) || '%'
      or lower(coalesce(r.intervention, '')) like '%' || lower(btrim(p_query)) || '%'
      or lower(coalesce(r.formulation, '')) like '%' || lower(btrim(p_query)) || '%'
      or exists (select 1 from unnest(r.cannabinoids) c where lower(c) like '%' || lower(btrim(p_query)) || '%')
      or lower(coalesce(r.outcome, '')) like '%' || lower(btrim(p_query)) || '%'
    )
  order by
    case when r.supersession_state = 'current' then 0 else 1 end,
    r.verified_at desc,
    r.id
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$function$;

create or replace function public.clinical_condition_term_known(p_query text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $function$
  select exists (
    select 1
    from public.clinical_condition_terms t
    where t.review_status = 'published'
      and btrim(coalesce(p_query, '')) <> ''
      and (
        lower(t.canonical_name) = lower(btrim(p_query))
        or lower(t.canonical_name) like '%' || lower(btrim(p_query)) || '%'
        or exists (select 1 from unnest(t.aliases) a where lower(a) = lower(btrim(p_query)) or lower(a) like '%' || lower(btrim(p_query)) || '%')
      )
  );
$function$;

revoke all on function public.search_clinical_evidence_records(text, text, integer) from public;
revoke all on function public.clinical_condition_term_known(text) from public;
grant execute on function public.search_clinical_evidence_records(text, text, integer) to anon, authenticated, service_role;
grant execute on function public.clinical_condition_term_known(text) to anon, authenticated, service_role;

-- P0 seed is intentionally limited to current Canadian primary authority and
-- regulatory/pharmacovigilance guidance. No condition efficacy, drug interaction,
-- profession-specific authorization, product or cultivar claim is inferred here.
insert into public.clinical_evidence_records (
  slug, title, summary, intervention_class, evidence_type, evidence_strength,
  evidence_strength_method, uncertainty, jurisdictions, profession_relevance,
  primary_source_title, primary_source_publisher, primary_source_url, primary_source_id,
  effective_date, verified_at, supersession_state, review_status
) values
(
  'ca-cannabis-regulations-medical-document-273',
  'Medical document requirements under Cannabis Regulations §273',
  'Primary federal legal requirements for the contents and validity of a medical document used for access to cannabis for medical purposes.',
  'general-cannabis', 'regulation', 'ungraded',
  'Legal authority; clinical evidence certainty is not applicable.',
  'This record describes federal legal requirements and does not establish efficacy, safety or appropriateness for an individual patient.',
  array['Canada'], array['doctor','nurse_practitioner','pharmacist','other'],
  'Cannabis Regulations §273', 'Justice Laws Website',
  'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2018-144/section-273.html',
  'SOR-2018-144-s273', null, '2026-08-14T12:00:00Z', 'current', 'published'
),
(
  'ca-health-canada-medical-practitioners',
  'Health Canada information for health care practitioners',
  'Federal professional orientation for health care practitioners, including the direction to consult applicable provincial or territorial licensing-authority guidance before authorizing cannabis for medical purposes.',
  'general-cannabis', 'regulatory-guidance', 'ungraded',
  'Primary government guidance; no formal evidence-certainty grading is supplied by the source.',
  'This guidance does not replace profession-specific provincial or territorial requirements and is not encoded as a profession-specific authorization rule.',
  array['Canada'], array['doctor','nurse_practitioner','pharmacist','other'],
  'Information for Health Care Practitioners - Medical Use of Cannabis', 'Health Canada',
  'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/information-medical-practitioners.html',
  'health-canada-medical-practitioners', null, '2026-08-14T12:00:00Z', 'current', 'published'
),
(
  'ca-health-canada-cannabis-adverse-reaction-reporting-hcp',
  'Cannabis adverse-reaction reporting for health care professionals',
  'Current Health Canada guidance encourages health care professionals to report suspected adverse reactions to cannabis, including when causality is uncertain.',
  'general-cannabis', 'regulatory-guidance', 'ungraded',
  'Primary government pharmacovigilance guidance; clinical evidence certainty is not graded by the source.',
  'A suspected adverse reaction report does not establish that cannabis caused the event.',
  array['Canada'], array['doctor','nurse_practitioner','pharmacist','nurse','other'],
  'Report a side effect to cannabis: Health care professionals', 'Health Canada',
  'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/recalls-adverse-reactions-reporting/report-side-effects-cannabis-products/health-care-professionals.html',
  'health-canada-cannabis-adverse-reaction-hcp', null, '2026-08-14T12:00:00Z', 'current', 'published'
)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  evidence_strength_method = excluded.evidence_strength_method,
  uncertainty = excluded.uncertainty,
  jurisdictions = excluded.jurisdictions,
  profession_relevance = excluded.profession_relevance,
  primary_source_title = excluded.primary_source_title,
  primary_source_publisher = excluded.primary_source_publisher,
  primary_source_url = excluded.primary_source_url,
  primary_source_id = excluded.primary_source_id,
  effective_date = excluded.effective_date,
  verified_at = excluded.verified_at,
  supersession_state = excluded.supersession_state,
  review_status = excluded.review_status,
  updated_at = now();

insert into public.clinical_evidence_change_events (
  evidence_record_id, event_type, title, summary, materiality, jurisdictions,
  profession_relevance, occurred_at, verified_at, primary_source_title,
  primary_source_publisher, primary_source_url, primary_source_id, review_status
)
select
  r.id,
  'updated',
  'Current Cannabis Regulations medical-document authority verified',
  'Harbourview verified the current federal §273 medical-document authority and suppresses legacy ACMPR-era framing rather than treating it as current.',
  'high', array['Canada'], array['doctor','nurse_practitioner','pharmacist','other'],
  '2026-08-14T12:00:00Z', '2026-08-14T12:00:00Z',
  'Cannabis Regulations §273', 'Justice Laws Website',
  'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2018-144/section-273.html',
  'SOR-2018-144-s273', 'published'
from public.clinical_evidence_records r
where r.slug = 'ca-cannabis-regulations-medical-document-273'
  and not exists (
    select 1 from public.clinical_evidence_change_events e
    where e.primary_source_id = 'SOR-2018-144-s273'
      and e.event_type = 'updated'
      and e.occurred_at = '2026-08-14T12:00:00Z'
  );

comment on table public.clinical_evidence_records is
  'Public reviewed clinical/regulatory evidence metadata only. Never store patient data, marketplace listing data, cultivar genetics, seller claims or private provenance here.';
comment on table public.clinical_evidence_change_events is
  'Public reviewed change events for clinical evidence/regulatory records; not a patient event log.';
comment on function public.search_clinical_evidence_records(text, text, integer) is
  'RLS-preserving deterministic search over the complete published Clinical evidence set; no marketplace, genetics or patient joins.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260814121500','clinical_evidence_spine','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260814121500_clinical_evidence_spine.sql

-- RECOVERY BEGIN 20260814122000_p0_identity_org_context.sql
begin;

-- P0 identity / organization operating context.
-- workspaces + workspace_members remain the canonical organization/membership model.

alter table public.user_dashboard_preferences
  add column if not exists active_workspace_id uuid null references public.workspaces(id) on delete set null;

create index if not exists idx_user_dashboard_preferences_active_workspace
  on public.user_dashboard_preferences(active_workspace_id)
  where active_workspace_id is not null;

-- Preserve the legacy one-organization experience only when the sole active
-- membership belongs to an active workspace. New/explicit null values continue
-- to mean Personal operating mode.
with single_active_membership as (
  select wm.user_id, min(wm.workspace_id::text)::uuid as workspace_id
  from public.workspace_members wm
  join public.workspaces w on w.id = wm.workspace_id and w.status = 'active'
  where wm.status = 'active'
  group by wm.user_id
  having count(*) = 1
)
update public.user_dashboard_preferences p
set active_workspace_id = s.workspace_id,
    updated_at = now()
from single_active_membership s
where p.user_id = s.user_id
  and p.active_workspace_id is null;

-- Tighten direct preference writes so a user cannot select an organization
-- unless both the membership and the workspace itself are active. Null is the
-- explicit Personal state.
drop policy if exists "Users can insert their own dashboard preferences" on public.user_dashboard_preferences;
create policy "Users can insert their own dashboard preferences"
  on public.user_dashboard_preferences for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (
      active_workspace_id is null
      or exists (
        select 1
        from public.workspace_members wm
        join public.workspaces w on w.id = wm.workspace_id
        where wm.workspace_id = active_workspace_id
          and wm.user_id = (select auth.uid())
          and wm.status = 'active'
          and w.status = 'active'
      )
    )
  );

drop policy if exists "Users can update their own dashboard preferences" on public.user_dashboard_preferences;
create policy "Users can update their own dashboard preferences"
  on public.user_dashboard_preferences for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      active_workspace_id is null
      or exists (
        select 1
        from public.workspace_members wm
        join public.workspaces w on w.id = wm.workspace_id
        where wm.workspace_id = active_workspace_id
          and wm.user_id = (select auth.uid())
          and wm.status = 'active'
          and w.status = 'active'
      )
    )
  );

-- CREATE OR REPLACE VIEW must preserve the ordinal/name contract of existing
-- columns. Append active_workspace_id after the existing seven columns so this
-- migration works both fresh and against the already-deployed API view.
create or replace view api.user_dashboard_preferences
with (security_invoker = true) as
select
  id,
  user_id,
  country_iso2,
  role_id,
  heatmap_layer,
  created_at,
  updated_at,
  active_workspace_id
from public.user_dashboard_preferences;

grant select, insert, update, delete on api.user_dashboard_preferences to authenticated;
grant select, insert, update, delete on api.user_dashboard_preferences to service_role;

-- Invitation transport only. workspace_members remains canonical after acceptance.
create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin','operator','analyst','viewer')),
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id),
  status text not null default 'pending' check (status in ('pending','accepted','declined','revoked','expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create unique index if not exists workspace_invitations_one_pending_per_email
  on public.workspace_invitations(workspace_id, lower(email))
  where status = 'pending';

create index if not exists idx_workspace_invitations_email_status
  on public.workspace_invitations(lower(email), status, expires_at);

alter table public.workspace_invitations enable row level security;
revoke all on table public.workspace_invitations from public, anon, authenticated;
grant all on table public.workspace_invitations to service_role;

-- The production Data API exposes `api`, not `public`. Keep invitation transport
-- reachable only to the server-side service role through an invoker view; the
-- raw token hash is never granted to browser roles.
create or replace view api.workspace_invitations
with (security_invoker = true) as
select
  id,
  workspace_id,
  email,
  role,
  token_hash,
  invited_by,
  status,
  created_at,
  expires_at,
  accepted_at,
  accepted_by,
  updated_at
from public.workspace_invitations;

revoke all on api.workspace_invitations from public, anon, authenticated;
grant select, insert, update, delete on api.workspace_invitations to service_role;

-- Atomic invitation consumption. The invitation row is locked before any
-- membership mutation. Existing canonical membership roles are never replaced.
-- Inactive memberships require an explicit administrative reactivation path.
create or replace function api.accept_workspace_invitation(
  p_token_hash text,
  p_user_id uuid,
  p_user_email text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation record;
  existing_membership record;
  v_now timestamptz := now();
  normalized_email text := lower(trim(p_user_email));
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' or normalized_email = '' then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  select
    wi.id,
    wi.workspace_id,
    wi.email,
    wi.role,
    wi.status,
    wi.invited_by,
    wi.created_at,
    wi.expires_at,
    wi.accepted_by,
    w.status as workspace_status
  into invitation
  from public.workspace_invitations wi
  join public.workspaces w on w.id = wi.workspace_id
  where wi.token_hash = lower(p_token_hash)
  for update of wi;

  if not found then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  if lower(trim(invitation.email)) <> normalized_email then
    return jsonb_build_object('outcome', 'email_mismatch');
  end if;

  if invitation.status = 'accepted' then
    select wm.role, wm.status
    into existing_membership
    from public.workspace_members wm
    where wm.workspace_id = invitation.workspace_id
      and wm.user_id = p_user_id;

    if invitation.accepted_by = p_user_id
       and existing_membership.status = 'active' then
      return jsonb_build_object(
        'outcome', 'already_accepted',
        'workspace_id', invitation.workspace_id,
        'role', existing_membership.role
      );
    end if;

    return jsonb_build_object('outcome', 'already_used');
  end if;

  if invitation.status <> 'pending' then
    return jsonb_build_object('outcome', invitation.status);
  end if;

  if invitation.expires_at <= v_now then
    update public.workspace_invitations
    set status = 'expired', updated_at = v_now
    where id = invitation.id and status = 'pending';
    return jsonb_build_object('outcome', 'expired');
  end if;

  if invitation.workspace_status <> 'active' then
    return jsonb_build_object('outcome', 'workspace_unavailable');
  end if;

  select wm.role, wm.status
  into existing_membership
  from public.workspace_members wm
  where wm.workspace_id = invitation.workspace_id
    and wm.user_id = p_user_id
  for update;

  if found then
    if existing_membership.status <> 'active' then
      return jsonb_build_object('outcome', 'existing_membership_inactive');
    end if;

    update public.workspace_invitations
    set status = 'accepted',
        accepted_at = v_now,
        accepted_by = p_user_id,
        updated_at = v_now
    where id = invitation.id and status = 'pending';

    if not found then
      return jsonb_build_object('outcome', 'already_used');
    end if;

    return jsonb_build_object(
      'outcome', 'already_member',
      'workspace_id', invitation.workspace_id,
      'role', existing_membership.role
    );
  end if;

  insert into public.workspace_members (
    workspace_id,
    user_id,
    role,
    status,
    invited_by,
    invited_at,
    joined_at
  ) values (
    invitation.workspace_id,
    p_user_id,
    invitation.role,
    'active',
    invitation.invited_by,
    invitation.created_at,
    v_now
  );

  update public.workspace_invitations
  set status = 'accepted',
      accepted_at = v_now,
      accepted_by = p_user_id,
      updated_at = v_now
  where id = invitation.id and status = 'pending';

  if not found then
    raise exception 'INVITATION_CONSUME_RACE';
  end if;

  return jsonb_build_object(
    'outcome', 'accepted',
    'workspace_id', invitation.workspace_id,
    'role', invitation.role
  );
end;
$$;

revoke all on function api.accept_workspace_invitation(text, uuid, text) from public, anon, authenticated;
grant execute on function api.accept_workspace_invitation(text, uuid, text) to service_role;

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260814122000','p0_identity_org_context','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260814122000_p0_identity_org_context.sql

-- RECOVERY BEGIN 20260814124500_release_closure_security_hardening.sql
-- Harbourview release-closure security hardening — 2026-08-14.
--
-- Scope:
--   * restore caller-privilege execution for the two advisor-reported signal views;
--   * remove browser-role EXECUTE from SECURITY DEFINER routines except the
--     repository-audited authenticated allowlist;
--   * pin hv_truncate_at_word_boundary to an explicit search_path;
--   * contain pg_net because the extension is non-relocatable on this project.
--
-- This migration changes privileges/execution context only. It does not rewrite
-- application rows. Supabase leaked-password protection is a Management API
-- setting and is intentionally handled by scripts/configure-supabase-auth-production.mjs,
-- not by database DDL.

-- The intelligence feed is intentionally public-safe. security_invoker makes
-- underlying public.signals / public.ia_signals grants and RLS authoritative.
do $$
begin
  if to_regclass('public.signals_intelligence_feed') is not null then
    alter view public.signals_intelligence_feed set (security_invoker = true);
    revoke all privileges on table public.signals_intelligence_feed from public, anon, authenticated;
    grant select on table public.signals_intelligence_feed to anon, authenticated, service_role;
  end if;

  if to_regclass('public.signals_quality') is not null then
    alter view public.signals_quality set (security_invoker = true);
    revoke all privileges on table public.signals_quality from public, anon, authenticated;
    grant select on table public.signals_quality to authenticated, service_role;
  end if;
end
$$;

-- SECURITY DEFINER functions must not inherit callable browser access through
-- PUBLIC. Start closed for application roles, then restore only the
-- repository-audited authenticated allowlist below. Existing service_role and
-- owner privileges are deliberately preserved rather than expanded.
do $$
declare
  routine record;
begin
  for routine in
    select
      n.nspname as schema_name,
      p.proname as routine_name,
      pg_get_function_identity_arguments(p.oid) as identity_arguments
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.prosecdef
      and n.nspname in ('public', 'api', 'signals', 'regulatory_signals')
  loop
    execute format(
      'revoke execute on function %I.%I(%s) from public, anon, authenticated',
      routine.schema_name,
      routine.routine_name,
      routine.identity_arguments
    );
  end loop;
end
$$;

-- Exact authenticated SECURITY DEFINER allowlist. These routines are retained
-- because repository/live policy and application contracts require signed-in
-- callers to execute them. public.is_harbourview_admin(), for example, is used
-- directly by Marketplace and Storage RLS policies; removing authenticated
-- EXECUTE would make those policies error instead of evaluating the caller.
-- Missing optional routines are skipped so replay remains safe across environments.
do $$
declare
  signature text;
  authenticated_allowlist constant text[] := array[
    'api.get_command_centre_stats()',
    'api.get_corridor_stats(text)',
    'api.get_source_registry_coverage(text)',
    'api.regulatory_pending_changes_feed()',
    'api.submit_signal_relevance_feedback(text,text,text,text)',
    'api.is_verified_clinician(uuid)',
    'api.clinical_has_active_consent(uuid,text)',
    'api.clinical_request_verification(text,text,text,uuid)',
    'public.hv_is_org_member(uuid)',
    'public.hv_is_platform_staff()',
    'public.is_genetics_admin_or_reviewer()',
    'public.is_harbourview_admin()',
    'public.is_hv_staff()',
    'public.current_user_tier()',
    'public.is_regulatory_tier_admin()'
  ];
begin
  foreach signature in array authenticated_allowlist
  loop
    if to_regprocedure(signature) is not null then
      execute format('grant execute on function %s to authenticated', signature);
    end if;
  end loop;
end
$$;

-- Advisor finding: mutable search_path. The function needs only built-ins and
-- public objects, so keep pg_catalog first and public explicit.
alter function public.hv_truncate_at_word_boundary(text, integer)
  set search_path = pg_catalog, public;

-- pg_net is installed in public at the extension level and reports
-- extrelocatable=false on production. Relocation is therefore not a safe DDL
-- option. Contain its callable `net` routines instead. Existing backend/owner
-- execution is preserved; browser roles lose direct asynchronous network access.
do $$
declare
  routine record;
begin
  if exists (select 1 from pg_extension where extname = 'pg_net') then
    if exists (select 1 from pg_namespace where nspname = 'net') then
      revoke usage on schema net from public, anon, authenticated;
    end if;

    for routine in
      select
        n.nspname as schema_name,
        p.proname as routine_name,
        pg_get_function_identity_arguments(p.oid) as identity_arguments
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      join pg_depend d on d.objid = p.oid and d.deptype = 'e'
      join pg_extension e on e.oid = d.refobjid
      where e.extname = 'pg_net'
    loop
      execute format(
        'revoke execute on function %I.%I(%s) from public, anon, authenticated',
        routine.schema_name,
        routine.routine_name,
        routine.identity_arguments
      );
    end loop;
  end if;
end
$$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260814124500','release_closure_security_hardening','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260814124500_release_closure_security_hardening.sql

-- RECOVERY BEGIN 20260814134500_clinical_evidence_v1_governance.sql
-- Clinical Evidence V1 governance and first condition-level corpus.
-- Builds on 20260814121500_clinical_evidence_spine.sql.
-- Public rows remain reviewed projections; source extraction/review provenance stays private.

create table if not exists public.clinical_evidence_grading_methods (
  method_key text primary key,
  version text not null,
  title text not null,
  description text not null,
  requires_clinical_review boolean not null default true,
  source_url text,
  effective_at timestamptz not null,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  constraint clinical_grading_method_source_https check (source_url is null or source_url ~ '^https://')
);

insert into public.clinical_evidence_grading_methods (
  method_key, version, title, description, requires_clinical_review, source_url, effective_at
) values (
  'harbourview-clinical-evidence-v1',
  '1.0.0',
  'Harbourview Clinical Evidence V1',
  'Ingestion defaults to ungraded. High/moderate/low/very-low certainty may only be assigned after explicit qualified clinical review using a documented GRADE-compatible assessment of study limitations, consistency, directness, precision and publication bias. Regulatory authorization is never converted into an efficacy-certainty grade. Conflicting reviewed evidence is surfaced rather than averaged away.',
  true,
  'https://www.gradeworkinggroup.org/',
  '2026-08-14T13:45:00Z'
) on conflict (method_key) do update set
  version = excluded.version,
  title = excluded.title,
  description = excluded.description,
  requires_clinical_review = excluded.requires_clinical_review,
  source_url = excluded.source_url,
  effective_at = excluded.effective_at;

alter table public.clinical_condition_terms
  add column if not exists slug text,
  add column if not exists definition text,
  add column if not exists vocabulary_version text not null default '1.0.0',
  add column if not exists source_system text,
  add column if not exists source_identifier text,
  add column if not exists source_version text,
  add column if not exists deprecated_at timestamptz,
  add column if not exists superseded_by_condition_id uuid references public.clinical_condition_terms(id) on delete set null;

create unique index if not exists uq_clinical_condition_terms_slug
  on public.clinical_condition_terms(slug) where slug is not null;

create table if not exists public.clinical_evidence_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  source_type text not null check (source_type in (
    'regulation','regulatory-guidance','product-monograph','systematic-review','meta-analysis',
    'randomized-trial','observational-study','clinical-guideline','pharmacovigilance','other'
  )),
  title text not null,
  publisher text not null,
  source_url text not null,
  jurisdiction text[] not null default '{}',
  doi text,
  pmid text,
  din text,
  notice_of_compliance_id text,
  source_version text,
  published_on date,
  effective_on date,
  retrieved_at timestamptz not null,
  content_sha256 text,
  currentness text not null default 'current' check (currentness in ('current','superseded','withdrawn','unknown')),
  superseded_by_source_id uuid references public.clinical_evidence_sources(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_evidence_sources_url_https check (source_url ~ '^https://'),
  constraint clinical_evidence_sources_sha256 check (content_sha256 is null or content_sha256 ~ '^[0-9a-f]{64}$')
);

alter table public.clinical_evidence_records
  add column if not exists primary_source_registry_id uuid references public.clinical_evidence_sources(id) on delete set null,
  add column if not exists grading_method_key text references public.clinical_evidence_grading_methods(method_key) on delete set null,
  add column if not exists publication_scope text not null default 'source-metadata'
    check (publication_scope in ('source-metadata','clinical-synthesis'));

create table if not exists public.clinical_condition_evidence_links (
  id uuid primary key default gen_random_uuid(),
  condition_term_id uuid not null references public.clinical_condition_terms(id) on delete cascade,
  evidence_record_id uuid not null references public.clinical_evidence_records(id) on delete cascade,
  relationship text not null check (relationship in ('indication','efficacy','safety','supporting','contradicting','context')),
  applicability text,
  created_at timestamptz not null default now(),
  unique(condition_term_id, evidence_record_id, relationship)
);

create table if not exists public.clinical_evidence_extractions (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid references public.clinical_evidence_records(id) on delete cascade,
  source_id uuid not null references public.clinical_evidence_sources(id) on delete restrict,
  extraction_type text not null check (extraction_type in ('indication','population','intervention','comparator','outcome','safety','limitation','bibliographic','other')),
  extracted_summary text not null,
  source_locator text,
  extraction_method text not null default 'manual-structured',
  extractor_identity text not null,
  extracted_at timestamptz not null,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_evidence_reviews (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid not null references public.clinical_evidence_records(id) on delete cascade,
  review_type text not null check (review_type in ('provenance','clinical','methodology')),
  reviewer_type text not null check (reviewer_type in ('system','analyst','clinician','pharmacist')),
  reviewer_user_id uuid,
  reviewer_identity text not null,
  decision text not null check (decision in ('approved','needs-changes','rejected')),
  grading_method_key text references public.clinical_evidence_grading_methods(method_key) on delete set null,
  assigned_evidence_strength text check (assigned_evidence_strength is null or assigned_evidence_strength in ('high','moderate','low','very-low','ungraded','conflicted')),
  rationale text not null,
  reviewed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_evidence_conflicts (
  id uuid primary key default gen_random_uuid(),
  condition_term_id uuid references public.clinical_condition_terms(id) on delete cascade,
  evidence_record_a_id uuid not null references public.clinical_evidence_records(id) on delete cascade,
  evidence_record_b_id uuid not null references public.clinical_evidence_records(id) on delete cascade,
  conflict_type text not null check (conflict_type in ('direction','magnitude','population','formulation','safety','guideline','regulatory','other')),
  summary text not null,
  materiality text not null default 'medium' check (materiality in ('low','medium','high')),
  resolution_status text not null default 'unresolved' check (resolution_status in ('unresolved','contextualized','resolved','superseded')),
  resolution_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint clinical_evidence_conflict_distinct_records check (evidence_record_a_id <> evidence_record_b_id)
);

create or replace function public.clinical_evidence_has_review_role(allowed_roles text[] default array['admin','operator','analyst'])
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = any(allowed_roles)
  );
$function$;

revoke all on function public.clinical_evidence_has_review_role(text[]) from public;
grant execute on function public.clinical_evidence_has_review_role(text[]) to authenticated, service_role;

alter table public.clinical_evidence_grading_methods enable row level security;
alter table public.clinical_evidence_sources enable row level security;
alter table public.clinical_condition_evidence_links enable row level security;
alter table public.clinical_evidence_extractions enable row level security;
alter table public.clinical_evidence_reviews enable row level security;
alter table public.clinical_evidence_conflicts enable row level security;

create policy clinical_grading_methods_public_read on public.clinical_evidence_grading_methods
  for select to anon, authenticated using (retired_at is null);
create policy clinical_condition_evidence_links_public_read on public.clinical_condition_evidence_links
  for select to anon, authenticated using (
    exists (select 1 from public.clinical_condition_terms c where c.id = condition_term_id and c.review_status = 'published')
    and exists (select 1 from public.clinical_evidence_records e where e.id = evidence_record_id and e.review_status = 'published')
  );

create policy clinical_sources_review_access on public.clinical_evidence_sources
  for all to authenticated using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());
create policy clinical_extractions_review_access on public.clinical_evidence_extractions
  for all to authenticated using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());
create policy clinical_reviews_review_access on public.clinical_evidence_reviews
  for all to authenticated using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());
create policy clinical_conflicts_review_access on public.clinical_evidence_conflicts
  for all to authenticated using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

grant select on public.clinical_evidence_grading_methods to anon, authenticated;
grant select on public.clinical_condition_evidence_links to anon, authenticated;
grant select, insert, update on public.clinical_evidence_sources to authenticated;
grant select, insert, update on public.clinical_evidence_extractions to authenticated;
grant select, insert, update on public.clinical_evidence_reviews to authenticated;
grant select, insert, update on public.clinical_evidence_conflicts to authenticated;
grant all on public.clinical_evidence_grading_methods to service_role;
grant all on public.clinical_evidence_sources to service_role;
grant all on public.clinical_condition_evidence_links to service_role;
grant all on public.clinical_evidence_extractions to service_role;
grant all on public.clinical_evidence_reviews to service_role;
grant all on public.clinical_evidence_conflicts to service_role;

create or replace function public.clinical_require_publication_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.review_status = 'published' and (tg_op = 'INSERT' or old.review_status is distinct from 'published') then
    if not exists (
      select 1 from public.clinical_evidence_reviews r
      where r.evidence_record_id = new.id
        and r.review_type = 'provenance'
        and r.decision = 'approved'
    ) then
      raise exception 'clinical evidence publication requires an approved provenance review';
    end if;

    if new.publication_scope = 'clinical-synthesis' or new.evidence_strength in ('high','moderate','low','very-low','conflicted') then
      if not exists (
        select 1 from public.clinical_evidence_reviews r
        where r.evidence_record_id = new.id
          and r.review_type = 'clinical'
          and r.reviewer_type in ('clinician','pharmacist')
          and r.decision = 'approved'
      ) then
        raise exception 'clinical synthesis or graded certainty requires an approved clinician/pharmacist review';
      end if;
    end if;
  end if;
  return new;
end;
$function$;

revoke all on function public.clinical_require_publication_review() from public;
drop trigger if exists trg_clinical_require_publication_review on public.clinical_evidence_records;
create trigger trg_clinical_require_publication_review
before insert or update of review_status, publication_scope, evidence_strength
on public.clinical_evidence_records
for each row execute function public.clinical_require_publication_review();

insert into public.clinical_evidence_sources (
  source_key, source_type, title, publisher, source_url, jurisdiction, doi, pmid, din,
  notice_of_compliance_id, source_version, published_on, effective_on, retrieved_at, currentness
) values
('ca-epidiolex-pm-2024-10-30','product-monograph','EPIDIOLEX Product Monograph','Jazz Pharmaceuticals Research UK Limited','https://pp.jazzpharma.com/pi/epidiolex.ca.PM-en.pdf',array['Canada'],null,null,'02543079','32096','2024-10-30','2024-10-30','2023-11-15','2026-08-14T13:45:00Z','current'),
('ca-sativex-pm-2019-12-11','product-monograph','SATIVEX Product Monograph','GW Pharma Ltd.','https://pdf.hres.ca/dpd_pm/00054388.PDF',array['Canada'],null,null,'02266121',null,'2019-12-11','2019-12-11',null,'2026-08-14T13:45:00Z','current'),
('pubmed-36417631','meta-analysis','Use of cannabidiol in the treatment of epilepsy: Lennox-Gastaut syndrome, Dravet syndrome, and tuberous sclerosis complex','PubMed / indexed journal article','https://pubmed.ncbi.nlm.nih.gov/36417631/',array['Global'],'10.1016/j.seizure.2022.10.010','36417631',null,null,'2022','2022-11-21',null,'2026-08-14T13:45:00Z','current'),
('pubmed-39502271','meta-analysis','Cannabinoids for spasticity in patients with multiple sclerosis: A systematic review and meta-analysis','PubMed / indexed journal article','https://pubmed.ncbi.nlm.nih.gov/39502271/',array['Global'],'10.1177/20552173241282379','39502271',null,null,'2024','2024-11-05',null,'2026-08-14T13:45:00Z','current')
on conflict (source_key) do update set
  title = excluded.title, publisher = excluded.publisher, source_url = excluded.source_url,
  jurisdiction = excluded.jurisdiction, doi = excluded.doi, pmid = excluded.pmid, din = excluded.din,
  notice_of_compliance_id = excluded.notice_of_compliance_id, source_version = excluded.source_version,
  published_on = excluded.published_on, effective_on = excluded.effective_on,
  retrieved_at = excluded.retrieved_at, currentness = excluded.currentness, updated_at = now();

insert into public.clinical_condition_terms (
  canonical_name, slug, aliases, definition, vocabulary_source, source_url, verified_at,
  review_status, vocabulary_version, source_system, source_identifier, source_version
) values
('Lennox-Gastaut syndrome','lennox-gastaut-syndrome',array['LGS','Lennox Gastaut syndrome'],'Condition label used in the current Canadian EPIDIOLEX authorized indication.','Health Canada-reviewed EPIDIOLEX Product Monograph','https://pp.jazzpharma.com/pi/epidiolex.ca.PM-en.pdf','2026-08-14T13:45:00Z','published','1.0.0','EPIDIOLEX Product Monograph','INDICATION:LGS','2024-10-30'),
('Dravet syndrome','dravet-syndrome',array['DS'],'Condition label used in the current Canadian EPIDIOLEX authorized indication.','Health Canada-reviewed EPIDIOLEX Product Monograph','https://pp.jazzpharma.com/pi/epidiolex.ca.PM-en.pdf','2026-08-14T13:45:00Z','published','1.0.0','EPIDIOLEX Product Monograph','INDICATION:DS','2024-10-30'),
('Tuberous sclerosis complex','tuberous-sclerosis-complex',array['TSC','tuberous sclerosis'],'Condition label used in the current Canadian EPIDIOLEX authorized indication.','Health Canada-reviewed EPIDIOLEX Product Monograph','https://pp.jazzpharma.com/pi/epidiolex.ca.PM-en.pdf','2026-08-14T13:45:00Z','published','1.0.0','EPIDIOLEX Product Monograph','INDICATION:TSC','2024-10-30'),
('Multiple sclerosis spasticity','multiple-sclerosis-spasticity',array['MS spasticity','spasticity in multiple sclerosis','multiple sclerosis'],'Symptom/condition label corresponding to the Canadian SATIVEX indication for symptomatic relief of spasticity in multiple sclerosis.','Health Canada Drug Product Database / SATIVEX Product Monograph','https://pdf.hres.ca/dpd_pm/00054388.PDF','2026-08-14T13:45:00Z','published','1.0.0','SATIVEX Product Monograph','INDICATION:MS-SPASTICITY','2019-12-11')
on conflict (canonical_name) do update set
  slug = excluded.slug, aliases = excluded.aliases, definition = excluded.definition,
  vocabulary_source = excluded.vocabulary_source, source_url = excluded.source_url,
  verified_at = excluded.verified_at, review_status = excluded.review_status,
  vocabulary_version = excluded.vocabulary_version, source_system = excluded.source_system,
  source_identifier = excluded.source_identifier, source_version = excluded.source_version, updated_at = now();

-- Public product-monograph condition records are inserted under review, receive provenance-only review,
-- then publish through the trigger. No clinical certainty grade or independent efficacy conclusion is assigned.
with source_rows as (
  select source_key, id, title, publisher, source_url, published_on, effective_on
  from public.clinical_evidence_sources
  where source_key in ('ca-epidiolex-pm-2024-10-30','ca-sativex-pm-2019-12-11')
), corpus as (
  select * from (values
    ('ca-epidiolex-lgs-indication','EPIDIOLEX authorized indication — Lennox-Gastaut syndrome','The Canadian product monograph identifies EPIDIOLEX as adjunctive therapy for seizures associated with Lennox-Gastaut syndrome in patients 2 years of age and older. This is regulatory product-indication metadata, not an independent Harbourview efficacy recommendation.','lennox-gastaut-syndrome','Patients 2 years of age and older with seizures associated with Lennox-Gastaut syndrome','Cannabidiol (EPIDIOLEX)','Oral solution 100 mg/mL',array['CBD']::text[],'Authorized indication metadata; no comparative conclusion is asserted.','Product-monograph authorization does not establish comparative superiority or substitute for patient-specific clinical judgment.','ca-epidiolex-pm-2024-10-30'),
    ('ca-epidiolex-dravet-indication','EPIDIOLEX authorized indication — Dravet syndrome','The Canadian product monograph identifies EPIDIOLEX as adjunctive therapy for seizures associated with Dravet syndrome in patients 2 years of age and older. This is regulatory product-indication metadata, not an independent Harbourview efficacy recommendation.','dravet-syndrome','Patients 2 years of age and older with seizures associated with Dravet syndrome','Cannabidiol (EPIDIOLEX)','Oral solution 100 mg/mL',array['CBD']::text[],'Authorized indication metadata; no comparative conclusion is asserted.','Product-monograph authorization does not establish comparative superiority or substitute for patient-specific clinical judgment.','ca-epidiolex-pm-2024-10-30'),
    ('ca-epidiolex-tsc-indication','EPIDIOLEX authorized indication — tuberous sclerosis complex','The Canadian product monograph identifies EPIDIOLEX as adjunctive therapy for seizures associated with tuberous sclerosis complex in patients 2 years of age and older. This is regulatory product-indication metadata, not an independent Harbourview efficacy recommendation.','tuberous-sclerosis-complex','Patients 2 years of age and older with seizures associated with tuberous sclerosis complex','Cannabidiol (EPIDIOLEX)','Oral solution 100 mg/mL',array['CBD']::text[],'Authorized indication metadata; no comparative conclusion is asserted.','Product-monograph authorization does not establish comparative superiority or substitute for patient-specific clinical judgment.','ca-epidiolex-pm-2024-10-30'),
    ('ca-sativex-ms-spasticity-indication','SATIVEX authorized indication — multiple sclerosis spasticity','The Canadian product monograph identifies SATIVEX as adjunctive treatment for symptomatic relief of spasticity in patients with multiple sclerosis who have not responded adequately to other therapy and who demonstrate meaningful improvement during an initial trial. This is regulatory product-indication metadata, not an independent Harbourview efficacy recommendation.','multiple-sclerosis-spasticity','Patients with multiple sclerosis spasticity inadequately responsive to other therapy who demonstrate meaningful improvement during an initial trial','Nabiximols (SATIVEX)','Buccal spray',array['THC','CBD']::text[],'Authorized indication metadata; no comparative conclusion is asserted.','The indication is response-enriched and must not be generalized to all multiple sclerosis patients or to unregulated cannabis products.','ca-sativex-pm-2019-12-11')
  ) as x(slug,title,summary,condition_slug,population,intervention,formulation,cannabinoids,outcome,uncertainty,source_key)
)
insert into public.clinical_evidence_records (
  slug,title,summary,condition_term_id,condition_label,condition_aliases,population,intervention,formulation,cannabinoids,
  intervention_class,comparator,outcome,evidence_type,evidence_strength,evidence_strength_method,uncertainty,conflict_status,
  jurisdictions,profession_relevance,primary_source_title,primary_source_publisher,primary_source_url,primary_source_id,
  publication_date,effective_date,verified_at,supersession_state,review_status,primary_source_registry_id,grading_method_key,publication_scope
)
select x.slug,x.title,x.summary,c.id,c.canonical_name,c.aliases,x.population,x.intervention,x.formulation,x.cannabinoids,
  'regulated-cannabinoid-drug',null,x.outcome,'product-monograph','ungraded',
  'Regulatory indication record; Harbourview Clinical Evidence V1 does not convert authorization into a clinical certainty grade.',
  x.uncertainty,'none',array['Canada'],array['doctor','nurse_practitioner','pharmacist','other'],
  s.title,s.publisher,s.source_url,s.source_key,s.published_on,s.effective_on,'2026-08-14T13:45:00Z','current','under-review',s.id,
  'harbourview-clinical-evidence-v1','source-metadata'
from corpus x
join public.clinical_condition_terms c on c.slug = x.condition_slug
join source_rows s on s.source_key = x.source_key
on conflict (slug) do update set
  title=excluded.title,summary=excluded.summary,condition_term_id=excluded.condition_term_id,condition_label=excluded.condition_label,
  condition_aliases=excluded.condition_aliases,population=excluded.population,intervention=excluded.intervention,formulation=excluded.formulation,
  cannabinoids=excluded.cannabinoids,intervention_class=excluded.intervention_class,outcome=excluded.outcome,evidence_type=excluded.evidence_type,
  evidence_strength=excluded.evidence_strength,evidence_strength_method=excluded.evidence_strength_method,uncertainty=excluded.uncertainty,
  primary_source_title=excluded.primary_source_title,primary_source_publisher=excluded.primary_source_publisher,
  primary_source_url=excluded.primary_source_url,primary_source_id=excluded.primary_source_id,publication_date=excluded.publication_date,
  effective_date=excluded.effective_date,verified_at=excluded.verified_at,primary_source_registry_id=excluded.primary_source_registry_id,
  grading_method_key=excluded.grading_method_key,publication_scope=excluded.publication_scope,updated_at=now();

insert into public.clinical_evidence_reviews (
  evidence_record_id,review_type,reviewer_type,reviewer_identity,decision,grading_method_key,assigned_evidence_strength,rationale,reviewed_at
)
select r.id,'provenance','system','migration:20260814134500','approved','harbourview-clinical-evidence-v1','ungraded',
  'Verified that the public summary is limited to cited Canadian product-monograph indication metadata and does not assert an independent efficacy grade, dosing recommendation, interaction claim or profession rule.',
  '2026-08-14T13:45:00Z'
from public.clinical_evidence_records r
where r.slug in ('ca-epidiolex-lgs-indication','ca-epidiolex-dravet-indication','ca-epidiolex-tsc-indication','ca-sativex-ms-spasticity-indication')
  and not exists (
    select 1 from public.clinical_evidence_reviews x
    where x.evidence_record_id=r.id and x.review_type='provenance' and x.reviewer_identity='migration:20260814134500'
  );

update public.clinical_evidence_records
set review_status='published', updated_at=now()
where slug in ('ca-epidiolex-lgs-indication','ca-epidiolex-dravet-indication','ca-epidiolex-tsc-indication','ca-sativex-ms-spasticity-indication')
  and review_status <> 'published';

insert into public.clinical_condition_evidence_links (condition_term_id,evidence_record_id,relationship,applicability)
select c.id,r.id,'indication','Canadian regulated-drug product indication only; not general cannabis or cultivar evidence.'
from public.clinical_evidence_records r
join public.clinical_condition_terms c on c.id=r.condition_term_id
where r.slug in ('ca-epidiolex-lgs-indication','ca-epidiolex-dravet-indication','ca-epidiolex-tsc-indication','ca-sativex-ms-spasticity-indication')
on conflict do nothing;

-- High-quality systematic-review metadata is staged privately. Publication is blocked until qualified clinical review.
with staged as (
  select * from (values
    ('review-cbd-lgs-ds-tsc-2022','Systematic-review evidence staged for LGS, Dravet syndrome and TSC','Lennox-Gastaut syndrome / Dravet syndrome / tuberous sclerosis complex',array['LGS','DS','TSC']::text[],'Children and adults with inadequately controlled seizures in LGS, DS or TSC as included by the review','Adjunctive purified cannabidiol','Oral cannabidiol formulations',array['CBD']::text[],'Seizure-frequency, responder, adverse-event and tolerability outcomes reported by the review','Review-level results require independent clinical appraisal for risk of bias, directness and applicability before Harbourview assigns certainty.','pubmed-36417631'),
    ('review-nabiximols-ms-spasticity-2024','Systematic-review evidence staged for multiple sclerosis spasticity','Multiple sclerosis spasticity',array['MS spasticity','spasticity in multiple sclerosis']::text[],'People with multiple sclerosis and spasticity in studies included by the review','Cannabinoids, predominantly nabiximols','Multiple formulations represented in the review',array['THC','CBD']::text[],'Spasticity outcomes reported by the review/meta-analysis','High heterogeneity and formulation/population differences require clinical appraisal before a Harbourview certainty grade or generalized conclusion.','pubmed-39502271')
  ) as x(slug,summary,condition_label,aliases,population,intervention,formulation,cannabinoids,outcome,uncertainty,source_key)
)
insert into public.clinical_evidence_records (
  slug,title,summary,condition_label,condition_aliases,population,intervention,formulation,cannabinoids,intervention_class,
  comparator,outcome,evidence_type,evidence_strength,evidence_strength_method,uncertainty,conflict_status,jurisdictions,profession_relevance,
  primary_source_title,primary_source_publisher,primary_source_url,primary_source_id,publication_date,verified_at,supersession_state,
  review_status,primary_source_registry_id,grading_method_key,publication_scope
)
select x.slug,s.title,x.summary,x.condition_label,x.aliases,x.population,x.intervention,x.formulation,x.cannabinoids,'regulated-cannabinoid-drug',
  'Placebo / control groups as defined by included trials',x.outcome,'meta-analysis','ungraded',
  'Staged for qualified clinical GRADE-compatible review under Harbourview Clinical Evidence V1 before any synthesized certainty statement may be published.',
  x.uncertainty,'none',array['Global'],array['doctor','nurse_practitioner','pharmacist','other'],
  s.title,s.publisher,s.source_url,s.source_key,s.published_on,'2026-08-14T13:45:00Z','current','under-review',s.id,
  'harbourview-clinical-evidence-v1','clinical-synthesis'
from staged x
join public.clinical_evidence_sources s on s.source_key=x.source_key
on conflict (slug) do update set
  title=excluded.title,summary=excluded.summary,condition_label=excluded.condition_label,condition_aliases=excluded.condition_aliases,
  population=excluded.population,intervention=excluded.intervention,formulation=excluded.formulation,cannabinoids=excluded.cannabinoids,
  intervention_class=excluded.intervention_class,comparator=excluded.comparator,outcome=excluded.outcome,evidence_type=excluded.evidence_type,
  evidence_strength=excluded.evidence_strength,evidence_strength_method=excluded.evidence_strength_method,uncertainty=excluded.uncertainty,
  primary_source_title=excluded.primary_source_title,primary_source_publisher=excluded.primary_source_publisher,
  primary_source_url=excluded.primary_source_url,primary_source_id=excluded.primary_source_id,publication_date=excluded.publication_date,
  verified_at=excluded.verified_at,primary_source_registry_id=excluded.primary_source_registry_id,grading_method_key=excluded.grading_method_key,
  publication_scope=excluded.publication_scope,review_status='under-review',updated_at=now();

insert into public.clinical_evidence_extractions (
  evidence_record_id,source_id,extraction_type,extracted_summary,source_locator,extraction_method,extractor_identity,extracted_at,verification_status
)
select r.id,s.id,'bibliographic','Bibliographic and abstract-level source metadata captured for clinical review; no public efficacy synthesis approved.',
  case when s.pmid is not null then 'PubMed PMID ' || s.pmid else s.source_version end,
  'manual-structured','migration:20260814134500','2026-08-14T13:45:00Z','verified'
from public.clinical_evidence_records r
join public.clinical_evidence_sources s on s.id=r.primary_source_registry_id
where r.slug in ('review-cbd-lgs-ds-tsc-2022','review-nabiximols-ms-spasticity-2024')
  and not exists (
    select 1 from public.clinical_evidence_extractions x
    where x.evidence_record_id=r.id and x.source_id=s.id and x.extraction_type='bibliographic'
  );

insert into public.clinical_evidence_change_events (
  evidence_record_id,event_type,title,summary,materiality,jurisdictions,profession_relevance,occurred_at,verified_at,
  primary_source_title,primary_source_publisher,primary_source_url,primary_source_id,review_status
)
select r.id,'published','Regulated cannabinoid medicine indication added to Clinical Evidence V1',
  'A Canadian regulated-drug indication record was added with explicit product-monograph provenance and ungraded certainty; it does not generalize to cannabis products or genetics.',
  'medium',array['Canada'],r.profession_relevance,'2026-08-14T13:45:00Z','2026-08-14T13:45:00Z',
  r.primary_source_title,r.primary_source_publisher,r.primary_source_url,r.primary_source_id,'published'
from public.clinical_evidence_records r
where r.slug in ('ca-epidiolex-lgs-indication','ca-epidiolex-dravet-indication','ca-epidiolex-tsc-indication','ca-sativex-ms-spasticity-indication')
  and not exists (
    select 1 from public.clinical_evidence_change_events e
    where e.evidence_record_id=r.id and e.event_type='published' and e.occurred_at='2026-08-14T13:45:00Z'
  );

comment on table public.clinical_evidence_sources is 'Private normalized source registry for Clinical evidence provenance. Public rendering uses reviewed projection fields on clinical_evidence_records.';
comment on table public.clinical_evidence_extractions is 'Private extraction provenance. Never expose raw extraction/review work through public Clinical DTOs.';
comment on table public.clinical_evidence_reviews is 'Private governed review decisions. Clinical synthesis or graded certainty requires approved clinician/pharmacist review.';
comment on table public.clinical_evidence_conflicts is 'Private contradiction workbench. Public records expose only reviewed safe conflict status.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260814134500','clinical_evidence_v1_governance','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260814134500_clinical_evidence_v1_governance.sql

-- RECOVERY BEGIN 20260814135500_clinical_evidence_v1_source_reconciliation.sql
-- Reconcile Clinical Evidence V1 source metadata against current authoritative records.
-- No production migration has been applied; this remains part of the PR migration set.

-- PMID 36417631 resolves to DOI 10.1590/1806-9282.2022D689.
update public.clinical_evidence_sources
set doi = '10.1590/1806-9282.2022D689',
    updated_at = now()
where source_key = 'pubmed-36417631';

-- Health Canada's current DPD shows SATIVEX marketed with a newer product monograph
-- dated 2024-12-17. The normalized 2019 PDF remains useful historical provenance but
-- must not be represented as the current source for a public indication record.
update public.clinical_evidence_sources
set currentness = 'superseded',
    updated_at = now()
where source_key = 'ca-sativex-pm-2019-12-11';

insert into public.clinical_evidence_sources (
  source_key, source_type, title, publisher, source_url, jurisdiction, din,
  source_version, published_on, retrieved_at, currentness
) values (
  'ca-sativex-dpd-2024-12-17',
  'regulatory-guidance',
  'SATIVEX — current Drug Product Database record',
  'Health Canada',
  'https://health-products.canada.ca/dpd-bdpp/info.do?code=75157&lang=en',
  array['Canada'],
  '02266121',
  'DPD status / product-monograph date 2024-12-17',
  '2024-12-17',
  '2026-08-14T13:55:00Z',
  'current'
)
on conflict (source_key) do update set
  title = excluded.title,
  publisher = excluded.publisher,
  source_url = excluded.source_url,
  jurisdiction = excluded.jurisdiction,
  din = excluded.din,
  source_version = excluded.source_version,
  published_on = excluded.published_on,
  retrieved_at = excluded.retrieved_at,
  currentness = excluded.currentness,
  updated_at = now();

update public.clinical_evidence_sources old_source
set superseded_by_source_id = current_source.id,
    updated_at = now()
from public.clinical_evidence_sources current_source
where old_source.source_key = 'ca-sativex-pm-2019-12-11'
  and current_source.source_key = 'ca-sativex-dpd-2024-12-17';

-- The current DPD record confirms marketed status, dosage form, route and ingredients,
-- but this migration has not independently extracted the indication text from the new
-- 2024-12-17 monograph. Fail closed: retire the public 2019-derived indication projection
-- until the current monograph is captured and reviewed.
update public.clinical_evidence_records
set review_status = 'under-review',
    supersession_state = 'superseded',
    superseded_by_id = null,
    uncertainty = 'Historical 2019 product-monograph indication metadata is retained privately. Health Canada lists a newer SATIVEX product monograph dated 2024-12-17; current indication text must be captured and provenance-reviewed before republication.',
    updated_at = now()
where slug = 'ca-sativex-ms-spasticity-indication';

update public.clinical_condition_terms
set review_status = 'under_review',
    deprecated_at = '2026-08-14T13:55:00Z',
    verified_at = '2026-08-14T13:55:00Z',
    definition = 'Historical SATIVEX multiple-sclerosis-spasticity condition label retained pending extraction and review of the current 2024-12-17 Canadian product monograph.',
    updated_at = now()
where slug = 'multiple-sclerosis-spasticity';

-- Remove the now-invalid public change announcement rather than claim that the historical
-- SATIVEX indication record is current. The private record and source lineage remain intact.
delete from public.clinical_evidence_change_events
where evidence_record_id = (
  select id from public.clinical_evidence_records where slug = 'ca-sativex-ms-spasticity-indication'
)
  and event_type = 'published'
  and occurred_at = '2026-08-14T13:45:00Z';

comment on table public.clinical_evidence_sources is
  'Private normalized source registry. Supersession/currentness must be reconciled before a source-backed public Clinical projection is published.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260814135500','clinical_evidence_v1_source_reconciliation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260814135500_clinical_evidence_v1_source_reconciliation.sql

-- RECOVERY BEGIN 20260814143000_fix_hv_dedup_assign_search_path.sql
-- Repair public.hv_dedup_assign: the pinned search_path cannot resolve pgvector.
--
-- THE DEFECT
--
-- The function is SECURITY DEFINER with `set search_path to 'public'`. pgvector
-- is installed in the `extensions` schema on this project, and the `<=>` cosine
-- distance operator lives there and nowhere else. An unqualified `<=>` inside
-- the body therefore cannot resolve, and every call fails with SQLSTATE 42883.
--
-- Verified read-only against production on 2026-08-14 rather than inferred:
--
--   vector extension schema ......................... extensions
--   <=> operator schema ............................. extensions
--   <=> operators in public ......................... 0
--   live hv_dedup_assign proconfig .................. search_path=public
--   to_regoperator('<=>(extensions.vector,extensions.vector)')
--     evaluated under search_path=public ............ NULL  (unresolvable)
--     evaluated schema-qualified .................... non-null
--
-- Checked whether this is a class or a one-off: hv_dedup_assign is the ONLY
-- function in the database with a pinned search_path that omits `extensions`
-- while referencing pgvector operators or types. Every other pinned function is
-- unaffected. This migration is deliberately narrow for that reason.
--
-- WHY A NEW VERSION RATHER THAN EDITING 20260802073000
--
-- The defect originates in 20260802073000, and the obvious repair is to edit
-- that file. It does not work. That version was applied to production on
-- 2026-08-14 and is recorded in supabase_migrations.schema_migrations, so
-- `supabase db push` skips it forever -- an in-place edit would be verified by
-- a local `db reset` (which replays from scratch and does pick it up) while
-- never reaching production. The fix has to be a forward migration.
--
-- Credit where due: #1420 identified this defect and its correct remedy. Its
-- delivery mechanism is the in-place edit described above, which is why this
-- exists separately. Its accompanying release-closure migration hardens
-- hv_truncate_at_word_boundary, not this function.
--
-- WHY NOT JUST ADD `extensions` TO THE SEARCH PATH AND STOP THINKING
--
-- pg_catalog is listed first and explicitly. For a SECURITY DEFINER function
-- that is the part that matters: it prevents a caller-controlled schema earlier
-- in the path from shadowing a built-in. `public` and `extensions` follow
-- because the body genuinely needs both -- public.signals and the pgvector
-- operator respectively. The path stays narrow; no caller privilege is widened.
--
-- The body below is otherwise byte-for-byte the definition from 20260802073000.
-- Only the `set search_path` clause and the comment change.

create or replace function public.hv_dedup_assign(
  p_tau double precision default 0.90,
  p_scope_days integer default 120
)
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions'
as $function$
declare
  n int;
  c_batch constant int := 400;
  c_neighbours constant int := 25;
begin
  p_scope_days := least(greatest(coalesce(p_scope_days, 120), 1), 400);
  p_tau        := least(greatest(coalesce(p_tau, 0.90), 0.5), 0.999);

  with targets as (
    select a.id, a.embedding_1024, a.created_at,
           coalesce(a.quality_confidence, 0) as qc
    from public.signals a
    where a.embedding_1024 is not null
      and a.created_at > now() - (p_scope_days || ' days')::interval
      and a.cluster_rep_id is null
    order by a.created_at desc
    limit c_batch
  ),
  scored as (
    select
      t.id,
      (
        select nb.id
        from (
          -- Index probe: nearest c_neighbours by cosine distance. The threshold
          -- is applied outside this subquery, never as a WHERE on the distance.
          select b.id,
                 b.created_at,
                 coalesce(b.quality_confidence, 0) as qc,
                 1 - (t.embedding_1024 <=> b.embedding_1024) as sim
          from public.signals b
          where b.embedding_1024 is not null
            and b.id <> t.id
          order by t.embedding_1024 <=> b.embedding_1024
          limit c_neighbours
        ) nb
        where nb.sim >= p_tau
          and nb.created_at > now() - (p_scope_days || ' days')::interval
          -- Deterministic representative choice: higher confidence wins, then
          -- earlier, then lowest id. Without the final id tiebreak two rows can
          -- each name the other as better and neither becomes representative.
          and (
                nb.qc > t.qc
             or (nb.qc = t.qc and nb.created_at < t.created_at)
             or (nb.qc = t.qc and nb.created_at = t.created_at and nb.id < t.id)
          )
        order by nb.sim desc
        limit 1
      ) as better_id
    from targets t
  )
  update public.signals a
     set is_representative = (s.better_id is null),
         cluster_rep_id    = coalesce(s.better_id, a.id)
    from scored s
   where a.id = s.id;

  get diagnostics n = row_count;
  return n;
end
$function$;

-- Least-privilege is preserved exactly as 20260802163000 left it: browser roles
-- hold no EXECUTE on this function. CREATE OR REPLACE does not reset privileges,
-- so these are reasserted only to keep the intent visible next to the function,
-- not because the replace would have dropped them.
revoke all privileges on function public.hv_dedup_assign(double precision, integer)
  from PUBLIC, anon, authenticated;
grant execute on function public.hv_dedup_assign(double precision, integer)
  to service_role;

comment on function public.hv_dedup_assign(double precision, integer) is
  'Assigns cluster representatives over signals.embedding_1024. Uses the HNSW index via '
  'ORDER BY <=> LIMIT c_neighbours and applies p_tau to those neighbours -- a WHERE clause on '
  'the distance cannot use the index and made this function time out at 120s. SECURITY DEFINER '
  'search_path is pg_catalog, public, extensions: pgvector lives in extensions, so a path of '
  'public alone made the unqualified <=> unresolvable (42883) and every call fail. '
  'Service-role only; browser roles have no EXECUTE.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260814143000','fix_hv_dedup_assign_search_path','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260814143000_fix_hv_dedup_assign_search_path.sql
