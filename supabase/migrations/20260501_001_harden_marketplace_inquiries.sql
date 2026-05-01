-- Gate 7: Harden Harbourview marketplace inquiry capture
-- This migration keeps public inquiry creation open while preventing public reads, updates and deletes.

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

revoke all on public.marketplace_inquiries from anon;
revoke all on public.marketplace_inquiries from authenticated;
grant insert on public.marketplace_inquiries to anon;

drop policy if exists "Public can create marketplace inquiries" on public.marketplace_inquiries;
drop policy if exists "Authenticated users can read marketplace inquiries" on public.marketplace_inquiries;
drop policy if exists "Authenticated users can update marketplace inquiries" on public.marketplace_inquiries;

create policy "Public can create marketplace inquiries"
  on public.marketplace_inquiries
  for insert
  to anon
  with check (
    consent = true
    and length(trim(name)) > 0
    and length(trim(email)) > 0
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and length(trim(company)) > 0
    and length(trim(country)) > 0
    and length(trim(message)) > 0
    and length(message) <= 2500
  );

create index if not exists marketplace_inquiries_status_idx
  on public.marketplace_inquiries (status, created_at desc);

create index if not exists marketplace_inquiries_listing_slug_idx
  on public.marketplace_inquiries (listing_slug, created_at desc);

create or replace function public.set_marketplace_inquiries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_marketplace_inquiries_updated_at on public.marketplace_inquiries;
create trigger trg_marketplace_inquiries_updated_at
  before update on public.marketplace_inquiries
  for each row
  execute function public.set_marketplace_inquiries_updated_at();
