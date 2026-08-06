-- Production already had several marketplace and administration objects when
-- this historical hardening migration ran. A clean repository replay restores
-- those objects later at their canonical versions. Apply each hardening delta
-- only when its exact dependency exists; later canonical migrations own the
-- zero-state schema and repeat the active public-safe contracts.

do $harden_optional_marketplace_smoke_functions$
begin
  if to_regprocedure('public.smoke_verify_marketplace_inquiry(text,text,text)') is not null then
    revoke execute on function public.smoke_verify_marketplace_inquiry(text, text, text) from anon, authenticated;
  end if;

  if to_regprocedure('public.smoke_close_marketplace_inquiry(text,text,text)') is not null then
    revoke execute on function public.smoke_close_marketplace_inquiry(text, text, text) from anon, authenticated;
  end if;
end
$harden_optional_marketplace_smoke_functions$;

-- This legacy view existed in production before the repository's canonical
-- listings table. On clean replay, 20260528033000 creates public.listings and
-- 20260601000000 creates the current public.marketplace_public_listings_v1 DTO.
-- Preserve the historical view only in forward-only environments where its
-- complete legacy column contract already exists.
do $harden_optional_legacy_marketplace_view$
begin
  if to_regclass('public.listings') is not null
     and to_regtype('public.listing_status') is not null
     and not exists (
       select 1
       from unnest(array[
         'id','marketplace_section','title','slug','description','price_amount',
         'price_currency','location_country','is_featured','condition','brand',
         'model','quantity','unit','created_at','status','public_visibility',
         'archived_at'
       ]) as required(column_name)
       where not exists (
         select 1
         from information_schema.columns c
         where c.table_schema = 'public'
           and c.table_name = 'listings'
           and c.column_name = required.column_name
       )
     ) then
    execute $view$
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
        and archived_at is null
    $view$;
  end if;
end
$harden_optional_legacy_marketplace_view$;

-- Matching and disclosure workflow relations also existed out of band at this
-- point. Their replay-correct creators repeat these indexes and private-table
-- comments when they are restored later.
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

-- Preserve historical indexes only where their relation and column contracts
-- are already present. Later canonical migrations own clean-replay creation.
do $harden_optional_marketplace_indexes$
begin
  if to_regclass('public.listings') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'listings' and column_name = 'superseded_by'
     ) then
    execute 'create index if not exists idx_listings_superseded_by on public.listings(superseded_by)';
  end if;

  if to_regclass('public.user_roles') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'user_roles' and column_name = 'created_by'
     ) then
    execute 'create index if not exists idx_user_roles_created_by on public.user_roles(created_by)';
  end if;
end
$harden_optional_marketplace_indexes$;

-- The self-read policy is a hardening delta, not the user_roles creator.
do $harden_optional_user_roles_policy$
begin
  if to_regclass('public.user_roles') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'user_roles' and column_name = 'user_id'
     ) then
    drop policy if exists user_roles_self_read on public.user_roles;
    create policy user_roles_self_read
      on public.user_roles
      for select
      to authenticated
      using (user_id = (select auth.uid()));
  end if;
end
$harden_optional_user_roles_policy$;

-- Internal-table comments are applied only when those out-of-band relations are
-- present. Their later replay-correct creators retain server-only access.
do $comment_optional_internal_tables$
begin
  if to_regclass('public.audit_events') is not null then
    comment on table public.audit_events is
      'Server-only audit log. RLS intentionally has no client policies; access must go through trusted server paths.';
  end if;

  if to_regclass('public.internal_admin_notes') is not null then
    comment on table public.internal_admin_notes is
      'Server-only internal notes table. RLS intentionally has no client policies; access must go through trusted server paths.';
  end if;

  if to_regclass('public.status_history') is not null then
    comment on table public.status_history is
      'Server-only status history table. RLS intentionally has no client policies; access must go through trusted server paths.';
  end if;
end
$comment_optional_internal_tables$;
