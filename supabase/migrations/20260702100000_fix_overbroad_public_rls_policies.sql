-- SECURITY FIX: hv_entity_mentions and hv_regulatory_trajectory had
-- service_role_full_access policies scoped to {public} (all roles), not
-- {service_role}. This granted anon and authenticated users full INSERT,
-- UPDATE, DELETE, and TRUNCATE access — identical to the api-schema
-- security_invoker bug fixed on Jul 1 (PR #916 / migration 20260701001549).
--
-- Confirmed live: the policy shows roles='{public}' in pg_policies, meaning
-- every role (anon, authenticated, service_role) could write to these tables.
-- public.user_profiles has own-row-only RLS but hv_entity_mentions (which
-- stores AI-generated entity tags for signals) was fully writable by any
-- unauthenticated caller. Fixed by replacing with service_role-only policies.

-- hv_entity_mentions
DROP POLICY IF EXISTS "service_role_full_access" ON public.hv_entity_mentions;
CREATE POLICY "service_role_all_hv_entity_mentions"
  ON public.hv_entity_mentions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- hv_regulatory_trajectory
DROP POLICY IF EXISTS "service_role_full_access" ON public.hv_regulatory_trajectory;
CREATE POLICY "service_role_all_hv_regulatory_trajectory"
  ON public.hv_regulatory_trajectory
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
