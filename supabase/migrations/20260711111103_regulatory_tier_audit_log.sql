-- Append-only audit trail. Every tier change (auto or manual) lands here, so
-- "what changed, when, why, from what source text" is always answerable — this
-- is the "wired into the active database, knows when something changes" part.

create table if not exists public.regulatory_tier_audit (
  id             bigint generated always as identity primary key,
  country_iso2   text not null,
  changed_at     timestamptz not null default now(),
  old_tier       text,
  new_tier       text,
  origin         text not null,          -- 'auto' | 'override'
  trigger_source text not null,          -- 'briefing_change' | 'manual' | 'backfill' | 'reclassify_all'
  program_status text,                   -- the source text at time of change
  actor          text,                   -- who/what made the change (agent id, 'system', etc.)
  note           text
);

create index if not exists idx_reg_tier_audit_iso   on public.regulatory_tier_audit(country_iso2, changed_at desc);
create index if not exists idx_reg_tier_audit_recent on public.regulatory_tier_audit(changed_at desc);

comment on table public.regulatory_tier_audit is
  'Append-only history of every regulatory_tier change. Never updated/deleted in normal operation.';

alter table public.regulatory_tier_audit enable row level security;
-- Read for authenticated app users + service role; writes only via the trigger
-- and service role (SECURITY DEFINER functions run as owner regardless).
revoke all on public.regulatory_tier_audit from anon, authenticated;
grant select on public.regulatory_tier_audit to authenticated, service_role;
grant insert on public.regulatory_tier_audit to service_role;
