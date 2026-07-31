-- Make api.search_public_signals obey Stage D routing.
--
-- WHY
-- ---
-- `20260730180000_search_public_signals_rpc.sql` (PR #1220) states its own
-- intent plainly: "Filters mirror lib/signals/quality.ts ... so search results
-- obey the same surfacing rules as the rest of the site."
--
-- PR #1218 then added Stage D routing, which removes `story`, `research` and
-- `noise` from the Signals feed. The two landed within hours of each other, so
-- neither knew about the other, and the result breaks that promise: searching
-- from /dashboard/signals/search would return rows that do not exist in the
-- feed being searched — including `noise`, which by definition belongs on no
-- surface at all (routeContentType returns [] for it).
--
-- Reconciled here rather than left to diverge:
--   * `noise` is excluded unconditionally. It is never surfaceable anywhere,
--     so there is no caller for whom returning it is correct.
--   * `story`/`research` are excluded by default, matching the feed, but an
--     explicit p_content_type still returns them. That preserves deliberate
--     cross-surface search (digest-bound content is real content) while making
--     the default behaviour agree with the feed.
--
-- NULL content_type is retained — pre-Pipeline-B rows predate the taxonomy.
-- Note the null-safety: `content_type is distinct from 'noise'` rather than
-- `<> 'noise'`, and an explicit `is null` branch, because `NULL not in (...)`
-- evaluates to NULL and would silently drop every legacy row.

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
    -- Stage D: noise never surfaces; story/research only on explicit request.
    and s.content_type is distinct from 'noise'
    and (p_content_type is not null
         or s.content_type is null
         or s.content_type not in ('story','research'))
    and (p_content_type is null or s.content_type = p_content_type)
  order by s.embedding_1024 <=> p_query_embedding
  limit greatest(1, least(coalesce(p_match_count, 20), 50));
$function$;

COMMENT ON FUNCTION api.search_public_signals IS
  'Semantic search over public.signals (Pipeline B, the canonical customer-facing feed). Query '
  'embedding must come from OpenAI text-embedding-3-small at dimensions=1024 to be comparable with '
  'the stored embedding_1024 column -- any other model/dimension produces meaningless similarity '
  'scores. Filters match lib/signals/quality.ts: EXCLUDED_QUALITY_LABELS, reviewed=true, and Stage D '
  'routing (noise never returned; story/research only when p_content_type asks for them).';

REVOKE ALL ON FUNCTION api.search_public_signals(vector,integer,text,text) FROM public;
GRANT EXECUTE ON FUNCTION api.search_public_signals(vector,integer,text,text) TO service_role;
