-- =============================================================================
-- Harbourview Global Cannabis Data Contract v1.0 — P0/P1 backend foundation
-- P0/P1 raw intelligence tables are stored in cannabis_intelligence and are not
-- anon-readable. Public access must be projected through explicit DTO allowlists
-- or future approved public snapshot tables.
-- =============================================================================

create extension if not exists pgcrypto;
create schema if not exists cannabis_intelligence;

-- Stable system enums only. Expandable cannabis/product taxonomies use lookup
-- tables with stable slugs.
do $$ begin
  create type cannabis_intelligence.jurisdiction_type as enum ('sovereign_country','territory','region','subnational','municipality','special_administrative_area','supranational','other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.sovereignty_status as enum ('sovereign','dependent_territory','disputed','special_status','not_applicable','unknown');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.activity_type as enum ('adult_use_sale','medical_use','prescribing','dispensing','pharmacy_distribution','cultivation','home_cultivation','commercial_cultivation','hemp_cultivation','processing','extraction','manufacturing','testing','research','clinical_trial','import','export','wholesale','distribution','retail','online_sale','advertising','packaging','labelling','transport','storage','waste_disposal','food_use','feed_use','cosmetic_use','construction_material_use','seed_sale','genetics_sale','public_procurement');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.legal_status as enum ('legal','conditionally_legal','prohibited','not_regulated','unclear','mixed','unknown','not_applicable');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.operational_status as enum ('operational','partially_operational','announced_not_operational','suspended','not_operational','unknown','not_applicable');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.regulator_type as enum ('national_regulator','subnational_regulator','health_authority','agriculture_authority','food_safety_authority','customs_authority','law_enforcement','standards_body','pharmaceutical_regulator','environment_authority','municipal_authority','other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.licence_category as enum ('cultivation','processing','manufacturing','testing','research','medical_distribution','pharmacy','retail','wholesale','import','export','transport','storage','seed_genetics','hemp','food_feed_cosmetic','other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.licence_status as enum ('active','pending','suspended','revoked','expired','withdrawn','unknown','not_applicable');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.entity_type as enum ('company','individual','government_agency','nonprofit','research_institution','healthcare_provider','pharmacy','laboratory','unknown','other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.source_type as enum ('law','regulation','official_guidance','licence_register','court_decision','government_dataset','official_press_release','parliamentary_record','treaty','standards_document','regulator_website','public_notice','academic','news','commercial_database','manual_research_note','other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.source_reliability_tier as enum ('tier_1_official','tier_2_primary_non_regulator','tier_3_reputable_secondary','tier_4_unverified_secondary','tier_5_low_reliability');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.evidence_status as enum ('verified','partially_verified','conflicting','stale','machine_extracted_unreviewed','human_review_required','native_language_review_required','legal_review_required','no_public_evidence_found','not_applicable');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.exposure_level as enum ('public_safe','public_summary_only','restricted_internal','admin_only','legal_review_required','do_not_publish');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.gap_type as enum ('jurisdiction_universe','source_discovery','legal_status','operational_reality','threshold','regulator','licence_type','licence_register','licensed_entity_extraction','medical_access','import_export','coverage_matrix','contradiction_review','translation_review','legal_review','other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.contradiction_status as enum ('open','under_review','resolved','superseded','dismissed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.review_status as enum ('unreviewed','in_review','approved_public','approved_internal','rejected','needs_human_review','needs_native_language_review','needs_legal_review','not_applicable');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.update_frequency as enum ('continuous','daily','weekly','monthly','quarterly','annual','ad_hoc','unknown','not_applicable');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.evidence_relationship_type as enum ('supports','contradicts','supersedes','clarifies','background');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.import_export_direction as enum ('import','export','both','not_applicable','unknown');
exception when duplicate_object then null; end $$;

do $$ begin
  create type cannabis_intelligence.coverage_status as enum ('not_started','import_structure_ready','in_progress','partial','complete','blocked','not_applicable');
exception when duplicate_object then null; end $$;

create or replace function cannabis_intelligence.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists cannabis_intelligence.jurisdictions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  display_name text not null,
  official_name text,
  iso_alpha2 text check (iso_alpha2 is null or iso_alpha2 ~ '^[A-Z]{2}$'),
  iso_alpha3 text check (iso_alpha3 is null or iso_alpha3 ~ '^[A-Z]{3}$'),
  jurisdiction_type cannabis_intelligence.jurisdiction_type not null,
  sovereignty_status cannabis_intelligence.sovereignty_status not null default 'unknown',
  parent_jurisdiction_id uuid references cannabis_intelligence.jurisdictions(id) on delete restrict,
  region text,
  subregion text,
  universe_import_status cannabis_intelligence.coverage_status not null default 'not_started',
  coverage_generation_status cannabis_intelligence.coverage_status not null default 'not_started',
  source_discovery_status cannabis_intelligence.coverage_status not null default 'not_started',
  legal_fact_population_status cannabis_intelligence.coverage_status not null default 'not_started',
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'human_review_required',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  observed_at timestamptz not null default now(),
  verified_at timestamptz,
  valid_from date,
  valid_to date,
  notes_public text,
  notes_internal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);
comment on table cannabis_intelligence.jurisdictions is 'Raw jurisdiction universe records for cannabis intelligence. Not anon-readable; public DTOs expose only allowlisted fields.';

create table if not exists cannabis_intelligence.jurisdiction_aliases (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  alias text not null,
  alias_type text not null default 'common',
  language_code text,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'human_review_required',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  observed_at timestamptz not null default now(),
  verified_at timestamptz,
  notes_internal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cannabis_intelligence.jurisdiction_relationships (
  id uuid primary key default gen_random_uuid(),
  parent_jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  child_jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  relationship_type text not null,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'human_review_required',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  observed_at timestamptz not null default now(),
  verified_at timestamptz,
  valid_from date,
  valid_to date,
  notes_public text,
  notes_internal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_jurisdiction_id <> child_jurisdiction_id),
  check (valid_to is null or valid_from is null or valid_to >= valid_from),
  unique (parent_jurisdiction_id, child_jurisdiction_id, relationship_type, valid_from)
);

create table if not exists cannabis_intelligence.plant_product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  display_name text not null,
  description text,
  parent_category_id uuid references cannabis_intelligence.plant_product_categories(id) on delete restrict,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table cannabis_intelligence.plant_product_categories is 'Seeded expandable cannabis-plant product taxonomy; stores no country/legal facts.';

create table if not exists cannabis_intelligence.product_forms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  display_name text not null,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table cannabis_intelligence.product_forms is 'Seeded expandable physical/form taxonomy; stores no country/legal facts.';

create table if not exists cannabis_intelligence.activity_product_matrix (
  id uuid primary key default gen_random_uuid(),
  activity cannabis_intelligence.activity_type not null,
  plant_product_category_id uuid not null references cannabis_intelligence.plant_product_categories(id) on delete cascade,
  coverage_required boolean not null default true,
  notes_public text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity, plant_product_category_id)
);
comment on table cannabis_intelligence.activity_product_matrix is 'Required global coverage pairs used to create explicit gaps without inventing legal facts.';

create table if not exists cannabis_intelligence.source_documents (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid references cannabis_intelligence.jurisdictions(id) on delete set null,
  source_type cannabis_intelligence.source_type not null,
  reliability_tier cannabis_intelligence.source_reliability_tier not null default 'tier_4_unverified_secondary',
  title text not null,
  publisher text,
  canonical_url text,
  official_url text,
  language_code text,
  published_at date,
  effective_at date,
  accessed_at timestamptz,
  archive_path text,
  raw_text_path text,
  screenshot_path text,
  pdf_path text,
  extraction_log jsonb,
  content_hash text,
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  notes_public text,
  notes_internal text,
  reviewer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (canonical_url),
  check (canonical_url is null or canonical_url ~* '^https?://'),
  check (official_url is null or official_url ~* '^https?://')
);
comment on table cannabis_intelligence.source_documents is 'First-class raw source records. Archive/raw paths, extraction logs, hashes, and reviewer notes are internal-only by default.';

create table if not exists cannabis_intelligence.evidence_claims (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid references cannabis_intelligence.jurisdictions(id) on delete set null,
  source_document_id uuid not null references cannabis_intelligence.source_documents(id) on delete restrict,
  claim_type text not null,
  claim_field text,
  claim_value text,
  raw_excerpt text,
  normalized_summary text,
  machine_extracted boolean not null default true,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  observed_at timestamptz not null default now(),
  verified_at timestamptz,
  valid_from date,
  valid_to date,
  notes_public text,
  notes_internal text,
  reviewer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);
comment on table cannabis_intelligence.evidence_claims is 'Normalized factual claims extracted from source documents. Machine-extracted claims default non-public until reviewed.';

create table if not exists cannabis_intelligence.data_gaps (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  plant_product_category_id uuid references cannabis_intelligence.plant_product_categories(id) on delete cascade,
  activity cannabis_intelligence.activity_type,
  gap_type cannabis_intelligence.gap_type not null default 'coverage_matrix',
  priority integer not null default 50 check (priority between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'no_public_evidence_found',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  status cannabis_intelligence.review_status not null default 'unreviewed',
  public_summary text,
  notes_internal text,
  observed_at timestamptz not null default now(),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (jurisdiction_id, plant_product_category_id, activity, gap_type)
);
comment on table cannabis_intelligence.data_gaps is 'Explicit unknowns and missing coverage. Unknown facts must be represented here rather than omitted.';

create table if not exists cannabis_intelligence.legal_regimes (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  plant_product_category_id uuid not null references cannabis_intelligence.plant_product_categories(id) on delete restrict,
  activity cannabis_intelligence.activity_type not null,
  legal_status cannabis_intelligence.legal_status not null default 'unknown',
  operational_status cannabis_intelligence.operational_status not null default 'unknown',
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  public_summary text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  effective_from date,
  effective_to date,
  valid_from date,
  valid_to date,
  supersedes_record_id uuid references cannabis_intelligence.legal_regimes(id) on delete set null,
  superseded_by_record_id uuid references cannabis_intelligence.legal_regimes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from),
  check (effective_to is null or effective_from is null or effective_to >= effective_from)
);
comment on table cannabis_intelligence.legal_regimes is 'Raw legal status and separate operational reality by jurisdiction/category/activity. Temporal records are not destructively overwritten.';

create table if not exists cannabis_intelligence.regulatory_authorities (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  name text not null,
  regulator_type cannabis_intelligence.regulator_type not null,
  official_url text,
  contact_url text,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  notes_public text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  valid_from date,
  valid_to date,
  supersedes_record_id uuid references cannabis_intelligence.regulatory_authorities(id) on delete set null,
  superseded_by_record_id uuid references cannabis_intelligence.regulatory_authorities(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (official_url is null or official_url ~* '^https?://'),
  check (contact_url is null or contact_url ~* '^https?://'),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create table if not exists cannabis_intelligence.legal_thresholds (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  plant_product_category_id uuid references cannabis_intelligence.plant_product_categories(id) on delete restrict,
  threshold_type text not null,
  threshold_value numeric,
  threshold_unit text,
  comparator text check (comparator is null or comparator in ('lt','lte','eq','gte','gt','range','unknown')),
  applies_to_activity cannabis_intelligence.activity_type,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  public_summary text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  effective_from date,
  effective_to date,
  valid_from date,
  valid_to date,
  supersedes_record_id uuid references cannabis_intelligence.legal_thresholds(id) on delete set null,
  superseded_by_record_id uuid references cannabis_intelligence.legal_thresholds(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from),
  check (effective_to is null or effective_from is null or effective_to >= effective_from)
);

create table if not exists cannabis_intelligence.laws_regulations (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  source_document_id uuid references cannabis_intelligence.source_documents(id) on delete restrict,
  title text not null,
  instrument_type text not null,
  official_identifier text,
  status cannabis_intelligence.legal_status not null default 'unknown',
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  public_summary text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  enacted_at date,
  effective_from date,
  effective_to date,
  valid_from date,
  valid_to date,
  supersedes_record_id uuid references cannabis_intelligence.laws_regulations(id) on delete set null,
  superseded_by_record_id uuid references cannabis_intelligence.laws_regulations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from),
  check (effective_to is null or effective_from is null or effective_to >= effective_from)
);

create table if not exists cannabis_intelligence.authority_responsibilities (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references cannabis_intelligence.regulatory_authorities(id) on delete cascade,
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  plant_product_category_id uuid references cannabis_intelligence.plant_product_categories(id) on delete restrict,
  activity cannabis_intelligence.activity_type,
  responsibility_summary text not null,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  notes_public text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create table if not exists cannabis_intelligence.licence_types (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  authority_id uuid references cannabis_intelligence.regulatory_authorities(id) on delete set null,
  category cannabis_intelligence.licence_category not null,
  slug text not null check (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  display_name text not null,
  activity cannabis_intelligence.activity_type,
  plant_product_category_id uuid references cannabis_intelligence.plant_product_categories(id) on delete restrict,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  public_summary text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  valid_from date,
  valid_to date,
  supersedes_record_id uuid references cannabis_intelligence.licence_types(id) on delete set null,
  superseded_by_record_id uuid references cannabis_intelligence.licence_types(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);
comment on table cannabis_intelligence.licence_types is 'Licence type definitions only. Actual licensees are stored separately in licensed_entities and entity_licences.';

create table if not exists cannabis_intelligence.licence_registers (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  authority_id uuid references cannabis_intelligence.regulatory_authorities(id) on delete set null,
  licence_type_id uuid references cannabis_intelligence.licence_types(id) on delete set null,
  name text not null,
  register_url text,
  is_public boolean not null default false,
  extraction_status cannabis_intelligence.coverage_status not null default 'not_started',
  update_frequency cannabis_intelligence.update_frequency not null default 'unknown',
  last_checked_at timestamptz,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  public_summary text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (register_url is null or register_url ~* '^https?://')
);
comment on table cannabis_intelligence.licence_registers is 'Tracks licence registers even where licensee extraction is incomplete.';

create table if not exists cannabis_intelligence.licensed_entities (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  entity_type cannabis_intelligence.entity_type not null default 'unknown',
  legal_name text not null,
  trade_name text,
  official_identifier text,
  website_url text,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  notes_public text,
  notes_internal text,
  private_contact_data jsonb,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (website_url is null or website_url ~* '^https?://')
);
comment on table cannabis_intelligence.licensed_entities is 'Actual licensee/entity records. Private contact data is internal-only and not exposed in public DTOs.';

create table if not exists cannabis_intelligence.entity_licences (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references cannabis_intelligence.licensed_entities(id) on delete cascade,
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  licence_type_id uuid references cannabis_intelligence.licence_types(id) on delete restrict,
  licence_register_id uuid references cannabis_intelligence.licence_registers(id) on delete set null,
  licence_number text,
  status cannabis_intelligence.licence_status not null default 'unknown',
  issued_at date,
  expires_at date,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  notes_public text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  valid_from date,
  valid_to date,
  supersedes_record_id uuid references cannabis_intelligence.entity_licences(id) on delete set null,
  superseded_by_record_id uuid references cannabis_intelligence.entity_licences(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or issued_at is null or expires_at >= issued_at),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create table if not exists cannabis_intelligence.medical_access_pathways (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  plant_product_category_id uuid references cannabis_intelligence.plant_product_categories(id) on delete restrict,
  pathway_type text not null,
  legal_status cannabis_intelligence.legal_status not null default 'unknown',
  operational_status cannabis_intelligence.operational_status not null default 'unknown',
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'legal_review_required',
  review_status cannabis_intelligence.review_status not null default 'needs_legal_review',
  exposure_level cannabis_intelligence.exposure_level not null default 'legal_review_required',
  public_summary text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  effective_from date,
  effective_to date,
  valid_from date,
  valid_to date,
  supersedes_record_id uuid references cannabis_intelligence.medical_access_pathways(id) on delete set null,
  superseded_by_record_id uuid references cannabis_intelligence.medical_access_pathways(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from),
  check (effective_to is null or effective_from is null or effective_to >= effective_from)
);

create table if not exists cannabis_intelligence.import_export_rules (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  plant_product_category_id uuid references cannabis_intelligence.plant_product_categories(id) on delete restrict,
  direction cannabis_intelligence.import_export_direction not null default 'unknown',
  legal_status cannabis_intelligence.legal_status not null default 'unknown',
  operational_status cannabis_intelligence.operational_status not null default 'unknown',
  licence_required boolean,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'legal_review_required',
  review_status cannabis_intelligence.review_status not null default 'needs_legal_review',
  exposure_level cannabis_intelligence.exposure_level not null default 'legal_review_required',
  public_summary text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  effective_from date,
  effective_to date,
  valid_from date,
  valid_to date,
  supersedes_record_id uuid references cannabis_intelligence.import_export_rules(id) on delete set null,
  superseded_by_record_id uuid references cannabis_intelligence.import_export_rules(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from),
  check (effective_to is null or effective_from is null or effective_to >= effective_from)
);

create table if not exists cannabis_intelligence.contradictions (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid references cannabis_intelligence.jurisdictions(id) on delete set null,
  subject_table text not null check (subject_table in ('legal_regimes','legal_thresholds','laws_regulations','regulatory_authorities','authority_responsibilities','licence_types','licence_registers','licensed_entities','entity_licences','medical_access_pathways','import_export_rules','evidence_claims')),
  subject_id uuid,
  field_name text,
  status cannabis_intelligence.contradiction_status not null default 'open',
  summary text not null,
  evidence_claim_id_a uuid references cannabis_intelligence.evidence_claims(id) on delete restrict,
  evidence_claim_id_b uuid references cannabis_intelligence.evidence_claims(id) on delete restrict,
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  review_status cannabis_intelligence.review_status not null default 'needs_human_review',
  notes_internal text,
  reviewer_notes text,
  observed_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (evidence_claim_id_a is null or evidence_claim_id_b is null or evidence_claim_id_a <> evidence_claim_id_b)
);
comment on table cannabis_intelligence.contradictions is 'Contradictory claims are recorded here rather than overwritten. Internals are not public DTO fields.';

create table if not exists cannabis_intelligence.review_tasks (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid references cannabis_intelligence.jurisdictions(id) on delete set null,
  subject_table text not null check (subject_table in ('jurisdictions','source_documents','evidence_claims','data_gaps','legal_regimes','regulatory_authorities','legal_thresholds','laws_regulations','authority_responsibilities','licence_types','licence_registers','licensed_entities','entity_licences','medical_access_pathways','import_export_rules','contradictions')),
  subject_id uuid,
  status cannabis_intelligence.review_status not null default 'unreviewed',
  priority integer not null default 50 check (priority between 0 and 100),
  assigned_to uuid,
  due_at timestamptz,
  notes_internal text,
  reviewer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cannabis_intelligence.fact_evidence_links (
  id uuid primary key default gen_random_uuid(),
  subject_table text not null check (subject_table in ('jurisdictions','jurisdiction_aliases','jurisdiction_relationships','data_gaps','legal_regimes','regulatory_authorities','legal_thresholds','laws_regulations','authority_responsibilities','licence_types','licence_registers','licensed_entities','entity_licences','medical_access_pathways','import_export_rules','contradictions','review_tasks')),
  subject_id uuid not null,
  evidence_claim_id uuid references cannabis_intelligence.evidence_claims(id) on delete cascade,
  source_document_id uuid references cannabis_intelligence.source_documents(id) on delete cascade,
  relationship_type cannabis_intelligence.evidence_relationship_type not null,
  confidence_contribution integer not null default 0 check (confidence_contribution between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (evidence_claim_id is not null or source_document_id is not null),
  unique (subject_table, subject_id, evidence_claim_id, source_document_id, relationship_type)
);
comment on table cannabis_intelligence.fact_evidence_links is 'Generic provenance relation allowing factual records to link to multiple evidence claims/source documents.';

create or replace function cannabis_intelligence.generate_mandatory_data_gaps(target_jurisdiction_id uuid)
returns integer
language plpgsql
security definer
set search_path = cannabis_intelligence, public
as $$
declare
  inserted_count integer;
begin
  insert into cannabis_intelligence.data_gaps (
    jurisdiction_id,
    plant_product_category_id,
    activity,
    gap_type,
    priority,
    evidence_status,
    review_status,
    exposure_level,
    confidence_score,
    status,
    public_summary,
    notes_internal
  )
  select
    target_jurisdiction_id,
    apm.plant_product_category_id,
    apm.activity,
    'coverage_matrix',
    50,
    'no_public_evidence_found',
    'unreviewed',
    'restricted_internal',
    0,
    'unreviewed',
    null,
    'Auto-generated mandatory coverage gap; no legal fact has been populated.'
  from cannabis_intelligence.activity_product_matrix apm
  where apm.coverage_required = true
    and not exists (
      select 1
      from cannabis_intelligence.legal_regimes lr
      where lr.jurisdiction_id = target_jurisdiction_id
        and lr.plant_product_category_id = apm.plant_product_category_id
        and lr.activity = apm.activity
    )
  on conflict (jurisdiction_id, plant_product_category_id, activity, gap_type) do nothing;

  get diagnostics inserted_count = row_count;

  update cannabis_intelligence.jurisdictions
  set coverage_generation_status = case when inserted_count > 0 then 'partial'::cannabis_intelligence.coverage_status else coverage_generation_status end,
      updated_at = now()
  where id = target_jurisdiction_id;

  return inserted_count;
end;
$$;
revoke all on function cannabis_intelligence.generate_mandatory_data_gaps(uuid) from public;

create or replace function cannabis_intelligence.generate_mandatory_data_gaps_for_new_jurisdiction()
returns trigger
language plpgsql
security definer
set search_path = cannabis_intelligence, public
as $$
begin
  perform cannabis_intelligence.generate_mandatory_data_gaps(new.id);
  return new;
end;
$$;
revoke all on function cannabis_intelligence.generate_mandatory_data_gaps_for_new_jurisdiction() from public;

drop trigger if exists trg_generate_mandatory_data_gaps_for_new_jurisdiction on cannabis_intelligence.jurisdictions;
create trigger trg_generate_mandatory_data_gaps_for_new_jurisdiction
after insert on cannabis_intelligence.jurisdictions
for each row execute function cannabis_intelligence.generate_mandatory_data_gaps_for_new_jurisdiction();

create or replace function cannabis_intelligence.generate_mandatory_data_gaps_for_matrix_pair()
returns trigger
language plpgsql
security definer
set search_path = cannabis_intelligence, public
as $$
begin
  insert into cannabis_intelligence.data_gaps (
    jurisdiction_id,
    plant_product_category_id,
    activity,
    gap_type,
    priority,
    evidence_status,
    review_status,
    exposure_level,
    confidence_score,
    status,
    public_summary,
    notes_internal
  )
  select
    jurisdictions.id,
    new.plant_product_category_id,
    new.activity,
    'coverage_matrix',
    50,
    'no_public_evidence_found',
    'unreviewed',
    'restricted_internal',
    0,
    'unreviewed',
    null,
    'Auto-generated mandatory coverage gap from a newly required activity/category matrix pair; no legal fact has been populated.'
  from cannabis_intelligence.jurisdictions
  where new.coverage_required = true
    and not exists (
      select 1
      from cannabis_intelligence.legal_regimes lr
      where lr.jurisdiction_id = jurisdictions.id
        and lr.plant_product_category_id = new.plant_product_category_id
        and lr.activity = new.activity
    )
  on conflict (jurisdiction_id, plant_product_category_id, activity, gap_type) do nothing;

  return new;
end;
$$;
revoke all on function cannabis_intelligence.generate_mandatory_data_gaps_for_matrix_pair() from public;

drop trigger if exists trg_generate_mandatory_data_gaps_for_matrix_pair on cannabis_intelligence.activity_product_matrix;
create trigger trg_generate_mandatory_data_gaps_for_matrix_pair
after insert on cannabis_intelligence.activity_product_matrix
for each row execute function cannabis_intelligence.generate_mandatory_data_gaps_for_matrix_pair();

-- Updated-at triggers for all new tables.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'jurisdictions','jurisdiction_aliases','jurisdiction_relationships','plant_product_categories','product_forms','activity_product_matrix','source_documents','evidence_claims','data_gaps','legal_regimes','regulatory_authorities','legal_thresholds','laws_regulations','authority_responsibilities','licence_types','licence_registers','licensed_entities','entity_licences','medical_access_pathways','import_export_rules','contradictions','review_tasks','fact_evidence_links'
  ] loop
    execute format('drop trigger if exists %I on cannabis_intelligence.%I', 'trg_' || table_name || '_set_updated_at', table_name);
    execute format('create trigger %I before update on cannabis_intelligence.%I for each row execute function cannabis_intelligence.set_updated_at()', 'trg_' || table_name || '_set_updated_at', table_name);
  end loop;
end $$;

-- RLS: deny by default. No anon-readable raw intelligence policies are created.
alter table cannabis_intelligence.jurisdictions enable row level security;
alter table cannabis_intelligence.jurisdiction_aliases enable row level security;
alter table cannabis_intelligence.jurisdiction_relationships enable row level security;
alter table cannabis_intelligence.plant_product_categories enable row level security;
alter table cannabis_intelligence.product_forms enable row level security;
alter table cannabis_intelligence.activity_product_matrix enable row level security;
alter table cannabis_intelligence.source_documents enable row level security;
alter table cannabis_intelligence.evidence_claims enable row level security;
alter table cannabis_intelligence.data_gaps enable row level security;
alter table cannabis_intelligence.legal_regimes enable row level security;
alter table cannabis_intelligence.regulatory_authorities enable row level security;
alter table cannabis_intelligence.legal_thresholds enable row level security;
alter table cannabis_intelligence.laws_regulations enable row level security;
alter table cannabis_intelligence.authority_responsibilities enable row level security;
alter table cannabis_intelligence.licence_types enable row level security;
alter table cannabis_intelligence.licence_registers enable row level security;
alter table cannabis_intelligence.licensed_entities enable row level security;
alter table cannabis_intelligence.entity_licences enable row level security;
alter table cannabis_intelligence.medical_access_pathways enable row level security;
alter table cannabis_intelligence.import_export_rules enable row level security;
alter table cannabis_intelligence.contradictions enable row level security;
alter table cannabis_intelligence.review_tasks enable row level security;
alter table cannabis_intelligence.fact_evidence_links enable row level security;

revoke all on schema cannabis_intelligence from anon;
revoke all on all tables in schema cannabis_intelligence from anon;
revoke all on all functions in schema cannabis_intelligence from anon;

-- Required FK/common-filter indexes.
create index if not exists idx_ci_jurisdictions_slug on cannabis_intelligence.jurisdictions(slug);
create index if not exists idx_ci_jurisdictions_type on cannabis_intelligence.jurisdictions(jurisdiction_type);
create index if not exists idx_ci_jurisdictions_parent on cannabis_intelligence.jurisdictions(parent_jurisdiction_id);
create index if not exists idx_ci_jurisdiction_aliases_jurisdiction on cannabis_intelligence.jurisdiction_aliases(jurisdiction_id);
create unique index if not exists uq_ci_jurisdiction_aliases_language on cannabis_intelligence.jurisdiction_aliases(jurisdiction_id, alias, coalesce(language_code, ''));
create unique index if not exists uq_ci_licence_types_slug_valid_from on cannabis_intelligence.licence_types(jurisdiction_id, slug, coalesce(valid_from, date '1900-01-01'));
create unique index if not exists uq_ci_fact_evidence_links_nullable_targets on cannabis_intelligence.fact_evidence_links(subject_table, subject_id, coalesce(evidence_claim_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(source_document_id, '00000000-0000-0000-0000-000000000000'::uuid), relationship_type);
create index if not exists idx_ci_jurisdiction_relationships_parent on cannabis_intelligence.jurisdiction_relationships(parent_jurisdiction_id);
create index if not exists idx_ci_jurisdiction_relationships_child on cannabis_intelligence.jurisdiction_relationships(child_jurisdiction_id);
create index if not exists idx_ci_product_categories_parent on cannabis_intelligence.plant_product_categories(parent_category_id);
create index if not exists idx_ci_activity_product_matrix_category on cannabis_intelligence.activity_product_matrix(plant_product_category_id);
create index if not exists idx_ci_activity_product_matrix_activity on cannabis_intelligence.activity_product_matrix(activity);
create index if not exists idx_ci_sources_jurisdiction_type_accessed on cannabis_intelligence.source_documents(jurisdiction_id, source_type, accessed_at);
create index if not exists idx_ci_sources_jurisdiction on cannabis_intelligence.source_documents(jurisdiction_id);
create index if not exists idx_ci_sources_type_accessed on cannabis_intelligence.source_documents(source_type, accessed_at);
create index if not exists idx_ci_claims_jurisdiction_source on cannabis_intelligence.evidence_claims(jurisdiction_id, source_document_id);
create index if not exists idx_ci_claims_source on cannabis_intelligence.evidence_claims(source_document_id);
create index if not exists idx_ci_gaps_jurisdiction_status_priority on cannabis_intelligence.data_gaps(jurisdiction_id, status, priority);
create index if not exists idx_ci_gaps_category_activity on cannabis_intelligence.data_gaps(plant_product_category_id, activity);
create index if not exists idx_ci_legal_regimes_jurisdiction_category_activity_status on cannabis_intelligence.legal_regimes(jurisdiction_id, plant_product_category_id, activity, legal_status);
create index if not exists idx_ci_legal_regimes_category on cannabis_intelligence.legal_regimes(plant_product_category_id);
create index if not exists idx_ci_regulators_jurisdiction on cannabis_intelligence.regulatory_authorities(jurisdiction_id);
create index if not exists idx_ci_thresholds_jurisdiction on cannabis_intelligence.legal_thresholds(jurisdiction_id);
create index if not exists idx_ci_laws_jurisdiction on cannabis_intelligence.laws_regulations(jurisdiction_id);
create index if not exists idx_ci_laws_source on cannabis_intelligence.laws_regulations(source_document_id);
create index if not exists idx_ci_authority_responsibilities_authority on cannabis_intelligence.authority_responsibilities(authority_id);
create index if not exists idx_ci_authority_responsibilities_jurisdiction on cannabis_intelligence.authority_responsibilities(jurisdiction_id);
create index if not exists idx_ci_licence_types_jurisdiction on cannabis_intelligence.licence_types(jurisdiction_id);
create index if not exists idx_ci_licence_types_authority on cannabis_intelligence.licence_types(authority_id);
create index if not exists idx_ci_licence_registers_jurisdiction on cannabis_intelligence.licence_registers(jurisdiction_id);
create index if not exists idx_ci_licence_registers_authority on cannabis_intelligence.licence_registers(authority_id);
create index if not exists idx_ci_licensees_jurisdiction on cannabis_intelligence.licensed_entities(jurisdiction_id);
create index if not exists idx_ci_entity_licences_entity on cannabis_intelligence.entity_licences(entity_id);
create index if not exists idx_ci_entity_licences_jurisdiction_status on cannabis_intelligence.entity_licences(jurisdiction_id, status);
create index if not exists idx_ci_entity_licences_type on cannabis_intelligence.entity_licences(licence_type_id);
create index if not exists idx_ci_entity_licences_register on cannabis_intelligence.entity_licences(licence_register_id);
create index if not exists idx_ci_medical_access_jurisdiction on cannabis_intelligence.medical_access_pathways(jurisdiction_id);
create index if not exists idx_ci_import_export_jurisdiction on cannabis_intelligence.import_export_rules(jurisdiction_id);
create index if not exists idx_ci_contradictions_jurisdiction on cannabis_intelligence.contradictions(jurisdiction_id);
create index if not exists idx_ci_contradictions_subject on cannabis_intelligence.contradictions(subject_table, subject_id, field_name, status);
create index if not exists idx_ci_review_tasks_subject on cannabis_intelligence.review_tasks(subject_table, subject_id, status);
create index if not exists idx_ci_fact_evidence_links_subject on cannabis_intelligence.fact_evidence_links(subject_table, subject_id);
create index if not exists idx_ci_fact_evidence_links_claim on cannabis_intelligence.fact_evidence_links(evidence_claim_id);
create index if not exists idx_ci_fact_evidence_links_source on cannabis_intelligence.fact_evidence_links(source_document_id);
