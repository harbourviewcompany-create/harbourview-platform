-- Phase B (optional): additive framework_alignment JSONB on clinical_evidence_records.
-- Safe to apply forward-only. Does not change clinical conclusions, review gates, or public search.
-- Application code may read/write this column when present; absence is treated as unmapped.

ALTER TABLE public.clinical_evidence_records
  ADD COLUMN IF NOT EXISTS framework_alignment jsonb NULL;

COMMENT ON COLUMN public.clinical_evidence_records.framework_alignment IS
  'Optional commercial evidence strategy alignment (IMDRF / DTA / DTx RWE / FDA RWE / stage-gate). Metadata only; does not replace GRADE or clinical review.';

-- Optional child table for living claim map entries (operator dossiers).
CREATE TABLE IF NOT EXISTS public.clinical_evidence_claim_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_key text NOT NULL UNIQUE,
  claim_statement text NOT NULL,
  claim_kind text NOT NULL DEFAULT 'other',
  framework_alignment jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence_record_ids text[] NOT NULL DEFAULT '{}',
  gap_owner text NULL,
  target_date date NULL,
  status text NOT NULL DEFAULT 'partial'
    CHECK (status IN ('complete', 'partial', 'gap')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_user_id uuid NULL
);

COMMENT ON TABLE public.clinical_evidence_claim_map IS
  'Operator claim → framework map for commercial readiness. Not clinician-facing directives.';

CREATE INDEX IF NOT EXISTS clinical_evidence_claim_map_status_idx
  ON public.clinical_evidence_claim_map (status);

-- RLS. Every other table in public carries it, and the api-schema views grant
-- anon INSERT/UPDATE/DELETE on the assumption that base-table RLS is what
-- actually holds. Shipping a new public table without it would make this the
-- fourth RLS-disabled public table and would widen that gap.
--
-- Enabled with no permissive policy on purpose: nothing reads or writes this
-- table yet (app/admin/(protected)/clinical-review/claim-map renders from
-- CLAIM_MAP_FIXTURES, not from the database), so deny-by-default costs nothing
-- today and is the safe starting point. The service role bypasses RLS, so
-- operator tooling still works.
--
-- Whoever wires the Claim Map UI to this table adds the explicit policies then,
-- as a reviewed security change, rather than inheriting an open table.
ALTER TABLE public.clinical_evidence_claim_map ENABLE ROW LEVEL SECURITY;
