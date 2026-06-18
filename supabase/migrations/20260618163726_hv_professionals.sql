-- hv_professionals: verified professionals directory
CREATE TABLE IF NOT EXISTS public.hv_professionals (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_slug            text        NOT NULL UNIQUE,
  full_name               text        NOT NULL,
  title                   text,
  credential_type         text        NOT NULL,
  specialties             text[]      NOT NULL DEFAULT '{}',
  countries               text[]      NOT NULL DEFAULT '{}',
  languages               text[]      NOT NULL DEFAULT '{}',
  bio_public              text,
  institution             text,
  institution_country     text,
  accepts_referrals       boolean     NOT NULL DEFAULT false,
  consultation_available  boolean     NOT NULL DEFAULT false,
  clinical_focus          text[],
  verification_status     text        NOT NULL DEFAULT 'pending',
  verified_at             timestamptz,
  status                  text        NOT NULL DEFAULT 'active',
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_professionals_verification  ON public.hv_professionals (verification_status);
CREATE INDEX idx_professionals_credential    ON public.hv_professionals (credential_type);
CREATE INDEX idx_professionals_countries     ON public.hv_professionals USING gin (countries);

ALTER TABLE public.hv_professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_read_verified_professionals ON public.hv_professionals
  FOR SELECT USING (status = 'active' AND verification_status = 'verified');

CREATE POLICY service_write_professionals ON public.hv_professionals
  FOR ALL USING (auth.role() = 'service_role');
