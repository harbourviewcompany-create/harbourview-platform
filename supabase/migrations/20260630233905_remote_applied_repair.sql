-- Production version 20260630233905 owns the AI match-rationale columns.
-- The marketplace matching tables existed out of band before this migration;
-- restore their exact private workflow foundation during zero-state replay, then
-- apply the production-owned rationale delta. Existing production tables and
-- data are preserved.

create extension if not exists "uuid-ossp";

do $matching_enum_contracts$
declare
  enum_contract record;
  actual_labels text[];
begin
  for enum_contract in
    select *
    from (values
      ('marketplace_category', array['new_products','used_surplus','cannabis_inventory','wanted_requests','services','business_opportunities','supplier_directory','cultivation_equipment','export_ready','import_demand','consumables','distressed_inventory','distressed_businesses','genetics','professional_services','labs_testing','logistics','packaging','processing_equipment']::text[]),
      ('region', array['north_america','europe','asia_pacific','latin_america','middle_east_africa','global']::text[]),
      ('price_range', array['under_100k','100k_500k','500k_1m','1m_5m','5m_plus','negotiable']::text[]),
      ('buyer_type', array['licensed_producer','distributor','wholesaler','retailer','investor','other']::text[]),
      ('buyer_request_status', array['pending_review','approved','rejected','archived']::text[]),
      ('match_status', array['proposed','disclosure_requested','disclosure_approved','introduced','closed_won','closed_lost']::text[])
    ) as required(type_name, expected_labels)
  loop
    if to_regtype(format('public.%I', enum_contract.type_name)) is null then
      execute format(
        'create type public.%I as enum (%s)',
        enum_contract.type_name,
        (select string_agg(quote_literal(label), ',') from unnest(enum_contract.expected_labels) label)
      );
    else
      select array_agg(enum_value.enumlabel order by enum_value.enumsortorder)
      into actual_labels
      from pg_enum enum_value
      where enum_value.enumtypid = to_regtype(format('public.%I', enum_contract.type_name));

      if actual_labels is distinct from enum_contract.expected_labels then
        raise exception
          'Enum public.% contract mismatch: expected %, found %',
          enum_contract.type_name,
          enum_contract.expected_labels,
          actual_labels;
      end if;
    end if;
  end loop;
end
$matching_enum_contracts$;

create table if not exists public.buyer_requests (
  id uuid primary key default public.uuid_generate_v4(),
  category public.marketplace_category not null,
  title text not null,
  description text not null,
  product_type text not null,
  region public.region not null,
  price_range public.price_range,
  buyer_type public.buyer_type not null,
  requirements jsonb not null default '{}'::jsonb,
  status public.buyer_request_status not null default 'pending_review',
  internal_notes text,
  contact_name text,
  contact_email text,
  contact_phone text,
  legal_entity text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists idx_buyer_requests_category
  on public.buyer_requests (category);
create index if not exists idx_buyer_requests_created_at
  on public.buyer_requests (created_at desc);
create index if not exists idx_buyer_requests_status
  on public.buyer_requests (status);

alter table public.buyer_requests enable row level security;

do $buyer_request_policies$
begin
  if not exists (
    select 1 from pg_policy
    where polrelid = 'public.buyer_requests'::regclass
      and polname = 'buyer_requests_anon_insert'
  ) then
    create policy buyer_requests_anon_insert
      on public.buyer_requests
      for insert
      to anon, authenticated
      with check (status = 'pending_review'::public.buyer_request_status);
  end if;

  if not exists (
    select 1 from pg_policy
    where polrelid = 'public.buyer_requests'::regclass
      and polname = 'buyer_requests_public_read'
  ) then
    create policy buyer_requests_public_read
      on public.buyer_requests
      for select
      to anon, authenticated
      using (status = 'approved'::public.buyer_request_status);
  end if;
end
$buyer_request_policies$;

revoke all on table public.buyer_requests from public, anon, authenticated;
grant select, insert on table public.buyer_requests to anon, authenticated;
grant all on table public.buyer_requests to service_role;

create table if not exists public.matches (
  id uuid primary key default public.uuid_generate_v4(),
  listing_id uuid references public.listings(id),
  buyer_request_id uuid references public.buyer_requests(id),
  inquiry_id uuid references public.marketplace_inquiries(id),
  status public.match_status not null default 'proposed',
  internal_notes text,
  proposed_at timestamptz not null default now(),
  introduced_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_matches_buyer_request_id
  on public.matches (buyer_request_id);
create index if not exists idx_matches_inquiry_id
  on public.matches (inquiry_id);
create index if not exists idx_matches_listing_id
  on public.matches (listing_id);
create index if not exists idx_matches_status
  on public.matches (status);

alter table public.matches enable row level security;

do $matches_policies$
begin
  if not exists (
    select 1 from pg_policy
    where polrelid = 'public.matches'::regclass
      and polname = 'admin_operator_select'
  ) then
    create policy admin_operator_select
      on public.matches
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.user_roles
          where user_roles.user_id = (select auth.uid())
            and user_roles.role = any (array['admin'::text, 'operator'::text])
        )
      );
  end if;
end
$matches_policies$;

revoke all on table public.matches from public, anon, authenticated;
grant select on table public.matches to authenticated;
grant all on table public.matches to service_role;

alter table public.matches
  add column if not exists match_rationale text,
  add column if not exists match_rationale_model text,
  add column if not exists match_rationale_generated_at timestamptz;

comment on column public.matches.match_rationale is
  'Best-effort AI-generated explanation of why this listing/buyer_request pair was matched. Nullable; generation is capped and not guaranteed for every match.';
comment on column public.matches.match_rationale_model is
  'LLM model identifier used to generate match_rationale for provenance and auditing.';
comment on column public.matches.match_rationale_generated_at is
  'Timestamp when match_rationale was generated; null when no rationale has been generated.';
