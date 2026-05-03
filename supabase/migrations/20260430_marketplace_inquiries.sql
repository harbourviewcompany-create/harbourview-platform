-- Harbourview Marketplace V1 inquiry capture
-- Safe to apply after existing marketplace/listings migrations.
-- Aligned with the production marketplace_inquiries table shape.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'inquiry_status'
      and n.nspname = 'public'
  ) then
    create type public.inquiry_status as enum ('received', 'reviewing', 'matched', 'closed');
  end if;
end $$;

create table if not exists public.marketplace_inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid,
  buyer_request_id uuid,
  inquiry_type text not null default 'general',
  message text not null,
  contact_name text not null,
  contact_email text not null,
  contact_company text,
  contact_phone text,
  status public.inquiry_status not null default 'received',
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.marketplace_inquiries enable row level security;

revoke all on public.marketplace_inquiries from anon;
revoke all on public.marketplace_inquiries from authenticated;
grant insert on public.marketplace_inquiries to anon;

drop policy if exists "Public can create marketplace inquiries" on public.marketplace_inquiries;
create policy "Public can create marketplace inquiries"
  on public.marketplace_inquiries
  for insert
  to anon
  with check (
    length(trim(contact_name)) > 0
    and length(trim(contact_email)) > 0
    and contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and length(trim(message)) > 0
    and length(message) <= 2500
    and status = 'received'::public.inquiry_status
    and internal_notes is null
  );

drop policy if exists "Authenticated users can read marketplace inquiries" on public.marketplace_inquiries;
drop policy if exists "Authenticated users can update marketplace inquiries" on public.marketplace_inquiries;

create index if not exists marketplace_inquiries_status_idx
  on public.marketplace_inquiries (status, created_at desc);

create index if not exists marketplace_inquiries_listing_id_idx
  on public.marketplace_inquiries (listing_id, created_at desc);

create index if not exists marketplace_inquiries_buyer_request_id_idx
  on public.marketplace_inquiries (buyer_request_id, created_at desc);
