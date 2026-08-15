-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260714230853.
--
-- Rewriting this file cannot affect production: 20260714230853 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- Stage 0 hardening: an INDEPENDENT, non-LLM structural heuristic that predicts
-- junk-vs-content from surface features of the snapshot text, computed in SQL.
-- Purpose: it is a second "annotator" whose errors are UNCORRELATED with the
-- assistant's semantic labels. Where the two agree, confidence is high; where
-- they disagree, the row is genuinely ambiguous and is the priority human-review
-- queue. This is how the set is graded rather than self-asserted (spec §9.2),
-- given human labeling is deferred.
-- Additive columns on intel_eval_set. Reversible:
--   alter table public.intel_eval_set drop column struct_is_junk, drop column struct_reason, drop column needs_human;

alter table public.intel_eval_set
  add column if not exists struct_is_junk boolean,
  add column if not exists struct_reason  text,
  add column if not exists needs_human    boolean not null default false;

comment on column public.intel_eval_set.struct_is_junk is
  'Independent non-LLM heuristic: does surface structure look like nav/boilerplate/spam (true) vs real content (false)? Errors uncorrelated with the assistant semantic label by construction.';
comment on column public.intel_eval_set.needs_human is
  'true = the structural heuristic disagrees with the assistant quality label (junk vs signal). Priority human-adjudication queue; small + high-leverage.';
