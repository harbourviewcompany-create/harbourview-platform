-- Provenance tracking, mirroring local_authorities' source_id/confidence_label/last_verified_at pattern.
ALTER TABLE public.jurisdiction_playbooks
  ADD COLUMN IF NOT EXISTS source_id uuid REFERENCES public.source_registry(id),
  ADD COLUMN IF NOT EXISTS confidence_label text,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;

-- Research queue, mirroring local_intel_research_queue's per-country tracking pattern.
CREATE TABLE IF NOT EXISTS public.jurisdiction_playbooks_research_queue (
  country_code        text PRIMARY KEY REFERENCES public.countries(iso_alpha2),
  country_name        text NOT NULL,
  region              text,
  subregion           text,
  queue_rank          integer,
  playbook_status     text NOT NULL DEFAULT 'unresearched'
                       CHECK (playbook_status IN ('unresearched','researching','published','needs_review')),
  last_researched_at  timestamptz,
  last_researched_by  text,
  research_notes      text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.jurisdiction_playbooks_research_queue (country_code, country_name, region, subregion, playbook_status)
SELECT c.iso_alpha2, c.country_name, c.region, c.subregion,
       CASE WHEN jp.status = 'published' THEN 'published' ELSE 'unresearched' END
FROM public.countries c
LEFT JOIN public.jurisdiction_playbooks jp ON jp.country_iso2 = c.iso_alpha2
ON CONFLICT (country_code) DO NOTHING;
