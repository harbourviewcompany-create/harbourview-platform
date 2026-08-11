-- Harbourview native transaction system: Stage 4 assertions, evidence lineage and diligence.

create type public.hv_assertion_status as enum (
  'unverified','supported','verified','conflicted','rejected','superseded','expired'
);
create type public.hv_assertion_value_type as enum (
  'text','numeric','boolean','date','timestamp','json','entity_ref'
);
create type public.hv_diligence_status as enum (
  'not_requested','requested','received','validating','passed','failed','waived','expired'
);
create type public.hv_diligence_requirement_type as enum (
  'licence','coa','invoice','purchase_order','rate_card','inventory','batch_record','testing_record','certificate','contract','corporate_record','insurance','banking','tax','procurement','authorization','identity','other'
);

create table public.assertions (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null,
  subject_id uuid not null,
  predicate text not null,
  value_type public.hv_assertion_value_type not null,
  value_text text,
  value_numeric numeric,
  value_boolean boolean,
  value_date date,
  value_timestamp timestamptz,
  value_json jsonb,
  value_entity_id uuid references public.entities(id) on delete set null,
  unit text,
  status public.hv_assertion_status not null default 'unverified',
  confidence_score numeric(5,2),
  source_authority_score numeric(5,2),
  evidence_quality_score numeric(5,2),
  freshness_score numeric(5,2),
  confidence_reason text,
  observed_at timestamptz,
  valid_from timestamptz,
  valid_to timestamptz,
  next_review_at timestamptz,
  decay_policy text,
  classification public.hv_classification not null default 'internal',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  supersedes_assertion_id uuid references public.assertions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assertions_subject_type_chk check (length(btrim(subject_type)) > 0),
  constraint assertions_predicate_chk check (length(btrim(predicate)) > 0),
  constraint assertions_value_count_chk check (
    num_nonnulls(value_text, value_numeric, value_boolean, value_date, value_timestamp, value_json, value_entity_id) = 1
  ),
  constraint assertions_value_type_chk check (
    (value_type = 'text' and value_text is not null) or
    (value_type = 'numeric' and value_numeric is not null) or
    (value_type = 'boolean' and value_boolean is not null) or
    (value_type = 'date' and value_date is not null) or
    (value_type = 'timestamp' and value_timestamp is not null) or
    (value_type = 'json' and value_json is not null) or
    (value_type = 'entity_ref' and value_entity_id is not null)
  ),
  constraint assertions_confidence_chk check (confidence_score is null or confidence_score between 0 and 100),
  constraint assertions_authority_chk check (source_authority_score is null or source_authority_score between 0 and 100),
  constraint assertions_evidence_quality_chk check (evidence_quality_score is null or evidence_quality_score between 0 and 100),
  constraint assertions_freshness_chk check (freshness_score is null or freshness_score between 0 and 100),
  constraint assertions_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint assertions_supersedes_chk check (supersedes_assertion_id is null or supersedes_assertion_id <> id)
);
create index assertions_subject_idx on public.assertions (subject_type, subject_id);
create index assertions_predicate_idx on public.assertions (predicate, status);
create index assertions_review_due_idx on public.assertions (next_review_at) where next_review_at is not null;
create index assertions_supersedes_idx on public.assertions (supersedes_assertion_id) where supersedes_assertion_id is not null;
create trigger assertions_set_updated_at
before update on public.assertions
for each row execute function public.hv_transaction_set_updated_at();

create table public.evidence_links (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.hv_evidence(id) on delete cascade,
  evidence_document_id uuid references public.hv_evidence_documents(id) on delete set null,
  subject_type text not null,
  subject_id uuid not null,
  link_type text not null,
  supports boolean not null default true,
  weight numeric(5,2),
  classification public.hv_classification not null default 'internal',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint evidence_links_weight_chk check (weight is null or weight between 0 and 100),
  constraint evidence_links_subject_chk check (length(btrim(subject_type)) > 0),
  constraint evidence_links_type_chk check (length(btrim(link_type)) > 0),
  unique (evidence_id, subject_type, subject_id, link_type)
);
create index evidence_links_subject_idx on public.evidence_links (subject_type, subject_id);
create index evidence_links_document_idx on public.evidence_links (evidence_document_id) where evidence_document_id is not null;

create table public.diligence_requirements (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  economic_account_id uuid references public.economic_accounts(id) on delete set null,
  party_id uuid references public.transaction_parties(id) on delete set null,
  requirement_type public.hv_diligence_requirement_type not null,
  name text not null,
  description text,
  required boolean not null default true,
  requested_date_from date,
  requested_date_to date,
  requested_fields jsonb not null default '[]'::jsonb,
  acceptable_substitutes jsonb not null default '[]'::jsonb,
  matching_keys jsonb not null default '[]'::jsonb,
  validation_rules jsonb not null default '[]'::jsonb,
  status public.hv_diligence_status not null default 'not_requested',
  due_at timestamptz,
  received_at timestamptz,
  validated_at timestamptz,
  validated_by uuid references auth.users(id) on delete set null,
  fulfilled_evidence_id uuid references public.hv_evidence(id) on delete set null,
  classification public.hv_classification not null default 'confidential',
  visibility_scope public.hv_visibility_scope not null default 'platform_only',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diligence_requested_period_chk check (
    requested_date_to is null or requested_date_from is null or requested_date_to >= requested_date_from
  ),
  constraint diligence_specific_party_chk check (
    visibility_scope <> 'specific_party' or party_id is not null
  ),
  constraint diligence_validation_status_chk check (
    status not in ('passed','failed') or validated_at is not null
  )
);
create index diligence_requirements_transaction_idx on public.diligence_requirements (transaction_id, status);
create index diligence_requirements_account_idx on public.diligence_requirements (economic_account_id) where economic_account_id is not null;
create index diligence_requirements_party_idx on public.diligence_requirements (party_id) where party_id is not null;
create index diligence_requirements_due_idx on public.diligence_requirements (due_at) where due_at is not null;
create unique index diligence_requirements_active_uidx
  on public.diligence_requirements (transaction_id, requirement_type, name)
  where status not in ('waived','expired');
create trigger diligence_requirements_set_updated_at
before update on public.diligence_requirements
for each row execute function public.hv_transaction_set_updated_at();

comment on table public.assertions is 'Evidence-backed typed claims about canonical subjects. Verification is independent from transaction probability.';
comment on table public.evidence_links is 'Generic lineage links that reuse hv_evidence/hv_evidence_documents instead of creating another evidence vault.';
comment on table public.diligence_requirements is 'Transaction-specific primary-evidence requests and validation contracts.';
