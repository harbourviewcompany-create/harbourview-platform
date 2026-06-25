CREATE TABLE IF NOT EXISTS public.market_metrics (
    id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
    country_iso2        text        NOT NULL,
    metric_name         text        NOT NULL,
    metric_value        numeric     NOT NULL,
    metric_unit         text        NOT NULL,
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
    CONSTRAINT market_metrics_country_fk FOREIGN KEY (country_iso2) REFERENCES public.countries (iso_alpha2) ON DELETE CASCADE,
    CONSTRAINT market_metrics_period_check CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS idx_market_metrics_country_metric_period ON public.market_metrics (country_iso2, metric_name, period_start);
CREATE INDEX IF NOT EXISTS idx_market_metrics_metric_period ON public.market_metrics (metric_name, period_start);
CREATE INDEX IF NOT EXISTS idx_market_metrics_country_data_type ON public.market_metrics (country_iso2, data_type);

CREATE OR REPLACE FUNCTION public.set_market_metrics_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_market_metrics_updated_at ON public.market_metrics;
CREATE TRIGGER trg_market_metrics_updated_at BEFORE UPDATE ON public.market_metrics FOR EACH ROW EXECUTE FUNCTION public.set_market_metrics_updated_at();

ALTER TABLE public.market_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS market_metrics_public_read ON public.market_metrics;
CREATE POLICY market_metrics_public_read ON public.market_metrics FOR SELECT TO public USING (data_type IN ('observed', 'estimated'));
DROP POLICY IF EXISTS market_metrics_service_write ON public.market_metrics;
CREATE POLICY market_metrics_service_write ON public.market_metrics FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.market_metrics (country_iso2, metric_name, metric_value, metric_unit, period_start, period_end, period_granularity, data_type, confidence_band, source_name) VALUES
('CA','legal_sales_usd',5100000000,'USD','2024-01-01','2024-12-31','annual','observed','high','Harbourview Research'),
('CA','patient_count',400000,'count','2024-01-01','2024-12-31','annual','observed','high','Harbourview Research'),
('CA','store_count',3800,'count','2024-01-01','2024-12-31','annual','observed','high','Harbourview Research'),
('CA','export_volume_kg',8000,'kg','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('DE','medical_sales_usd',600000000,'USD','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('DE','patient_count',200000,'count','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('US','adult_use_sales_usd',30000000000,'USD','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('US','store_count',15000,'count','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('AU','medical_sales_usd',280000000,'USD','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('AU','patient_count',350000,'count','2024-01-01','2024-12-31','annual','observed','high','Harbourview Research'),
('IL','medical_sales_usd',400000000,'USD','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('IL','patient_count',120000,'count','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('NL','store_count',570,'count','2024-01-01','2024-12-31','annual','observed','high','Harbourview Research'),
('TH','store_count',8000,'count','2024-01-01','2024-12-31','annual','estimated','low','Harbourview Research'),
('CO','export_volume_kg',25000,'kg','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('CO','cultivation_area_ha',2000,'ha','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('UY','adult_use_sales_usd',40000000,'USD','2024-01-01','2024-12-31','annual','observed','high','Harbourview Research'),
('UY','store_count',17,'count','2024-01-01','2024-12-31','annual','observed','high','Harbourview Research'),
('MT','medical_sales_usd',5000000,'USD','2024-01-01','2024-12-31','annual','estimated','low','Harbourview Research'),
('GB','medical_sales_usd',150000000,'USD','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research'),
('GB','patient_count',40000,'count','2024-01-01','2024-12-31','annual','estimated','medium','Harbourview Research')
ON CONFLICT DO NOTHING;
