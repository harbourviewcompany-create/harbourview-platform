-- Reconstructed from the exact production migration-ledger statement for
-- version 20260625174211 (add_regulatory_trajectory_and_coverage).
--
-- The repository previously carried only a SELECT 1 parity stub, so a zero-state
-- reset could not create hv_regulatory_trajectory / hv_entity_mentions before
-- later recorded security-policy migrations referenced them. Production already
-- records this version; this restores replay fidelity only.

-- 1. source_registry: yield-scoring column
ALTER TABLE public.source_registry
  ADD COLUMN IF NOT EXISTS content_change_rate float DEFAULT 0.5
    CHECK (content_change_rate BETWEEN 0 AND 1);

COMMENT ON COLUMN public.source_registry.content_change_rate IS
  'Exponential-moving-average of content-changed fraction (0=never changes, 1=always changes). '
  'Updated by the crawl worker after each successful fetch. '
  'Used by the scheduler to back off low-yield sources.';

-- 2. hv_regulatory_trajectory — longitudinal trend store
CREATE TABLE IF NOT EXISTS public.hv_regulatory_trajectory (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iso             text NOT NULL,
  jurisdiction    text,
  period_start    date NOT NULL,
  period_end      date NOT NULL,
  signal_count    integer NOT NULL DEFAULT 0,
  change_count    integer NOT NULL DEFAULT 0,
  sentiment_score float,
  trajectory      text CHECK (trajectory IN (
    'liberalising', 'tightening', 'stable', 'uncertain', 'no_data'
  )) DEFAULT 'no_data',
  key_themes      text[],
  summary_text    text,
  computed_at     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hv_regulatory_trajectory_iso_period
  ON public.hv_regulatory_trajectory (iso, period_start DESC);

ALTER TABLE public.hv_regulatory_trajectory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON public.hv_regulatory_trajectory
  USING (true) WITH CHECK (true);

-- 3. get_regulatory_trajectory RPC
CREATE OR REPLACE FUNCTION public.get_regulatory_trajectory(
  p_iso    text,
  p_months int DEFAULT 12
)
RETURNS SETOF public.hv_regulatory_trajectory
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM   public.hv_regulatory_trajectory
  WHERE  iso = p_iso
    AND  period_start >= (CURRENT_DATE - (p_months || ' months')::interval)::date
  ORDER BY period_start DESC;
$$;

-- 4. hv_entity_mentions
CREATE TABLE IF NOT EXISTS public.hv_entity_mentions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id     text NOT NULL REFERENCES public.ia_graph_entities(id) ON DELETE CASCADE,
  snapshot_id   uuid REFERENCES public.source_snapshots(id) ON DELETE SET NULL,
  mention_text  text,
  confidence    float CHECK (confidence BETWEEN 0 AND 1),
  iso           text,
  mentioned_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hv_entity_mentions_entity_id ON public.hv_entity_mentions (entity_id);
CREATE INDEX IF NOT EXISTS hv_entity_mentions_iso       ON public.hv_entity_mentions (iso);

ALTER TABLE public.hv_entity_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON public.hv_entity_mentions
  USING (true) WITH CHECK (true);
