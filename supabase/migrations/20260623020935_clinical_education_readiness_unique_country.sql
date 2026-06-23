
-- Make the readiness seed idempotent: without a unique key, "on conflict do nothing"
-- never matches and re-running the seed would duplicate rows.
alter table public.clinical_education_country_readiness
  add constraint clinical_education_country_readiness_country_key unique (country);
