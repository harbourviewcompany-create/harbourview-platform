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
-- version 20260714224152.
--
-- Rewriting this file cannot affect production: 20260714224152 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- Stage 0 of docs/INTELLIGENCE_ARCHITECTURE_SPEC.md: the labeled evaluation set.
-- Reason: the live scorer (score_signal_from_snapshot) is inverted and cannot be trusted
-- as a quality proxy. Every later stage (classifier, promotion) must be validated against
-- human labels BEFORE being wired to anything (spec Section 6.2, guardrail #2).
-- Additive, isolated, reversible. Rollback: DROP TABLE public.intel_eval_set;
-- RLS enabled with NO policies => service_role/admin only (deny-by-default per DATABASE_CONTROL.md).

create table public.intel_eval_set (
  id                 uuid primary key default gen_random_uuid(),
  signal_id          text not null unique
                       references public.signals(id) on delete cascade,

  -- ── Human ground-truth labels (spec Section 6.1 contract) ──
  quality_label      text check (quality_label in
                       ('signal','boilerplate','spam','nav','duplicate')),
  content_type       text check (content_type in
                       ('regulatory','market','story','research','noise')),
  impact             text check (impact in ('high','medium','low')),
  label_notes        text,
  labeled_by         text,           -- 'human:<id>', mirrors spec 4.2 reviewed_by convention
  labeled_at         timestamptz,

  -- ── First-pass draft labels (assistant-suggested, kept SEPARATE from human truth) ──
  -- so precision/recall at Stage 2 can be computed on human-confirmed rows only, and so
  -- draft-vs-human agreement is measurable. Drafts NEVER count as ground truth.
  draft_quality_label text check (draft_quality_label in
                       ('signal','boilerplate','spam','nav','duplicate')),
  draft_content_type  text check (draft_content_type in
                       ('regulatory','market','story','research','noise')),
  draft_impact        text check (draft_impact in ('high','medium','low')),
  draft_reason        text,

  -- ── Workflow state ──
  label_status       text not null default 'unlabeled'
                       check (label_status in
                       ('unlabeled','drafted','confirmed','corrected','unlabelable')),

  -- ── Sample snapshot (self-contained: signals.score/lang/etc. will change under Stage 2+) ──
  sample_stratum     text not null,
  sample_batch       text not null default 'stage0-v1-20260714',
  score_at_sample    int4,
  lang_at_sample     text,
  country_at_sample  text,
  top_lane_at_sample text,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.intel_eval_set enable row level security;

comment on table  public.intel_eval_set is
  'Stage 0 labeled evaluation set for the intelligence classifier. Human labels are ground truth; draft_* columns are assistant first-pass suggestions and are NOT ground truth. See docs/INTELLIGENCE_ARCHITECTURE_SPEC.md Section 6.2.';
comment on column public.intel_eval_set.quality_label is 'Human ground-truth: signal|boilerplate|spam|nav|duplicate';
comment on column public.intel_eval_set.content_type  is 'Human ground-truth: regulatory|market|story|research|noise';
comment on column public.intel_eval_set.draft_quality_label is 'Assistant first-pass suggestion — never counts as ground truth';
comment on column public.intel_eval_set.label_status is 'unlabeled -> drafted -> confirmed|corrected; unlabelable = dead/empty source';

create index intel_eval_set_status_idx  on public.intel_eval_set (label_status);
create index intel_eval_set_stratum_idx on public.intel_eval_set (sample_stratum);
