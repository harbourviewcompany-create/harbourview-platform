-- Stage 3 (INTELLIGENCE_ARCHITECTURE_SPEC.md): the CORRECT promotion path.
-- Replaces score-driven publishing (the inverted score_signal_from_snapshot) with
-- promotion driven by the validated Stage 2 classifier. Two invariants, enforced
-- structurally:
--   (1) PROMOTION ONLY EVER PROMOTES. The only write is reviewed false->true. No code
--       path here sets reviewed=false or deletes. (guardrail: promotion only promotes)
--   (2) VALIDATION-GATED. Publishing is DRY-RUN by default; a real publish requires an
--       explicit p_dry_run=false AND is meant to run only after the classifier clears the
--       eval-set bar (spec 6.2). Not wired to any cron. (guardrail: validate before wiring)
-- Additive + reversible. Rollback:
--   drop function if exists api.promote_classified_signals(numeric,boolean,int);
--   drop table if exists public.signal_classifications;

-- Production classifier output for the live signal pool (distinct from the 202-row
-- intel_eval_predictions, which is validation-only). Populated by hv-classify's pool run.
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

-- The correct promotion: publish (reviewed=true) the signals the classifier calls a
-- real 'signal' above a confidence threshold, and refresh routing (top_lane) from
-- content_type. DRY-RUN by default: returns what it WOULD publish and changes nothing.
-- content_type -> top_lane map: regulatory->Regulatory, market->Economic, else Trade.
create function api.promote_classified_signals(
  p_min_confidence numeric default 0.70,
  p_dry_run        boolean default true,
  p_limit          int     default 500
)
returns table (candidate_count bigint, promoted bigint, dry_run boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_candidates bigint;
  v_promoted   bigint := 0;
begin
  -- latest classification per signal that is a publishable 'signal'
  create temporary table _promote_batch on commit drop as
  select distinct on (c.signal_id)
         c.signal_id, c.content_type, c.confidence
  from public.signal_classifications c
  join public.signals s on s.id = c.signal_id
  where s.reviewed = false                       -- never re-touch already-live rows
    and c.quality_label = 'signal'
    and coalesce(c.confidence, 0) >= p_min_confidence
  order by c.signal_id, c.created_at desc
  limit p_limit;

  select count(*) into v_candidates from _promote_batch;

  if p_dry_run then
    return query select v_candidates, 0::bigint, true;
    return;
  end if;

  -- ONLY promotion: reviewed false -> true. Refresh routing lane from content_type.
  update public.signals s set
    reviewed = true,
    top_lane = case b.content_type
                 when 'regulatory' then 'Regulatory'
                 when 'market'     then 'Economic'
                 else 'Trade' end,
    action = 'Promoted by classifier (Stage 3)'
  from _promote_batch b
  where s.id = b.signal_id
    and s.reviewed = false;          -- guard: idempotent, promote-only
  get diagnostics v_promoted = row_count;

  return query select v_candidates, v_promoted, false;
end;
$$;

comment on function api.promote_classified_signals is
  'Stage 3 promotion. Publishes (reviewed=true) classifier-confirmed signals above p_min_confidence. DRY-RUN by default; only ever promotes; not wired to cron. Run for real only after the classifier clears the eval-set bar (spec 6.2). p_min_confidence is an owner decision (spec 10).';

revoke all on function api.promote_classified_signals(numeric,boolean,int) from public;
grant execute on function api.promote_classified_signals(numeric,boolean,int) to service_role;
