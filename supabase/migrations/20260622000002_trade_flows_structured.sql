-- =============================================================================
-- Harbourview Cannabis Platform — Gap B Migration
-- Table: public.trade_flows
-- Description: Bilateral cannabis trade corridor intelligence: which country
--              pairs have active import/export relationships, under what legal
--              framework, and with what regulatory requirements (GMP, GACP,
--              permits, authorities).  Enables the "trade map" product layer.
-- Supabase project: zvxdgkukjrrwamdpqrg  (Postgres 17)
-- Author:  Harbourview Engineering
-- Created: 2026-06-22
-- Idempotent: yes (CREATE TABLE IF NOT EXISTS; ON CONFLICT DO NOTHING)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. TABLE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.trade_flows (
    id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
    origin_iso2         text        NOT NULL,
    destination_iso2    text        NOT NULL,
    flow_direction      text        NOT NULL
                            CHECK (flow_direction IN ('export','import','bilateral')),
    product_category    text        NOT NULL
                            CHECK (product_category IN (
                                'flower','extracts','oils','edibles',
                                'pharmaceutical_cannabinoids',
                                'hemp_fiber','hemp_seed','starting_material',
                                'seeds','other'
                            )),
    legal_status        text        NOT NULL DEFAULT 'unknown'
                            CHECK (legal_status IN (
                                'legal_permit_required','legal_no_permit',
                                'restricted','prohibited','unknown','under_review'
                            )),
    permit_required     boolean     NOT NULL DEFAULT true,
    permit_authority    text,           -- name of issuing regulator(s)
    purpose             text
                            CHECK (purpose IN (
                                'medical','scientific','industrial',
                                'adult_use','re_export','unknown'
                            )),
    gmp_required        boolean     NOT NULL DEFAULT false,
    gacp_required       boolean     NOT NULL DEFAULT false,
    key_requirements    text[]      NOT NULL DEFAULT '{}',
    notes               text,
    source_name         text,
    source_url          text,
    last_verified       date        NOT NULL DEFAULT CURRENT_DATE,
    confidence          text        NOT NULL DEFAULT 'medium'
                            CHECK (confidence IN ('high','medium','low')),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT trade_flows_pkey PRIMARY KEY (id),
    CONSTRAINT trade_flows_origin_fk
        FOREIGN KEY (origin_iso2)
        REFERENCES public.countries (iso_alpha2)
        ON DELETE RESTRICT,
    CONSTRAINT trade_flows_destination_fk
        FOREIGN KEY (destination_iso2)
        REFERENCES public.countries (iso_alpha2)
        ON DELETE RESTRICT,
    CONSTRAINT trade_flows_not_self_trade
        CHECK (origin_iso2 <> destination_iso2)
);

COMMENT ON TABLE public.trade_flows IS
    'Bilateral cannabis trade corridor intelligence: active and prohibited '
    'import/export relationships between country pairs, with regulatory '
    'framework, permit requirements, and GMP/GACP standards.';

COMMENT ON COLUMN public.trade_flows.flow_direction IS
    'export = origin ships to destination; import = destination pulls from origin; '
    'bilateral = documented in both directions simultaneously';
COMMENT ON COLUMN public.trade_flows.legal_status IS
    'legal_permit_required: trade is legal but export+import permits must be obtained. '
    'legal_no_permit: trade permitted without per-shipment permit. '
    'restricted: partial allowance with tight controls. '
    'prohibited: explicitly illegal under one or both jurisdictions. '
    'unknown: status not yet researched. under_review: regulatory status in flux.';
COMMENT ON COLUMN public.trade_flows.key_requirements IS
    'Array of plain-language requirements, e.g. '
    '{"GMP EU certification required","Single Convention Article 31 import cert","Certificate of Analysis per batch"}';
COMMENT ON COLUMN public.trade_flows.last_verified IS
    'Date the regulatory information was last confirmed against primary sources.';

-- ---------------------------------------------------------------------------
-- 2. INDEXES
-- ---------------------------------------------------------------------------

-- Primary lookup: all flows leaving or entering a given country pair
CREATE INDEX IF NOT EXISTS idx_trade_flows_origin_destination
    ON public.trade_flows (origin_iso2, destination_iso2);

-- Destination-only lookup: "what can enter Germany?"
CREATE INDEX IF NOT EXISTS idx_trade_flows_destination
    ON public.trade_flows (destination_iso2);

-- Filter by regulatory status across the whole table
CREATE INDEX IF NOT EXISTS idx_trade_flows_legal_status
    ON public.trade_flows (legal_status);

-- Filter by product category
CREATE INDEX IF NOT EXISTS idx_trade_flows_product_category
    ON public.trade_flows (product_category);

-- ---------------------------------------------------------------------------
-- 3. UPDATED_AT TRIGGER
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_trade_flows_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trade_flows_updated_at ON public.trade_flows;
CREATE TRIGGER trg_trade_flows_updated_at
    BEFORE UPDATE ON public.trade_flows
    FOR EACH ROW
    EXECUTE FUNCTION public.set_trade_flows_updated_at();

-- ---------------------------------------------------------------------------
-- 4. ROW-LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE public.trade_flows ENABLE ROW LEVEL SECURITY;

-- Public SELECT: trade corridor data is openly readable (no data_type filter needed here)
DROP POLICY IF EXISTS trade_flows_public_read ON public.trade_flows;
CREATE POLICY trade_flows_public_read
    ON public.trade_flows
    FOR SELECT
    TO public
    USING (true);

-- Service role: full write access
DROP POLICY IF EXISTS trade_flows_service_write ON public.trade_flows;
CREATE POLICY trade_flows_service_write
    ON public.trade_flows
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 5. SEED DATA — Known active and prohibited trade corridors
-- Sources: Health Canada export framework, BfArM import guidance (§3 BtMG),
--          TGA import/export rules, MHRA licence conditions, Colombia MinSalud
--          Decreto 613/2017, Lesotho MoH, INCB Single Convention Article 31,
--          Medsafe NZ import schedule.
-- Source label: 'Harbourview Research — regulatory intelligence'
-- last_verified: 2025-01-01 for all seed rows
-- ---------------------------------------------------------------------------

INSERT INTO public.trade_flows (
    origin_iso2, destination_iso2,
    flow_direction, product_category,
    legal_status, permit_required, permit_authority,
    purpose,
    gmp_required, gacp_required,
    key_requirements,
    notes,
    source_name,
    last_verified, confidence
)
VALUES

-- ── CA → DE : flower ──────────────────────────────────────────────────────
-- Canada is Germany's single largest supplier of medical cannabis by volume.
-- Requires EU-GMP certification by German authority + GACP farm certification.
(
    'CA', 'DE',
    'export', 'flower',
    'legal_permit_required', true, 'BfArM/Health Canada',
    'medical',
    true, true,
    ARRAY[
        'EU-GMP certification for Canadian facility required',
        'GACP certification for cultivation site required',
        'BfArM narcotics import permit per shipment (§3 BtMG)',
        'Health Canada cannabis export licence',
        'Single Convention Article 31 import/export authorisations',
        'Certificate of Analysis (CoA) per batch',
        'Phytosanitary certificate not required for processed flower'
    ],
    'Canada is the primary supplier of GMP medical cannabis to Germany. '
    'EU-GMP audits conducted by German state authority (Landesbehörde).',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── CA → UK : extracts ────────────────────────────────────────────────────
(
    'CA', 'GB',
    'export', 'extracts',
    'legal_permit_required', true, 'MHRA/Health Canada',
    'medical',
    true, false,
    ARRAY[
        'MHRA Schedule 2 import licence required',
        'Health Canada cannabis export licence',
        'EU-GMP or equivalent recognised standard (MHRA assessed)',
        'MHRA import declaration per consignment',
        'CoA and batch records required'
    ],
    'Post-Brexit MHRA maintains own import licensing. UK recognises Health Canada '
    'GMP but may require MHRA desktop review for new suppliers.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── CA → UK : pharmaceutical_cannabinoids ─────────────────────────────────
(
    'CA', 'GB',
    'export', 'pharmaceutical_cannabinoids',
    'legal_permit_required', true, 'MHRA/Health Canada',
    'medical',
    true, false,
    ARRAY[
        'MHRA Schedule 2 import licence required',
        'Health Canada cannabis export licence',
        'Full ICH Q7 API GMP compliance expected for pharmaceutical cannabinoids',
        'CoA and batch records required'
    ],
    'Pharmaceutical-grade cannabinoids (e.g. CBD API, THC API) require '
    'stricter ICH Q7 GMP compliance beyond standard cannabis GMP.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── CA → AU : flower ──────────────────────────────────────────────────────
(
    'CA', 'AU',
    'export', 'flower',
    'legal_permit_required', true, 'TGA/Health Canada',
    'medical',
    true, false,
    ARRAY[
        'TGA import permit required (Therapeutic Goods Act 1989)',
        'TGA ODC import licence for importer',
        'Health Canada cannabis export licence',
        'Australian GMP licence (PIC/S standard) or TGA recognition of Canadian GMP',
        'CoA per batch; TGA may require independent Australian lab testing',
        'ARTG listing or TGA SAS-B pathway approval for product'
    ],
    'Australia requires TGA-recognised GMP. Canada and Australia have bilateral '
    'GMP recognition arrangements under PIC/S membership, streamlining approvals.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── CA → AU : oils ────────────────────────────────────────────────────────
(
    'CA', 'AU',
    'export', 'oils',
    'legal_permit_required', true, 'TGA/Health Canada',
    'medical',
    true, false,
    ARRAY[
        'TGA import permit required',
        'TGA ODC import licence',
        'Health Canada cannabis export licence',
        'PIC/S GMP compliance',
        'ARTG listing or TGA SAS-B approval',
        'CoA per batch'
    ],
    NULL,
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── CA → IL : flower ──────────────────────────────────────────────────────
(
    'CA', 'IL',
    'export', 'flower',
    'legal_permit_required', true, 'MOH Israel/Health Canada',
    'medical',
    true, false,
    ARRAY[
        'Israeli MOH import licence for medical cannabis',
        'Health Canada cannabis export licence',
        'IMC-GAP (Israeli equivalent of GACP) or GACP certification',
        'IMC-GMP or EU-GMP certification for post-harvest processing',
        'Single Convention Article 31 authorisations',
        'CoA per batch; Israeli lab verification may be required'
    ],
    'Israel operates its own cannabis regulatory framework (IMC). '
    'Canadian exporters require IMC-GMP certification recognised by MOH Israel.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'medium'
),

-- ── CO → DE : flower ──────────────────────────────────────────────────────
(
    'CO', 'DE',
    'export', 'flower',
    'legal_permit_required', true, 'BfArM/Colombia MinSalud',
    'medical',
    true, true,
    ARRAY[
        'EU-GMP certification for Colombian facility (Invima-audited)',
        'GACP certification for Colombian farms',
        'BfArM narcotics import permit (§3 BtMG)',
        'Colombia MinSalud/Invima export licence under Decree 613/2017',
        'Single Convention Article 31 export/import authorisations',
        'CoA per batch; phytosanitary certificate'
    ],
    'Colombia is a fast-growing EU exporter. Invima-issued GMP certificates '
    'are accepted by BfArM. GACP audits conducted by German-accredited bodies.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── CO → DE : oils ────────────────────────────────────────────────────────
(
    'CO', 'DE',
    'export', 'oils',
    'legal_permit_required', true, 'BfArM/Colombia MinSalud',
    'medical',
    true, false,
    ARRAY[
        'EU-GMP certification for Colombian extraction/manufacturing facility',
        'BfArM narcotics import permit',
        'Colombia MinSalud/Invima export licence',
        'Single Convention Article 31 authorisations',
        'CoA per batch'
    ],
    NULL,
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── CO → UK : oils ────────────────────────────────────────────────────────
(
    'CO', 'GB',
    'export', 'oils',
    'legal_permit_required', true, 'MHRA/Colombia MinSalud',
    'medical',
    false, false,
    ARRAY[
        'MHRA Schedule 2 import licence',
        'Colombia MinSalud/Invima export licence',
        'MHRA-recognised GMP (EU-GMP or equivalent)',
        'CoA per batch'
    ],
    'UK has become an emerging market for Colombian cannabis oil exports, '
    'particularly full-spectrum and broad-spectrum CBD-rich oils.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'medium'
),

-- ── LS → DE : flower ──────────────────────────────────────────────────────
-- Lesotho is one of Africa's leading cannabis exporters and a significant EU supplier.
(
    'LS', 'DE',
    'export', 'flower',
    'legal_permit_required', true, 'BfArM/Lesotho MoH',
    'medical',
    true, true,
    ARRAY[
        'EU-GMP certification for Lesotho processing facility',
        'GACP certification for Lesotho cultivation (high-altitude outdoor)',
        'BfArM narcotics import permit (§3 BtMG)',
        'Lesotho MoH export permit under Cannabis Industry Regulation 2020',
        'Single Convention Article 31 authorisations',
        'CoA per batch; phytosanitary certificate'
    ],
    'Lesotho was among the first African nations to legalise medical cannabis '
    'cultivation (2017). Altitude and climate produce competitive GACP flower. '
    'Several facilities have achieved EU-GMP certification.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── MK → DE : flower ──────────────────────────────────────────────────────
-- North Macedonia supplies GMP flower to Germany via EU proximity.
(
    'MK', 'DE',
    'export', 'flower',
    'legal_permit_required', true, 'BfArM/North Macedonia Agency for Medicines and Medical Devices',
    'medical',
    true, false,
    ARRAY[
        'EU-GMP certification (MK is EU candidate state; EU-GMP accepted)',
        'BfArM narcotics import permit (§3 BtMG)',
        'North Macedonia MALMED export authorisation',
        'Single Convention Article 31 authorisations',
        'CoA per batch'
    ],
    'North Macedonia has issued licences to several cultivators/processors '
    'for medical cannabis export, primarily targeting the German market.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'medium'
),

-- ── PT → DE : flower ──────────────────────────────────────────────────────
-- Portugal is a growing EU intra-bloc cannabis supplier.
(
    'PT', 'DE',
    'export', 'flower',
    'legal_permit_required', true, 'BfArM/Infarmed',
    'medical',
    true, false,
    ARRAY[
        'EU-GMP certification (Infarmed-issued; intra-EU)',
        'BfArM narcotics import permit (§3 BtMG)',
        'Infarmed export licence under Decreto-Lei 8/2019',
        'Single Convention Article 31 authorisations',
        'CoA per batch'
    ],
    'Intra-EU trade; Single Convention requirements still apply for narcotic substances. '
    'Portugal has licensed multiple cultivators for EU export since 2019.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'medium'
),

-- ── NL → DE : flower ──────────────────────────────────────────────────────
-- Netherlands Bureau for Medicinal Cannabis (BMC) is a state GMP producer.
(
    'NL', 'DE',
    'export', 'flower',
    'legal_permit_required', true, 'BfArM/Bureau Medicinale Cannabis',
    'medical',
    true, false,
    ARRAY[
        'EU-GMP certification (Dutch Bureau Medicinale Cannabis; state monopoly)',
        'BfArM narcotics import permit (§3 BtMG)',
        'BMC export authorisation (intra-EU Schengen Article 75 procedure)',
        'Single Convention Article 31 authorisations',
        'CoA per batch'
    ],
    'The Dutch BMC (Bureau voor Medicinale Cannabis) is a government-controlled '
    'GMP producer. Intra-EU trade but narcotics controls still apply.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── AU → NZ : oils ────────────────────────────────────────────────────────
(
    'AU', 'NZ',
    'export', 'oils',
    'legal_permit_required', true, 'Medsafe/TGA',
    'medical',
    true, false,
    ARRAY[
        'Medsafe import licence (Medicines Act 1981, Schedule 3)',
        'TGA export permit',
        'PIC/S GMP compliance (recognised bilaterally AU/NZ)',
        'CoA per batch; Medsafe may require NZ lab verification',
        'Prescriber Special Authority or Medsafe approval for product'
    ],
    'Australia and New Zealand have close regulatory alignment under the '
    'Trans-Tasman Mutual Recognition Arrangement (TTMRA), easing GMP '
    'recognition, though separate import licences are still required.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
),

-- ── IL → DE : pharmaceutical_cannabinoids ─────────────────────────────────
-- Israel exports pharmaceutical-grade cannabinoids (e.g. synthetic THC API).
(
    'IL', 'DE',
    'export', 'pharmaceutical_cannabinoids',
    'legal_permit_required', true, 'BfArM/MOH Israel',
    'medical',
    true, false,
    ARRAY[
        'EU-GMP or ICH Q7 API GMP certification for Israeli manufacturer',
        'BfArM narcotics import permit (§3 BtMG)',
        'MOH Israel export licence',
        'Single Convention Article 31 authorisations',
        'Drug Master File (DMF) or ASMF submission to BfArM',
        'CoA per batch'
    ],
    'Israel has a significant pharmaceutical industry and exports both '
    'botanical cannabinoids and synthetic pharmaceutical cannabinoids. '
    'Pharmaceutical-grade flows require API GMP and DMF filing.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'medium'
),

-- ── US → CA : PROHIBITED ──────────────────────────────────────────────────
-- Cannabis remains federally Schedule I in the US; cross-border shipment illegal.
(
    'US', 'CA',
    'export', 'flower',
    'prohibited', false, NULL,
    'adult_use',
    false, false,
    ARRAY[
        'Cannabis is Schedule I under the US Controlled Substances Act (21 U.S.C. §812)',
        'Federal law prohibits cross-border export regardless of state legalisation',
        'CBSA seizure and criminal prosecution risk for importers',
        'Canada Border Services Agency (CBSA) enforces prohibition at ports of entry'
    ],
    'Cannabis remains Schedule I federally in the United States; cross-border '
    'shipment to Canada is illegal under both US federal law and Canadian CBSA '
    'enforcement policy. State-level legalisation provides no federal export authority.',
    'Harbourview Research — regulatory intelligence',
    '2025-01-01', 'high'
)

ON CONFLICT DO NOTHING;

COMMIT;
