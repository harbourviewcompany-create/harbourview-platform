-- =============================================================================
-- Fix tier-gated RLS on ia_signals + ia_signal_embeddings
-- =============================================================================
-- Problem:
--   ia_signals_admin_operator_all checks user_roles.role IN ('admin','operator')
--   user_roles is for internal Harbourview staff only.
--   Stripe subscribers get user_profiles.tier = 'intel' | 'operator'.
--   Intel/operator paying subscribers have NO user_roles row → zero rows returned.
--
-- Fix:
--   Keep admin_operator_all for full CRUD (internal ops).
--   Add intel_read SELECT policy that checks user_profiles.tier instead.
--   Operator tier inherits intel read (tierAtLeast logic mirrored in SQL).
-- =============================================================================

-- ── ia_signals ────────────────────────────────────────────────────────────────

-- Read: intel + operator tiers (Stripe subscribers)
DROP POLICY IF EXISTS ia_signals_intel_tier_read ON public.ia_signals;
CREATE POLICY ia_signals_intel_tier_read
  ON public.ia_signals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.tier IN ('intel', 'operator')
    )
  );

-- ── ia_signal_embeddings ──────────────────────────────────────────────────────
-- Same pattern — intel/operator can SELECT their signal embeddings.
-- (The search RPC is SECURITY DEFINER so it bypasses RLS, but direct
--  table access from the client SDK needs this policy too.)

DROP POLICY IF EXISTS ia_signal_embeddings_intel_tier_read ON public.ia_signal_embeddings;
CREATE POLICY ia_signal_embeddings_intel_tier_read
  ON public.ia_signal_embeddings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.tier IN ('intel', 'operator')
    )
  );

-- ── signal_subscriptions — already correct (user_self policy) ─────────────────
-- No change needed: signal_subscriptions uses auth.uid() = user_id which is
-- correct. The subscribe API enforces tier gating at the application layer.

-- ── Indexes to support the new policy predicate ───────────────────────────────
-- user_profiles.tier lookups in RLS predicates hit this on every row-check.
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier
  ON public.user_profiles (id, tier);
