do $$
begin
  create type marketplace_image_class as enum (
    'REAL_ITEM_EVIDENCE',
    'MANUFACTURER_CATALOGUE',
    'HARBOURVIEW_ILLUSTRATIVE',
    'ADMIN_PRIVATE_EVIDENCE'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type marketplace_image_role as enum (
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
  create type marketplace_image_review_status as enum (
    'UPLOADED',
    'PROCESSING',
    'NEEDS_REVIEW',
    'APPROVED_PUBLIC',
    'APPROVED_PRIVATE_ONLY',
    'REJECTED',
    'REPLACED'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type marketplace_image_rights_status as enum (
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
  create type marketplace_image_source_type as enum (
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

create table if not exists public.marketplace_item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  image_class marketplace_image_class not null,
  image_role marketplace_image_role not null default 'GALLERY',
  review_status marketplace_image_review_status not null default 'UPLOADED',
  rights_status marketplace_image_rights_status not null default 'UNKNOWN',
  source_type marketplace_image_source_type not null default 'UNKNOWN',
  source_name text,
  source_url text,
  source_reference text,
  original_storage_bucket text,
  original_storage_path text,
  edited_storage_bucket text,
  edited_storage_path text,
  public_storage_bucket text,
  public_storage_path text,
  public_url text,
  thumbnail_url text,
  hero_url text,
  gallery_url text,
  social_url text,
  alt_text text,
  caption text,
  is_evidence_image boolean not null default false,
  is_illustrative boolean not null default false,
  adobe_edit_summary text,
  content_credentials_status text,
  content_credentials_reference text,
  width integer,
  height integer,
  file_mime_type text,
  file_size_bytes bigint,
  checksum_sha256 text,
  rejection_reason text,
  replaced_by_image_id uuid references public.marketplace_item_images(id) on delete set null,
  uploaded_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.marketplace_item_images is 'Harbourview marketplace image trust layer. item_id maps to the published marketplace listing/item UUID exposed by marketplace_public_listings_v1; no speculative FK is added until the canonical backing table is verified.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_item_images_public_requires_approved'
      and conrelid = 'public.marketplace_item_images'::regclass
  ) then
    alter table public.marketplace_item_images
      add constraint marketplace_item_images_public_requires_approved
      check (public_url is null or review_status = 'APPROVED_PUBLIC');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_item_images_unknown_rights_not_public'
      and conrelid = 'public.marketplace_item_images'::regclass
  ) then
    alter table public.marketplace_item_images
      add constraint marketplace_item_images_unknown_rights_not_public
      check (rights_status <> 'UNKNOWN' or public_url is null);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_item_images_admin_private_not_public'
      and conrelid = 'public.marketplace_item_images'::regclass
  ) then
    alter table public.marketplace_item_images
      add constraint marketplace_item_images_admin_private_not_public
      check (image_class <> 'ADMIN_PRIVATE_EVIDENCE' or public_url is null);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_item_images_illustrative_flag_consistent'
      and conrelid = 'public.marketplace_item_images'::regclass
  ) then
    alter table public.marketplace_item_images
      add constraint marketplace_item_images_illustrative_flag_consistent
      check ((image_class = 'HARBOURVIEW_ILLUSTRATIVE' and is_illustrative = true) or image_class <> 'HARBOURVIEW_ILLUSTRATIVE');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_item_images_evidence_flag_consistent'
      and conrelid = 'public.marketplace_item_images'::regclass
  ) then
    alter table public.marketplace_item_images
      add constraint marketplace_item_images_evidence_flag_consistent
      check ((image_class = 'REAL_ITEM_EVIDENCE' and is_evidence_image = true) or image_class <> 'REAL_ITEM_EVIDENCE');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_item_images_adobe_summary_required'
      and conrelid = 'public.marketplace_item_images'::regclass
  ) then
    alter table public.marketplace_item_images
      add constraint marketplace_item_images_adobe_summary_required
      check (edited_storage_path is null or nullif(trim(adobe_edit_summary), '') is not null);
  end if;
end $$;

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

create or replace function public.set_marketplace_item_images_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_marketplace_item_images_updated_at on public.marketplace_item_images;

create trigger trg_marketplace_item_images_updated_at
before update on public.marketplace_item_images
for each row
execute function public.set_marketplace_item_images_updated_at();

create or replace function public.is_harbourview_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('admin', 'operator')
  );
$$;

alter table public.marketplace_item_images enable row level security;

insert into storage.buckets (id, name, public)
values
  ('marketplace-item-originals', 'marketplace-item-originals', false),
  ('marketplace-item-working', 'marketplace-item-working', false),
  ('marketplace-item-public', 'marketplace-item-public', true)
on conflict (id) do nothing;

do $$
begin
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
    review_status = 'APPROVED_PUBLIC'
    and rights_status <> 'UNKNOWN'
    and image_class <> 'ADMIN_PRIVATE_EVIDENCE'
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
end $$;

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
