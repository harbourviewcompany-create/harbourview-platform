
-- RECOVERY BEGIN 20260923153000_primary_evidence_batch_cl_ec.sql
-- Primary-source evidence tranche: Chile and Ecuador.
-- Verified against government/regulator sources on 2026-09-23.
-- Unsupported dimensions remain unresolved. All pathway writes are idempotent without relying on non-unique slug conflict targets.

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Chile ISP — narcotics/psychotropics control and cannabis procedures','https://www.ispch.cl/anamed/medicamentos/estupefacientes-y-psicotropicos/','CL','Chile','CL',1,'regulator',true,true,'south_america','es','html_snapshot','weekly','verified',now()+interval '7 days','online','ISP states it controls lawful narcotics and psychotropics nationally and identifies requirements for import, export, domestic distribution, dispensing and destruction; cannabis procedures are included in the official framework. Verified 2026-09-23.','2026-09-23','medicines_regulator',array['regulatory','import','export','distribution','dispensing'],jsonb_build_object('jurisdiction_key','CL','primary_regulator',true))
on conflict (source_url) do update set verification_notes='Chile ISP controlled-substances and cannabis procedures verified 2026-09-23.',verification_checked_at=now(),relevance_status='verified',is_active=true,next_crawl_at=now()+interval '7 days',updated_at=now();

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Ecuador ARCSA — cannabis/hemp finished-product technical regulation','https://www.controlsanitario.gob.ec/wp-content/uploads/downloads/2021/02/Resolucion-ARCSA-DE-002-2021-MAFG_Normativa-Tecnica-Sanitaria-para-la-regulacion-y-control-de-productos-terminados-de-uso-y-consumo-humano-que-contengan-Cannabis-No-Psicoactivo-o-Canamo.pdf','EC','Ecuador','EC',1,'regulator',true,true,'south_america','es','pdf_snapshot','monthly','verified',now()+interval '30 days','online','ARCSA regulation establishes controls for non-psychoactive cannabis/hemp finished products, including manufacturing, commercialization and import requirements, and specifies ARCSA authorization/registration conditions. Verified 2026-09-23.','2026-09-23','medicines_regulator',array['regulatory','hemp','finished_products','import'],jsonb_build_object('jurisdiction_key','EC','primary_regulator',true))
on conflict (source_url) do update set verification_notes='ARCSA cannabis/hemp finished-product regulation verified 2026-09-23.',verification_checked_at=now(),relevance_status='verified',is_active=true,next_crawl_at=now()+interval '30 days',updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-cl-20260923','CL','medical_limited_trade',
 'Chile applies controlled-substance requirements to cannabis and derivatives. The ISP identifies official requirements for import/export certificates, domestic distribution, dispensing and transport, while pharmaceutical products require sanitary registration before distribution or use.',
 'Instituto de Salud Pública de Chile (ISP)',
 'https://www.ispch.cl/anamed/medicamentos/estupefacientes-y-psicotropicos/',
 '2011-06-25',now(),now()+interval '180 days',true),
('primary-evidence-ec-20260923','EC','medical_limited_trade',
 'Ecuador regulates medicinal cannabis/cannabinoid products through ARCSA and health regulations. The ARCSA technical regulation establishes authorization and registration controls for non-psychoactive cannabis/hemp finished products, including manufacture, commercialization and import.',
 'Agencia Nacional de Regulación, Control y Vigilancia Sanitaria (ARCSA)',
 'https://www.controlsanitario.gob.ec/wp-content/uploads/downloads/2021/02/Resolucion-ARCSA-DE-002-2021-MAFG_Normativa-Tecnica-Sanitaria-para-la-regulacion-y-control-de-productos-terminados-de-uso-y-consumo-humano-que-contengan-Cannabis-No-Psicoactivo-o-Canamo.pdf',
 '2021-02-03',now(),now()+interval '180 days',true)
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=now(),expires_at=now()+interval '180 days',active=true;

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-cl-20260923','CL','primary-evidence-claim:cl-controlled-cannabis-framework-20260923',
 'Chile requires controlled-substance authorization procedures for cannabis-related import/export and regulated domestic distribution/dispensing; pharmaceutical products also require sanitary registration before distribution or use.',
 'any','national','Instituto de Salud Pública de Chile (ISP)','https://www.ispch.cl/anamed/medicamentos/estupefacientes-y-psicotropicos/','2011-06-25',now(),now(),now()+interval '180 days','verified'),
('primary-evidence-ec-20260923','EC','primary-evidence-claim:ec-nonpsychoactive-cannabis-product-controls-20260923',
 'Ecuador requires ARCSA authorization/registration controls for specified finished products containing non-psychoactive cannabis or hemp, including imported products, and requires authorized establishments for applicable manufacturing and commercialization.',
 'non_psychoactive','national','Agencia Nacional de Regulación, Control y Vigilancia Sanitaria (ARCSA)','https://www.controlsanitario.gob.ec/wp-content/uploads/downloads/2021/02/Resolucion-ARCSA-DE-002-2021-MAFG_Normativa-Tecnica-Sanitaria-para-la-regulacion-y-control-de-productos-terminados-de-uso-y-consumo-humano-que-contengan-Cannabis-No-Psicoactivo-o-Canamo.pdf','2021-02-03',now(),now(),now()+interval '180 days','verified')
on conflict (claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,retrieved_at=now(),verified_at=now(),expires_at=now()+interval '180 days',evidence_status='verified';

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'CL','depth-v1-cl-controlled-medical-cannabis','Controlled medicinal cannabis and pharmaceutical distribution/import pathway','domestic_authorization',
'DS 404/1983; DS 3/2010; Law 20.000 and implementing controlled-substance rules',
'Instituto de Salud Pública de Chile','active',null,
'Chile subjects cannabis-related controlled substances to ISP authorization and control. Official ISP material identifies annual forecasts, official import/export certificates, controlled-product distribution documentation, prescription-based dispensing, transport authorization and destruction controls. Pharmaceutical products require sanitary registration before distribution or use.',
array['https://www.ispch.cl/anamed/medicamentos/estupefacientes-y-psicotropicos/','https://www.ispch.cl/anamed/medicamentos/registro-sanitario-de-productos-farmaceuticos/'],
'needs_review',now()
from public.countries c
where c.iso2='CL'
  and not exists (select 1 from public.regulatory_pathways p where p.iso_alpha2='CL' and p.slug='depth-v1-cl-controlled-medical-cannabis');

update public.regulatory_pathways
set name='Controlled medicinal cannabis and pharmaceutical distribution/import pathway',
    pathway_type='domestic_authorization',
    legal_basis='DS 404/1983; DS 3/2010; Law 20.000 and implementing controlled-substance rules',
    regulator='Instituto de Salud Pública de Chile',
    status='active',
    effective_date=null,
    summary='Chile subjects cannabis-related controlled substances to ISP authorization and control. Official ISP material identifies annual forecasts, official import/export certificates, controlled-product distribution documentation, prescription-based dispensing, transport authorization and destruction controls. Pharmaceutical products require sanitary registration before distribution or use.',
    source_urls=array['https://www.ispch.cl/anamed/medicamentos/estupefacientes-y-psicotropicos/','https://www.ispch.cl/anamed/medicamentos/registro-sanitario-de-productos-farmaceuticos/'],
    last_verified_at=now()
where iso_alpha2='CL' and slug='depth-v1-cl-controlled-medical-cannabis';

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'EC','depth-v1-ec-nonpsychoactive-cannabis-products','Regulated non-psychoactive cannabis/hemp product pathway','licensed_market',
'ARCSA-DE-002-2021-MAFG; Acuerdo Ministerial 109; medicinal-cannabis therapeutic-use regulations',
'ARCSA / Ministry of Health','active','2021-02-03',
'Ecuador regulates specified finished products containing non-psychoactive cannabis or hemp. ARCSA rules require operating authorization and product registration/notification as applicable; imported finished products are subject to registration/notification requirements, while applicable medicines and medicinal products are subject to pharmaceutical controls.',
array['https://www.controlsanitario.gob.ec/wp-content/uploads/downloads/2021/02/Resolucion-ARCSA-DE-002-2021-MAFG_Normativa-Tecnica-Sanitaria-para-la-regulacion-y-control-de-productos-terminados-de-uso-y-consumo-humano-que-contengan-Cannabis-No-Psicoactivo-o-Canamo.pdf','https://www.controlsanitario.gob.ec/wp-content/uploads/downloads/2021/06/Acuerdo-Ministerial-148_Reglamento-para-el-uso-terapeutico-prescripcion-y-dispensacion-del-cannabis-medicinal-y-productos-farmaceuticos-que-contienen-cannabinoides.pdf'],
'needs_review',now()
from public.countries c
where c.iso2='EC'
  and not exists (select 1 from public.regulatory_pathways p where p.iso_alpha2='EC' and p.slug='depth-v1-ec-nonpsychoactive-cannabis-products');

update public.regulatory_pathways
set name='Regulated non-psychoactive cannabis/hemp product pathway',
    pathway_type='licensed_market',
    legal_basis='ARCSA-DE-002-2021-MAFG; Acuerdo Ministerial 109; medicinal-cannabis therapeutic-use regulations',
    regulator='ARCSA / Ministry of Health',
    status='active',
    effective_date='2021-02-03',
    summary='Ecuador regulates specified finished products containing non-psychoactive cannabis or hemp. ARCSA rules require operating authorization and product registration/notification as applicable; imported finished products are subject to registration/notification requirements, while applicable medicines and medicinal products are subject to pharmaceutical controls.',
    source_urls=array['https://www.controlsanitario.gob.ec/wp-content/uploads/downloads/2021/02/Resolucion-ARCSA-DE-002-2021-MAFG_Normativa-Tecnica-Sanitaria-para-la-regulacion-y-control-de-productos-terminados-de-uso-y-consumo-humano-que-contengan-Cannabis-No-Psicoactivo-o-Canamo.pdf','https://www.controlsanitario.gob.ec/wp-content/uploads/downloads/2021/06/Acuerdo-Ministerial-148_Reglamento-para-el-uso-terapeutico-prescripcion-y-dispensacion-del-cannabis-medicinal-y-productos-farmaceuticos-que-contienen-cannabinoides.pdf'],
    last_verified_at=now()
where iso_alpha2='EC' and slug='depth-v1-ec-nonpsychoactive-cannabis-products';

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'DS 404/1983 and DS 3/2010','Controlled substances and pharmaceutical registration','regulator',
'https://www.ispch.cl/anamed/medicamentos/estupefacientes-y-psicotropicos/','2011-06-25',current_date,
'ISP identifies import/export, distribution, dispensing and transport controls for controlled substances and its official cannabis procedures.'
from public.regulatory_pathways p where p.iso_alpha2='CL' and p.slug='depth-v1-cl-controlled-medical-cannabis'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://www.ispch.cl/anamed/medicamentos/estupefacientes-y-psicotropicos/');

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'ARCSA-DE-002-2021-MAFG','Arts. 8-12','regulator',
'https://www.controlsanitario.gob.ec/wp-content/uploads/downloads/2021/02/Resolucion-ARCSA-DE-002-2021-MAFG_Normativa-Tecnica-Sanitaria-para-la-regulacion-y-control-de-productos-terminados-de-uso-y-consumo-humano-que-contengan-Cannabis-No-Psicoactivo-o-Canamo.pdf','2021-02-03',current_date,
'Regulates manufacture, commercialization and import of specified finished products containing non-psychoactive cannabis/hemp and requires applicable ARCSA authorization or registration.'
from public.regulatory_pathways p where p.iso_alpha2='EC' and p.slug='depth-v1-ec-nonpsychoactive-cannabis-products'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://www.controlsanitario.gob.ec/wp-content/uploads/downloads/2021/02/Resolucion-ARCSA-DE-002-2021-MAFG_Normativa-Tecnica-Sanitaria-para-la-regulacion-y-control-de-productos-terminados-de-uso-y-consumo-humano-que-contengan-Cannabis-No-Psicoactivo-o-Canamo.pdf');

update public.regulatory_pathways p set verification='verified',last_verified_at=now()
where p.iso_alpha2 in ('CL','EC') and p.slug in ('depth-v1-cl-controlled-medical-cannabis','depth-v1-ec-nonpsychoactive-cannabis-products') and p.verification='needs_review';

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',evidence_basis='Primary government/regulator sources verified 2026-09-23.',last_evaluated_at=now(),
notes='Primary evidence tranche added; unsupported dimensions remain unresolved.'
where jurisdiction_key in ('CL','EC') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),notes='Primary evidence tranche added 2026-09-23; unsupported dimensions remain unresolved.'
where jurisdiction_key in ('CL','EC') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923153000','primary_evidence_batch_cl_ec','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923153000_primary_evidence_batch_cl_ec.sql

-- RECOVERY BEGIN 20260923160000_source_yield_metrics.sql
-- Signal Engine: per-source yield metrics for Gate 1 (source authority).
-- Spec: docs/SIGNALS_MAX_AUTOMATION_DESIGN.md §9.3
-- Additive, fail-closed. Does not change promote path.

create table if not exists public.source_yield_metrics (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null,
  window_start timestamptz not null,
  window_end timestamptz not null,
  n_snapshots integer not null default 0 check (n_snapshots >= 0),
  n_signals integer not null default 0 check (n_signals >= 0),
  n_promoted integer not null default 0 check (n_promoted >= 0),
  junk_rate numeric check (junk_rate is null or (junk_rate >= 0 and junk_rate <= 1)),
  promotion_rate numeric check (promotion_rate is null or (promotion_rate >= 0 and promotion_rate <= 1)),
  precision_proxy numeric check (precision_proxy is null or (precision_proxy >= 0 and precision_proxy <= 1)),
  freshness_hours_p50 numeric,
  metrics jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (source_id, window_start, window_end)
);

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'source_registry'
  ) and not exists (
    select 1 from pg_constraint where conname = 'source_yield_metrics_source_id_fkey'
  ) then
    alter table public.source_yield_metrics
      add constraint source_yield_metrics_source_id_fkey
      foreign key (source_id) references public.source_registry (id) on delete cascade;
  end if;
exception
  when others then
    raise notice 'source_yield_metrics FK skipped: %', sqlerrm;
end $$;

create index if not exists source_yield_metrics_source_window_idx
  on public.source_yield_metrics (source_id, window_end desc);

alter table public.source_yield_metrics enable row level security;
alter table public.source_yield_metrics force row level security;
revoke all on table public.source_yield_metrics from anon, authenticated, public;

comment on table public.source_yield_metrics is
  'Rolling yield/quality metrics per source for autonomy Gate 1. Service-role writers only.';

-- Best-effort refresh for the last 7 days. Idempotent per (source, window).
-- Does not promote signals. Safe to call from cron with service role.
create or replace function private.refresh_source_yield_metrics_7d()
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'private'
as $fn$
declare
  v_start timestamptz := date_trunc('day', now() at time zone 'utc') - interval '7 days';
  v_end timestamptz := date_trunc('day', now() at time zone 'utc') + interval '1 day';
  n int := 0;
begin
  -- Prefer signals.source_id when present; otherwise skip (no fabricated joins).
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'signals' and column_name = 'source_id'
  ) then
    insert into public.source_yield_metrics (
      source_id,
      window_start,
      window_end,
      n_signals,
      n_promoted,
      promotion_rate,
      updated_at
    )
    select
      s.source_id,
      v_start,
      v_end,
      count(*)::integer,
      count(*) filter (where s.reviewed is true)::integer,
      case
        when count(*) = 0 then null
        else (count(*) filter (where s.reviewed is true))::numeric / count(*)::numeric
      end,
      now()
    from public.signals s
    where s.source_id is not null
      and coalesce(s.created_at, s.reviewed_at, now()) >= v_start
      and coalesce(s.created_at, s.reviewed_at, now()) < v_end
    group by s.source_id
    on conflict (source_id, window_start, window_end) do update set
      n_signals = excluded.n_signals,
      n_promoted = excluded.n_promoted,
      promotion_rate = excluded.promotion_rate,
      updated_at = now();

    get diagnostics n = row_count;
  end if;

  return n;
exception
  when others then
    raise notice 'refresh_source_yield_metrics_7d: %', sqlerrm;
    return 0;
end;
$fn$;

revoke all on function private.refresh_source_yield_metrics_7d() from public, anon, authenticated;

comment on function private.refresh_source_yield_metrics_7d() is
  'Service-only yield rollup for the trailing 7-day UTC window. Observability only.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923160000','source_yield_metrics','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923160000_source_yield_metrics.sql

-- RECOVERY BEGIN 20260924073000_depth_evidence_integrity_layer.sql
-- Evidence integrity layer for the 291 x 32 depth contract.
-- Adds atomic provenance, negative evidence, conflict resolution, freshness,
-- and research-queue structures without inventing jurisdiction facts.
--
-- This migration is additive and does not modify production data.

create table if not exists public.jurisdiction_depth_evidence (
  evidence_id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete restrict,
  evidence_state text not null
    check (evidence_state in ('verified','verified_not_applicable','partial','conflict','research_required','stale','superseded')),
  applicability text not null
    check (applicability in ('applicable','not_applicable','unknown')),
  authority_level text not null
    check (authority_level in (
      'primary_legislation','primary_regulator','official_register',
      'official_guidance','official_statistics','international_body','secondary'
    )),
  source_url text not null,
  source_document_ref text,
  source_locator text,
  source_snapshot_sha256 text,
  source_excerpt text,
  claim_text text not null,
  negative_evidence boolean not null default false,
  inference_used boolean not null default false,
  effective_from date,
  effective_to date,
  published_at timestamptz,
  retrieved_at timestamptz,
  verified_at timestamptz,
  freshness_deadline timestamptz,
  supersedes_evidence_id uuid references public.jurisdiction_depth_evidence(evidence_id) on delete set null,
  conflict_group text,
  research_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (btrim(source_url) <> ''),
  check (btrim(claim_text) <> ''),
  check (effective_to is null or effective_from is null or effective_to >= effective_from),
  check (not negative_evidence or source_excerpt is not null),
  check (not inference_used or evidence_state not in ('verified','verified_not_applicable')),
  check (
    evidence_state not in ('verified','verified_not_applicable')
    or (
      verified_at is not null
      and retrieved_at is not null
      and source_snapshot_sha256 is not null
      and btrim(source_snapshot_sha256) <> ''
      and applicability <> 'unknown'
    )
  ),
  check (
    evidence_state <> 'conflict'
    or conflict_group is not null
  ),
  check (
    evidence_state <> 'research_required'
    or research_reason is not null
  )
);

create index if not exists jurisdiction_depth_evidence_lookup_idx
  on public.jurisdiction_depth_evidence(jurisdiction_key,dimension_key,evidence_state);
create index if not exists jurisdiction_depth_evidence_freshness_idx
  on public.jurisdiction_depth_evidence(freshness_deadline,evidence_state);
create index if not exists jurisdiction_depth_evidence_conflict_idx
  on public.jurisdiction_depth_evidence(conflict_group)
  where conflict_group is not null;

create table if not exists public.jurisdiction_depth_conflicts (
  conflict_id uuid primary key default gen_random_uuid(),
  conflict_group text not null unique,
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete restrict,
  conflict_type text not null
    check (conflict_type in ('source_conflict','temporal_conflict','scope_conflict','classification_conflict')),
  status text not null default 'open'
    check (status in ('open','resolved','superseded')),
  description text not null,
  resolution_basis text,
  resolution_evidence_id uuid references public.jurisdiction_depth_evidence(evidence_id) on delete set null,
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  updated_at timestamptz not null default now(),
  check ((status = 'resolved') = (resolved_at is not null)),
  check (status <> 'resolved' or resolution_basis is not null)
);

create index if not exists jurisdiction_depth_conflicts_open_idx
  on public.jurisdiction_depth_conflicts(jurisdiction_key,dimension_key,status);

create table if not exists public.jurisdiction_depth_research_queue (
  research_id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete restrict,
  reason_code text not null
    check (reason_code in (
      'missing_evidence','missing_primary_source','stale_evidence',
      'conflicting_sources','unknown_applicability','source_capture_failed',
      'scope_ambiguity','temporal_gap','entity_resolution_gap'
    )),
  priority text not null default 'normal'
    check (priority in ('critical','high','normal','low')),
  status text not null default 'queued'
    check (status in ('queued','claimed','in_review','blocked','resolved','cancelled')),
  preferred_authority text,
  research_question text not null,
  last_attempted_at timestamptz,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_review_at timestamptz,
  linked_evidence_id uuid references public.jurisdiction_depth_evidence(evidence_id) on delete set null,
  linked_conflict_id uuid references public.jurisdiction_depth_conflicts(conflict_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'resolved' or linked_evidence_id is not null)
);

create index if not exists jurisdiction_depth_research_queue_idx
  on public.jurisdiction_depth_research_queue(status,priority,next_review_at);
create unique index if not exists jurisdiction_depth_research_active_unique
  on public.jurisdiction_depth_research_queue(jurisdiction_key,dimension_key,reason_code)
  where status in ('queued','claimed','in_review','blocked');

create table if not exists public.jurisdiction_depth_source_policy (
  dimension_key text primary key references public.jurisdiction_data_depth_dimensions(dimension_key) on delete cascade,
  minimum_authority_level text not null
    check (minimum_authority_level in (
      'primary_legislation','primary_regulator','official_register',
      'official_guidance','official_statistics','international_body','secondary'
    )),
  direct_jurisdiction_evidence_required boolean not null default true,
  negative_evidence_allowed boolean not null default true,
  max_freshness_days integer,
  notes text,
  updated_at timestamptz not null default now(),
  check (max_freshness_days is null or max_freshness_days >= 0)
);

-- Establish policy for every contracted dimension. These are validation rules,
-- not claims about any jurisdiction.
insert into public.jurisdiction_depth_source_policy
(dimension_key,minimum_authority_level,direct_jurisdiction_evidence_required,negative_evidence_allowed,max_freshness_days,notes)
select
  d.dimension_key,
  case
    when d.requires_primary_source then 'primary_regulator'
    when d.layer in ('foundation','quality') then 'official_register'
    when d.layer in ('commercial','network','intelligence') then 'official_statistics'
    else 'official_guidance'
  end,
  case when d.layer='foundation' then false else true end,
  true,
  d.freshness_days,
  'Machine-checkable source policy for the 291 x 32 evidence contract.'
from public.jurisdiction_data_depth_dimensions d
on conflict (dimension_key) do update set
  minimum_authority_level=excluded.minimum_authority_level,
  direct_jurisdiction_evidence_required=excluded.direct_jurisdiction_evidence_required,
  negative_evidence_allowed=excluded.negative_evidence_allowed,
  max_freshness_days=excluded.max_freshness_days,
  notes=excluded.notes,
  updated_at=now();

alter table public.jurisdiction_depth_evidence enable row level security;
alter table public.jurisdiction_depth_evidence force row level security;
alter table public.jurisdiction_depth_conflicts enable row level security;
alter table public.jurisdiction_depth_conflicts force row level security;
alter table public.jurisdiction_depth_research_queue enable row level security;
alter table public.jurisdiction_depth_research_queue force row level security;
alter table public.jurisdiction_depth_source_policy enable row level security;
alter table public.jurisdiction_depth_source_policy force row level security;

drop policy if exists jurisdiction_depth_evidence_public_read on public.jurisdiction_depth_evidence;
create policy jurisdiction_depth_evidence_public_read
  on public.jurisdiction_depth_evidence
  for select to anon,authenticated
  using (evidence_state in ('verified','verified_not_applicable'));

drop policy if exists jurisdiction_depth_conflicts_public_read on public.jurisdiction_depth_conflicts;
create policy jurisdiction_depth_conflicts_public_read
  on public.jurisdiction_depth_conflicts
  for select to anon,authenticated
  using (status = 'resolved');

drop policy if exists jurisdiction_depth_research_queue_public_read on public.jurisdiction_depth_research_queue;
create policy jurisdiction_depth_research_queue_public_read
  on public.jurisdiction_depth_research_queue
  for select to anon,authenticated
  using (false);

drop policy if exists jurisdiction_depth_source_policy_public_read on public.jurisdiction_depth_source_policy;
create policy jurisdiction_depth_source_policy_public_read
  on public.jurisdiction_depth_source_policy
  for select to anon,authenticated
  using (true);

revoke all on public.jurisdiction_depth_evidence from anon,authenticated;
revoke all on public.jurisdiction_depth_conflicts from anon,authenticated;
revoke all on public.jurisdiction_depth_research_queue from anon,authenticated;
revoke all on public.jurisdiction_depth_source_policy from anon,authenticated;
grant select on public.jurisdiction_depth_evidence to anon,authenticated;
grant select on public.jurisdiction_depth_conflicts to anon,authenticated;
grant select on public.jurisdiction_depth_source_policy to anon,authenticated;

create or replace view public.v_jurisdiction_depth_integrity
with (security_invoker=true) as
select
  s.jurisdiction_key,
  s.dimension_key,
  s.applicability,
  s.status,
  s.evidence_count,
  s.primary_source_count,
  coalesce(e.verified_count,0) verified_evidence_count,
  coalesce(e.negative_verified_count,0) negative_verified_evidence_count,
  coalesce(e.stale_count,0) stale_evidence_count,
  coalesce(e.conflict_count,0) conflict_evidence_count,
  coalesce(r.active_research_count,0) active_research_count,
  case
    when s.applicability='unknown' then 'research_required'
    when coalesce(e.conflict_count,0)>0 then 'conflict'
    when coalesce(e.stale_count,0)>0 then 'stale'
    when coalesce(e.verified_count,0)>0 then 'verified'
    when s.status='complete' and s.applicability='not_applicable' then 'verified_not_applicable'
    else 'research_required'
  end as evidence_integrity_state
from public.jurisdiction_data_depth_dimension_state s
left join (
  select
    jurisdiction_key,
    dimension_key,
    count(*) filter(where evidence_state in ('verified','verified_not_applicable')) verified_count,
    count(*) filter(where evidence_state in ('verified','verified_not_applicable') and negative_evidence) negative_verified_count,
    count(*) filter(where evidence_state='stale' or (freshness_deadline is not null and freshness_deadline <= now())) stale_count,
    count(*) filter(where evidence_state='conflict') conflict_count
  from public.jurisdiction_depth_evidence
  group by jurisdiction_key,dimension_key
) e using (jurisdiction_key,dimension_key)
left join (
  select jurisdiction_key,dimension_key,count(*) active_research_count
  from public.jurisdiction_depth_research_queue
  where status in ('queued','claimed','in_review','blocked')
  group by jurisdiction_key,dimension_key
) r using (jurisdiction_key,dimension_key)
where s.contract_version='2026-09-23.v2';

create or replace view public.v_jurisdiction_depth_research_queue
with (security_invoker=true) as
select
  q.research_id,
  q.jurisdiction_key,
  c.country_name,
  q.dimension_key,
  d.display_name as dimension_name,
  q.reason_code,
  q.priority,
  q.status,
  q.preferred_authority,
  q.research_question,
  q.attempt_count,
  q.last_attempted_at,
  q.next_review_at,
  q.linked_evidence_id,
  q.linked_conflict_id,
  q.created_at,
  q.updated_at
from public.jurisdiction_depth_research_queue q
join public.countries c on c.iso_alpha2=q.jurisdiction_key
join public.jurisdiction_data_depth_dimensions d on d.dimension_key=q.dimension_key
where q.status in ('queued','claimed','in_review','blocked');

create or replace view public.v_depth_evidence_gate
with (security_invoker=true) as
select
  count(*) filter(where evidence_integrity_state in ('verified','verified_not_applicable')) as verified_cells,
  count(*) filter(where evidence_integrity_state='conflict') as conflict_cells,
  count(*) filter(where evidence_integrity_state='stale') as stale_cells,
  count(*) filter(where evidence_integrity_state='research_required') as research_required_cells,
  count(*) as matrix_cells,
  case
    when count(*)=9312
     and count(*) filter(where evidence_integrity_state in ('conflict','stale','research_required'))=0
    then 'GO'
    else 'HOLD'
  end as gate
from public.v_jurisdiction_depth_integrity;

grant select on public.v_jurisdiction_depth_integrity to anon,authenticated;
grant select on public.v_jurisdiction_depth_research_queue to anon,authenticated;
grant select on public.v_depth_evidence_gate to anon,authenticated;

-- Hard structural checks. This migration must never silently drift from the contract.
do $$
declare
  v_dimensions integer;
  v_cells integer;
  v_policies integer;
begin
  select count(*) into v_dimensions
  from public.jurisdiction_data_depth_dimensions
  where contract_version='2026-09-23.v2';

  select count(*) into v_cells
  from public.jurisdiction_data_depth_dimension_state
  where contract_version='2026-09-23.v2';

  select count(*) into v_policies
  from public.jurisdiction_depth_source_policy;

  if v_dimensions <> 32 then
    raise exception 'Evidence integrity gate failed: expected 32 dimensions, found %',v_dimensions;
  end if;

  if v_cells <> 9312 then
    raise exception 'Evidence integrity gate failed: expected 9312 cells, found %',v_cells;
  end if;

  if v_policies <> 32 then
    raise exception 'Evidence integrity gate failed: expected 32 source policies, found %',v_policies;
  end if;
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924073000','depth_evidence_integrity_layer','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924073000_depth_evidence_integrity_layer.sql

-- RECOVERY BEGIN 20260924073000_primary_sn_drug_code_enrichment.sql
-- Primary Senegal cannabis prohibition provenance.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='SN' and active=true;

insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values
('Senegal — Code des Drogues / government cannabis prohibition record','https://www.dri.gouv.sn/%C3%A9tiquettes/chanvre-indien','Senegal',true,'Senegal','SN','fr','monthly','verified','SN',1,false,'statute',true,
'Government institutional documentation identifies Law No. 1963/16 of 5 February 1963 repressing cultivation, possession, commerce and use of Indian hemp. Current drug-code provisions prohibit cannabis cultivation nationally and prohibit production, commerce, distribution, transport, possession, import/export and related dealings for controlled substances.','legislature');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,verified_at,expires_at,active)
values
('primary-evidence-sn-code-drogues','SN','prohibited',
'Senegal government institutional documentation identifies Law No. 1963/16 of 5 February 1963 repressing cultivation, possession, commerce and use of Indian hemp. Current Code des Drogues provisions state that cannabis cultivation is prohibited nationally and prohibit production, commerce, wholesale/retail distribution, transport, possession, acquisition, use, import, export and transit for substances in Table I. No general commercial cannabis pathway is established by the cited framework.',
'Republic of Senegal — Centre d''Informations et de Documentation sur les Institutions et la Gouvernance',
'https://www.dri.gouv.sn/%C3%A9tiquettes/chanvre-indien',now(),now()+interval '180 days',true);

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-sn-code-drogues','SN','primary-evidence-claim:sn-code-drogues',
'Senegal''s drug-control framework prohibits cannabis cultivation nationally and prohibits commercial production, trade, wholesale/retail distribution, possession, transport, import and export of controlled cannabis-related substances; the cited framework does not establish general commercial cannabis retail.',
'any','national','Republic of Senegal — government institutional documentation',
'https://www.dri.gouv.sn/%C3%A9tiquettes/chanvre-indien',now(),now(),now()+interval '180 days','verified');

update public.jurisdiction_dimension_coverage set status='verified_populated',applicability='applicable',
evidence_basis='Primary/current government institutional cannabis prohibition record and current Code des Drogues provisions.',last_evaluated_at=now()
where jurisdiction_key='SN' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims');

update public.jurisdiction_dimension_coverage set status='verified_empty',applicability='applicable',
evidence_basis='Cited Senegal drug-control framework establishes prohibition rather than a commercial cannabis pathway or commercial product-format framework.',last_evaluated_at=now()
where jurisdiction_key='SN' and dimension_key in ('verified_pathways','verified_format_rules');

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key='SN' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules')
and status in ('open','in_progress','blocked');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924073000','primary_sn_drug_code_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924073000_primary_sn_drug_code_enrichment.sql

-- RECOVERY BEGIN 20260924073001_primary_sn_drug_code_enrichment.sql
-- Primary Senegal cannabis prohibition provenance.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='SN' and active=true;

insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values
('Senegal — Code des Drogues / government cannabis prohibition record','https://www.dri.gouv.sn/%C3%A9tiquettes/chanvre-indien','Senegal',true,'Senegal','SN','fr','monthly','verified','SN',1,false,'statute',true,
'Government institutional documentation identifies Law No. 1963/16 of 5 February 1963 repressing cultivation, possession, commerce and use of Indian hemp. Current drug-code provisions prohibit cannabis cultivation nationally and prohibit production, commerce, distribution, transport, possession, import/export and related dealings for controlled substances.','legislature');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,verified_at,expires_at,active)
values
('primary-evidence-sn-code-drogues','SN','prohibited',
'Senegal government institutional documentation identifies Law No. 1963/16 of 5 February 1963 repressing cultivation, possession, commerce and use of Indian hemp. Current Code des Drogues provisions state that cannabis cultivation is prohibited nationally and prohibit production, commerce, wholesale/retail distribution, transport, possession, acquisition, use, import, export and transit for substances in Table I. No general commercial cannabis pathway is established by the cited framework.',
'Republic of Senegal — Centre d''Informations et de Documentation sur les Institutions et la Gouvernance',
'https://www.dri.gouv.sn/%C3%A9tiquettes/chanvre-indien',now(),now()+interval '180 days',true);

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-sn-code-drogues','SN','primary-evidence-claim:sn-code-drogues',
'Senegal''s drug-control framework prohibits cannabis cultivation nationally and prohibits commercial production, trade, wholesale/retail distribution, possession, transport, import and export of controlled cannabis-related substances; the cited framework does not establish general commercial cannabis retail.',
'any','national','Republic of Senegal — government institutional documentation',
'https://www.dri.gouv.sn/%C3%A9tiquettes/chanvre-indien',now(),now(),now()+interval '180 days','verified');

update public.jurisdiction_dimension_coverage set status='verified_populated',applicability='applicable',
evidence_basis='Primary/current government institutional cannabis prohibition record and current Code des Drogues provisions.',last_evaluated_at=now()
where jurisdiction_key='SN' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims');

update public.jurisdiction_dimension_coverage set status='verified_empty',applicability='applicable',
evidence_basis='Cited Senegal drug-control framework establishes prohibition rather than a commercial cannabis pathway or commercial product-format framework.',last_evaluated_at=now()
where jurisdiction_key='SN' and dimension_key in ('verified_pathways','verified_format_rules');

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key='SN' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules')
and status in ('open','in_progress','blocked');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924073001','primary_sn_drug_code_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924073001_primary_sn_drug_code_enrichment.sql

-- RECOVERY BEGIN 20260924083000_primary_sg_mda_2026_enrichment.sql
-- Primary Singapore regulatory provenance: Misuse of Drugs Act 1973 current version.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='SG' and active=true;

insert into public.source_registry (
source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class
) values (
'Singapore Statutes Online — Misuse of Drugs Act 1973',
'https://sso.agc.gov.sg/Act/MDA1973?ProvIds=pr10A-&ValidDate=20260601',
'Singapore',true,'Singapore','SG','en','monthly','verified','SG',1,false,'statute',true,
'Current official legislation version as at 19 September 2026. The Act contains offences for trafficking, manufacture, import/export, possession, consumption and cultivation of cannabis; cannabis is a controlled drug.',
'legislature'
) on conflict (source_url) do update set is_active=true,jurisdiction_code='SG',verification_notes=excluded.verification_notes,updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values (
'primary-evidence-sg-mda-2026','SG','prohibited',
'Singapore''s current Misuse of Drugs Act 1973 controls cannabis as a controlled drug and establishes offences covering trafficking, manufacture, import/export, possession, consumption and cultivation. The current official legislation is stated as at 19 September 2026. The cited framework does not establish general commercial cannabis access.',
'Singapore Attorney-General''s Chambers — Singapore Statutes Online',
'https://sso.agc.gov.sg/Act/MDA1973?ProvIds=pr10A-&ValidDate=20260601',
'2026-09-19',now(),now()+interval '180 days',true
);

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values (
'primary-evidence-sg-mda-2026','SG','primary-evidence-claim:sg-mda-2026',
'Singapore''s current Misuse of Drugs Act controls cannabis and provides offences for trafficking, manufacture, import/export, possession, consumption and cultivation; the cited law does not establish general commercial cannabis retail.',
'any','national','Singapore Attorney-General''s Chambers — Singapore Statutes Online',
'https://sso.agc.gov.sg/Act/MDA1973?ProvIds=pr10A-&ValidDate=20260601',
'2026-09-19',now(),now(),now()+interval '180 days','verified'
);

insert into public.regulatory_calendar
(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'SG','effective','Misuse of Drugs Act — current legislation version verified as at 19 September 2026',
'2026-09-19','confirmed',
'https://sso.agc.gov.sg/Act/MDA1973?ProvIds=pr10A-&ValidDate=20260601',
'Singapore Attorney-General''s Chambers — Singapore Statutes Online','effective'
where not exists (
select 1 from public.regulatory_calendar where iso2='SG' and title='Misuse of Drugs Act — current legislation version verified as at 19 September 2026'
);

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
evidence_basis='Primary Singapore Statutes Online source: current Misuse of Drugs Act 1973.',
last_evaluated_at=now()
where jurisdiction_key='SG'
and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar');

update public.jurisdiction_dimension_coverage
set status='verified_empty',applicability='applicable',
evidence_basis='Primary Singapore Misuse of Drugs Act establishes controlled-drug prohibitions/offences but no general commercial cannabis pathway or commercial cannabis product-format framework.',
last_evaluated_at=now()
where jurisdiction_key='SG'
and dimension_key in ('verified_pathways','verified_format_rules');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now()
where jurisdiction_key='SG'
and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar','verified_pathways','verified_format_rules')
and status in ('open','in_progress','blocked');

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924083000','primary_sg_mda_2026_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924083000_primary_sg_mda_2026_enrichment.sql

-- RECOVERY BEGIN 20260924130000_backfill_291x32_matrix_state.sql
-- Repair the production 291x32 state matrix after the initial control-plane migration
-- was unable to materialize rows under the project's RLS execution context.
-- This migration is idempotent and does not create regulatory facts.
create or replace function public.__harbourview_backfill_291x32_matrix()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as 'declare v_j integer; v_m integer;
begin
  execute ''alter table public.jurisdiction_data_depth_dimension_state disable row level security'';
  insert into public.jurisdiction_data_depth_dimension_state
    (jurisdiction_key, dimension_key, contract_version)
  select c.iso_alpha2, d.dimension_key, d.contract_version
  from public.countries c
  cross join public.jurisdiction_data_depth_dimensions d
  where d.contract_version = ''2026-09-23.v2''
  on conflict (jurisdiction_key, dimension_key, contract_version) do nothing;

  update public.jurisdiction_data_depth_dimension_state s
  set applicability = ''applicable'',
      status = ''complete'',
      evidence_basis = ''canonical countries registry'',
      last_evaluated_at = now(),
      updated_at = now()
  where s.contract_version = ''2026-09-23.v2''
    and s.dimension_key = ''identity'';

  update public.jurisdiction_data_depth_dimension_state s
  set applicability = ''applicable'',
      status = ''complete'',
      evidence_basis = ''canonical jurisdiction registry'',
      last_evaluated_at = now(),
      updated_at = now()
  where s.contract_version = ''2026-09-23.v2''
    and s.dimension_key = ''hierarchy'';

  update public.jurisdiction_data_depth_dimension_state s
  set applicability = ''applicable'',
      status = case
        when c.verified_regulatory_tier is not null
         and c.regulatory_tier_evidence_key is not null then ''complete''
        else ''missing''
      end,
      evidence_count = case when c.regulatory_tier_evidence_key is not null then 1 else 0 end,
      primary_source_count = case when c.regulatory_tier_evidence_key is not null then 1 else 0 end,
      evidence_basis = case
        when c.regulatory_tier_evidence_key is not null then ''countries.regulatory_tier_evidence_key''
        else ''missing authoritative tier evidence''
      end,
      last_evaluated_at = now(),
      updated_at = now()
  from public.countries c
  where s.jurisdiction_key = c.iso_alpha2
    and s.dimension_key = ''regulatory_tier''
    and s.contract_version = ''2026-09-23.v2'';

  select count(distinct jurisdiction_key), count(*)
    into v_j, v_m
  from public.jurisdiction_data_depth_dimension_state
  where contract_version = ''2026-09-23.v2'';

  if v_j <> 291 or v_m <> 9312 then
    raise exception ''291x32 backfill failed: jurisdictions %, matrix rows %, expected 291/9312'', v_j, v_m;
  end if;

  execute ''alter table public.jurisdiction_data_depth_dimension_state enable row level security'';
  execute ''alter table public.jurisdiction_data_depth_dimension_state force row level security'';
end';
select public.__harbourview_backfill_291x32_matrix();
drop function public.__harbourview_backfill_291x32_matrix();

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924130000','backfill_291x32_matrix_state','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924130000_backfill_291x32_matrix_state.sql

-- RECOVERY BEGIN 20260924130001_full_depth_v2_capture_control_plane.sql
-- V2 authoritative full-depth capture control plane.
-- Binds the 9,312-cell capture queue to the production 2026-09-23.v2 contract.
-- No row is considered complete without verified evidence and source lineage.

create table if not exists public.jurisdiction_data_depth_capture_jobs (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete cascade,
  contract_version text not null default '2026-09-23.v2',
  status text not null default 'queued'
    check (status in ('queued','capturing','captured','needs_review','complete','blocked')),
  source_registry_id uuid references public.source_registry(id) on delete set null,
  source_snapshot_id uuid references public.source_snapshots(id) on delete set null,
  attempts integer not null default 0,
  last_error text,
  extracted_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(jurisdiction_key,dimension_key,contract_version)
);

create index if not exists jurisdiction_data_depth_capture_jobs_status_idx
  on public.jurisdiction_data_depth_capture_jobs(contract_version,status,updated_at);

insert into public.jurisdiction_data_depth_capture_jobs(jurisdiction_key,dimension_key,contract_version)
select c.iso_alpha2,d.dimension_key,d.contract_version
from public.countries c
cross join public.jurisdiction_data_depth_dimensions d
where c.iso_alpha2 is not null
  and d.contract_version='2026-09-23.v2'
on conflict (jurisdiction_key,dimension_key,contract_version) do nothing;

create table if not exists public.jurisdiction_data_depth_evidence (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete cascade,
  contract_version text not null default '2026-09-23.v2',
  evidence_kind text not null check (evidence_kind in ('authority_rule','authority_statement','structural_fact','verified_research')),
  applicability text not null check (applicability in ('applicable','not_applicable')),
  evidence_payload jsonb not null,
  evidence_quote text not null,
  source_registry_id uuid not null references public.source_registry(id) on delete restrict,
  source_snapshot_id uuid not null references public.source_snapshots(id) on delete restrict,
  source_url text not null check (source_url ~ '^https://'),
  effective_from date,
  effective_to date,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','superseded','conflict')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists jurisdiction_data_depth_evidence_current_unique_v2
  on public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version)
  where verification_status='verified';

create index if not exists jurisdiction_data_depth_evidence_snapshot_idx_v2
  on public.jurisdiction_data_depth_evidence(source_snapshot_id);

create table if not exists public.jurisdiction_data_depth_applicability_evidence (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete cascade,
  contract_version text not null default '2026-09-23.v2',
  applicability text not null check (applicability in ('applicable','not_applicable')),
  basis_type text not null check (basis_type in ('authoritative_rule','authority_statement','structural_fact','verified_research')),
  basis_text text not null,
  source_url text not null check (source_url ~ '^https://'),
  source_snapshot_id uuid not null references public.source_snapshots(id) on delete restrict,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected','conflict')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(jurisdiction_key,dimension_key,contract_version)
);

create or replace function public.enforce_full_depth_v2_provenance()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  snapshot_source uuid;
  registered_url text;
begin
  if new.verification_status='verified' then
    if new.source_snapshot_id is null or new.verified_at is null then
      raise exception 'verified full-depth evidence requires snapshot lineage and verified_at';
    end if;
    select ss.source_id,sr.source_url
      into snapshot_source,registered_url
    from public.source_snapshots ss
    left join public.source_registry sr on sr.id=ss.source_id
    where ss.id=new.source_snapshot_id;
    if snapshot_source is null or registered_url is null then
      raise exception 'verified full-depth evidence requires valid snapshot/source lineage';
    end if;
    if tg_table_name='jurisdiction_data_depth_evidence'
       and new.source_registry_id is distinct from snapshot_source then
      raise exception 'verified full-depth evidence source_registry_id must match snapshot source_id';
    end if;
    if new.source_url is distinct from registered_url then
      raise exception 'verified full-depth evidence source_url must match registered source_url';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_full_depth_v2_provenance() from public,anon,authenticated;
grant execute on function public.enforce_full_depth_v2_provenance() to service_role;

drop trigger if exists jurisdiction_data_depth_evidence_v2_provenance_trg on public.jurisdiction_data_depth_evidence;
create trigger jurisdiction_data_depth_evidence_v2_provenance_trg
before insert or update on public.jurisdiction_data_depth_evidence
for each row execute function public.enforce_full_depth_v2_provenance();

drop trigger if exists jurisdiction_data_depth_applicability_v2_provenance_trg on public.jurisdiction_data_depth_applicability_evidence;
create trigger jurisdiction_data_depth_applicability_v2_provenance_trg
before insert or update on public.jurisdiction_data_depth_applicability_evidence
for each row execute function public.enforce_full_depth_v2_provenance();

create or replace view public.v_jurisdiction_data_depth_v2_evidence_gate
with (security_invoker=on) as
select
  e.jurisdiction_key,e.dimension_key,e.contract_version,e.verification_status,
  e.applicability,e.source_registry_id,e.source_snapshot_id,e.source_url,
  coalesce(
    lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
    and ss.captured_at is not null
    and ss.fetch_status='success'
    and ss.captured_text is not null
    and length(ss.captured_text)>0
    and sr.id is not null
    and sr.source_url=e.source_url,
    false
  ) qualifying_provenance,
  case
    when e.verification_status='conflict' then 'CONFLICT'
    when e.verification_status<>'verified' then 'UNVERIFIED'
    when not coalesce(
      lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
      and ss.captured_at is not null
      and ss.fetch_status='success'
      and ss.captured_text is not null
      and length(ss.captured_text)>0
      and sr.id is not null
      and sr.source_url=e.source_url,
      false
    ) then 'PROVENANCE_NOT_QUALIFIED'
    else 'OK'
  end gate_code
from public.jurisdiction_data_depth_evidence e
left join public.source_snapshots ss on ss.id=e.source_snapshot_id
left join public.source_registry sr on sr.id=ss.source_id
where e.contract_version='2026-09-23.v2';

create or replace view public.v_jurisdiction_data_depth_v2_capture_status
with (security_invoker=on) as
select
  count(*) total_jobs,
  count(*) filter(where status='queued') queued,
  count(*) filter(where status='capturing') capturing,
  count(*) filter(where status='captured') captured,
  count(*) filter(where status='needs_review') needs_review,
  count(*) filter(where status='complete') complete,
  count(*) filter(where status='blocked') blocked,
  count(*) filter(where status in ('queued','capturing','captured','needs_review','blocked')) unresolved
from public.jurisdiction_data_depth_capture_jobs
where contract_version='2026-09-23.v2';

alter table public.jurisdiction_data_depth_capture_jobs enable row level security;
drop policy if exists jurisdiction_data_depth_capture_jobs_read on public.jurisdiction_data_depth_capture_jobs;
create policy jurisdiction_data_depth_capture_jobs_read
on public.jurisdiction_data_depth_capture_jobs for select to authenticated using (true);
grant select on public.jurisdiction_data_depth_capture_jobs,public.v_jurisdiction_data_depth_v2_capture_status to authenticated,service_role;
revoke insert,update,delete on public.jurisdiction_data_depth_capture_jobs from anon,authenticated;

alter table public.jurisdiction_data_depth_evidence enable row level security;
drop policy if exists jurisdiction_data_depth_evidence_read on public.jurisdiction_data_depth_evidence;
create policy jurisdiction_data_depth_evidence_read
on public.jurisdiction_data_depth_evidence for select to anon,authenticated using (true);
grant select on public.jurisdiction_data_depth_evidence,public.v_jurisdiction_data_depth_v2_evidence_gate to anon,authenticated,service_role;

alter table public.jurisdiction_data_depth_applicability_evidence enable row level security;
drop policy if exists jurisdiction_data_depth_applicability_read on public.jurisdiction_data_depth_applicability_evidence;
create policy jurisdiction_data_depth_applicability_read
on public.jurisdiction_data_depth_applicability_evidence for select to anon,authenticated using (true);
grant select on public.jurisdiction_data_depth_applicability_evidence to anon,authenticated,service_role;

do $$
declare v_jobs bigint; v_dims bigint; v_jur bigint;
begin
 select count(*) into v_jobs from public.jurisdiction_data_depth_capture_jobs where contract_version='2026-09-23.v2';
 select count(*) into v_dims from public.jurisdiction_data_depth_dimensions where contract_version='2026-09-23.v2';
 select count(*) into v_jur from public.countries;
 if v_dims<>32 or v_jur<>291 or v_jobs<>9312 then
   raise exception 'V2 capture contract gate failed: dimensions %, jurisdictions %, jobs %; expected 32/291/9312',v_dims,v_jur,v_jobs;
 end if;
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924130001','full_depth_v2_capture_control_plane','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924130001_full_depth_v2_capture_control_plane.sql

-- RECOVERY BEGIN 20260924130500_full_depth_v2_capture_control_plane.sql
-- V2 authoritative full-depth capture control plane.
-- Binds the 9,312-cell capture queue to the production 2026-09-23.v2 contract.
-- No row is considered complete without verified evidence and source lineage.

create table if not exists public.jurisdiction_data_depth_capture_jobs (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete cascade,
  contract_version text not null default '2026-09-23.v2',
  status text not null default 'queued'
    check (status in ('queued','capturing','captured','needs_review','complete','blocked')),
  source_registry_id uuid references public.source_registry(id) on delete set null,
  source_snapshot_id uuid references public.source_snapshots(id) on delete set null,
  attempts integer not null default 0,
  last_error text,
  extracted_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(jurisdiction_key,dimension_key,contract_version)
);

create index if not exists jurisdiction_data_depth_capture_jobs_status_idx
  on public.jurisdiction_data_depth_capture_jobs(contract_version,status,updated_at);

insert into public.jurisdiction_data_depth_capture_jobs(jurisdiction_key,dimension_key,contract_version)
select c.iso_alpha2,d.dimension_key,d.contract_version
from public.countries c
cross join public.jurisdiction_data_depth_dimensions d
where c.iso_alpha2 is not null
  and d.contract_version='2026-09-23.v2'
on conflict (jurisdiction_key,dimension_key,contract_version) do nothing;

create table if not exists public.jurisdiction_data_depth_evidence (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete cascade,
  contract_version text not null default '2026-09-23.v2',
  evidence_kind text not null check (evidence_kind in ('authority_rule','authority_statement','structural_fact','verified_research')),
  applicability text not null check (applicability in ('applicable','not_applicable')),
  evidence_payload jsonb not null,
  evidence_quote text not null,
  source_registry_id uuid not null references public.source_registry(id) on delete restrict,
  source_snapshot_id uuid not null references public.source_snapshots(id) on delete restrict,
  source_url text not null check (source_url ~ '^https://'),
  effective_from date,
  effective_to date,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','superseded','conflict')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists jurisdiction_data_depth_evidence_current_unique_v2
  on public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version)
  where verification_status='verified';

create index if not exists jurisdiction_data_depth_evidence_snapshot_idx_v2
  on public.jurisdiction_data_depth_evidence(source_snapshot_id);

create table if not exists public.jurisdiction_data_depth_applicability_evidence (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete cascade,
  contract_version text not null default '2026-09-23.v2',
  applicability text not null check (applicability in ('applicable','not_applicable')),
  basis_type text not null check (basis_type in ('authoritative_rule','authority_statement','structural_fact','verified_research')),
  basis_text text not null,
  source_url text not null check (source_url ~ '^https://'),
  source_snapshot_id uuid not null references public.source_snapshots(id) on delete restrict,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected','conflict')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(jurisdiction_key,dimension_key,contract_version)
);

create or replace function public.enforce_full_depth_v2_provenance()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  snapshot_source uuid;
  registered_url text;
begin
  if new.verification_status='verified' then
    if new.source_snapshot_id is null or new.verified_at is null then
      raise exception 'verified full-depth evidence requires snapshot lineage and verified_at';
    end if;
    select ss.source_id,sr.source_url
      into snapshot_source,registered_url
    from public.source_snapshots ss
    left join public.source_registry sr on sr.id=ss.source_id
    where ss.id=new.source_snapshot_id;
    if snapshot_source is null or registered_url is null then
      raise exception 'verified full-depth evidence requires valid snapshot/source lineage';
    end if;
    if tg_table_name='jurisdiction_data_depth_evidence'
       and new.source_registry_id is distinct from snapshot_source then
      raise exception 'verified full-depth evidence source_registry_id must match snapshot source_id';
    end if;
    if new.source_url is distinct from registered_url then
      raise exception 'verified full-depth evidence source_url must match registered source_url';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_full_depth_v2_provenance() from public,anon,authenticated;
grant execute on function public.enforce_full_depth_v2_provenance() to service_role;

drop trigger if exists jurisdiction_data_depth_evidence_v2_provenance_trg on public.jurisdiction_data_depth_evidence;
create trigger jurisdiction_data_depth_evidence_v2_provenance_trg
before insert or update on public.jurisdiction_data_depth_evidence
for each row execute function public.enforce_full_depth_v2_provenance();

drop trigger if exists jurisdiction_data_depth_applicability_v2_provenance_trg on public.jurisdiction_data_depth_applicability_evidence;
create trigger jurisdiction_data_depth_applicability_v2_provenance_trg
before insert or update on public.jurisdiction_data_depth_applicability_evidence
for each row execute function public.enforce_full_depth_v2_provenance();

create or replace view public.v_jurisdiction_data_depth_v2_evidence_gate
with (security_invoker=on) as
select
  e.jurisdiction_key,e.dimension_key,e.contract_version,e.verification_status,
  e.applicability,e.source_registry_id,e.source_snapshot_id,e.source_url,
  coalesce(
    lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
    and ss.captured_at is not null
    and ss.fetch_status='success'
    and ss.captured_text is not null
    and length(ss.captured_text)>0
    and sr.id is not null
    and sr.source_url=e.source_url,
    false
  ) qualifying_provenance,
  case
    when e.verification_status='conflict' then 'CONFLICT'
    when e.verification_status<>'verified' then 'UNVERIFIED'
    when not coalesce(
      lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
      and ss.captured_at is not null
      and ss.fetch_status='success'
      and ss.captured_text is not null
      and length(ss.captured_text)>0
      and sr.id is not null
      and sr.source_url=e.source_url,
      false
    ) then 'PROVENANCE_NOT_QUALIFIED'
    else 'OK'
  end gate_code
from public.jurisdiction_data_depth_evidence e
left join public.source_snapshots ss on ss.id=e.source_snapshot_id
left join public.source_registry sr on sr.id=ss.source_id
where e.contract_version='2026-09-23.v2';

create or replace view public.v_jurisdiction_data_depth_v2_capture_status
with (security_invoker=on) as
select
  count(*) total_jobs,
  count(*) filter(where status='queued') queued,
  count(*) filter(where status='capturing') capturing,
  count(*) filter(where status='captured') captured,
  count(*) filter(where status='needs_review') needs_review,
  count(*) filter(where status='complete') complete,
  count(*) filter(where status='blocked') blocked,
  count(*) filter(where status in ('queued','capturing','captured','needs_review','blocked')) unresolved
from public.jurisdiction_data_depth_capture_jobs
where contract_version='2026-09-23.v2';

alter table public.jurisdiction_data_depth_capture_jobs enable row level security;
drop policy if exists jurisdiction_data_depth_capture_jobs_read on public.jurisdiction_data_depth_capture_jobs;
create policy jurisdiction_data_depth_capture_jobs_read
on public.jurisdiction_data_depth_capture_jobs for select to authenticated using (true);
grant select on public.jurisdiction_data_depth_capture_jobs,public.v_jurisdiction_data_depth_v2_capture_status to authenticated,service_role;
revoke insert,update,delete on public.jurisdiction_data_depth_capture_jobs from anon,authenticated;

alter table public.jurisdiction_data_depth_evidence enable row level security;
drop policy if exists jurisdiction_data_depth_evidence_read on public.jurisdiction_data_depth_evidence;
create policy jurisdiction_data_depth_evidence_read
on public.jurisdiction_data_depth_evidence for select to anon,authenticated using (true);
grant select on public.jurisdiction_data_depth_evidence,public.v_jurisdiction_data_depth_v2_evidence_gate to anon,authenticated,service_role;

alter table public.jurisdiction_data_depth_applicability_evidence enable row level security;
drop policy if exists jurisdiction_data_depth_applicability_read on public.jurisdiction_data_depth_applicability_evidence;
create policy jurisdiction_data_depth_applicability_read
on public.jurisdiction_data_depth_applicability_evidence for select to anon,authenticated using (true);
grant select on public.jurisdiction_data_depth_applicability_evidence to anon,authenticated,service_role;

do $$
declare v_jobs bigint; v_dims bigint; v_jur bigint;
begin
 select count(*) into v_jobs from public.jurisdiction_data_depth_capture_jobs where contract_version='2026-09-23.v2';
 select count(*) into v_dims from public.jurisdiction_data_depth_dimensions where contract_version='2026-09-23.v2';
 select count(*) into v_jur from public.countries;
 if v_dims<>32 or v_jur<>291 or v_jobs<>9312 then
   raise exception 'V2 capture contract gate failed: dimensions %, jurisdictions %, jobs %; expected 32/291/9312',v_dims,v_jur,v_jobs;
 end if;
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924130500','full_depth_v2_capture_control_plane','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924130500_full_depth_v2_capture_control_plane.sql

-- RECOVERY BEGIN 20260924133000_reconcile_291x32_coverage_states.sql
-- Reconcile legacy jurisdiction_dimension_coverage states into the v2 291x32 matrix.
-- verified_populated and verified_empty are explicit evidence outcomes; open remains unresolved.
alter table public.jurisdiction_data_depth_dimension_state disable row level security;

with mapped as (
  select
    c.jurisdiction_key,
    case c.dimension_key
      when 'verified_regulatory_evidence' then 'regulatory_status'
      when 'verified_regulatory_claims' then 'claims'
      when 'verified_pathways' then 'pathways'
      when 'verified_format_rules' then 'format_rules'
      when 'market_metrics' then 'market_metrics'
      when 'trade_flows' then 'trade_flows'
      when 'signals' then 'signals'
      when 'source_registry' then 'source_registry'
      when 'source_snapshots' then 'source_snapshot'
      when 'regulatory_calendar' then 'calendar'
    end as dimension_key,
    c.status,
    c.applicability,
    c.evidence_basis,
    c.parent_jurisdiction_key,
    c.last_evaluated_at
  from public.jurisdiction_dimension_coverage c
  where c.dimension_key in (
    'verified_regulatory_evidence','verified_regulatory_claims','verified_pathways',
    'verified_format_rules','market_metrics','trade_flows','signals','source_registry',
    'source_snapshots','regulatory_calendar'
  )
)
update public.jurisdiction_data_depth_dimension_state s
set applicability=coalesce(mapped.applicability,'unknown'),
    status=case
      when mapped.applicability='not_applicable' then 'complete'
      when mapped.status in ('verified_populated','verified_empty') then 'complete'
      when mapped.status in ('complete','missing','blocked','stale','conflict') then mapped.status
      else 'unmeasured'
    end,
    evidence_basis=mapped.evidence_basis,
    parent_jurisdiction_key=mapped.parent_jurisdiction_key,
    last_evaluated_at=coalesce(mapped.last_evaluated_at,now()),
    updated_at=now()
from mapped
where s.jurisdiction_key=mapped.jurisdiction_key
  and s.dimension_key=mapped.dimension_key
  and s.contract_version='2026-09-23.v2'
  and mapped.dimension_key is not null;

alter table public.jurisdiction_data_depth_dimension_state enable row level security;
alter table public.jurisdiction_data_depth_dimension_state force row level security;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924133000','reconcile_291x32_coverage_states','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924133000_reconcile_291x32_coverage_states.sql

-- RECOVERY BEGIN 20260924140000_safe_291x32_contract_reconciliation.sql
-- Safely reconcile the 291 x 32 control-plane contract.
-- This migration is idempotent and is safe whether the prior 33-dimension
-- migration was applied or rolled back. It never creates regulatory facts.

-- Remove the accidental analyst-synthesis dimension from the contracted matrix
-- before removing its dimension definition. It remains outside this matrix.
delete from public.jurisdiction_data_depth_dimension_state
where dimension_key='jurisdiction_intelligence';

delete from public.jurisdiction_data_depth_dimensions
where dimension_key='jurisdiction_intelligence';

-- The dimension registry is keyed by dimension_key, not contract version.
-- Never relabel every historical row: doing so can collide with an existing
-- v2 state row. The exact contract version is assigned only to the 32 keys.
update public.jurisdiction_data_depth_dimensions
set contract_version='2026-09-23.v2'
where dimension_key in (
  'identity','hierarchy','regulatory_status','regulatory_tier',
  'source_registry','source_snapshot','claims','pathways','format_rules',
  'access_rules','commercial_activity','import','export','distribution',
  'testing','packaging_labeling','tax_fees','regulator','calendar',
  'change_history','market_metrics','trade_flows','participants','buyers',
  'sellers','counterparties','relationships','opportunities','signals',
  'freshness','uncertainty','research_queue'
);

-- If an earlier contract-version transition left v1 state rows, copy only
-- rows that do not already have a v2 equivalent, then remove the v1 rows.
-- This avoids a primary-key collision when v2 rows were pre-created.
insert into public.jurisdiction_data_depth_dimension_state (
  jurisdiction_key, dimension_key, contract_version, applicability, status,
  blocker_reason, evidence_count, primary_source_count, latest_verified_at,
  freshness_deadline, confidence, evidence_basis, parent_jurisdiction_key,
  last_evaluated_at, updated_at
)
select
  old.jurisdiction_key, old.dimension_key, '2026-09-23.v2',
  old.applicability, old.status, old.blocker_reason, old.evidence_count,
  old.primary_source_count, old.latest_verified_at, old.freshness_deadline,
  old.confidence, old.evidence_basis, old.parent_jurisdiction_key,
  old.last_evaluated_at, old.updated_at
from public.jurisdiction_data_depth_dimension_state old
where old.contract_version='2026-09-22.v1'
  and exists (
    select 1
    from public.jurisdiction_data_depth_dimensions d
    where d.dimension_key=old.dimension_key
      and d.contract_version='2026-09-23.v2'
  )
  and not exists (
    select 1
    from public.jurisdiction_data_depth_dimension_state current_state
    where current_state.jurisdiction_key=old.jurisdiction_key
      and current_state.dimension_key=old.dimension_key
      and current_state.contract_version='2026-09-23.v2'
  );

delete from public.jurisdiction_data_depth_dimension_state
where contract_version='2026-09-22.v1';

-- Guarantee the matrix has one state row for every canonical jurisdiction
-- and every one of the exact 32 dimensions.
insert into public.jurisdiction_data_depth_dimension_state
(jurisdiction_key,dimension_key,contract_version)
select c.iso_alpha2,d.dimension_key,'2026-09-23.v2'
from public.countries c
cross join public.jurisdiction_data_depth_dimensions d
where d.contract_version='2026-09-23.v2'
on conflict (jurisdiction_key,dimension_key,contract_version) do nothing;

do $$
declare
  dimension_count integer;
  jurisdiction_count integer;
  matrix_count integer;
  expected_count integer;
  invalid_extra integer;
begin
  select count(*) into dimension_count
  from public.jurisdiction_data_depth_dimensions
  where contract_version='2026-09-23.v2';

  select count(*) into jurisdiction_count
  from public.countries;

  select count(*) into matrix_count
  from public.jurisdiction_data_depth_dimension_state
  where contract_version='2026-09-23.v2';

  expected_count := jurisdiction_count * dimension_count;

  select count(*) into invalid_extra
  from public.jurisdiction_data_depth_dimensions
  where contract_version='2026-09-23.v2'
    and dimension_key='jurisdiction_intelligence';

  if dimension_count <> 32 then
    raise exception '291x32 contract invariant failed: expected 32 dimensions, found %', dimension_count;
  end if;

  if jurisdiction_count <> 291 then
    raise exception '291x32 contract invariant failed: expected 291 jurisdictions, found %', jurisdiction_count;
  end if;

  if matrix_count <> expected_count then
    raise exception '291x32 matrix invariant failed: expected % rows, found %', expected_count, matrix_count;
  end if;

  if invalid_extra <> 0 then
    raise exception '291x32 contract invariant failed: jurisdiction_intelligence remains in the contracted dimensions';
  end if;
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924140000','safe_291x32_contract_reconciliation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924140000_safe_291x32_contract_reconciliation.sql

-- RECOVERY BEGIN 20260924140209_fix_full_depth_acquisition_targeting_20260924.sql
create or replace function public.acquire_full_depth_crawl_targets(
  p_limit integer default 8,
  p_worker_id text default 'full-depth'
)
returns setof public.source_registry
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz := now();
  v_lease_end timestamptz := now() + interval '2 minutes';
  v_ids uuid[];
begin
  if p_limit is null or p_limit < 1 or p_limit > 8 then
    raise exception 'p_limit must be between 1 and 8';
  end if;

  select array_agg(id) into v_ids
  from (
    select sr.id
    from public.source_registry sr
    where sr.is_active
      and sr.crawl_allowed
      and sr.source_url is not null
      and sr.source_url ~ '^https://'
      and (sr.next_crawl_at is null or sr.next_crawl_at <= v_now)
      and (sr.locked_until is null or sr.locked_until < v_now)
      and exists (
        select 1
        from public.jurisdiction_data_depth_capture_jobs j
        where j.status = 'queued'
          and (
            j.jurisdiction_key = sr.jurisdiction_code
            or j.jurisdiction_key = sr.iso
          )
      )
    order by
      case
        when sr.regulator_class in ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export') then 0
        when sr.source_type in ('government','regulator','government_legal') then 1
        else 2
      end,
      sr.tier asc nulls last,
      sr.next_crawl_at asc nulls first,
      sr.id
    limit p_limit
    for update skip locked
  ) q;

  if v_ids is null or array_length(v_ids,1) is null then
    return;
  end if;

  update public.source_registry
  set locked_by = p_worker_id,
      locked_until = v_lease_end,
      updated_at = v_now
  where id = any(v_ids);

  return query
    select *
    from public.source_registry
    where id = any(v_ids);
end;
$$;

revoke all on function public.acquire_full_depth_crawl_targets(integer,text) from public;
grant execute on function public.acquire_full_depth_crawl_targets(integer,text) to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924140209','fix_full_depth_acquisition_targeting_20260924','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924140209_fix_full_depth_acquisition_targeting_20260924.sql

-- RECOVERY BEGIN 20260924140303_schedule_full_depth_source_capture_20260924.sql
select cron.schedule(
  'harbourview-full-depth-source-capture',
  '*/2 * * * *',
  $job$
    select net.http_post(
      url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/source-snapshot-capture?limit=8',
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'x-harbourview-operator-secret',
        (select decrypted_secret from vault.decrypted_secrets where name='harbourview_source_engine_cron_secret' limit 1)
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 15000
    );
  $job$
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924140303','schedule_full_depth_source_capture_20260924','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924140303_schedule_full_depth_source_capture_20260924.sql

-- RECOVERY BEGIN 20260924140357_grant_source_engine_cron_verifier_20260924.sql
grant execute on function public.verify_source_engine_cron_secret(text) to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924140357','grant_source_engine_cron_verifier_20260924','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924140357_grant_source_engine_cron_verifier_20260924.sql

-- RECOVERY BEGIN 20260924141108_fix_evidence_extraction_adjudication_20260924.sql
create table if not exists public.jurisdiction_data_depth_extraction_candidates (
  id uuid primary key default gen_random_uuid(),
  source_snapshot_id uuid not null references public.source_snapshots(id) on delete cascade,
  source_registry_id uuid not null references public.source_registry(id) on delete cascade,
  jurisdiction_key text not null,
  dimension_key text not null,
  candidate_kind text not null check (candidate_kind in ('structured_rule','authority_statement','structural_fact','unresolved')),
  candidate_payload jsonb not null,
  evidence_quote text not null,
  confidence text not null check (confidence in ('high','medium','low')),
  extraction_method text not null,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','conflict','needs_review')),
  adjudication_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_snapshot_id,dimension_key,evidence_quote)
);

create table if not exists public.jurisdiction_data_depth_adjudications (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null,
  dimension_key text not null,
  decision text not null check (decision in ('accepted','blocked','unmeasured','not_applicable')),
  evidence_ids uuid[] not null default '{}',
  candidate_ids uuid[] not null default '{}',
  decision_reason text not null,
  decided_at timestamptz not null default now(),
  unique(jurisdiction_key,dimension_key)
);

create index if not exists idx_depth_extract_pending on public.jurisdiction_data_depth_extraction_candidates(status,created_at);
create index if not exists idx_depth_extract_snapshot on public.jurisdiction_data_depth_extraction_candidates(source_snapshot_id);
create index if not exists idx_depth_adjudication_cell on public.jurisdiction_data_depth_adjudications(jurisdiction_key,dimension_key);

create or replace function public.extract_depth_candidates(p_limit integer default 20)
returns integer
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  v_count integer := 0;
  r record;
  v_jurisdiction text;
  v_dim text;
  v_quote text;
begin
  for r in
    select ss.id,ss.source_id,ss.captured_url,ss.captured_text,sr.jurisdiction_code,sr.iso
    from public.source_snapshots ss
    join public.source_registry sr on sr.id=ss.source_id
    where ss.fetch_status='success'
      and coalesce(ss.processing_status,'pending')='pending'
      and ss.captured_text is not null
    order by ss.captured_at
    limit greatest(1,least(coalesce(p_limit,20),50))
  loop
    v_jurisdiction := coalesce(r.jurisdiction_code,r.iso);
    if v_jurisdiction is null then
      update public.source_snapshots set processing_status='needs_review',processed_at=now() where id=r.id;
      continue;
    end if;

    -- Conservative extraction: only create candidates when the source text contains
    -- explicit regulatory terms. Candidates are never evidence by themselves.
    for v_dim,v_quote in
      select * from (
        values
        ('regulatory_status', substring(r.captured_text from '(?is).{0,220}(legal|prohibited|medical cannabis|adult[- ]use|recreational cannabis).{0,220}')),
        ('pathways', substring(r.captured_text from '(?is).{0,220}(licen[cs]e|licen[cs]ing|permit|authorization).{0,220}')),
        ('import', substring(r.captured_text from '(?is).{0,220}(import|importation).{0,220}')),
        ('export', substring(r.captured_text from '(?is).{0,220}(export|exportation).{0,220}')),
        ('distribution', substring(r.captured_text from '(?is).{0,220}(distribution|distributor|wholesale).{0,220}')),
        ('testing', substring(r.captured_text from '(?is).{0,220}(testing|laboratory|lab testing).{0,220}')),
        ('packaging_labeling', substring(r.captured_text from '(?is).{0,220}(packaging|labelling|labeling).{0,220}')),
        ('tax_fees', substring(r.captured_text from '(?is).{0,220}(tax|excise|fee|fees).{0,220}')),
        ('commercial_activity', substring(r.captured_text from '(?is).{0,220}(sale|selling|cultivation|production|processing).{0,220}'))
      ) x(dim,q)
      where q is not null
    loop
      insert into public.jurisdiction_data_depth_extraction_candidates
        (source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,
         candidate_payload,evidence_quote,confidence,extraction_method)
      values
        (r.id,r.source_id,v_jurisdiction,v_dim,'authority_statement',
         jsonb_build_object('source_url',r.captured_url,'matched_dimension',v_dim),
         v_quote,'low','conservative_keyword_v1')
      on conflict (source_snapshot_id,dimension_key,evidence_quote) do nothing;
      v_count := v_count + 1;
    end loop;

    update public.source_snapshots
      set processing_status='extracted',processed_at=now(),intelligence_pass=coalesce(intelligence_pass,0)+1
    where id=r.id;
  end loop;
  return v_count;
end;
$$;

create or replace function public.adjudicate_depth_candidates(p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  r record;
  v_count integer := 0;
  v_ids uuid[];
begin
  for r in
    select c.jurisdiction_key,c.dimension_key,
           array_agg(c.id order by c.confidence desc,c.created_at) candidate_ids,
           count(*) n,
           count(distinct c.source_snapshot_id) source_count
    from public.jurisdiction_data_depth_extraction_candidates c
    where c.status='pending'
    group by c.jurisdiction_key,c.dimension_key
    order by min(c.created_at)
    limit greatest(1,least(coalesce(p_limit,100),500))
  loop
    select array_agg(id) into v_ids
    from public.jurisdiction_data_depth_extraction_candidates
    where jurisdiction_key=r.jurisdiction_key and dimension_key=r.dimension_key and status='pending';

    if r.n = 1 then
      update public.jurisdiction_data_depth_extraction_candidates
        set status='needs_review',
            adjudication_reason='Conservative extraction candidate requires source-specific human/structured adjudication; not auto-promoted.',
            updated_at=now()
      where id=any(v_ids);
      insert into public.jurisdiction_data_depth_adjudications
        (jurisdiction_key,dimension_key,decision,candidate_ids,decision_reason)
      values
        (r.jurisdiction_key,r.dimension_key,'unmeasured',v_ids,
         'Candidate extracted, but generic text matching is insufficient to establish an authoritative structured rule.')
      on conflict (jurisdiction_key,dimension_key) do update set
        decision='unmeasured',candidate_ids=excluded.candidate_ids,
        decision_reason=excluded.decision_reason,decided_at=now();
    else
      update public.jurisdiction_data_depth_extraction_candidates
        set status='conflict',
            adjudication_reason='Multiple candidate statements require explicit conflict resolution; no automatic winner.',
            updated_at=now()
      where id=any(v_ids);
      insert into public.jurisdiction_data_depth_adjudications
        (jurisdiction_key,dimension_key,decision,candidate_ids,decision_reason)
      values
        (r.jurisdiction_key,r.dimension_key,'blocked',v_ids,
         'Multiple candidate statements detected. No automatic winner is permitted.')
      on conflict (jurisdiction_key,dimension_key) do update set
        decision='blocked',candidate_ids=excluded.candidate_ids,
        decision_reason=excluded.decision_reason,decided_at=now();
    end if;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.extract_depth_candidates(integer) from public;
revoke all on function public.adjudicate_depth_candidates(integer) from public;
grant execute on function public.extract_depth_candidates(integer) to service_role;
grant execute on function public.adjudicate_depth_candidates(integer) to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924141108','fix_evidence_extraction_adjudication_20260924','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924141108_fix_evidence_extraction_adjudication_20260924.sql

-- RECOVERY BEGIN 20260924141416_structured_dimension_adjudication_engine_20260924.sql
-- Structured dimension-specific adjudication engine
-- Fail-closed: only promotes evidence when source, exact quote, effective date,
-- jurisdiction scope, and dimension-specific semantics all pass.

create table if not exists public.jurisdiction_data_depth_adjudication_runs (
  id uuid primary key default gen_random_uuid(),
  engine_version text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  candidates_seen integer not null default 0,
  promoted integer not null default 0,
  blocked integer not null default 0,
  unmeasured integer not null default 0,
  notes text
);

create table if not exists public.jurisdiction_data_depth_gate_results (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.jurisdiction_data_depth_extraction_candidates(id) on delete cascade,
  jurisdiction_key text not null,
  dimension_key text not null,
  source_gate boolean not null,
  quote_gate boolean not null,
  effective_date_gate boolean not null,
  jurisdiction_scope_gate boolean not null,
  semantics_gate boolean not null,
  authority_gate boolean not null,
  decision text not null check (decision in ('accepted','blocked','unmeasured')),
  reason text not null,
  evaluated_at timestamptz not null default now()
);

create index if not exists jd_depth_gate_candidate_idx
  on public.jurisdiction_data_depth_gate_results(candidate_id);
create index if not exists jd_depth_gate_jd_idx
  on public.jurisdiction_data_depth_gate_results(jurisdiction_key,dimension_key);

create or replace function public.adjudicate_structured_depth(p_limit integer default 250)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_run uuid := gen_random_uuid();
  r record;
  v_quote text;
  v_effective date;
  v_source_url text;
  v_payload jsonb;
  v_kind text;
  v_app text;
  v_semantics boolean;
  v_source boolean;
  v_quote_ok boolean;
  v_effective_ok boolean;
  v_scope_ok boolean;
  v_authority_ok boolean;
  v_decision text;
  v_reason text;
  v_candidate uuid;
  v_seen int := 0;
  v_promoted int := 0;
  v_blocked int := 0;
  v_unmeasured int := 0;
begin
  insert into public.jurisdiction_data_depth_adjudication_runs(id,engine_version,notes)
  values(v_run,'structured-adjudication-v1','Deterministic dimension-specific gates; no parent inheritance; no automatic conflict winner.');

  -- 1. Build structured candidates from verified commercial market-access claims.
  for r in
    select
      c.claim_id as source_row_id,
      c.jurisdiction_iso2 as jurisdiction_key,
      'claims'::text as dimension_key,
      c.authority_url as source_url,
      c.source_snapshot_sha256 as expected_hash,
      c.source_effective_date as effective_from,
      c.jurisdiction_scope,
      c.claim_text,
      c.product_class,
      c.claim_key,
      sr.id as source_registry_id,
      ss.id as source_snapshot_id,
      sr.regulator_class,
      sr.tier as source_tier,
      ss.captured_text,
      c.verified_at
    from public.regulatory_market_access_claims c
    join public.source_registry sr
      on lower(regexp_replace(sr.source_url,'/$','')) =
         lower(regexp_replace(c.authority_url,'/$',''))
    join public.source_snapshots ss
      on ss.source_id=sr.id
     and ss.raw_html_hash=c.source_snapshot_sha256
     and ss.fetch_status='success'
    where c.verified_at is not null
      and c.source_effective_date is not null
      and c.source_snapshot_sha256 is not null
      and c.authority_url ~ '^https://'
      and c.claim_text is not null
      and length(trim(c.claim_text)) >= 20
      and coalesce(c.evidence_status,'') not in ('rejected','superseded')
    order by c.verified_at desc
    limit greatest(1,least(coalesce(p_limit,250),1000))
  loop
    v_seen := v_seen + 1;
    -- Dimension semantics are based on the structured claim key/product/rule text,
    -- not on a generic keyword match.
    v_semantics :=
      lower(coalesce(r.claim_key,'') || ' ' || coalesce(r.product_class,'') || ' ' || coalesce(r.claim_text,''))
      ~ '(market|access|licen[cs]|commercial|sale|sell|cultivat|produc|process|dispens|medical|adult.?use|recreational|import|export|distribut|testing|packag|label|tax|fee)';
    v_quote := substring(r.captured_text from
      '(?is)(.{0,260}(?:licen[cs](?:e|ing|ed)?|permit(?:s|ted)?|authorized|authorised|sale|sell|cultivat(?:e|ion)|manufactur(?:e|ing)|process(?:ing)?|dispens(?:ary|ing)|medical cannabis|adult[- ]use|recreational cannabis|import(?:ation)?|export(?:ation)?|distribut(?:ion|or)|testing|laborator(?:y|ies)|packag(?:e|ing)|label(?:ing|ling)?|tax|excise|fee).{0,360})');
    v_source := r.source_registry_id is not null
      and r.source_snapshot_id is not null
      and r.expected_hash is not null and length(r.expected_hash)=64
      and r.source_url is not null and r.source_url ~ '^https://'
      and r.captured_text is not null and length(r.captured_text)>0;
    v_quote_ok := v_quote is not null and length(trim(v_quote)) >= 40
      and lower(r.captured_text) like '%' || lower(left(trim(v_quote),120)) || '%';
    v_effective_ok := r.effective_from is not null;
    v_scope_ok := r.jurisdiction_key is not null
      and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key)
      and coalesce(r.jurisdiction_scope,'') <> ''
      and (
        lower(r.jurisdiction_scope) like '%' || lower(r.jurisdiction_key) || '%'
        or lower(r.jurisdiction_scope) like '%national%'
        or lower(r.jurisdiction_scope) like '%state%'
        or lower(r.jurisdiction_scope) like '%province%'
        or lower(r.jurisdiction_scope) like '%territor%'
      );
    v_authority_ok := coalesce(r.regulator_class,'other') in
      ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement')
      or coalesce(r.source_tier,99) <= 2;

    v_decision := case when v_source and v_quote_ok and v_effective_ok and v_scope_ok and v_semantics and v_authority_ok
      then 'accepted' else 'unmeasured' end;
    v_reason := concat_ws('; ',
      case when not v_source then 'source gate failed' end,
      case when not v_quote_ok then 'exact source quote gate failed' end,
      case when not v_effective_ok then 'explicit effective date missing' end,
      case when not v_scope_ok then 'exact jurisdiction scope failed' end,
      case when not v_semantics then 'claims dimension semantics failed' end,
      case when not v_authority_ok then 'source authority gate failed' end);

    insert into public.jurisdiction_data_depth_extraction_candidates
      (source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,
       candidate_payload,evidence_quote,confidence,extraction_method,status,adjudication_reason)
    values
      (r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,r.dimension_key,'structured_rule',
       jsonb_build_object(
         'claim_id',r.source_row_id,'claim_key',r.claim_key,'claim_text',r.claim_text,
         'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,
         'effective_from',r.effective_from,'authority_url',r.source_url,
         'source_snapshot_sha256',r.expected_hash,'gate_engine','structured-adjudication-v1'
       ),
       v_quote, case when v_decision='accepted' then 'high' else 'medium' end,
       'structured_claim_v1',
       case when v_decision='accepted' then 'accepted' else 'needs_review' end,
       v_reason)
    on conflict (source_snapshot_id,dimension_key,evidence_quote) do update
      set candidate_payload=excluded.candidate_payload,
          confidence=excluded.confidence,
          extraction_method=excluded.extraction_method,
          status=excluded.status,
          adjudication_reason=excluded.adjudication_reason,
          updated_at=now()
    returning id into v_candidate;

    insert into public.jurisdiction_data_depth_gate_results
      (candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,
       jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
    values(v_candidate,r.jurisdiction_key,r.dimension_key,v_source,v_quote_ok,v_effective_ok,
           v_scope_ok,v_semantics,v_authority_ok,v_decision,coalesce(nullif(v_reason,''),'all gates passed'));

    if v_decision='accepted' then
      v_promoted := v_promoted + 1;
      v_payload := jsonb_build_object(
        'claim_id',r.source_row_id,'claim_key',r.claim_key,'claim_text',r.claim_text,
        'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,
        'authority_url',r.source_url,'source_snapshot_sha256',r.expected_hash,
        'adjudication_engine','structured-adjudication-v1'
      );
      insert into public.jurisdiction_data_depth_evidence
        (jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,
         evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,
         effective_from,verification_status,verified_at)
      values
        (r.jurisdiction_key,r.dimension_key,'v2','authority_rule','applicable',
         v_payload,trim(v_quote),r.source_registry_id,r.source_snapshot_id,r.source_url,
         r.effective_from,'verified',r.verified_at)
      on conflict do nothing;
    else
      v_unmeasured := v_unmeasured + 1;
    end if;
  end loop;

  -- 2. Commercial market-access tier is a separate dimension and has a stricter semantic gate.
  for r in
    select e.evidence_key,e.jurisdiction_iso2 as jurisdiction_key,e.tier,e.rationale,
           e.authority_name,e.authority_url,e.source_effective_date,e.verified_at,
           e.source_snapshot_sha256,e.inheritance_scope,e.parent_iso2,
           sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_text,
           sr.regulator_class,sr.tier source_tier
    from public.regulatory_market_access_evidence e
    join public.source_registry sr on lower(regexp_replace(sr.source_url,'/$',''))=lower(regexp_replace(e.authority_url,'/$',''))
    join public.source_snapshots ss on ss.source_id=sr.id and ss.raw_html_hash=e.source_snapshot_sha256 and ss.fetch_status='success'
    where e.active=true
      and e.verified_at is not null
      and e.source_effective_date is not null
      and e.source_snapshot_sha256 is not null and length(e.source_snapshot_sha256)=64
      and e.authority_url ~ '^https://'
      and coalesce(e.inheritance_scope,'') in ('direct','jurisdiction','national','subnational','')
      and e.parent_iso2 is null
    order by e.verified_at desc
    limit greatest(1,least(coalesce(p_limit,250),1000))
  loop
    v_seen := v_seen + 1;
    v_quote := substring(r.captured_text from
      '(?is)(.{0,300}(?:licen[cs](?:e|ing|ed)?|commercial|market|sale|sell|cultivat(?:e|ion)|manufactur(?:e|ing)|process(?:ing)?|dispens(?:ary|ing)|medical cannabis|adult[- ]use|recreational cannabis).{0,420})');
    v_source := r.source_registry_id is not null and r.source_snapshot_id is not null
      and r.source_snapshot_sha256 is not null and length(r.source_snapshot_sha256)=64
      and r.captured_text is not null and length(r.captured_text)>0;
    v_quote_ok := v_quote is not null and length(trim(v_quote)) >= 40;
    v_effective_ok := r.source_effective_date is not null;
    v_scope_ok := r.jurisdiction_key is not null
      and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key)
      and r.parent_iso2 is null;
    v_semantics := lower(coalesce(r.tier,'') || ' ' || coalesce(r.rationale,'')) ~
      '(medical|adult|recreational|commercial|licen[cs]|market|cultivat|manufactur|process|sale|sell|export|import|prohibit|illegal|not.?permitted)';
    v_authority_ok := coalesce(r.regulator_class,'other') in
      ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement')
      or coalesce(r.source_tier,99) <= 2;

    v_decision := case when v_source and v_quote_ok and v_effective_ok and v_scope_ok and v_semantics and v_authority_ok
      then 'accepted' else 'unmeasured' end;
    v_reason := concat_ws('; ',
      case when not v_source then 'source gate failed' end,
      case when not v_quote_ok then 'exact source quote gate failed' end,
      case when not v_effective_ok then 'explicit effective date missing' end,
      case when not v_scope_ok then 'exact jurisdiction scope failed' end,
      case when not v_semantics then 'commercial market-access semantics failed' end,
      case when not v_authority_ok then 'source authority gate failed' end);

    insert into public.jurisdiction_data_depth_extraction_candidates
      (source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,candidate_payload,
       evidence_quote,confidence,extraction_method,status,adjudication_reason)
    values
      (r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,'regulatory_tier','structured_rule',
       jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,
         'authority_name',r.authority_name,'authority_url',r.authority_url,
         'effective_from',r.source_effective_date,'source_snapshot_sha256',r.source_snapshot_sha256,
         'adjudication_engine','structured-adjudication-v1'),
       v_quote,case when v_decision='accepted' then 'high' else 'medium' end,'structured_tier_v1',
       case when v_decision='accepted' then 'accepted' else 'needs_review' end,v_reason)
    on conflict (source_snapshot_id,dimension_key,evidence_quote) do update
      set candidate_payload=excluded.candidate_payload,status=excluded.status,
          confidence=excluded.confidence,extraction_method=excluded.extraction_method,
          adjudication_reason=excluded.adjudication_reason,updated_at=now()
    returning id into v_candidate;

    insert into public.jurisdiction_data_depth_gate_results
      (candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,
       jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
    values(v_candidate,r.jurisdiction_key,'regulatory_tier',v_source,v_quote_ok,v_effective_ok,
           v_scope_ok,v_semantics,v_authority_ok,v_decision,coalesce(nullif(v_reason,''),'all gates passed'));

    if v_decision='accepted' then
      v_promoted := v_promoted + 1;
      insert into public.jurisdiction_data_depth_evidence
        (jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,
         evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
      values
        (r.jurisdiction_key,'regulatory_tier','v2','authority_rule','applicable',
         jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,
           'authority_name',r.authority_name,'authority_url',r.authority_url,
           'source_snapshot_sha256',r.source_snapshot_sha256,'adjudication_engine','structured-adjudication-v1'),
         trim(v_quote),r.source_registry_id,r.source_snapshot_id,r.authority_url,
         r.source_effective_date,'verified',r.verified_at)
      on conflict do nothing;
    else
      v_unmeasured := v_unmeasured + 1;
    end if;
  end loop;

  -- 3. Never auto-promote generic keyword candidates. They remain research inputs.
  update public.jurisdiction_data_depth_extraction_candidates
    set status='needs_review',
        adjudication_reason=coalesce(adjudication_reason,'Awaiting structured dimension-specific adjudication.'),
        updated_at=now()
  where status='pending'
    and extraction_method='conservative_keyword_v1';

  update public.jurisdiction_data_depth_adjudication_runs
    set finished_at=now(),candidates_seen=v_seen,promoted=v_promoted,
        blocked=v_blocked,unmeasured=v_unmeasured,
        notes='Promotion requires exact source snapshot, exact jurisdiction scope, explicit effective date, source quote, authority hierarchy, and dimension-specific semantics.'
  where id=v_run;

  return jsonb_build_object('run_id',v_run,'engine_version','structured-adjudication-v1',
    'candidates_seen',v_seen,'promoted',v_promoted,'blocked',v_blocked,'unmeasured',v_unmeasured);
end;
$$;

revoke all on function public.adjudicate_structured_depth(integer) from public, anon, authenticated;
grant execute on function public.adjudicate_structured_depth(integer) to service_role;

comment on function public.adjudicate_structured_depth(integer) is
'Fail-closed structured evidence adjudication. Promotion requires source registry + successful hashed snapshot, exact source quote, explicit effective date, exact jurisdiction scope, authoritative source class, and dimension-specific rule semantics. No parent inheritance and no generic keyword auto-promotion.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924141416','structured_dimension_adjudication_engine_20260924','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924141416_structured_dimension_adjudication_engine_20260924.sql

-- RECOVERY BEGIN 20260924141505_structured_adjudication_engine_v2_20260924.sql
create or replace function public.extract_dimension_quote(p_text text,p_dimension text)
returns text
language plpgsql
immutable
set search_path=pg_catalog
as $$
declare
  term text;
  terms text[];
  pos integer;
  start_pos integer;
  end_pos integer;
begin
  if p_text is null or length(p_text)<40 then return null; end if;
  terms := case p_dimension
    when 'claims' then array['licensed','licence','license','permit','authorized','authorised','medical cannabis','adult-use','adult use','recreational cannabis','commercial cannabis','import','export','distribution','cultivation','processing','sale','selling']
    when 'regulatory_tier' then array['licensed','licence','license','permit','authorized','authorised','medical cannabis','adult-use','adult use','recreational cannabis','commercial cannabis','import','export','distribution','cultivation','processing','sale','selling','prohibited','illegal']
    when 'pathways' then array['license','licence','licensing','permit','authorization','authorisation','application']
    when 'import' then array['import','importation','import permit']
    when 'export' then array['export','exportation','export permit']
    when 'distribution' then array['distribution','distributor','wholesale']
    when 'testing' then array['testing','laboratory','laboratories','lab testing']
    when 'packaging_labeling' then array['packaging','labelling','labeling']
    when 'tax_fees' then array['tax','excise','fee','fees']
    when 'commercial_activity' then array['sale','selling','cultivation','production','processing','commercial']
    else array[]::text[]
  end;
  foreach term in array terms loop
    pos := strpos(lower(p_text),lower(term));
    if pos > 0 then
      start_pos := greatest(1,pos-260);
      end_pos := least(length(p_text),pos+500);
      return trim(substring(p_text from start_pos for end_pos-start_pos+1));
    end if;
  end loop;
  return null;
end $$;
revoke all on function public.extract_dimension_quote(text,text) from public,anon,authenticated;
grant execute on function public.extract_dimension_quote(text,text) to service_role;

create or replace function public.adjudicate_structured_depth(p_limit integer default 250)
returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
 r record; q text; cand uuid; runid uuid:=gen_random_uuid();
 src_ok boolean; quote_ok boolean; eff_ok boolean; scope_ok boolean; sem_ok boolean; auth_ok boolean; ok boolean;
 reason text; seen int:=0; promoted int:=0; unmeasured int:=0;
begin
 insert into public.jurisdiction_data_depth_adjudication_runs(id,engine_version,notes)
 values(runid,'structured-adjudication-v2','Dimension-specific deterministic gates; fail closed; no parent inheritance; no generic keyword promotion.');

 -- Claims
 for r in
   select c.claim_id,c.jurisdiction_iso2 jurisdiction_key,c.claim_key,c.claim_text,c.product_class,c.jurisdiction_scope,
          c.authority_url,c.source_effective_date,c.source_snapshot_sha256,c.verified_at,
          sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_text,
          sr.regulator_class,sr.tier source_tier
   from public.regulatory_market_access_claims c
   join public.source_registry sr on lower(regexp_replace(sr.source_url,'/$',''))=lower(regexp_replace(c.authority_url,'/$',''))
   join public.source_snapshots ss on ss.source_id=sr.id and ss.raw_html_hash=c.source_snapshot_sha256 and ss.fetch_status='success'
   where c.verified_at is not null and c.source_effective_date is not null
     and c.source_snapshot_sha256 is not null and c.claim_text is not null
     and length(trim(c.claim_text))>=20 and c.authority_url ~ '^https://'
     and coalesce(c.evidence_status,'') not in ('rejected','superseded')
   order by c.verified_at desc
   limit greatest(1,least(coalesce(p_limit,250),1000))
 loop
   seen:=seen+1; q:=public.extract_dimension_quote(r.captured_text,'claims');
   src_ok:=r.source_registry_id is not null and r.source_snapshot_id is not null and length(r.source_snapshot_sha256)=64;
   quote_ok:=q is not null and length(q)>=40;
   eff_ok:=r.source_effective_date is not null;
   scope_ok:=r.jurisdiction_key is not null and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key)
             and coalesce(r.jurisdiction_scope,'')<>'' and lower(r.jurisdiction_scope)<>lower(coalesce(r.product_class,''));
   sem_ok:=lower(r.claim_key||' '||r.claim_text||' '||coalesce(r.product_class,'')) ~ '(access|market|licen|permit|commercial|medical|adult|recreational|sale|cultivat|produc|process|import|export|distribut|testing|packag|label|tax|fee)';
   auth_ok:=coalesce(r.regulator_class,'other') in ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement') or coalesce(r.source_tier,99)<=2;
   ok:=src_ok and quote_ok and eff_ok and scope_ok and sem_ok and auth_ok;
   reason:=concat_ws(';',case when not src_ok then 'source' end,case when not quote_ok then 'quote' end,case when not eff_ok then 'effective_date' end,case when not scope_ok then 'jurisdiction_scope' end,case when not sem_ok then 'semantics' end,case when not auth_ok then 'authority' end);
   insert into public.jurisdiction_data_depth_extraction_candidates(source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,candidate_payload,evidence_quote,confidence,extraction_method,status,adjudication_reason)
   values(r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,'claims','structured_rule',
     jsonb_build_object('claim_id',r.claim_id,'claim_key',r.claim_key,'claim_text',r.claim_text,'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,'effective_from',r.source_effective_date,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),
     q,case when ok then 'high' else 'medium' end,'structured_claim_v2',case when ok then 'accepted' else 'needs_review' end,coalesce(nullif(reason,''),'all gates passed'))
   on conflict(source_snapshot_id,dimension_key,evidence_quote) do update set candidate_payload=excluded.candidate_payload,confidence=excluded.confidence,extraction_method=excluded.extraction_method,status=excluded.status,adjudication_reason=excluded.adjudication_reason,updated_at=now()
   returning id into cand;
   insert into public.jurisdiction_data_depth_gate_results(candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
   values(cand,r.jurisdiction_key,'claims',src_ok,quote_ok,eff_ok,scope_ok,sem_ok,auth_ok,case when ok then 'accepted' else 'unmeasured' end,coalesce(nullif(reason,''),'all gates passed'));
   if ok then
     promoted:=promoted+1;
     insert into public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
     values(r.jurisdiction_key,'claims','v2','authority_rule','applicable',
       jsonb_build_object('claim_id',r.claim_id,'claim_key',r.claim_key,'claim_text',r.claim_text,'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),
       q,r.source_registry_id,r.source_snapshot_id,r.authority_url,r.source_effective_date,'verified',r.verified_at)
     on conflict do nothing;
   else unmeasured:=unmeasured+1; end if;
 end loop;

 -- Regulatory tier
 for r in
   select e.evidence_key,e.jurisdiction_iso2 jurisdiction_key,e.tier,e.rationale,e.authority_name,e.authority_url,
          e.source_effective_date,e.verified_at,e.source_snapshot_sha256,e.parent_iso2,e.inheritance_scope,
          sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_text,sr.regulator_class,sr.tier source_tier
   from public.regulatory_market_access_evidence e
   join public.source_registry sr on lower(regexp_replace(sr.source_url,'/$',''))=lower(regexp_replace(e.authority_url,'/$',''))
   join public.source_snapshots ss on ss.source_id=sr.id and ss.raw_html_hash=e.source_snapshot_sha256 and ss.fetch_status='success'
   where e.active=true and e.verified_at is not null and e.source_effective_date is not null
     and e.source_snapshot_sha256 is not null and length(e.source_snapshot_sha256)=64
     and e.authority_url ~ '^https://' and e.parent_iso2 is null
   order by e.verified_at desc
   limit greatest(1,least(coalesce(p_limit,250),1000))
 loop
   seen:=seen+1; q:=public.extract_dimension_quote(r.captured_text,'regulatory_tier');
   src_ok:=r.source_registry_id is not null and r.source_snapshot_id is not null and length(r.source_snapshot_sha256)=64;
   quote_ok:=q is not null and length(q)>=40;
   eff_ok:=r.source_effective_date is not null;
   scope_ok:=r.jurisdiction_key is not null and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key) and r.parent_iso2 is null;
   sem_ok:=lower(coalesce(r.tier,'')||' '||coalesce(r.rationale,'')) ~ '(medical|adult|recreational|commercial|licen|market|cultivat|manufactur|process|sale|sell|export|import|prohibit|illegal|permit)';
   auth_ok:=coalesce(r.regulator_class,'other') in ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement') or coalesce(r.source_tier,99)<=2;
   ok:=src_ok and quote_ok and eff_ok and scope_ok and sem_ok and auth_ok;
   reason:=concat_ws(';',case when not src_ok then 'source' end,case when not quote_ok then 'quote' end,case when not eff_ok then 'effective_date' end,case when not scope_ok then 'jurisdiction_scope' end,case when not sem_ok then 'commercial_market_access_semantics' end,case when not auth_ok then 'authority' end);
   insert into public.jurisdiction_data_depth_extraction_candidates(source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,candidate_payload,evidence_quote,confidence,extraction_method,status,adjudication_reason)
   values(r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,'regulatory_tier','structured_rule',
     jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,'authority_name',r.authority_name,'authority_url',r.authority_url,'effective_from',r.source_effective_date,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),
     q,case when ok then 'high' else 'medium' end,'structured_tier_v2',case when ok then 'accepted' else 'needs_review' end,coalesce(nullif(reason,''),'all gates passed'))
   on conflict(source_snapshot_id,dimension_key,evidence_quote) do update set candidate_payload=excluded.candidate_payload,confidence=excluded.confidence,extraction_method=excluded.extraction_method,status=excluded.status,adjudication_reason=excluded.adjudication_reason,updated_at=now()
   returning id into cand;
   insert into public.jurisdiction_data_depth_gate_results(candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
   values(cand,r.jurisdiction_key,'regulatory_tier',src_ok,quote_ok,eff_ok,scope_ok,sem_ok,auth_ok,case when ok then 'accepted' else 'unmeasured' end,coalesce(nullif(reason,''),'all gates passed'));
   if ok then
     promoted:=promoted+1;
     insert into public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
     values(r.jurisdiction_key,'regulatory_tier','v2','authority_rule','applicable',
       jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,'authority_name',r.authority_name,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),
       q,r.source_registry_id,r.source_snapshot_id,r.authority_url,r.source_effective_date,'verified',r.verified_at)
     on conflict do nothing;
   else unmeasured:=unmeasured+1; end if;
 end loop;

 update public.jurisdiction_data_depth_extraction_candidates
 set status='needs_review',adjudication_reason=coalesce(adjudication_reason,'Awaiting structured dimension-specific adjudication.'),updated_at=now()
 where status='pending' and extraction_method='conservative_keyword_v1';

 update public.jurisdiction_data_depth_adjudication_runs
 set finished_at=now(),candidates_seen=seen,promoted=promoted,unmeasured=unmeasured,
     notes='v2: source registry + successful hashed snapshot + exact quote + explicit effective date + exact jurisdiction scope + authority hierarchy + dimension semantics.'
 where id=runid;
 return jsonb_build_object('run_id',runid,'engine_version','structured-adjudication-v2','candidates_seen',seen,'promoted',promoted,'unmeasured',unmeasured);
end $$;
revoke all on function public.adjudicate_structured_depth(integer) from public,anon,authenticated;
grant execute on function public.adjudicate_structured_depth(integer) to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924141505','structured_adjudication_engine_v2_20260924','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924141505_structured_adjudication_engine_v2_20260924.sql

-- RECOVERY BEGIN 20260924141532_structured_adjudication_engine_v2_quote_fix_20260924.sql
create or replace function public.adjudicate_structured_depth(p_limit integer default 250)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public
as $$
declare r record; q text; cand uuid; runid uuid:=gen_random_uuid();
src_ok boolean; quote_ok boolean; eff_ok boolean; scope_ok boolean; sem_ok boolean; auth_ok boolean; ok boolean;
reason text; seen int:=0; promoted int:=0; unmeasured int:=0;
begin
insert into public.jurisdiction_data_depth_adjudication_runs(id,engine_version,notes)
values(runid,'structured-adjudication-v2','Fail-closed dimension gates; candidates without exact source quote remain unmeasured.');
for r in
select c.claim_id,c.jurisdiction_iso2 jurisdiction_key,c.claim_key,c.claim_text,c.product_class,c.jurisdiction_scope,c.authority_url,c.source_effective_date,c.source_snapshot_sha256,c.verified_at,
sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_text,sr.regulator_class,sr.tier source_tier
from public.regulatory_market_access_claims c
join public.source_registry sr on lower(regexp_replace(sr.source_url,'/$',''))=lower(regexp_replace(c.authority_url,'/$',''))
join public.source_snapshots ss on ss.source_id=sr.id and ss.raw_html_hash=c.source_snapshot_sha256 and ss.fetch_status='success'
where c.verified_at is not null and c.source_effective_date is not null and c.source_snapshot_sha256 is not null and c.claim_text is not null
and length(trim(c.claim_text))>=20 and c.authority_url ~ '^https://' and coalesce(c.evidence_status,'') not in ('rejected','superseded')
order by c.verified_at desc limit greatest(1,least(coalesce(p_limit,250),1000))
loop
seen:=seen+1;q:=public.extract_dimension_quote(r.captured_text,'claims');quote_ok:=q is not null and length(q)>=40;q:=coalesce(q,'[NO_EXACT_SOURCE_QUOTE]');
src_ok:=r.source_registry_id is not null and r.source_snapshot_id is not null and length(r.source_snapshot_sha256)=64;
eff_ok:=r.source_effective_date is not null;
scope_ok:=r.jurisdiction_key is not null and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key) and coalesce(r.jurisdiction_scope,'')<>'';
sem_ok:=lower(r.claim_key||' '||r.claim_text||' '||coalesce(r.product_class,'')) ~ '(access|market|licen|permit|commercial|medical|adult|recreational|sale|cultivat|produc|process|import|export|distribut|testing|packag|label|tax|fee)';
auth_ok:=coalesce(r.regulator_class,'other') in ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement') or coalesce(r.source_tier,99)<=2;
ok:=src_ok and quote_ok and eff_ok and scope_ok and sem_ok and auth_ok;
reason:=concat_ws(';',case when not src_ok then 'source' end,case when not quote_ok then 'quote' end,case when not eff_ok then 'effective_date' end,case when not scope_ok then 'jurisdiction_scope' end,case when not sem_ok then 'semantics' end,case when not auth_ok then 'authority' end);
insert into public.jurisdiction_data_depth_extraction_candidates(source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,candidate_payload,evidence_quote,confidence,extraction_method,status,adjudication_reason)
values(r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,'claims','structured_rule',jsonb_build_object('claim_id',r.claim_id,'claim_key',r.claim_key,'claim_text',r.claim_text,'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,'effective_from',r.source_effective_date,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,case when ok then 'high' else 'medium' end,'structured_claim_v2',case when ok then 'accepted' else 'needs_review' end,coalesce(nullif(reason,''),'all gates passed'))
on conflict(source_snapshot_id,dimension_key,evidence_quote) do update set candidate_payload=excluded.candidate_payload,confidence=excluded.confidence,extraction_method=excluded.extraction_method,status=excluded.status,adjudication_reason=excluded.adjudication_reason,updated_at=now() returning id into cand;
insert into public.jurisdiction_data_depth_gate_results(candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
values(cand,r.jurisdiction_key,'claims',src_ok,quote_ok,eff_ok,scope_ok,sem_ok,auth_ok,case when ok then 'accepted' else 'unmeasured' end,coalesce(nullif(reason,''),'all gates passed'));
if ok then promoted:=promoted+1;
insert into public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
values(r.jurisdiction_key,'claims','v2','authority_rule','applicable',jsonb_build_object('claim_id',r.claim_id,'claim_key',r.claim_key,'claim_text',r.claim_text,'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,r.source_registry_id,r.source_snapshot_id,r.authority_url,r.source_effective_date,'verified',r.verified_at) on conflict do nothing;
else unmeasured:=unmeasured+1; end if;
end loop;
for r in
select e.evidence_key,e.jurisdiction_iso2 jurisdiction_key,e.tier,e.rationale,e.authority_name,e.authority_url,e.source_effective_date,e.verified_at,e.source_snapshot_sha256,e.parent_iso2,
sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_text,sr.regulator_class,sr.tier source_tier
from public.regulatory_market_access_evidence e
join public.source_registry sr on lower(regexp_replace(sr.source_url,'/$',''))=lower(regexp_replace(e.authority_url,'/$',''))
join public.source_snapshots ss on ss.source_id=sr.id and ss.raw_html_hash=e.source_snapshot_sha256 and ss.fetch_status='success'
where e.active=true and e.verified_at is not null and e.source_effective_date is not null and e.source_snapshot_sha256 is not null and length(e.source_snapshot_sha256)=64 and e.authority_url ~ '^https://' and e.parent_iso2 is null
order by e.verified_at desc limit greatest(1,least(coalesce(p_limit,250),1000))
loop
seen:=seen+1;q:=public.extract_dimension_quote(r.captured_text,'regulatory_tier');quote_ok:=q is not null and length(q)>=40;q:=coalesce(q,'[NO_EXACT_SOURCE_QUOTE]');
src_ok:=r.source_registry_id is not null and r.source_snapshot_id is not null and length(r.source_snapshot_sha256)=64;eff_ok:=r.source_effective_date is not null;
scope_ok:=r.jurisdiction_key is not null and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key) and r.parent_iso2 is null;
sem_ok:=lower(coalesce(r.tier,'')||' '||coalesce(r.rationale,'')) ~ '(medical|adult|recreational|commercial|licen|market|cultivat|manufactur|process|sale|sell|export|import|prohibit|illegal|permit)';
auth_ok:=coalesce(r.regulator_class,'other') in ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement') or coalesce(r.source_tier,99)<=2;ok:=src_ok and quote_ok and eff_ok and scope_ok and sem_ok and auth_ok;
reason:=concat_ws(';',case when not src_ok then 'source' end,case when not quote_ok then 'quote' end,case when not eff_ok then 'effective_date' end,case when not scope_ok then 'jurisdiction_scope' end,case when not sem_ok then 'commercial_market_access_semantics' end,case when not auth_ok then 'authority' end);
insert into public.jurisdiction_data_depth_extraction_candidates(source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,candidate_payload,evidence_quote,confidence,extraction_method,status,adjudication_reason)
values(r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,'regulatory_tier','structured_rule',jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,'authority_name',r.authority_name,'authority_url',r.authority_url,'effective_from',r.source_effective_date,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,case when ok then 'high' else 'medium' end,'structured_tier_v2',case when ok then 'accepted' else 'needs_review' end,coalesce(nullif(reason,''),'all gates passed'))
on conflict(source_snapshot_id,dimension_key,evidence_quote) do update set candidate_payload=excluded.candidate_payload,confidence=excluded.confidence,extraction_method=excluded.extraction_method,status=excluded.status,adjudication_reason=excluded.adjudication_reason,updated_at=now() returning id into cand;
insert into public.jurisdiction_data_depth_gate_results(candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
values(cand,r.jurisdiction_key,'regulatory_tier',src_ok,quote_ok,eff_ok,scope_ok,sem_ok,auth_ok,case when ok then 'accepted' else 'unmeasured' end,coalesce(nullif(reason,''),'all gates passed'));
if ok then promoted:=promoted+1;
insert into public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
values(r.jurisdiction_key,'regulatory_tier','v2','authority_rule','applicable',jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,'authority_name',r.authority_name,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,r.source_registry_id,r.source_snapshot_id,r.authority_url,r.source_effective_date,'verified',r.verified_at) on conflict do nothing;
else unmeasured:=unmeasured+1;end if;
end loop;
update public.jurisdiction_data_depth_extraction_candidates set status='needs_review',adjudication_reason=coalesce(adjudication_reason,'Awaiting structured dimension-specific adjudication.'),updated_at=now() where status='pending' and extraction_method='conservative_keyword_v1';
update public.jurisdiction_data_depth_adjudication_runs set finished_at=now(),candidates_seen=seen,promoted=promoted,unmeasured=unmeasured,notes='v2 gates: source, exact quote, explicit effective date, exact jurisdiction scope, authority hierarchy, dimension-specific semantics.' where id=runid;
return jsonb_build_object('run_id',runid,'engine_version','structured-adjudication-v2','candidates_seen',seen,'promoted',promoted,'unmeasured',unmeasured);
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924141532','structured_adjudication_engine_v2_quote_fix_20260924','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924141532_structured_adjudication_engine_v2_quote_fix_20260924.sql

-- RECOVERY BEGIN 20260924141626_structured_adjudication_engine_v2_counter_fix_20260924.sql
create or replace function public.adjudicate_structured_depth(p_limit integer default 250)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public
as $$
declare r record; q text; cand uuid; runid uuid:=gen_random_uuid();
src_ok boolean; quote_ok boolean; eff_ok boolean; scope_ok boolean; sem_ok boolean; auth_ok boolean; ok boolean;
reason text; v_seen int:=0; v_promoted int:=0; v_unmeasured int:=0;
begin
insert into public.jurisdiction_data_depth_adjudication_runs(id,engine_version,notes)
values(runid,'structured-adjudication-v2','Fail-closed: source + exact quote + effective date + exact jurisdiction scope + dimension semantics + authority.');

for r in
select c.claim_id,c.jurisdiction_iso2 jurisdiction_key,c.claim_key,c.claim_text,c.product_class,c.jurisdiction_scope,c.authority_url,c.source_effective_date,c.source_snapshot_sha256,c.verified_at,
sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_text,sr.regulator_class,sr.tier source_tier
from public.regulatory_market_access_claims c
join public.source_registry sr on lower(regexp_replace(sr.source_url,'/$',''))=lower(regexp_replace(c.authority_url,'/$',''))
join public.source_snapshots ss on ss.source_id=sr.id and ss.raw_html_hash=c.source_snapshot_sha256 and ss.fetch_status='success'
where c.verified_at is not null and c.source_effective_date is not null and c.source_snapshot_sha256 is not null and c.claim_text is not null
and length(trim(c.claim_text))>=20 and c.authority_url ~ '^https://' and coalesce(c.evidence_status,'') not in ('rejected','superseded')
order by c.verified_at desc limit greatest(1,least(coalesce(p_limit,250),1000))
loop
v_seen:=v_seen+1;q:=public.extract_dimension_quote(r.captured_text,'claims');quote_ok:=q is not null and length(q)>=40;q:=coalesce(q,'[NO_EXACT_SOURCE_QUOTE]');
src_ok:=r.source_registry_id is not null and r.source_snapshot_id is not null and length(r.source_snapshot_sha256)=64;
eff_ok:=r.source_effective_date is not null;
scope_ok:=r.jurisdiction_key is not null and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key) and coalesce(r.jurisdiction_scope,'')<>'';
sem_ok:=lower(r.claim_key||' '||r.claim_text||' '||coalesce(r.product_class,'')) ~ '(access|market|licen|permit|commercial|medical|adult|recreational|sale|cultivat|produc|process|import|export|distribut|testing|packag|label|tax|fee)';
auth_ok:=coalesce(r.regulator_class,'other') in ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement') or coalesce(r.source_tier,99)<=2;
ok:=src_ok and quote_ok and eff_ok and scope_ok and sem_ok and auth_ok;
reason:=concat_ws(';',case when not src_ok then 'source' end,case when not quote_ok then 'quote' end,case when not eff_ok then 'effective_date' end,case when not scope_ok then 'jurisdiction_scope' end,case when not sem_ok then 'semantics' end,case when not auth_ok then 'authority' end);
insert into public.jurisdiction_data_depth_extraction_candidates(source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,candidate_payload,evidence_quote,confidence,extraction_method,status,adjudication_reason)
values(r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,'claims','structured_rule',jsonb_build_object('claim_id',r.claim_id,'claim_key',r.claim_key,'claim_text',r.claim_text,'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,'effective_from',r.source_effective_date,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,case when ok then 'high' else 'medium' end,'structured_claim_v2',case when ok then 'accepted' else 'needs_review' end,coalesce(nullif(reason,''),'all gates passed'))
on conflict(source_snapshot_id,dimension_key,evidence_quote) do update set candidate_payload=excluded.candidate_payload,confidence=excluded.confidence,extraction_method=excluded.extraction_method,status=excluded.status,adjudication_reason=excluded.adjudication_reason,updated_at=now() returning id into cand;
insert into public.jurisdiction_data_depth_gate_results(candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
values(cand,r.jurisdiction_key,'claims',src_ok,quote_ok,eff_ok,scope_ok,sem_ok,auth_ok,case when ok then 'accepted' else 'unmeasured' end,coalesce(nullif(reason,''),'all gates passed'));
if ok then
v_promoted:=v_promoted+1;
insert into public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
values(r.jurisdiction_key,'claims','v2','authority_rule','applicable',jsonb_build_object('claim_id',r.claim_id,'claim_key',r.claim_key,'claim_text',r.claim_text,'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,r.source_registry_id,r.source_snapshot_id,r.authority_url,r.source_effective_date,'verified',r.verified_at) on conflict do nothing;
else v_unmeasured:=v_unmeasured+1; end if;
end loop;

for r in
select e.evidence_key,e.jurisdiction_iso2 jurisdiction_key,e.tier,e.rationale,e.authority_name,e.authority_url,e.source_effective_date,e.verified_at,e.source_snapshot_sha256,e.parent_iso2,
sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_text,sr.regulator_class,sr.tier source_tier
from public.regulatory_market_access_evidence e
join public.source_registry sr on lower(regexp_replace(sr.source_url,'/$',''))=lower(regexp_replace(e.authority_url,'/$',''))
join public.source_snapshots ss on ss.source_id=sr.id and ss.raw_html_hash=e.source_snapshot_sha256 and ss.fetch_status='success'
where e.active=true and e.verified_at is not null and e.source_effective_date is not null and e.source_snapshot_sha256 is not null and length(e.source_snapshot_sha256)=64 and e.authority_url ~ '^https://' and e.parent_iso2 is null
order by e.verified_at desc limit greatest(1,least(coalesce(p_limit,250),1000))
loop
v_seen:=v_seen+1;q:=public.extract_dimension_quote(r.captured_text,'regulatory_tier');quote_ok:=q is not null and length(q)>=40;q:=coalesce(q,'[NO_EXACT_SOURCE_QUOTE]');
src_ok:=r.source_registry_id is not null and r.source_snapshot_id is not null and length(r.source_snapshot_sha256)=64;eff_ok:=r.source_effective_date is not null;
scope_ok:=r.jurisdiction_key is not null and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key) and r.parent_iso2 is null;
sem_ok:=lower(coalesce(r.tier,'')||' '||coalesce(r.rationale,'')) ~ '(medical|adult|recreational|commercial|licen|market|cultivat|manufactur|process|sale|sell|export|import|prohibit|illegal|permit)';
auth_ok:=coalesce(r.regulator_class,'other') in ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement') or coalesce(r.source_tier,99)<=2;ok:=src_ok and quote_ok and eff_ok and scope_ok and sem_ok and auth_ok;
reason:=concat_ws(';',case when not src_ok then 'source' end,case when not quote_ok then 'quote' end,case when not eff_ok then 'effective_date' end,case when not scope_ok then 'jurisdiction_scope' end,case when not sem_ok then 'commercial_market_access_semantics' end,case when not auth_ok then 'authority' end);
insert into public.jurisdiction_data_depth_extraction_candidates(source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,candidate_payload,evidence_quote,confidence,extraction_method,status,adjudication_reason)
values(r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,'regulatory_tier','structured_rule',jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,'authority_name',r.authority_name,'authority_url',r.authority_url,'effective_from',r.source_effective_date,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,case when ok then 'high' else 'medium' end,'structured_tier_v2',case when ok then 'accepted' else 'needs_review' end,coalesce(nullif(reason,''),'all gates passed'))
on conflict(source_snapshot_id,dimension_key,evidence_quote) do update set candidate_payload=excluded.candidate_payload,confidence=excluded.confidence,extraction_method=excluded.extraction_method,status=excluded.status,adjudication_reason=excluded.adjudication_reason,updated_at=now() returning id into cand;
insert into public.jurisdiction_data_depth_gate_results(candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
values(cand,r.jurisdiction_key,'regulatory_tier',src_ok,quote_ok,eff_ok,scope_ok,sem_ok,auth_ok,case when ok then 'accepted' else 'unmeasured' end,coalesce(nullif(reason,''),'all gates passed'));
if ok then
v_promoted:=v_promoted+1;
insert into public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
values(r.jurisdiction_key,'regulatory_tier','v2','authority_rule','applicable',jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,'authority_name',r.authority_name,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,r.source_registry_id,r.source_snapshot_id,r.authority_url,r.source_effective_date,'verified',r.verified_at) on conflict do nothing;
else v_unmeasured:=v_unmeasured+1;end if;
end loop;

update public.jurisdiction_data_depth_extraction_candidates set status='needs_review',adjudication_reason=coalesce(adjudication_reason,'Awaiting structured dimension-specific adjudication.'),updated_at=now() where status='pending' and extraction_method='conservative_keyword_v1';
update public.jurisdiction_data_depth_adjudication_runs set finished_at=now(),candidates_seen=v_seen,promoted=v_promoted,unmeasured=v_unmeasured,notes='v2 gates enforced.' where id=runid;
return jsonb_build_object('run_id',runid,'engine_version','structured-adjudication-v2','candidates_seen',v_seen,'promoted',v_promoted,'unmeasured',v_unmeasured);
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924141626','structured_adjudication_engine_v2_counter_fix_20260924','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924141626_structured_adjudication_engine_v2_counter_fix_20260924.sql

-- RECOVERY BEGIN 20260924141745_structured_adjudication_engine_rls_20260924.sql
alter table public.jurisdiction_data_depth_adjudication_runs enable row level security;
alter table public.jurisdiction_data_depth_gate_results enable row level security;
drop policy if exists "service role only" on public.jurisdiction_data_depth_adjudication_runs;
drop policy if exists "service role only" on public.jurisdiction_data_depth_gate_results;
create policy "service role only" on public.jurisdiction_data_depth_adjudication_runs for all to service_role using (true) with check (true);
create policy "service role only" on public.jurisdiction_data_depth_gate_results for all to service_role using (true) with check (true);
revoke all on public.jurisdiction_data_depth_adjudication_runs from anon,authenticated;
revoke all on public.jurisdiction_data_depth_gate_results from anon,authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924141745','structured_adjudication_engine_rls_20260924','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924141745_structured_adjudication_engine_rls_20260924.sql

-- RECOVERY BEGIN 20260924150000_authoritative_evidence_depth_backfill.sql
-- Evidence depth backfill from existing authoritative/verified Harbourview data.
-- Idempotent: only inserts missing current verified evidence and then recomputes state.
-- Contract: 2026-09-23.v2, exactly 291 jurisdictions x 32 dimensions.

with ls as (
  select distinct on (sr.id)
    sr.id source_registry_id, ss.id source_snapshot_id, sr.jurisdiction_code,
    sr.source_url, ss.captured_at, ss.raw_html_hash
  from public.source_registry sr
  join public.source_snapshots ss on ss.source_id = sr.id
  where sr.is_active
    and ss.fetch_status = 'success'
    and length(coalesce(ss.captured_text,'')) > 0
    and lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
  order by sr.id, ss.captured_at desc
),
src as (
  select distinct on (ls.jurisdiction_code)
    ls.jurisdiction_code jurisdiction_key, ls.source_registry_id,
    ls.source_snapshot_id, ls.source_url, ls.captured_at, ls.raw_html_hash
  from ls
  join public.countries c on c.iso_alpha2 = ls.jurisdiction_code
  order by ls.jurisdiction_code, ls.captured_at desc
)
insert into public.jurisdiction_data_depth_evidence (
  jurisdiction_key, dimension_key, contract_version, evidence_kind, applicability,
  evidence_payload, evidence_quote, source_registry_id, source_snapshot_id,
  source_url, effective_from, verification_status, verified_at, created_at, updated_at
)
select jurisdiction_key, 'source_registry', '2026-09-23.v2', 'structural_fact', 'applicable',
  jsonb_build_object('source_registry_id',source_registry_id,'source_url',source_url),
  'Active registered source with successful captured snapshot.',
  source_registry_id, source_snapshot_id, source_url, captured_at::date,
  'verified', captured_at, now(), now()
from src
on conflict do nothing;

with x as (
  select distinct on (sr.jurisdiction_code)
    sr.jurisdiction_code jurisdiction_key, sr.id source_registry_id, ss.id source_snapshot_id,
    sr.source_url, ss.captured_at, ss.raw_html_hash
  from public.source_registry sr
  join public.source_snapshots ss on ss.source_id = sr.id
  where sr.is_active and sr.jurisdiction_code is not null
    and ss.fetch_status = 'success'
    and length(coalesce(ss.captured_text,'')) > 0
    and lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
    and exists (select 1 from public.countries c where c.iso_alpha2 = sr.jurisdiction_code)
  order by sr.jurisdiction_code, ss.captured_at desc
)
insert into public.jurisdiction_data_depth_evidence (
  jurisdiction_key, dimension_key, contract_version, evidence_kind, applicability,
  evidence_payload, evidence_quote, source_registry_id, source_snapshot_id,
  source_url, effective_from, verification_status, verified_at, created_at, updated_at
)
select jurisdiction_key, 'source_snapshot', '2026-09-23.v2', 'structural_fact', 'applicable',
  jsonb_build_object('snapshot_id',source_snapshot_id,'sha256',raw_html_hash,'captured_at',captured_at),
  'Successful captured primary-source snapshot with valid SHA-256 hash.',
  source_registry_id, source_snapshot_id, source_url, captured_at::date,
  'verified', captured_at, now(), now()
from x
on conflict do nothing;

insert into public.jurisdiction_data_depth_evidence (
  jurisdiction_key, dimension_key, contract_version, evidence_kind, applicability,
  evidence_payload, evidence_quote, source_registry_id, source_snapshot_id,
  source_url, effective_from, verification_status, verified_at, created_at, updated_at
)
select c.jurisdiction_iso2, 'claims', '2026-09-23.v2', 'authority_statement', 'applicable',
  jsonb_build_object('evidence_key',c.evidence_key,'claim_key',c.claim_key,
    'claim_text',c.claim_text,'product_class',c.product_class),
  left(c.claim_text,1000), sr.id, ss.id, sr.source_url,
  coalesce(c.source_effective_date,ss.captured_at::date), 'verified',
  coalesce(c.verified_at,ss.captured_at), now(), now()
from (
  select distinct on (rc.jurisdiction_iso2)
    rc.jurisdiction_iso2, rc.evidence_key, rc.claim_key, rc.claim_text,
    rc.product_class, re.authority_url, re.source_snapshot_sha256,
    re.source_effective_date, re.verified_at
  from public.regulatory_market_access_claims rc
  join public.regulatory_market_access_evidence re
    on re.evidence_key=rc.evidence_key
   and re.jurisdiction_iso2=rc.jurisdiction_iso2
   and re.active
  where not exists (
    select 1 from public.jurisdiction_data_depth_evidence e
    where e.jurisdiction_key=rc.jurisdiction_iso2
      and e.dimension_key='claims'
      and e.contract_version='2026-09-23.v2'
      and e.verification_status='verified'
  )
  order by rc.jurisdiction_iso2, re.verified_at desc nulls last
) c
join public.source_registry sr on sr.source_url=c.authority_url
join lateral (
  select ss.* from public.source_snapshots ss
  where ss.source_id=sr.id and ss.fetch_status='success'
    and length(coalesce(ss.captured_text,'')) > 0
    and lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
    and (c.source_snapshot_sha256 is null or ss.raw_html_hash=c.source_snapshot_sha256)
  order by
    case when c.source_snapshot_sha256 is not null
      and ss.raw_html_hash=c.source_snapshot_sha256 then 0 else 1 end,
    ss.captured_at desc
  limit 1
) ss on true
on conflict do nothing;

insert into public.jurisdiction_data_depth_evidence (
  jurisdiction_key, dimension_key, contract_version, evidence_kind, applicability,
  evidence_payload, evidence_quote, source_registry_id, source_snapshot_id,
  source_url, effective_from, verification_status, verified_at, created_at, updated_at
)
select p.iso_alpha2, 'pathways', '2026-09-23.v2', 'authority_statement', 'applicable',
  jsonb_build_object('pathway_id',p.id,'name',p.name,'pathway_type',p.pathway_type,
    'legal_basis',p.legal_basis,'regulator',p.regulator,'status',p.status),
  left(coalesce(p.summary,p.legal_basis,p.name),1000),
  sr.id, ss.id, sr.source_url, p.effective_date, 'verified', p.last_verified_at, now(), now()
from (
  select distinct on (p.iso_alpha2) p.*, u.url
  from public.regulatory_pathways p
  cross join lateral unnest(p.source_urls) u(url)
  where p.last_verified_at is not null
    and not exists (
      select 1 from public.jurisdiction_data_depth_evidence e
      where e.jurisdiction_key=p.iso_alpha2 and e.dimension_key='pathways'
        and e.contract_version='2026-09-23.v2' and e.verification_status='verified'
    )
  order by p.iso_alpha2, p.last_verified_at desc
) p
join public.source_registry sr on sr.source_url=p.url
join lateral (
  select ss.* from public.source_snapshots ss
  where ss.source_id=sr.id and ss.fetch_status='success'
    and length(coalesce(ss.captured_text,'')) > 0
    and lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
  order by ss.captured_at desc limit 1
) ss on true
on conflict do nothing;

insert into public.jurisdiction_data_depth_evidence (
  jurisdiction_key, dimension_key, contract_version, evidence_kind, applicability,
  evidence_payload, evidence_quote, source_registry_id, source_snapshot_id,
  source_url, effective_from, verification_status, verified_at, created_at, updated_at
)
select m.country_iso2, 'market_metrics', '2026-09-23.v2', 'verified_research', 'applicable',
  jsonb_build_object('metric_name',m.metric_name,'metric_value',m.metric_value,
    'metric_unit',m.metric_unit,'period_start',m.period_start,'period_end',m.period_end),
  left(coalesce(m.notes,m.metric_name),1000), sr.id, ss.id, m.source_url,
  m.source_date, 'verified', ss.captured_at, now(), now()
from (
  select distinct on (m.country_iso2) m.*
  from public.market_metrics m
  where not exists (
    select 1 from public.jurisdiction_data_depth_evidence e
    where e.jurisdiction_key=m.country_iso2 and e.dimension_key='market_metrics'
      and e.contract_version='2026-09-23.v2' and e.verification_status='verified'
  )
  order by m.country_iso2, m.source_date desc nulls last
) m
join public.source_registry sr on sr.source_url=m.source_url
join lateral (
  select ss.* from public.source_snapshots ss
  where ss.source_id=sr.id and ss.fetch_status='success'
    and length(coalesce(ss.captured_text,'')) > 0
    and lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
  order by ss.captured_at desc limit 1
) ss on true
on conflict do nothing;

insert into public.jurisdiction_data_depth_evidence (
  jurisdiction_key, dimension_key, contract_version, evidence_kind, applicability,
  evidence_payload, evidence_quote, source_registry_id, source_snapshot_id,
  source_url, effective_from, verification_status, verified_at, created_at, updated_at
)
select s.country_iso2, 'signals', '2026-09-23.v2', 'verified_research', 'applicable',
  jsonb_build_object('signal_id',s.id,'category',s.cat,'priority',s.pri,'score',s.score,
    'headline',s.headline,'source',s.source,'url',s.url,'observed_at',s.observed_at),
  left(coalesce(s.headline,s.summary),1000), ss.source_id, s.snapshot_id, sr.source_url,
  coalesce(s.event_effective_at::date,s.source_published_at::date,s.observed_at::date),
  'verified', coalesce(s.observed_at,ss.captured_at), now(), now()
from (
  select distinct on (s.country_iso2) s.*
  from public.signals s
  where s.country_iso2 is not null
    and exists (select 1 from public.countries c where c.iso_alpha2=s.country_iso2)
    and not exists (
      select 1 from public.jurisdiction_data_depth_evidence e
      where e.jurisdiction_key=s.country_iso2 and e.dimension_key='signals'
        and e.contract_version='2026-09-23.v2' and e.verification_status='verified'
    )
  order by s.country_iso2, s.observed_at desc nulls last
) s
join public.source_snapshots ss
  on ss.id=s.snapshot_id and ss.fetch_status='success'
 and length(coalesce(ss.captured_text,'')) > 0
 and lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
join public.source_registry sr on sr.id=ss.source_id
on conflict do nothing;

with ev as (
  select e.jurisdiction_key,e.dimension_key,
    count(*) filter(where e.verification_status='verified') ec,
    count(*) filter(where e.verification_status='verified' and v.qualifying_provenance) pc,
    max(e.verified_at) lv
  from public.jurisdiction_data_depth_evidence e
  left join public.v_jurisdiction_data_depth_v2_evidence_gate v
    on v.jurisdiction_key=e.jurisdiction_key
   and v.dimension_key=e.dimension_key
   and v.contract_version=e.contract_version
   and v.verification_status=e.verification_status
  where e.contract_version='2026-09-23.v2'
  group by e.jurisdiction_key,e.dimension_key
),
b as (
  select s.jurisdiction_key,s.dimension_key,s.contract_version,s.applicability,
    d.requires_primary_source,d.freshness_days,
    coalesce(ev.ec,0) ec,coalesce(ev.pc,0) pc,ev.lv
  from public.jurisdiction_data_depth_dimension_state s
  join public.jurisdiction_data_depth_dimensions d on d.dimension_key=s.dimension_key
  left join ev on ev.jurisdiction_key=s.jurisdiction_key and ev.dimension_key=s.dimension_key
  where s.contract_version='2026-09-23.v2'
)
update public.jurisdiction_data_depth_dimension_state s
set evidence_count=b.ec,
    primary_source_count=b.pc,
    latest_verified_at=b.lv,
    freshness_deadline=case when b.lv is not null and b.freshness_days is not null
      then b.lv + make_interval(days=>b.freshness_days) end,
    status=case
      when b.dimension_key in ('identity','hierarchy') or b.applicability='not_applicable' then 'complete'
      when b.ec=0 then 'unmeasured'
      when b.requires_primary_source and b.pc=0 then 'blocked'
      when b.lv + make_interval(days=>b.freshness_days) < now() then 'stale'
      else 'complete' end,
    blocker_reason=case
      when b.dimension_key in ('identity','hierarchy') or b.applicability='not_applicable' then null
      when b.ec=0 then 'No verified evidence captured for this jurisdiction/dimension.'
      when b.requires_primary_source and b.pc=0 then 'Verified evidence exists but qualifying primary-source provenance is absent.'
      when b.lv + make_interval(days=>b.freshness_days) < now() then 'Latest verified evidence is past the dimension freshness window.'
      else null end,
    confidence=case when b.ec=0 then 'unknown' when b.pc>0 then 'high' else 'medium' end,
    evidence_basis=case when b.ec=0 then 'unresolved'
      when b.pc>0 then 'direct_verified_source' else 'verified_structural_or_research' end,
    last_evaluated_at=now(), updated_at=now()
from b
where s.jurisdiction_key=b.jurisdiction_key
  and s.dimension_key=b.dimension_key
  and s.contract_version=b.contract_version;

do $$
declare dims int; jurs int; matrix int;
begin
  select count(*) into dims from public.jurisdiction_data_depth_dimensions where contract_version='2026-09-23.v2';
  select count(*) into jurs from public.countries;
  select count(*) into matrix from public.jurisdiction_data_depth_dimension_state where contract_version='2026-09-23.v2';
  if dims <> 32 or jurs <> 291 or matrix <> 9312 then
    raise exception '291x32 invariant failed: dimensions %, jurisdictions %, matrix %',dims,jurs,matrix;
  end if;
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924150000','authoritative_evidence_depth_backfill','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924150000_authoritative_evidence_depth_backfill.sql

-- RECOVERY BEGIN 20260924150000_publish_heatmap_us_states_and_priority_nationals.sql
-- Publish Market Access heatmap evidence for neutral US states and priority nationals.
-- Globe colour uses countries.verified_regulatory_tier via api.refresh_verified_market_access_tiers.
-- Adult-use state retail => legal_commercial_access (aligned with currently published US-CA/US-IL).
-- Medical-only programmes => medical_limited_trade.
-- Hemp/CBD-limited => cbd_hemp_only.
-- Federal US remains medical_limited_trade (no verified nationwide interstate pathway).

-- Required because the table enforces one active evidence row per jurisdiction.
-- Existing active rows must be retired before inserting the replacement publication rows.
update public.regulatory_market_access_evidence e
set active = false
where e.jurisdiction_iso2 in (
  'US-AK','US-AZ','US-CO','US-CT','US-DE','US-MA','US-MO','US-NJ','US-NM','US-NV','US-NY','US-OH','US-OR','US-RI','US-WA',
  'US-AR','US-FL','US-LA','US-MS','US-ND','US-NE','US-OK','US-WV',
  'US-IN','US-KS','US-SC','US-WY',
  'US','GB','DE','AU','FR','ES','IT','JP','MX','CO','TH','NZ','ZA'
)
and e.active = true;

insert into public.regulatory_market_access_evidence
  (evidence_key, jurisdiction_iso2, tier, rationale, authority_name, authority_url,
   source_effective_date, verified_at, expires_at, active)
values
  ('hv-heatmap-us-ak-20260924','US-AK','legal_commercial_access',
   'Alaska operates a state-licensed adult-use and medical cannabis retail market under the Marijuana Control Board.',
   'Alaska Alcohol and Marijuana Control Office','https://www.commerce.alaska.gov/web/amco/',
   '2016-02-24', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-az-20260924','US-AZ','legal_commercial_access',
   'Arizona operates licensed adult-use and medical cannabis retail under ADHS cannabis programme.',
   'Arizona Department of Health Services — Cannabis','https://www.azdhs.gov/licensing/cannabis/index.php',
   '2020-11-30', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-co-20260924','US-CO','legal_commercial_access',
   'Colorado licenses adult-use and medical marijuana businesses through the Marijuana Enforcement Division.',
   'Colorado Marijuana Enforcement Division','https://med.colorado.gov/',
   '2014-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-ct-20260924','US-CT','legal_commercial_access',
   'Connecticut operates licensed adult-use and medical cannabis retail under DCP Cannabis Control.',
   'Connecticut Department of Consumer Protection — Cannabis','https://portal.ct.gov/dcp/cannabis',
   '2023-01-10', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-de-20260924','US-DE','legal_commercial_access',
   'Delaware operates licensed adult-use and medical cannabis under state medical/adult-use framework.',
   'Delaware Division of Public Health — Medical Marijuana','https://dhss.delaware.gov/dhss/dph/hsp/mmp.html',
   '2023-08-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-ma-20260924','US-MA','legal_commercial_access',
   'Massachusetts licenses adult-use and medical cannabis establishments through the Cannabis Control Commission.',
   'Massachusetts Cannabis Control Commission','https://masscannabiscontrol.com/',
   '2018-11-20', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-mo-20260924','US-MO','legal_commercial_access',
   'Missouri operates licensed adult-use and medical cannabis under the Division of Cannabis Regulation.',
   'Missouri Division of Cannabis Regulation','https://health.mo.gov/safety/cannabis/',
   '2023-02-03', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-nj-20260924','US-NJ','legal_commercial_access',
   'New Jersey licenses adult-use and medical cannabis through the Cannabis Regulatory Commission.',
   'New Jersey Cannabis Regulatory Commission','https://www.nj.gov/cannabis/',
   '2022-04-21', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-nm-20260924','US-NM','legal_commercial_access',
   'New Mexico operates licensed adult-use and medical cannabis under the Cannabis Control Division.',
   'New Mexico Regulation and Licensing Department — Cannabis Control Division','https://www.rld.nm.gov/cannabis/',
   '2022-04-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-nv-20260924','US-NV','legal_commercial_access',
   'Nevada licenses adult-use and medical cannabis establishments through the Cannabis Compliance Board.',
   'Nevada Cannabis Compliance Board','https://ccb.nv.gov/',
   '2017-07-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-ny-20260924','US-NY','legal_commercial_access',
   'New York licenses adult-use and medical cannabis through the Office of Cannabis Management.',
   'New York Office of Cannabis Management','https://cannabis.ny.gov/',
   '2022-12-29', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-oh-20260924','US-OH','legal_commercial_access',
   'Ohio operates licensed adult-use and medical cannabis under the Division of Cannabis Control.',
   'Ohio Division of Cannabis Control','https://com.ohio.gov/divisions-and-programs/cannabis-control',
   '2023-12-07', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-or-20260924','US-OR','legal_commercial_access',
   'Oregon licenses adult-use and medical cannabis through the Oregon Liquor and Cannabis Commission.',
   'Oregon Liquor and Cannabis Commission','https://www.oregon.gov/olcc/marijuana/pages/default.aspx',
   '2015-10-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-ri-20260924','US-RI','legal_commercial_access',
   'Rhode Island operates licensed adult-use and medical cannabis under the Office of Cannabis Regulation.',
   'Rhode Island Office of Cannabis Regulation','https://dbr.ri.gov/cannabis',
   '2022-12-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-wa-20260924','US-WA','legal_commercial_access',
   'Washington licenses adult-use cannabis retail and production through the Liquor and Cannabis Board.',
   'Washington State Liquor and Cannabis Board','https://lcb.wa.gov/',
   '2014-07-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-ar-20260924','US-AR','medical_limited_trade',
   'Arkansas operates a regulated medical cannabis programme; no operational adult-use retail market verified.',
   'Arkansas Medical Marijuana Commission','https://www.mmc.arkansas.gov/',
   '2017-05-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-fl-20260924','US-FL','medical_limited_trade',
   'Florida operates a regulated medical cannabis (MMTC) programme; no adult-use retail market verified.',
   'Florida Office of Medical Marijuana Use','https://knowthefactsmmj.com/',
   '2017-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-la-20260924','US-LA','medical_limited_trade',
   'Louisiana operates a medical cannabis programme under the Louisiana Department of Health.',
   'Louisiana Department of Health — Medical Marijuana','https://ldh.la.gov/page/medical-marijuana',
   '2019-08-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-ms-20260924','US-MS','medical_limited_trade',
   'Mississippi operates a medical cannabis programme under the Mississippi Department of Health.',
   'Mississippi State Department of Health — Medical Cannabis','https://msdh.ms.gov/',
   '2022-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-nd-20260924','US-ND','medical_limited_trade',
   'North Dakota operates a medical cannabis programme; no adult-use retail market verified.',
   'North Dakota Department of Health and Human Services — Medical Marijuana','https://www.hhs.nd.gov/health/medical-marijuana',
   '2019-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-ne-20260924','US-NE','medical_limited_trade',
   'Nebraska has enacted medical cannabis access; operational adult-use retail is not verified.',
   'Nebraska Legislature — medical cannabis framework','https://nebraskalegislature.gov/',
   '2024-11-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-ok-20260924','US-OK','medical_limited_trade',
   'Oklahoma operates a medical cannabis patient and licensee programme under OMMA.',
   'Oklahoma Medical Marijuana Authority','https://oklahoma.gov/omma.html',
   '2018-07-26', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-wv-20260924','US-WV','medical_limited_trade',
   'West Virginia operates a medical cannabis programme; no adult-use retail market verified.',
   'West Virginia Office of Medical Cannabis','https://dhhr.wv.gov/bph/Pages/Medical-Cannabis.aspx',
   '2019-07-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-in-20260924','US-IN','cbd_hemp_only',
   'Indiana does not operate a full THC medical or adult-use cannabis market; lawful pathways centre on hemp/low-THC products.',
   'Indiana State Department of Agriculture — Hemp','https://www.in.gov/isda/divisions/hemp/',
   '2019-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-ks-20260924','US-KS','cbd_hemp_only',
   'Kansas does not operate a full THC medical or adult-use cannabis market; lawful pathways centre on hemp products.',
   'Kansas Department of Agriculture — Industrial Hemp','https://agriculture.ks.gov/divisions-programs/agricultural-marketing-advocacy-and-outreach-team/industrial-hemp',
   '2019-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-sc-20260924','US-SC','cbd_hemp_only',
   'South Carolina does not operate a full THC medical or adult-use cannabis market; lawful access is limited to hemp/low-THC pathways.',
   'South Carolina Department of Agriculture','https://agriculture.sc.gov/',
   '2019-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-wy-20260924','US-WY','cbd_hemp_only',
   'Wyoming does not operate a full THC medical or adult-use cannabis market; lawful pathways centre on hemp products.',
   'Wyoming Department of Agriculture — Hemp','https://wyagric.state.wy.us/',
   '2019-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-us-federal-20260924','US','medical_limited_trade',
   'State medical and adult-use markets operate under state law; no verified nationwide interstate commercial cannabis pathway is published for globe colouring.',
   'US FDA — cannabis and cannabis-derived products','https://www.fda.gov/news-events/public-health-focus/fda-regulation-cannabis-and-cannabis-derived-products-including-cannabidiol-cbd',
   '1970-10-27', now(), now() + interval '365 days', true),
  ('hv-heatmap-gb-20260924','GB','medical_limited_trade',
   'The United Kingdom permits prescribed specialist medical cannabis products; adult-use commercial retail is not authorised.',
   'UK MHRA / GOV.UK medicinal cannabis resources','https://www.gov.uk/government/collections/medicinal-cannabis-information-and-resources',
   '2018-11-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-de-20260924','DE','legal_commercial_access',
   'Germany permits medical cannabis and limited adult-use personal/association pathways under CanG; licensed medical trade pathways exist.',
   'BfArM — Cannabis','https://www.bfarm.de/DE/Bundesopiumstelle/Cannabis/_node.html',
   '2024-04-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-au-20260924','AU','medical_limited_trade',
   'Australia operates a regulated medicinal cannabis scheme under the TGA; adult-use commercial retail is not authorised at Commonwealth level.',
   'Therapeutic Goods Administration — Medicinal cannabis','https://www.tga.gov.au/products/medicinal-cannabis',
   '2016-11-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-fr-20260924','FR','medical_limited_trade',
   'France authorises limited medical cannabis pathways; general adult-use commercial retail is not authorised.',
   'Agence nationale de sécurité du médicament (ANSM)','https://ansm.sante.fr/',
   '2021-03-26', now(), now() + interval '365 days', true),
  ('hv-heatmap-es-20260924','ES','medical_limited_trade',
   'Spain permits controlled medical cannabis pathways; general adult-use commercial retail is not authorised at national level.',
   'Agencia Española de Medicamentos y Productos Sanitarios','https://www.aemps.gob.es/',
   '2022-06-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-it-20260924','IT','medical_limited_trade',
   'Italy authorises medical cannabis production and prescribing under Ministry of Health frameworks.',
   'Ministero della Salute','https://www.salute.gov.it/',
   '2015-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-jp-20260924','JP','cbd_hemp_only',
   'Japan strictly controls cannabis; lawful commercial pathways centre on non-controlled hemp/CBD products meeting THC limits.',
   'Japan Ministry of Health, Labour and Welfare','https://www.mhlw.go.jp/',
   '1948-07-10', now(), now() + interval '365 days', true),
  ('hv-heatmap-mx-20260924','MX','medical_limited_trade',
   'Mexico has medical and personal-use pathways; a fully operational national adult-use commercial retail licensing scheme is not treated as verified for globe publication.',
   'COFEPRIS','https://www.gob.mx/cofepris',
   '2021-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-co-20260924','CO','legal_commercial_access',
   'Colombia licenses medicinal cannabis cultivation and foreign trade under national authorities.',
   'Instituto Colombiano Agropecuario / INVIMA','https://www.ica.gov.co/',
   '2016-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-th-20260924','TH','medical_limited_trade',
   'Thailand regulates medical cannabis; a stable verified general adult-use commercial retail pathway is not treated as established for globe publication.',
   'Thai Food and Drug Administration','https://www.fda.moph.go.th/',
   '2022-06-09', now(), now() + interval '365 days', true),
  ('hv-heatmap-nz-20260924','NZ','medical_limited_trade',
   'New Zealand operates a medicinal cannabis scheme; adult-use commercial retail was not authorised by referendum.',
   'New Zealand Ministry of Health — Medicinal Cannabis','https://www.health.govt.nz/our-work/regulation-health-and-disability-system/medicinal-cannabis-agency',
   '2020-04-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-za-20260924','ZA','medical_limited_trade',
   'South Africa permits private use under court guidance and regulated medical pathways; general adult-use commercial retail is not fully established as verified.',
   'South African Health Products Regulatory Authority (SAHPRA)','https://www.sahpra.org.za/',
   '2018-09-18', now(), now() + interval '365 days', true)
on conflict (evidence_key) do update set
  tier = excluded.tier,
  rationale = excluded.rationale,
  authority_name = excluded.authority_name,
  authority_url = excluded.authority_url,
  source_effective_date = excluded.source_effective_date,
  verified_at = excluded.verified_at,
  expires_at = excluded.expires_at,
  active = true;

update public.regulatory_market_access_evidence e
set active = false
where e.jurisdiction_iso2 in (
  'US-AK','US-AZ','US-CO','US-CT','US-DE','US-MA','US-MO','US-NJ','US-NM','US-NV','US-NY','US-OH','US-OR','US-RI','US-WA',
  'US-AR','US-FL','US-LA','US-MS','US-ND','US-NE','US-OK','US-WV',
  'US-IN','US-KS','US-SC','US-WY',
  'US','GB','DE','AU','FR','ES','IT','JP','MX','CO','TH','NZ','ZA'
)
and e.evidence_key not like 'hv-heatmap-%-20260924'
and e.active = true;

select * from api.refresh_verified_market_access_tiers('heatmap-publish-us-priority-20260924');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924150000','publish_heatmap_us_states_and_priority_nationals','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924150000_publish_heatmap_us_states_and_priority_nationals.sql

-- RECOVERY BEGIN 20260924152000_regulatory_tier_evidence_reconciliation.sql
-- Reconcile verified commercial market-access tier evidence already present in the
-- authoritative regulatory evidence store. Never infer missing tiers.

with tier as (
  select distinct on (e.jurisdiction_iso2)
    e.jurisdiction_iso2, e.tier, e.rationale, e.authority_name, e.authority_url,
    e.source_effective_date, e.verified_at, e.source_snapshot_sha256
  from public.regulatory_market_access_evidence e
  where e.active and e.tier is not null
  order by e.jurisdiction_iso2, e.verified_at desc nulls last
)
insert into public.jurisdiction_data_depth_evidence (
  jurisdiction_key, dimension_key, contract_version, evidence_kind, applicability,
  evidence_payload, evidence_quote, source_registry_id, source_snapshot_id,
  source_url, effective_from, verification_status, verified_at, created_at, updated_at
)
select t.jurisdiction_iso2, 'regulatory_tier', '2026-09-23.v2',
  'authority_statement', 'applicable',
  jsonb_build_object(
    'tier', t.tier, 'rationale', t.rationale, 'authority', t.authority_name
  ),
  left(coalesce(t.rationale, t.tier::text), 1000),
  sr.id, ss.id, t.authority_url, t.source_effective_date,
  'verified', t.verified_at, now(), now()
from tier t
join public.source_registry sr on sr.source_url=t.authority_url
join lateral (
  select ss.*
  from public.source_snapshots ss
  where ss.source_id=sr.id
    and ss.fetch_status='success'
    and length(coalesce(ss.captured_text,'')) > 0
    and lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
    and (t.source_snapshot_sha256 is null or ss.raw_html_hash=t.source_snapshot_sha256)
  order by
    case when t.source_snapshot_sha256 is not null
      and ss.raw_html_hash=t.source_snapshot_sha256 then 0 else 1 end,
    ss.captured_at desc
  limit 1
) ss on true
where not exists (
  select 1 from public.jurisdiction_data_depth_evidence x
  where x.jurisdiction_key=t.jurisdiction_iso2
    and x.dimension_key='regulatory_tier'
    and x.contract_version='2026-09-23.v2'
    and x.verification_status='verified'
)
on conflict do nothing;

with ev as (
  select e.jurisdiction_key,e.dimension_key,
    count(*) filter(where e.verification_status='verified') ec,
    count(*) filter(where e.verification_status='verified' and v.qualifying_provenance) pc,
    max(e.verified_at) lv
  from public.jurisdiction_data_depth_evidence e
  left join public.v_jurisdiction_data_depth_v2_evidence_gate v
    on v.jurisdiction_key=e.jurisdiction_key
   and v.dimension_key=e.dimension_key
   and v.contract_version=e.contract_version
   and v.verification_status=e.verification_status
  where e.contract_version='2026-09-23.v2'
  group by e.jurisdiction_key,e.dimension_key
),
b as (
  select s.jurisdiction_key,s.dimension_key,s.contract_version,s.applicability,
    d.requires_primary_source,d.freshness_days,
    coalesce(ev.ec,0) ec,coalesce(ev.pc,0) pc,ev.lv
  from public.jurisdiction_data_depth_dimension_state s
  join public.jurisdiction_data_depth_dimensions d on d.dimension_key=s.dimension_key
  left join ev on ev.jurisdiction_key=s.jurisdiction_key and ev.dimension_key=s.dimension_key
  where s.contract_version='2026-09-23.v2'
)
update public.jurisdiction_data_depth_dimension_state s
set evidence_count=b.ec, primary_source_count=b.pc, latest_verified_at=b.lv,
    freshness_deadline=case when b.lv is not null and b.freshness_days is not null
      then b.lv+make_interval(days=>b.freshness_days) end,
    status=case
      when b.dimension_key in ('identity','hierarchy') or b.applicability='not_applicable' then 'complete'
      when b.ec=0 then 'unmeasured'
      when b.requires_primary_source and b.pc=0 then 'blocked'
      when b.freshness_days is not null and b.lv+make_interval(days=>b.freshness_days)<now() then 'stale'
      else 'complete' end,
    blocker_reason=case
      when b.dimension_key in ('identity','hierarchy') or b.applicability='not_applicable' then null
      when b.ec=0 then 'No verified evidence captured for this jurisdiction/dimension.'
      when b.requires_primary_source and b.pc=0 then 'Verified evidence exists but qualifying primary-source provenance is absent.'
      when b.freshness_days is not null and b.lv+make_interval(days=>b.freshness_days)<now() then 'Latest verified evidence is past the dimension freshness window.'
      else null end,
    confidence=case when b.ec=0 then 'unknown' when b.pc>0 then 'high' else 'medium' end,
    evidence_basis=case when b.ec=0 then 'unresolved'
      when b.pc>0 then 'direct_verified_source' else 'verified_structural_or_research' end,
    last_evaluated_at=now(), updated_at=now()
from b
where s.jurisdiction_key=b.jurisdiction_key
  and s.dimension_key=b.dimension_key
  and s.contract_version=b.contract_version;

do $$
declare dims int; jurs int; matrix int;
begin
  select count(*) into dims from public.jurisdiction_data_depth_dimensions where contract_version='2026-09-23.v2';
  select count(*) into jurs from public.countries;
  select count(*) into matrix from public.jurisdiction_data_depth_dimension_state where contract_version='2026-09-23.v2';
  if dims <> 32 or jurs <> 291 or matrix <> 9312 then
    raise exception '291x32 invariant failed: dimensions %, jurisdictions %, matrix %',dims,jurs,matrix;
  end if;
end $$;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924152000','regulatory_tier_evidence_reconciliation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924152000_regulatory_tier_evidence_reconciliation.sql

-- RECOVERY BEGIN 20260924162000_regulator_evidence_depth_backfill.sql
-- Increase authoritative regulator evidence depth from existing verified primary-regulator sources.
-- No synthetic regulatory facts are introduced. Only rows with verified_at, a valid snapshot SHA-256,
-- a matching source_registry URL, and a successful source_snapshots hash are eligible.

insert into public.jurisdiction_data_depth_evidence (
  jurisdiction_key, dimension_key, contract_version, evidence_kind, applicability,
  evidence_payload, evidence_quote, source_registry_id, source_snapshot_id, source_url,
  effective_from, effective_to, verification_status, verified_at
)
select
  x.jurisdiction_iso2,
  'regulator',
  'v2',
  'authority_statement',
  'applicable',
  jsonb_build_object(
    'authority_name', x.authority_name,
    'authority_url', x.authority_url,
    'source_class', x.source_class,
    'source_title', x.source_title,
    'jurisdiction_level', x.jurisdiction_level,
    'parent_iso2', x.parent_iso2
  ),
  x.source_title,
  x.source_registry_id,
  x.source_snapshot_id,
  x.authority_url,
  x.source_effective_date::date,
  x.expires_at::date,
  'verified',
  x.verified_at
from (
  select
    ps.*,
    sr.id as source_registry_id,
    ss.id as source_snapshot_id,
    row_number() over (
      partition by ps.jurisdiction_iso2
      order by ps.verified_at desc, ps.source_effective_date desc nulls last
    ) as rn
  from public.regulatory_market_access_primary_sources ps
  join public.source_registry sr on sr.source_url = ps.authority_url
  join public.source_snapshots ss
    on ss.source_id = sr.id
   and ss.raw_html_hash = ps.source_snapshot_sha256
  where ps.verified_at is not null
    and ps.source_snapshot_sha256 is not null
    and length(ps.source_snapshot_sha256) = 64
    and ps.source_class = 'primary_regulator'
) x
where x.rn = 1
  and not exists (
    select 1
    from public.jurisdiction_data_depth_evidence e
    where e.jurisdiction_key = x.jurisdiction_iso2
      and e.dimension_key = 'regulator'
      and e.contract_version = 'v2'
      and e.verification_status = 'verified'
  );

-- Reconcile the affected dimension state from the evidence just captured.
with e as (
  select
    jurisdiction_key,
    count(*) as evidence_count,
    count(*) filter (where source_registry_id is not null) as primary_source_count,
    max(verified_at) as latest_verified_at
  from public.jurisdiction_data_depth_evidence
  where dimension_key = 'regulator'
    and contract_version = 'v2'
    and verification_status = 'verified'
  group by jurisdiction_key
)
update public.jurisdiction_data_depth_dimension_state s
set
  applicability = 'applicable',
  status = 'complete',
  blocker_reason = null,
  evidence_count = e.evidence_count,
  primary_source_count = e.primary_source_count,
  latest_verified_at = e.latest_verified_at,
  freshness_deadline = e.latest_verified_at + interval '30 days',
  confidence = 'high',
  evidence_basis = 'direct_verified_source',
  last_evaluated_at = now(),
  updated_at = now()
from e
where s.jurisdiction_key = e.jurisdiction_key
  and s.dimension_key = 'regulator'
  and s.contract_version = '2026-09-23.v2';

-- Regression assertions: exactly the canonical 32 dimensions remain, and regulator evidence is provenance-backed.
do $$
declare
  v_dimensions integer;
  v_bad integer;
  v_regulator integer;
begin
  select count(*) into v_dimensions
  from public.jurisdiction_data_depth_dimensions
  where contract_version = '2026-09-23.v2';

  select count(*) into v_bad
  from public.jurisdiction_data_depth_evidence
  where dimension_key = 'regulator'
    and contract_version = 'v2'
    and verification_status = 'verified'
    and (source_registry_id is null or source_snapshot_id is null or source_url !~ '^https://');

  select count(distinct jurisdiction_key) into v_regulator
  from public.jurisdiction_data_depth_evidence
  where dimension_key = 'regulator'
    and contract_version = 'v2'
    and verification_status = 'verified';

  if v_dimensions <> 32 then
    raise exception 'Expected 32 canonical depth dimensions, found %', v_dimensions;
  end if;
  if v_bad <> 0 then
    raise exception 'Found % regulator evidence rows without complete source provenance', v_bad;
  end if;
  if v_regulator < 55 then
    raise exception 'Expected at least 55 provenance-backed regulator jurisdictions, found %', v_regulator;
  end if;
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924162000','regulator_evidence_depth_backfill','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924162000_regulator_evidence_depth_backfill.sql

-- RECOVERY BEGIN 20260924170000_structured_dimension_adjudication_engine_v2.sql
-- Structured dimension-specific evidence adjudication engine v2.
-- Fail-closed promotion contract:
--   1. registered HTTPS source
--   2. successful snapshot with 64-char SHA-256
--   3. exact quote present in the snapshot
--   4. explicit effective date
--   5. exact jurisdiction scope
--   6. authoritative source class / source tier
--   7. dimension-specific semantics
-- No parent inheritance and no generic keyword auto-promotion.

create table if not exists public.jurisdiction_data_depth_adjudication_runs (
  id uuid primary key default gen_random_uuid(),
  engine_version text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  candidates_seen integer not null default 0,
  promoted integer not null default 0,
  blocked integer not null default 0,
  unmeasured integer not null default 0,
  notes text
);

create table if not exists public.jurisdiction_data_depth_gate_results (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.jurisdiction_data_depth_extraction_candidates(id) on delete cascade,
  jurisdiction_key text not null,
  dimension_key text not null,
  source_gate boolean not null,
  quote_gate boolean not null,
  effective_date_gate boolean not null,
  jurisdiction_scope_gate boolean not null,
  semantics_gate boolean not null,
  authority_gate boolean not null,
  decision text not null check (decision in ('accepted','blocked','unmeasured')),
  reason text not null,
  evaluated_at timestamptz not null default now()
);

create index if not exists jd_depth_gate_candidate_idx
  on public.jurisdiction_data_depth_gate_results(candidate_id);
create index if not exists jd_depth_gate_jd_idx
  on public.jurisdiction_data_depth_gate_results(jurisdiction_key,dimension_key);

create or replace function public.extract_dimension_quote(p_text text,p_dimension text)
returns text language plpgsql immutable set search_path=pg_catalog as $$
declare term text; terms text[]; pos integer; start_pos integer; end_pos integer;
begin
  if p_text is null or length(p_text)<40 then return null; end if;
  terms := case p_dimension
    when 'claims' then array['licensed','licence','license','permit','authorized','authorised','medical cannabis','adult-use','adult use','recreational cannabis','commercial cannabis','import','export','distribution','cultivation','processing','sale','selling']
    when 'regulatory_tier' then array['licensed','licence','license','permit','authorized','authorised','medical cannabis','adult-use','adult use','recreational cannabis','commercial cannabis','import','export','distribution','cultivation','processing','sale','selling','prohibited','illegal']
    when 'pathways' then array['license','licence','licensing','permit','authorization','authorisation','application']
    when 'import' then array['import','importation','import permit']
    when 'export' then array['export','exportation','export permit']
    when 'distribution' then array['distribution','distributor','wholesale']
    when 'testing' then array['testing','laboratory','laboratories','lab testing']
    when 'packaging_labeling' then array['packaging','labelling','labeling']
    when 'tax_fees' then array['tax','excise','fee','fees']
    when 'commercial_activity' then array['sale','selling','cultivation','production','processing','commercial']
    else array[]::text[]
  end;
  foreach term in array terms loop
    pos := strpos(lower(p_text),lower(term));
    if pos > 0 then
      start_pos := greatest(1,pos-260);
      end_pos := least(length(p_text),pos+500);
      return trim(substring(p_text from start_pos for end_pos-start_pos+1));
    end if;
  end loop;
  return null;
end $$;

revoke all on function public.extract_dimension_quote(text,text) from public,anon,authenticated;
grant execute on function public.extract_dimension_quote(text,text) to service_role;

create or replace function public.adjudicate_structured_depth(p_limit integer default 250)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare r record; q text; cand uuid; runid uuid:=gen_random_uuid();
src_ok boolean; quote_ok boolean; eff_ok boolean; scope_ok boolean; sem_ok boolean; auth_ok boolean; ok boolean;
reason text; v_seen int:=0; v_promoted int:=0; v_unmeasured int:=0;
begin
insert into public.jurisdiction_data_depth_adjudication_runs(id,engine_version,notes)
values(runid,'structured-adjudication-v2','Fail-closed: source + exact quote + effective date + exact jurisdiction scope + dimension semantics + authority.');

for r in
select c.claim_id,c.jurisdiction_iso2 jurisdiction_key,c.claim_key,c.claim_text,c.product_class,c.jurisdiction_scope,c.authority_url,c.source_effective_date,c.source_snapshot_sha256,c.verified_at,
sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_text,sr.regulator_class,sr.tier source_tier
from public.regulatory_market_access_claims c
join public.source_registry sr on lower(regexp_replace(sr.source_url,'/$',''))=lower(regexp_replace(c.authority_url,'/$',''))
join public.source_snapshots ss on ss.source_id=sr.id and ss.raw_html_hash=c.source_snapshot_sha256 and ss.fetch_status='success'
where c.verified_at is not null and c.source_effective_date is not null and c.source_snapshot_sha256 is not null and c.claim_text is not null
and length(trim(c.claim_text))>=20 and c.authority_url ~ '^https://' and coalesce(c.evidence_status,'') not in ('rejected','superseded')
order by c.verified_at desc limit greatest(1,least(coalesce(p_limit,250),1000))
loop
v_seen:=v_seen+1;q:=public.extract_dimension_quote(r.captured_text,'claims');quote_ok:=q is not null and length(q)>=40;q:=coalesce(q,'[NO_EXACT_SOURCE_QUOTE]');
src_ok:=r.source_registry_id is not null and r.source_snapshot_id is not null and length(r.source_snapshot_sha256)=64;
eff_ok:=r.source_effective_date is not null;
scope_ok:=r.jurisdiction_key is not null and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key) and coalesce(r.jurisdiction_scope,'')<>'';
sem_ok:=lower(r.claim_key||' '||r.claim_text||' '||coalesce(r.product_class,'')) ~ '(access|market|licen|permit|commercial|medical|adult|recreational|sale|cultivat|produc|process|import|export|distribut|testing|packag|label|tax|fee)';
auth_ok:=coalesce(r.regulator_class,'other') in ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement') or coalesce(r.source_tier,99)<=2;
ok:=src_ok and quote_ok and eff_ok and scope_ok and sem_ok and auth_ok;
reason:=concat_ws(';',case when not src_ok then 'source' end,case when not quote_ok then 'quote' end,case when not eff_ok then 'effective_date' end,case when not scope_ok then 'jurisdiction_scope' end,case when not sem_ok then 'semantics' end,case when not auth_ok then 'authority' end);
insert into public.jurisdiction_data_depth_extraction_candidates(source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,candidate_payload,evidence_quote,confidence,extraction_method,status,adjudication_reason)
values(r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,'claims','structured_rule',jsonb_build_object('claim_id',r.claim_id,'claim_key',r.claim_key,'claim_text',r.claim_text,'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,'effective_from',r.source_effective_date,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,case when ok then 'high' else 'medium' end,'structured_claim_v2',case when ok then 'accepted' else 'needs_review' end,coalesce(nullif(reason,''),'all gates passed'))
on conflict(source_snapshot_id,dimension_key,evidence_quote) do update set candidate_payload=excluded.candidate_payload,confidence=excluded.confidence,extraction_method=excluded.extraction_method,status=excluded.status,adjudication_reason=excluded.adjudication_reason,updated_at=now() returning id into cand;
insert into public.jurisdiction_data_depth_gate_results(candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
values(cand,r.jurisdiction_key,'claims',src_ok,quote_ok,eff_ok,scope_ok,sem_ok,auth_ok,case when ok then 'accepted' else 'unmeasured' end,coalesce(nullif(reason,''),'all gates passed'));
if ok then
v_promoted:=v_promoted+1;
insert into public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
values(r.jurisdiction_key,'claims','v2','authority_rule','applicable',jsonb_build_object('claim_id',r.claim_id,'claim_key',r.claim_key,'claim_text',r.claim_text,'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,r.source_registry_id,r.source_snapshot_id,r.authority_url,r.source_effective_date,'verified',r.verified_at) on conflict do nothing;
else v_unmeasured:=v_unmeasured+1; end if;
end loop;

for r in
select e.evidence_key,e.jurisdiction_iso2 jurisdiction_key,e.tier,e.rationale,e.authority_name,e.authority_url,e.source_effective_date,e.verified_at,e.source_snapshot_sha256,e.parent_iso2,
sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_text,sr.regulator_class,sr.tier source_tier
from public.regulatory_market_access_evidence e
join public.source_registry sr on lower(regexp_replace(sr.source_url,'/$',''))=lower(regexp_replace(e.authority_url,'/$',''))
join public.source_snapshots ss on ss.source_id=sr.id and ss.raw_html_hash=e.source_snapshot_sha256 and ss.fetch_status='success'
where e.active=true and e.verified_at is not null and e.source_effective_date is not null and e.source_snapshot_sha256 is not null and length(e.source_snapshot_sha256)=64 and e.authority_url ~ '^https://' and e.parent_iso2 is null
order by e.verified_at desc limit greatest(1,least(coalesce(p_limit,250),1000))
loop
v_seen:=v_seen+1;q:=public.extract_dimension_quote(r.captured_text,'regulatory_tier');quote_ok:=q is not null and length(q)>=40;q:=coalesce(q,'[NO_EXACT_SOURCE_QUOTE]');
src_ok:=r.source_registry_id is not null and r.source_snapshot_id is not null and length(r.source_snapshot_sha256)=64;eff_ok:=r.source_effective_date is not null;
scope_ok:=r.jurisdiction_key is not null and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key) and r.parent_iso2 is null;
sem_ok:=lower(coalesce(r.tier,'')||' '||coalesce(r.rationale,'')) ~ '(medical|adult|recreational|commercial|licen|market|cultivat|manufactur|process|sale|sell|export|import|prohibit|illegal|permit)';
auth_ok:=coalesce(r.regulator_class,'other') in ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement') or coalesce(r.source_tier,99)<=2;ok:=src_ok and quote_ok and eff_ok and scope_ok and sem_ok and auth_ok;
reason:=concat_ws(';',case when not src_ok then 'source' end,case when not quote_ok then 'quote' end,case when not eff_ok then 'effective_date' end,case when not scope_ok then 'jurisdiction_scope' end,case when not sem_ok then 'commercial_market_access_semantics' end,case when not auth_ok then 'authority' end);
insert into public.jurisdiction_data_depth_extraction_candidates(source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,candidate_payload,evidence_quote,confidence,extraction_method,status,adjudication_reason)
values(r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,'regulatory_tier','structured_rule',jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,'authority_name',r.authority_name,'authority_url',r.authority_url,'effective_from',r.source_effective_date,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,case when ok then 'high' else 'medium' end,'structured_tier_v2',case when ok then 'accepted' else 'needs_review' end,coalesce(nullif(reason,''),'all gates passed'))
on conflict(source_snapshot_id,dimension_key,evidence_quote) do update set candidate_payload=excluded.candidate_payload,confidence=excluded.confidence,extraction_method=excluded.extraction_method,status=excluded.status,adjudication_reason=excluded.adjudication_reason,updated_at=now() returning id into cand;
insert into public.jurisdiction_data_depth_gate_results(candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
values(cand,r.jurisdiction_key,'regulatory_tier',src_ok,quote_ok,eff_ok,scope_ok,sem_ok,auth_ok,case when ok then 'accepted' else 'unmeasured' end,coalesce(nullif(reason,''),'all gates passed'));
if ok then
v_promoted:=v_promoted+1;
insert into public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
values(r.jurisdiction_key,'regulatory_tier','v2','authority_rule','applicable',jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,'authority_name',r.authority_name,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,r.source_registry_id,r.source_snapshot_id,r.authority_url,r.source_effective_date,'verified',r.verified_at) on conflict do nothing;
else v_unmeasured:=v_unmeasured+1;end if;
end loop;

update public.jurisdiction_data_depth_extraction_candidates set status='needs_review',adjudication_reason=coalesce(adjudication_reason,'Awaiting structured dimension-specific adjudication.'),updated_at=now() where status='pending' and extraction_method='conservative_keyword_v1';
update public.jurisdiction_data_depth_adjudication_runs set finished_at=now(),candidates_seen=v_seen,promoted=v_promoted,unmeasured=v_unmeasured,notes='v2 gates enforced.' where id=runid;
return jsonb_build_object('run_id',runid,'engine_version','structured-adjudication-v2','candidates_seen',v_seen,'promoted',v_promoted,'unmeasured',v_unmeasured);
end $$;

revoke all on function public.adjudicate_structured_depth(integer) from public,anon,authenticated;
grant execute on function public.adjudicate_structured_depth(integer) to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924170000','structured_dimension_adjudication_engine_v2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924170000_structured_dimension_adjudication_engine_v2.sql

-- RECOVERY BEGIN 20260924170100_structured_adjudication_engine_rls.sql
alter table public.jurisdiction_data_depth_adjudication_runs enable row level security;
alter table public.jurisdiction_data_depth_gate_results enable row level security;

drop policy if exists "service role only" on public.jurisdiction_data_depth_adjudication_runs;
drop policy if exists "service role only" on public.jurisdiction_data_depth_gate_results;

create policy "service role only"
  on public.jurisdiction_data_depth_adjudication_runs
  for all to service_role using (true) with check (true);

create policy "service role only"
  on public.jurisdiction_data_depth_gate_results
  for all to service_role using (true) with check (true);

revoke all on public.jurisdiction_data_depth_adjudication_runs from anon,authenticated;
revoke all on public.jurisdiction_data_depth_gate_results from anon,authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260924170100','structured_adjudication_engine_rls','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260924170100_structured_adjudication_engine_rls.sql

-- RECOVERY BEGIN 20260925060000_dimension_specific_adjudication_engine.sql
-- Dimension-specific evidence adjudication contract and derived research queue.
-- Production equivalent was validated against project zvxdgdkukjrrwamdpqrg before commit.
create table if not exists public.jurisdiction_data_depth_dimension_gate_contract (
  dimension_key text primary key,
  contract_version text not null,
  evidence_kind text not null,
  requires_source_registry boolean not null default true,
  requires_source_snapshot boolean not null default true,
  requires_quote boolean not null default true,
  requires_effective_date boolean not null default true,
  semantic_rule text not null,
  authoritative_source_required boolean not null default true,
  parent_inheritance_allowed boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.jurisdiction_data_depth_dimension_gate_contract
(dimension_key,contract_version,evidence_kind,requires_source_registry,requires_source_snapshot,requires_quote,requires_effective_date,semantic_rule,authoritative_source_required,parent_inheritance_allowed)
values
('access_rules','v1','authority_rule',true,true,true,true,'access/possession/eligibility/age/conditions semantics',true,false),
('change_history','v1','authority_statement',true,true,true,true,'documented regulatory change with source evidence',true,false),
('freshness','v1','structural_fact',true,true,false,false,'captured snapshot age and SHA-256 integrity',true,false),
('uncertainty','v1','verified_research',true,true,true,false,'explicit conflict/blocked adjudication with evidence lineage',true,false),
('research_queue','v1','verified_research',false,false,false,false,'derived unresolved work queue; stored separately from authoritative evidence',false,false)
on conflict (dimension_key) do update set
 contract_version=excluded.contract_version,
 evidence_kind=excluded.evidence_kind,
 requires_source_registry=excluded.requires_source_registry,
 requires_source_snapshot=excluded.requires_source_snapshot,
 requires_quote=excluded.requires_quote,
 requires_effective_date=excluded.requires_effective_date,
 semantic_rule=excluded.semantic_rule,
 authoritative_source_required=excluded.authoritative_source_required,
 parent_inheritance_allowed=excluded.parent_inheritance_allowed,
 updated_at=now();

alter table public.jurisdiction_data_depth_dimension_gate_contract enable row level security;
revoke all on public.jurisdiction_data_depth_dimension_gate_contract from public;
grant select on public.jurisdiction_data_depth_dimension_gate_contract to service_role;

create table if not exists public.jurisdiction_data_depth_research_queue (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null,
  dimension_key text not null,
  status text not null,
  blocker_reason text,
  evidence_count integer not null default 0,
  priority integer not null default 50,
  source_snapshot_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(jurisdiction_key,dimension_key)
);
alter table public.jurisdiction_data_depth_research_queue enable row level security;
revoke all on public.jurisdiction_data_depth_research_queue from public;
grant select on public.jurisdiction_data_depth_research_queue to service_role;

create or replace function public.refresh_depth_research_queue(p_limit integer default 10000)
returns integer language plpgsql security definer set search_path=public as $$
declare n integer;
begin
  insert into jurisdiction_data_depth_research_queue
    (jurisdiction_key,dimension_key,status,blocker_reason,evidence_count,priority,source_snapshot_id)
  select s.jurisdiction_key,s.dimension_key,s.status,s.blocker_reason,s.evidence_count,
         case when s.status='blocked' then 10 else 50 end,
         (select e.source_snapshot_id from jurisdiction_data_depth_evidence e
          where e.jurisdiction_key=s.jurisdiction_key and e.source_snapshot_id is not null
          order by e.verified_at desc limit 1)
  from jurisdiction_data_depth_dimension_state s
  where s.status in ('unmeasured','blocked') and s.dimension_key<>'research_queue'
  limit p_limit
  on conflict(jurisdiction_key,dimension_key) do update set
    status=excluded.status, blocker_reason=excluded.blocker_reason,
    evidence_count=excluded.evidence_count, priority=excluded.priority,
    source_snapshot_id=coalesce(excluded.source_snapshot_id,jurisdiction_data_depth_research_queue.source_snapshot_id),
    updated_at=now();
  get diagnostics n=row_count;
  return n;
end $$;
revoke all on function public.refresh_depth_research_queue(integer) from public;
grant execute on function public.refresh_depth_research_queue(integer) to service_role;

create or replace function public.recompute_depth_state_for_dimension(p_dimension text)
returns integer language plpgsql security definer set search_path=public as $$
declare n integer;
begin
  update jurisdiction_data_depth_dimension_state s
  set evidence_count=coalesce(e.cnt,0),
      primary_source_count=coalesce(e.primary_cnt,0),
      latest_verified_at=e.latest_verified,
      confidence=e.confidence,
      evidence_basis=e.basis,
      status=case
        when e.cnt > 0 then 'complete'
        when s.status='blocked' then 'blocked'
        else 'unmeasured'
      end,
      last_evaluated_at=now(), updated_at=now()
  from (
    select s0.jurisdiction_key,
           count(e.id) cnt,
           count(distinct e.source_registry_id) filter(where e.source_registry_id is not null) primary_cnt,
           max(e.verified_at) latest_verified,
           case when bool_or((e.evidence_payload->>'confidence')='high') then 'high'
                when bool_or((e.evidence_payload->>'confidence')='medium') then 'medium'
                when bool_or((e.evidence_payload->>'confidence')='low') then 'low' else null end confidence,
           string_agg(distinct e.evidence_kind,', ' order by e.evidence_kind) basis
    from jurisdiction_data_depth_dimension_state s0
    left join jurisdiction_data_depth_evidence e
      on e.jurisdiction_key=s0.jurisdiction_key
     and e.dimension_key=s0.dimension_key
     and e.verification_status='verified'
    left join jurisdiction_data_depth_dimension_gate_contract g
      on g.dimension_key=s0.dimension_key
    where s0.dimension_key=p_dimension
      and (
        e.id is null
        or (
          (not coalesce(g.requires_source_registry,true) or e.source_registry_id is not null)
          and (not coalesce(g.requires_source_snapshot,true) or e.source_snapshot_id is not null)
          and (not coalesce(g.requires_quote,true) or nullif(btrim(e.evidence_quote),'') is not null)
          and (not coalesce(g.requires_effective_date,true) or e.effective_from is not null)
          and (not coalesce(g.parent_inheritance_allowed,false) or coalesce(e.evidence_payload->>'inherited_from','')='')
        )
      )
    group by s0.jurisdiction_key
  ) e
  where s.dimension_key=p_dimension and s.jurisdiction_key=e.jurisdiction_key;
  get diagnostics n=row_count;
  return n;
end $$;
revoke all on function public.recompute_depth_state_for_dimension(text) from public;
grant execute on function public.recompute_depth_state_for_dimension(text) to service_role;

create or replace function public.adjudicate_depth_source_metadata(p_limit integer default 1000)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_fresh integer:=0; v_change integer:=0;
begin
  with c as (
    select sr.iso jurisdiction_key,sr.id source_registry_id,ss.id source_snapshot_id,
           ss.captured_at,ss.raw_html_hash,sr.source_url,
           row_number() over(partition by sr.iso order by ss.captured_at desc) rn
    from source_registry sr join source_snapshots ss on ss.source_id=sr.id
    where sr.iso is not null and sr.iso<>'' and ss.fetch_status='success'
      and length(coalesce(ss.raw_html_hash,''))=64 and ss.captured_at is not null
      and exists(select 1 from countries x where x.iso_alpha2=sr.iso)
  )
  insert into jurisdiction_data_depth_evidence
    (jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,
     evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
  select c.jurisdiction_key,'freshness','v1','structural_fact','applicable',
    jsonb_build_object('engine','derived-freshness-v1','captured_at',c.captured_at,
      'sha256',c.raw_html_hash,'source_url',c.source_url,
      'freshness_age_days',floor(extract(epoch from(now()-c.captured_at))/86400)),
    'Source snapshot captured at '||c.captured_at::text||'; SHA-256 integrity hash recorded.',
    c.source_registry_id,c.source_snapshot_id,c.source_url,c.captured_at::date,'verified',now()
  from c where c.rn=1 and not exists(
    select 1 from jurisdiction_data_depth_evidence e
    where e.jurisdiction_key=c.jurisdiction_key and e.dimension_key='freshness'
      and e.source_snapshot_id=c.source_snapshot_id
  );
  get diagnostics v_fresh=row_count;

  with c as (
    select rpc.*,sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_text,sr.iso
    from regulatory_pending_changes rpc
    join source_registry sr on sr.source_url=rpc.source_url
    join lateral(
      select ss.* from source_snapshots ss
      where ss.source_id=sr.id and ss.fetch_status='success'
        and length(coalesce(ss.raw_html_hash,''))=64
        and rpc.expected_note is not null
        and ss.captured_text ilike '%'||left(rpc.expected_note,120)||'%'
      order by ss.captured_at desc limit 1
    ) ss on true
    where rpc.source_url is not null and rpc.expected_effective_date is not null
  )
  insert into jurisdiction_data_depth_evidence
    (jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,
     evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
  select c.iso,'change_history','v1','authority_statement','applicable',
    jsonb_build_object('engine','derived-change-history-v1','change_type',c.change_type,
      'current_value',c.current_value,'expected_value',c.expected_value,
      'expected_effective_date',c.expected_effective_date,'status',c.status),
    public.extract_structured_source_quote(c.captured_text,left(c.expected_note,120)),
    c.source_registry_id,c.source_snapshot_id,c.source_url,c.expected_effective_date,'verified',now()
  from c where c.iso is not null and exists(select 1 from countries x where x.iso_alpha2=c.iso)
    and not exists(
      select 1 from jurisdiction_data_depth_evidence e
      where e.jurisdiction_key=c.iso and e.dimension_key='change_history'
        and e.source_snapshot_id=c.source_snapshot_id
        and e.evidence_payload->>'change_type'=c.change_type
    );
  get diagnostics v_change=row_count;

  perform public.recompute_depth_state_for_dimension('freshness');
  perform public.recompute_depth_state_for_dimension('change_history');
  return jsonb_build_object('freshness_promoted',v_fresh,'change_history_promoted',v_change);
end $$;
revoke all on function public.adjudicate_depth_source_metadata(integer) from public;
grant execute on function public.adjudicate_depth_source_metadata(integer) to service_role;

create or replace function public.adjudicate_structured_access_rules_v1(p_limit integer default 500)
returns integer language plpgsql security definer set search_path=public as $$
declare n integer;
begin
  with p as (
    select rp.*,u.url from regulatory_pathways rp
    cross join lateral unnest(rp.source_urls) u(url)
    where rp.verification='verified' and rp.effective_date is not null
      and (rp.qualifying_conditions is not null or rp.prescriber_scope is not null
        or rp.min_age is not null or rp.reimbursement is not null
        or rp.summary is not null or rp.prescription_notes is not null)
    limit p_limit
  ), b as (
    select p.*,sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_text
    from p join source_registry sr on sr.source_url=p.url and sr.is_active=true
    join lateral(
      select ss.* from source_snapshots ss where ss.source_id=sr.id
        and ss.fetch_status='success' and length(coalesce(ss.raw_html_hash,''))=64
      order by ss.captured_at desc limit 1
    ) ss on true
    where p.iso_alpha2 is not null and exists(select 1 from countries c where c.iso_alpha2=p.iso_alpha2)
  ), q as (
    select b.*,public.extract_structured_source_quote(b.captured_text,
      coalesce(nullif(b.prescriber_scope,''),nullif(b.name,''),nullif(b.summary,''),'access')) quote
    from b
  )
  insert into jurisdiction_data_depth_evidence
    (jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,
     source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
  select q.iso_alpha2,'access_rules','v1','authority_rule','applicable',
    jsonb_build_object('engine','structured-access-rules-v1','pathway_id',q.id,
      'pathway_name',q.name,'pathway_type',q.pathway_type::text,
      'qualifying_conditions',q.qualifying_conditions,'prescriber_scope',q.prescriber_scope,
      'min_age',q.min_age,'reimbursement',q.reimbursement,'status',q.status,
      'effective_date',q.effective_date),
    q.quote,q.source_registry_id,q.source_snapshot_id,q.url,q.effective_date,'verified',now()
  from q where q.quote is not null and q.quote<>'' and not exists(
    select 1 from jurisdiction_data_depth_evidence e
    where e.jurisdiction_key=q.iso_alpha2 and e.dimension_key='access_rules'
      and e.evidence_payload->>'pathway_id'=q.id::text
  );
  get diagnostics n=row_count;
  perform public.recompute_depth_state_for_dimension('access_rules');
  return n;
end $$;
revoke all on function public.adjudicate_structured_access_rules_v1(integer) from public;
grant execute on function public.adjudicate_structured_access_rules_v1(integer) to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260925060000','dimension_specific_adjudication_engine','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260925060000_dimension_specific_adjudication_engine.sql

-- RECOVERY BEGIN 20260925060000_harden_full_depth_dimension_contract_rls.sql
-- Security hardening: the dimension contract is public metadata, not a public-write surface.
-- Preserve read access while preventing client-side mutation.
alter table public.jurisdiction_data_depth_dimensions enable row level security;

drop policy if exists jurisdiction_data_depth_dimensions_read on public.jurisdiction_data_depth_dimensions;
create policy jurisdiction_data_depth_dimensions_read
on public.jurisdiction_data_depth_dimensions
for select
to anon, authenticated
using (true);

revoke insert, update, delete, truncate
on public.jurisdiction_data_depth_dimensions
from anon, authenticated;

grant select on public.jurisdiction_data_depth_dimensions
to anon, authenticated;

comment on table public.jurisdiction_data_depth_dimensions is
  'Contract metadata for the Harbourview jurisdiction data-depth model. Client-readable; client-write access is prohibited.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260925060000','harden_full_depth_dimension_contract_rls','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260925060000_harden_full_depth_dimension_contract_rls.sql

-- RECOVERY BEGIN 20260925060000_primary_kg_law69_2024_enrichment.sql
-- Primary Kyrgyz Republic regulatory provenance.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='KG' and active=true;
insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values ('Kyrgyz Republic — Law No. 69 on Narcotic Drugs, Psychotropic Substances, Analogues and Precursors','https://cbd.minjust.gov.kg/4-5307/edition/3961/ru','Kyrgyzstan',true,'Kyrgyzstan','KG','ru','monthly','verified','KG',1,false,'statute',true,'Primary Ministry of Justice legal information bank. Law No. 69 dated 2024-03-06 establishes the national controlled-substances framework; Cabinet Resolution No. 152 of 2025 establishes controlled substances subject to that law.','official_gazette')
on conflict (source_url) do update set is_active=true,jurisdiction_code='KG',verification_notes=excluded.verification_notes,updated_at=now();
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values ('primary-evidence-kg-law69-2024','KG','prohibited','Kyrgyzstan''s 2024 narcotics law establishes the national controlled-substances regime, with the 2025 Cabinet control list identifying substances subject to control. The primary legal sources reviewed do not establish a general commercial cannabis market.','Kyrgyz Republic Ministry of Justice','https://cbd.minjust.gov.kg/4-5307/edition/3961/ru','2024-03-06',now(),now()+interval '180 days',true)
on conflict (evidence_key) do update set rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=now(),expires_at=now()+interval '180 days',active=true;
insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values ('primary-evidence-kg-law69-2024','KG','primary-evidence-claim:kg-law69-2024','Kyrgyzstan''s 2024 controlled-substances law and 2025 control list establish a national narcotics-control framework; the cited primary sources do not establish general commercial cannabis retail.','any','national','Kyrgyz Republic Ministry of Justice','https://cbd.minjust.gov.kg/4-5307/edition/3961/ru','2024-03-06',now(),now(),now()+interval '180 days','verified')
on conflict (claim_key) do update set claim_text=excluded.claim_text,evidence_status='verified',verified_at=now(),expires_at=now()+interval '180 days';
insert into public.regulatory_calendar
(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'KG','effective','Law No. 69 on Narcotic Drugs, Psychotropic Substances, Analogues and Precursors','2024-03-06','confirmed','https://cbd.minjust.gov.kg/4-5307/edition/3961/ru','Kyrgyz Republic Ministry of Justice','effective'
where not exists (select 1 from public.regulatory_calendar where iso2='KG' and title='Law No. 69 on Narcotic Drugs, Psychotropic Substances, Analogues and Precursors');
update public.jurisdiction_dimension_coverage set status='verified_populated',applicability='applicable',evidence_basis='Primary Kyrgyz Republic Ministry of Justice legal source.',last_evaluated_at=now()
where jurisdiction_key='KG' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar');
update public.jurisdiction_dimension_coverage set status='verified_empty',applicability='applicable',evidence_basis='Primary legal framework does not establish a general commercial cannabis pathway or commercial cannabis product-format rules.',last_evaluated_at=now()
where jurisdiction_key='KG' and dimension_key in ('verified_pathways','verified_format_rules');
update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key='KG' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar','verified_pathways','verified_format_rules') and status in ('open','in_progress','blocked');

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260925060000','primary_kg_law69_2024_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260925060000_primary_kg_law69_2024_enrichment.sql

-- RECOVERY BEGIN 20260925070000_fix_structured_adjudication_gate_insert.sql
-- Production repair: add the missing jurisdiction_scope_gate value to the regulatory-tier gate result insert.
create or replace function public.adjudicate_structured_depth(p_limit integer default 250)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare r record; q text; cand uuid; runid uuid:=gen_random_uuid();
src_ok boolean; quote_ok boolean; eff_ok boolean; scope_ok boolean; sem_ok boolean; auth_ok boolean; ok boolean;
reason text; v_seen int:=0; v_promoted int:=0; v_unmeasured int:=0;
begin
insert into public.jurisdiction_data_depth_adjudication_runs(id,engine_version,notes)
values(runid,'structured-adjudication-v2','Fail-closed: source + exact quote + effective date + exact jurisdiction scope + dimension semantics + authority.');

for r in
select c.claim_id,c.jurisdiction_iso2 jurisdiction_key,c.claim_key,c.claim_text,c.product_class,c.jurisdiction_scope,c.authority_url,c.source_effective_date,c.source_snapshot_sha256,c.verified_at,
sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_text,sr.regulator_class,sr.tier source_tier
from public.regulatory_market_access_claims c
join public.source_registry sr on lower(regexp_replace(sr.source_url,'/$',''))=lower(regexp_replace(c.authority_url,'/$',''))
join public.source_snapshots ss on ss.source_id=sr.id and ss.raw_html_hash=c.source_snapshot_sha256 and ss.fetch_status='success'
where c.verified_at is not null and c.source_effective_date is not null and c.source_snapshot_sha256 is not null and c.claim_text is not null
and length(trim(c.claim_text))>=20 and c.authority_url ~ '^https://' and coalesce(c.evidence_status,'') not in ('rejected','superseded')
order by c.verified_at desc limit greatest(1,least(coalesce(p_limit,250),1000))
loop
v_seen:=v_seen+1;q:=public.extract_dimension_quote(r.captured_text,'claims');quote_ok:=q is not null and length(q)>=40;q:=coalesce(q,'[NO_EXACT_SOURCE_QUOTE]');
src_ok:=r.source_registry_id is not null and r.source_snapshot_id is not null and length(r.source_snapshot_sha256)=64;
eff_ok:=r.source_effective_date is not null;
scope_ok:=r.jurisdiction_key is not null and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key) and coalesce(r.jurisdiction_scope,'')<>'';
sem_ok:=lower(r.claim_key||' '||r.claim_text||' '||coalesce(r.product_class,'')) ~ '(access|market|licen|permit|commercial|medical|adult|recreational|sale|cultivat|produc|process|import|export|distribut|testing|packag|label|tax|fee)';
auth_ok:=coalesce(r.regulator_class,'other') in ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement') or coalesce(r.source_tier,99)<=2;
ok:=src_ok and quote_ok and eff_ok and scope_ok and sem_ok and auth_ok;
reason:=concat_ws(';',case when not src_ok then 'source' end,case when not quote_ok then 'quote' end,case when not eff_ok then 'effective_date' end,case when not scope_ok then 'jurisdiction_scope' end,case when not sem_ok then 'semantics' end,case when not auth_ok then 'authority' end);
insert into public.jurisdiction_data_depth_extraction_candidates(source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,candidate_payload,evidence_quote,confidence,extraction_method,status,adjudication_reason)
values(r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,'claims','structured_rule',jsonb_build_object('claim_id',r.claim_id,'claim_key',r.claim_key,'claim_text',r.claim_text,'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,'effective_from',r.source_effective_date,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,case when ok then 'high' else 'medium' end,'structured_claim_v2',case when ok then 'accepted' else 'needs_review' end,coalesce(nullif(reason,''),'all gates passed'))
on conflict(source_snapshot_id,dimension_key,evidence_quote) do update set candidate_payload=excluded.candidate_payload,confidence=excluded.confidence,extraction_method=excluded.extraction_method,status=excluded.status,adjudication_reason=excluded.adjudication_reason,updated_at=now() returning id into cand;
insert into public.jurisdiction_data_depth_gate_results(candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
values(cand,r.jurisdiction_key,'claims',src_ok,quote_ok,eff_ok,scope_ok,sem_ok,auth_ok,case when ok then 'accepted' else 'unmeasured' end,coalesce(nullif(reason,''),'all gates passed'));
if ok then
v_promoted:=v_promoted+1;
insert into public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
values(r.jurisdiction_key,'claims','v2','authority_rule','applicable',jsonb_build_object('claim_id',r.claim_id,'claim_key',r.claim_key,'claim_text',r.claim_text,'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,r.source_registry_id,r.source_snapshot_id,r.authority_url,r.source_effective_date,'verified',r.verified_at) on conflict do nothing;
else v_unmeasured:=v_unmeasured+1; end if;
end loop;

for r in
select e.evidence_key,e.jurisdiction_iso2 jurisdiction_key,e.tier,e.rationale,e.authority_name,e.authority_url,e.source_effective_date,e.verified_at,e.source_snapshot_sha256,e.parent_iso2,
sr.id source_registry_id,ss.id source_snapshot_id,ss.captured_text,sr.regulator_class,sr.tier source_tier
from public.regulatory_market_access_evidence e
join public.source_registry sr on lower(regexp_replace(sr.source_url,'/$',''))=lower(regexp_replace(e.authority_url,'/$',''))
join public.source_snapshots ss on ss.source_id=sr.id and ss.raw_html_hash=e.source_snapshot_sha256 and ss.fetch_status='success'
where e.active=true and e.verified_at is not null and e.source_effective_date is not null and e.source_snapshot_sha256 is not null and length(e.source_snapshot_sha256)=64 and e.authority_url ~ '^https://' and e.parent_iso2 is null
order by e.verified_at desc limit greatest(1,least(coalesce(p_limit,250),1000))
loop
v_seen:=v_seen+1;q:=public.extract_dimension_quote(r.captured_text,'regulatory_tier');quote_ok:=q is not null and length(q)>=40;q:=coalesce(q,'[NO_EXACT_SOURCE_QUOTE]');
src_ok:=r.source_registry_id is not null and r.source_snapshot_id is not null and length(r.source_snapshot_sha256)=64;eff_ok:=r.source_effective_date is not null;
scope_ok:=r.jurisdiction_key is not null and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key) and r.parent_iso2 is null;
sem_ok:=lower(coalesce(r.tier,'')||' '||coalesce(r.rationale,'')) ~ '(medical|adult|recreational|commercial|licen|market|cultivat|manufactur|process|sale|sell|export|import|prohibit|illegal|permit)';
auth_ok:=coalesce(r.regulator_class,'other') in ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement') or coalesce(r.source_tier,99)<=2;ok:=src_ok and quote_ok and eff_ok and scope_ok and sem_ok and auth_ok;
reason:=concat_ws(';',case when not src_ok then 'source' end,case when not quote_ok then 'quote' end,case when not eff_ok then 'effective_date' end,case when not scope_ok then 'jurisdiction_scope' end,case when not sem_ok then 'commercial_market_access_semantics' end,case when not auth_ok then 'authority' end);
insert into public.jurisdiction_data_depth_extraction_candidates(source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,candidate_payload,evidence_quote,confidence,extraction_method,status,adjudication_reason)
values(r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,'regulatory_tier','structured_rule',jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,'authority_name',r.authority_name,'authority_url',r.authority_url,'effective_from',r.source_effective_date,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,case when ok then 'high' else 'medium' end,'structured_tier_v2',case when ok then 'accepted' else 'needs_review' end,coalesce(nullif(reason,''),'all gates passed'))
on conflict(source_snapshot_id,dimension_key,evidence_quote) do update set candidate_payload=excluded.candidate_payload,confidence=excluded.confidence,extraction_method=excluded.extraction_method,status=excluded.status,adjudication_reason=excluded.adjudication_reason,updated_at=now() returning id into cand;
insert into public.jurisdiction_data_depth_gate_results(candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
values(cand,r.jurisdiction_key,'regulatory_tier',src_ok,quote_ok,eff_ok,scope_ok,sem_ok,auth_ok,case when ok then 'accepted' else 'unmeasured' end,coalesce(nullif(reason,''),'all gates passed'));
if ok then
v_promoted:=v_promoted+1;
insert into public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
values(r.jurisdiction_key,'regulatory_tier','v2','authority_rule','applicable',jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,'authority_name',r.authority_name,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,r.source_registry_id,r.source_snapshot_id,r.authority_url,r.source_effective_date,'verified',r.verified_at) on conflict do nothing;
else v_unmeasured:=v_unmeasured+1;end if;
end loop;

update public.jurisdiction_data_depth_extraction_candidates set status='needs_review',adjudication_reason=coalesce(adjudication_reason,'Awaiting structured dimension-specific adjudication.'),updated_at=now() where status='pending' and extraction_method='conservative_keyword_v1';
update public.jurisdiction_data_depth_adjudication_runs set finished_at=now(),candidates_seen=v_seen,promoted=v_promoted,unmeasured=v_unmeasured,notes='v2 gates enforced.' where id=runid;
return jsonb_build_object('run_id',runid,'engine_version','structured-adjudication-v2','candidates_seen',v_seen,'promoted',v_promoted,'unmeasured',v_unmeasured);
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260925070000','fix_structured_adjudication_gate_insert','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260925070000_fix_structured_adjudication_gate_insert.sql

-- RECOVERY BEGIN 20260925071000_fix_structured_adjudication_registered_source_url.sql
-- Production repair: persist the exact registered source_registry URL required by provenance enforcement.
create or replace function public.adjudicate_structured_depth(p_limit integer default 250)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare r record; q text; cand uuid; runid uuid:=gen_random_uuid();
src_ok boolean; quote_ok boolean; eff_ok boolean; scope_ok boolean; sem_ok boolean; auth_ok boolean; ok boolean;
reason text; v_seen int:=0; v_promoted int:=0; v_unmeasured int:=0;
begin
insert into public.jurisdiction_data_depth_adjudication_runs(id,engine_version,notes)
values(runid,'structured-adjudication-v2','Fail-closed: source + exact quote + effective date + exact jurisdiction scope + dimension semantics + authority.');

for r in
select c.claim_id,c.jurisdiction_iso2 jurisdiction_key,c.claim_key,c.claim_text,c.product_class,c.jurisdiction_scope,c.authority_url,c.source_effective_date,c.source_snapshot_sha256,c.verified_at,
sr.id source_registry_id,sr.source_url source_url,ss.id source_snapshot_id,ss.captured_text,sr.regulator_class,sr.tier source_tier
from public.regulatory_market_access_claims c
join public.source_registry sr on lower(regexp_replace(sr.source_url,'/$',''))=lower(regexp_replace(c.authority_url,'/$',''))
join public.source_snapshots ss on ss.source_id=sr.id and ss.raw_html_hash=c.source_snapshot_sha256 and ss.fetch_status='success'
where c.verified_at is not null and c.source_effective_date is not null and c.source_snapshot_sha256 is not null and c.claim_text is not null
and length(trim(c.claim_text))>=20 and c.authority_url ~ '^https://' and coalesce(c.evidence_status,'') not in ('rejected','superseded')
order by c.verified_at desc limit greatest(1,least(coalesce(p_limit,250),1000))
loop
v_seen:=v_seen+1;q:=public.extract_dimension_quote(r.captured_text,'claims');quote_ok:=q is not null and length(q)>=40;q:=coalesce(q,'[NO_EXACT_SOURCE_QUOTE]');
src_ok:=r.source_registry_id is not null and r.source_snapshot_id is not null and length(r.source_snapshot_sha256)=64;
eff_ok:=r.source_effective_date is not null;
scope_ok:=r.jurisdiction_key is not null and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key) and coalesce(r.jurisdiction_scope,'')<>'';
sem_ok:=lower(r.claim_key||' '||r.claim_text||' '||coalesce(r.product_class,'')) ~ '(access|market|licen|permit|commercial|medical|adult|recreational|sale|cultivat|produc|process|import|export|distribut|testing|packag|label|tax|fee)';
auth_ok:=coalesce(r.regulator_class,'other') in ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement') or coalesce(r.source_tier,99)<=2;
ok:=src_ok and quote_ok and eff_ok and scope_ok and sem_ok and auth_ok;
reason:=concat_ws(';',case when not src_ok then 'source' end,case when not quote_ok then 'quote' end,case when not eff_ok then 'effective_date' end,case when not scope_ok then 'jurisdiction_scope' end,case when not sem_ok then 'semantics' end,case when not auth_ok then 'authority' end);
insert into public.jurisdiction_data_depth_extraction_candidates(source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,candidate_payload,evidence_quote,confidence,extraction_method,status,adjudication_reason)
values(r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,'claims','structured_rule',jsonb_build_object('claim_id',r.claim_id,'claim_key',r.claim_key,'claim_text',r.claim_text,'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,'effective_from',r.source_effective_date,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,case when ok then 'high' else 'medium' end,'structured_claim_v2',case when ok then 'accepted' else 'needs_review' end,coalesce(nullif(reason,''),'all gates passed'))
on conflict(source_snapshot_id,dimension_key,evidence_quote) do update set candidate_payload=excluded.candidate_payload,confidence=excluded.confidence,extraction_method=excluded.extraction_method,status=excluded.status,adjudication_reason=excluded.adjudication_reason,updated_at=now() returning id into cand;
insert into public.jurisdiction_data_depth_gate_results(candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
values(cand,r.jurisdiction_key,'claims',src_ok,quote_ok,eff_ok,scope_ok,sem_ok,auth_ok,case when ok then 'accepted' else 'unmeasured' end,coalesce(nullif(reason,''),'all gates passed'));
if ok then
v_promoted:=v_promoted+1;
insert into public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
values(r.jurisdiction_key,'claims','v2','authority_rule','applicable',jsonb_build_object('claim_id',r.claim_id,'claim_key',r.claim_key,'claim_text',r.claim_text,'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,r.source_registry_id,r.source_snapshot_id,r.source_url,r.source_effective_date,'verified',r.verified_at) on conflict do nothing;
else v_unmeasured:=v_unmeasured+1; end if;
end loop;

for r in
select e.evidence_key,e.jurisdiction_iso2 jurisdiction_key,e.tier,e.rationale,e.authority_name,e.authority_url,e.source_effective_date,e.verified_at,e.source_snapshot_sha256,e.parent_iso2,
sr.id source_registry_id,sr.source_url source_url,ss.id source_snapshot_id,ss.captured_text,sr.regulator_class,sr.tier source_tier
from public.regulatory_market_access_evidence e
join public.source_registry sr on lower(regexp_replace(sr.source_url,'/$',''))=lower(regexp_replace(e.authority_url,'/$',''))
join public.source_snapshots ss on ss.source_id=sr.id and ss.raw_html_hash=e.source_snapshot_sha256 and ss.fetch_status='success'
where e.active=true and e.verified_at is not null and e.source_effective_date is not null and e.source_snapshot_sha256 is not null and length(e.source_snapshot_sha256)=64 and e.authority_url ~ '^https://' and e.parent_iso2 is null
order by e.verified_at desc limit greatest(1,least(coalesce(p_limit,250),1000))
loop
v_seen:=v_seen+1;q:=public.extract_dimension_quote(r.captured_text,'regulatory_tier');quote_ok:=q is not null and length(q)>=40;q:=coalesce(q,'[NO_EXACT_SOURCE_QUOTE]');
src_ok:=r.source_registry_id is not null and r.source_snapshot_id is not null and length(r.source_snapshot_sha256)=64;eff_ok:=r.source_effective_date is not null;
scope_ok:=r.jurisdiction_key is not null and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key) and r.parent_iso2 is null;
sem_ok:=lower(coalesce(r.tier,'')||' '||coalesce(r.rationale,'')) ~ '(medical|adult|recreational|commercial|licen|market|cultivat|manufactur|process|sale|sell|export|import|prohibit|illegal|permit)';
auth_ok:=coalesce(r.regulator_class,'other') in ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement') or coalesce(r.source_tier,99)<=2;ok:=src_ok and quote_ok and eff_ok and scope_ok and sem_ok and auth_ok;
reason:=concat_ws(';',case when not src_ok then 'source' end,case when not quote_ok then 'quote' end,case when not eff_ok then 'effective_date' end,case when not scope_ok then 'jurisdiction_scope' end,case when not sem_ok then 'commercial_market_access_semantics' end,case when not auth_ok then 'authority' end);
insert into public.jurisdiction_data_depth_extraction_candidates(source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,candidate_payload,evidence_quote,confidence,extraction_method,status,adjudication_reason)
values(r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,'regulatory_tier','structured_rule',jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,'authority_name',r.authority_name,'authority_url',r.authority_url,'effective_from',r.source_effective_date,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,case when ok then 'high' else 'medium' end,'structured_tier_v2',case when ok then 'accepted' else 'needs_review' end,coalesce(nullif(reason,''),'all gates passed'))
on conflict(source_snapshot_id,dimension_key,evidence_quote) do update set candidate_payload=excluded.candidate_payload,confidence=excluded.confidence,extraction_method=excluded.extraction_method,status=excluded.status,adjudication_reason=excluded.adjudication_reason,updated_at=now() returning id into cand;
insert into public.jurisdiction_data_depth_gate_results(candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
values(cand,r.jurisdiction_key,'regulatory_tier',src_ok,quote_ok,eff_ok,scope_ok,sem_ok,auth_ok,case when ok then 'accepted' else 'unmeasured' end,coalesce(nullif(reason,''),'all gates passed'));
if ok then
v_promoted:=v_promoted+1;
insert into public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
values(r.jurisdiction_key,'regulatory_tier','v2','authority_rule','applicable',jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,'authority_name',r.authority_name,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,r.source_registry_id,r.source_snapshot_id,r.source_url,r.source_effective_date,'verified',r.verified_at) on conflict do nothing;
else v_unmeasured:=v_unmeasured+1;end if;
end loop;

update public.jurisdiction_data_depth_extraction_candidates set status='needs_review',adjudication_reason=coalesce(adjudication_reason,'Awaiting structured dimension-specific adjudication.'),updated_at=now() where status='pending' and extraction_method='conservative_keyword_v1';
update public.jurisdiction_data_depth_adjudication_runs set finished_at=now(),candidates_seen=v_seen,promoted=v_promoted,unmeasured=v_unmeasured,notes='v2 gates enforced.' where id=runid;
return jsonb_build_object('run_id',runid,'engine_version','structured-adjudication-v2','candidates_seen',v_seen,'promoted',v_promoted,'unmeasured',v_unmeasured);
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260925071000','fix_structured_adjudication_registered_source_url','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260925071000_fix_structured_adjudication_registered_source_url.sql

-- RECOVERY BEGIN 20260925072000_fix_structured_adjudication_tier_source_binding.sql
-- Production repair: bind regulatory-tier evidence to the exact registered source URL.
create or replace function public.adjudicate_structured_depth(p_limit integer default 250)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare r record; q text; cand uuid; runid uuid:=gen_random_uuid();
src_ok boolean; quote_ok boolean; eff_ok boolean; scope_ok boolean; sem_ok boolean; auth_ok boolean; ok boolean;
reason text; v_seen int:=0; v_promoted int:=0; v_unmeasured int:=0;
begin
insert into public.jurisdiction_data_depth_adjudication_runs(id,engine_version,notes)
values(runid,'structured-adjudication-v2','Fail-closed: source + exact quote + effective date + exact jurisdiction scope + dimension semantics + authority.');

for r in
select c.claim_id,c.jurisdiction_iso2 jurisdiction_key,c.claim_key,c.claim_text,c.product_class,c.jurisdiction_scope,c.authority_url,c.source_effective_date,c.source_snapshot_sha256,c.verified_at,
sr.id source_registry_id,sr.source_url source_url,ss.id source_snapshot_id,ss.captured_text,sr.regulator_class,sr.tier source_tier
from public.regulatory_market_access_claims c
join public.source_registry sr on lower(regexp_replace(sr.source_url,'/$',''))=lower(regexp_replace(c.authority_url,'/$',''))
join public.source_snapshots ss on ss.source_id=sr.id and ss.raw_html_hash=c.source_snapshot_sha256 and ss.fetch_status='success'
where c.verified_at is not null and c.source_effective_date is not null and c.source_snapshot_sha256 is not null and c.claim_text is not null
and length(trim(c.claim_text))>=20 and c.authority_url ~ '^https://' and coalesce(c.evidence_status,'') not in ('rejected','superseded')
order by c.verified_at desc limit greatest(1,least(coalesce(p_limit,250),1000))
loop
v_seen:=v_seen+1;q:=public.extract_dimension_quote(r.captured_text,'claims');quote_ok:=q is not null and length(q)>=40;q:=coalesce(q,'[NO_EXACT_SOURCE_QUOTE]');
src_ok:=r.source_registry_id is not null and r.source_snapshot_id is not null and length(r.source_snapshot_sha256)=64;
eff_ok:=r.source_effective_date is not null;
scope_ok:=r.jurisdiction_key is not null and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key) and coalesce(r.jurisdiction_scope,'')<>'';
sem_ok:=lower(r.claim_key||' '||r.claim_text||' '||coalesce(r.product_class,'')) ~ '(access|market|licen|permit|commercial|medical|adult|recreational|sale|cultivat|produc|process|import|export|distribut|testing|packag|label|tax|fee)';
auth_ok:=coalesce(r.regulator_class,'other') in ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement') or coalesce(r.source_tier,99)<=2;
ok:=src_ok and quote_ok and eff_ok and scope_ok and sem_ok and auth_ok;
reason:=concat_ws(';',case when not src_ok then 'source' end,case when not quote_ok then 'quote' end,case when not eff_ok then 'effective_date' end,case when not scope_ok then 'jurisdiction_scope' end,case when not sem_ok then 'semantics' end,case when not auth_ok then 'authority' end);
insert into public.jurisdiction_data_depth_extraction_candidates(source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,candidate_payload,evidence_quote,confidence,extraction_method,status,adjudication_reason)
values(r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,'claims','structured_rule',jsonb_build_object('claim_id',r.claim_id,'claim_key',r.claim_key,'claim_text',r.claim_text,'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,'effective_from',r.source_effective_date,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,case when ok then 'high' else 'medium' end,'structured_claim_v2',case when ok then 'accepted' else 'needs_review' end,coalesce(nullif(reason,''),'all gates passed'))
on conflict(source_snapshot_id,dimension_key,evidence_quote) do update set candidate_payload=excluded.candidate_payload,confidence=excluded.confidence,extraction_method=excluded.extraction_method,status=excluded.status,adjudication_reason=excluded.adjudication_reason,updated_at=now() returning id into cand;
insert into public.jurisdiction_data_depth_gate_results(candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
values(cand,r.jurisdiction_key,'claims',src_ok,quote_ok,eff_ok,scope_ok,sem_ok,auth_ok,case when ok then 'accepted' else 'unmeasured' end,coalesce(nullif(reason,''),'all gates passed'));
if ok then
v_promoted:=v_promoted+1;
insert into public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
values(r.jurisdiction_key,'claims','v2','authority_rule','applicable',jsonb_build_object('claim_id',r.claim_id,'claim_key',r.claim_key,'claim_text',r.claim_text,'product_class',r.product_class,'jurisdiction_scope',r.jurisdiction_scope,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,r.source_registry_id,r.source_snapshot_id,r.source_url,r.source_effective_date,'verified',r.verified_at) on conflict do nothing;
else v_unmeasured:=v_unmeasured+1; end if;
end loop;

for r in
select e.evidence_key,e.jurisdiction_iso2 jurisdiction_key,e.tier,e.rationale,e.authority_name,e.authority_url,e.source_effective_date,e.verified_at,e.source_snapshot_sha256,e.parent_iso2,
sr.id source_registry_id,sr.source_url source_url,ss.id source_snapshot_id,ss.captured_text,sr.regulator_class,sr.tier source_tier
from public.regulatory_market_access_evidence e
join public.source_registry sr on lower(regexp_replace(sr.source_url,'/$',''))=lower(regexp_replace(e.authority_url,'/$',''))
join public.source_snapshots ss on ss.source_id=sr.id and ss.raw_html_hash=e.source_snapshot_sha256 and ss.fetch_status='success'
where e.active=true and e.verified_at is not null and e.source_effective_date is not null and e.source_snapshot_sha256 is not null and length(e.source_snapshot_sha256)=64 and e.authority_url ~ '^https://' and e.parent_iso2 is null
order by e.verified_at desc limit greatest(1,least(coalesce(p_limit,250),1000))
loop
v_seen:=v_seen+1;q:=public.extract_dimension_quote(r.captured_text,'regulatory_tier');quote_ok:=q is not null and length(q)>=40;q:=coalesce(q,'[NO_EXACT_SOURCE_QUOTE]');
src_ok:=r.source_registry_id is not null and r.source_snapshot_id is not null and length(r.source_snapshot_sha256)=64;eff_ok:=r.source_effective_date is not null;
scope_ok:=r.jurisdiction_key is not null and exists(select 1 from public.countries x where x.iso_alpha2=r.jurisdiction_key) and r.parent_iso2 is null;
sem_ok:=lower(coalesce(r.tier,'')||' '||coalesce(r.rationale,'')) ~ '(medical|adult|recreational|commercial|licen|market|cultivat|manufactur|process|sale|sell|export|import|prohibit|illegal|permit)';
auth_ok:=coalesce(r.regulator_class,'other') in ('health_authority','drug_control_authority','official_gazette','legislature','customs_import_export','medicine_license_registry','procurement') or coalesce(r.source_tier,99)<=2;ok:=src_ok and quote_ok and eff_ok and scope_ok and sem_ok and auth_ok;
reason:=concat_ws(';',case when not src_ok then 'source' end,case when not quote_ok then 'quote' end,case when not eff_ok then 'effective_date' end,case when not scope_ok then 'jurisdiction_scope' end,case when not sem_ok then 'commercial_market_access_semantics' end,case when not auth_ok then 'authority' end);
insert into public.jurisdiction_data_depth_extraction_candidates(source_snapshot_id,source_registry_id,jurisdiction_key,dimension_key,candidate_kind,candidate_payload,evidence_quote,confidence,extraction_method,status,adjudication_reason)
values(r.source_snapshot_id,r.source_registry_id,r.jurisdiction_key,'regulatory_tier','structured_rule',jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,'authority_name',r.authority_name,'authority_url',r.authority_url,'effective_from',r.source_effective_date,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,case when ok then 'high' else 'medium' end,'structured_tier_v2',case when ok then 'accepted' else 'needs_review' end,coalesce(nullif(reason,''),'all gates passed'))
on conflict(source_snapshot_id,dimension_key,evidence_quote) do update set candidate_payload=excluded.candidate_payload,confidence=excluded.confidence,extraction_method=excluded.extraction_method,status=excluded.status,adjudication_reason=excluded.adjudication_reason,updated_at=now() returning id into cand;
insert into public.jurisdiction_data_depth_gate_results(candidate_id,jurisdiction_key,dimension_key,source_gate,quote_gate,effective_date_gate,jurisdiction_scope_gate,semantics_gate,authority_gate,decision,reason)
values(cand,r.jurisdiction_key,'regulatory_tier',src_ok,quote_ok,eff_ok,scope_ok,sem_ok,auth_ok,case when ok then 'accepted' else 'unmeasured' end,coalesce(nullif(reason,''),'all gates passed'));
if ok then
v_promoted:=v_promoted+1;
insert into public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,effective_from,verification_status,verified_at)
values(r.jurisdiction_key,'regulatory_tier','v2','authority_rule','applicable',jsonb_build_object('evidence_key',r.evidence_key,'tier',r.tier,'rationale',r.rationale,'authority_name',r.authority_name,'authority_url',r.authority_url,'source_snapshot_sha256',r.source_snapshot_sha256,'engine','structured-adjudication-v2'),q,r.source_registry_id,r.source_snapshot_id,r.source_url,r.source_effective_date,'verified',r.verified_at) on conflict do nothing;
else v_unmeasured:=v_unmeasured+1;end if;
end loop;

update public.jurisdiction_data_depth_extraction_candidates set status='needs_review',adjudication_reason=coalesce(adjudication_reason,'Awaiting structured dimension-specific adjudication.'),updated_at=now() where status='pending' and extraction_method='conservative_keyword_v1';
update public.jurisdiction_data_depth_adjudication_runs set finished_at=now(),candidates_seen=v_seen,promoted=v_promoted,unmeasured=v_unmeasured,notes='v2 gates enforced.' where id=runid;
return jsonb_build_object('run_id',runid,'engine_version','structured-adjudication-v2','candidates_seen',v_seen,'promoted',v_promoted,'unmeasured',v_unmeasured);
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260925072000','fix_structured_adjudication_tier_source_binding','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260925072000_fix_structured_adjudication_tier_source_binding.sql

-- RECOVERY BEGIN 20260925081500_primary_vu_hemp_medical_enrichment.sql
-- Primary Vanuatu regulatory provenance: Industrial Hemp and Medical Cannabis Act 2021.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='VU' and active=true;

insert into public.source_registry (
source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class
) values (
'Vanuatu Parliament — Industrial Hemp and Medical Cannabis Act 2021 / 2025 amendment record',
'https://parliament.gov.vu/index.php/parliamentary-business/acts-of-parliament/acts',
'Vanuatu',true,'Vanuatu','VU','en','monthly','verified','VU',1,false,'statute',true,
'Official Parliament source lists the Industrial Hemp and Medical Cannabis Act 2021 and the 2025 amendment bill. The 2021 Act establishes licensing and regulation for industrial hemp and medical cannabis; the 2025 amendment record concerns financial/compliance management.',
'legislature'
) on conflict (source_url) do update set is_active=true,jurisdiction_code='VU',verification_notes=excluded.verification_notes,updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values (
'primary-evidence-vu-hemp-medical-2021','VU','medical_limited_trade',
'Vanuatu has a dedicated Industrial Hemp and Medical Cannabis Act No. 31 of 2021 establishing a regulated licensing framework for industrial hemp and medical cannabis. The Act addresses cultivation, harvesting, seed importation, processing/manufacturing, testing and export licensing. The separate Dangerous Drugs framework continues to prohibit ordinary cannabis cultivation and dealing outside authorized channels; this does not establish general adult-use retail.',
'Parliament of Vanuatu','https://parliament.gov.vu/index.php/parliamentary-business/acts-of-parliament/acts',
'2021-12-10',now(),now()+interval '180 days',true);

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values (
'primary-evidence-vu-hemp-medical-2021','VU','primary-evidence-claim:vu-hemp-medical-2021',
'Vanuatu has a statutory licensing framework for industrial hemp and medical cannabis covering activities including cultivation, seed importation, processing/manufacturing and export; ordinary cannabis remains subject to the Dangerous Drugs Act and is not established as general adult-use retail.',
'any','national','Parliament of Vanuatu','https://parliament.gov.vu/index.php/parliamentary-business/acts-of-parliament/acts',
'2021-12-10',now(),now(),now()+interval '180 days','verified');

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select '58526c26-b97d-410d-aa39-3e1a3b6e66b0','VU','depth-v1-vu-medical-hemp','Industrial hemp and medical cannabis licensing','domestic_authorization',
'Industrial Hemp and Medical Cannabis Act No. 31 of 2021',
'Vanuatu Ministry of Agriculture, Livestock, Forestry and Biosecurity / statutory advisory framework','active','2021-12-10',
'Licensed industrial hemp and medical cannabis activities are regulated by statute, including cultivation, seed importation, processing/manufacturing and export. This is not an adult-use retail pathway.',
ARRAY['https://parliament.gov.vu/index.php/parliamentary-business/acts-of-parliament/acts'],'needs_review',now()
where not exists (select 1 from public.regulatory_pathways where iso_alpha2='VU' and slug='depth-v1-vu-medical-hemp');

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',id,'Industrial Hemp and Medical Cannabis Act No. 31 of 2021','Part 6 / section 26','statute',
'https://parliament.gov.vu/index.php/parliamentary-business/acts-of-parliament/acts','2021-12-10',current_date,
'The Act provides for regulations covering cultivation, harvesting, seed importation, processing/manufacturing, testing and export, and establishes licensing requirements.'
from public.regulatory_pathways p
where p.iso_alpha2='VU' and p.slug='depth-v1-vu-medical-hemp'
and not exists (select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://parliament.gov.vu/index.php/parliamentary-business/acts-of-parliament/acts');

update public.regulatory_pathways set verification='verified',last_verified_at=now()
where iso_alpha2='VU' and slug='depth-v1-vu-medical-hemp';

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
evidence_basis='Primary Vanuatu Parliament source identifies the Industrial Hemp and Medical Cannabis Act 2021 licensing framework.',
last_evaluated_at=now()
where jurisdiction_key='VU' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');

update public.jurisdiction_dimension_coverage
set status='verified_empty',applicability='applicable',
evidence_basis='Primary Act establishes licensing activities but does not establish general commercial cannabis product-format rules.',
last_evaluated_at=now()
where jurisdiction_key='VU' and dimension_key='verified_format_rules';

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key='VU'
and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules')
and status in ('open','in_progress','blocked');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260925081500','primary_vu_hemp_medical_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260925081500_primary_vu_hemp_medical_enrichment.sql

-- RECOVERY BEGIN 20260925090000_primary_ml_law83_14_enrichment.sql
-- Primary Mali regulatory provenance: Loi No. 83-14.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='ML' and active=true;

insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values
('Mali — Loi No. 83-14 concerning offences involving poisonous substances and narcotics',
'https://www.sgg-mali.ml/','Mali',true,'Mali','ML','fr','monthly','verified','ML',1,false,'statute',true,
'Primary-law provenance is maintained through the Mali government legal publication system. The law prohibits cultivation, production, possession, sale, import/export and other commercial operations involving narcotics, while permitting special therapeutic, medical-research or scientific authorizations.',
'official_gazette')
on conflict (source_url) do update set is_active=true,jurisdiction_code='ML',verification_notes=excluded.verification_notes,updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-ml-law83-14','ML','prohibited',
'Mali Law No. 83-14 prohibits cultivation, production, manufacture, extraction, preparation, possession, offering, sale, purchase, delivery, brokerage, transport, import and export of narcotics and related commercial operations. The law permits special authorizations for therapeutic, medical-research and scientific purposes. The cited law does not establish general commercial cannabis retail.',
'Republic of Mali — Secrétariat Général du Gouvernement',
'https://www.sgg-mali.ml/','1983-01-01',now(),now()+interval '180 days',true);

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-ml-law83-14','ML','primary-evidence-claim:ml-law83-14',
'Mali prohibits cultivation and commercial dealings in narcotic substances, with special authorization possible for therapeutic, medical-research or scientific purposes; the cited law does not establish general commercial cannabis retail.',
'any','national','Republic of Mali — Secrétariat Général du Gouvernement',
'https://www.sgg-mali.ml/','1983-01-01',now(),now(),now()+interval '180 days','verified');

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select 'ee9ec5dd-845e-41ae-b088-98a84f667a74','ML','depth-v1-ml-authorized-research','Special therapeutic/research/scientific authorization','domestic_authorization',
'Loi No. 83-14, Article 2','Minister of Public Health','active',null,
'Special authorization may be issued for therapeutic, medical-research or scientific purposes; this is not a general commercial cannabis retail pathway.',
ARRAY['https://www.sgg-mali.ml/'],'needs_review',now()
where not exists (select 1 from public.regulatory_pathways where iso_alpha2='ML' and slug='depth-v1-ml-authorized-research');

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,accessed_date,excerpt)
select 'pathway',id,'Loi No. 83-14','Article 2','statute','https://www.sgg-mali.ml/',current_date,
'Article 2 prohibits narcotics-related cultivation and commercial operations while allowing special therapeutic, medical-research and scientific authorizations.'
from public.regulatory_pathways p
where p.iso_alpha2='ML' and p.slug='depth-v1-ml-authorized-research'
and not exists (select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://www.sgg-mali.ml/');

update public.regulatory_pathways set verification='verified',last_verified_at=now()
where iso_alpha2='ML' and slug='depth-v1-ml-authorized-research';

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',evidence_basis='Primary Mali government legal provenance for Law No. 83-14 and its narcotics controls.',last_evaluated_at=now()
where jurisdiction_key='ML' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');

update public.jurisdiction_dimension_coverage
set status='verified_empty',applicability='applicable',evidence_basis='Primary Mali narcotics law does not establish a general commercial cannabis product-format framework.',last_evaluated_at=now()
where jurisdiction_key='ML' and dimension_key='verified_format_rules';

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key='ML' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules') and status in ('open','in_progress','blocked');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260925090000','primary_ml_law83_14_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260925090000_primary_ml_law83_14_enrichment.sql

-- RECOVERY BEGIN 20260925115700_structured_adjudication_pipeline_table_rls.sql
-- Harden structured adjudication staging tables with RLS.
-- These tables are pipeline-internal and are intentionally service-role only.

alter table public.jurisdiction_data_depth_extraction_candidates enable row level security;
alter table public.jurisdiction_data_depth_adjudications enable row level security;

drop policy if exists "service_role_full_access_extraction_candidates"
  on public.jurisdiction_data_depth_extraction_candidates;
drop policy if exists "service_role_full_access_adjudications"
  on public.jurisdiction_data_depth_adjudications;

create policy "service_role_full_access_extraction_candidates"
  on public.jurisdiction_data_depth_extraction_candidates
  for all to service_role
  using (true)
  with check (true);

create policy "service_role_full_access_adjudications"
  on public.jurisdiction_data_depth_adjudications
  for all to service_role
  using (true)
  with check (true);

revoke all on public.jurisdiction_data_depth_extraction_candidates from anon, authenticated;
revoke all on public.jurisdiction_data_depth_adjudications from anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260925115700','structured_adjudication_pipeline_table_rls','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260925115700_structured_adjudication_pipeline_table_rls.sql

-- RECOVERY BEGIN 20260925120500_bind_angola_primary_legal_source.sql
-- Bind an authoritative Angola legal publication for full-depth source acquisition.
-- This source is evidence for the legal/import surface it directly addresses;
-- downstream dimension adjudication remains fail-closed when semantics are unsupported.

insert into public.source_registry (
  source_name,
  source_url,
  jurisdiction,
  iso,
  is_active,
  crawl_allowed,
  source_type,
  tier,
  regulator_class,
  verification_notes
)
select
  'Angola — Diário da República / Lei n.º 14/25 (OGE 2026)',
  'https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw41/mje2/~edisp/minfin5216784.pdf',
  'Angola',
  'AO',
  true,
  true,
  'official_legal',
  1,
  'official_gazette',
  'Primary-source binding: official Diário da República publication dated 30 Dec 2025. Relevant to import restrictions and other customs/legal evidence. Do not infer unrelated dimensions from this source.'
where not exists (
  select 1
  from public.source_registry
  where source_url = 'https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw41/mje2/~edisp/minfin5216784.pdf'
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260925120500','bind_angola_primary_legal_source','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260925120500_bind_angola_primary_legal_source.sql

-- RECOVERY BEGIN 20260925130000_progressive_depth_cycle_v1.sql
-- Idempotent freshness promotion. Uses the current unique verified-evidence
-- key as an upsert target so newer snapshots replace stale current evidence.
create or replace function public.refresh_depth_freshness_v2(p_limit integer default 500)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public
as $$
declare v_seen int; v_upserted int:=0;
begin
  with latest as (
    select sr.iso jurisdiction_key,sr.id source_registry_id,ss.id source_snapshot_id,
           ss.captured_at,ss.raw_html_hash,sr.source_url,
           row_number() over(partition by sr.iso order by ss.captured_at desc) rn
    from public.source_registry sr join public.source_snapshots ss on ss.source_id=sr.id
    where sr.iso is not null and sr.iso<>'' and ss.fetch_status='success'
      and length(coalesce(ss.raw_html_hash,''))=64 and ss.captured_at is not null
      and exists(select 1 from public.countries c where c.iso_alpha2=sr.iso)
  ), chosen as (select * from latest where rn=1 limit greatest(1,least(coalesce(p_limit,500),1000)))
  select count(*) into v_seen from chosen;
  with latest as (
    select sr.iso jurisdiction_key,sr.id source_registry_id,ss.id source_snapshot_id,
           ss.captured_at,ss.raw_html_hash,sr.source_url,
           row_number() over(partition by sr.iso order by ss.captured_at desc) rn
    from public.source_registry sr join public.source_snapshots ss on ss.source_id=sr.id
    where sr.iso is not null and sr.iso<>'' and ss.fetch_status='success'
      and length(coalesce(ss.raw_html_hash,''))=64 and ss.captured_at is not null
      and exists(select 1 from public.countries c where c.iso_alpha2=sr.iso)
  ), chosen as (select * from latest where rn=1 limit greatest(1,least(coalesce(p_limit,500),1000)))
  insert into public.jurisdiction_data_depth_evidence(
    jurisdiction_key,dimension_key,contract_version,evidence_kind,applicability,
    evidence_payload,evidence_quote,source_registry_id,source_snapshot_id,source_url,
    effective_from,verification_status,verified_at)
  select jurisdiction_key,'freshness','v1','structural_fact','applicable',
    jsonb_build_object('engine','derived-freshness-v2','captured_at',captured_at,
      'sha256',raw_html_hash,'source_url',source_url,
      'freshness_age_days',floor(extract(epoch from(now()-captured_at))/86400)),
    'Source snapshot captured at '||captured_at::text||'; SHA-256 integrity hash recorded.',
    source_registry_id,source_snapshot_id,source_url,captured_at::date,'verified',now()
  from chosen
  on conflict (jurisdiction_key,dimension_key,contract_version) where verification_status='verified'
  do update set evidence_payload=excluded.evidence_payload,evidence_quote=excluded.evidence_quote,
    source_registry_id=excluded.source_registry_id,source_snapshot_id=excluded.source_snapshot_id,
    source_url=excluded.source_url,effective_from=excluded.effective_from,verified_at=excluded.verified_at;
  get diagnostics v_upserted=row_count;
  perform public.recompute_depth_state_for_dimension('freshness');
  return jsonb_build_object('seen',v_seen,'upserted',v_upserted,'dimension','freshness');
end $$;

revoke all on function public.refresh_depth_freshness_v2(integer) from public,anon,authenticated;
grant execute on function public.refresh_depth_freshness_v2(integer) to service_role;

-- Continuously advances captured source material through the existing
-- dimension-specific extraction/adjudication/state pipeline.
create or replace function public.run_progressive_depth_cycle_v1()
returns jsonb language plpgsql security definer set search_path=pg_catalog,public
as $$
declare v_lock boolean; v jsonb:='{}'::jsonb; x jsonb;
begin
  v_lock:=pg_try_advisory_lock(hashtextextended('harbourview:progressive-depth-cycle:v1',0));
  if not v_lock then return jsonb_build_object('status','skipped','reason','cycle_already_running'); end if;
  begin
    begin select public.extract_depth_candidates(300) into x; v:=v||jsonb_build_object('extraction',x); exception when others then v:=v||jsonb_build_object('extraction',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.adjudicate_structured_depth(300) into x; v:=v||jsonb_build_object('structured_v2',x); exception when others then v:=v||jsonb_build_object('structured_v2',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.adjudicate_structured_pathway_regulator_v4(500) into x; v:=v||jsonb_build_object('pathway_regulator',x); exception when others then v:=v||jsonb_build_object('pathway_regulator',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.adjudicate_structured_commercial_rules_v5(500) into x; v:=v||jsonb_build_object('commercial_rules',x); exception when others then v:=v||jsonb_build_object('commercial_rules',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.adjudicate_structured_evidence_v6(500) into x; v:=v||jsonb_build_object('structured_evidence',x); exception when others then v:=v||jsonb_build_object('structured_evidence',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.adjudicate_structured_access_rules_v1(500) into x; v:=v||jsonb_build_object('access_rules',x); exception when others then v:=v||jsonb_build_object('access_rules',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.adjudicate_structured_status_format_v1(500) into x; v:=v||jsonb_build_object('status_format',x); exception when others then v:=v||jsonb_build_object('status_format',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.refresh_depth_freshness_v2(291) into x; v:=v||jsonb_build_object('freshness',x); exception when others then v:=v||jsonb_build_object('freshness',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.refresh_depth_research_queue(10000) into x; v:=v||jsonb_build_object('research_queue',x); exception when others then v:=v||jsonb_build_object('research_queue',jsonb_build_object('status','error','message',sqlerrm)); end;
    v:=v||jsonb_build_object('status','completed','completed_at',now());
  exception when others then v:=v||jsonb_build_object('status','error','message',sqlerrm); end;
  perform pg_advisory_unlock(hashtextextended('harbourview:progressive-depth-cycle:v1',0));
  return v;
end $$;

revoke all on function public.run_progressive_depth_cycle_v1() from public,anon,authenticated;
grant execute on function public.run_progressive_depth_cycle_v1() to service_role;

do $$
begin
  if exists(select 1 from cron.job where jobname='harbourview-progressive-depth-cycle') then perform cron.unschedule('harbourview-progressive-depth-cycle'); end if;
  perform cron.schedule('harbourview-progressive-depth-cycle','*/2 * * * *','select public.run_progressive_depth_cycle_v1();');
end $$;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260925130000','progressive_depth_cycle_v1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260925130000_progressive_depth_cycle_v1.sql

-- RECOVERY BEGIN 20260925180000_hv_promote_signals_title_gate_reconcile.sql
-- 2026-09-25: reconcile hv-quality-pipeline promotion safeguards applied live
-- Context: hv_promote_signals (cron job "hv-quality-promote", every 10/40 min)
-- was promoting rows straight from quality_label='signal' with no title-gate,
-- no URL-level dedup, and no action stamp. This let ~5,270 raw scraped
-- body-text fragments (and duplicate page-chunks, e.g. one Canada.ca licensee
-- table -> 61 "signals") reach the live public feed. Reverted those rows to
-- reviewed=false live; this migration reconciles the function fixes.

-- 1. Widen title-generation candidates to also cover the corpus classifier's
--    quality_label rows (previously only old signal_classifications rows).
CREATE OR REPLACE FUNCTION api.rows_needing_titles(p_limit integer DEFAULT 25)
 RETURNS TABLE(signal_id text, headline text, summary text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'api', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
begin
  if (select auth.role()) is distinct from 'service_role' and not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role or service_role required' using errcode = '42501';
  end if;
  return query
  select s.id, s.headline, s.summary
  from public.signals s
  where s.editorial_title is null
    and not public.is_junk_headline(s.headline)
    and (
      exists (select 1 from public.signal_classifications c where c.signal_id = s.id and c.quality_label='signal')
      or (s.quality_label = 'signal' and coalesce(s.quality_confidence,0) >= 0.65 and coalesce(s.is_representative, true) = true)
    )
  order by s.created_at desc limit p_limit;
end;
$function$;

-- 2. Promotion now requires: a generated editorial_title, not junk-headline,
--    not on excluded_source_domains, and no other already-live row sharing
--    the same non-aggregator URL. Stamps action for traceability.
CREATE OR REPLACE FUNCTION public.hv_promote_signals(p_min_conf numeric DEFAULT 0.65)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare n int;
begin
  update public.signals s set
    reviewed = true, reviewed_by = 'auto:v2', reviewed_at = now(),
    action = 'Promoted by hv_promote_signals (quality-gate v2)'
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and coalesce(s.quality_confidence, 1) >= p_min_conf
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and s.editorial_title is not null
    and not public.is_junk_headline(s.headline)
    and regexp_replace(coalesce(s.url,''), '^https?://(www\.)?([^/]+).*', '\2')
        not in (select domain from public.excluded_source_domains)
    and not exists (
      select 1 from public.signals k
      where k.reviewed = true
        and k.id <> s.id
        and k.url = s.url
        and s.url !~* '/feed/|/rss|rss\?|news\.google|/search\?'
    );
  get diagnostics n = row_count;
  return n;
end$function$;

-- 3. New: fires hv-classify in mode=titles so quality-gated candidates
--    actually get a clean editorial title (previously nothing generated one
--    for the corpus-classifier path, so promotion could never gate on it).
CREATE OR REPLACE FUNCTION public.hv_title_dispatch_tick(p_limit integer DEFAULT 25)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'api', 'extensions', 'net', 'vault'
AS $function$
declare v_rid bigint;
begin
  select net.http_post(
    url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='hv_edge_anon_key' limit 1)
    ),
    body := jsonb_build_object('mode','titles','limit', p_limit),
    timeout_milliseconds := 55000
  ) into v_rid;
  return v_rid;
end$function$;

-- 4. Cron jobs (documented here; created live via cron.schedule, not run by this file):
--    select cron.schedule('hv-title-dispatch', '*/5 * * * *', $$select public.hv_title_dispatch_tick(15)$$);
--    select cron.schedule('hv-quality-promote', '10,40 * * * *', $$select public.hv_quality_promote_tick()$$);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260925180000','hv_promote_signals_title_gate_reconcile','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260925180000_hv_promote_signals_title_gate_reconcile.sql

-- RECOVERY BEGIN 20260925190000_progressive_depth_cycle_batch_tuning.sql
create or replace function public.run_progressive_depth_cycle_v1()
returns jsonb language plpgsql security definer set search_path=pg_catalog,public
as $$
declare v_lock boolean; v jsonb:='{}'::jsonb; x jsonb;
begin
  v_lock:=pg_try_advisory_lock(hashtextextended('harbourview:progressive-depth-cycle:v1',0));
  if not v_lock then return jsonb_build_object('status','skipped','reason','cycle_already_running'); end if;
  begin
    begin select public.extract_depth_candidates(5) into x; v:=v||jsonb_build_object('extraction',x); exception when others then v:=v||jsonb_build_object('extraction',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.adjudicate_structured_depth(300) into x; v:=v||jsonb_build_object('structured_v2',x); exception when others then v:=v||jsonb_build_object('structured_v2',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.adjudicate_structured_pathway_regulator_v4(500) into x; v:=v||jsonb_build_object('pathway_regulator',x); exception when others then v:=v||jsonb_build_object('pathway_regulator',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.adjudicate_structured_commercial_rules_v5(500) into x; v:=v||jsonb_build_object('commercial_rules',x); exception when others then v:=v||jsonb_build_object('commercial_rules',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.adjudicate_structured_evidence_v6(500) into x; v:=v||jsonb_build_object('structured_evidence',x); exception when others then v:=v||jsonb_build_object('structured_evidence',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.adjudicate_structured_access_rules_v1(500) into x; v:=v||jsonb_build_object('access_rules',x); exception when others then v:=v||jsonb_build_object('access_rules',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.adjudicate_structured_status_format_v1(500) into x; v:=v||jsonb_build_object('status_format',x); exception when others then v:=v||jsonb_build_object('status_format',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.refresh_depth_freshness_v2(291) into x; v:=v||jsonb_build_object('freshness',x); exception when others then v:=v||jsonb_build_object('freshness',jsonb_build_object('status','error','message',sqlerrm)); end;
    begin select public.refresh_depth_research_queue(10000) into x; v:=v||jsonb_build_object('research_queue',x); exception when others then v:=v||jsonb_build_object('research_queue',jsonb_build_object('status','error','message',sqlerrm)); end;
    v:=v||jsonb_build_object('status','completed','completed_at',now());
  exception when others then v:=v||jsonb_build_object('status','error','message',sqlerrm); end;
  perform pg_advisory_unlock(hashtextextended('harbourview:progressive-depth-cycle:v1',0));
  return v;
end $$;
revoke all on function public.run_progressive_depth_cycle_v1() from public,anon,authenticated;
grant execute on function public.run_progressive_depth_cycle_v1() to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260925190000','progressive_depth_cycle_batch_tuning','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260925190000_progressive_depth_cycle_batch_tuning.sql

-- RECOVERY BEGIN 20260925200000_publish_heatmap_au_de_subnational.sql
-- Publish Market Access heatmap for remaining AU states and DE Länder.
-- Aligns with already-published siblings (AU-NSW/TAS medical; DE Länder medical).

insert into public.regulatory_market_access_evidence
  (evidence_key, jurisdiction_iso2, tier, rationale, authority_name, authority_url,
   source_effective_date, verified_at, expires_at, active)
values
  ('hv-heatmap-au-act-20260925','AU-ACT','medical_limited_trade',
   'Australian Capital Territory participates in Australia''s regulated medicinal cannabis scheme under the TGA; adult-use commercial retail is not authorised at Commonwealth level.',
   'Therapeutic Goods Administration — Medicinal cannabis','https://www.tga.gov.au/products/medicinal-cannabis',
   '2016-11-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-au-nt-20260925','AU-NT','medical_limited_trade',
   'Northern Territory participates in Australia''s regulated medicinal cannabis scheme under the TGA; adult-use commercial retail is not authorised at Commonwealth level.',
   'Therapeutic Goods Administration — Medicinal cannabis','https://www.tga.gov.au/products/medicinal-cannabis',
   '2016-11-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-au-qld-20260925','AU-QLD','medical_limited_trade',
   'Queensland participates in Australia''s regulated medicinal cannabis scheme under the TGA and state health controls; adult-use commercial retail is not authorised.',
   'Queensland Health / TGA medicinal cannabis','https://www.tga.gov.au/products/medicinal-cannabis',
   '2016-11-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-au-sa-20260925','AU-SA','medical_limited_trade',
   'South Australia participates in Australia''s regulated medicinal cannabis scheme under the TGA; adult-use commercial retail is not authorised.',
   'Therapeutic Goods Administration — Medicinal cannabis','https://www.tga.gov.au/products/medicinal-cannabis',
   '2016-11-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-au-vic-20260925','AU-VIC','medical_limited_trade',
   'Victoria participates in Australia''s regulated medicinal cannabis scheme under the TGA and state frameworks; adult-use commercial retail is not authorised.',
   'Therapeutic Goods Administration — Medicinal cannabis','https://www.tga.gov.au/products/medicinal-cannabis',
   '2016-11-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-au-wa-20260925','AU-WA','medical_limited_trade',
   'Western Australia participates in Australia''s regulated medicinal cannabis scheme under the TGA; adult-use commercial retail is not authorised.',
   'Therapeutic Goods Administration — Medicinal cannabis','https://www.tga.gov.au/products/medicinal-cannabis',
   '2016-11-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-de-be-20260925','DE-BE','medical_limited_trade',
   'Berlin operates under Germany''s federal medicinal-cannabis framework (BtMG/CanG); Land-level colour follows the published medical pathway used for other Länder.',
   'BfArM — Medizinisches Cannabis','https://www.bfarm.de/DE/Bundesopiumstelle/Cannabis/_node.html',
   '2024-04-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-de-nw-20260925','DE-NW','medical_limited_trade',
   'Nordrhein-Westfalen operates under Germany''s federal medicinal-cannabis framework (BtMG/CanG).',
   'BfArM — Medizinisches Cannabis','https://www.bfarm.de/DE/Bundesopiumstelle/Cannabis/_node.html',
   '2024-04-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-de-rp-20260925','DE-RP','medical_limited_trade',
   'Rheinland-Pfalz operates under Germany''s federal medicinal-cannabis framework (BtMG/CanG).',
   'BfArM — Medizinisches Cannabis','https://www.bfarm.de/DE/Bundesopiumstelle/Cannabis/_node.html',
   '2024-04-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-de-sh-20260925','DE-SH','medical_limited_trade',
   'Schleswig-Holstein operates under Germany''s federal medicinal-cannabis framework (BtMG/CanG).',
   'BfArM — Medizinisches Cannabis','https://www.bfarm.de/DE/Bundesopiumstelle/Cannabis/_node.html',
   '2024-04-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-de-sl-20260925','DE-SL','medical_limited_trade',
   'Saarland operates under Germany''s federal medicinal-cannabis framework (BtMG/CanG).',
   'BfArM — Medizinisches Cannabis','https://www.bfarm.de/DE/Bundesopiumstelle/Cannabis/_node.html',
   '2024-04-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-de-sn-20260925','DE-SN','medical_limited_trade',
   'Sachsen operates under Germany''s federal medicinal-cannabis framework (BtMG/CanG).',
   'BfArM — Medizinisches Cannabis','https://www.bfarm.de/DE/Bundesopiumstelle/Cannabis/_node.html',
   '2024-04-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-de-st-20260925','DE-ST','medical_limited_trade',
   'Sachsen-Anhalt operates under Germany''s federal medicinal-cannabis framework (BtMG/CanG).',
   'BfArM — Medizinisches Cannabis','https://www.bfarm.de/DE/Bundesopiumstelle/Cannabis/_node.html',
   '2024-04-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-de-th-20260925','DE-TH','medical_limited_trade',
   'Thüringen operates under Germany''s federal medicinal-cannabis framework (BtMG/CanG).',
   'BfArM — Medizinisches Cannabis','https://www.bfarm.de/DE/Bundesopiumstelle/Cannabis/_node.html',
   '2024-04-01', now(), now() + interval '365 days', true)
on conflict (evidence_key) do update set
  tier = excluded.tier,
  rationale = excluded.rationale,
  authority_name = excluded.authority_name,
  authority_url = excluded.authority_url,
  source_effective_date = excluded.source_effective_date,
  verified_at = excluded.verified_at,
  expires_at = excluded.expires_at,
  active = true;

update public.regulatory_market_access_evidence e
set active = false
where e.jurisdiction_iso2 in (
  'AU-ACT','AU-NT','AU-QLD','AU-SA','AU-VIC','AU-WA',
  'DE-BE','DE-NW','DE-RP','DE-SH','DE-SL','DE-SN','DE-ST','DE-TH'
)
and e.evidence_key not like 'hv-heatmap-%-20260925'
and e.active = true;

select * from api.refresh_verified_market_access_tiers('heatmap-publish-au-de-subnational-20260925');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260925200000','publish_heatmap_au_de_subnational','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260925200000_publish_heatmap_au_de_subnational.sql

-- RECOVERY BEGIN 20260925210000_publish_heatmap_national_tranche2.sql
-- National tranche 2: Europe / LatAm / select openers for Market Access heatmap.
-- Fail-closed publish via regulatory_market_access_evidence + refresh.

insert into public.regulatory_market_access_evidence
  (evidence_key, jurisdiction_iso2, tier, rationale, authority_name, authority_url,
   source_effective_date, verified_at, expires_at, active)
values
  ('hv-heatmap-at-20260925','AT','medical_limited_trade',
   'Austria permits prescribed medical cannabis products under narcotics controls; adult-use commercial retail is not authorised.',
   'AGES / Austrian Federal Office for Safety in Health Care','https://www.basg.gv.at/',
   '2019-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-ch-20260925','CH','medical_limited_trade',
   'Switzerland authorises medical cannabis and limited regulated pathways; adult-use commercial retail is not generally authorised nationwide.',
   'Swissmedic / Federal Office of Public Health','https://www.swissmedic.ch/',
   '2022-08-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-cl-20260925','CL','medical_limited_trade',
   'Chile authorises medical cannabis access and limited cultivation/pharmacy pathways; general adult-use commercial retail is not authorised.',
   'Instituto de Salud Pública de Chile','https://www.ispch.cl/',
   '2015-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-cr-20260925','CR','legal_commercial_access',
   'Costa Rica licenses medicinal cannabis cultivation and related commercial activity including export projects under MAG/health frameworks.',
   'Ministerio de Agricultura y Ganadería (MAG) Costa Rica','https://www.mag.go.cr/',
   '2019-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-cz-20260925','CZ','medical_limited_trade',
   'Czechia operates a regulated medical cannabis prescribing and pharmacy supply framework; adult-use commercial retail is not authorised.',
   'Státní ústav pro kontrolu léčiv (SÚKL)','https://www.sukl.cz/',
   '2013-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-fi-20260925','FI','medical_limited_trade',
   'Finland permits specialised medical cannabis under Fimea controls; adult-use commercial retail is not authorised.',
   'Finnish Medicines Agency (Fimea)','https://fimea.fi/',
   '2008-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-gr-20260925','GR','medical_limited_trade',
   'Greece authorises medical cannabis production and supply under national health/narcotics frameworks; adult-use commercial retail is not authorised.',
   'Greek Ministry of Health / EOF','https://www.eof.gr/',
   '2018-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-hr-20260925','HR','medical_limited_trade',
   'Croatia permits medical cannabis under medicines/narcotics controls; adult-use commercial retail is not authorised.',
   'HALMED — Croatian Agency for Medicinal Products','https://www.halmed.hr/',
   '2015-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-hu-20260925','HU','medical_limited_trade',
   'Hungary permits limited medical cannabis product access under medicines controls; adult-use commercial retail is not authorised.',
   'National Institute of Pharmacy and Nutrition (OGYÉI)','https://ogyei.gov.hu/',
   '2017-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-il-20260925','IL','medical_limited_trade',
   'Israel operates a regulated medical cannabis programme under the Ministry of Health; adult-use commercial retail is not authorised.',
   'Israel Ministry of Health — Medical Cannabis','https://www.health.gov.il/',
   '2011-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-jm-20260925','JM','medical_limited_trade',
   'Jamaica licenses medical and scientific cannabis activity under the Cannabis Licensing Authority; general adult-use commercial retail is not treated as verified for globe publication.',
   'Cannabis Licensing Authority Jamaica','https://www.cla.org.jm/',
   '2015-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-lt-20260925','LT','medical_limited_trade',
   'Lithuania permits medical cannabis products under medicines controls; adult-use commercial retail is not authorised.',
   'State Medicines Control Agency of Lithuania','https://www.vvkt.lt/',
   '2019-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-lu-20260925','LU','medical_limited_trade',
   'Luxembourg authorises medical cannabis; a verified general adult-use commercial retail market is not treated as fully established for globe publication.',
   'Ministry of Health Luxembourg','https://sante.public.lu/',
   '2018-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-lv-20260925','LV','medical_limited_trade',
   'Latvia permits medical cannabis under medicines/narcotics frameworks; adult-use commercial retail is not authorised.',
   'State Agency of Medicines of Latvia','https://www.zva.gov.lv/',
   '2019-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-pe-20260925','PE','medical_limited_trade',
   'Peru authorises medical cannabis under health ministry regulations; adult-use commercial retail is not authorised.',
   'DIGEMID / Ministerio de Salud del Perú','https://www.digemid.minsa.gob.pe/',
   '2017-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-pl-20260925','PL','medical_limited_trade',
   'Poland permits medical cannabis pharmacy supply under pharmaceutical law; adult-use commercial retail is not authorised.',
   'URPL — Office for Registration of Medicinal Products','https://www.urpl.gov.pl/',
   '2017-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-pt-20260925','PT','medical_limited_trade',
   'Portugal authorises medical cannabis under INFARMED; adult-use commercial retail is not authorised.',
   'INFARMED — Autoridade Nacional do Medicamento','https://www.infarmed.pt/',
   '2018-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-se-20260925','SE','medical_limited_trade',
   'Sweden permits limited medical cannabis product access under Läkemedelsverket controls; adult-use commercial retail is not authorised.',
   'Swedish Medical Products Agency (Läkemedelsverket)','https://www.lakemedelsverket.se/',
   '2012-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-si-20260925','SI','medical_limited_trade',
   'Slovenia permits medical cannabis under medicines controls; adult-use commercial retail is not authorised.',
   'JAZMP — Agency for Medicinal Products and Medical Devices','https://www.jazmp.si/',
   '2014-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-sk-20260925','SK','medical_limited_trade',
   'Slovakia permits limited medical cannabis access under medicines controls; adult-use commercial retail is not authorised.',
   'Štátny ústav pre kontrolu liečiv (ŠÚKL)','https://www.sukl.sk/',
   '2018-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-uy-20260925','UY','legal_commercial_access',
   'Uruguay operates a regulated adult-use and medical cannabis framework including pharmacy and club channels under IRCCA.',
   'IRCCA — Instituto de Regulación y Control del Cannabis','https://www.ircca.gub.uy/',
   '2013-12-20', now(), now() + interval '365 days', true),
  ('hv-heatmap-cy-20260925','CY','medical_limited_trade',
   'Cyprus authorises medical cannabis under national medicines/narcotics frameworks; adult-use commercial retail is not authorised.',
   'Cyprus Ministry of Health / Pharmaceutical Services','https://www.moh.gov.cy/',
   '2017-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-bw-20260925','BW','legal_commercial_access',
   'Botswana licenses medical cannabis production and related controlled commercial activity under national drugs control frameworks.',
   'Botswana Medicines Regulatory Authority / Ministry of Health','https://www.moh.gov.bw/',
   '2019-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-gh-20260925','GH','legal_commercial_access',
   'Ghana authorises controlled cannabis cultivation for health/industrial purposes under the Narcotics Control Commission framework; this is not an adult-use retail market.',
   'Narcotics Control Commission Ghana','https://www.ncc.gov.gh/',
   '2020-01-01', now(), now() + interval '365 days', true),
  ('hv-heatmap-ma-20260925','MA','legal_commercial_access',
   'Morocco authorises regulated medical and industrial cannabis activity under ANRAC Law 13-21; adult-use recreational retail is not the published pathway.',
   'ANRAC — Agence Nationale de Réglementation des Activités relatives au Cannabis','https://www.anrac.ma/',
   '2021-01-01', now(), now() + interval '365 days', true)
on conflict (evidence_key) do update set
  tier = excluded.tier,
  rationale = excluded.rationale,
  authority_name = excluded.authority_name,
  authority_url = excluded.authority_url,
  source_effective_date = excluded.source_effective_date,
  verified_at = excluded.verified_at,
  expires_at = excluded.expires_at,
  active = true;

update public.regulatory_market_access_evidence e
set active = false
where e.jurisdiction_iso2 in (
  'AT','CH','CL','CR','CZ','FI','GR','HR','HU','IL','JM','LT','LU','LV',
  'PE','PL','PT','SE','SI','SK','UY','CY','BW','GH','MA'
)
and e.evidence_key not like 'hv-heatmap-%-20260925'
and e.active = true;

select * from api.refresh_verified_market_access_tiers('heatmap-national-tranche2-20260925');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260925210000','publish_heatmap_national_tranche2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260925210000_publish_heatmap_national_tranche2.sql
