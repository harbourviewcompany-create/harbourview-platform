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
-- version 20260723090942.
--
-- Rewriting this file cannot affect production: 20260723090942 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- One-time backfill for today's already-published daily_digest row, so the
-- REGULATION/80% display bug (see
-- ..._stage_d_daily_digest_preserve_real_type_confidence.sql, applied
-- immediately before this) is corrected on the live surface today rather
-- than only for tomorrow's freshly-generated edition. Same join logic as
-- the function fix. Only ADDS type/confidence keys to each headline
-- element -- headline/why_it_matters/market/signal_id are untouched.
-- Idempotent: guarded to only run if the first headline element doesn't
-- already have a 'type' key.

update public.daily_digest d
set headlines = (
  select jsonb_agg(
           h || jsonb_build_object(
             'type', coalesce(s.type, 'regulatory'),
             'confidence', coalesce(s.confidence, 50)
           )
           order by ord
         )
  from jsonb_array_elements(d.headlines) with ordinality as u(h, ord)
  left join public.ia_signals s on s.id = (h->>'signal_id')
)
where d.digest_date = current_date
  and d.headlines is not null
  and jsonb_array_length(d.headlines) > 0
  and not (d.headlines->0 ? 'type');
