create table if not exists public.signal_digest_canonical_links (
  duplicate_signal_id text primary key references public.signals(id) on delete cascade,
  canonical_signal_id text not null references public.signals(id) on delete cascade,
  reason text not null default 'same_event',
  created_at timestamptz not null default now(),
  constraint signal_digest_canonical_links_not_self check (duplicate_signal_id <> canonical_signal_id)
);

comment on table public.signal_digest_canonical_links is
  'Private presentation-layer canonical mapping. Preserves all source signals while suppressing same-event duplicates from digest presentation.';

alter table public.signal_digest_canonical_links enable row level security;
revoke all on table public.signal_digest_canonical_links from anon, authenticated;
grant all on table public.signal_digest_canonical_links to service_role;

create index if not exists idx_signal_digest_canonical_links_canonical
  on public.signal_digest_canonical_links(canonical_signal_id);

-- Cross-cluster same-event links for the five audited Daily Brief events.
-- These inserts do not modify public.signals; they preserve the source rows as corroboration.
insert into public.signal_digest_canonical_links (duplicate_signal_id, canonical_signal_id, reason)
select s.id, 'daily-2026-08-15-libby-phase2', 'same_event_cross_cluster'
from public.signals s
where s.id <> 'daily-2026-08-15-libby-phase2'
  and coalesce(s.date, s.created_at) >= timestamptz '2026-07-14 00:00:00+00'
  and coalesce(s.date, s.created_at) <  timestamptz '2026-07-27 23:59:59+00'
  and (
    s.headline ilike '%LiBBY%'
    or s.headline ilike '%THC%CBD%agitation%late-stage dementia%'
    or s.headline ilike '%THC and CBD Reduce Agitation in Late-Stage Dementia%'
    or (s.source = 'Cannabis Health UK' and s.headline ilike '%agitation%dementia%')
  )
on conflict (duplicate_signal_id) do update
set canonical_signal_id = excluded.canonical_signal_id,
    reason = excluded.reason;

insert into public.signal_digest_canonical_links (duplicate_signal_id, canonical_signal_id, reason)
select s.id, 'daily-2026-08-15-curaleaf-spain', 'same_event_cross_cluster'
from public.signals s
where s.id <> 'daily-2026-08-15-curaleaf-spain'
  and coalesce(s.date, s.created_at) >= timestamptz '2026-07-13 00:00:00+00'
  and coalesce(s.date, s.created_at) <  timestamptz '2026-07-24 00:00:00+00'
  and s.headline ilike '%Curaleaf%Spain%'
on conflict (duplicate_signal_id) do update
set canonical_signal_id = excluded.canonical_signal_id,
    reason = excluded.reason;

insert into public.signal_digest_canonical_links (duplicate_signal_id, canonical_signal_id, reason)
select s.id, 'daily-2026-08-15-sndl-parallel', 'same_event_cross_cluster'
from public.signals s
where s.id <> 'daily-2026-08-15-sndl-parallel'
  and coalesce(s.date, s.created_at) >= timestamptz '2026-07-27 00:00:00+00'
  and coalesce(s.date, s.created_at) <  timestamptz '2026-08-04 00:00:00+00'
  and (s.headline ilike '%SNDL%Parallel%' or s.headline ilike '%Parallel takeover%')
on conflict (duplicate_signal_id) do update
set canonical_signal_id = excluded.canonical_signal_id,
    reason = excluded.reason;

create or replace view public.signals_for_digest
with (security_invoker = true)
as
select
  sq.id,
  sq.headline as title,
  sq.cat as type,
  sq.country as market,
  sq.cat as category,
  sq.score as confidence,
  coalesce(sq.commercial_impact, '') as commercial_impact,
  sq.summary,
  coalesce(sq.date, sq.created_at) as detected_at,
  'signals'::text as source_table
from public.signals_quality sq
join public.signals s on s.id = sq.id
where sq.headline is not null
  and sq.summary is not null
  and coalesce(s.is_representative, true) is true
  and not exists (
    select 1
    from public.signal_digest_canonical_links l
    where l.duplicate_signal_id = sq.id
  )
union all
select
  ia.id,
  ia.title,
  ia.type,
  ia.market,
  ia.category,
  ia.confidence,
  coalesce(ia.commercial_impact, '') as commercial_impact,
  ia.summary,
  ia.detected_at,
  'ia_signals'::text as source_table
from public.ia_signals ia
where ia.stage = 'qualified'
  and ia.title is not null
  and ia.summary is not null
  and ia.id not like 's-%';

comment on view public.signals_for_digest is
  'Digest presentation candidates: quality-gated representative signals only, explicit same-event canonical suppression, and no mirrored s-* ia_signals.';
