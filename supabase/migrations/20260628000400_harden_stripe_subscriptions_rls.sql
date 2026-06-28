-- RLS hardening: stripe_subscriptions_user_profiles
-- Users may only read their own subscription row.
-- Writes are service_role only (Stripe webhook handler).

ALTER TABLE IF EXISTS public.stripe_subscriptions_user_profiles
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.stripe_subscriptions_user_profiles
  FORCE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "stripe_own_read"   ON public.stripe_subscriptions_user_profiles;
DROP POLICY IF EXISTS "stripe_anon_block" ON public.stripe_subscriptions_user_profiles;

-- Users read only their own row
CREATE POLICY "stripe_own_read"
  ON public.stripe_subscriptions_user_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Revoke anon entirely
REVOKE ALL ON public.stripe_subscriptions_user_profiles FROM anon;

-- Grant to authenticated (SELECT only — writes go through service_role)
GRANT SELECT ON public.stripe_subscriptions_user_profiles TO authenticated;
