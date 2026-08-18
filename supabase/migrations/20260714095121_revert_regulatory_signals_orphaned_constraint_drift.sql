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
-- version 20260714095121.
--
-- Rewriting this file cannot affect production: 20260714095121 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Reverts undocumented, out-of-band drift on regulatory_signals.signals
-- back to the original, git-tracked design in
-- 20260312000000_regulatory_signals_v1.sql.
--
-- Safe to fully revert: regulatory_signals.signals has 0 rows (confirmed
-- live immediately before this migration), so no existing data can violate
-- any restored NOT NULL or CHECK constraint.

-- ── Restore NOT NULL columns ──────────────────────────────────────────────────
alter table regulatory_signals.signals alter column slug set not null;
alter table regulatory_signals.signals alter column signal_date set not null;
alter table regulatory_signals.signals alter column source_tier set not null;
alter table regulatory_signals.signals alter column source_type set not null;
alter table regulatory_signals.signals alter column source_url set not null;
alter table regulatory_signals.signals alter column private_summary set not null;

-- ── Restore review_status default ─────────────────────────────────────────────
alter table regulatory_signals.signals alter column review_status set default 'captured';

-- ── Restore CHECK constraints to original values ──────────────────────────────
alter table regulatory_signals.signals drop constraint if exists regulatory_signals_review_status_check;
alter table regulatory_signals.signals add constraint regulatory_signals_review_status_check
  check (review_status in ('captured','triaged','needs_source_validation','in_review','approved_private','approved_public','published','rejected','archived','expired'));

alter table regulatory_signals.signals drop constraint if exists regulatory_signals_type_check;
alter table regulatory_signals.signals add constraint regulatory_signals_type_check
  check (signal_type in ('regulatory_change','policy_announcement','import_export_pathway','licensing_market_access','prescription_patient_access','hemp_cbd_controlled_cannabinoids','enforcement_compliance_action','consultation_pending_rule_change','court_agency_decision','controlled_substance_scheduling','customs_trade_requirement','quality_standard_requirement'));

alter table regulatory_signals.signals drop constraint if exists regulatory_signals_confidence_check;
alter table regulatory_signals.signals add constraint regulatory_signals_confidence_check
  check (confidence in ('low', 'medium', 'high', 'official_confirmed'));

-- ── Restore missing constraints ───────────────────────────────────────────────
alter table regulatory_signals.signals add constraint regulatory_signals_slug_not_empty
  check (length(trim(slug)) > 0);
alter table regulatory_signals.signals add constraint regulatory_signals_private_summary_not_empty
  check (length(trim(private_summary)) > 0);
alter table regulatory_signals.signals add constraint regulatory_signals_source_url_not_empty
  check (length(trim(source_url)) > 0);

alter table regulatory_signals.signals add constraint regulatory_signals_publication_gate
  check (
    review_status <> 'published'
    or (
      public_safe = true
      and publish_to_public = true
      and public_summary is not null
      and length(trim(public_summary)) > 0
      and public_implication is not null
      and length(trim(public_implication)) > 0
      and canonical_source_url is not null
      and length(trim(canonical_source_url)) > 0
      and published_at is not null
    )
  );
