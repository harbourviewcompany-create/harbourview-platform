create extension if not exists pgcrypto;

-- SYSTEM MODULES
create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null references reference_systems(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  sort_order int default 0,
  created_at timestamptz default now(),
  unique(system_id, slug)
);

create index if not exists idx_modules_system_id on modules(system_id);

-- CHAPTERS
create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  name text not null,
  slug text not null,
  content_summary text,
  sort_order int default 0,
  created_at timestamptz default now(),
  unique(module_id, slug)
);

create index if not exists idx_chapters_module_id on chapters(module_id);

-- SUBCHAPTERS
create table if not exists subchapters (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  name text not null,
  slug text not null,
  content text,
  sort_order int default 0,
  created_at timestamptz default now(),
  unique(chapter_id, slug)
);

create index if not exists idx_subchapters_chapter_id on subchapters(chapter_id);

-- DECISION SUPPORT OBJECTS
create table if not exists decision_support_objects (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null references reference_systems(id) on delete cascade,
  type text not null,
  name text not null,
  schema jsonb,
  logic jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_dso_system_id on decision_support_objects(system_id);
create index if not exists idx_dso_type on decision_support_objects(type);
create index if not exists idx_dso_schema_gin on decision_support_objects using gin (schema);

-- EVIDENCE RECORDS
create table if not exists evidence_records (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null references reference_systems(id) on delete cascade,
  source_type text not null, -- RCT, meta-analysis, observational, preclinical, guideline
  citation text not null,
  grade text not null, -- High, Moderate, Low, Very Low
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_evidence_system_id on evidence_records(system_id);
create index if not exists idx_evidence_grade on evidence_records(grade);
create index if not exists idx_evidence_source_type on evidence_records(source_type);

-- MODULE DEPENDENCIES (GRAPH EDGES)
create table if not exists module_dependencies (
  id uuid primary key default gen_random_uuid(),
  from_module_id uuid not null references modules(id) on delete cascade,
  to_module_id uuid not null references modules(id) on delete cascade,
  dependency_type text default 'requires',
  created_at timestamptz default now(),
  unique(from_module_id, to_module_id, dependency_type)
);

create index if not exists idx_module_dep_from on module_dependencies(from_module_id);
create index if not exists idx_module_dep_to on module_dependencies(to_module_id);

-- CHAPTER <-> DECISION SUPPORT MAPPING
create table if not exists chapter_decision_support_map (
  chapter_id uuid references chapters(id) on delete cascade,
  decision_support_id uuid references decision_support_objects(id) on delete cascade,
  primary key (chapter_id, decision_support_id)
);

-- SUBCHAPTER <-> EVIDENCE MAPPING
create table if not exists subchapter_evidence_map (
  subchapter_id uuid references subchapters(id) on delete cascade,
  evidence_id uuid references evidence_records(id) on delete cascade,
  primary key (subchapter_id, evidence_id)
);

-- PERFORMANCE NOTES (stored as comments for API developers)
-- Query patterns:
-- 1. module -> chapters -> subchapters drilldown via indexed FK chains
-- 2. evidence lookup by system_id + grade filtering
-- 3. decision support retrieval by type + system_id
-- 4. dependency graph traversal via module_dependencies
