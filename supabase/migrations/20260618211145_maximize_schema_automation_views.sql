
-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: maximize_schema_automation_views
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. TRIGGER: auto-create user_dashboard_preferences on profile create ────
CREATE OR REPLACE FUNCTION public.auto_create_dashboard_preferences()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_dashboard_preferences (user_id, country_iso2, role_id, heatmap_layer)
  VALUES (NEW.id, 'CA', 'visitor', 'medical_status')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_profile_created_prefs ON public.user_profiles;
CREATE TRIGGER on_user_profile_created_prefs
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_dashboard_preferences();

-- ─── 2. TRIGGER: auto-publish hv_artifacts to hv_public_feed ────────────────
CREATE OR REPLACE FUNCTION public.hv_artifact_publish_to_feed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.lifecycle_stage = 'published' AND NEW.public_eligible = true
    AND (OLD.lifecycle_stage IS DISTINCT FROM 'published' OR OLD IS NULL)
  THEN
    INSERT INTO public.hv_public_feed (
      workspace_id, artifact_id, feed_type, title_public, summary_public,
      body_public, jurisdiction_code, country_iso, region, tags, status,
      published_at, approved_at, created_by, created_at, updated_at
    ) VALUES (
      NEW.workspace_id, NEW.id, NEW.object_class::text, NEW.title,
      LEFT(COALESCE(NEW.body, NEW.title, ''), 500), NEW.body,
      NEW.jurisdiction_code, NEW.country_iso, NEW.region,
      ARRAY[]::text[], 'published', COALESCE(NEW.published_at, NOW()),
      NOW(), NEW.created_by, NOW(), NOW()
    ) ON CONFLICT (artifact_id) DO UPDATE
      SET title_public   = EXCLUDED.title_public,
          summary_public = EXCLUDED.summary_public,
          body_public    = EXCLUDED.body_public,
          status         = 'published',
          published_at   = EXCLUDED.published_at,
          updated_at     = NOW();
  END IF;
  IF NEW.lifecycle_stage = 'archived' AND OLD.lifecycle_stage = 'published' THEN
    UPDATE public.hv_public_feed
    SET status = 'unpublished', unpublished_at = NOW(), updated_at = NOW()
    WHERE artifact_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.hv_public_feed'::regclass
      AND conname = 'hv_public_feed_artifact_id_key'
  ) THEN
    ALTER TABLE public.hv_public_feed ADD CONSTRAINT hv_public_feed_artifact_id_key UNIQUE (artifact_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS hv_artifact_publish_trigger ON public.hv_artifacts;
CREATE TRIGGER hv_artifact_publish_trigger
  AFTER INSERT OR UPDATE OF lifecycle_stage ON public.hv_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.hv_artifact_publish_to_feed();

-- ─── 3. TRIGGER: auto-sync reviewed signals → ia_signals ─────────────────────
CREATE OR REPLACE FUNCTION public.sync_signal_to_ia_signals()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.reviewed = true AND NEW.score >= 8 AND COALESCE(NEW.cat, '') NOT IN ('SOURCE_ENGINE') THEN
    INSERT INTO public.ia_signals (
      id, title, type, stage, source_name, market, category,
      confidence, commercial_impact, summary, detected_at, created_at, updated_at
    ) VALUES (
      's-' || NEW.id::text,
      NEW.headline,
      COALESCE(NULLIF(NEW.cat, ''), 'regulatory'),
      CASE WHEN NEW.score >= 8 THEN 'qualified' ELSE 'needs_review' END,
      COALESCE(NEW.source, 'Harbourview Intelligence'),
      COALESCE(NULLIF(NEW.country, ''), 'Global'),
      COALESCE(NULLIF(NEW.cat, ''), 'regulatory'),
      LEAST(GREATEST(((NEW.score / 10.0) * 100)::int, 0), 100),
      CASE WHEN NEW.score >= 9 THEN 'high' WHEN NEW.score >= 7 THEN 'medium' ELSE 'low' END,
      COALESCE(NEW.summary, NEW.headline),
      COALESCE(NEW.date, NEW.created_at::date),
      NEW.created_at,
      NEW.created_at
    ) ON CONFLICT (id) DO UPDATE
      SET stage             = EXCLUDED.stage,
          confidence        = EXCLUDED.confidence,
          commercial_impact = EXCLUDED.commercial_impact,
          updated_at        = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS signals_sync_to_ia ON public.signals;
CREATE TRIGGER signals_sync_to_ia
  AFTER INSERT OR UPDATE OF reviewed, score ON public.signals
  FOR EACH ROW EXECUTE FUNCTION public.sync_signal_to_ia_signals();

-- ─── 4. FUNCTION: platform health ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_platform_health()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN jsonb_build_object(
    'checked_at',                     NOW(),
    'listings_approved',              (SELECT COUNT(*) FROM listings WHERE status = 'approved' AND public_visibility = true),
    'signals_total',                  (SELECT COUNT(*) FROM signals),
    'signals_reviewed',               (SELECT COUNT(*) FROM signals WHERE reviewed = true),
    'ia_signals_qualified',           (SELECT COUNT(*) FROM ia_signals WHERE stage = 'qualified'),
    'source_registry_active',         (SELECT COUNT(*) FROM source_registry WHERE is_active = true AND crawl_allowed = true),
    'source_snapshots_pending',       (SELECT COUNT(*) FROM source_snapshots WHERE processing_status = 'pending'),
    'marketplace_candidates_pending', (SELECT COUNT(*) FROM marketplace_candidates WHERE status = 'needs_review'),
    'hv_public_feed_items',           (SELECT COUNT(*) FROM hv_public_feed WHERE status = 'published'),
    'countries_covered',              (SELECT COUNT(*) FROM countries),
    'jurisdiction_briefings_pub',     (SELECT COUNT(*) FROM jurisdiction_briefings WHERE status = 'published'),
    'opportunities_active',           (SELECT COUNT(*) FROM opportunities WHERE stage NOT IN ('closed', 'archived')),
    'processing_jobs_stuck',          (SELECT COUNT(*) FROM hv_processing_jobs WHERE status = 'pending' AND created_at < NOW() - INTERVAL '1 hour')
  );
END;
$$;

-- ─── 5. ENHANCED get_command_centre_metrics ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_command_centre_metrics(
  p_role_id text, p_country text DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_result       JSONB := '{}';
  v_country_name TEXT;
BEGIN
  IF p_country IS NOT NULL THEN
    SELECT country_name INTO v_country_name
    FROM countries WHERE iso_alpha2 = UPPER(p_country) LIMIT 1;
  END IF;

  IF p_role_id = 'admin' THEN
    SELECT jsonb_build_object(
      'role',                    'admin',
      'pending_listings',        COALESCE((SELECT COUNT(*) FROM admin_pending_listings), 0),
      'pending_buyer_requests',  COALESCE((SELECT COUNT(*) FROM admin_pending_buyer_requests), 0),
      'new_inquiries',           COALESCE((SELECT new_inquiries FROM admin_dashboard_counts), 0),
      'pending_matches',         COALESCE((SELECT pending_matches FROM admin_dashboard_counts), 0),
      'pending_disclosures',     COALESCE((SELECT pending_disclosures FROM admin_dashboard_counts), 0),
      'total_approved_listings', (SELECT COUNT(*) FROM listings WHERE status = 'approved'),
      'total_signals_today',     (SELECT COUNT(*) FROM signals WHERE created_at >= NOW() - INTERVAL '24 hours'),
      'total_countries_active',  (SELECT COUNT(DISTINCT location_country) FROM listings WHERE location_country IS NOT NULL AND length(location_country) = 2),
      'ia_signals_qualified',    (SELECT COUNT(*) FROM ia_signals WHERE stage = 'qualified'),
      'published_briefings',     (SELECT COUNT(*) FROM jurisdiction_briefings WHERE status = 'published'),
      'hv_feed_items',           (SELECT COUNT(*) FROM hv_public_feed WHERE status = 'published'),
      'opportunities_now',       (SELECT COUNT(*) FROM opportunities WHERE priority = 'now'),
      'platform_health',         public.get_platform_health()
    ) INTO v_result;

  ELSIF p_role_id IN ('supplier','exporter','cultivator_producer','processor_extractor') THEN
    SELECT jsonb_build_object(
      'role',                  p_role_id,
      'total_active_listings', (SELECT COUNT(*) FROM listings WHERE p_country IS NULL OR location_country = UPPER(p_country)),
      'global_listings',       (SELECT COUNT(*) FROM listings),
      'categories_available',  (SELECT COUNT(DISTINCT category::text) FROM listings),
      'signals_this_week',     (SELECT COUNT(*) FROM signals WHERE created_at >= NOW() - INTERVAL '7 days' AND (p_country IS NULL OR country = v_country_name OR country = 'Global')),
      'top_signal_category',   (SELECT cat FROM signals WHERE (p_country IS NULL OR country = v_country_name OR country = 'Global') AND created_at >= NOW() - INTERVAL '30 days' AND cat != 'SOURCE_ENGINE' GROUP BY cat ORDER BY COUNT(*) DESC LIMIT 1),
      'open_inquiries',        (SELECT COUNT(*) FROM marketplace_inquiries WHERE review_status IS NULL OR review_status != 'closed'),
      'buyer_requests_active', (SELECT COUNT(*) FROM buyer_requests),
      'ia_signals_market',     (SELECT COUNT(*) FROM ia_signals WHERE (p_country IS NULL OR market = v_country_name OR market = 'Global') AND stage = 'qualified'),
      'briefing_available',    (SELECT EXISTS(SELECT 1 FROM jurisdiction_briefings WHERE country_iso2 = UPPER(COALESCE(p_country,'')) AND status = 'published'))
    ) INTO v_result;

  ELSIF p_role_id IN ('buyer','importer','distributor_wholesaler','retail_operator') THEN
    SELECT jsonb_build_object(
      'role',                   p_role_id,
      'available_listings',     (SELECT COUNT(*) FROM listings WHERE p_country IS NULL OR location_country = UPPER(p_country)),
      'global_listings',        (SELECT COUNT(*) FROM listings),
      'signals_this_week',      (SELECT COUNT(*) FROM signals WHERE created_at >= NOW() - INTERVAL '7 days' AND (p_country IS NULL OR country = v_country_name OR country = 'Global')),
      'categories',             (SELECT jsonb_agg(DISTINCT category::text ORDER BY category::text) FROM listings),
      'active_buyer_requests',  (SELECT COUNT(*) FROM buyer_requests),
      'marketplace_inquiries',  (SELECT COUNT(*) FROM marketplace_inquiries),
      'briefing_available',     (SELECT EXISTS(SELECT 1 FROM jurisdiction_briefings WHERE country_iso2 = UPPER(COALESCE(p_country,'')) AND status = 'published'))
    ) INTO v_result;

  ELSIF p_role_id IN ('investor_operator','regulatory_compliance','broker_trader') THEN
    SELECT jsonb_build_object(
      'role',                   p_role_id,
      'total_market_listings',  (SELECT COUNT(*) FROM listings),
      'signals_total',          (SELECT COUNT(*) FROM signals WHERE p_country IS NULL OR country = v_country_name),
      'high_priority_signals',  (SELECT COUNT(*) FROM signals WHERE pri = 'high' AND (p_country IS NULL OR country = v_country_name) AND created_at >= NOW() - INTERVAL '30 days'),
      'countries_with_listings',(SELECT COUNT(DISTINCT location_country) FROM listings WHERE location_country IS NOT NULL AND length(location_country) = 2),
      'signals_this_week',      (SELECT COUNT(*) FROM signals WHERE created_at >= NOW() - INTERVAL '7 days' AND (p_country IS NULL OR country = v_country_name OR country = 'Global')),
      'ia_signals_qualified',   (SELECT COUNT(*) FROM ia_signals WHERE stage = 'qualified' AND (p_country IS NULL OR market = v_country_name)),
      'opportunities_now',      (SELECT COUNT(*) FROM opportunities WHERE priority = 'now')
    ) INTO v_result;

  ELSE
    SELECT jsonb_build_object(
      'role',              'visitor',
      'total_listings',    (SELECT COUNT(*) FROM listings),
      'countries_covered', (SELECT COUNT(*) FROM countries),
      'signals_available', (SELECT COUNT(*) FROM signals WHERE reviewed = true),
      'categories',        (SELECT jsonb_agg(DISTINCT category::text ORDER BY category::text) FROM listings),
      'feed_items',        (SELECT COUNT(*) FROM hv_public_feed WHERE status = 'published')
    ) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;

-- ─── 6. VIEW: signals_intelligence_feed ──────────────────────────────────────
CREATE OR REPLACE VIEW public.signals_intelligence_feed AS
SELECT
  s.id::text   AS signal_id,
  s.headline   AS title,
  s.summary,
  s.cat        AS category,
  s.country,
  s.date       AS signal_date,
  s.score,
  s.pri        AS priority,
  s.commercial_impact,
  s.url,
  s.source,
  s.reviewed,
  s.created_at,
  'signals'    AS source_table
FROM public.signals s
WHERE s.reviewed = true AND s.score >= 6

UNION ALL

SELECT
  ia.id,
  ia.title,
  ia.summary,
  ia.category,
  ia.market    AS country,
  ia.detected_at AS signal_date,
  (ia.confidence / 10)::numeric AS score,
  ia.commercial_impact AS priority,
  ia.commercial_impact,
  NULL         AS url,
  ia.source_name AS source,
  true         AS reviewed,
  ia.created_at,
  'ia_signals' AS source_table
FROM public.ia_signals ia
WHERE ia.stage IN ('qualified','converted_to_opportunity')
  AND ia.id NOT LIKE 's-%';

-- ─── 7. VIEW: platform_coverage_summary ──────────────────────────────────────
CREATE OR REPLACE VIEW public.platform_coverage_summary AS
SELECT
  c.iso_alpha2,
  c.country_name,
  c.region,
  c.medical_status,
  c.adult_use_status,
  c.import_status,
  c.export_status,
  c.opportunity_score,
  ci.review_status    AS intel_review_status,
  ci.regulatory_tier,
  jb.headline         AS latest_briefing,
  jb.week_ending      AS briefing_week,
  jb.legal_status     AS briefing_legal_status,
  COUNT(DISTINCT sr.id)   AS source_count,
  COUNT(DISTINCT l.id)    AS listing_count,
  COUNT(DISTINCT sig.id)  AS signal_count_7d
FROM public.countries c
LEFT JOIN public.country_intel ci ON ci.country_code = c.iso_alpha2
LEFT JOIN LATERAL (
  SELECT headline, week_ending, legal_status
  FROM public.jurisdiction_briefings
  WHERE country_iso2 = c.iso_alpha2 AND status = 'published'
  ORDER BY week_ending DESC LIMIT 1
) jb ON true
LEFT JOIN public.source_registry sr ON sr.iso = c.iso_alpha2 AND sr.is_active = true
LEFT JOIN public.listings l ON l.location_country = c.iso_alpha2 AND l.status = 'approved'
LEFT JOIN public.signals sig ON sig.country = c.country_name AND sig.created_at >= NOW() - INTERVAL '7 days'
GROUP BY
  c.iso_alpha2, c.country_name, c.region,
  c.medical_status, c.adult_use_status, c.import_status, c.export_status, c.opportunity_score,
  ci.review_status, ci.regulatory_tier,
  jb.headline, jb.week_ending, jb.legal_status;

-- ─── 8. SIGNAL SUBSCRIPTIONS: seed for existing users (with user_id) ──────────
INSERT INTO public.signal_subscriptions (
  user_id, email, markets, types, min_confidence, frequency, active, created_at, updated_at
)
SELECT
  up.id,
  up.email,
  ARRAY['Global','Canada','Germany','Australia','United Kingdom'],
  ARRAY['regulatory','market','financial'],
  7,
  'weekly',
  true,
  NOW(),
  NOW()
FROM public.user_profiles up
WHERE up.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.signal_subscriptions ss WHERE ss.email = up.email
  );

-- ─── 9. MISSING updated_at TRIGGERS ──────────────────────────────────────────
DROP TRIGGER IF EXISTS set_ia_signals_updated_at ON public.ia_signals;
CREATE TRIGGER set_ia_signals_updated_at
  BEFORE UPDATE ON public.ia_signals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_hv_public_feed_updated_at ON public.hv_public_feed;
CREATE TRIGGER set_hv_public_feed_updated_at
  BEFORE UPDATE ON public.hv_public_feed
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_opportunities_updated_at ON public.opportunities;
CREATE TRIGGER set_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_signal_subscriptions_updated_at ON public.signal_subscriptions;
CREATE TRIGGER set_signal_subscriptions_updated_at
  BEFORE UPDATE ON public.signal_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
