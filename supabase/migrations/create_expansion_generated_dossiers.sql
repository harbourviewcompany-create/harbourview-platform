-- Expansion Generated Dossiers — data model
-- NOT YET APPLIED — review and apply via the normal migration protocol.
--
-- See HANDOFF.md ADR #13 for the full decision. Summary: this is a
-- deliberately SEPARATE table from `dossiers` (PR #962's confidential,
-- manually-curated, Drive/Storage-backed files). This table holds
-- dynamically generated, on-demand exportable summaries built from the
-- Expansion Readiness Index (`expansion_readiness_scores` etc., PR #970).
-- It links to `dossiers` optionally, when a real curated deep dossier
-- exists for the country, rather than merging the two concepts.

create type public.expansion_dossier_export_format as enum ('pdf', 'html', 'json');
create type public.expansion_dossier_status as enum ('draft', 'final');

create table public.expansion_generated_dossiers (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id),

  -- Optional link to a real curated deep dossier (dossiers.id) when one
  -- exists for this country. Nullable — most countries won't have one.
  -- When present, the UI should surface a "Full Market Dossier Available"
  -- upsell pointing at it (same CTA pattern as PR #962's country page),
  -- rather than this generated summary trying to replace it.
  curated_dossier_id uuid references public.dossiers(id),

  -- Who generated/requested this, and for what workspace (client account)
  requested_by_workspace_id uuid references public.workspaces(id),
  generated_by text not null default 'manual', -- 'manual' | 'scoring_engine_v1' | etc.

  status public.expansion_dossier_status not null default 'draft',
  export_format public.expansion_dossier_export_format,
  exported_at timestamptz,
  exported_file_path text, -- Supabase Storage path once exported, nullable until then

  -- Snapshot of the composite score + pillar breakdown at generation time
  -- (not a live join — a dossier should reflect the data as of when it was
  -- generated, not silently change if scores update later. Re-generate to refresh.)
  composite_score numeric,
  pillar_scores jsonb not null default '{}'::jsonb, -- { pillar_id: { score, data_completeness } }
  hard_blockers_snapshot jsonb not null default '[]'::jsonb,

  -- Freeform generated sections (executive summary, entry mode suggestion,
  -- etc.) — content, not structure; keeps this table from needing a schema
  -- change every time the dossier's narrative sections evolve.
  sections jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_expansion_generated_dossiers_country
  on public.expansion_generated_dossiers (country_id, created_at desc);

create index idx_expansion_generated_dossiers_workspace
  on public.expansion_generated_dossiers (requested_by_workspace_id);

-- Evidence trail — same pattern as expansion_readiness_score_evidence,
-- links the dossier to the real rows it was built from.
-- Same disambiguation as expansion_readiness_score_evidence: `signals`
-- exists in both `public` and `regulatory_signals` schemas as of this
-- migration. Always record 'public.signals' explicitly, never bare 'signals'.
create table public.expansion_generated_dossier_evidence (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.expansion_generated_dossiers(id) on delete cascade,
  evidence_table text not null check (evidence_table in
    ('public.signals', 'jurisdiction_briefings', 'jurisdiction_playbooks',
     'expansion_readiness_scores', 'expansion_hard_blockers')),
  evidence_id uuid not null,
  note text,
  created_at timestamptz not null default now()
);

-- RLS — same pattern as expansion_readiness_*: public read, writes via
-- service_role only. NOTE: this table will hold client-specific generated
-- content once workspace-scoping is real (workspaces has only 2 rows today
-- per the earlier feasibility check) — revisit this policy to scope reads
-- to the requesting workspace once multi-tenancy is actually populated.
-- Public-read is deliberately permissive for now to match the pattern of
-- every other table in this migration set; tighten before this handles
-- real client-confidential exported content.
alter table public.expansion_generated_dossiers enable row level security;
alter table public.expansion_generated_dossier_evidence enable row level security;

create policy expansion_generated_dossiers_public_read
  on public.expansion_generated_dossiers for select using (true);
create policy expansion_generated_dossier_evidence_public_read
  on public.expansion_generated_dossier_evidence for select using (true);
