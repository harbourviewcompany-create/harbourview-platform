ALTER TABLE job_search.settings RENAME TO settings_legacy_single_row;

CREATE TABLE job_search.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE job_search.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access" ON job_search.settings
  FOR ALL TO public USING (auth.role() = 'service_role'::text);

CREATE POLICY "anon full access" ON job_search.settings
  FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON job_search.settings TO anon, authenticated;

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON job_search.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO job_search.settings (key, value)
SELECT 'search_terms', jsonb_build_object('terms', search_terms, 'locations', locations)
FROM job_search.settings_legacy_single_row
WHERE id = 1;