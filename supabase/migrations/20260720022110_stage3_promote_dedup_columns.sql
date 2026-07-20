-- Stage 3: classifier verdicts + dedup on signals, and the promote path (§6.3).
alter table public.signals
  add column if not exists quality_label text,
  add column if not exists content_type text,
  add column if not exists impact text,
  add column if not exists quality_confidence numeric,
  add column if not exists classifier_version text,
  add column if not exists cluster_rep_id text,
  add column if not exists is_representative boolean,
  add column if not exists corroborating_count int;

-- Dedup: within a recent scope, mark each signal representative unless a higher-priority
-- near-twin (cosine >= tau) exists. Priority: higher score, then earlier, then id.
create or replace function public.hv_dedup_assign(p_tau float default 0.90, p_scope_days int default 120)
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare n int;
begin
  update public.signals a
  set is_representative = not exists (
        select 1 from public.signals b
        where b.id <> a.id and b.embedding_1024 is not null
          and b.created_at > now() - (p_scope_days||' days')::interval
          and ( coalesce(b.score,0) > coalesce(a.score,0)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at < a.created_at)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at = a.created_at and b.id < a.id) )
          and (1 - (a.embedding_1024 <=> b.embedding_1024)) >= p_tau
      ),
      cluster_rep_id = coalesce((
        select b.id from public.signals b
        where b.id <> a.id and b.embedding_1024 is not null
          and b.created_at > now() - (p_scope_days||' days')::interval
          and (1 - (a.embedding_1024 <=> b.embedding_1024)) >= p_tau
          and ( coalesce(b.score,0) > coalesce(a.score,0)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at < a.created_at)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at = a.created_at and b.id < a.id) )
        order by (1 - (a.embedding_1024 <=> b.embedding_1024)) desc
        limit 1
      ), a.id)
  where a.embedding_1024 is not null
    and a.created_at > now() - (p_scope_days||' days')::interval;
  get diagnostics n = row_count;
  return n;
end$fn$;

-- Promote (§6.3): only ever promotes; never demotes, never touches human rows; idempotent.
create or replace function public.hv_promote_signals(p_min_conf numeric default 0.0)
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare n int;
begin
  update public.signals s set
    reviewed = true,
    reviewed_by = 'auto:v1',
    reviewed_at = now()
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and coalesce(s.quality_confidence, 1) >= p_min_conf
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%');
  get diagnostics n = row_count;
  return n;
end$fn$;