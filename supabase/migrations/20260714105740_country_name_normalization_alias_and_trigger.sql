-- Restore the exact production-owned body for migration 20260714105740.
-- The previous stub omitted public.country_name_aliases, which
-- 20260716195743 dereferences.

-- Fixes the country-matching bug found this session: fetchDashboardSignals()
-- does a plain lowercase exact-string match between signals.country and
-- countries.country_name, with no alias/ISO2 fallback. Confirmed 2,862
-- signals affected (USA:2611, UK:143, Turkiye:85, UAE:12, Czech Republic:8,
-- Democratic Republic of Congo:2, Turkey:1), dominated by USA -- the single
-- largest signal-producing country in the entire table.
--
-- Rather than patch the app-side JS comparison (which would need updating
-- at every call site, and there are multiple), this normalizes the DATA to
-- match countries.country_name exactly, so all existing exact-match code
-- just works with zero app changes. A trigger prevents recurrence, since
-- the extraction/scoring pipeline (LLM-driven) will keep naturally writing
-- colloquial forms like "USA" going forward.

CREATE TABLE IF NOT EXISTS public.country_name_aliases (
  alias TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.country_name_aliases IS
  'Maps colloquial/alternate country name spellings to the canonical countries.country_name value. Used by normalize_signal_country() to auto-correct signals.country on write, preventing the USA/United States-style silent country-filter mismatch found in the Jul 2026 audit.';

INSERT INTO public.country_name_aliases (alias, canonical_name) VALUES
  ('usa', 'United States'),
  ('us', 'United States'),
  ('u.s.', 'United States'),
  ('u.s.a.', 'United States'),
  ('america', 'United States'),
  ('united states of america', 'United States'),
  ('uk', 'United Kingdom'),
  ('u.k.', 'United Kingdom'),
  ('britain', 'United Kingdom'),
  ('great britain', 'United Kingdom'),
  ('turkiye', 'Türkiye'),
  ('turkey', 'Türkiye'),
  ('uae', 'United Arab Emirates'),
  ('u.a.e.', 'United Arab Emirates'),
  ('czech republic', 'Czechia'),
  ('democratic republic of congo', 'Democratic Republic of the Congo'),
  ('dr congo', 'Democratic Republic of the Congo'),
  ('drc', 'Democratic Republic of the Congo'),
  ('congo-kinshasa', 'Democratic Republic of the Congo'),
  ('congo-brazzaville', 'Republic of the Congo'),
  ('republic of congo', 'Republic of the Congo'),
  ('russian federation', 'Russia'),
  ('ivory coast', 'Cote d''Ivoire'),
  ('côte d''ivoire', 'Cote d''Ivoire'),
  ('cabo verde', 'Cape Verde'),
  ('swaziland', 'Eswatini'),
  ('macedonia', 'North Macedonia'),
  ('fyrom', 'North Macedonia'),
  ('burma', 'Myanmar'),
  ('holland', 'Netherlands'),
  ('vatican', 'Holy See'),
  ('vatican city', 'Holy See'),
  ('east timor', 'Timor-Leste'),
  ('bosnia', 'Bosnia and Herzegovina'),
  ('trinidad', 'Trinidad and Tobago'),
  ('saint vincent', 'Saint Vincent and the Grenadines'),
  ('st. lucia', 'Saint Lucia'),
  ('st lucia', 'Saint Lucia'),
  ('st. kitts and nevis', 'Saint Kitts and Nevis'),
  ('st kitts and nevis', 'Saint Kitts and Nevis'),
  ('antigua', 'Antigua and Barbuda'),
  ('palestinian territories', 'Palestine'),
  ('palestinian territory', 'Palestine'),
  ('korea', 'South Korea'),
  ('republic of korea', 'South Korea'),
  ('dprk', 'North Korea')
ON CONFLICT (alias) DO NOTHING;

-- Normalization function + trigger: auto-corrects signals.country on every
-- future insert/update, so the extraction pipeline writing "USA" tomorrow
-- gets silently rewritten to "United States" before it ever hits the table.
CREATE OR REPLACE FUNCTION public.normalize_signal_country()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_canonical TEXT;
BEGIN
  IF NEW.country IS NOT NULL THEN
    SELECT canonical_name INTO v_canonical
    FROM public.country_name_aliases
    WHERE alias = lower(trim(NEW.country));

    IF v_canonical IS NOT NULL THEN
      NEW.country := v_canonical;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_normalize_signal_country ON public.signals;
CREATE TRIGGER trg_normalize_signal_country
  BEFORE INSERT OR UPDATE OF country ON public.signals
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_signal_country();

-- Retroactive fix: correct all existing signals right now.
UPDATE public.signals s
SET country = a.canonical_name
FROM public.country_name_aliases a
WHERE lower(trim(s.country)) = a.alias
  AND s.country IS DISTINCT FROM a.canonical_name;