-- Applied directly to production via Supabase MCP apply_migration on 2026-07-20.
-- This file reconciles the migration ledger (supabase_migrations.schema_migrations)
-- with the change already live in production.
--
-- Root cause this guards against: typical_timeline_months on jurisdiction_playbooks
-- has twice been fabricated as 0 (a placeholder value) by manual SQL content-migration
-- batches, most recently reintroduced after the first fix (see
-- 20260718184353_playbook_null_fabricated_timelines.sql and the 2026-07-19/2026-07-20
-- EVIDENCE_LOG.md entries). There is no application write path for this column — all
-- writes are hand-authored migrations — so there is no code-level guard to add. This
-- CHECK constraint makes a future zero-value batch fail loudly at migration time
-- instead of silently landing on a published, customer-facing table.
ALTER TABLE public.jurisdiction_playbooks
  ADD CONSTRAINT jurisdiction_playbooks_timeline_months_positive_check
  CHECK (typical_timeline_months IS NULL OR typical_timeline_months > 0);
