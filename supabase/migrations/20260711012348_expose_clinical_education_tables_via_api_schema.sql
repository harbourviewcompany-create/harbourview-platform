-- Restore the exact production-owned body for migration 20260711012348.
-- The previous local reconciliation stub omitted both API views that the later
-- security-invoker hardening migration expects to exist.

create view api.clinical_education_country_readiness as
select
  id,
  country,
  region,
  professional_education_readiness,
  known_training_gap,
  official_guidance_status,
  formats_requiring_education,
  pharmacist_relevance,
  clinician_relevance,
  research_status,
  professional_reviewer_needed,
  brief_availability,
  sort_order,
  created_at,
  updated_at
from public.clinical_education_country_readiness;

grant select on api.clinical_education_country_readiness to anon, authenticated, service_role;

create view api.clinical_education_modules as
select
  id,
  slug,
  title,
  route,
  audience,
  module_status,
  risk_level,
  public_summary,
  education_themes,
  safe_language,
  restricted_language,
  research_status,
  professional_review_required,
  source_basis,
  reviewer_role_required,
  audience_boundary,
  last_reviewed,
  next_review_due,
  public_use_approved,
  medical_advice_boundary,
  country_relevance,
  format_relevance,
  disclaimer_type,
  cta_label,
  cta_href,
  sort_order,
  created_at,
  updated_at
from public.clinical_education_modules;

grant select on api.clinical_education_modules to anon, authenticated, service_role;
