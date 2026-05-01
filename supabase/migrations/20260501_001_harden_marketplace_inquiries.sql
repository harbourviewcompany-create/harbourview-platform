-- Gate 7: Harden Harbourview marketplace inquiry capture
-- This migration assumes public.marketplace_inquiries already exists in production with:
-- contact_name, contact_email, contact_company, contact_phone, inquiry_type, message,
-- listing_id, buyer_request_id, status inquiry_status, internal_notes, created_at and updated_at.
-- It does not create or alter columns, avoiding a second schema shape.

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
    length(trim(contact_name)) > 0
    and length(trim(contact_email)) > 0
    and contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and length(trim(message)) > 0
    and length(message) <= 2500
    and status = 'received'::public.inquiry_status
    and internal_notes is null
  );

create index if not exists marketplace_inquiries_status_idx
  on public.marketplace_inquiries (status, created_at desc);

create index if not exists marketplace_inquiries_listing_id_idx
  on public.marketplace_inquiries (listing_id, created_at desc);

create index if not exists marketplace_inquiries_buyer_request_id_idx
  on public.marketplace_inquiries (buyer_request_id, created_at desc);

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
