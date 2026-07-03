-- Regulatory product-format matrix: which cannabis product formats are permitted,
-- restricted, or prohibited in each country, per regulatory pathway.
-- Pathways are first-class (e.g. Brazil RDC 1015 vs RDC 660; UK licensed vs CBPM specials).

create type public.reg_pathway_type as enum (
  'registered_medicine',      -- registered/approved pharmaceutical products (Sativex, Epidyolex)
  'domestic_authorization',   -- simplified national product authorization (BR RDC 1015, NZ scheme, IE MCAP)
  'special_access_import',    -- named-patient / special access / individual import (AU SAS, ZA s21, BR RDC 660)
  'magistral_compounding',    -- pharmacy compounding from raw material (PL, IT, ES RD 903/2025)
  'medical_access_program',   -- general prescription access to standardized unregistered products (DE, CH, TH)
  'adult_use_commercial',     -- licensed commercial adult-use (CA, UY, US states)
  'adult_use_noncommercial',  -- possession/home-grow/clubs without commercial retail (DE CanG, CZ, MT, ZA)
  'low_thc_consumer',         -- CBD / low-THC consumer products
  'pilot_program',            -- time-limited pilots/experiments (CH trials, NL wietexperiment, BR sandbox)
  'export_oriented',          -- cultivation/manufacture primarily for export (LS, MK, GR, CO)
  'research_only'
);

create type public.reg_rule_status as enum (
  'permitted','restricted','prohibited','unregulated','proposed','suspended','unknown'
);

create type public.reg_verification_status as enum ('verified','needs_review','stale');

create table public.product_formats (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,  -- inhalable | oral | oromucosal | topical | rectal | raw_material | other
  description text,
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);

create table public.regulatory_pathways (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  iso_alpha2 text not null,
  slug text not null unique,
  name text not null,
  pathway_type public.reg_pathway_type not null,
  legal_basis text,
  regulator text,
  status text not null default 'active',  -- active | pilot | announced | suspended | repealed
  effective_date date,
  sunset_date date,
  summary text,
  prescription_notes text,
  source_urls text[] not null default '{}',
  verification public.reg_verification_status not null default 'needs_review',
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index regulatory_pathways_country_idx on public.regulatory_pathways (country_id);
create index regulatory_pathways_iso2_idx on public.regulatory_pathways (iso_alpha2);
create index regulatory_pathways_type_idx on public.regulatory_pathways (pathway_type);

create table public.pathway_format_rules (
  id uuid primary key default gen_random_uuid(),
  pathway_id uuid not null references public.regulatory_pathways(id) on delete cascade,
  format_id uuid not null references public.product_formats(id) on delete cascade,
  status public.reg_rule_status not null default 'unknown',
  thc_limit text,
  cbd_limit text,
  conditions jsonb not null default '{}'::jsonb,
  notes text,
  source_urls text[] not null default '{}',
  verification public.reg_verification_status not null default 'needs_review',
  last_verified_at timestamptz,
  effective_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pathway_id, format_id)
);
create index pathway_format_rules_format_idx on public.pathway_format_rules (format_id);
create index pathway_format_rules_status_idx on public.pathway_format_rules (status);

-- updated_at maintenance
create or replace function public.reg_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_reg_pathways_touch before update on public.regulatory_pathways
  for each row execute function public.reg_touch_updated_at();
create trigger trg_reg_rules_touch before update on public.pathway_format_rules
  for each row execute function public.reg_touch_updated_at();

-- Change history: pipe substantive rule changes into the existing regulatory_field_changes audit table
create or replace function public.reg_log_rule_change()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    insert into public.regulatory_field_changes (table_name, row_id, field_name, old_value, new_value, source_label)
    values ('pathway_format_rules', new.id::text, 'status', old.status::text, new.status::text, 'reg_format_matrix_trigger');
  end if;
  if new.thc_limit is distinct from old.thc_limit then
    insert into public.regulatory_field_changes (table_name, row_id, field_name, old_value, new_value, source_label)
    values ('pathway_format_rules', new.id::text, 'thc_limit', old.thc_limit, new.thc_limit, 'reg_format_matrix_trigger');
  end if;
  if new.cbd_limit is distinct from old.cbd_limit then
    insert into public.regulatory_field_changes (table_name, row_id, field_name, old_value, new_value, source_label)
    values ('pathway_format_rules', new.id::text, 'cbd_limit', old.cbd_limit, new.cbd_limit, 'reg_format_matrix_trigger');
  end if;
  return new;
end $$;

create trigger trg_reg_rules_changelog after update on public.pathway_format_rules
  for each row execute function public.reg_log_rule_change();

create or replace function public.reg_log_pathway_change()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    insert into public.regulatory_field_changes (table_name, row_id, field_name, old_value, new_value, source_label)
    values ('regulatory_pathways', new.id::text, 'status', old.status, new.status, 'reg_format_matrix_trigger');
  end if;
  return new;
end $$;

create trigger trg_reg_pathways_changelog after update on public.regulatory_pathways
  for each row execute function public.reg_log_pathway_change();

-- Flat matrix for the app layer
create view public.v_country_format_matrix
with (security_invoker = on) as
select
  c.iso_alpha2,
  c.country_name,
  c.region,
  p.id   as pathway_id,
  p.slug as pathway_slug,
  p.name as pathway_name,
  p.pathway_type,
  p.status as pathway_status,
  p.legal_basis,
  f.slug as format_slug,
  f.name as format_name,
  f.category as format_category,
  r.status as rule_status,
  r.thc_limit,
  r.cbd_limit,
  r.conditions,
  r.notes,
  r.verification,
  r.last_verified_at
from public.pathway_format_rules r
join public.regulatory_pathways p on p.id = r.pathway_id
join public.product_formats f on f.id = r.format_id
join public.countries c on c.id = p.country_id;

-- Update loop: rows that need re-verification (feeds intelligence-automation agents)
create view public.v_regulatory_format_stale
with (security_invoker = on) as
select 'pathway'::text as record_type, p.id, p.iso_alpha2, p.slug as record_slug,
       p.verification, p.last_verified_at
from public.regulatory_pathways p
where p.verification <> 'verified' or p.last_verified_at < now() - interval '90 days' or p.last_verified_at is null
union all
select 'rule'::text, r.id, p.iso_alpha2, p.slug || ':' || f.slug,
       r.verification, r.last_verified_at
from public.pathway_format_rules r
join public.regulatory_pathways p on p.id = r.pathway_id
join public.product_formats f on f.id = r.format_id
where r.verification <> 'verified' or r.last_verified_at < now() - interval '90 days' or r.last_verified_at is null;

-- Coverage across the full 203-country canon: absence of rows = research gap, not "prohibited"
create view public.v_regulatory_format_coverage
with (security_invoker = on) as
select
  c.iso_alpha2,
  c.country_name,
  c.region,
  count(distinct p.id) as pathway_count,
  count(r.id) as rule_count,
  min(p.verification::text) as worst_verification,
  max(greatest(coalesce(p.last_verified_at, 'epoch'::timestamptz), coalesce(r.last_verified_at, 'epoch'::timestamptz))) as last_verified_at
from public.countries c
left join public.regulatory_pathways p on p.country_id = c.id
left join public.pathway_format_rules r on r.pathway_id = p.id
group by c.iso_alpha2, c.country_name, c.region;

-- RLS: match platform convention (public read, service_role write)
alter table public.product_formats enable row level security;
alter table public.regulatory_pathways enable row level security;
alter table public.pathway_format_rules enable row level security;

create policy product_formats_public_read on public.product_formats
  for select to anon, authenticated using (true);
create policy product_formats_service_write on public.product_formats
  for all to service_role using (true) with check (true);

create policy regulatory_pathways_public_read on public.regulatory_pathways
  for select to anon, authenticated using (true);
create policy regulatory_pathways_service_write on public.regulatory_pathways
  for all to service_role using (true) with check (true);

create policy pathway_format_rules_public_read on public.pathway_format_rules
  for select to anon, authenticated using (true);
create policy pathway_format_rules_service_write on public.pathway_format_rules
  for all to service_role using (true) with check (true);

grant select on public.product_formats, public.regulatory_pathways, public.pathway_format_rules,
  public.v_country_format_matrix, public.v_regulatory_format_stale, public.v_regulatory_format_coverage
  to anon, authenticated;