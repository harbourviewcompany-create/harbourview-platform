-- ============================================================
-- HV-001 Production Spine: Security & Runtime Fixes
-- Migration: hv001_production_spine_security_and_runtime_fixes
-- Applied: 2026-04-25
--
-- CVE-1  user_roles wildcard RLS (privilege escalation via anon key)
-- CVE-2  TRUNCATE granted to anon on all production tables (RLS bypass)
-- CVE-3  hv_* internal tables: RLS disabled + full anon grants (open read/write)
-- BUG-1a revoke_publish_event: 'revoked' not in dossier_status enum
-- BUG-1b revoke_publish_event: 'revoked' not in audit_action enum
-- BUG-2  block_published_dossier_mutation blocks supersede/revoke transitions
-- BUG-3  return_signal: 'updated' not in audit_action enum
-- BUG-4  duplicate dossier immutability trigger
--
-- Rollback notes (apply in reverse order):
--   See HV001_VERIFICATION_CHECKLIST.md for full rollback procedure.
-- ============================================================


-- ============================================================
-- CVE-1: Fix user_roles RLS
-- Before: roles_admin_write (cmd=ALL, qual=true, with_check=true, roles={public})
--         Allowed unauthenticated anon key to read/write ALL user role assignments.
-- After:  admin-only write (platform admin), self-read for authenticated only.
-- Bypass-risk: NONE. sync_profile_role_to_user_roles is SECURITY DEFINER and
--   continues to write correctly. No client path to user_roles without admin JWT.
-- ============================================================
DROP POLICY IF EXISTS roles_admin_write   ON public.user_roles;
DROP POLICY IF EXISTS roles_self_read     ON public.user_roles;

CREATE POLICY user_roles_admin_write ON public.user_roles
  FOR ALL TO authenticated
  USING    (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY user_roles_self_select ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());


-- ============================================================
-- CVE-2: Revoke TRUNCATE and TRIGGER from anon/authenticated on all production tables
-- TRUNCATE bypasses RLS entirely — anon key could wipe production data.
-- TRIGGER grant allows clients to attach triggers (unnecessary and dangerous).
-- Rollback: GRANT TRUNCATE ON <tables> TO anon, authenticated; (not recommended)
-- ============================================================
REVOKE TRUNCATE, TRIGGER ON public.profiles                   FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.workspaces                 FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.workspace_members          FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.sources                    FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.source_documents           FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.signals                    FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.signal_evidence            FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.review_queue_items         FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.dossiers                   FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.dossier_items              FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.publish_events             FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.audit_events               FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.user_roles                 FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.organizations              FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.intake_submissions         FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.intake_signal_evaluations  FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.intake_artifacts           FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.intake_notes               FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.intake_events              FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.intake_assignments         FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.mandates                   FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.builder_agent_runs         FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER ON public.dev_session_log            FROM anon, authenticated;


-- ============================================================
-- CVE-3: Lock down hv_* internal tracking tables
-- These tables held internal ops metadata (env keys, migration state,
-- execution board, artifact register, backup logs) with NO RLS and full anon grants.
-- Enable RLS and restrict to platform admins only.
-- Rollback: ALTER TABLE hv_* DISABLE ROW LEVEL SECURITY;
--           DROP POLICY IF EXISTS hv_admin_only ON hv_*;
-- Bypass-risk: service_role bypasses RLS (intentional for migrations/MCP).
-- ============================================================
REVOKE ALL ON public.hv_execution_board       FROM anon;
REVOKE ALL ON public.hv_execution_plan        FROM anon;
REVOKE ALL ON public.hv_control_charter       FROM anon;
REVOKE ALL ON public.hv_artifact_register     FROM anon;
REVOKE ALL ON public.hv_env_baseline          FROM anon;
REVOKE ALL ON public.hv_migration_baseline    FROM anon;
REVOKE ALL ON public.hv_schema_snapshot       FROM anon;
REVOKE ALL ON public.hv_evidence_standard     FROM anon;
REVOKE ALL ON public.hv_seed_register         FROM anon;
REVOKE ALL ON public.hv_cutover_rules         FROM anon;
REVOKE ALL ON public.hv_release_checklist     FROM anon;
REVOKE ALL ON public.hv_backup_log            FROM anon;
REVOKE ALL ON public.hv_restore_runbook       FROM anon;
REVOKE ALL ON public.hv_migration_gate        FROM anon;
REVOKE ALL ON public.dev_session_log          FROM anon;

REVOKE TRUNCATE, TRIGGER ON public.hv_execution_board       FROM authenticated;
REVOKE TRUNCATE, TRIGGER ON public.hv_execution_plan        FROM authenticated;
REVOKE TRUNCATE, TRIGGER ON public.hv_control_charter       FROM authenticated;
REVOKE TRUNCATE, TRIGGER ON public.hv_artifact_register     FROM authenticated;
REVOKE TRUNCATE, TRIGGER ON public.hv_env_baseline          FROM authenticated;
REVOKE TRUNCATE, TRIGGER ON public.hv_migration_baseline    FROM authenticated;
REVOKE TRUNCATE, TRIGGER ON public.hv_schema_snapshot       FROM authenticated;
REVOKE TRUNCATE, TRIGGER ON public.hv_evidence_standard     FROM authenticated;
REVOKE TRUNCATE, TRIGGER ON public.hv_seed_register         FROM authenticated;
REVOKE TRUNCATE, TRIGGER ON public.hv_cutover_rules         FROM authenticated;
REVOKE TRUNCATE, TRIGGER ON public.hv_release_checklist     FROM authenticated;
REVOKE TRUNCATE, TRIGGER ON public.hv_backup_log            FROM authenticated;
REVOKE TRUNCATE, TRIGGER ON public.hv_restore_runbook       FROM authenticated;
REVOKE TRUNCATE, TRIGGER ON public.hv_migration_gate        FROM authenticated;

ALTER TABLE public.hv_execution_board       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_execution_plan        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_control_charter       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_artifact_register     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_env_baseline          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_migration_baseline    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_schema_snapshot       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_evidence_standard     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_seed_register         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_cutover_rules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_release_checklist     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_backup_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_restore_runbook       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_migration_gate        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_session_log          ENABLE ROW LEVEL SECURITY;

CREATE POLICY hv_admin_only ON public.hv_execution_board      FOR ALL TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());
CREATE POLICY hv_admin_only ON public.hv_execution_plan       FOR ALL TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());
CREATE POLICY hv_admin_only ON public.hv_control_charter      FOR ALL TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());
CREATE POLICY hv_admin_only ON public.hv_artifact_register    FOR ALL TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());
CREATE POLICY hv_admin_only ON public.hv_env_baseline         FOR ALL TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());
CREATE POLICY hv_admin_only ON public.hv_migration_baseline   FOR ALL TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());
CREATE POLICY hv_admin_only ON public.hv_schema_snapshot      FOR ALL TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());
CREATE POLICY hv_admin_only ON public.hv_evidence_standard    FOR ALL TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());
CREATE POLICY hv_admin_only ON public.hv_seed_register        FOR ALL TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());
CREATE POLICY hv_admin_only ON public.hv_cutover_rules        FOR ALL TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());
CREATE POLICY hv_admin_only ON public.hv_release_checklist    FOR ALL TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());
CREATE POLICY hv_admin_only ON public.hv_backup_log           FOR ALL TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());
CREATE POLICY hv_admin_only ON public.hv_restore_runbook      FOR ALL TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());
CREATE POLICY hv_admin_only ON public.hv_migration_gate       FOR ALL TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());
CREATE POLICY hv_admin_only ON public.dev_session_log         FOR ALL TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());


-- ============================================================
-- BUG-2: Fix block_published_dossier_mutation
-- Before: blocked ALL updates when OLD.status='published'
--         This prevented revoke_publish_event (→archived) and
--         supersede_dossier (→superseded) from ever succeeding.
-- After:  allows only published→archived and published→superseded.
--         All other mutations to published dossiers still raise EXCEPTION.
-- Bypass-risk: Only SECURITY DEFINER admin functions reach this path.
--   Direct API UPDATE is blocked by RLS (status='draft' check on dossiers_update).
-- Rollback: Recreate with original body (blocks all changes when published).
-- ============================================================
CREATE OR REPLACE FUNCTION public.block_published_dossier_mutation()
RETURNS trigger LANGUAGE plpgsql AS $function$
BEGIN
  IF OLD.status = 'published' THEN
    -- Allow admin-initiated transitions required by:
    --   revoke_publish_event  → published → archived
    --   supersede_dossier     → published → superseded
    IF NEW.status IN ('archived'::dossier_status, 'superseded'::dossier_status) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Published dossiers are immutable. Use revoke_publish_event() or supersede_dossier().';
  END IF;
  RETURN NEW;
END;
$function$;


-- ============================================================
-- BUG-4: Drop duplicate dossier immutability trigger
-- dossier_immutability_guard and trg_block_published_dossier both call
-- the same function on BEFORE UPDATE. Keep trg_block_published_dossier.
-- Rollback: CREATE TRIGGER dossier_immutability_guard BEFORE UPDATE ON
--           public.dossiers FOR EACH ROW EXECUTE FUNCTION block_published_dossier_mutation();
-- ============================================================
DROP TRIGGER IF EXISTS dossier_immutability_guard ON public.dossiers;


-- ============================================================
-- BUG-1a + BUG-1b: Fix revoke_publish_event
-- BUG-1a: SET status = 'revoked' on dossiers → 'revoked' not in dossier_status enum
--         Fixed: use 'archived'
-- BUG-1b: action_type = 'revoked' in audit_events → not in audit_action enum
--         Fixed: use 'revoke'
-- Rollback: restore original function body (always broken — not recommended)
-- ============================================================
CREATE OR REPLACE FUNCTION public.revoke_publish_event(p_event_id uuid, p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE
  ev     publish_events%ROWTYPE;
  new_id uuid;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'Only platform admins can revoke publish events.';
  END IF;

  SELECT * INTO ev FROM publish_events WHERE id = p_event_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Publish event not found.'; END IF;
  IF ev.status = 'revoked' THEN RAISE EXCEPTION 'Publish event already revoked.'; END IF;

  -- Append-only revocation row (original row is never mutated)
  INSERT INTO publish_events (
    dossier_id, workspace_id, status, published_by_profile_id,
    snapshot_json, revokes_event_id, revoked_by_profile_id, revoke_reason
  ) VALUES (
    ev.dossier_id, ev.workspace_id, 'revoked', ev.published_by_profile_id,
    ev.snapshot_json, p_event_id, auth.uid(), p_reason
  ) RETURNING id INTO new_id;

  -- FIX BUG-1a: 'archived' is the correct dossier_status enum value
  UPDATE dossiers
    SET status = 'archived'::dossier_status, updated_at = now()
  WHERE id = ev.dossier_id;

  -- FIX BUG-1b: 'revoke' is the correct audit_action enum value
  INSERT INTO audit_events (
    entity_type, entity_id, action_type,
    performed_by_profile_id, from_status, to_status, change_summary
  ) VALUES (
    'dossier', ev.dossier_id, 'revoke'::audit_action,
    auth.uid(), 'published', 'archived', p_reason
  );

  RETURN jsonb_build_object('success', true, 'revocation_event_id', new_id);
END;
$function$;


-- ============================================================
-- BUG-3: Fix return_signal
-- Before: action_type = 'updated' — not in audit_action enum; INSERT always fails
-- After:  action_type = 'return_for_revision' — correct enum value
-- Rollback: restore 'updated' (always broken — not recommended)
-- ============================================================
CREATE OR REPLACE FUNCTION public.return_signal(p_queue_item_id uuid, p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE
  item review_queue_items%ROWTYPE;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'Only platform admins can return signals.';
  END IF;

  SELECT * INTO item FROM review_queue_items WHERE id = p_queue_item_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Queue item not found.'; END IF;

  UPDATE review_queue_items SET
    status                 = 'returned',
    return_reason          = p_reason,
    resolved_at            = now(),
    resolved_by_profile_id = auth.uid(),
    updated_at             = now()
  WHERE id = p_queue_item_id;

  -- FIX BUG-3: 'return_for_revision' is the correct audit_action enum value
  INSERT INTO audit_events (
    entity_type, entity_id, action_type,
    performed_by_profile_id, from_status, to_status, change_summary
  ) VALUES (
    'signal', item.signal_id, 'return_for_revision'::audit_action,
    auth.uid(), item.status, 'returned', p_reason
  );

  RETURN jsonb_build_object('success', true, 'signal_id', item.signal_id);
END;
$function$;
