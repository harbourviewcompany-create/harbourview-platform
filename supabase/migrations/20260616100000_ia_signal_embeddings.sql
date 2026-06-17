-- =============================================================================
-- ia_signal_embeddings: BGE-M3 1024-dim embeddings for ia_signals
-- =============================================================================
-- Separate from hv_embeddings (which serves hv_artifacts / artifact search).
-- Enables semantic search over intelligence signals.
--
-- Pipeline:  ia_signals → (embed cron) → ia_signal_embeddings
-- Search:    ia_search_signals(p_query_embedding) → ranked signal rows

CREATE TABLE IF NOT EXISTS public.ia_signal_embeddings (
  signal_id   text         PRIMARY KEY
                           REFERENCES public.ia_signals(id) ON DELETE CASCADE,
  embedding   vector(1024) NOT NULL,
  model       text         NOT NULL DEFAULT 'bge-m3',
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- HNSW cosine-distance index (params match idx_hv_embeddings_hnsw_1024)
CREATE INDEX IF NOT EXISTS idx_ia_signal_embeddings_hnsw
  ON public.ia_signal_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.ia_signal_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ia_signal_embeddings_admin_operator_all ON public.ia_signal_embeddings;
CREATE POLICY ia_signal_embeddings_admin_operator_all
  ON public.ia_signal_embeddings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'operator')
    )
  );

-- Service-role access for the embedding cron (bypasses RLS)
GRANT SELECT, INSERT, UPDATE ON public.ia_signal_embeddings TO service_role;

-- ── Semantic search RPC ───────────────────────────────────────────────────────
-- Returns ia_signals ordered by cosine similarity to a query embedding.
-- Optional filters: market, type, stage.
CREATE OR REPLACE FUNCTION public.ia_search_signals(
  p_query_embedding  vector(1024),
  p_match_count      integer DEFAULT 20,
  p_market           text    DEFAULT NULL,
  p_type             text    DEFAULT NULL,
  p_stage            text    DEFAULT NULL
)
RETURNS TABLE (
  signal_id         text,
  title             text,
  type              text,
  stage             text,
  market            text,
  category          text,
  confidence        integer,
  commercial_impact text,
  summary           text,
  detected_at       date,
  similarity        double precision
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
    SELECT
      s.id,
      s.title,
      s.type,
      s.stage,
      s.market,
      s.category,
      s.confidence,
      s.commercial_impact,
      s.summary,
      s.detected_at,
      (1 - (e.embedding <=> p_query_embedding))::double precision AS similarity
    FROM public.ia_signal_embeddings e
    JOIN public.ia_signals s ON s.id = e.signal_id
    WHERE (p_market IS NULL OR s.market = p_market)
      AND (p_type   IS NULL OR s.type   = p_type)
      AND (p_stage  IS NULL OR s.stage  = p_stage)
    ORDER BY e.embedding <=> p_query_embedding
    LIMIT p_match_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ia_search_signals(vector, integer, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ia_search_signals(vector, integer, text, text, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.ia_search_signals(vector, integer, text, text, text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.ia_search_signals(vector, integer, text, text, text) TO service_role;
