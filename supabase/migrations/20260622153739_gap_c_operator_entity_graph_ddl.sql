CREATE TABLE IF NOT EXISTS public.cannabis_operators (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    country_iso2 text NOT NULL,
    legal_name text NOT NULL,
    normalized_name text NOT NULL,
    operator_type text NOT NULL,
    primary_country_iso2 text,
    website text,
    linkedin_url text,
    public_status text NOT NULL DEFAULT 'active',
    data_completeness text NOT NULL DEFAULT 'stub',
    verification_status text NOT NULL DEFAULT 'unverified',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT cannabis_operators_pkey PRIMARY KEY (id),
    CONSTRAINT cannabis_operators_country_iso2_fkey FOREIGN KEY (country_iso2) REFERENCES public.countries (iso_alpha2),
    CONSTRAINT cannabis_operators_primary_country_iso2_fkey FOREIGN KEY (primary_country_iso2) REFERENCES public.countries (iso_alpha2),
    CONSTRAINT cannabis_operators_operator_type_check CHECK (operator_type IN ('cultivator','processor','seller','pharmacy','distributor','laboratory','clinic','importer','exporter','integrated','holding_company','investment_fund','research_institution','other')),
    CONSTRAINT cannabis_operators_public_status_check CHECK (public_status IN ('active','revoked','suspended','expired','pending','unknown')),
    CONSTRAINT cannabis_operators_data_completeness_check CHECK (data_completeness IN ('stub','seed','verified','full')),
    CONSTRAINT cannabis_operators_verification_status_check CHECK (verification_status IN ('unverified','admin_verified','source_verified'))
);
CREATE TABLE IF NOT EXISTS public.operator_licences (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    operator_id uuid NOT NULL,
    country_iso2 text NOT NULL,
    licence_number text,
    licence_class text NOT NULL,
    issuing_regulator text NOT NULL,
    authorized_activities text[] NOT NULL DEFAULT '{}',
    issue_date date,
    expiry_date date,
    licence_status text NOT NULL DEFAULT 'active',
    facility_city text,
    facility_province_state text,
    gmp_certified boolean DEFAULT false,
    gacp_certified boolean DEFAULT false,
    source_url text,
    last_verified date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT operator_licences_pkey PRIMARY KEY (id),
    CONSTRAINT operator_licences_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.cannabis_operators (id) ON DELETE CASCADE,
    CONSTRAINT operator_licences_country_iso2_fkey FOREIGN KEY (country_iso2) REFERENCES public.countries (iso_alpha2),
    CONSTRAINT operator_licences_licence_status_check CHECK (licence_status IN ('active','revoked','suspended','expired','pending','unknown'))
);
CREATE TABLE IF NOT EXISTS public.operator_countries (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    operator_id uuid NOT NULL,
    country_iso2 text NOT NULL,
    presence_type text NOT NULL,
    CONSTRAINT operator_countries_pkey PRIMARY KEY (id),
    CONSTRAINT operator_countries_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.cannabis_operators (id) ON DELETE CASCADE,
    CONSTRAINT operator_countries_country_iso2_fkey FOREIGN KEY (country_iso2) REFERENCES public.countries (iso_alpha2),
    CONSTRAINT operator_countries_presence_type_check CHECK (presence_type IN ('headquarters','subsidiary','licensed_facility','distribution','sales_office','partnership')),
    CONSTRAINT operator_countries_unique_operator_country_presence UNIQUE (operator_id, country_iso2, presence_type)
);
CREATE INDEX IF NOT EXISTS idx_cannabis_operators_country_iso2 ON public.cannabis_operators (country_iso2);
CREATE INDEX IF NOT EXISTS idx_cannabis_operators_operator_type ON public.cannabis_operators (operator_type);
CREATE INDEX IF NOT EXISTS idx_operator_licences_operator_id ON public.operator_licences (operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_licences_country_iso2_status ON public.operator_licences (country_iso2, licence_status);
CREATE INDEX IF NOT EXISTS idx_operator_licences_status_expiry ON public.operator_licences (licence_status, expiry_date);
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cannabis_operators_updated_at') THEN CREATE TRIGGER trg_cannabis_operators_updated_at BEFORE UPDATE ON public.cannabis_operators FOR EACH ROW EXECUTE FUNCTION public.set_updated_at(); END IF; IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_operator_licences_updated_at') THEN CREATE TRIGGER trg_operator_licences_updated_at BEFORE UPDATE ON public.operator_licences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at(); END IF; END; $$;
ALTER TABLE public.cannabis_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_licences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_countries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_select_cannabis_operators ON public.cannabis_operators;
CREATE POLICY public_select_cannabis_operators ON public.cannabis_operators FOR SELECT TO anon, authenticated USING (data_completeness != 'stub' AND verification_status != 'unverified');
DROP POLICY IF EXISTS public_select_operator_licences ON public.operator_licences;
CREATE POLICY public_select_operator_licences ON public.operator_licences FOR SELECT TO anon, authenticated USING (licence_status = 'active');
DROP POLICY IF EXISTS public_select_operator_countries ON public.operator_countries;
CREATE POLICY public_select_operator_countries ON public.operator_countries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS service_role_all_cannabis_operators ON public.cannabis_operators;
CREATE POLICY service_role_all_cannabis_operators ON public.cannabis_operators FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS service_role_all_operator_licences ON public.operator_licences;
CREATE POLICY service_role_all_operator_licences ON public.operator_licences FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS service_role_all_operator_countries ON public.operator_countries;
CREATE POLICY service_role_all_operator_countries ON public.operator_countries FOR ALL TO service_role USING (true) WITH CHECK (true);
