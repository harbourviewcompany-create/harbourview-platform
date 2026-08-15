BEGIN;

-- Harbourview Talent P0: TAL-039..058 plus P0 trust/lifecycle foundations.

CREATE TABLE IF NOT EXISTS public.talent_professional_profiles (
  person_id uuid PRIMARY KEY REFERENCES public.talent_people(id) ON DELETE CASCADE,
  legacy_hv_professional_id uuid UNIQUE,
  profile_slug text UNIQUE,
  headline text,
  summary text,
  primary_function_term_id uuid REFERENCES public.talent_taxonomy_terms(id) ON DELETE SET NULL,
  seniority_term_id uuid REFERENCES public.talent_taxonomy_terms(id) ON DELETE SET NULL,
  country_iso2 text,
  region_code text,
  locality text,
  profile_status text NOT NULL DEFAULT 'active' CHECK (profile_status IN ('active','inactive','suppressed','disputed')),
  legacy_specialties text[] NOT NULL DEFAULT '{}',
  legacy_credential_type text,
  legacy_institution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_professional_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  organization_source_record_id uuid REFERENCES public.talent_organization_source_records(id) ON DELETE SET NULL,
  facility_id uuid REFERENCES public.talent_facilities(id) ON DELETE SET NULL,
  title text NOT NULL,
  function_term_id uuid REFERENCES public.talent_taxonomy_terms(id) ON DELETE SET NULL,
  employment_type text,
  started_on date,
  ended_on date,
  is_current boolean NOT NULL DEFAULT false,
  verification_state text NOT NULL DEFAULT 'candidate_claimed',
  assertion_id uuid REFERENCES public.talent_assertions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ended_on IS NULL OR started_on IS NULL OR ended_on >= started_on)
);

CREATE TABLE IF NOT EXISTS public.talent_professional_experience_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.talent_professional_experiences(id) ON DELETE CASCADE,
  context_type text NOT NULL CHECK (context_type IN ('jurisdiction','facility','product','market','regulatory_activity','sector')),
  taxonomy_term_id uuid REFERENCES public.talent_taxonomy_terms(id) ON DELETE SET NULL,
  value_text text,
  assertion_id uuid REFERENCES public.talent_assertions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.talent_professional_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE CASCADE,
  capability_term_id uuid REFERENCES public.talent_taxonomy_terms(id) ON DELETE SET NULL,
  capability_label text NOT NULL,
  verification_state text NOT NULL DEFAULT 'candidate_claimed',
  valid_from date,
  valid_to date,
  assertion_id uuid REFERENCES public.talent_assertions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_credential_authorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  country_iso2 text,
  region_code text,
  website_url text,
  registry_url text,
  aliases text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','superseded')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_professional_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE CASCADE,
  credential_term_id uuid REFERENCES public.talent_taxonomy_terms(id) ON DELETE SET NULL,
  credential_label text NOT NULL,
  authority_id uuid REFERENCES public.talent_credential_authorities(id) ON DELETE SET NULL,
  jurisdiction_country_iso2 text,
  jurisdiction_region_code text,
  registration_identifier text,
  scope_text text,
  conditions_text text,
  issued_on date,
  effective_from date,
  expires_on date,
  renewal_on date,
  lifecycle_status text NOT NULL DEFAULT 'claimed' CHECK (lifecycle_status IN ('claimed','pending_verification','active_verified','restricted','expired','suspended','revoked','not_found','unable_to_verify','conflicted')),
  last_checked_at timestamptz,
  assertion_id uuid REFERENCES public.talent_assertions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_credential_verification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id uuid NOT NULL REFERENCES public.talent_professional_credentials(id) ON DELETE CASCADE,
  adapter_key text,
  result text NOT NULL CHECK (result IN ('current','restricted','expired','suspended','revoked','not_found','source_unavailable','ambiguous','unable_to_verify')),
  checked_at timestamptz NOT NULL DEFAULT now(),
  source_url text,
  response_hash text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.talent_professional_jurisdictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE CASCADE,
  country_iso2 text NOT NULL,
  region_code text,
  experience_type text NOT NULL DEFAULT 'worked_in',
  started_on date,
  ended_on date,
  verification_state text NOT NULL DEFAULT 'candidate_claimed',
  assertion_id uuid REFERENCES public.talent_assertions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.talent_professional_languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE CASCADE,
  language_code text,
  language_label text NOT NULL,
  proficiency text CHECK (proficiency IS NULL OR proficiency IN ('basic','working','professional','fluent','native','unknown')),
  verification_state text NOT NULL DEFAULT 'candidate_claimed',
  assertion_id uuid REFERENCES public.talent_assertions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.talent_professional_preferences (
  person_id uuid PRIMARY KEY REFERENCES public.talent_people(id) ON DELETE CASCADE,
  target_functions uuid[] NOT NULL DEFAULT '{}',
  target_seniority uuid[] NOT NULL DEFAULT '{}',
  target_countries text[] NOT NULL DEFAULT '{}',
  compensation_currency text,
  compensation_min numeric,
  compensation_period text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_professional_availability (
  person_id uuid PRIMARY KEY REFERENCES public.talent_people(id) ON DELETE CASCADE,
  availability_state text NOT NULL DEFAULT 'undisclosed' CHECK (availability_state IN ('actively_looking','open_to_opportunities','contract_only','consulting_only','advisory_only','available_from_date','not_available','undisclosed')),
  available_from date,
  last_confirmed_at timestamptz,
  visible_to_employers boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_work_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE CASCADE,
  country_iso2 text NOT NULL,
  region_code text,
  authorization_type text NOT NULL,
  sponsorship_required boolean,
  valid_from date,
  valid_to date,
  verification_state text NOT NULL DEFAULT 'candidate_claimed',
  assertion_id uuid REFERENCES public.talent_assertions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_mobility_preferences (
  person_id uuid PRIMARY KEY REFERENCES public.talent_people(id) ON DELETE CASCADE,
  remote_allowed boolean,
  hybrid_allowed boolean,
  on_site_allowed boolean,
  relocation_willing boolean,
  travel_percent_max integer CHECK (travel_percent_max IS NULL OR (travel_percent_max >= 0 AND travel_percent_max <= 100)),
  included_countries text[] NOT NULL DEFAULT '{}',
  excluded_countries text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_contact_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE CASCADE,
  contact_type text NOT NULL CHECK (contact_type IN ('email','phone','website','other')),
  value text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  verification_state text NOT NULL DEFAULT 'unverified',
  visibility_class text NOT NULL DEFAULT 'bilateral',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(person_id, contact_type, value)
);

CREATE TABLE IF NOT EXISTS public.talent_profile_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE CASCADE,
  claimant_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','identity_verifying','accepted','rejected','withdrawn','disputed')),
  evidence_id uuid REFERENCES public.talent_evidence_items(id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  UNIQUE(person_id, claimant_user_id)
);

CREATE TABLE IF NOT EXISTS public.talent_profile_visibility (
  person_id uuid PRIMARY KEY REFERENCES public.talent_people(id) ON DELETE CASCADE,
  visibility_mode text NOT NULL DEFAULT 'private' CHECK (visibility_mode IN ('private','anonymous_discoverable','verified_employers','public')),
  identity_disclosure_level integer NOT NULL DEFAULT 0 CHECK (identity_disclosure_level BETWEEN 0 AND 5),
  search_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_disclosure_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  requisition_id uuid REFERENCES public.talent_requisitions(id) ON DELETE CASCADE,
  disclosure_level integer NOT NULL CHECK (disclosure_level BETWEEN 0 AND 5),
  purpose text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.talent_employer_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  include_verified_affiliates boolean NOT NULL DEFAULT false,
  reason_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(person_id, workspace_id)
);

CREATE TABLE IF NOT EXISTS public.talent_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('talent_discoverability','employer_contact','application_processing','matching','alert_delivery')),
  policy_version text NOT NULL,
  status text NOT NULL CHECK (status IN ('granted','revoked')),
  granted_at timestamptz,
  revoked_at timestamptz,
  source text NOT NULL DEFAULT 'user_action',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(person_id, purpose, policy_version)
);

CREATE TABLE IF NOT EXISTS public.talent_consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id uuid NOT NULL REFERENCES public.talent_consents(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('granted','revoked','superseded')),
  actor_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_data_subject_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.talent_people(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN ('access','export','correction','suppression','erasure','processing_restriction')),
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','identity_check','in_progress','completed','rejected','cancelled')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  handled_by uuid REFERENCES auth.users(id),
  notes text
);

CREATE TABLE IF NOT EXISTS public.talent_legal_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid REFERENCES public.talent_people(id) ON DELETE SET NULL,
  application_id uuid,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','released')),
  placed_by uuid REFERENCES auth.users(id),
  placed_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  released_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.talent_data_residency_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_class text NOT NULL UNIQUE,
  sensitivity text NOT NULL CHECK (sensitivity IN ('public','internal','restricted','highly_restricted')),
  permitted_regions text[] NOT NULL DEFAULT '{}',
  processing_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_abuse_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid REFERENCES auth.users(id),
  subject_type text NOT NULL,
  subject_id uuid,
  category text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','triaged','investigating','resolved','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_moderation_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.talent_abuse_reports(id) ON DELETE SET NULL,
  subject_type text NOT NULL,
  subject_id uuid,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','closed')),
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.talent_moderation_cases(id) ON DELETE CASCADE,
  action text NOT NULL,
  reason_code text NOT NULL,
  prior_state jsonb,
  new_state jsonb,
  actor_user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_class text NOT NULL UNIQUE,
  retention_days integer CHECK (retention_days IS NULL OR retention_days > 0),
  disposition text NOT NULL CHECK (disposition IN ('delete','anonymize','archive','manual_review')),
  policy_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_retention_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_class text NOT NULL,
  subject_type text NOT NULL,
  subject_id uuid,
  action text NOT NULL,
  legal_hold_checked boolean NOT NULL DEFAULT false,
  result text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_notification_preferences (
  person_id uuid PRIMARY KEY REFERENCES public.talent_people(id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT true,
  in_app_enabled boolean NOT NULL DEFAULT true,
  categories jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid REFERENCES public.talent_people(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','suppressed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.talent_notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.talent_notifications(id) ON DELETE CASCADE,
  channel text NOT NULL,
  status text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  error_code text
);

CREATE INDEX IF NOT EXISTS idx_talent_profile_location ON public.talent_professional_profiles(country_iso2, region_code);
CREATE INDEX IF NOT EXISTS idx_talent_capabilities_person ON public.talent_professional_capabilities(person_id, capability_label);
CREATE INDEX IF NOT EXISTS idx_talent_credentials_person_status ON public.talent_professional_credentials(person_id, lifecycle_status, expires_on);
CREATE INDEX IF NOT EXISTS idx_talent_visibility_search ON public.talent_profile_visibility(search_enabled, visibility_mode);
CREATE INDEX IF NOT EXISTS idx_talent_blocks_workspace ON public.talent_employer_blocks(workspace_id, person_id);

DO $talent_passport_private$
DECLARE
  table_name text;
  tables constant text[] := ARRAY[
    'talent_professional_profiles','talent_professional_experiences','talent_professional_experience_context','talent_professional_capabilities','talent_credential_authorities','talent_professional_credentials','talent_credential_verification_events','talent_professional_jurisdictions','talent_professional_languages','talent_professional_preferences','talent_professional_availability','talent_work_authorizations','talent_mobility_preferences','talent_contact_points','talent_profile_claims','talent_profile_visibility','talent_disclosure_grants','talent_employer_blocks','talent_consents','talent_consent_events','talent_data_subject_requests','talent_legal_holds','talent_data_residency_classifications','talent_abuse_reports','talent_moderation_cases','talent_moderation_actions','talent_retention_policies','talent_retention_events','talent_notification_preferences','talent_notifications','talent_notification_deliveries'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM public, anon, authenticated', table_name);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', table_name);
  END LOOP;
END
$talent_passport_private$;

COMMIT;
