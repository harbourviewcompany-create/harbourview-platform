-- =============================================================================
-- signals_embedding_1024: BGE-M3 1024-dim embeddings for curated signals
-- =============================================================================
-- Adds embedding infrastructure to the main `public.signals` table (816 rows).
-- Complements ia_signal_embeddings (20260616100000) which covers ia_signals (26 rows).
--
-- Pipeline: signals (curated, 816 rows) → (embed-signals cron 09:00 UTC) → embedding_1024
-- Search:   search_signals_semantic(p_query_embedding) → ranked signal rows

-- ── 1. Embedding column + tracking fields ─────────────────────────────────────
ALTER TABLE public.signals
  ADD COLUMN IF NOT EXISTS embedding_1024   vector(1024) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS embedding_model  text         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS embedded_at      timestamptz  DEFAULT NULL;

-- ── 2. HNSW index (cosine, params match ia_signal_embeddings) ─────────────────
CREATE INDEX IF NOT EXISTS idx_signals_embedding_1024_hnsw
  ON public.signals
  USING hnsw (embedding_1024 vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Partial index so un-embedded rows are never traversed
CREATE INDEX IF NOT EXISTS idx_signals_embedded_at
  ON public.signals (embedded_at)
  WHERE embedded_at IS NOT NULL;

-- ── 3. Semantic search RPC ─────────────────────────────────────────────────────
-- Returns curated signals ordered by cosine similarity to a 1024-dim query vector.
-- Optional filters: country, category, min_similarity threshold.
CREATE OR REPLACE FUNCTION public.search_signals_semantic(
  p_query_embedding  vector(1024),
  p_match_count      integer   DEFAULT 20,
  p_country          text      DEFAULT NULL,
  p_category         text      DEFAULT NULL,
  p_min_similarity   float     DEFAULT 0.0
)
RETURNS TABLE (
  id          text,
  headline    text,
  summary     text,
  country     text,
  cat         text,
  pri         text,
  score       integer,
  source      text,
  url         text,
  date        timestamptz,
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
      s.headline,
      s.summary,
      s.country,
      s.cat,
      s.pri,
      s.score,
      s.source,
      s.url,
      s.date,
      (1 - (s.embedding_1024 <=> p_query_embedding))::double precision AS similarity
    FROM public.signals s
    WHERE
      s.embedding_1024 IS NOT NULL
      AND (p_country  IS NULL OR s.country = p_country)
      AND (p_category IS NULL OR s.cat     = p_category)
      AND (1 - (s.embedding_1024 <=> p_query_embedding)) >= p_min_similarity
    ORDER BY s.embedding_1024 <=> p_query_embedding
    LIMIT p_match_count;
END;
$$;

COMMENT ON FUNCTION public.search_signals_semantic IS
  'Semantic similarity search over the curated signals corpus (816 rows) '
  'using BGE-M3 1024-dim embeddings. Authenticated + service_role only.';

REVOKE EXECUTE ON FUNCTION public.search_signals_semantic(vector, integer, text, text, float)
  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_signals_semantic(vector, integer, text, text, float)
  FROM anon;
GRANT EXECUTE ON FUNCTION public.search_signals_semantic(vector, integer, text, text, float)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_signals_semantic(vector, integer, text, text, float)
  TO service_role;
