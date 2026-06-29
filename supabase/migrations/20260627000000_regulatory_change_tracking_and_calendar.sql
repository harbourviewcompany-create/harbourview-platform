-- Regulatory field-level change tracking and forward-looking calendar
-- Applied 2026-06-27 to Supabase project zvxdgdkukjrrwamdpqrg

-- ── Change log table ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.regulatory_field_changes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name    text        NOT NULL,
  record_id     text        NOT NULL,
  iso2          char(2)     NOT NULL,
  field_name    text        NOT NULL,
  old_value     text,
  new_value     text,
  changed_at    timestamptz NOT NULL DEFAULT now(),
  source_label  text
);

CREATE INDEX IF NOT EXISTS idx_rfc_iso2_changed_at ON public.regulatory_field_changes (iso2, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_rfc_table_record    ON public.regulatory_field_changes (table_name, record_id);

ALTER TABLE public.regulatory_field_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read regulatory_field_changes"
  ON public.regulatory_field_changes FOR SELECT USING (true);

-- ── Regulatory calendar table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.regulatory_calendar (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  iso2            char(2)     NOT NULL,
  event_type      text        NOT NULL DEFAULT 'regulatory_update',
  title           text        NOT NULL,
  summary         text,
  expected_date   date,
  confidence      text        NOT NULL DEFAULT 'medium',
  source_url      text,
  source_label    text,
  status          text        NOT NULL DEFAULT 'upcoming',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rc_iso2_expected_date ON public.regulatory_calendar (iso2, expected_date ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_rc_status             ON public.regulatory_calendar (status);

ALTER TABLE public.regulatory_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read regulatory_calendar"
  ON public.regulatory_calendar FOR SELECT USING (true);

-- ── Trigger: track countries field changes ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.trg_track_country_field_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _fields text[] := ARRAY[
    'market_access_status','import_status','export_status',
    'medical_status','adult_use_status','opportunity_score',
    'regulatory_risk_score','data_completeness'
  ];
  _f text;
  _old text; _new text;
BEGIN
  FOREACH _f IN ARRAY _fields LOOP
    _old := to_jsonb(OLD) ->> _f;
    _new := to_jsonb(NEW) ->> _f;
    IF _old IS DISTINCT FROM _new THEN
      INSERT INTO public.regulatory_field_changes
        (table_name, record_id, iso2, field_name, old_value, new_value)
      VALUES
        ('countries', NEW.id::text, NEW.iso2, _f, _old, _new);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_country_field_changes ON public.countries;
CREATE TRIGGER trg_country_field_changes
  AFTER UPDATE ON public.countries
  FOR EACH ROW EXECUTE FUNCTION public.trg_track_country_field_changes();

-- ── Trigger: track cc_jurisdiction_briefings field changes ────────────────────

CREATE OR REPLACE FUNCTION public.trg_track_briefing_field_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _fields text[] := ARRAY[
    'program_status','regulatory_body','regulatory_outlook',
    'commercial_pathway_summary','briefing_program_status',
    'briefing_regulatory_body','briefing_regulatory_outlook'
  ];
  _f text;
  _old text; _new text;
BEGIN
  FOREACH _f IN ARRAY _fields LOOP
    _old := to_jsonb(OLD) ->> _f;
    _new := to_jsonb(NEW) ->> _f;
    IF _old IS DISTINCT FROM _new THEN
      INSERT INTO public.regulatory_field_changes
        (table_name, record_id, iso2, field_name, old_value, new_value)
      VALUES
        ('cc_jurisdiction_briefings', NEW.id::text, NEW.country_iso2, _f, _old, _new);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_briefing_field_changes ON public.cc_jurisdiction_briefings;
CREATE TRIGGER trg_briefing_field_changes
  AFTER UPDATE ON public.cc_jurisdiction_briefings
  FOR EACH ROW EXECUTE FUNCTION public.trg_track_briefing_field_changes();

-- ── RPCs ──────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_field_changes_for_country(
  p_iso2  text,
  p_limit int DEFAULT 20
)
RETURNS SETOF public.regulatory_field_changes
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT * FROM public.regulatory_field_changes
  WHERE iso2 = upper(p_iso2)
  ORDER BY changed_at DESC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.get_regulatory_calendar(
  p_iso2  text DEFAULT NULL,
  p_limit int  DEFAULT 30
)
RETURNS SETOF public.regulatory_calendar
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT * FROM public.regulatory_calendar
  WHERE (p_iso2 IS NULL OR iso2 = upper(p_iso2))
    AND status = 'upcoming'
  ORDER BY expected_date ASC NULLS LAST
  LIMIT p_limit;
$$;
