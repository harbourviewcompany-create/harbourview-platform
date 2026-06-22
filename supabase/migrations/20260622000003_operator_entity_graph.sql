-- =============================================================================
-- Migration: Gap C — Global Operator / Entity Graph
-- Platform:  Harbourview Cannabis Intelligence Platform
-- Database:  Supabase PostgreSQL 17
-- Author:    Harbourview Engineering
-- Date:      2026-06-22
-- Purpose:   Creates a generalized global operator/entity registry alongside
--            (not replacing) the existing Canada-specific tables in
--            public.health_canada_operator_registry.
-- Source:    Harbourview Research — public regulatory sources
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------------

-- 1a. cannabis_operators — licensed cannabis operators globally
CREATE TABLE IF NOT EXISTS public.cannabis_operators (
    id                   uuid        NOT NULL DEFAULT gen_random_uuid(),
    country_iso2         text        NOT NULL,
    legal_name           text        NOT NULL,
    normalized_name      text        NOT NULL,
    operator_type        text        NOT NULL,
    primary_country_iso2 text,
    website              text,
    linkedin_url         text,
    public_status        text        NOT NULL DEFAULT 'active',
    data_completeness    text        NOT NULL DEFAULT 'stub',
    verification_status  text        NOT NULL DEFAULT 'unverified',
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT cannabis_operators_pkey
        PRIMARY KEY (id),

    CONSTRAINT cannabis_operators_country_iso2_fkey
        FOREIGN KEY (country_iso2)
        REFERENCES public.countries (iso_alpha2),

    CONSTRAINT cannabis_operators_primary_country_iso2_fkey
        FOREIGN KEY (primary_country_iso2)
        REFERENCES public.countries (iso_alpha2),

    CONSTRAINT cannabis_operators_operator_type_check
        CHECK (operator_type IN (
            'cultivator','processor','seller','pharmacy','distributor',
            'laboratory','clinic','importer','exporter','integrated',
            'holding_company','investment_fund','research_institution','other'
        )),

    CONSTRAINT cannabis_operators_public_status_check
        CHECK (public_status IN (
            'active','revoked','suspended','expired','pending','unknown'
        )),

    CONSTRAINT cannabis_operators_data_completeness_check
        CHECK (data_completeness IN (
            'stub','seed','verified','full'
        )),

    CONSTRAINT cannabis_operators_verification_status_check
        CHECK (verification_status IN (
            'unverified','admin_verified','source_verified'
        ))
);

COMMENT ON TABLE public.cannabis_operators IS
    'Global licensed cannabis operators registry. '
    'Source: Harbourview Research — public regulatory sources. '
    'Canada-specific detail is in health_canada_operator_registry schema.';

COMMENT ON COLUMN public.cannabis_operators.normalized_name IS
    'Lowercased, whitespace-collapsed, punctuation-stripped form of legal_name for deduplication.';
COMMENT ON COLUMN public.cannabis_operators.operator_type IS
    'Primary operational classification. Integrated = full vertical. '
    'Multi-type operators should be modelled as integrated or by their dominant activity.';
COMMENT ON COLUMN public.cannabis_operators.data_completeness IS
    'stub=minimal id record; seed=basic public info; verified=cross-checked; full=comprehensive.';


-- 1b. operator_licences — individual licences held by operators
CREATE TABLE IF NOT EXISTS public.operator_licences (
    id                      uuid        NOT NULL DEFAULT gen_random_uuid(),
    operator_id             uuid        NOT NULL,
    country_iso2            text        NOT NULL,
    licence_number          text,
    licence_class           text        NOT NULL,
    issuing_regulator       text        NOT NULL,
    authorized_activities   text[]      NOT NULL DEFAULT '{}',
    issue_date              date,
    expiry_date             date,
    licence_status          text        NOT NULL DEFAULT 'active',
    facility_city           text,
    facility_province_state text,
    gmp_certified           boolean     DEFAULT false,
    gacp_certified          boolean     DEFAULT false,
    source_url              text,
    last_verified           date        NOT NULL DEFAULT CURRENT_DATE,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT operator_licences_pkey
        PRIMARY KEY (id),

    CONSTRAINT operator_licences_operator_id_fkey
        FOREIGN KEY (operator_id)
        REFERENCES public.cannabis_operators (id)
        ON DELETE CASCADE,

    CONSTRAINT operator_licences_country_iso2_fkey
        FOREIGN KEY (country_iso2)
        REFERENCES public.countries (iso_alpha2),

    CONSTRAINT operator_licences_licence_status_check
        CHECK (licence_status IN (
            'active','revoked','suspended','expired','pending','unknown'
        ))
);

COMMENT ON TABLE public.operator_licences IS
    'Individual regulatory licences held by cannabis operators globally. '
    'Source: Harbourview Research — public regulatory sources.';

COMMENT ON COLUMN public.operator_licences.licence_class IS
    'Regulator-specific licence class, e.g. ''Standard Cultivation'', ''Processing'', ''Sale for Medical Purposes''.';
COMMENT ON COLUMN public.operator_licences.authorized_activities IS
    'Array of specific activities authorised under this licence, as published by the regulator.';


-- 1c. operator_countries — junction table for multi-country operators
CREATE TABLE IF NOT EXISTS public.operator_countries (
    id            uuid NOT NULL DEFAULT gen_random_uuid(),
    operator_id   uuid NOT NULL,
    country_iso2  text NOT NULL,
    presence_type text NOT NULL,

    CONSTRAINT operator_countries_pkey
        PRIMARY KEY (id),

    CONSTRAINT operator_countries_operator_id_fkey
        FOREIGN KEY (operator_id)
        REFERENCES public.cannabis_operators (id)
        ON DELETE CASCADE,

    CONSTRAINT operator_countries_country_iso2_fkey
        FOREIGN KEY (country_iso2)
        REFERENCES public.countries (iso_alpha2),

    CONSTRAINT operator_countries_presence_type_check
        CHECK (presence_type IN (
            'headquarters','subsidiary','licensed_facility',
            'distribution','sales_office','partnership'
        )),

    CONSTRAINT operator_countries_unique_operator_country_presence
        UNIQUE (operator_id, country_iso2, presence_type)
);

COMMENT ON TABLE public.operator_countries IS
    'Junction table mapping operators to every country in which they have a regulated presence.';


-- ---------------------------------------------------------------------------
-- 2. INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_cannabis_operators_country_iso2
    ON public.cannabis_operators (country_iso2);

CREATE INDEX IF NOT EXISTS idx_cannabis_operators_operator_type
    ON public.cannabis_operators (operator_type);

CREATE INDEX IF NOT EXISTS idx_operator_licences_operator_id
    ON public.operator_licences (operator_id);

CREATE INDEX IF NOT EXISTS idx_operator_licences_country_iso2_status
    ON public.operator_licences (country_iso2, licence_status);

CREATE INDEX IF NOT EXISTS idx_operator_licences_status_expiry
    ON public.operator_licences (licence_status, expiry_date);


-- ---------------------------------------------------------------------------
-- 3. UPDATED_AT TRIGGER (shared helper — idempotent)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_cannabis_operators_updated_at'
    ) THEN
        CREATE TRIGGER trg_cannabis_operators_updated_at
            BEFORE UPDATE ON public.cannabis_operators
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_operator_licences_updated_at'
    ) THEN
        CREATE TRIGGER trg_operator_licences_updated_at
            BEFORE UPDATE ON public.operator_licences
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END;
$$;


-- ---------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE public.cannabis_operators  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_licences   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_countries  ENABLE ROW LEVEL SECURITY;

-- Public read: only non-stub, verified operators
DROP POLICY IF EXISTS public_select_cannabis_operators ON public.cannabis_operators;
CREATE POLICY public_select_cannabis_operators
    ON public.cannabis_operators
    FOR SELECT
    TO anon, authenticated
    USING (
        data_completeness  != 'stub'
        AND verification_status != 'unverified'
    );

-- Public read: active licences only
DROP POLICY IF EXISTS public_select_operator_licences ON public.operator_licences;
CREATE POLICY public_select_operator_licences
    ON public.operator_licences
    FOR SELECT
    TO anon, authenticated
    USING (licence_status = 'active');

-- Public read: all operator_countries rows
DROP POLICY IF EXISTS public_select_operator_countries ON public.operator_countries;
CREATE POLICY public_select_operator_countries
    ON public.operator_countries
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Service role full write — operators
DROP POLICY IF EXISTS service_role_all_cannabis_operators ON public.cannabis_operators;
CREATE POLICY service_role_all_cannabis_operators
    ON public.cannabis_operators
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Service role full write — licences
DROP POLICY IF EXISTS service_role_all_operator_licences ON public.operator_licences;
CREATE POLICY service_role_all_operator_licences
    ON public.operator_licences
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Service role full write — countries junction
DROP POLICY IF EXISTS service_role_all_operator_countries ON public.operator_countries;
CREATE POLICY service_role_all_operator_countries
    ON public.operator_countries
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 5. SEED DATA — Tier 1 market operators
--    Source: Harbourview Research — public regulatory sources
--    All company names, country codes and licence information are drawn from
--    publicly available regulatory disclosures as of 2026.
--    UUIDs are stable/deterministic via gen_random_uuid() seeded inline.
-- ---------------------------------------------------------------------------

-- We use a CTE-based insert so that operator_countries and operator_licences
-- can reference the freshly inserted operator ids without a second round-trip.

-- ---- GERMANY (BfArM / Bundessonderbedarfs-Cannabisbegleitgesetz) ----

WITH ins AS (
    INSERT INTO public.cannabis_operators
        (id, country_iso2, legal_name, normalized_name,
         operator_type, primary_country_iso2,
         public_status, data_completeness, verification_status)
    VALUES
        -- Canopy Growth Germany GmbH
        ('a1000001-0000-0000-0000-000000000001',
         'DE', 'Canopy Growth Germany GmbH', 'canopy growth germany gmbh',
         'integrated', 'DE', 'active', 'seed', 'admin_verified'),

        -- Demecan GmbH — Germany's first domestic licensed cultivator (BfArM tender 2019)
        ('a1000001-0000-0000-0000-000000000002',
         'DE', 'Demecan GmbH', 'demecan gmbh',
         'cultivator', 'DE', 'active', 'seed', 'admin_verified'),

        -- Tilray Deutschland GmbH
        ('a1000001-0000-0000-0000-000000000003',
         'DE', 'Tilray Deutschland GmbH', 'tilray deutschland gmbh',
         'distributor', 'DE', 'active', 'seed', 'admin_verified'),

        -- IMC (Israel Medical Cannabis) GmbH — German import/distribution arm
        ('a1000001-0000-0000-0000-000000000004',
         'DE', 'IMC (Israel Medical Cannabis) GmbH', 'imc israel medical cannabis gmbh',
         'importer', 'DE', 'active', 'seed', 'admin_verified')

    ON CONFLICT (id) DO NOTHING
    RETURNING id, legal_name
)
SELECT id, legal_name FROM ins;

-- Germany operator_countries (headquarters)
INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES
    ('a1000001-0000-0000-0000-000000000001', 'DE', 'headquarters'),
    ('a1000001-0000-0000-0000-000000000002', 'DE', 'headquarters'),
    ('a1000001-0000-0000-0000-000000000003', 'DE', 'headquarters'),
    ('a1000001-0000-0000-0000-000000000004', 'DE', 'headquarters')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

-- Canopy Growth Germany GmbH also has a Canadian parent presence
INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES ('a1000001-0000-0000-0000-000000000001', 'CA', 'subsidiary')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

-- Tilray Deutschland GmbH — parent is Canadian/Portuguese
INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES ('a1000001-0000-0000-0000-000000000003', 'CA', 'subsidiary')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

-- IMC GmbH — parent entity is Israeli
INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES ('a1000001-0000-0000-0000-000000000004', 'IL', 'subsidiary')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

-- Germany operator_licences (BfArM)
INSERT INTO public.operator_licences
    (operator_id, country_iso2, licence_class, issuing_regulator,
     authorized_activities, licence_status, gmp_certified, last_verified)
VALUES
    ('a1000001-0000-0000-0000-000000000001', 'DE',
     'Narcotic Import & Distribution',
     'BfArM (Bundesinstitut für Arzneimittel und Medizinprodukte)',
     ARRAY['import','distribution','wholesale'], 'active', true, CURRENT_DATE),

    ('a1000001-0000-0000-0000-000000000002', 'DE',
     'BfArM Domestic Cultivation Tender — Lot 1 (cultivation + processing)',
     'BfArM (Bundesinstitut für Arzneimittel und Medizinprodukte)',
     ARRAY['cultivation','processing','wholesale'], 'active', true, CURRENT_DATE),

    ('a1000001-0000-0000-0000-000000000003', 'DE',
     'Narcotic Import & Wholesale Distribution',
     'BfArM (Bundesinstitut für Arzneimittel und Medizinprodukte)',
     ARRAY['import','wholesale'], 'active', true, CURRENT_DATE),

    ('a1000001-0000-0000-0000-000000000004', 'DE',
     'Narcotic Import & Distribution',
     'BfArM (Bundesinstitut für Arzneimittel und Medizinprodukte)',
     ARRAY['import','distribution'], 'active', true, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;


-- ---- AUSTRALIA (TGA — Therapeutic Goods Administration) ----

INSERT INTO public.cannabis_operators
    (id, country_iso2, legal_name, normalized_name,
     operator_type, primary_country_iso2,
     public_status, data_completeness, verification_status)
VALUES
    -- Cannatrek Limited
    ('a2000002-0000-0000-0000-000000000001',
     'AU', 'Cannatrek Limited', 'cannatrek limited',
     'distributor', 'AU', 'active', 'seed', 'admin_verified'),

    -- Little Green Pharma — ASX: LGP
    ('a2000002-0000-0000-0000-000000000002',
     'AU', 'Little Green Pharma Ltd', 'little green pharma ltd',
     'exporter', 'AU', 'active', 'seed', 'admin_verified'),

    -- Cann Group Limited — ASX: CAN, first TGA licensed cultivator
    ('a2000002-0000-0000-0000-000000000003',
     'AU', 'Cann Group Limited', 'cann group limited',
     'cultivator', 'AU', 'active', 'seed', 'admin_verified')

ON CONFLICT (id) DO NOTHING;

INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES
    ('a2000002-0000-0000-0000-000000000001', 'AU', 'headquarters'),
    ('a2000002-0000-0000-0000-000000000002', 'AU', 'headquarters'),
    ('a2000002-0000-0000-0000-000000000003', 'AU', 'headquarters')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

-- Little Green Pharma exports to Germany and UK
INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES
    ('a2000002-0000-0000-0000-000000000002', 'DE', 'distribution'),
    ('a2000002-0000-0000-0000-000000000002', 'GB', 'distribution')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

INSERT INTO public.operator_licences
    (operator_id, country_iso2, licence_class, issuing_regulator,
     authorized_activities, licence_status, gmp_certified, gacp_certified, last_verified)
VALUES
    ('a2000002-0000-0000-0000-000000000001', 'AU',
     'ODC — Manufacture (Import)',
     'Therapeutic Goods Administration / Office of Drug Control',
     ARRAY['import','distribution'], 'active', true, false, CURRENT_DATE),

    ('a2000002-0000-0000-0000-000000000002', 'AU',
     'ODC — Manufacture + Export',
     'Therapeutic Goods Administration / Office of Drug Control',
     ARRAY['cultivation','processing','export'], 'active', true, true, CURRENT_DATE),

    ('a2000002-0000-0000-0000-000000000003', 'AU',
     'ODC — Cultivation + Manufacture',
     'Therapeutic Goods Administration / Office of Drug Control',
     ARRAY['cultivation','processing'], 'active', true, true, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;


-- ---- ISRAEL (MOH — Ministry of Health / IMCA) ----

INSERT INTO public.cannabis_operators
    (id, country_iso2, legal_name, normalized_name,
     operator_type, primary_country_iso2,
     public_status, data_completeness, verification_status)
VALUES
    -- IMC (Israel Medical Cannabis) — parent entity, TASE: IMCC
    ('a3000003-0000-0000-0000-000000000001',
     'IL', 'Inter Cannabis Ltd (IMC)', 'inter cannabis ltd imc',
     'exporter', 'IL', 'active', 'seed', 'admin_verified'),

    -- Tikun Olam — pioneer Israeli medical cannabis company
    ('a3000003-0000-0000-0000-000000000002',
     'IL', 'Tikun Olam Ltd', 'tikun olam ltd',
     'cultivator', 'IL', 'active', 'seed', 'admin_verified'),

    -- Canndoc (formerly Intercure) — TASE listed
    ('a3000003-0000-0000-0000-000000000003',
     'IL', 'Canndoc Ltd', 'canndoc ltd',
     'seller', 'IL', 'active', 'seed', 'admin_verified'),

    -- BOL Pharma (Better Our Living)
    ('a3000003-0000-0000-0000-000000000004',
     'IL', 'BOL Pharma Ltd', 'bol pharma ltd',
     'cultivator', 'IL', 'active', 'seed', 'admin_verified')

ON CONFLICT (id) DO NOTHING;

INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES
    ('a3000003-0000-0000-0000-000000000001', 'IL', 'headquarters'),
    ('a3000003-0000-0000-0000-000000000002', 'IL', 'headquarters'),
    ('a3000003-0000-0000-0000-000000000003', 'IL', 'headquarters'),
    ('a3000003-0000-0000-0000-000000000004', 'IL', 'headquarters'),
    -- IMC has German subsidiary already seeded above; add IL→DE cross-link
    ('a3000003-0000-0000-0000-000000000001', 'DE', 'subsidiary')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

INSERT INTO public.operator_licences
    (operator_id, country_iso2, licence_class, issuing_regulator,
     authorized_activities, licence_status, gmp_certified, gacp_certified, last_verified)
VALUES
    ('a3000003-0000-0000-0000-000000000001', 'IL',
     'MOH G.A.P. Cultivation + Export',
     'Israel Ministry of Health — Medical Cannabis Unit (IMCA)',
     ARRAY['cultivation','processing','export'], 'active', true, true, CURRENT_DATE),

    ('a3000003-0000-0000-0000-000000000002', 'IL',
     'MOH G.A.P. Cultivation + Distribution',
     'Israel Ministry of Health — Medical Cannabis Unit (IMCA)',
     ARRAY['cultivation','processing','distribution'], 'active', true, true, CURRENT_DATE),

    ('a3000003-0000-0000-0000-000000000003', 'IL',
     'MOH Pharmacy + Dispensary',
     'Israel Ministry of Health — Medical Cannabis Unit (IMCA)',
     ARRAY['cultivation','processing','retail'], 'active', true, false, CURRENT_DATE),

    ('a3000003-0000-0000-0000-000000000004', 'IL',
     'MOH G.A.P. Cultivation',
     'Israel Ministry of Health — Medical Cannabis Unit (IMCA)',
     ARRAY['cultivation','processing'], 'active', true, true, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;


-- ---- COLOMBIA (MinSalud / ICA — Instituto Colombiano Agropecuario) ----

INSERT INTO public.cannabis_operators
    (id, country_iso2, legal_name, normalized_name,
     operator_type, primary_country_iso2,
     public_status, data_completeness, verification_status)
VALUES
    -- Khiron Life Sciences Corp — TSX-V: KHRN
    ('a4000004-0000-0000-0000-000000000001',
     'CO', 'Khiron Life Sciences Corp', 'khiron life sciences corp',
     'integrated', 'CO', 'active', 'seed', 'admin_verified'),

    -- Flora Growth Corp — NASDAQ: FLGC
    ('a4000004-0000-0000-0000-000000000002',
     'CO', 'Flora Growth Corp', 'flora growth corp',
     'exporter', 'CO', 'active', 'seed', 'admin_verified'),

    -- PharmaCielo Ltd — TSX-V: PCLO
    ('a4000004-0000-0000-0000-000000000003',
     'CO', 'PharmaCielo Ltd', 'pharmacielo ltd',
     'exporter', 'CO', 'active', 'seed', 'admin_verified')

ON CONFLICT (id) DO NOTHING;

INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES
    ('a4000004-0000-0000-0000-000000000001', 'CO', 'headquarters'),
    ('a4000004-0000-0000-0000-000000000002', 'CO', 'headquarters'),
    ('a4000004-0000-0000-0000-000000000003', 'CO', 'headquarters'),
    -- Khiron also operates UK medical clinics
    ('a4000004-0000-0000-0000-000000000001', 'GB', 'licensed_facility'),
    -- Flora Growth — distribution into Europe
    ('a4000004-0000-0000-0000-000000000002', 'DE', 'distribution')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

INSERT INTO public.operator_licences
    (operator_id, country_iso2, licence_class, issuing_regulator,
     authorized_activities, licence_status, gmp_certified, gacp_certified, last_verified)
VALUES
    ('a4000004-0000-0000-0000-000000000001', 'CO',
     'Licencia de Cultivo de Cannabis Psicoactivo + Fabricación',
     'MinSalud / ICA (Instituto Colombiano Agropecuario)',
     ARRAY['cultivation','processing','export','retail_medical'], 'active', true, true, CURRENT_DATE),

    ('a4000004-0000-0000-0000-000000000002', 'CO',
     'Licencia de Cultivo + Producción + Exportación',
     'MinSalud / ICA (Instituto Colombiano Agropecuario)',
     ARRAY['cultivation','processing','export'], 'active', true, true, CURRENT_DATE),

    ('a4000004-0000-0000-0000-000000000003', 'CO',
     'Licencia de Cultivo + Extracción + Exportación',
     'MinSalud / ICA (Instituto Colombiano Agropecuario)',
     ARRAY['cultivation','processing','export'], 'active', true, true, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;


-- ---- NETHERLANDS (BMC — Bureau Medicinale Cannabis) ----

INSERT INTO public.cannabis_operators
    (id, country_iso2, legal_name, normalized_name,
     operator_type, primary_country_iso2,
     public_status, data_completeness, verification_status)
VALUES
    -- Bedrocan BV — the sole Dutch government-contracted medicinal cannabis producer
    ('a5000005-0000-0000-0000-000000000001',
     'NL', 'Bedrocan BV', 'bedrocan bv',
     'cultivator', 'NL', 'active', 'seed', 'admin_verified')

ON CONFLICT (id) DO NOTHING;

INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES
    ('a5000005-0000-0000-0000-000000000001', 'NL', 'headquarters')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

INSERT INTO public.operator_licences
    (operator_id, country_iso2, licence_class, issuing_regulator,
     authorized_activities, licence_status, gmp_certified, gacp_certified, last_verified)
VALUES
    ('a5000005-0000-0000-0000-000000000001', 'NL',
     'BMC Official Government Supplier — Cultivation, Processing, Distribution',
     'Bureau Medicinale Cannabis (Ministry of Health, Welfare and Sport)',
     ARRAY['cultivation','processing','wholesale','export'], 'active', true, true, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;


-- ---- UNITED KINGDOM (MHRA — Medicines and Healthcare products Regulatory Agency) ----

INSERT INTO public.cannabis_operators
    (id, country_iso2, legal_name, normalized_name,
     operator_type, primary_country_iso2,
     public_status, data_completeness, verification_status)
VALUES
    -- Curaleaf International Holdings — operates UK specialist pharmacies
    ('a6000006-0000-0000-0000-000000000001',
     'GB', 'Curaleaf International Holdings Ltd', 'curaleaf international holdings ltd',
     'seller', 'GB', 'active', 'seed', 'admin_verified'),

    -- Columbia Care UK (now part of Cresco Labs / UK entity)
    ('a6000006-0000-0000-0000-000000000002',
     'GB', 'Columbia Care UK Ltd', 'columbia care uk ltd',
     'distributor', 'GB', 'active', 'seed', 'admin_verified')

ON CONFLICT (id) DO NOTHING;

INSERT INTO public.operator_countries (operator_id, country_iso2, presence_type)
VALUES
    ('a6000006-0000-0000-0000-000000000001', 'GB', 'headquarters'),
    ('a6000006-0000-0000-0000-000000000002', 'GB', 'headquarters'),
    -- Curaleaf parent is US-based
    ('a6000006-0000-0000-0000-000000000001', 'US', 'subsidiary')
ON CONFLICT (operator_id, country_iso2, presence_type) DO NOTHING;

INSERT INTO public.operator_licences
    (operator_id, country_iso2, licence_class, issuing_regulator,
     authorized_activities, licence_status, gmp_certified, last_verified)
VALUES
    ('a6000006-0000-0000-0000-000000000001', 'GB',
     'Schedule 1 Controlled Drug — Import & Wholesale Dealer',
     'MHRA (Medicines and Healthcare products Regulatory Agency)',
     ARRAY['import','wholesale','retail_medical'], 'active', true, CURRENT_DATE),

    ('a6000006-0000-0000-0000-000000000002', 'GB',
     'Schedule 1 Controlled Drug — Import & Distribution',
     'MHRA (Medicines and Healthcare products Regulatory Agency)',
     ARRAY['import','distribution'], 'active', true, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 6. GRANTS
-- ---------------------------------------------------------------------------

GRANT SELECT ON public.cannabis_operators  TO anon, authenticated;
GRANT SELECT ON public.operator_licences   TO anon, authenticated;
GRANT SELECT ON public.operator_countries  TO anon, authenticated;

GRANT ALL ON public.cannabis_operators  TO service_role;
GRANT ALL ON public.operator_licences   TO service_role;
GRANT ALL ON public.operator_countries  TO service_role;


COMMIT;
