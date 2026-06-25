
-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: maximize_schema_data_flows
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. MARK STALE PENDING SNAPSHOTS AS SKIPPED ──────────────────────────────
UPDATE public.source_snapshots
SET processing_status = 'skipped'
WHERE processing_status = 'pending'
  AND captured_at < NOW() - INTERVAL '7 days';

-- ─── 2. PROMOTE hv_artifacts → published ─────────────────────────────────────
UPDATE public.hv_artifacts
SET lifecycle_stage = 'published',
    published_at    = COALESCE(published_at, NOW()),
    review_status   = 'approved',
    updated_at      = NOW()
WHERE lifecycle_stage = 'normalized';

-- ─── 3. POPULATE hv_public_feed FROM PUBLISHED ARTIFACTS ─────────────────────
INSERT INTO public.hv_public_feed (
  workspace_id, artifact_id, feed_type,
  title_public, summary_public, body_public,
  jurisdiction_code, country_iso, region,
  tags, status, published_at, approved_at,
  created_by, created_at, updated_at
)
SELECT
  a.workspace_id,
  a.id,
  a.object_class::text,
  a.title,
  LEFT(COALESCE(a.body, a.title, ''), 500),
  a.body,
  a.jurisdiction_code,
  a.country_iso,
  a.region,
  ARRAY[]::text[],
  'published',
  COALESCE(a.published_at, NOW()),
  NOW(),
  a.created_by,
  NOW(),
  NOW()
FROM public.hv_artifacts a
WHERE a.lifecycle_stage = 'published'
  AND NOT EXISTS (SELECT 1 FROM public.hv_public_feed f WHERE f.artifact_id = a.id);

-- ─── 4. SEED OPPORTUNITIES FROM ENGAGEMENTS ──────────────────────────────────
-- priority GENERATED via priority_order, so omit priority_order
-- valid priority values that trigger meaningful order: 'now', 'soon', 'later'
INSERT INTO public.opportunities (
  name, type, stage, priority,
  value_est, value_num, next_action, next_action_date,
  market, counterparty, notes, entity, created_at, updated_at
)
SELECT
  e.client || ' — ' || e.type,
  e.type,
  CASE e.status
    WHEN 'active'   THEN 'execution'
    WHEN 'prospect' THEN 'discovery'
    WHEN 'paused'   THEN 'on_hold'
    ELSE 'pipeline'
  END,
  CASE e.status WHEN 'active' THEN 'now' WHEN 'prospect' THEN 'soon' ELSE 'later' END,
  CASE WHEN e.total_value IS NOT NULL THEN e.total_value::text ELSE NULL END,
  e.total_value,
  e.next_action,
  e.next_action_date,
  NULL,
  e.client,
  e.notes,
  e.entity,
  e.created_at,
  e.updated_at
FROM public.engagements e
WHERE NOT EXISTS (SELECT 1 FROM public.opportunities o WHERE o.counterparty = e.client)
  AND e.client IS NOT NULL;

-- High-priority dossier market opportunities
INSERT INTO public.opportunities (
  name, type, stage, priority,
  market, notes, entity, created_at, updated_at
)
SELECT
  d.market || ' — Market Entry Intelligence',
  'market_intelligence',
  CASE d.status
    WHEN 'current'     THEN 'active'
    WHEN 'in_progress' THEN 'research'
    WHEN 'stale'       THEN 'review'
    ELSE 'pipeline'
  END,
  CASE d.priority WHEN 'high' THEN 'now' WHEN 'medium' THEN 'soon' ELSE 'later' END,
  d.market,
  d.notes,
  'Harbourview',
  d.created_at,
  d.updated_at
FROM public.dossier_status d
WHERE d.priority IN ('high','medium')
  AND NOT EXISTS (SELECT 1 FROM public.opportunities o WHERE o.market = d.market)
ORDER BY d.priority, d.last_updated DESC
LIMIT 20;

-- ─── 5. SEED user_dashboard_preferences FOR EXISTING USERS ──────────────────
INSERT INTO public.user_dashboard_preferences (
  user_id, country_iso2, role_id, heatmap_layer, created_at, updated_at
)
SELECT
  up.id,
  'CA',
  'admin',
  'medical_status',
  NOW(),
  NOW()
FROM public.user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_dashboard_preferences p WHERE p.user_id = up.id
);

-- ─── 6. BACKFILL ia_signals FROM HIGH-QUALITY signals ────────────────────────
-- stage valid: new|needs_review|qualified|converted_to_opportunity|...
-- commercial_impact valid: high|medium|low
INSERT INTO public.ia_signals (
  id, title, type, stage, source_name,
  market, category, confidence, commercial_impact,
  summary, detected_at, created_at, updated_at
)
SELECT
  's-' || s.id::text,
  s.headline,
  COALESCE(NULLIF(s.cat, 'SOURCE_ENGINE'), 'regulatory'),
  CASE WHEN s.score >= 8 THEN 'qualified' ELSE 'needs_review' END,
  COALESCE(s.source, 'Harbourview Intelligence'),
  COALESCE(NULLIF(s.country, ''), 'Global'),
  COALESCE(NULLIF(s.cat, 'SOURCE_ENGINE'), 'regulatory'),
  LEAST(GREATEST(((s.score / 10.0) * 100)::int, 0), 100),
  CASE WHEN s.score >= 9 THEN 'high' WHEN s.score >= 7 THEN 'medium' ELSE 'low' END,
  COALESCE(s.summary, s.headline),
  COALESCE(s.date, s.created_at::date),
  s.created_at,
  s.created_at
FROM public.signals s
WHERE s.reviewed = true
  AND s.score >= 8
  AND s.cat NOT IN ('SOURCE_ENGINE')
  AND NOT EXISTS (SELECT 1 FROM public.ia_signals ia WHERE ia.id = 's-' || s.id::text)
ORDER BY s.score DESC, s.created_at DESC
LIMIT 200;

-- ─── 7. SEED dossiers FROM dossier_status ────────────────────────────────────
INSERT INTO public.dossiers (title, created_at)
SELECT
  d.market || ' — ' || d.region,
  d.created_at
FROM public.dossier_status d
WHERE NOT EXISTS (
  SELECT 1 FROM public.dossiers dos WHERE dos.title LIKE d.market || '%'
);

-- ─── 8. FIX NULL-COUNTRY SIGNALS ─────────────────────────────────────────────
UPDATE public.signals
SET country = 'Global'
WHERE (country IS NULL OR country = '')
  AND cat = 'SOURCE_ENGINE';

-- ─── 9. MARK SUCCEEDED hv_processing_jobs AS COMPLETED ───────────────────────
UPDATE public.hv_processing_jobs j
SET status       = 'completed',
    completed_at = (
      SELECT MAX(a.ended_at) FROM public.hv_job_attempts a
      WHERE a.job_id = j.id AND a.status = 'succeeded'
    ),
    updated_at   = NOW()
WHERE j.status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.hv_job_attempts a
    WHERE a.job_id = j.id AND a.status = 'succeeded'
  );

-- ─── 10. ADVANCE HIGH-CONFIDENCE marketplace_candidates ───────────────────────
UPDATE public.marketplace_candidates
SET status      = 'reviewed',
    reviewed_at = NOW()
WHERE status = 'needs_review'
  AND confidence > 0.8
  AND title_public_draft IS NOT NULL
  AND title_public_draft != '';

-- ─── 11. SET next_crawl_at FOR ACTIVE SOURCES WITHOUT SCHEDULE ───────────────
UPDATE public.source_registry
SET next_crawl_at = NOW() + INTERVAL '24 hours'
WHERE is_active    = true
  AND crawl_allowed = true
  AND next_crawl_at IS NULL;
