-- =============================================================================
-- Harbourview Signal Engine V1 — RLS Migration
-- Milestone 1: Database Foundation
-- =============================================================================
-- INTEGRATION POINT (Milestone 2): Replace is_signal_admin() body with the
-- real admin check once auth conventions are wired. Options:
--   auth.jwt() ->> 'role' = 'admin'
--   (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean
--   auth.uid() IN (SELECT user_id FROM admin_users)
-- =============================================================================

-- Admin helper function (placeholder — always returns false until Milestone 2)
CREATE OR REPLACE FUNCTION is_signal_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT false;
  -- INTEGRATION POINT: replace with real admin check in Milestone 2
$$;

-- Helper: is the caller the service_role?
-- service_role bypasses RLS by default in Supabase; these policies are defence-in-depth.
-- We use current_role to allow explicit grants in non-Supabase environments.
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT current_role = 'service_role';
$$;

-- =============================================================================
-- Enable RLS on every signal engine table
-- =============================================================================
ALTER TABLE source_documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_chunks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_duplicate_groups  ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_candidates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_evidence          ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_review_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_jobs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_risk_flags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_prompt_versions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_call_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_entity_mentions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_conversions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_processing_errors ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Policy macro: DENY all by default
-- (No policy = no access for any role. These comments document intent.)
-- anon role:           DENY all — no policy created
-- authenticated (non-admin): DENY all — no policy created
-- Policies below grant the minimum required per role.
-- =============================================================================

-- =============================================================================
-- ADMIN: full read/write on all tables
-- =============================================================================
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'source_documents', 'source_chunks', 'signal_duplicate_groups',
    'signal_candidates', 'signal_evidence', 'signal_review_events',
    'signal_jobs', 'signal_risk_flags', 'model_prompt_versions',
    'model_call_logs', 'entities', 'signal_entity_mentions',
    'signal_conversions', 'signal_processing_errors'
  ]) LOOP
    EXECUTE format(
      'CREATE POLICY admin_all ON %I FOR ALL TO authenticated
       USING (is_signal_admin())
       WITH CHECK (is_signal_admin())',
      t
    );
  END LOOP;
END $$;

-- =============================================================================
-- SERVICE_ROLE: INSERT/UPDATE on processing tables
-- (service_role bypasses RLS in Supabase by default; these are defence-in-depth
--  and explicit grants for non-Supabase deployments.)
-- =============================================================================
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'signal_jobs', 'model_call_logs', 'signal_candidates',
    'signal_evidence', 'signal_processing_errors', 'source_chunks'
  ]) LOOP
    EXECUTE format(
      'CREATE POLICY service_role_write ON %I FOR INSERT TO service_role
       WITH CHECK (true)',
      t
    );
    EXECUTE format(
      'CREATE POLICY service_role_update ON %I FOR UPDATE TO service_role
       USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;
