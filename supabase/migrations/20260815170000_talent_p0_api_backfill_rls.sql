BEGIN;

-- Harbourview Talent P0 canonical backfill, API projections and authorization.
-- TAL-001..084 compatibility activation. No production source is enabled here.

CREATE SCHEMA IF NOT EXISTS api;

ALTER TABLE public.talent_professional_profiles ADD COLUMN IF NOT EXISTS bio_public text;
ALTER TABLE public.talent_professional_profiles ADD COLUMN IF NOT EXISTS legacy_countries text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.talent_professional_profiles ADD COLUMN IF NOT EXISTS legacy_languages text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.talent_professional_profiles ADD COLUMN IF NOT EXISTS legacy_accepts_referrals boolean;
ALTER TABLE public.talent_professional_profiles ADD COLUMN IF NOT EXISTS legacy_consultation_available boolean;
ALTER TABLE public.talent_professional_profiles ADD COLUMN IF NOT EXISTS legacy_clinical_focus text[];
ALTER TABLE public.talent_professional_profiles ADD COLUMN IF NOT EXISTS legacy_verification_status text;
ALTER TABLE public.talent_professional_profiles ADD COLUMN IF NOT EXISTS legacy_verified_at timestamptz;

CREATE OR REPLACE FUNCTION public.talent_is_platform_staff(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p_user_id AND ur.role IN ('admin','operator')
  );
$$;

CREATE OR REPLACE FUNCTION public.talent_person_for_user(p_user_id uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT pa.person_id
  FROM public.talent_person_accounts pa
  WHERE pa.user_id = p_user_id AND pa.revoked_at IS NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.talent_can_search_people(p_workspace_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    public.talent_is_platform_staff(p_user_id)
    OR (
      EXISTS (
        SELECT 1
        FROM public.workspace_members wm
        JOIN public.workspaces w ON w.id = wm.workspace_id
        WHERE wm.workspace_id = p_workspace_id
          AND wm.user_id = p_user_id
          AND wm.status = 'active'
          AND w.status = 'active'
      )
      AND EXISTS (
        SELECT 1
        FROM public.talent_hiring_team_members tm
        WHERE tm.workspace_id = p_workspace_id
          AND tm.user_id = p_user_id
          AND tm.status = 'active'
          AND (tm.expires_at IS NULL OR tm.expires_at > now())
          AND tm.talent_role IN ('talent_admin','recruiter','hiring_manager','talent_viewer')
      )
    );
$$;

REVOKE ALL ON FUNCTION public.talent_is_platform_staff(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.talent_person_for_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.talent_can_search_people(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.talent_is_platform_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.talent_person_for_user(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.talent_can_search_people(uuid, uuid) TO authenticated, service_role;

-- Controlled reference seed. It exists to version normalization, not to claim
-- an exhaustive external occupational taxonomy.
INSERT INTO public.talent_taxonomy_versions(version_key, status, source_name, source_version, published_at)
VALUES ('harbourview-talent-v1', 'active', 'Harbourview controlled vocabulary', 'v1', now())
ON CONFLICT (version_key) DO NOTHING;

-- Direct Harbourview postings are authorized source material. Existing external
-- job_search data is retained as source material but remains non-publishable
-- until provider rights/source governance is explicitly reviewed.
INSERT INTO public.talent_ingestion_sources(source_key, display_name, source_class, acquisition_method, status)
VALUES ('direct_harbourview', 'Harbourview direct employer posting', 'direct_employer', 'workspace posting', 'active')
ON CONFLICT (source_key) DO NOTHING;

INSERT INTO public.talent_source_rights(source_id, storage_allowed, redistribution_allowed, derived_search_allowed, public_display_allowed, commercial_use_allowed, terms_reference, reviewed_at)
SELECT id, true, true, true, true, true, 'Direct employer/Harbourview posting authority', now()
FROM public.talent_ingestion_sources WHERE source_key = 'direct_harbourview'
ON CONFLICT (source_id) DO NOTHING;

-- Canonical jobs preserve legacy talent_jobs UUIDs so existing /talent deep links
-- remain valid throughout shadow/cutover.
INSERT INTO public.talent_job_opportunities(
  id, legacy_talent_job_id, workspace_id, employer_display_name, canonical_slug,
  title, department, description, location_text, application_method,
  lifecycle_status, publication_state, source_class, freshness_state,
  first_seen_at, last_confirmed_at, published_at, created_at, updated_at
)
SELECT
  tj.id, tj.id, tj.workspace_id, coalesce(w.trade_name, w.legal_name, w.name),
  'legacy-' || tj.id::text,
  tj.title, tj.department, tj.description, tj.location, 'harbourview_direct',
  CASE tj.status WHEN 'open' THEN 'open' WHEN 'on_hold' THEN 'on_hold' ELSE 'closed' END,
  CASE WHEN tj.status = 'open' AND w.is_public = true THEN 'published' WHEN tj.status = 'on_hold' THEN 'paused' ELSE 'archived' END,
  'direct_harbourview',
  CASE WHEN tj.status = 'open' THEN 'confirmed' ELSE 'closed' END,
  tj.created_at, tj.updated_at, tj.created_at, tj.created_at, tj.updated_at
FROM public.talent_jobs tj
JOIN public.workspaces w ON w.id = tj.workspace_id
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.talent_job_source_records(id, job_id, source_id, external_id, observed_title, observed_employer, observed_location, source_status, first_seen_at, last_seen_at)
SELECT
  tj.id, tj.id, s.id, tj.id::text, tj.title,
  coalesce(w.trade_name, w.legal_name, w.name), tj.location,
  CASE WHEN tj.status = 'open' THEN 'confirmed' ELSE 'closed' END,
  tj.created_at, tj.updated_at
FROM public.talent_jobs tj
JOIN public.workspaces w ON w.id = tj.workspace_id
JOIN public.talent_ingestion_sources s ON s.source_key = 'direct_harbourview'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.talent_job_versions(job_id, version_number, content_hash, snapshot)
SELECT j.id, 1, md5(concat_ws('|', j.title, j.department, j.description, j.location_text, j.lifecycle_status)),
       jsonb_build_object('title',j.title,'department',j.department,'description',j.description,'location',j.location_text,'status',j.lifecycle_status)
FROM public.talent_job_opportunities j
WHERE j.legacy_talent_job_id IS NOT NULL
ON CONFLICT (job_id, version_number) DO NOTHING;

-- Preserve external/operator discovery rows as canonical source identities, but
-- keep them in validation state until source rights explicitly permit display.
INSERT INTO public.talent_organization_source_records(id, source_system, external_id, observed_name, domain, first_seen_at, last_seen_at)
SELECT c.id, 'job_search', c.id::text, c.name, c.domain, c.created_at, c.created_at
FROM job_search.companies c
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.talent_ingestion_sources(source_key, display_name, source_class, acquisition_method, status)
SELECT DISTINCT 'legacy_job_search:' || lower(js.source), 'Legacy job_search: ' || js.source, 'legacy', 'legacy job_search import', 'inactive'
FROM job_search.jobs js
WHERE js.source IS NOT NULL
ON CONFLICT (source_key) DO NOTHING;

INSERT INTO public.talent_source_rights(source_id, storage_allowed, redistribution_allowed, derived_search_allowed, public_display_allowed, commercial_use_allowed, terms_reference)
SELECT s.id, true, false, false, false, false, 'UNREVIEWED legacy source; public/derived use disabled pending source-rights review'
FROM public.talent_ingestion_sources s
WHERE s.source_key LIKE 'legacy_job_search:%'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO public.talent_job_opportunities(
  id, employer_source_record_id, employer_display_name, canonical_slug, title,
  description, employment_type, workplace_type, location_text, application_method,
  application_url, lifecycle_status, publication_state, source_class,
  freshness_state, first_seen_at, last_confirmed_at, published_at, created_at, updated_at
)
SELECT
  j.id, j.company_id, c.name, 'external-' || j.id::text, j.title,
  j.description, j.job_type, CASE WHEN j.remote THEN 'remote' ELSE 'unknown' END,
  j.location, 'external', j.url,
  CASE WHEN j.status IN ('closed','expired') THEN 'closed' ELSE 'open' END,
  'validation', 'external',
  CASE WHEN j.status IN ('closed','expired') THEN 'closed' ELSE 'unknown' END,
  coalesce(j.fetched_at, now()), j.fetched_at, NULL, coalesce(j.fetched_at, now()), coalesce(j.fetched_at, now())
FROM job_search.jobs j
LEFT JOIN job_search.companies c ON c.id = j.company_id
WHERE NOT EXISTS (SELECT 1 FROM public.talent_job_opportunities x WHERE x.id = j.id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.talent_job_source_records(id, job_id, source_id, external_id, source_url, canonical_url, observed_title, observed_employer, observed_location, source_status, first_seen_at, last_seen_at)
SELECT
  j.id, j.id, s.id, coalesce(j.external_id, j.id::text), j.url, j.url, j.title, c.name, j.location,
  CASE WHEN j.status IN ('closed','expired') THEN 'closed' ELSE 'unknown' END,
  coalesce(j.fetched_at, now()), coalesce(j.fetched_at, now())
FROM job_search.jobs j
LEFT JOIN job_search.companies c ON c.id = j.company_id
JOIN public.talent_ingestion_sources s ON s.source_key = 'legacy_job_search:' || lower(j.source)
ON CONFLICT (id) DO NOTHING;

-- Professional directory compatibility: preserve factual legacy fields as
-- legacy-observed values; do not fabricate issuer, registration, validity or
-- jurisdictional authorization from credential_type/countries strings.
INSERT INTO public.talent_people(id, display_name, canonical_state, legacy_hv_professional_id, created_at, updated_at)
SELECT hp.id, hp.full_name, 'unclaimed', hp.id, hp.created_at, hp.updated_at
FROM public.hv_professionals hp
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.talent_professional_profiles(
  person_id, legacy_hv_professional_id, profile_slug, headline, summary, bio_public,
  legacy_specialties, legacy_credential_type, legacy_institution, legacy_countries,
  legacy_languages, legacy_accepts_referrals, legacy_consultation_available,
  legacy_clinical_focus, legacy_verification_status, legacy_verified_at,
  profile_status, created_at, updated_at
)
SELECT
  hp.id, hp.id, hp.profile_slug, hp.title, hp.bio_public, hp.bio_public,
  hp.specialties, hp.credential_type, hp.institution, hp.countries, hp.languages,
  hp.accepts_referrals, hp.consultation_available, hp.clinical_focus,
  hp.verification_status, hp.verified_at,
  CASE WHEN hp.status = 'active' THEN 'active' ELSE 'inactive' END,
  hp.created_at, hp.updated_at
FROM public.hv_professionals hp
ON CONFLICT (person_id) DO NOTHING;

INSERT INTO public.talent_profile_visibility(person_id, visibility_mode, identity_disclosure_level, search_enabled, updated_at)
SELECT hp.id,
       CASE WHEN hp.status = 'active' AND hp.verification_status = 'verified' THEN 'public' ELSE 'private' END,
       CASE WHEN hp.status = 'active' AND hp.verification_status = 'verified' THEN 3 ELSE 0 END,
       (hp.status = 'active' AND hp.verification_status = 'verified'),
       hp.updated_at
FROM public.hv_professionals hp
ON CONFLICT (person_id) DO NOTHING;

-- Legacy candidate rows become application participation snapshots only. No
-- missing historical stage transitions are invented.
INSERT INTO public.talent_applications(
  id, legacy_candidate_id, job_id, applicant_name_snapshot, applicant_email_snapshot,
  applicant_phone_snapshot, status, source, idempotency_key, legacy_resume_url,
  cover_note, submitted_at, created_at, updated_at
)
SELECT
  tc.id, tc.id, tc.job_id, tc.name, coalesce(tc.email, 'legacy-unknown+' || tc.id::text || '@invalid.local'),
  tc.phone,
  CASE tc.stage WHEN 'sourced' THEN 'submitted' WHEN 'screening' THEN 'screening' WHEN 'interview' THEN 'interview' WHEN 'offer' THEN 'offer' WHEN 'hired' THEN 'hired' ELSE 'rejected' END,
  coalesce(tc.source, 'legacy_talent_candidate'), 'legacy:' || tc.id::text,
  tc.resume_url, tc.cover_note, tc.created_at, tc.created_at, tc.updated_at
FROM public.talent_candidates tc
JOIN public.talent_job_opportunities j ON j.id = tc.job_id
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.talent_application_status_events(application_id, prior_status, new_status, reason_code, source, created_at)
SELECT a.id, NULL, a.status, 'LEGACY_CURRENT_STATE_ONLY', 'legacy_talent_candidates', a.created_at
FROM public.talent_applications a
WHERE a.legacy_candidate_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.talent_application_status_events e WHERE e.application_id = a.id)
ON CONFLICT DO NOTHING;

-- Search projections only contain publishable / discoverable allowlisted data.
INSERT INTO public.talent_job_search_documents(job_id, projection_version, search_text, filter_document, content_hash, generated_at)
SELECT j.id, 'p0-v1', concat_ws(' ', j.title, j.employer_display_name, j.department, j.location_text, j.description),
       jsonb_build_object('country',j.country_iso2,'region',j.region_code,'employmentType',j.employment_type,'workplaceType',j.workplace_type,'freshness',j.freshness_state),
       md5(concat_ws('|', j.title, j.employer_display_name, j.department, j.location_text, j.description, j.updated_at::text)), now()
FROM public.talent_job_opportunities j
JOIN public.workspaces w ON w.id = j.workspace_id
WHERE j.publication_state = 'published' AND j.lifecycle_status = 'open' AND w.is_public = true
ON CONFLICT (job_id) DO UPDATE SET search_text = EXCLUDED.search_text, filter_document = EXCLUDED.filter_document, content_hash = EXCLUDED.content_hash, generated_at = EXCLUDED.generated_at;

INSERT INTO public.talent_person_search_documents(person_id, projection_version, disclosure_level, search_text, filter_document, content_hash, generated_at)
SELECT p.person_id, 'p0-v1', v.identity_disclosure_level,
       concat_ws(' ', CASE WHEN v.visibility_mode = 'public' THEN tp.display_name ELSE NULL END, p.headline, p.summary, array_to_string(p.legacy_specialties,' '), array_to_string(p.legacy_countries,' '), array_to_string(p.legacy_languages,' ')),
       jsonb_build_object('country',p.country_iso2,'legacyCountries',p.legacy_countries,'legacyLanguages',p.legacy_languages,'visibility',v.visibility_mode),
       md5(concat_ws('|', p.person_id::text, p.updated_at::text, v.updated_at::text)), now()
FROM public.talent_professional_profiles p
JOIN public.talent_people tp ON tp.id = p.person_id
JOIN public.talent_profile_visibility v ON v.person_id = p.person_id
WHERE v.search_enabled = true AND v.visibility_mode IN ('anonymous_discoverable','verified_employers','public')
ON CONFLICT (person_id) DO UPDATE SET disclosure_level = EXCLUDED.disclosure_level, search_text = EXCLUDED.search_text, filter_document = EXCLUDED.filter_document, content_hash = EXCLUDED.content_hash, generated_at = EXCLUDED.generated_at;

-- Compatibility public projection keeps the exact historical column contract.
DROP VIEW IF EXISTS api.talent_jobs_public;
CREATE VIEW api.talent_jobs_public
WITH (security_invoker = false)
AS
SELECT
  j.id,
  j.title,
  j.department,
  j.location_text AS location,
  j.description,
  j.created_at,
  w.id AS workspace_id,
  coalesce(w.trade_name, w.legal_name, w.name, j.employer_display_name) AS operator_name,
  w.verification_status AS operator_verification_status
FROM public.talent_job_opportunities j
JOIN public.workspaces w ON w.id = j.workspace_id
WHERE j.publication_state = 'published'
  AND j.lifecycle_status = 'open'
  AND j.freshness_state NOT IN ('removed','closed')
  AND w.is_public = true;

REVOKE ALL ON api.talent_jobs_public FROM PUBLIC;
GRANT SELECT ON api.talent_jobs_public TO anon, authenticated, service_role;

CREATE OR REPLACE VIEW api.talent_job_opportunities_public
WITH (security_invoker = false)
AS
SELECT
  j.id, j.title, j.department, j.description,
  j.country_iso2, j.region_code, j.locality, j.location_text,
  j.employment_type, j.workplace_type, j.application_method, j.application_url,
  j.freshness_state, j.last_confirmed_at, j.published_at, j.expires_at,
  j.openings_total, j.openings_filled,
  w.id AS workspace_id,
  coalesce(w.trade_name, w.legal_name, w.name, j.employer_display_name) AS employer_name,
  w.verification_status AS employer_verification_status
FROM public.talent_job_opportunities j
JOIN public.workspaces w ON w.id = j.workspace_id
WHERE j.publication_state = 'published'
  AND j.lifecycle_status = 'open'
  AND j.freshness_state NOT IN ('removed','closed')
  AND w.is_public = true;

REVOKE ALL ON api.talent_job_opportunities_public FROM PUBLIC;
GRANT SELECT ON api.talent_job_opportunities_public TO anon, authenticated, service_role;

CREATE OR REPLACE VIEW api.talent_professionals_public
WITH (security_invoker = false)
AS
SELECT
  p.person_id AS id,
  p.profile_slug,
  tp.display_name AS full_name,
  p.headline AS title,
  p.legacy_credential_type AS credential_type,
  p.legacy_specialties AS specialties,
  p.legacy_countries AS countries,
  p.legacy_languages AS languages,
  p.bio_public,
  p.legacy_institution AS institution,
  p.legacy_accepts_referrals AS accepts_referrals,
  p.legacy_consultation_available AS consultation_available,
  p.legacy_clinical_focus AS clinical_focus,
  p.legacy_verification_status AS verification_status,
  p.legacy_verified_at AS verified_at,
  p.profile_status AS status
FROM public.talent_professional_profiles p
JOIN public.talent_people tp ON tp.id = p.person_id
JOIN public.talent_profile_visibility v ON v.person_id = p.person_id
WHERE p.profile_status = 'active'
  AND p.legacy_verification_status = 'verified'
  AND v.visibility_mode = 'public';

REVOKE ALL ON api.talent_professionals_public FROM PUBLIC;
GRANT SELECT ON api.talent_professionals_public TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION api.talent_search_jobs(
  p_query text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_workplace text DEFAULT NULL,
  p_employment text DEFAULT NULL,
  p_verified_only boolean DEFAULT false,
  p_limit integer DEFAULT 24,
  p_cursor_created_at timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid, title text, department text, description text, country_iso2 text,
  region_code text, locality text, location_text text, employment_type text,
  workplace_type text, application_method text, application_url text,
  freshness_state text, last_confirmed_at timestamptz, published_at timestamptz,
  workspace_id uuid, employer_name text, employer_verification_status text,
  next_cursor_created_at timestamptz, next_cursor_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH filtered AS (
    SELECT
      j.id, j.title, j.department, j.description, j.country_iso2, j.region_code,
      j.locality, j.location_text, j.employment_type, j.workplace_type,
      j.application_method, j.application_url, j.freshness_state,
      j.last_confirmed_at, j.published_at, j.created_at,
      w.id workspace_id,
      coalesce(w.trade_name, w.legal_name, w.name, j.employer_display_name) employer_name,
      w.verification_status employer_verification_status
    FROM public.talent_job_opportunities j
    JOIN public.workspaces w ON w.id = j.workspace_id
    LEFT JOIN public.talent_job_search_documents sd ON sd.job_id = j.id
    WHERE j.publication_state = 'published'
      AND j.lifecycle_status = 'open'
      AND j.freshness_state NOT IN ('removed','closed')
      AND w.is_public = true
      AND (p_country IS NULL OR j.country_iso2 = upper(p_country))
      AND (p_workplace IS NULL OR j.workplace_type = p_workplace)
      AND (p_employment IS NULL OR j.employment_type = p_employment)
      AND (NOT p_verified_only OR w.verification_status = 'verified')
      AND (p_query IS NULL OR trim(p_query) = '' OR to_tsvector('simple', coalesce(sd.search_text, concat_ws(' ',j.title,j.department,j.description,j.location_text))) @@ plainto_tsquery('simple', p_query))
      AND (p_cursor_created_at IS NULL OR (j.created_at, j.id) < (p_cursor_created_at, coalesce(p_cursor_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)))
    ORDER BY j.created_at DESC, j.id DESC
    LIMIT greatest(1, least(p_limit, 50))
  )
  SELECT f.id, f.title, f.department, f.description, f.country_iso2, f.region_code,
         f.locality, f.location_text, f.employment_type, f.workplace_type,
         f.application_method, f.application_url, f.freshness_state,
         f.last_confirmed_at, f.published_at, f.workspace_id, f.employer_name,
         f.employer_verification_status,
         (SELECT min(created_at) FROM filtered),
         (SELECT id FROM filtered ORDER BY created_at ASC, id ASC LIMIT 1)
  FROM filtered f
  ORDER BY f.created_at DESC, f.id DESC;
$$;

REVOKE ALL ON FUNCTION api.talent_search_jobs(text,text,text,text,boolean,integer,timestamptz,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION api.talent_search_jobs(text,text,text,text,boolean,integer,timestamptz,uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION api.talent_search_people(
  p_workspace_id uuid,
  p_query text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_limit integer DEFAULT 24,
  p_cursor_person_id uuid DEFAULT NULL
)
RETURNS TABLE(
  person_id uuid, display_name text, headline text, country_iso2 text,
  availability_state text, visibility_mode text, disclosure_level integer,
  capability_labels text[], credential_labels text[], language_labels text[],
  verification_summary text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.talent_can_search_people(p_workspace_id, auth.uid()) THEN
    RAISE EXCEPTION 'TALENT_SEARCH_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    p.person_id,
    CASE
      WHEN v.visibility_mode = 'public' OR coalesce(g.disclosure_level,0) >= 2 THEN tp.display_name
      ELSE NULL
    END,
    p.headline,
    p.country_iso2,
    av.availability_state,
    v.visibility_mode,
    greatest(v.identity_disclosure_level, coalesce(g.disclosure_level,0)),
    coalesce((SELECT array_agg(c.capability_label ORDER BY c.capability_label) FROM public.talent_professional_capabilities c WHERE c.person_id = p.person_id), ARRAY[]::text[]),
    coalesce((SELECT array_agg(c.credential_label ORDER BY c.credential_label) FROM public.talent_professional_credentials c WHERE c.person_id = p.person_id AND c.lifecycle_status NOT IN ('revoked','suspended')), ARRAY[]::text[]),
    coalesce((SELECT array_agg(l.language_label ORDER BY l.language_label) FROM public.talent_professional_languages l WHERE l.person_id = p.person_id), p.legacy_languages, ARRAY[]::text[]),
    CASE WHEN p.legacy_verification_status = 'verified' THEN 'Harbourview-reviewed legacy professional' ELSE 'Claims require review' END
  FROM public.talent_professional_profiles p
  JOIN public.talent_people tp ON tp.id = p.person_id
  JOIN public.talent_profile_visibility v ON v.person_id = p.person_id
  LEFT JOIN public.talent_professional_availability av ON av.person_id = p.person_id
  LEFT JOIN LATERAL (
    SELECT max(dg.disclosure_level)::integer AS disclosure_level
    FROM public.talent_disclosure_grants dg
    WHERE dg.person_id = p.person_id
      AND dg.workspace_id = p_workspace_id
      AND dg.status = 'active'
      AND (dg.expires_at IS NULL OR dg.expires_at > now())
  ) g ON true
  LEFT JOIN public.talent_person_search_documents sd ON sd.person_id = p.person_id
  WHERE p.profile_status = 'active'
    AND v.search_enabled = true
    AND v.visibility_mode IN ('anonymous_discoverable','verified_employers','public')
    AND (p_cursor_person_id IS NULL OR p.person_id > p_cursor_person_id)
    AND (p_country IS NULL OR p.country_iso2 = upper(p_country) OR upper(p_country) = ANY(SELECT upper(x) FROM unnest(p.legacy_countries) x))
    AND (p_query IS NULL OR trim(p_query) = '' OR to_tsvector('simple', coalesce(sd.search_text, concat_ws(' ',p.headline,p.summary,array_to_string(p.legacy_specialties,' ')))) @@ plainto_tsquery('simple', p_query))
    AND NOT EXISTS (
      SELECT 1
      FROM public.talent_employer_blocks b
      WHERE b.person_id = p.person_id
        AND (
          b.workspace_id = p_workspace_id
          OR (
            b.include_verified_affiliates = true
            AND EXISTS (
              SELECT 1 FROM public.talent_organization_relationships r
              WHERE (r.from_workspace_id = b.workspace_id AND r.to_workspace_id = p_workspace_id)
                 OR (r.to_workspace_id = b.workspace_id AND r.from_workspace_id = p_workspace_id)
            )
          )
        )
    )
  ORDER BY p.person_id
  LIMIT greatest(1, least(p_limit, 50));
END;
$$;

REVOKE ALL ON FUNCTION api.talent_search_people(uuid,text,text,integer,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION api.talent_search_people(uuid,text,text,integer,uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION api.talent_submit_application(
  p_job_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_resume_url text,
  p_cover_note text,
  p_idempotency_key text,
  p_consent_policy_version text DEFAULT 'talent-applications-v1'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_application_id uuid;
  v_legacy_job_id uuid;
  v_legacy_candidate_id uuid;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'SERVICE_ROLE_REQUIRED' USING ERRCODE = '42501';
  END IF;

  SELECT j.legacy_talent_job_id INTO v_legacy_job_id
  FROM public.talent_job_opportunities j
  WHERE j.id = p_job_id
    AND j.lifecycle_status = 'open'
    AND j.publication_state = 'published'
    AND j.freshness_state NOT IN ('removed','closed');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'JOB_NOT_ACCEPTING_APPLICATIONS' USING ERRCODE = 'P0002';
  END IF;

  SELECT a.id INTO v_application_id
  FROM public.talent_applications a
  WHERE a.job_id = p_job_id AND a.idempotency_key = p_idempotency_key;
  IF FOUND THEN RETURN v_application_id; END IF;

  IF v_legacy_job_id IS NOT NULL THEN
    INSERT INTO public.talent_candidates(job_id,name,email,phone,resume_url,cover_note,source,stage)
    VALUES(v_legacy_job_id,trim(p_name),lower(trim(p_email)),nullif(trim(p_phone),''),nullif(trim(p_resume_url),''),nullif(trim(p_cover_note),''),'Direct application','sourced')
    RETURNING id INTO v_legacy_candidate_id;
  END IF;

  INSERT INTO public.talent_applications(
    legacy_candidate_id, job_id, applicant_name_snapshot, applicant_email_snapshot,
    applicant_phone_snapshot, status, source, idempotency_key, legacy_resume_url,
    cover_note, consent_policy_version, submitted_at
  ) VALUES (
    v_legacy_candidate_id, p_job_id, trim(p_name), lower(trim(p_email)), nullif(trim(p_phone),''),
    'submitted','harbourview_direct',p_idempotency_key,nullif(trim(p_resume_url),''),
    nullif(trim(p_cover_note),''),p_consent_policy_version,now()
  ) RETURNING id INTO v_application_id;

  INSERT INTO public.talent_application_status_events(application_id,prior_status,new_status,reason_code,source)
  VALUES(v_application_id,NULL,'submitted','APPLICATION_SUBMITTED','harbourview');

  INSERT INTO public.talent_audit_events(event_type,subject_type,subject_id,metadata)
  VALUES('talent_application_created','application',v_application_id,jsonb_build_object('job_id',p_job_id));

  RETURN v_application_id;
END;
$$;

REVOKE ALL ON FUNCTION api.talent_submit_application(uuid,text,text,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION api.talent_submit_application(uuid,text,text,text,text,text,text,text) TO service_role;

-- The canonical route now owns public application writes; retain the legacy
-- table for compatibility but remove direct unauthenticated Data API inserts.
DROP POLICY IF EXISTS talent_candidates_public_apply ON public.talent_candidates;

-- Private Talent documents. Bucket is created dark; all access is mediated by
-- signed/server paths and explicit Talent document grants.
INSERT INTO storage.buckets(id, name, public, file_size_limit)
VALUES('talent-private','talent-private',false,10485760)
ON CONFLICT (id) DO UPDATE SET public = false;

COMMIT;
