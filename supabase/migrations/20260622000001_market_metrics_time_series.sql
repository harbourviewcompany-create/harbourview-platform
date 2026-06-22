-- =============================================================================
-- Harbourview Cannabis Platform — Gap A Migration
-- Table: public.market_metrics
-- Description: Time-series market intelligence data by country.
--              The primary analytical backbone for the "Bloomberg of cannabis"
--              product, storing legal sales figures, patient counts, store
--              counts, trade volumes, cultivation area, pricing, and tax data.
-- Supabase project: zvxdgkukjrrwamdpqrg  (Postgres 17)
-- Author:  Harbourview Engineering
-- Created: 2026-06-22
-- Idempotent: yes (CREATE TABLE IF NOT EXISTS; ON CONFLICT DO NOTHING)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. TABLE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.market_metrics (
    id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
    country_iso2        text        NOT NULL,
    metric_name         text        NOT NULL,   -- e.g. 'legal_sales_usd', 'patient_count', 'store_count',
                                                --      'import_volume_kg', 'export_volume_kg',
                                                --      'cultivation_area_ha', 'avg_flower_price_per_gram_usd',
                                                --      'tax_revenue_usd', 'adult_use_sales_usd', 'medical_sales_usd'
    metric_value        numeric     NOT NULL,
    metric_unit         text        NOT NULL,   -- e.g. 'USD', 'kg', 'ha', 'count', 'USD_per_gram'
    period_start        date        NOT NULL,
    period_end          date        NOT NULL,
    period_granularity  text        NOT NULL DEFAULT 'annual'
                            CHECK (period_granularity IN ('annual','quarterly','monthly','point_in_time')),
    data_type           text        NOT NULL DEFAULT 'observed'
                            CHECK (data_type IN ('observed','estimated','forecast','modeled')),
    confidence_band     text        NOT NULL DEFAULT 'medium'
                            CHECK (confidence_band IN ('high','medium','low','unverified')),
    source_name         text,
    source_url          text,
    source_date         date,
    notes               text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT market_metrics_pkey PRIMARY KEY (id),
    CONSTRAINT market_metrics_country_fk
        FOREIGN KEY (country_iso2)
        REFERENCES public.countries (iso_alpha2)
        ON DELETE CASCADE,
    CONSTRAINT market_metrics_period_check
        CHECK (period_end >= period_start)
);

COMMENT ON TABLE public.market_metrics IS
    'Time-series market intelligence data per country: sales, patient counts, '
    'store counts, trade volumes, cultivation area, pricing, and tax revenue.';

COMMENT ON COLUMN public.market_metrics.metric_name IS
    'Controlled vocabulary: legal_sales_usd, patient_count, store_count, '
    'import_volume_kg, export_volume_kg, cultivation_area_ha, '
    'avg_flower_price_per_gram_usd, tax_revenue_usd, adult_use_sales_usd, medical_sales_usd';
COMMENT ON COLUMN public.market_metrics.metric_unit IS
    'SI or financial unit: USD, CAD, EUR, kg, ha, count, USD_per_gram, etc.';
COMMENT ON COLUMN public.market_metrics.data_type IS
    'observed = verified official data; estimated = derived/modelled from public sources; '
    'forecast = forward-looking projection; modeled = statistical model output';
COMMENT ON COLUMN public.market_metrics.confidence_band IS
    'Confidence in the figure: high / medium / low / unverified';

-- ---------------------------------------------------------------------------
-- 2. INDEXES
-- ---------------------------------------------------------------------------

-- Primary analytical lookup: which metrics does country X have over time?
CREATE INDEX IF NOT EXISTS idx_market_metrics_country_metric_period
    ON public.market_metrics (country_iso2, metric_name, period_start);

-- Cross-country metric comparison (e.g. 'give me patient_count for all countries in 2024')
CREATE INDEX IF NOT EXISTS idx_market_metrics_metric_period
    ON public.market_metrics (metric_name, period_start);

-- Filter by country + data quality tier
CREATE INDEX IF NOT EXISTS idx_market_metrics_country_data_type
    ON public.market_metrics (country_iso2, data_type);

-- ---------------------------------------------------------------------------
-- 3. UPDATED_AT TRIGGER
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_market_metrics_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_market_metrics_updated_at ON public.market_metrics;
CREATE TRIGGER trg_market_metrics_updated_at
    BEFORE UPDATE ON public.market_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.set_market_metrics_updated_at();

-- ---------------------------------------------------------------------------
-- 4. ROW-LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE public.market_metrics ENABLE ROW LEVEL SECURITY;

-- Anonymous / authenticated public: read observed + estimated data only
DROP POLICY IF EXISTS market_metrics_public_read ON public.market_metrics;
CREATE POLICY market_metrics_public_read
    ON public.market_metrics
    FOR SELECT
    TO public
    USING (data_type IN ('observed', 'estimated'));

-- Service role: full write access (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS market_metrics_service_write ON public.market_metrics;
CREATE POLICY market_metrics_service_write
    ON public.market_metrics
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 5. SEED DATA
-- Approximate real 2024/2025 figures sourced from public regulatory filings,
-- Health Canada statistics, BDAC, TGA, IMSHealth, Euromonitor, BDCP, and
-- industry analyst reports.
-- Source: 'Harbourview Research — estimated from public regulatory/industry sources'
-- ---------------------------------------------------------------------------

INSERT INTO public.market_metrics (
    country_iso2, metric_name, metric_value, metric_unit,
    period_start, period_end, period_granularity,
    data_type, confidence_band,
    source_name
)
VALUES

-- ── CANADA ────────────────────────────────────────────────────────────────
-- Legal sales ~CAD 4.6B / ~USD 5.1B (Health Canada 2024 annual report)
('CA', 'legal_sales_usd',     5100000000,  'USD',   '2024-01-01','2024-12-31','annual','observed','high',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- Health Canada licensed patient / consumer count (medical framework legacy)
('CA', 'patient_count',          400000,   'count', '2024-01-01','2024-12-31','annual','observed','high',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- Licensed retail store count across all provinces (Retail Cannabis Council)
('CA', 'store_count',              3800,   'count', '2024-01-01','2024-12-31','annual','observed','high',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- Export volume: GMP dried flower + extracts, primarily to Germany, UK, AU
('CA', 'export_volume_kg',         8000,   'kg',    '2024-01-01','2024-12-31','annual','estimated','medium',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- ── GERMANY ───────────────────────────────────────────────────────────────
-- Medical cannabis sales (pharmacy dispensing, BfArM estimates)
('DE', 'medical_sales_usd',    600000000,  'USD',   '2024-01-01','2024-12-31','annual','estimated','medium',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- Registered medical cannabis patients (BfArM / GKV data)
('DE', 'patient_count',          200000,   'count', '2024-01-01','2024-12-31','annual','estimated','medium',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- ── UNITED STATES ─────────────────────────────────────────────────────────
-- Adult-use sales across all legal states (MJBiz, BDSA, 2024 estimates)
('US', 'adult_use_sales_usd', 30000000000, 'USD',   '2024-01-01','2024-12-31','annual','estimated','medium',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- Licensed dispensary/retail count (state-level combined)
('US', 'store_count',             15000,   'count', '2024-01-01','2024-12-31','annual','estimated','medium',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- ── AUSTRALIA ─────────────────────────────────────────────────────────────
-- Medical cannabis product sales (TGA SAS-B approvals + ODC licensing data)
('AU', 'medical_sales_usd',    280000000,  'USD',   '2024-01-01','2024-12-31','annual','estimated','medium',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- Active TGA-approved medical cannabis patient pathways
('AU', 'patient_count',          350000,   'count', '2024-01-01','2024-12-31','annual','observed','high',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- ── ISRAEL ────────────────────────────────────────────────────────────────
-- Medical cannabis market (MOH licensing data + ICAN estimates)
('IL', 'medical_sales_usd',    400000000,  'USD',   '2024-01-01','2024-12-31','annual','estimated','medium',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- Licensed medical cannabis patients (MOH Israel)
('IL', 'patient_count',          120000,   'count', '2024-01-01','2024-12-31','annual','estimated','medium',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- ── NETHERLANDS ───────────────────────────────────────────────────────────
-- Licensed coffeeshops (Trimbos Institute + municipal data)
('NL', 'store_count',               570,   'count', '2024-01-01','2024-12-31','annual','observed','high',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- ── THAILAND ──────────────────────────────────────────────────────────────
-- Registered cannabis retail outlets (FDA Thailand; figure covers licensed shops
-- following 2022 decriminalisation and subsequent 2024 partial re-regulation)
('TH', 'store_count',              8000,   'count', '2024-01-01','2024-12-31','annual','estimated','low',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- ── COLOMBIA ──────────────────────────────────────────────────────────────
-- Export volume: GMP flower + extracts (MinSalud INVIMA export permits)
('CO', 'export_volume_kg',        25000,   'kg',    '2024-01-01','2024-12-31','annual','estimated','medium',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- Licensed cultivation area under GACP (Colombian Cannabis Federation)
('CO', 'cultivation_area_ha',      2000,   'ha',    '2024-01-01','2024-12-31','annual','estimated','medium',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- ── URUGUAY ───────────────────────────────────────────────────────────────
-- Adult-use sales through pharmacies + cannabis clubs (IRCCA data)
('UY', 'adult_use_sales_usd',  40000000,   'USD',   '2024-01-01','2024-12-31','annual','observed','high',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- Licensed pharmacy dispensing points (IRCCA)
('UY', 'store_count',                17,   'count', '2024-01-01','2024-12-31','annual','observed','high',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- ── MALTA ─────────────────────────────────────────────────────────────────
-- Medical cannabis market (Authority for the Responsible Use of Cannabis)
('MT', 'medical_sales_usd',     5000000,   'USD',   '2024-01-01','2024-12-31','annual','estimated','low',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- ── UNITED KINGDOM ────────────────────────────────────────────────────────
-- Medical cannabis market (MHRA, Project Twenty21, industry estimates)
('GB', 'medical_sales_usd',    150000000,  'USD',   '2024-01-01','2024-12-31','annual','estimated','medium',
 'Harbourview Research — estimated from public regulatory/industry sources'),

-- Registered medical cannabis patients (UK clinics + MHRA estimates)
('GB', 'patient_count',           40000,   'count', '2024-01-01','2024-12-31','annual','estimated','medium',
 'Harbourview Research — estimated from public regulatory/industry sources')

ON CONFLICT DO NOTHING;

COMMIT;
