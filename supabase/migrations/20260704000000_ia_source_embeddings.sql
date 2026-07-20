-- =============================================================================
-- ia_source_embeddings: OpenAI text-embedding-3-small 1536-dim embeddings for ia_sources
-- =============================================================================
-- Separate from hv_embeddings (artifact search) and ia_signal_embeddings (signals).
-- Enables semantic search over evidence sources from the Evidence Sources page.
--
-- Pipeline:  ia_sources → (embed cron or backfill script) → ia_source_embeddings
-- Search:    ia_search_sources(p_query_embedding) → ranked source rows

CREATE TABLE IF NOT EXISTS public.ia_source_embeddings (
  source_id   text         PRIMARY KEY
                           REFERENCES public.ia_sources(id) ON DELETE CASCADE,
  embedding   vector(1536) NOT NULL,
  model       text         NOT NULL DEFAULT 'text-embedding-3-small',
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- HNSW cosine-distance index (params match idx_hv_embeddings_hnsw)
CREATE INDEX IF NOT EXISTS idx_ia_source_embeddings_hnsw
  ON public.ia_source_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.ia_source_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ia_source_embeddings_admin_operator_all ON public.ia_source_embeddings;
CREATE POLICY ia_source_embeddings_admin_operator_all
  ON public.ia_source_embeddings
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

-- Service-role access for the embedding pipeline (bypasses RLS)
GRANT SELECT, INSERT, UPDATE ON public.ia_source_embeddings TO service_role;

-- ── Semantic search RPC ───────────────────────────────────────────────────────
-- Returns ia_sources ordered by cosine similarity to a query embedding.
-- Optional filter: p_category limits to a specific source category.
CREATE OR REPLACE FUNCTION public.ia_search_sources(
  p_query_embedding  vector(1536),
  p_match_count      integer DEFAULT 30,
  p_category         text    DEFAULT NULL
)
RETURNS TABLE (
  source_id   text,
  name        text,
  category    text,
  markets     text[],
  reliability text,
  similarity  double precision
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
      s.name,
      s.category,
      s.markets,
      s.reliability,
      (1 - (e.embedding <=> p_query_embedding))::double precision AS similarity
    FROM public.ia_source_embeddings e
    JOIN public.ia_sources s ON s.id = e.source_id
    WHERE s.status = 'active'
      AND (p_category IS NULL OR s.category = p_category)
    ORDER BY e.embedding <=> p_query_embedding
    LIMIT p_match_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ia_search_sources(vector, integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ia_search_sources(vector, integer, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.ia_search_sources(vector, integer, text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.ia_search_sources(vector, integer, text) TO service_role;
