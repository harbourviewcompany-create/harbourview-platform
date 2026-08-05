-- ============================================================
-- PART 1: Revoke anon EXECUTE on SECURITY DEFINER functions
-- that should never be callable via RPC without auth.
-- Deterministic replay guard: some functions are created later in the
-- historical chain in zero-state environments.
-- ============================================================

do $anon_function_hardening$
begin
  if to_regprocedure('public.handle_new_user()') is not null then
    execute 'revoke execute on function public.handle_new_user() from anon';
  end if;
  if to_regprocedure('public.hv_audit_publication()') is not null then
    execute 'revoke execute on function public.hv_audit_publication() from anon';
  end if;
  if to_regprocedure('public.hv_audit_review_decision()') is not null then
    execute 'revoke execute on function public.hv_audit_review_decision() from anon';
  end if;
  if to_regprocedure('public.hv_requeue_failed_embed_jobs()') is not null then
    execute 'revoke execute on function public.hv_requeue_failed_embed_jobs() from anon';
  end if;
  if to_regprocedure('public.sync_subscription_tier()') is not null then
    execute 'revoke execute on function public.sync_subscription_tier() from anon';
  end if;
end
$anon_function_hardening$;

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
