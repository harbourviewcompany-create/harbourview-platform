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
-- version 20260713223137.
--
-- Rewriting this file cannot affect production: 20260713223137 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Root-caused the empty regulatory_signals.signals table (distinct from, and
-- unrelated to, the Anthropic billing outage fixed earlier this session --
-- this pipeline has no LLM call at all).
--
-- api."regulatory_signals.signals" is a security_invoker passthrough view
-- over regulatory_signals.signals, used by both the admin review UI
-- (lib/regulatory-signals/admin.ts) and the Fresh Regulatory Sources watcher's
-- write path (lib/regulatory-sources/runWatch.ts -> createDraftSignal). The
-- view was created before four columns were added to the base table
-- (source_url, source_published_at, private_summary, private_notes) and was
-- never refreshed. Every createDraftSignal() insert -- which always sets all
-- four -- has been failing with PostgREST's "column does not exist" error on
-- every single invocation since those columns were added. runRegulatoryWatch's
-- for-loop has no per-source try/catch, so this uncaught failure aborted the
-- entire daily cron run at the first source with a relevant item every time,
-- which is also why source_check_runs stayed empty and the same source
-- (Peru DIGEMID) kept getting re-checked instead of the registry rotating.
--
-- Safe to add these columns to this specific view: regulatory_signals.signals
-- has RLS enabled with exactly one policy (admin_all, gated on
-- user_roles.role = 'admin'), so a non-admin authenticated caller gets zero
-- rows regardless of which columns the view exposes -- this is an
-- admin/service-role-only draft-review surface, not a public one. Distinct
-- from regulatory_signals.public_signals, the actual curated public surface,
-- which is untouched here.
create or replace view api."regulatory_signals.signals"
  with (security_invoker = on)
  as select
    id,
    slug,
    source_id,
    headline,
    signal_type,
    confidence,
    impact_level,
    country_code,
    country_name,
    region,
    jurisdiction,
    regulator_name,
    signal_date,
    source_tier,
    source_type,
    canonical_source_url,
    raw_excerpt,
    analyst_notes,
    public_summary,
    public_implication,
    review_status,
    public_safe,
    publish_to_public,
    internal_only,
    requires_diligence,
    commercial_relevance,
    linked_country_slug,
    linked_product_category,
    reviewer_id,
    reviewed_at,
    published_at,
    last_reviewed_at,
    created_by,
    updated_by,
    created_at,
    updated_at,
    source_url,
    source_published_at,
    private_summary,
    private_notes,
    reviewed_by,
    approved_by,
    published_by
  from regulatory_signals.signals;

-- No GRANT statements needed: CREATE OR REPLACE VIEW preserves existing
-- privileges (postgres/service_role: full CRUD; authenticated: SELECT only)
-- since the OID and existing column set are unchanged, only extended.;
