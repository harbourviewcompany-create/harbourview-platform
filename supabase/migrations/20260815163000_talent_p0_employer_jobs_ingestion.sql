BEGIN;

-- Harbourview Talent P0: TAL-016..038.
-- Employer authority extends canonical workspaces/workspace_members; it does not
-- add a competing organization identity or mutate global membership role values.

CREATE TABLE IF NOT EXISTS public.talent_employer_profiles (
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  talent_status text NOT NULL DEFAULT 'inactive' CHECK (talent_status IN ('inactive','active','suspended')),
  public_hiring_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_employer_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  verification_type text NOT NULL CHECK (verification_type IN ('organization','direct_employer','hiring_authority','vacancy','source')),
  status text NOT NULL CHECK (status IN ('pending','verified','rejected','expired','revoked','unable_to_verify')),
  evidence_id uuid REFERENCES public.talent_evidence_items(id) ON DELETE SET NULL,
  effective_from timestamptz,
  expires_at timestamptz,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_employer_domain_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  domain text NOT NULL,
  verification_method text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','failed','expired','revoked')),
  verified_at timestamptz,
  expires_at timestamptz,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(workspace_id, domain)
);

CREATE TABLE IF NOT EXISTS public.talent_hiring_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  talent_role text NOT NULL CHECK (talent_role IN ('talent_admin','recruiter','hiring_manager','interviewer','talent_viewer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','revoked')),
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.talent_recruiter_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  recruiter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  authorization_type text NOT NULL CHECK (authorization_type IN ('direct_employee','retained_recruiter','contingency_recruiter','staffing_agency','harbourview_operator')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','expired','revoked','rejected')),
  evidence_id uuid REFERENCES public.talent_evidence_items(id) ON DELETE SET NULL,
  effective_from timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_agency_engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  employer_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','expired','revoked','rejected')),
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence_id uuid REFERENCES public.talent_evidence_items(id) ON DELETE SET NULL,
  effective_from timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (agency_workspace_id <> employer_workspace_id)
);

CREATE TABLE IF NOT EXISTS public.talent_entitlement_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  capability_key text NOT NULL CHECK (capability_key IN (
    'talent.jobs.search','talent.jobs.save','talent.jobs.apply','talent.passport.manage','talent.people.search','talent.people.identity_reveal','talent.people.contact','talent.jobs.post','talent.requisitions.manage','talent.hiring.manage','talent.analytics.read','talent.export','talent.api.access'
  )),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
  source text NOT NULL DEFAULT 'role_mapping',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_requisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  internal_reference text,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','recruiting','paused','filled','closed','cancelled')),
  openings_total integer NOT NULL DEFAULT 1 CHECK (openings_total > 0),
  openings_filled integer NOT NULL DEFAULT 0 CHECK (openings_filled >= 0),
  owner_user_id uuid REFERENCES auth.users(id),
  opened_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (openings_filled <= openings_total)
);

CREATE TABLE IF NOT EXISTS public.talent_requisition_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id uuid NOT NULL REFERENCES public.talent_requisitions(id) ON DELETE CASCADE,
  version_number integer NOT NULL CHECK (version_number > 0),
  snapshot jsonb NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(requisition_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.talent_requisition_members (
  requisition_id uuid NOT NULL REFERENCES public.talent_requisitions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_role text NOT NULL CHECK (assignment_role IN ('recruiter','hiring_manager','interviewer','viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(requisition_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.talent_job_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_talent_job_id uuid UNIQUE,
  requisition_id uuid REFERENCES public.talent_requisitions(id) ON DELETE SET NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  employer_source_record_id uuid REFERENCES public.talent_organization_source_records(id) ON DELETE SET NULL,
  employer_display_name text,
  canonical_slug text UNIQUE,
  title text NOT NULL,
  occupation_term_id uuid REFERENCES public.talent_taxonomy_terms(id) ON DELETE SET NULL,
  function_term_id uuid REFERENCES public.talent_taxonomy_terms(id) ON DELETE SET NULL,
  seniority_term_id uuid REFERENCES public.talent_taxonomy_terms(id) ON DELETE SET NULL,
  department text,
  description text,
  employment_type text,
  workplace_type text CHECK (workplace_type IS NULL OR workplace_type IN ('remote','hybrid','on_site','flexible','unknown')),
  country_iso2 text,
  region_code text,
  locality text,
  location_text text,
  content_language text NOT NULL DEFAULT 'en',
  application_method text NOT NULL DEFAULT 'harbourview_direct' CHECK (application_method IN ('harbourview_direct','external','agency','contact_employer')),
  application_url text,
  lifecycle_status text NOT NULL DEFAULT 'open' CHECK (lifecycle_status IN ('open','on_hold','closed','expired')),
  publication_state text NOT NULL DEFAULT 'published' CHECK (publication_state IN ('draft','validation','publishable','published','paused','archived')),
  source_class text NOT NULL DEFAULT 'direct_harbourview' CHECK (source_class IN ('direct_harbourview','external')),
  freshness_state text NOT NULL DEFAULT 'confirmed' CHECK (freshness_state IN ('confirmed','recent','stale','source_unavailable','removed','closed','conflicted','unknown')),
  openings_total integer NOT NULL DEFAULT 1 CHECK (openings_total > 0),
  openings_filled integer NOT NULL DEFAULT 0 CHECK (openings_filled >= 0),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_confirmed_at timestamptz,
  published_at timestamptz,
  expires_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (openings_filled <= openings_total)
);

CREATE TABLE IF NOT EXISTS public.talent_job_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.talent_job_opportunities(id) ON DELETE CASCADE,
  version_number integer NOT NULL CHECK (version_number > 0),
  content_hash text,
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.talent_job_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.talent_job_opportunities(id) ON DELETE CASCADE,
  country_iso2 text,
  region_code text,
  locality text,
  workplace_type text CHECK (workplace_type IS NULL OR workplace_type IN ('remote','hybrid','on_site','flexible','unknown')),
  remote_scope text,
  timezone text,
  is_primary boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.talent_job_compensation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.talent_job_opportunities(id) ON DELETE CASCADE,
  currency text,
  minimum_amount numeric,
  maximum_amount numeric,
  period text CHECK (period IS NULL OR period IN ('hour','day','week','month','year','project')),
  bonus_text text,
  commission_text text,
  equity_text text,
  disclosure_type text NOT NULL DEFAULT 'source_disclosed' CHECK (disclosure_type IN ('employer_disclosed','source_disclosed','estimated')),
  original_text text,
  UNIQUE(job_id)
);

CREATE TABLE IF NOT EXISTS public.talent_job_requirement_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.talent_job_opportunities(id) ON DELETE CASCADE,
  version_number integer NOT NULL CHECK (version_number > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(job_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.talent_job_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_version_id uuid NOT NULL REFERENCES public.talent_job_requirement_versions(id) ON DELETE CASCADE,
  requirement_type text NOT NULL CHECK (requirement_type IN ('capability','credential','language','jurisdiction_experience','work_authorization','experience_years','location','other')),
  taxonomy_term_id uuid REFERENCES public.talent_taxonomy_terms(id) ON DELETE SET NULL,
  requirement_text text NOT NULL,
  importance text NOT NULL DEFAULT 'required' CHECK (importance IN ('required','preferred')),
  hard_gate boolean NOT NULL DEFAULT false,
  structured_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.talent_job_change_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.talent_job_opportunities(id) ON DELETE CASCADE,
  change_type text NOT NULL CHECK (change_type IN ('title','compensation','location','requirements','status','employer_correction','description','application_method','other')),
  prior_version_id uuid REFERENCES public.talent_job_versions(id),
  new_version_id uuid REFERENCES public.talent_job_versions(id),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_ingestion_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  source_class text NOT NULL CHECK (source_class IN ('direct_employer','ats','job_board','career_site','manual','legacy')),
  acquisition_method text,
  expected_refresh_minutes integer,
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive','active','suspended','disabled')),
  last_success_at timestamptz,
  last_failure_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_source_rights (
  source_id uuid PRIMARY KEY REFERENCES public.talent_ingestion_sources(id) ON DELETE CASCADE,
  storage_allowed boolean NOT NULL DEFAULT false,
  redistribution_allowed boolean NOT NULL DEFAULT false,
  derived_search_allowed boolean NOT NULL DEFAULT false,
  public_display_allowed boolean NOT NULL DEFAULT false,
  commercial_use_allowed boolean NOT NULL DEFAULT false,
  terms_reference text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.talent_ingestion_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.talent_ingestion_sources(id) ON DELETE CASCADE,
  run_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','succeeded','partial','failed','rate_limited','cancelled')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  records_seen integer NOT NULL DEFAULT 0,
  records_accepted integer NOT NULL DEFAULT 0,
  records_rejected integer NOT NULL DEFAULT 0,
  records_changed integer NOT NULL DEFAULT 0,
  error_summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.talent_job_source_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.talent_job_opportunities(id) ON DELETE SET NULL,
  source_id uuid NOT NULL REFERENCES public.talent_ingestion_sources(id) ON DELETE RESTRICT,
  external_id text NOT NULL,
  source_url text,
  canonical_url text,
  observed_title text NOT NULL,
  observed_employer text,
  observed_location text,
  source_status text NOT NULL DEFAULT 'observed' CHECK (source_status IN ('observed','confirmed','stale','removed','closed','conflicted','unknown')),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_id, external_id)
);

CREATE TABLE IF NOT EXISTS public.talent_job_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_record_id uuid NOT NULL REFERENCES public.talent_job_source_records(id) ON DELETE CASCADE,
  content_hash text NOT NULL,
  source_payload jsonb NOT NULL,
  observed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_record_id, content_hash)
);

CREATE TABLE IF NOT EXISTS public.talent_job_source_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_record_id uuid NOT NULL REFERENCES public.talent_job_source_records(id) ON DELETE CASCADE,
  run_id uuid REFERENCES public.talent_ingestion_runs(id) ON DELETE SET NULL,
  state text NOT NULL CHECK (state IN ('confirmed','recent','stale','source_unavailable','removed','closed','conflicted','unknown')),
  observed_at timestamptz NOT NULL DEFAULT now(),
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.talent_job_identity_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_record_id uuid NOT NULL REFERENCES public.talent_job_source_records(id) ON DELETE CASCADE,
  candidate_job_id uuid NOT NULL REFERENCES public.talent_job_opportunities(id) ON DELETE CASCADE,
  resolution_state text NOT NULL DEFAULT 'unresolved' CHECK (resolution_state IN ('confirmed_same','probable_same','unresolved','confirmed_distinct')),
  score numeric(5,4),
  basis jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_record_id, candidate_job_id)
);

CREATE TABLE IF NOT EXISTS public.talent_job_identity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_record_id uuid NOT NULL REFERENCES public.talent_job_source_records(id) ON DELETE RESTRICT,
  prior_job_id uuid REFERENCES public.talent_job_opportunities(id) ON DELETE SET NULL,
  new_job_id uuid REFERENCES public.talent_job_opportunities(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('linked','unlinked','relinked','reversed')),
  basis jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_job_freshness_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.talent_job_opportunities(id) ON DELETE CASCADE,
  prior_state text,
  new_state text NOT NULL,
  source_record_id uuid REFERENCES public.talent_job_source_records(id) ON DELETE SET NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_talent_jobs_publishable ON public.talent_job_opportunities(publication_state, lifecycle_status, freshness_state, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_talent_jobs_location ON public.talent_job_opportunities(country_iso2, region_code, locality);
CREATE INDEX IF NOT EXISTS idx_talent_jobs_workspace ON public.talent_job_opportunities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_talent_job_sources_job ON public.talent_job_source_records(job_id);
CREATE INDEX IF NOT EXISTS idx_talent_hiring_team_actor ON public.talent_hiring_team_members(user_id, workspace_id, status);

DO $talent_employer_job_private$
DECLARE
  table_name text;
  tables constant text[] := ARRAY[
    'talent_employer_profiles','talent_employer_verifications','talent_employer_domain_verifications','talent_hiring_team_members','talent_recruiter_authorizations','talent_agency_engagements','talent_entitlement_grants','talent_requisitions','talent_requisition_versions','talent_requisition_members','talent_job_opportunities','talent_job_versions','talent_job_locations','talent_job_compensation','talent_job_requirement_versions','talent_job_requirements','talent_job_change_events','talent_ingestion_sources','talent_source_rights','talent_ingestion_runs','talent_job_source_records','talent_job_snapshots','talent_job_source_observations','talent_job_identity_candidates','talent_job_identity_events','talent_job_freshness_events'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM public, anon, authenticated', table_name);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', table_name);
  END LOOP;
END
$talent_employer_job_private$;

COMMIT;
