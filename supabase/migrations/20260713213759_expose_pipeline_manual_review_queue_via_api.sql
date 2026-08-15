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
-- version 20260713213759.
--
-- Rewriting this file cannot affect production: 20260713213759 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

alter table public.pipeline_manual_review_queue enable row level security;

create view api.pipeline_manual_review_queue
  with (security_invoker = on)
  as select
    id,
    pipeline,
    reference_date,
    reason,
    detail,
    created_at,
    notified_at,
    resolved_at,
    resolved_by
  from public.pipeline_manual_review_queue;

grant select, update on api.pipeline_manual_review_queue to service_role;
grant select, update on public.pipeline_manual_review_queue to service_role;
