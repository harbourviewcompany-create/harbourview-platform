-- ============================================================================
-- Enrichment layer for the regulatory product-format matrix.
-- Adds structured detail (was crammed into notes/conditions jsonb), a first-class
-- citation table, scheduled-change tracking, and a compliance guardrail.
-- ============================================================================

-- ---- Structured pathway-level detail ----
alter table public.regulatory_pathways
  add column if not exists qualifying_conditions text[] not null default '{}',
  add column if not exists prescriber_scope text,          -- e.g. 'any registered doctor', 'specialist-initiated', 'hospital only'
  add column if not exists min_age int,                    -- minimum patient/consumer age where defined
  add column if not exists reimbursement text;             -- none | partial | full | conditional | n/a

-- ---- Structured rule-level (format-specific) detail ----
alter table public.pathway_format_rules
  add column if not exists possession_limit text,          -- e.g. '30g dried equivalent'
  add column if not exists unit_dose_limit text,           -- e.g. '10 mg THC per unit'
  add column if not exists packaging_labelling text;       -- child-resistant, plain-pack, COA, warnings

-- ---- Citation source taxonomy ----
create type public.reg_source_type as enum (
  'gazette',     -- official gazette / official journal publication (primary)
  'regulator',   -- regulator site, guidance, product list (primary)
  'statute',     -- act / law / regulation text (primary)
  'court',       -- court judgment (primary)
  'secondary',   -- law-firm analysis, industry body, trade press (supporting)
  'news'         -- general news (weakest)
);

-- Primary sources are the only ones that can substantiate a 'verified' flip.
create table public.regulatory_citations (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('pathway','rule')),
  entity_id uuid not null,
  instrument text not null,           -- e.g. 'RDC 1.015/2026', 'MedCanG', 'TGO 93'
  article text,                       -- e.g. 'Art. 12', 'Sch 2', 's22C(1)(b)'
  source_type public.reg_source_type not null,
  citation_url text,
  published_date date,
  accessed_date date not null default current_date,
  excerpt text,                       -- short (<15 word) copyright-safe excerpt only
  created_at timestamptz not null default now()
);
create index regulatory_citations_entity_idx on public.regulatory_citations (entity_type, entity_id);
create index regulatory_citations_source_idx on public.regulatory_citations (source_type);

-- ---- Scheduled / pending regulatory changes (effective-dating for shifts) ----
create type public.reg_change_confidence as enum (
  'speculative',          -- rumoured / advocacy only
  'announced',            -- official intent stated, no text
  'draft',                -- draft text published / in consultation
  'enacted_pending_force' -- law passed, awaiting commencement date
);

create table public.regulatory_pending_changes (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('pathway','rule')),
  entity_id uuid not null,
  change_type text not null,          -- status | thc_limit | new_format | repeal | prescriber | reimbursement
  current_value text,
  expected_value text,
  expected_effective_date date,       -- null when only a fuzzy timeframe is known
  expected_note text,                 -- fuzzy timeframe, e.g. 'H1 2026', 'by mid-2027'
  confidence public.reg_change_confidence not null default 'announced',
  status text not null default 'pending',  -- pending | resolved | withdrawn
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index regulatory_pending_changes_entity_idx on public.regulatory_pending_changes (entity_type, entity_id);
create index regulatory_pending_changes_status_idx on public.regulatory_pending_changes (status);

create trigger trg_reg_pending_touch before update on public.regulatory_pending_changes
  for each row execute function public.reg_touch_updated_at();
create trigger trg_reg_citations_no_op before update on public.regulatory_citations
  for each row execute function public.reg_touch_updated_at();

-- ============================================================================
-- COMPLIANCE GUARDRAIL
-- A pathway or rule may only transition INTO 'verified' when at least one
-- primary-source citation (gazette | regulator | statute | court) exists for it.
-- Existing verified rows are grandfathered; only new assertions of verification
-- are gated. Wrong regulatory data is worse than missing data.
-- ============================================================================
create or replace function public.reg_require_primary_source()
returns trigger language plpgsql as $$
declare
  v_entity text := tg_argv[0];
  v_has_primary boolean;
begin
  if new.verification = 'verified'
     and (tg_op = 'INSERT' or old.verification is distinct from 'verified') then
    select exists(
      select 1 from public.regulatory_citations c
       where c.entity_type = v_entity
         and c.entity_id = new.id
         and c.source_type in ('gazette','regulator','statute','court')
    ) into v_has_primary;
    if not v_has_primary then
      raise exception
        'Cannot mark % %/% as verified: a primary-source citation (gazette, regulator, statute or court) is required first.',
        v_entity, new.iso_alpha2, new.slug
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;

create trigger trg_reg_pathways_require_source
  before insert or update on public.regulatory_pathways
  for each row execute function public.reg_require_primary_source('pathway');

-- Rules don't carry iso/slug columns; give the guard a rule-shaped variant.
create or replace function public.reg_require_primary_source_rule()
returns trigger language plpgsql as $$
declare
  v_has_primary boolean;
begin
  if new.verification = 'verified'
     and (tg_op = 'INSERT' or old.verification is distinct from 'verified') then
    select exists(
      select 1 from public.regulatory_citations c
       where c.entity_type = 'rule'
         and c.entity_id = new.id
         and c.source_type in ('gazette','regulator','statute','court')
    ) into v_has_primary;
    if not v_has_primary then
      raise exception
        'Cannot mark rule % as verified: a primary-source citation is required first.', new.id
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;

create trigger trg_reg_rules_require_source
  before insert or update on public.pathway_format_rules
  for each row execute function public.reg_require_primary_source_rule();

-- ---- RLS + grants for new tables (match platform convention) ----
alter table public.regulatory_citations enable row level security;
alter table public.regulatory_pending_changes enable row level security;

create policy regulatory_citations_public_read on public.regulatory_citations
  for select to anon, authenticated using (true);
create policy regulatory_citations_service_write on public.regulatory_citations
  for all to service_role using (true) with check (true);
create policy regulatory_pending_public_read on public.regulatory_pending_changes
  for select to anon, authenticated using (true);
create policy regulatory_pending_service_write on public.regulatory_pending_changes
  for all to service_role using (true) with check (true);

grant select on public.regulatory_citations, public.regulatory_pending_changes to anon, authenticated;

-- ============================================================================
-- Refreshed stale/enrichment view: now also flags verified-but-uncited rows and
-- pending changes that have come due. Carries a machine-readable `reason`.
-- ============================================================================
drop view if exists public.v_regulatory_format_stale;
create view public.v_regulatory_format_stale
with (security_invoker = on) as
-- pathways: unverified, aged, or verified without a primary citation
select 'pathway'::text as record_type, p.id, p.iso_alpha2, p.slug as record_slug,
       p.verification, p.last_verified_at,
       case
         when p.verification <> 'verified' then 'unverified'
         when p.last_verified_at is null or p.last_verified_at < now() - interval '90 days' then 'stale'
         when not exists (select 1 from public.regulatory_citations c
                          where c.entity_type='pathway' and c.entity_id=p.id
                            and c.source_type in ('gazette','regulator','statute','court'))
              then 'verified_uncited'
       end as reason
from public.regulatory_pathways p
where p.verification <> 'verified'
   or p.last_verified_at is null
   or p.last_verified_at < now() - interval '90 days'
   or not exists (select 1 from public.regulatory_citations c
                  where c.entity_type='pathway' and c.entity_id=p.id
                    and c.source_type in ('gazette','regulator','statute','court'))
union all
-- rules: same tests
select 'rule'::text, r.id, p.iso_alpha2, p.slug || ':' || f.slug,
       r.verification, r.last_verified_at,
       case
         when r.verification <> 'verified' then 'unverified'
         when r.last_verified_at is null or r.last_verified_at < now() - interval '90 days' then 'stale'
         when not exists (select 1 from public.regulatory_citations c
                          where c.entity_type='rule' and c.entity_id=r.id
                            and c.source_type in ('gazette','regulator','statute','court'))
              then 'verified_uncited'
       end as reason
from public.pathway_format_rules r
join public.regulatory_pathways p on p.id = r.pathway_id
join public.product_formats f on f.id = r.format_id
where r.verification <> 'verified'
   or r.last_verified_at is null
   or r.last_verified_at < now() - interval '90 days'
   or not exists (select 1 from public.regulatory_citations c
                  where c.entity_type='rule' and c.entity_id=r.id
                    and c.source_type in ('gazette','regulator','statute','court'))
union all
-- pending changes due for resolution
select 'pending_change'::text, pc.id, p.iso_alpha2, p.slug,
       'needs_review'::public.reg_verification_status, pc.updated_at,
       'pending_change_due'::text
from public.regulatory_pending_changes pc
join public.regulatory_pathways p on p.id = pc.entity_id and pc.entity_type='pathway'
where pc.status='pending'
  and pc.expected_effective_date is not null
  and pc.expected_effective_date <= current_date;

grant select on public.v_regulatory_format_stale to anon, authenticated;

-- Sourcing-completeness signal for the coverage picture
create or replace view public.v_regulatory_citation_coverage
with (security_invoker = on) as
select
  c.iso_alpha2,
  c.country_name,
  count(distinct p.id) as pathways,
  count(distinct cit_p.id) filter (where cit_p.source_type in ('gazette','regulator','statute','court')) as pathway_primary_citations,
  count(distinct r.id) as rules,
  count(distinct cit_r.id) filter (where cit_r.source_type in ('gazette','regulator','statute','court')) as rule_primary_citations
from public.countries c
left join public.regulatory_pathways p on p.country_id = c.id
left join public.regulatory_citations cit_p on cit_p.entity_type='pathway' and cit_p.entity_id=p.id
left join public.pathway_format_rules r on r.pathway_id = p.id
left join public.regulatory_citations cit_r on cit_r.entity_type='rule' and cit_r.entity_id=r.id
group by c.iso_alpha2, c.country_name;

grant select on public.v_regulatory_citation_coverage to anon, authenticated;