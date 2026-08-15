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
-- version 20260721115255.
--
-- Rewriting this file cannot affect production: 20260721115255 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Follow-up to backfill_dedupe_malformed_signal_headlines: 33 rows had an
-- unclosed HTML tag (the raw Google News/Reddit <a href="..."> link, whose
-- long token got cut off by the 500-char candidate-text truncation before
-- ever reaching the closing '>'), so the tag-strip regexp_replace('<[^>]+>')
-- never matched. Verified by dry-run: in every remaining row the clean
-- "Title - Source" text is fully intact immediately before the first
-- literal '<' -- truncate there. Same scope guard as the prior backfill:
-- reviewed=false only (no published content touched).
WITH dirty AS (
  SELECT id, summary
  FROM public.signals
  WHERE reviewed = false
    AND summary LIKE '%<%'
    AND (headline ILIKE '%&nbsp;%' OR headline ILIKE '%<a href%' OR headline ILIKE '%<font%'
      OR summary  ILIKE '%&nbsp;%' OR summary  ILIKE '%<a href%' OR summary  ILIKE '%<font%')
)
UPDATE public.signals s
SET summary = trim(left(d.summary, strpos(d.summary, '<') - 1))
FROM dirty d
WHERE d.id = s.id
  AND strpos(d.summary, '<') > 1;
