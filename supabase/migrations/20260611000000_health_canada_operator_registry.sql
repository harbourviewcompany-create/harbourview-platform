-- Harbourview private Health Canada Canadian Licensed Operator Registry
-- Private admin/operator CRM + intelligence spine. No public marketplace exposure.

begin;

create extension if not exists pgcrypto;

create table if not exists public.health_canada_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_name text not null default 'Health Canada licensed cannabis cultivators, processors and sellers',
  source_url text not null,
  source_page_details_date date,
  source_fetched_at timestamptz not null default now(),
  source_confidence text not null default 'transcript_reconciled_hold'
    check (source_confidence in ('transcript_reconciled_hold','official_machine_parsed','manual_review','fixture')),
  source_package_name text,
  row_count integer not null default 0 check (row_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.health_canada_raw_source_rows (
  id uuid primary key default gen_random_uuid(),
  source_snapshot_id uuid not null references public.health_canada_source_snapshots(id) on delete cascade,
  source_row_id text not null unique,
  source_row_index integer,
  raw_company_name text not null,
  normalized_company_name text not null,
  province text,
  status text not null default 'active'
    check (status in ('active','revoked_on_request','revoked_by_minister','expired','suspended','stale','review_required')),
  site_marker text,
  licence_class text,
  authorized_classes text,
  website text,
  phone text,
  raw_payload jsonb not null default '{}'::jsonb,
  row_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.canadian_operator_canonical (
  id uuid primary key default gen_random_uuid(),
  canonical_operator_id text not null unique,
  canonical_name text not null,
  normalized_name text not null,
  primary_province text,
  track text not null check (track in (
    'integrated_operator','medical_processing','processor_cultivator','micro_craft',
    'nursery_starting_material','medical_only','strategic_corporate_cluster',
    'individual_name_verification_hold','exclusion','review_required'
  )),
  strategic_cluster boolean not null default false,
  medical_only boolean not null default false,
  individual_name_hold boolean not null default false,
  conflict_flag boolean not null default false,
  outreach_ready boolean not null default false,
  source_confidence text not null default 'transcript_reconciled_hold',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.canadian_operator_licence_sites (
  id uuid primary key default gen_random_uuid(),
  site_id text not null unique,
  canonical_operator_id text not null references public.canadian_operator_canonical(canonical_operator_id) on delete restrict,
  source_row_id text references public.health_canada_raw_source_rows(source_row_id) on delete set null,
  company_name text not null,
  province text,
  status text not null check (status in ('active','revoked_on_request','revoked_by_minister','expired','suspended','stale','review_required')),
  site_marker text,
  licence_class text,
  authorized_classes text,
  website text,
  phone text,
  track text not null,
  outreach_ready boolean not null default false,
  evidence_type text,
  review_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint canadian_operator_site_exclusion_not_outreach_ready check (
    outreach_ready = false or status = 'active'
  )
);

create table if not exists public.canadian_operator_outreach_queue (
  id uuid primary key default gen_random_uuid(),
  outreach_queue_id text not null unique,
  canonical_operator_id text not null references public.canadian_operator_canonical(canonical_operator_id) on delete restrict,
  site_id text not null references public.canadian_operator_licence_sites(site_id) on delete restrict,
  send_order integer,
  queue_version text not null,
  track text not null,
  province text,
  evidence_type text not null,
  website text,
  phone text,
  first_contact_note text,
  outreach_ready boolean not null default true check (outreach_ready = true),
  created_at timestamptz not null default now()
);

create table if not exists public.canadian_operator_exclusions (
  id uuid primary key default gen_random_uuid(),
  exclusion_id text not null unique,
  canonical_operator_id text references public.canadian_operator_canonical(canonical_operator_id) on delete set null,
  source_row_id text references public.health_canada_raw_source_rows(source_row_id) on delete set null,
  company_name text not null,
  province text,
  status text not null check (status in ('revoked_on_request','revoked_by_minister','expired','suspended')),
  exclusion_reason text not null,
  outreach_ready boolean not null default false check (outreach_ready = false),
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.canadian_operator_duplicate_clusters (
  id uuid primary key default gen_random_uuid(),
  cluster_id text not null,
  canonical_operator_id text references public.canadian_operator_canonical(canonical_operator_id) on delete set null,
  site_id text references public.canadian_operator_licence_sites(site_id) on delete set null,
  cluster_type text not null check (cluster_type in ('duplicate','second_site','third_site','strategic_corporate','brand_alias','status_conflict','review_required')),
  member_label text not null,
  notes text,
  review_required boolean not null default true,
  created_at timestamptz not null default now(),
  unique (cluster_id, member_label)
);

create table if not exists public.canadian_operator_conflicts (
  id uuid primary key default gen_random_uuid(),
  conflict_id text not null unique,
  canonical_operator_id text references public.canadian_operator_canonical(canonical_operator_id) on delete set null,
  site_id text references public.canadian_operator_licence_sites(site_id) on delete set null,
  source_row_id text references public.health_canada_raw_source_rows(source_row_id) on delete set null,
  conflict_type text not null check (conflict_type in ('active_vs_revoked','active_vs_expired','status_mismatch','duplicate_ambiguity','legal_name_ambiguity','source_mismatch','stale_row','review_required')),
  conflict_status text not null default 'open' check (conflict_status in ('open','reviewing','resolved','deferred')),
  notes text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.canadian_operator_individual_holds (
  id uuid primary key default gen_random_uuid(),
  hold_id text not null unique,
  canonical_operator_id text references public.canadian_operator_canonical(canonical_operator_id) on delete set null,
  source_row_id text references public.health_canada_raw_source_rows(source_row_id) on delete set null,
  individual_name text not null,
  province text,
  status text not null default 'active',
  verification_status text not null default 'business_identity_required'
    check (verification_status in ('business_identity_required','public_business_contact_required','cleared','excluded')),
  outreach_ready boolean not null default false check (outreach_ready = false),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists health_canada_raw_rows_snapshot_idx on public.health_canada_raw_source_rows(source_snapshot_id, source_row_index);
create index if not exists health_canada_raw_rows_status_idx on public.health_canada_raw_source_rows(status, province);
create index if not exists canadian_operator_canonical_track_idx on public.canadian_operator_canonical(track, outreach_ready);
create index if not exists canadian_operator_sites_operator_idx on public.canadian_operator_licence_sites(canonical_operator_id, status);
create index if not exists canadian_operator_outreach_order_idx on public.canadian_operator_outreach_queue(queue_version, send_order);
create index if not exists canadian_operator_exclusions_status_idx on public.canadian_operator_exclusions(status, province);
create index if not exists canadian_operator_clusters_id_idx on public.canadian_operator_duplicate_clusters(cluster_id);
create index if not exists canadian_operator_conflicts_status_idx on public.canadian_operator_conflicts(conflict_status, conflict_type);

alter table public.health_canada_source_snapshots enable row level security;
alter table public.health_canada_raw_source_rows enable row level security;
alter table public.canadian_operator_canonical enable row level security;
alter table public.canadian_operator_licence_sites enable row level security;
alter table public.canadian_operator_outreach_queue enable row level security;
alter table public.canadian_operator_exclusions enable row level security;
alter table public.canadian_operator_duplicate_clusters enable row level security;
alter table public.canadian_operator_conflicts enable row level security;
alter table public.canadian_operator_individual_holds enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'health_canada_source_snapshots','health_canada_raw_source_rows','canadian_operator_canonical',
    'canadian_operator_licence_sites','canadian_operator_outreach_queue','canadian_operator_exclusions',
    'canadian_operator_duplicate_clusters','canadian_operator_conflicts','canadian_operator_individual_holds'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_admin_operator_all', table_name);
    execute format($policy$
drop policy if exists %I on public.%I;
      create policy %I on public.%I
        for all
        using (
          exists (
            select 1 from public.user_roles
            where user_roles.user_id = auth.uid()
              and user_roles.role in ('admin','operator')
          )
        )
        with check (
          exists (
            select 1 from public.user_roles
            where user_roles.user_id = auth.uid()
              and user_roles.role in ('admin','operator')
          )
        )
    $policy$, table_name || '_admin_operator_all', table_name);
  end loop;
end $$;

revoke all on public.health_canada_source_snapshots from anon;
revoke all on public.health_canada_raw_source_rows from anon;
revoke all on public.canadian_operator_canonical from anon;
revoke all on public.canadian_operator_licence_sites from anon;
revoke all on public.canadian_operator_outreach_queue from anon;
revoke all on public.canadian_operator_exclusions from anon;
revoke all on public.canadian_operator_duplicate_clusters from anon;
revoke all on public.canadian_operator_conflicts from anon;
revoke all on public.canadian_operator_individual_holds from anon;

grant select, insert, update on public.health_canada_source_snapshots to authenticated;
grant select, insert, update on public.health_canada_raw_source_rows to authenticated;
grant select, insert, update on public.canadian_operator_canonical to authenticated;
grant select, insert, update on public.canadian_operator_licence_sites to authenticated;
grant select, insert, update on public.canadian_operator_outreach_queue to authenticated;
grant select, insert, update on public.canadian_operator_exclusions to authenticated;
grant select, insert, update on public.canadian_operator_duplicate_clusters to authenticated;
grant select, insert, update on public.canadian_operator_conflicts to authenticated;
grant select, insert, update on public.canadian_operator_individual_holds to authenticated;

comment on table public.health_canada_raw_source_rows is 'Private Health Canada source evidence rows. Never expose through public marketplace DTOs, public APIs, public HTML, or client bundles.';
comment on table public.canadian_operator_outreach_queue is 'Private Harbourview operator outreach queue. Admin/operator only; no public supplier directory exposure.';
comment on table public.canadian_operator_conflicts is 'Private active/revoked/stale/duplicate conflict ledger. Preserve evidence instead of deleting rows.';

commit;
