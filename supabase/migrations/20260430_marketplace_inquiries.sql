-- Harbourview Marketplace V1 inquiry capture
-- Safe to apply after existing marketplace/listings migrations.

create table if not exists public.marketplace_inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_slug text not null,
  listing_title text not null,
  source_url text,
  name text not null,
  email text not null,
  company text not null,
  country text not null,
  phone text,
  inquiry_type text not null default 'listing_verification',
  message text not null,
  consent boolean not null default false,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_inquiries_status_check check (status in ('new', 'reviewing', 'qualified', 'disqualified', 'responded', 'closed')),
  constraint marketplace_inquiries_type_check check (inquiry_type in ('listing_verification', 'seller_contact', 'quote_routing', 'similar_equipment', 'sourcing_mandate'))
);

alter table public.marketplace_inquiries enable row level security;

drop policy if exists "Public can create marketplace inquiries" on public.marketplace_inquiries;
create policy "Public can create marketplace inquiries"
  on public.marketplace_inquiries
  for insert
  with check (consent = true);

drop policy if exists "Authenticated users can read marketplace inquiries" on public.marketplace_inquiries;
create policy "Authenticated users can read marketplace inquiries"
  on public.marketplace_inquiries
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update marketplace inquiries" on public.marketplace_inquiries;
create policy "Authenticated users can update marketplace inquiries"
  on public.marketplace_inquiries
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create index if not exists marketplace_inquiries_status_idx
  on public.marketplace_inquiries (status, created_at desc);

create index if not exists marketplace_inquiries_listing_slug_idx
  on public.marketplace_inquiries (listing_slug, created_at desc);
