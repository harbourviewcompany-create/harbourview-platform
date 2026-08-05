-- Editorial content pipeline: mainstream-media cannabis news/commentary,
-- fully separate from ia_signals (trade/regulatory intelligence).
-- No confidence score, no TRADE action — this is read-only editorial content.

CREATE TABLE IF NOT EXISTS editorial_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id         uuid REFERENCES source_registry(id),
  snapshot_id       uuid REFERENCES source_snapshots(id),
  headline          text NOT NULL,
  summary           text NOT NULL,
  why_it_matters    text,
  outlet_name       text,
  source_url        text,
  country           text,
  region            text,
  language          text,
  tone              text,
  published_at      timestamptz,
  used_in_digest_at timestamptz,
  stage             text NOT NULL DEFAULT 'qualified' CHECK (stage IN ('qualified','rejected','archived')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_editorial_items_stage_created ON editorial_items (stage, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_editorial_items_unused ON editorial_items (used_in_digest_at) WHERE used_in_digest_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_editorial_items_country ON editorial_items (country);

ALTER TABLE editorial_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY editorial_items_public_read ON editorial_items
  FOR SELECT
  USING (stage = 'qualified');
