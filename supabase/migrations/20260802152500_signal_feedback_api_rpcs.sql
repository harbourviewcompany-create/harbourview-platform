-- Controlled PostgREST boundary for Elite Digest operator feedback.
--
-- The project exposes only the `api` schema. The source table remains in
-- `public` and is deliberately not projected as a writable view.

create schema if not exists api;

grant usage on schema api to authenticated, service_role;

-- One operator has one current verdict per signal. Fail closed if an environment
-- contains legacy duplicates rather than deleting or silently choosing data.
do $duplicate_guard$
begin
  if exists (
    select 1
    from public.signal_relevance_feedback
    group by signal_id, user_id
    having count(*) > 1
  ) then
    raise exception 'signal_relevance_feedback contains duplicate user/signal rows; reconcile before applying the unique current-verdict constraint';
  end if;
end
$duplicate_guard$;

create unique index if not exists idx_signal_relevance_feedback_one_per_user_signal
  on public.signal_relevance_feedback (signal_id, user_id);

create or replace function api.submit_signal_relevance_feedback(
  p_signal_id text,
  p_verdict text,
  p_note text default null,
  p_surface text default 'digest'
)
returns uuid
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_signal_id text := btrim(coalesce(p_signal_id, ''));
  v_verdict text := btrim(coalesce(p_verdict, ''));
  v_surface text := btrim(coalesce(p_surface, 'digest'));
  v_note text := nullif(left(btrim(coalesce(p_note, '')), 500), '');
  v_feedback_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if v_signal_id = '' or length(v_signal_id) > 120 then
    raise exception 'invalid signal id' using errcode = '22023';
  end if;
  if not exists (select 1 from public.signals s where s.id = v_signal_id) then
    raise exception 'unknown signal id' using errcode = '22023';
  end if;
  if v_verdict not in ('helpful', 'not_helpful', 'stale', 'wrong_country') then
    raise exception 'invalid feedback verdict' using errcode = '22023';
  end if;
  if v_surface not in ('digest', 'signals', 'search', 'email') then
    raise exception 'invalid feedback surface' using errcode = '22023';
  end if;

  insert into public.signal_relevance_feedback (
    signal_id,
    user_id,
    verdict,
    note,
    surface
  ) values (
    v_signal_id,
    v_user_id,
    v_verdict,
    v_note,
    v_surface
  )
  on conflict (signal_id, user_id) do update
    set verdict = excluded.verdict,
        note = excluded.note,
        surface = excluded.surface,
        created_at = now()
  returning id into v_feedback_id;

  return v_feedback_id;
end
$function$;

comment on function api.submit_signal_relevance_feedback(text, text, text, text) is
  'Authenticated current-verdict writer. Forces user_id from auth.uid(), rejects unknown signals, validates the persisted verdict contract, and prevents repeated-vote amplification.';

revoke all on function api.submit_signal_relevance_feedback(text, text, text, text) from public, anon;
grant execute on function api.submit_signal_relevance_feedback(text, text, text, text) to authenticated;

create or replace function api.signal_relevance_feedback_for_ranking(
  p_signal_ids text[],
  p_since timestamptz
)
returns table(signal_id text, verdict text)
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select latest.signal_id, latest.verdict
  from (
    select distinct on (f.signal_id, f.user_id)
      f.signal_id,
      f.user_id,
      f.verdict
    from public.signal_relevance_feedback f
    where f.signal_id = any(coalesce(p_signal_ids, array[]::text[]))
      and f.created_at >= coalesce(p_since, now() - interval '90 days')
      and f.verdict in ('helpful', 'not_helpful', 'stale', 'wrong_country')
    order by f.signal_id, f.user_id, f.created_at desc, f.id desc
  ) latest;
$function$;

comment on function api.signal_relevance_feedback_for_ranking(text[], timestamptz) is
  'Service-role-only latest-verdict projection for signed Digest ranking. Returns no notes, user IDs, or other operator data and defensively deduplicates legacy rows.';

revoke all on function api.signal_relevance_feedback_for_ranking(text[], timestamptz) from public, anon, authenticated;
grant execute on function api.signal_relevance_feedback_for_ranking(text[], timestamptz) to service_role;
