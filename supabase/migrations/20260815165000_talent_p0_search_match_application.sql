BEGIN;

-- Harbourview Talent P0: TAL-038, TAL-059..078, TAL-088, TAL-093.

CREATE TABLE IF NOT EXISTS public.talent_job_search_documents (
  job_id uuid PRIMARY KEY REFERENCES public.talent_job_opportunities(id) ON DELETE CASCADE,
  projection_version text NOT NULL,
  taxonomy_version_id uuid REFERENCES public.talent_taxonomy_versions(id),
  search_text text NOT NULL,
  filter_document jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_hash text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_talent_job_search_fts ON public.talent_job_search_documents USING gin (to_tsvector('simple', search_text));

CREATE TABLE IF NOT EXISTS public.talent_person_search_documents (
  person_id uuid PRIMARY KEY REFERENCES public.talent_people(id) ON DELETE CASCADE,
  projection_version text NOT NULL,
  taxonomy_version_id uuid REFERENCES public.talent_taxonomy_versions(id),
  disclosure_level integer NOT NULL DEFAULT 0 CHECK (disclosure_level BETWEEN 0 AND 5),
  search_text text NOT NULL,
  filter_document jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_hash text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_talent_person_search_fts ON public.talent_person_search_documents USING gin (to_tsvector('simple', search_text));

-- Embedding payloads are deliberately not exposed directly. P0 records the
-- authorized projection/model/hash contract; vector materialization may be
-- added only behind the same pre-retrieval authorization boundary.
CREATE TABLE IF NOT EXISTS public.talent_search_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('job','person')),
  entity_id uuid NOT NULL,
  projection_version text NOT NULL,
  model_key text NOT NULL,
  content_hash text NOT NULL,
  storage_ref text,
  authorization_scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id, projection_version, model_key)
);

CREATE TABLE IF NOT EXISTS public.talent_search_projection_state (
  entity_type text NOT NULL CHECK (entity_type IN ('job','person')),
  entity_id uuid NOT NULL,
  source_version text NOT NULL,
  projection_version text,
  state text NOT NULL CHECK (state IN ('current','pending','stale','failed','suppressed')),
  invalidated_at timestamptz,
  projected_at timestamptz,
  error_code text,
  PRIMARY KEY(entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS public.talent_saved_jobs (
  person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.talent_job_opportunities(id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(person_id, job_id)
);

CREATE TABLE IF NOT EXISTS public.talent_saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid REFERENCES public.talent_people(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  search_type text NOT NULL CHECK (search_type IN ('jobs','people')),
  name text,
  query_text text,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  query_version text NOT NULL DEFAULT 'v1',
  alerts_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((person_id IS NOT NULL) <> (workspace_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS public.talent_match_policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_key text NOT NULL,
  version_number integer NOT NULL CHECK (version_number > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','retired')),
  factor_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(policy_key, version_number)
);

CREATE TABLE IF NOT EXISTS public.talent_match_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_version_id uuid NOT NULL REFERENCES public.talent_match_policy_versions(id) ON DELETE RESTRICT,
  job_id uuid NOT NULL REFERENCES public.talent_job_opportunities(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE CASCADE,
  job_requirement_version_id uuid REFERENCES public.talent_job_requirement_versions(id) ON DELETE SET NULL,
  taxonomy_version_id uuid REFERENCES public.talent_taxonomy_versions(id) ON DELETE SET NULL,
  passport_snapshot_hash text NOT NULL,
  credential_snapshot_hash text,
  input_snapshot jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL UNIQUE REFERENCES public.talent_match_runs(id) ON DELETE CASCADE,
  eligibility_state text NOT NULL CHECK (eligibility_state IN ('satisfied','not_satisfied','unresolved','not_applicable')),
  score numeric(7,4),
  explanation_summary text,
  stale_at timestamptz,
  invalidation_reason text
);

CREATE TABLE IF NOT EXISTS public.talent_match_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.talent_matches(id) ON DELETE CASCADE,
  factor_key text NOT NULL,
  factor_class text NOT NULL CHECK (factor_class IN ('hard_eligibility','required_capability','preferred_capability','preference','context')),
  result_state text NOT NULL CHECK (result_state IN ('satisfied','not_satisfied','unresolved','not_applicable')),
  weight numeric(7,4),
  contribution numeric(7,4),
  reason text NOT NULL,
  input_value jsonb
);

CREATE TABLE IF NOT EXISTS public.talent_match_factor_evidence (
  factor_id uuid NOT NULL REFERENCES public.talent_match_factors(id) ON DELETE CASCADE,
  assertion_id uuid REFERENCES public.talent_assertions(id) ON DELETE SET NULL,
  evidence_id uuid REFERENCES public.talent_evidence_items(id) ON DELETE SET NULL,
  PRIMARY KEY(factor_id, assertion_id, evidence_id)
);

CREATE TABLE IF NOT EXISTS public.talent_match_invalidations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.talent_matches(id) ON DELETE CASCADE,
  trigger_type text NOT NULL CHECK (trigger_type IN ('job','requirements','passport','credential','taxonomy','privacy','rule','policy')),
  trigger_id uuid,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_eligibility_rule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL,
  version_number integer NOT NULL CHECK (version_number > 0),
  rule_type text NOT NULL,
  rule_document jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','retired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(rule_key, version_number)
);

CREATE TABLE IF NOT EXISTS public.talent_eligibility_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_run_id uuid NOT NULL REFERENCES public.talent_match_runs(id) ON DELETE CASCADE,
  overall_state text NOT NULL CHECK (overall_state IN ('satisfied','not_satisfied','unresolved','not_applicable')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_eligibility_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.talent_eligibility_assessments(id) ON DELETE CASCADE,
  rule_version_id uuid REFERENCES public.talent_eligibility_rule_versions(id) ON DELETE SET NULL,
  requirement_id uuid REFERENCES public.talent_job_requirements(id) ON DELETE SET NULL,
  state text NOT NULL CHECK (state IN ('satisfied','not_satisfied','unresolved','not_applicable')),
  reason text NOT NULL,
  evidence_summary jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.talent_question_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_question_set_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_set_id uuid NOT NULL REFERENCES public.talent_question_sets(id) ON DELETE CASCADE,
  version_number integer NOT NULL CHECK (version_number > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','retired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(question_set_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.talent_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.talent_question_set_versions(id) ON DELETE CASCADE,
  question_key text NOT NULL,
  prompt text NOT NULL,
  answer_type text NOT NULL CHECK (answer_type IN ('boolean','single_select','multi_select','short_text','long_text','numeric','date','credential_reference')),
  options jsonb,
  privacy_class text NOT NULL DEFAULT 'application_specific',
  requirement_id uuid REFERENCES public.talent_job_requirements(id) ON DELETE SET NULL,
  knockout boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE(version_id, question_key)
);

CREATE TABLE IF NOT EXISTS public.talent_job_question_bindings (
  job_id uuid NOT NULL REFERENCES public.talent_job_opportunities(id) ON DELETE CASCADE,
  question_set_version_id uuid NOT NULL REFERENCES public.talent_question_set_versions(id) ON DELETE RESTRICT,
  PRIMARY KEY(job_id, question_set_version_id)
);

CREATE TABLE IF NOT EXISTS public.talent_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_candidate_id uuid UNIQUE,
  job_id uuid NOT NULL REFERENCES public.talent_job_opportunities(id) ON DELETE RESTRICT,
  person_id uuid REFERENCES public.talent_people(id) ON DELETE SET NULL,
  applicant_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  applicant_name_snapshot text NOT NULL,
  applicant_email_snapshot text NOT NULL,
  applicant_phone_snapshot text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft','submitted','screening','interview','offer','hired','rejected','withdrawn','closed')),
  source text NOT NULL DEFAULT 'harbourview_direct',
  idempotency_key text NOT NULL,
  legacy_resume_url text,
  cover_note text,
  consent_policy_version text,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_talent_applications_job_status ON public.talent_applications(job_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_talent_applications_person ON public.talent_applications(person_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.talent_application_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.talent_applications(id) ON DELETE CASCADE,
  prior_status text,
  new_status text NOT NULL,
  reason_code text,
  actor_user_id uuid REFERENCES auth.users(id),
  source text NOT NULL DEFAULT 'harbourview',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.talent_legal_holds
  DROP CONSTRAINT IF EXISTS talent_legal_holds_application_id_fkey;
ALTER TABLE public.talent_legal_holds
  ADD CONSTRAINT talent_legal_holds_application_id_fkey
  FOREIGN KEY (application_id) REFERENCES public.talent_applications(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.talent_application_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.talent_applications(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.talent_questions(id) ON DELETE RESTRICT,
  answer_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(application_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.talent_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid REFERENCES public.talent_people(id) ON DELETE SET NULL,
  application_id uuid REFERENCES public.talent_applications(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('resume','credential','application_attachment','other')),
  storage_bucket text NOT NULL DEFAULT 'talent-private',
  storage_path text NOT NULL UNIQUE,
  file_name text NOT NULL,
  content_type text,
  size_bytes bigint,
  content_hash text,
  privacy_class text NOT NULL DEFAULT 'application_specific',
  retention_class text NOT NULL DEFAULT 'talent_application_document',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (person_id IS NOT NULL OR application_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.talent_document_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.talent_documents(id) ON DELETE CASCADE,
  grantee_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  grantee_workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  purpose text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (grantee_user_id IS NOT NULL OR grantee_workspace_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.talent_document_access_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.talent_documents(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id),
  actor_workspace_id uuid REFERENCES public.workspaces(id),
  action text NOT NULL CHECK (action IN ('view','download','upload','delete','denied')),
  request_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $talent_search_app_private$
DECLARE
  table_name text;
  tables constant text[] := ARRAY[
    'talent_job_search_documents','talent_person_search_documents','talent_search_embeddings','talent_search_projection_state','talent_saved_jobs','talent_saved_searches','talent_match_policy_versions','talent_match_runs','talent_matches','talent_match_factors','talent_match_factor_evidence','talent_match_invalidations','talent_eligibility_rule_versions','talent_eligibility_assessments','talent_eligibility_factors','talent_question_sets','talent_question_set_versions','talent_questions','talent_job_question_bindings','talent_applications','talent_application_status_events','talent_application_answers','talent_documents','talent_document_access_grants','talent_document_access_events'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM public, anon, authenticated', table_name);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', table_name);
  END LOOP;
END
$talent_search_app_private$;

COMMIT;
