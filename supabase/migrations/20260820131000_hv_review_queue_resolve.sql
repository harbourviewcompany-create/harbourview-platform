-- Atomic, authoritative resolve helpers for hv_signal_review_queue.
-- Depends on 20260820130000_hv_pipeline_optimization.sql.
--
-- A queue decision and its signals row mutation occur in the same transaction.
-- The pending queue row is locked before either write. Approval/rejection of an
-- arbitrary signal ID is impossible, repeat decisions return false, and an
-- existing human disposition is never overwritten.

create or replace function public.hv_review_queue_approve(
  p_signal_id text,
  p_reviewer text default 'human:operator'
)
returns boolean
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_signal_id text;
  v_reviewer text := btrim(coalesce(p_reviewer, ''));
  v_now timestamptz := clock_timestamp();
  v_count integer;
begin
  if v_reviewer = '' then
    raise exception 'p_reviewer must be non-empty'
      using errcode = '22023';
  end if;
  if v_reviewer not like 'human:%' then
    v_reviewer := 'human:' || v_reviewer;
  end if;

  select q.signal_id
    into v_signal_id
  from public.hv_signal_review_queue q
  where q.signal_id = p_signal_id
    and q.status = 'pending'
  for update;

  if not found then
    return false;
  end if;

  update public.signals s
  set
    reviewed = true,
    reviewed_by = v_reviewer,
    reviewed_at = v_now
  where s.id = v_signal_id
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%');

  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception
      'signal % already has an authoritative human disposition',
      v_signal_id
      using errcode = '55000';
  end if;

  update public.hv_signal_review_queue q
  set
    status = 'approved',
    reviewed_at = v_now,
    reviewed_by = v_reviewer
  where q.signal_id = v_signal_id
    and q.status = 'pending';

  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception 'pending queue row disappeared for signal %', v_signal_id
      using errcode = '55000';
  end if;

  return true;
end
$function$;

create or replace function public.hv_review_queue_reject(
  p_signal_id text,
  p_reviewer text default 'human:operator',
  p_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_signal_id text;
  v_reviewer text := btrim(coalesce(p_reviewer, ''));
  v_now timestamptz := clock_timestamp();
  v_count integer;
begin
  if v_reviewer = '' then
    raise exception 'p_reviewer must be non-empty'
      using errcode = '22023';
  end if;
  if v_reviewer not like 'human:%' then
    v_reviewer := 'human:' || v_reviewer;
  end if;

  select q.signal_id
    into v_signal_id
  from public.hv_signal_review_queue q
  where q.signal_id = p_signal_id
    and q.status = 'pending'
  for update;

  if not found then
    return false;
  end if;

  -- A deliberate rejection may demote an automatic promotion that raced the
  -- queue decision, but never overwrites another human's decision.
  update public.signals s
  set
    reviewed = false,
    reviewed_by = v_reviewer || ':rejected',
    reviewed_at = v_now
  where s.id = v_signal_id
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%');

  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception
      'signal % already has an authoritative human disposition',
      v_signal_id
      using errcode = '55000';
  end if;

  update public.hv_signal_review_queue q
  set
    status = 'rejected',
    reason = coalesce(nullif(btrim(p_reason), ''), q.reason, 'operator_rejected'),
    reviewed_at = v_now,
    reviewed_by = v_reviewer
  where q.signal_id = v_signal_id
    and q.status = 'pending';

  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception 'pending queue row disappeared for signal %', v_signal_id
      using errcode = '55000';
  end if;

  return true;
end
$function$;

create or replace function public.hv_review_queue_list_pending(
  p_limit integer default 50
)
returns table (
  signal_id text,
  quality_label text,
  quality_confidence numeric,
  content_type text,
  impact text,
  reason text,
  headline text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select
    q.signal_id,
    q.quality_label,
    q.quality_confidence,
    q.content_type,
    q.impact,
    q.reason,
    coalesce(nullif(btrim(s.title_en), ''), s.headline) as headline,
    q.created_at
  from public.hv_signal_review_queue q
  join public.signals s
    on s.id = q.signal_id
  where q.status = 'pending'
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
  order by q.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
$function$;

revoke all on function public.hv_review_queue_approve(text, text)
  from public, anon, authenticated;
revoke all on function public.hv_review_queue_reject(text, text, text)
  from public, anon, authenticated;
revoke all on function public.hv_review_queue_list_pending(integer)
  from public, anon, authenticated;

grant execute on function public.hv_review_queue_approve(text, text)
  to service_role;
grant execute on function public.hv_review_queue_reject(text, text, text)
  to service_role;
grant execute on function public.hv_review_queue_list_pending(integer)
  to service_role;

comment on function public.hv_review_queue_approve(text, text) is
  'Locks and approves one pending queue row atomically; service_role only.';
comment on function public.hv_review_queue_reject(text, text, text) is
  'Locks and rejects one pending queue row atomically, writing a human rejection marker that blocks auto-promotion; service_role only.';
