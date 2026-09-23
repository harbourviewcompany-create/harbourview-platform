-- Signal Engine V1 foundations (additive, fail-closed).
-- Spec: docs/SIGNALS_MAX_AUTOMATION_DESIGN.md §9
--
-- Does NOT widen promotion autonomy. Seed policy requires human.
-- classifier_validation already exists; this migration does not touch it.
-- RLS: deny anon/authenticated/public; service_role retains access via bypass.

-- ---------------------------------------------------------------------------
-- autonomy_policies — versioned thresholds per signal class
-- ---------------------------------------------------------------------------
create table if not exists public.autonomy_policies (
  id uuid primary key default gen_random_uuid(),
  policy_version text not null,
  signal_class text not null,
  full_auto_min_confidence numeric not null default 0.95
    check (full_auto_min_confidence >= 0 and full_auto_min_confidence <= 1),
  min_corroboration integer not null default 1 check (min_corroboration >= 0),
  allowed_source_tiers integer[] not null default '{1}',
  requires_human boolean not null default true,
  gate_passed boolean not null default false,
  metrics jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  unique (policy_version, signal_class)
);

create index if not exists autonomy_policies_class_idx
  on public.autonomy_policies (signal_class, created_at desc);

alter table public.autonomy_policies enable row level security;
alter table public.autonomy_policies force row level security;
revoke all on table public.autonomy_policies from anon, authenticated, public;

insert into public.autonomy_policies (
  policy_version,
  signal_class,
  full_auto_min_confidence,
  min_corroboration,
  allowed_source_tiers,
  requires_human,
  gate_passed,
  notes
) values (
  'v1-seed',
  'tier1_regulatory',
  0.90,
  1,
  '{1}',
  true,
  false,
  'Seed policy only. Full Auto remains off until eval evidence + owner sign-off.'
)
on conflict (policy_version, signal_class) do nothing;

-- ---------------------------------------------------------------------------
-- signal_decision_events — audit trail for auto + human decisions
-- ---------------------------------------------------------------------------
create table if not exists public.signal_decision_events (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null,
  decision text not null
    check (decision in ('promote', 'reject', 'edit', 'escalate', 'defer')),
  autonomy_level_at_decision smallint not null
    check (autonomy_level_at_decision between 0 and 4),
  promotion_path text
    check (promotion_path is null or promotion_path in ('full_auto', 'shadow', 'human', 'rejected')),
  human_id uuid,
  gate_scores jsonb not null default '{}'::jsonb,
  acquisition_scores jsonb,
  model_versions jsonb not null default '{}'::jsonb,
  classifier_version text,
  edits jsonb,
  reason_codes text[],
  free_text_notes text,
  created_at timestamptz not null default now()
);

-- Soft FK: signals table exists in production; avoid hard FK if replay order varies.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'signals'
  ) and not exists (
    select 1 from pg_constraint where conname = 'signal_decision_events_signal_id_fkey'
  ) then
    alter table public.signal_decision_events
      add constraint signal_decision_events_signal_id_fkey
      foreign key (signal_id) references public.signals (id) on delete cascade;
  end if;
exception
  when others then
    raise notice 'signal_decision_events FK skipped: %', sqlerrm;
end $$;

create index if not exists signal_decision_events_signal_created_idx
  on public.signal_decision_events (signal_id, created_at desc);
create index if not exists signal_decision_events_created_idx
  on public.signal_decision_events (created_at desc);
create index if not exists signal_decision_events_decision_idx
  on public.signal_decision_events (decision, created_at desc);

alter table public.signal_decision_events enable row level security;
alter table public.signal_decision_events force row level security;
revoke all on table public.signal_decision_events from anon, authenticated, public;

comment on table public.autonomy_policies is
  'Versioned Signal Engine autonomy thresholds. gate_passed must be true before any Full Auto widening.';
comment on table public.signal_decision_events is
  'Audit log of promote/reject/edit decisions (auto and human). Training signal for learning loop.';
