
-- ── 1. Enable RLS on public content/education tables (no RLS = PostgREST wide-open)
-- All 11 tables are static reference/educational content → SELECT open to all, no DML from anon/authenticated

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

-- Public SELECT for all roles (content is intended to be public-facing via PostgREST)
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
-- anon should never be able to call is_hv_staff() or is_genetics_admin_or_reviewer()
REVOKE EXECUTE ON FUNCTION public.is_hv_staff()                    FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_genetics_admin_or_reviewer()  FROM anon;

-- ── 3. Fix mutable search_path on updated_at trigger functions
-- Recreate with SET search_path = public to prevent search_path injection
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
