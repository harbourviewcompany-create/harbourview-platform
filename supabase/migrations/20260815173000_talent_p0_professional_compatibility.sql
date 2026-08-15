BEGIN;

-- TAL-080: preserve every existing /professionals* and /api/experts consumer
-- while making the Passport-backed compatibility projection the read source.
ALTER TABLE public.talent_professional_profiles
  ADD COLUMN IF NOT EXISTS legacy_institution_country text;

UPDATE public.talent_professional_profiles p
SET legacy_institution_country = hp.institution_country
FROM public.hv_professionals hp
WHERE p.legacy_hv_professional_id = hp.id
  AND p.legacy_institution_country IS DISTINCT FROM hp.institution_country;

DROP VIEW IF EXISTS api.hv_professionals;
CREATE VIEW api.hv_professionals
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
  p.legacy_institution_country AS institution_country,
  coalesce(p.legacy_accepts_referrals,false) AS accepts_referrals,
  coalesce(p.legacy_consultation_available,false) AS consultation_available,
  p.legacy_clinical_focus AS clinical_focus,
  p.legacy_verification_status AS verification_status,
  p.legacy_verified_at AS verified_at,
  p.profile_status AS status,
  tp.created_at,
  tp.updated_at
FROM public.talent_professional_profiles p
JOIN public.talent_people tp ON tp.id=p.person_id
JOIN public.talent_profile_visibility v ON v.person_id=p.person_id
WHERE p.profile_status='active'
  AND p.legacy_verification_status='verified'
  AND v.visibility_mode='public';

REVOKE ALL ON api.hv_professionals FROM PUBLIC;
GRANT SELECT ON api.hv_professionals TO anon,authenticated,service_role;

COMMIT;
