-- Restore the exact production-owned body for migration 20260718135702.
-- The previous stub omitted public.signal_classifications, which later
-- migrations depend on.

create table public.signal_classifications (
  id            uuid primary key default gen_random_uuid(),
  signal_id     text not null references public.signals(id) on delete cascade,
  quality_label text not null check (quality_label in ('signal','boilerplate','spam','nav','duplicate')),
  content_type  text check (content_type in ('regulatory','market','story','research','noise')),
  impact        text check (impact in ('high','medium','low')),
  confidence    double precision,
  model         text,
  created_at    timestamptz not null default now()
);
alter table public.signal_classifications enable row level security;
comment on table public.signal_classifications is
  'Stage 3: hv-classify output for the live signal pool. Drives promotion via api.promote_classified_signals. Latest row per signal wins.';
create index signal_classifications_signal_idx on public.signal_classifications (signal_id, created_at desc);
grant select, insert on public.signal_classifications to service_role;

create function api.promote_classified_signals(
  p_min_confidence numeric default 0.70,
  p_dry_run        boolean default true,
  p_limit          int     default 500
)
returns table (candidate_count bigint, promoted bigint, dry_run boolean)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_candidates bigint; v_promoted bigint := 0;
begin
  create temporary table _promote_batch on commit drop as
  select distinct on (c.signal_id) c.signal_id, c.content_type, c.confidence
  from public.signal_classifications c
  join public.signals s on s.id = c.signal_id
  where s.reviewed = false and c.quality_label = 'signal'
    and coalesce(c.confidence, 0) >= p_min_confidence
  order by c.signal_id, c.created_at desc
  limit p_limit;

  select count(*) into v_candidates from _promote_batch;
  if p_dry_run then
    return query select v_candidates, 0::bigint, true; return;
  end if;

  update public.signals s set
    reviewed = true,
    top_lane = case b.content_type when 'regulatory' then 'Regulatory'
                 when 'market' then 'Economic' else 'Trade' end,
    action = 'Promoted by classifier (Stage 3)'
  from _promote_batch b
  where s.id = b.signal_id and s.reviewed = false;
  get diagnostics v_promoted = row_count;
  return query select v_candidates, v_promoted, false;
end;
$$;
comment on function api.promote_classified_signals is
  'Stage 3 promotion. Publishes classifier-confirmed signals above p_min_confidence. DRY-RUN default; only ever promotes; not wired to cron. spec §6.2/§10.';
revoke all on function api.promote_classified_signals(numeric,boolean,int) from public;
grant execute on function api.promote_classified_signals(numeric,boolean,int) to service_role;
