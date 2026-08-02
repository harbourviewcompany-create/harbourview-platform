-- Semantic search RPC over public.signals (Pipeline B, the canonical
-- customer-facing feed). Backs app/api/signals/search/route.ts.
--
-- The query embedding MUST come from OpenAI text-embedding-3-small at
-- dimensions=1024 -- that is what populated signals.embedding_1024 (confirmed
-- live: atttypmod=1024, embedding_model='text-embedding-3-small' on all 6,441
-- embedded rows). Any other model/dimension produces a vector in a different
-- space and silently meaningless cosine distances.
--
-- Filters mirror lib/signals/quality.ts (EXCLUDED_QUALITY_LABELS, reviewed
-- gate) so search results obey the same surfacing rules as the rest of the
-- site. Uses the existing idx_signals_embedding_1024_hnsw index via
-- ORDER BY <=> LIMIT (no threshold filter, which the index cannot serve).
CREATE OR REPLACE FUNCTION api.search_public_signals(
  p_query_embedding vector(1024),
  p_match_count integer DEFAULT 20,
  p_country text DEFAULT NULL,
  p_content_type text DEFAULT NULL
)
RETURNS TABLE(
  id text, date timestamptz, cat text, headline text, summary text, country text,
  commercial_impact text, source text, url text, tier text, created_at timestamptz,
  quality_label text, quality_confidence numeric, content_type text, impact text,
  title_en text, summary_en text, lang_detected text, is_representative boolean,
  cluster_rep_id text, similarity double precision
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
  select s.id, s.date, s.cat, s.headline, s.summary, s.country,
         s.commercial_impact, s.source, s.url, s.tier, s.created_at,
         s.quality_label, s.quality_confidence, s.content_type, s.impact,
         s.title_en, s.summary_en, s.lang_detected, s.is_representative, s.cluster_rep_id,
         1 - (s.embedding_1024 <=> p_query_embedding) as similarity
  from public.signals s
  where s.reviewed = true
    and s.embedding_1024 is not null
    and (s.quality_label is null or s.quality_label not in ('spam','boilerplate','nav','duplicate'))
    and (p_country is null or s.country ilike p_country)
    and (p_content_type is null or s.content_type = p_content_type)
  order by s.embedding_1024 <=> p_query_embedding
  limit greatest(1, least(coalesce(p_match_count, 20), 50));
$function$;

COMMENT ON FUNCTION api.search_public_signals IS
  'Semantic search over public.signals (Pipeline B, the canonical customer-facing feed). Query embedding must come from OpenAI text-embedding-3-small at dimensions=1024 to be comparable with the stored embedding_1024 column -- any other model/dimension produces meaningless similarity scores. Filters match lib/signals/quality.ts (EXCLUDED_QUALITY_LABELS, reviewed=true).';

REVOKE ALL ON FUNCTION api.search_public_signals(vector,integer,text,text) FROM public;
GRANT EXECUTE ON FUNCTION api.search_public_signals(vector,integer,text,text) TO service_role;
