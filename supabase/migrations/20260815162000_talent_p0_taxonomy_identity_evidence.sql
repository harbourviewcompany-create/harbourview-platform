BEGIN;

-- Harbourview Talent P0 foundations: TAL-001..015, TAL-042, TAL-045, TAL-085.
-- Canonical identity is distinct from applications; source rows and merge events
-- are preserved so identity decisions are reversible and auditable.

CREATE TABLE IF NOT EXISTS public.talent_taxonomy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','reviewed','active','deprecated','superseded')),
  source_name text,
  source_version text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_taxonomy_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.talent_taxonomy_versions(id) ON DELETE RESTRICT,
  term_type text NOT NULL CHECK (term_type IN ('occupation','function','capability','credential','seniority','employment_type','workplace_type','sector','product','regulatory_activity','language','jurisdiction')),
  code text NOT NULL,
  label text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('proposed','reviewed','active','deprecated','superseded')),
  superseded_by uuid REFERENCES public.talent_taxonomy_terms(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(version_id, term_type, code)
);

CREATE TABLE IF NOT EXISTS public.talent_taxonomy_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id uuid NOT NULL REFERENCES public.talent_taxonomy_terms(id) ON DELETE CASCADE,
  locale text NOT NULL DEFAULT 'en',
  alias text NOT NULL,
  normalized_alias text GENERATED ALWAYS AS (lower(trim(alias))) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(term_id, locale, normalized_alias)
);

CREATE TABLE IF NOT EXISTS public.talent_taxonomy_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_term_id uuid NOT NULL REFERENCES public.talent_taxonomy_terms(id) ON DELETE CASCADE,
  to_term_id uuid NOT NULL REFERENCES public.talent_taxonomy_terms(id) ON DELETE CASCADE,
  relationship text NOT NULL CHECK (relationship IN ('parent','child','equivalent','related','requires')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(from_term_id, to_term_id, relationship),
  CHECK (from_term_id <> to_term_id)
);

CREATE TABLE IF NOT EXISTS public.talent_taxonomy_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system text NOT NULL,
  source_value text NOT NULL,
  term_id uuid NOT NULL REFERENCES public.talent_taxonomy_terms(id) ON DELETE RESTRICT,
  mapping_state text NOT NULL DEFAULT 'reviewed' CHECK (mapping_state IN ('proposed','reviewed','rejected')),
  confidence numeric(5,4),
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_system, source_value, term_id)
);

CREATE TABLE IF NOT EXISTS public.talent_taxonomy_change_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid REFERENCES public.talent_taxonomy_versions(id),
  term_id uuid REFERENCES public.talent_taxonomy_terms(id),
  action text NOT NULL,
  prior_state jsonb,
  new_state jsonb,
  reason text NOT NULL,
  actor_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text,
  canonical_state text NOT NULL DEFAULT 'unclaimed' CHECK (canonical_state IN ('observed','unclaimed','claim_requested','identity_verifying','claimed','disputed','withdrawn','suppressed')),
  legacy_hv_professional_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_person_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assurance_level text NOT NULL DEFAULT 'account_verified' CHECK (assurance_level IN ('account_verified','email_verified','identity_reviewed')),
  linked_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE(user_id),
  UNIQUE(person_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.talent_person_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE CASCADE,
  alias text NOT NULL,
  valid_from date,
  valid_to date,
  source_record_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_person_source_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid REFERENCES public.talent_people(id) ON DELETE SET NULL,
  source_system text NOT NULL,
  external_id text NOT NULL,
  source_url text,
  observed_name text,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_hash text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_system, external_id)
);

CREATE TABLE IF NOT EXISTS public.talent_person_identity_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  left_person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE CASCADE,
  right_person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE CASCADE,
  resolution_state text NOT NULL DEFAULT 'unresolved' CHECK (resolution_state IN ('confirmed_same','probable_same','unresolved','confirmed_distinct')),
  score numeric(5,4),
  basis jsonb NOT NULL DEFAULT '{}'::jsonb,
  algorithm_version text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (left_person_id <> right_person_id)
);

CREATE TABLE IF NOT EXISTS public.talent_person_merge_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE RESTRICT,
  source_person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE RESTRICT,
  before_snapshot jsonb NOT NULL,
  decision_basis jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id uuid REFERENCES auth.users(id),
  algorithm_version text,
  merged_at timestamptz NOT NULL DEFAULT now(),
  reversed_at timestamptz,
  reversed_by uuid REFERENCES auth.users(id),
  reversal_reason text,
  CHECK (target_person_id <> source_person_id)
);

CREATE TABLE IF NOT EXISTS public.talent_organization_source_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  source_system text NOT NULL,
  external_id text NOT NULL,
  observed_name text NOT NULL,
  domain text,
  source_url text,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_system, external_id)
);

CREATE TABLE IF NOT EXISTS public.talent_organization_identity_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_record_id uuid NOT NULL REFERENCES public.talent_organization_source_records(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  resolution_state text NOT NULL DEFAULT 'unresolved' CHECK (resolution_state IN ('confirmed_same','probable_same','unresolved','confirmed_distinct')),
  score numeric(5,4),
  basis jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_record_id, workspace_id)
);

CREATE TABLE IF NOT EXISTS public.talent_organization_link_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_record_id uuid NOT NULL REFERENCES public.talent_organization_source_records(id) ON DELETE RESTRICT,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('linked','unlinked','relinked','reversed')),
  before_state jsonb,
  after_state jsonb,
  reason text NOT NULL,
  actor_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_organization_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  to_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  relationship text NOT NULL CHECK (relationship IN ('parent','subsidiary','brand_of','affiliate','agency_for','operating_entity_of')),
  valid_from date,
  valid_to date,
  verification_state text NOT NULL DEFAULT 'source_observed',
  evidence_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(from_workspace_id, to_workspace_id, relationship),
  CHECK (from_workspace_id <> to_workspace_id)
);

CREATE TABLE IF NOT EXISTS public.talent_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  source_record_id uuid REFERENCES public.talent_organization_source_records(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  country_iso2 text,
  region_code text,
  locality text,
  status text NOT NULL DEFAULT 'observed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_assertions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type text NOT NULL,
  subject_id uuid NOT NULL,
  predicate text NOT NULL,
  value_json jsonb NOT NULL,
  claim_source text NOT NULL CHECK (claim_source IN ('candidate_claimed','employer_confirmed','authority_confirmed','harbourview_reviewed','source_observed','system_derived')),
  verification_state text NOT NULL DEFAULT 'unverified' CHECK (verification_state IN ('unverified','verified','unable_to_verify','conflicted','expired','superseded')),
  visibility_class text NOT NULL DEFAULT 'harbourview_private' CHECK (visibility_class IN ('public','discoverable','match_only','bilateral','application_specific','employer_private','harbourview_private')),
  taxonomy_version_id uuid REFERENCES public.talent_taxonomy_versions(id),
  valid_from timestamptz,
  valid_to timestamptz,
  observed_at timestamptz NOT NULL DEFAULT now(),
  confidence numeric(5,4),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_evidence_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_type text NOT NULL,
  source_name text,
  source_url text,
  storage_path text,
  content_hash text,
  captured_at timestamptz NOT NULL DEFAULT now(),
  visibility_class text NOT NULL DEFAULT 'harbourview_private',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_assertion_evidence (
  assertion_id uuid NOT NULL REFERENCES public.talent_assertions(id) ON DELETE CASCADE,
  evidence_id uuid NOT NULL REFERENCES public.talent_evidence_items(id) ON DELETE CASCADE,
  relationship text NOT NULL CHECK (relationship IN ('supports','contradicts','context')),
  PRIMARY KEY(assertion_id, evidence_id, relationship)
);

CREATE TABLE IF NOT EXISTS public.talent_assertion_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  left_assertion_id uuid NOT NULL REFERENCES public.talent_assertions(id) ON DELETE CASCADE,
  right_assertion_id uuid NOT NULL REFERENCES public.talent_assertions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','accepted_difference')),
  resolution text,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (left_assertion_id <> right_assertion_id)
);

CREATE TABLE IF NOT EXISTS public.talent_assertion_supersessions (
  prior_assertion_id uuid PRIMARY KEY REFERENCES public.talent_assertions(id) ON DELETE CASCADE,
  replacement_assertion_id uuid NOT NULL REFERENCES public.talent_assertions(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (prior_assertion_id <> replacement_assertion_id)
);

CREATE TABLE IF NOT EXISTS public.talent_verification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assertion_id uuid REFERENCES public.talent_assertions(id) ON DELETE SET NULL,
  verification_type text NOT NULL,
  result text NOT NULL,
  source_name text,
  source_url text,
  checked_at timestamptz NOT NULL DEFAULT now(),
  checked_by uuid REFERENCES auth.users(id),
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.talent_identity_assurance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE CASCADE,
  assurance_type text NOT NULL CHECK (assurance_type IN ('account_verified','email_verified','identity_reviewed','identity_disputed')),
  result text NOT NULL,
  evidence_id uuid REFERENCES public.talent_evidence_items(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  actor_user_id uuid REFERENCES auth.users(id),
  actor_workspace_id uuid REFERENCES public.workspaces(id),
  subject_type text,
  subject_id uuid,
  request_id text,
  reason_code text,
  prior_state jsonb,
  new_state jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.talent_audit_immutable_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'talent_audit_events is append-only';
END;
$$;

DROP TRIGGER IF EXISTS talent_audit_immutable ON public.talent_audit_events;
CREATE TRIGGER talent_audit_immutable
  BEFORE UPDATE OR DELETE ON public.talent_audit_events
  FOR EACH ROW EXECUTE FUNCTION public.talent_audit_immutable_guard();

CREATE INDEX IF NOT EXISTS idx_talent_taxonomy_terms_type_label ON public.talent_taxonomy_terms(term_type, label);
CREATE INDEX IF NOT EXISTS idx_talent_person_sources_person ON public.talent_person_source_records(person_id);
CREATE INDEX IF NOT EXISTS idx_talent_assertions_subject ON public.talent_assertions(subject_type, subject_id, predicate);
CREATE INDEX IF NOT EXISTS idx_talent_assertions_visibility ON public.talent_assertions(visibility_class, verification_state);
CREATE INDEX IF NOT EXISTS idx_talent_audit_subject ON public.talent_audit_events(subject_type, subject_id, created_at DESC);

-- Private-by-default base tables. Browser consumers use explicit api.* views/RPCs.
DO $talent_private_base$
DECLARE
  table_name text;
  private_tables constant text[] := ARRAY[
    'talent_taxonomy_versions','talent_taxonomy_terms','talent_taxonomy_aliases','talent_taxonomy_edges','talent_taxonomy_mappings','talent_taxonomy_change_events',
    'talent_people','talent_person_accounts','talent_person_aliases','talent_person_source_records','talent_person_identity_candidates','talent_person_merge_events',
    'talent_organization_source_records','talent_organization_identity_candidates','talent_organization_link_events','talent_organization_relationships','talent_facilities',
    'talent_assertions','talent_evidence_items','talent_assertion_evidence','talent_assertion_conflicts','talent_assertion_supersessions','talent_verification_events','talent_identity_assurance_events','talent_audit_events'
  ];
BEGIN
  FOREACH table_name IN ARRAY private_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM public, anon, authenticated', table_name);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', table_name);
  END LOOP;
END
$talent_private_base$;

COMMIT;
