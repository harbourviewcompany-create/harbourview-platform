-- Migration: Ticket 7 — BGE-M3 embedding column and semantic search for signals table.
-- Applied after: 20260616000000_hv_import_staging_extract_status.sql
--
-- Adds:
--   1. embedding_1024 vector(1024) column to public.signals
--   2. embedding_model text — tracks which model produced the embedding
--   3. embedded_at timestamptz — when embedding was written
--   4. HNSW index (cosine, m=16, ef_construction=64 — matches hv_embeddings params)
--   5. search_signals_semantic() — authenticated/service_role only
--
-- This gives signals their own embedding + search path without requiring
-- hv_artifacts integration (that comes in the M1 knowledge-graph milestone).

-- ── 1. Columns ───────────────────────────────────────────────────────────────

ALTER TABLE public.signals
  ADD COLUMN IF NOT EXISTS embedding_1024  vector(1024) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS embedding_model text          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS embedded_at     timestamptz   DEFAULT NULL;

-- ── 2. HNSW index ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_signals_embedding_1024_hnsw
  ON public.signals
  USING hnsw (embedding_1024 vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Partial index: only index rows that actually have an embedding.
-- Keeps the index small during the initial embedding run.
CREATE INDEX IF NOT EXISTS idx_signals_embedded_at
  ON public.signals (embedded_at)
  WHERE embedded_at IS NOT NULL;

-- ── 3. Semantic search function ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.search_signals_semantic(
  p_query_embedding  vector(1024),
  p_match_count      integer   DEFAULT 20,
  p_country          text      DEFAULT NULL,
  p_category         text      DEFAULT NULL,
  p_min_similarity   float     DEFAULT 0.0
)
RETURNS TABLE(
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
  'Semantic similarity search over signals using BGE-M3 1024-dim embeddings. '
  'Authenticated and service_role access only. '
  'Ticket 7.';

-- ── 4. RLS — function access ──────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.search_signals_semantic(vector, integer, text, text, float)
  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_signals_semantic(vector, integer, text, text, float)
  FROM anon;
GRANT EXECUTE ON FUNCTION public.search_signals_semantic(vector, integer, text, text, float)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_signals_semantic(vector, integer, text, text, float)
  TO service_role;
