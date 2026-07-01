-- Documents match_rationale AI-generated match explanation columns on public.matches.
-- Originally applied directly to remote (PR #921: "feat(ai): register Anthropic as
-- gateway provider; add match rationale + digest narrative"). This file replaces a
-- blank repair stub with real documenting SQL once the column set was confirmed via
-- direct schema inspection (pg_attribute) against the live database.
--
-- Idempotent: uses IF NOT EXISTS so it is safe to run against a database that
-- already has these columns (as this one does).

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS match_rationale text,
  ADD COLUMN IF NOT EXISTS match_rationale_model text,
  ADD COLUMN IF NOT EXISTS match_rationale_generated_at timestamptz;

COMMENT ON COLUMN public.matches.match_rationale IS
  'Best-effort AI-generated explanation of why this listing/buyer_request pair was matched. Nullable — not generated for every match (capped at 8 generations/run, see lib/marketplace/matchRationale.ts).';
COMMENT ON COLUMN public.matches.match_rationale_model IS
  'The LLM model identifier used to generate match_rationale, for provenance/auditing.';
COMMENT ON COLUMN public.matches.match_rationale_generated_at IS
  'Timestamp when match_rationale was generated. Null if not yet generated for this match.';
