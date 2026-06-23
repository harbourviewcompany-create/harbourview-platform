-- Gate 9: RLS advisor security hardening — 2026-06-23
-- Fixes three classes of issues flagged by Supabase security advisor:
--   1. RLS disabled on 11 public content/education tables
--   2. Anon role can execute admin role-check functions
--   3. Trigger functions have mutable search_path

-- ── 1. Enable RLS on public content/education tables
-- These tables were PostgREST-accessible without RLS (read AND write open to all).
-- All are static reference/educational content → SELECT open to anon+authenticated, no DML permitted.

ALTER TABLE public.education_tracks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_articles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_systems         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subchapters               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_support_objects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_records          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_dependencies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_decision_support_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subchapter_evidence_map   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON public.education_tracks          FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.education_articles        FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.reference_systems         FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.modules                   FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.chapters                  FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.subchapters               FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.decision_support_objects  FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.evidence_records          FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.module_dependencies       FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.chapter_decision_support_map FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.subchapter_evidence_map   FOR SELECT USING (true);

-- ── 2. Revoke anon EXECUTE from admin role-check functions
-- is_hv_staff() and is_genetics_admin_or_reviewer() must not be callable without auth.
REVOKE EXECUTE ON FUNCTION public.is_hv_staff()                   FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_genetics_admin_or_reviewer() FROM anon;

-- ── 3. Fix mutable search_path on updated_at trigger functions
-- Recreate with SET search_path = public to prevent search_path injection.
CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_market_metrics_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_trade_flows_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
