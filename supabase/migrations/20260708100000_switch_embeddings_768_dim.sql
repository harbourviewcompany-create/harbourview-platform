-- Switch ia_signal_embeddings from 1024-dim (BGE-M3) to 768-dim (text-embedding-004).
-- Safe: table has zero rows (HF endpoint was never configured).
-- Also drops the now-unused HF-specific model column default.

-- Drop old HNSW index (can't ALTER dimension in place)
DROP INDEX IF EXISTS idx_ia_signal_embeddings_hnsw;

-- Recreate column at 768-dim
ALTER TABLE public.ia_signal_embeddings
  DROP COLUMN embedding;

ALTER TABLE public.ia_signal_embeddings
  ADD COLUMN embedding vector(768) NOT NULL;

-- Update model default to reflect new provider
ALTER TABLE public.ia_signal_embeddings
  ALTER COLUMN model SET DEFAULT 'text-embedding-004';

-- Rebuild HNSW index at 768-dim
CREATE INDEX idx_ia_signal_embeddings_hnsw
  ON public.ia_signal_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Update ia_search_signals RPC to accept 768-dim query vector
CREATE OR REPLACE FUNCTION public.ia_search_signals(
  p_query_embedding  vector(768),
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
