-- ============================================================
-- PART 1: Revoke anon EXECUTE on SECURITY DEFINER functions
-- that should never be callable via RPC without auth.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.hv_audit_publication() FROM anon;
REVOKE EXECUTE ON FUNCTION public.hv_audit_review_decision() FROM anon;
REVOKE EXECUTE ON FUNCTION public.hv_requeue_failed_embed_jobs() FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_subscription_tier() FROM anon;


-- ============================================================
-- PART 2: Scope regulatory_signals RLS policies from
-- USING (true) / WITH CHECK (true) for authenticated
-- down to admin-role-only.
-- ============================================================

DROP POLICY IF EXISTS admin_all ON regulatory_signals.sources;
DROP POLICY IF EXISTS admin_all ON regulatory_signals.evidence;
DROP POLICY IF EXISTS admin_all ON regulatory_signals.signals;
DROP POLICY IF EXISTS admin_all ON regulatory_signals.signal_evidence_links;
DROP POLICY IF EXISTS admin_all ON regulatory_signals.review_events;
DROP POLICY IF EXISTS admin_all ON regulatory_signals.publication_events;

CREATE POLICY "admin_all" ON regulatory_signals.sources FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

CREATE POLICY "admin_all" ON regulatory_signals.evidence FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

CREATE POLICY "admin_all" ON regulatory_signals.signals FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

CREATE POLICY "admin_all" ON regulatory_signals.signal_evidence_links FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

CREATE POLICY "admin_all" ON regulatory_signals.review_events FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

CREATE POLICY "admin_all" ON regulatory_signals.publication_events FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));
