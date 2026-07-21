-- Stage 0 of docs/INTELLIGENCE_ARCHITECTURE_SPEC.md: the labeled evaluation set.
-- Reason: the live scorer (score_signal_from_snapshot) is inverted and cannot be
-- trusted as a quality proxy. Every later stage (classifier, promotion) must be
-- validated against human labels BEFORE being wired to anything (spec 6.2, guardrail #2).
-- Additive, isolated, reversible. Rollback: DROP TABLE public.intel_eval_set;
-- RLS enabled with NO policies => service_role/admin only (deny-by-default per DATABASE_CONTROL.md).

-- Converted to a no-op stub on 2026-07-20: re-running the CREATE TABLE
-- below fails ("relation already exists"). Confirmed live via
-- information_schema.columns that public.intel_eval_set already exists
-- (24 columns, this file's 21 plus later additions) -- the real work was
-- already applied to production under the neighboring version
-- 20260714224152 (same filename, applied ~6 hours later that day).
SELECT 1;
