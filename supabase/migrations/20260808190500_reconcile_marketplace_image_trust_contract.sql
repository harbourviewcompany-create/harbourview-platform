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
