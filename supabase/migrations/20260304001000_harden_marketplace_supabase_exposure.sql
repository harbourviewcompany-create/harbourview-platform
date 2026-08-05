revoke execute on function public.smoke_verify_marketplace_inquiry(text, text, text) from anon, authenticated;
revoke execute on function public.smoke_close_marketplace_inquiry(text, text, text) from anon, authenticated;

create or replace view public.marketplace_listings_public_view
with (security_invoker = true)
as
select
  id,
  marketplace_section as section,
  title,
  coalesce(
    slug,
    lower(regexp_replace(title, '[^a-zA-Z0-9]+'::text, '-'::text, 'g'::text)) || '-'::text || left(id::text, 8)
  ) as slug,
  description,
  price_amount,
  price_currency,
  location_country,
  is_featured,
  condition,
  brand,
  model,
  quantity,
  unit,
  created_at
from public.listings
where status = 'approved'::public.listing_status
  and public_visibility = true
  and archived_at is null;

-- Production had the matching and disclosure workflow relations out of band at
-- this point. Zero-state replay restores them at their first recoverable canonical
-- version after marketplace_inquiries exists, so apply these two hardening deltas
-- only when the relations are already present. Their replay migrations repeat the
-- same private-table contracts when they create the relations later.
do $harden_optional_matching_relations$
begin
  if to_regclass('public.disclosure_requests') is not null then
    execute 'create index if not exists idx_disclosure_requests_match_id on public.disclosure_requests(match_id)';
    comment on table public.disclosure_requests is
      'Server-only disclosure workflow table. RLS intentionally has no client policies; access must go through trusted server paths.';
  end if;

  if to_regclass('public.matches') is not null then
    execute 'create index if not exists idx_matches_inquiry_id on public.matches(inquiry_id)';
    comment on table public.matches is
      'Server-only matching workflow table. RLS intentionally has no client policies; access must go through trusted server paths.';
  end if;
end
$harden_optional_matching_relations$;

create index if not exists idx_listings_superseded_by on public.listings(superseded_by);
create index if not exists idx_user_roles_created_by on public.user_roles(created_by);

drop policy if exists user_roles_self_read on public.user_roles;
create policy user_roles_self_read
  on public.user_roles
  for select
  to authenticated
  using (user_id = (select auth.uid()));

comment on table public.audit_events is 'Server-only audit log. RLS intentionally has no client policies; access must go through trusted server paths.';
comment on table public.internal_admin_notes is 'Server-only internal notes table. RLS intentionally has no client policies; access must go through trusted server paths.';
comment on table public.status_history is 'Server-only status history table. RLS intentionally has no client policies; access must go through trusted server paths.';
