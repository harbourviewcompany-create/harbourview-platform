-- Reverts undocumented, out-of-band drift on regulatory_signals.signals
-- back to the original, git-tracked design in
-- 20260312000000_regulatory_signals_v1.sql.
--
-- Investigation (same session as the api view fix in
-- 20260713223057_fix_stale_regulatory_signals_signals_api_view.sql): the
-- live schema had silently diverged from the original migration -- and from
-- every current application file that targets this table
-- (lib/regulatory-signals/types.ts, admin.ts, the Fresh Regulatory Sources
-- watcher) -- across a much wider surface than a single stale view:
--
--   - review_status CHECK: original 10-value set (captured/triaged/
--     needs_source_validation/in_review/approved_private/approved_public/
--     published/rejected/archived/expired) had narrowed to 5 values (draft/
--     in_review/published/archived/rejected), and the column default had
--     changed from 'captured' to 'draft'.
--   - signal_type CHECK: original 12-value set had been replaced with an
--     entirely different 18-value set (enforcement_action, policy_consultation,
--     legislation_change, quota_allocation, pharmaceutical_reclassification,
--     hemp_cbd_boundary, etc.) that appears nowhere else in this repository --
--     no migration, no TypeScript file, no doc -- so there is no basis to
--     treat it as an intentional redesign rather than orphaned drift.
--   - confidence CHECK: original allowed 'official_confirmed' (matching
--     types.ts); live allowed 'verified' instead.
--   - regulatory_signals_publication_gate was missing entirely -- this is the
--     constraint that prevents a row from being marked review_status=
--     'published' unless public_safe, publish_to_public, public_summary,
--     public_implication, canonical_source_url, and published_at are all
--     actually populated. Its absence is a real compliance safety-net gap on
--     a regulated-industry intelligence table, not just a cosmetic issue.
--   - regulatory_signals_slug_not_empty / _private_summary_not_empty /
--     _source_url_not_empty were also missing, and six columns (slug,
--     signal_date, source_tier, source_type, source_url, private_summary)
--     had lost their NOT NULL constraint (only headline retained it).
--
-- supabase_migrations.schema_migrations records a
-- "20260628230550_regulatory_signals_pipeline_missing_columns" migration as
-- applied on 2026-06-28, but there is no corresponding file for it anywhere
-- in the repo (not even the "applied directly to remote" stub pattern used
-- elsewhere for other remote-only migrations) -- the likely, though not
-- provable beyond this, source of the drift.
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
