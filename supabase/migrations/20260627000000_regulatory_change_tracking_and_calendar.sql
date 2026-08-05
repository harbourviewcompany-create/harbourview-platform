-- supabase/migrations/20260627000000_regulatory_change_tracking_and_calendar.sql
-- REWRITTEN 2026-07-01 (reconciliation): this version is registered in the prod
-- ledger; the objects below were created in prod out-of-band around Jun 27 with a
-- DIFFERENT design than this file originally described (row_id text key instead of
-- iso2+record_id). This file now mirrors prod truth exactly. It never re-applies to
-- prod (ledger-registered) and is a faithful record for fresh environments.

CREATE TABLE IF NOT EXISTS public.regulatory_field_changes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name   text        NOT NULL,
  row_id       text        NOT NULL,
  field_name   text        NOT NULL,
  old_value    text,
  new_value    text,
  changed_at   timestamptz NOT NULL DEFAULT now(),
  source_label text
);

CREATE INDEX IF NOT EXISTS idx_rfc_table_row_changed
  ON public.regulatory_field_changes (table_name, row_id, changed_at DESC);

CREATE TABLE IF NOT EXISTS public.regulatory_calendar (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  iso2          text        NOT NULL,
  event_type    text        NOT NULL,
  title         text        NOT NULL,
  summary       text,
  expected_date date,
  confidence    text        NOT NULL DEFAULT 'low',
  source_url    text,
  source_label  text,
  status        text        NOT NULL DEFAULT 'upcoming',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rc_iso2_expected_date
  ON public.regulatory_calendar (iso2, expected_date ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_rc_status
  ON public.regulatory_calendar (status);

-- Change-tracking triggers (mirrors prod implementations exactly)

CREATE OR REPLACE FUNCTION public.trg_track_country_field_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE v_iso2 text := NEW.iso_alpha2; BEGIN
  IF OLD.market_access_status::text IS DISTINCT FROM NEW.market_access_status::text THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('countries',v_iso2,'market_access_status',OLD.market_access_status::text,NEW.market_access_status::text);
  END IF;
  IF OLD.medical_status::text IS DISTINCT FROM NEW.medical_status::text THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('countries',v_iso2,'medical_status',OLD.medical_status::text,NEW.medical_status::text);
  END IF;
  IF OLD.adult_use_status::text IS DISTINCT FROM NEW.adult_use_status::text THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('countries',v_iso2,'adult_use_status',OLD.adult_use_status::text,NEW.adult_use_status::text);
  END IF;
  IF OLD.import_status::text IS DISTINCT FROM NEW.import_status::text THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('countries',v_iso2,'import_status',OLD.import_status::text,NEW.import_status::text);
  END IF;
  IF OLD.export_status::text IS DISTINCT FROM NEW.export_status::text THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('countries',v_iso2,'export_status',OLD.export_status::text,NEW.export_status::text);
  END IF;
  IF OLD.opportunity_score IS DISTINCT FROM NEW.opportunity_score THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('countries',v_iso2,'opportunity_score',OLD.opportunity_score::text,NEW.opportunity_score::text);
  END IF;
  IF OLD.data_completeness::text IS DISTINCT FROM NEW.data_completeness::text THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('countries',v_iso2,'data_completeness',OLD.data_completeness::text,NEW.data_completeness::text);
  END IF;
  IF OLD.public_summary IS DISTINCT FROM NEW.public_summary THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('countries',v_iso2,'public_summary',OLD.public_summary,NEW.public_summary);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_track_briefing_field_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE v_row_id text := NEW.country_iso2 || COALESCE(':' || NEW.state_iso2, ''); BEGIN
  IF OLD.program_status IS DISTINCT FROM NEW.program_status THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('cc_jurisdiction_briefings',v_row_id,'program_status',OLD.program_status,NEW.program_status);
  END IF;
  IF OLD.patient_access IS DISTINCT FROM NEW.patient_access THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('cc_jurisdiction_briefings',v_row_id,'patient_access',OLD.patient_access,NEW.patient_access);
  END IF;
  IF OLD.physician_access IS DISTINCT FROM NEW.physician_access THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('cc_jurisdiction_briefings',v_row_id,'physician_access',OLD.physician_access,NEW.physician_access);
  END IF;
  IF OLD.market_dynamics IS DISTINCT FROM NEW.market_dynamics THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('cc_jurisdiction_briefings',v_row_id,'market_dynamics',OLD.market_dynamics,NEW.market_dynamics);
  END IF;
  IF OLD.regulatory_outlook IS DISTINCT FROM NEW.regulatory_outlook THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('cc_jurisdiction_briefings',v_row_id,'regulatory_outlook',OLD.regulatory_outlook,NEW.regulatory_outlook);
  END IF;
  IF OLD.regulatory_body IS DISTINCT FROM NEW.regulatory_body THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('cc_jurisdiction_briefings',v_row_id,'regulatory_body',OLD.regulatory_body,NEW.regulatory_body);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_countries_field_changes ON public.countries;
CREATE TRIGGER trg_countries_field_changes
  AFTER UPDATE ON public.countries
  FOR EACH ROW EXECUTE FUNCTION public.trg_track_country_field_changes();

DROP TRIGGER IF EXISTS trg_briefings_field_changes ON public.cc_jurisdiction_briefings;
CREATE TRIGGER trg_briefings_field_changes
  AFTER UPDATE ON public.cc_jurisdiction_briefings
  FOR EACH ROW EXECUTE FUNCTION public.trg_track_briefing_field_changes();

-- RESTORED 2026-08-05 (zero-state chronology repair, PR #1280): the two RPCs below
-- were part of the original prod migration 20260627033143 (see ledger statements in
-- supabase_migrations.schema_migrations) but were omitted from this file's Jul-01
-- reconciliation rewrite. Their absence made public.get_regulatory_calendar() not
-- exist at zero-state replay time, which broke the api-schema wrapper created later
-- by 20260710123000_expose_actively_broken_tables_api_schema.sql. Bodies below are
-- verbatim from the prod ledger (pre-search_path-hardening; that hardening is applied
-- chronologically later by the existing 20260708212112 migration, already present).

CREATE OR REPLACE FUNCTION public.get_field_changes_for_country(
  p_iso2  text,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  id           uuid,
  table_name   text,
  field_name   text,
  old_value    text,
  new_value    text,
  changed_at   timestamptz,
  source_label text
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id, table_name, field_name, old_value, new_value, changed_at, source_label
  FROM public.regulatory_field_changes
  WHERE row_id = upper(p_iso2) OR row_id LIKE upper(p_iso2) || ':%'
  ORDER BY changed_at DESC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.get_regulatory_calendar(
  p_iso2  text DEFAULT NULL,
  p_limit int  DEFAULT 30
)
RETURNS TABLE (
  id            uuid,
  iso2          text,
  event_type    text,
  title         text,
  summary       text,
  expected_date date,
  confidence    text,
  source_url    text,
  source_label  text,
  status        text
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id, iso2, event_type, title, summary, expected_date, confidence, source_url, source_label, status
  FROM public.regulatory_calendar
  WHERE (p_iso2 IS NULL OR iso2 = upper(p_iso2))
    AND status = 'upcoming'
  ORDER BY expected_date ASC NULLS LAST
  LIMIT p_limit;
$$;
