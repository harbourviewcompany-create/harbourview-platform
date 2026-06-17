-- =============================================================================
-- signal_subscriptions + signal_digest_log
-- =============================================================================
-- signal_subscriptions: per-user alert preferences for ia_signals.
-- signal_digest_log:    audit of which signals have been sent to whom
--                       (prevents re-sending the same signal).
--
-- Gating: intel + operator tiers only (enforced in the API route).
-- Delivery: daily digest via intelligence-notify cron (07:00 UTC).

-- ── signal_subscriptions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.signal_subscriptions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email            text        NOT NULL,                    -- denormalised for cron access

  -- Filter dimensions — empty array means "all values"
  markets          text[]      NOT NULL DEFAULT '{}',       -- [] = all markets
  types            text[]      NOT NULL DEFAULT '{}',       -- [] = all signal types
  min_confidence   integer     NOT NULL DEFAULT 50
                               CHECK (min_confidence BETWEEN 0 AND 100),

  -- Delivery config
  frequency        text        NOT NULL DEFAULT 'daily'
                               CHECK (frequency IN ('daily', 'weekly')),
  active           boolean     NOT NULL DEFAULT true,
  last_sent_at     timestamptz,

  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_user_id
  ON public.signal_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_active
  ON public.signal_subscriptions (active, frequency, last_sent_at)
  WHERE active = true;

ALTER TABLE public.signal_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users manage their own subscriptions
DROP POLICY IF EXISTS signal_subscriptions_user_self ON public.signal_subscriptions;
CREATE POLICY signal_subscriptions_user_self
  ON public.signal_subscriptions
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role (cron) reads all active subscriptions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_subscriptions TO service_role;

-- Updated-at trigger
DROP TRIGGER IF EXISTS set_signal_subscriptions_updated_at ON public.signal_subscriptions;
CREATE TRIGGER set_signal_subscriptions_updated_at
  BEFORE UPDATE ON public.signal_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── signal_digest_log ─────────────────────────────────────────────────────────
-- Records every (subscription, signal) pair that has been sent.
-- UNIQUE constraint prevents the notify cron from sending duplicates.
CREATE TABLE IF NOT EXISTS public.signal_digest_log (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id  uuid        NOT NULL
                               REFERENCES public.signal_subscriptions(id) ON DELETE CASCADE,
  signal_id        text        NOT NULL,                    -- ia_signals.id (text PK)
  sent_at          timestamptz NOT NULL DEFAULT now(),

  UNIQUE (subscription_id, signal_id)
);

CREATE INDEX IF NOT EXISTS idx_signal_digest_log_subscription
  ON public.signal_digest_log (subscription_id, sent_at DESC);

ALTER TABLE public.signal_digest_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS signal_digest_log_user_read ON public.signal_digest_log;
CREATE POLICY signal_digest_log_user_read
  ON public.signal_digest_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.signal_subscriptions s
      WHERE s.id = signal_digest_log.subscription_id
        AND s.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT ON public.signal_digest_log TO service_role;
