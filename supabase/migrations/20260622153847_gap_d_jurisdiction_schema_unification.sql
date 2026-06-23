CREATE TABLE IF NOT EXISTS public.jurisdiction_crossref (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    countries_iso2 text UNIQUE,
    jurisdictions_id text UNIQUE,
    hv_core_jurisdiction_iso_code text,
    canonical_iso2 text NOT NULL,
    canonical_name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT jurisdiction_crossref_pkey PRIMARY KEY (id),
    CONSTRAINT jurisdiction_crossref_countries_iso2_fkey FOREIGN KEY (countries_iso2) REFERENCES public.countries (iso_alpha2) ON DELETE SET NULL,
    CONSTRAINT jurisdiction_crossref_jurisdictions_id_fkey FOREIGN KEY (jurisdictions_id) REFERENCES public.jurisdictions (jurisdiction_id) ON DELETE SET NULL,
    CONSTRAINT jurisdiction_crossref_at_least_one_ref CHECK (countries_iso2 IS NOT NULL OR jurisdictions_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_crossref_canonical_iso2 ON public.jurisdiction_crossref (canonical_iso2);
ALTER TABLE public.jurisdiction_crossref ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_select_jurisdiction_crossref ON public.jurisdiction_crossref;
CREATE POLICY public_select_jurisdiction_crossref ON public.jurisdiction_crossref FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS service_role_all_jurisdiction_crossref ON public.jurisdiction_crossref;
CREATE POLICY service_role_all_jurisdiction_crossref ON public.jurisdiction_crossref FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE OR REPLACE VIEW public.v_jurisdiction_unified AS
SELECT
    xref.canonical_iso2,
    xref.canonical_name,
    xref.hv_core_jurisdiction_iso_code,
    c.country_name,
    c.market_access_status,
    c.medical_status,
    c.adult_use_status,
    c.import_status,
    c.export_status,
    c.opportunity_score,
    c.data_completeness,
    c.regulator_label,
    c.public_summary AS countries_public_summary,
    j.jurisdiction_id,
    j.data_release_status,
    j.identity_verification_status,
    cpp.public_summary AS profile_public_summary,
    cpp.confidence_band_public,
    cpp.last_regulatory_verified_at
FROM public.jurisdiction_crossref xref
LEFT JOIN public.countries c ON c.iso_alpha2 = xref.countries_iso2
LEFT JOIN public.jurisdictions j ON j.jurisdiction_id = xref.jurisdictions_id
LEFT JOIN public.country_profiles_public cpp ON cpp.jurisdiction_id = j.jurisdiction_id;
GRANT SELECT ON public.v_jurisdiction_unified TO anon, authenticated;
INSERT INTO public.jurisdiction_crossref (countries_iso2, canonical_iso2, canonical_name)
SELECT iso_alpha2, iso_alpha2, country_name FROM public.countries
ON CONFLICT (countries_iso2) DO NOTHING;
