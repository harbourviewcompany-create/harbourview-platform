-- Ticket 6: BGE-M3 1024-dim embedding column + search function update
-- Applied to production: 2026-06-07 via Supabase MCP (verified)
-- Verification: col_exists=1, index_exists=1, fn_has_1024_param=1,
--               anon_blocked=false, auth_allowed=true

-- Step 1: Add 1024-dim vector column
ALTER TABLE public.hv_embeddings
  ADD COLUMN IF NOT EXISTS embedding_1024 vector(1024);

-- Step 2: HNSW index (same params as existing: m=16, ef_construction=64)
CREATE INDEX IF NOT EXISTS idx_hv_embeddings_hnsw_1024
  ON public.hv_embeddings
  USING hnsw (embedding_1024 vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Step 3: hv_search_artifacts — adds p_query_embedding_1024 parameter and branch
-- Search priority: 1536-dim -> 1024-dim (BGE-M3) -> 384-dim -> FTS
-- Adds SET search_path to prevent search_path injection.
CREATE OR REPLACE FUNCTION public.hv_search_artifacts(
  p_query_embedding_1536  vector  DEFAULT NULL,
  p_query_embedding_384   vector  DEFAULT NULL,
  p_workspace_id          uuid    DEFAULT 'a85840b4-c522-4cb8-9097-2f6c30a78417'::uuid,
  p_match_count           integer DEFAULT 20,
  p_fts_query             text    DEFAULT NULL,
  p_query_embedding_1024  vector  DEFAULT NULL
)
RETURNS TABLE(
  artifact_id    uuid,
  title          text,
  country_iso    text,
  jurisdiction   text,
  object_class   hv_object_class,
  review_status  hv_review_status,
  similarity     double precision,
  search_method  text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN

  -- Branch 1: 1536-dim (OpenAI)
  IF p_query_embedding_1536 IS NOT NULL THEN
    RETURN QUERY
      SELECT DISTINCT ON (a.id)
        a.id, a.title, a.country_iso, a.jurisdiction_code,
        a.object_class, a.review_status,
        (1 - (e.embedding <=> p_query_embedding_1536))::double precision,
        'vector_1536'::text
      FROM public.hv_embeddings e
      JOIN public.hv_artifacts a ON e.artifact_id = a.id
      WHERE e.is_current = TRUE
        AND e.embedding IS NOT NULL
        AND a.workspace_id = p_workspace_id
      ORDER BY a.id, e.embedding <=> p_query_embedding_1536
      LIMIT p_match_count;
    RETURN;
  END IF;

  -- Branch 2: 1024-dim (BGE-M3)
  IF p_query_embedding_1024 IS NOT NULL THEN
    RETURN QUERY
      SELECT DISTINCT ON (a.id)
        a.id, a.title, a.country_iso, a.jurisdiction_code,
        a.object_class, a.review_status,
        (1 - (e.embedding_1024 <=> p_query_embedding_1024))::double precision,
        'vector_1024'::text
      FROM public.hv_embeddings e
      JOIN public.hv_artifacts a ON e.artifact_id = a.id
      WHERE e.is_current = TRUE
        AND e.embedding_1024 IS NOT NULL
        AND a.workspace_id = p_workspace_id
      ORDER BY a.id, e.embedding_1024 <=> p_query_embedding_1024
      LIMIT p_match_count;
    RETURN;
  END IF;

  -- Branch 3: 384-dim (local model)
  IF p_query_embedding_384 IS NOT NULL THEN
    RETURN QUERY
      SELECT DISTINCT ON (a.id)
        a.id, a.title, a.country_iso, a.jurisdiction_code,
        a.object_class, a.review_status,
        (1 - (e.embedding_384 <=> p_query_embedding_384))::double precision,
        'vector_384'::text
      FROM public.hv_embeddings e
      JOIN public.hv_artifacts a ON e.artifact_id = a.id
      WHERE e.is_current = TRUE
        AND e.embedding_384 IS NOT NULL
        AND a.workspace_id = p_workspace_id
      ORDER BY a.id, e.embedding_384 <=> p_query_embedding_384
      LIMIT p_match_count;
    RETURN;
  END IF;

  -- Branch 4: FTS fallback
  IF p_fts_query IS NOT NULL THEN
    RETURN QUERY
      SELECT
        a.id, a.title, a.country_iso, a.jurisdiction_code,
        a.object_class, a.review_status,
        ts_rank(a.fts_vector, websearch_to_tsquery('english', p_fts_query))::double precision,
        'fts'::text
      FROM public.hv_artifacts a
      WHERE a.workspace_id = p_workspace_id
        AND a.fts_vector @@ websearch_to_tsquery('english', p_fts_query)
      ORDER BY similarity DESC
      LIMIT p_match_count;
    RETURN;
  END IF;

END;
$$;

REVOKE EXECUTE ON FUNCTION public.hv_search_artifacts(vector,vector,uuid,integer,text,vector)
  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.hv_search_artifacts(vector,vector,uuid,integer,text,vector)
  FROM anon;
GRANT EXECUTE ON FUNCTION public.hv_search_artifacts(vector,vector,uuid,integer,text,vector)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.hv_search_artifacts(vector,vector,uuid,integer,text,vector)
  TO service_role;
