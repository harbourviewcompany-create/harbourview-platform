-- jurisdiction_playbooks: market entry playbooks per jurisdiction
CREATE TABLE IF NOT EXISTS public.jurisdiction_playbooks (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  country_iso2            text        NOT NULL UNIQUE,
  country_name            text        NOT NULL,
  difficulty              text        NOT NULL DEFAULT 'moderate',
  typical_timeline_months integer     NOT NULL DEFAULT 12,
  estimated_cost_range    text,
  legal_framework_summary text,
  steps                   jsonb       NOT NULL DEFAULT '[]',
  key_regulators          jsonb       NOT NULL DEFAULT '[]',
  common_pitfalls         text[]      NOT NULL DEFAULT '{}',
  status                  text        NOT NULL DEFAULT 'published',
  last_reviewed           date        NOT NULL DEFAULT CURRENT_DATE,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jurisdiction_playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_read_published_playbooks ON public.jurisdiction_playbooks
  FOR SELECT USING (status = 'published');

CREATE POLICY service_write_playbooks ON public.jurisdiction_playbooks
  FOR ALL USING (auth.role() = 'service_role');
