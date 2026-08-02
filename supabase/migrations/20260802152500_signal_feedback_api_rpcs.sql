-- Controlled PostgREST boundary for Elite Digest operator feedback.
--
-- The project exposes only the `api` schema. The source table remains in
-- `public` and is deliberately not projected as a writable view.

create schema if not exists api;

grant usage on schema api to authenticated, service_role;

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
  returning id into v_feedback_id;

  return v_feedback_id;
end
$function$;

comment on function api.submit_signal_relevance_feedback(text, text, text, text) is
  'Authenticated operator feedback writer. Forces user_id from auth.uid(), validates the persisted verdict contract, and does not expose the public table.';

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
  select f.signal_id, f.verdict
  from public.signal_relevance_feedback f
  where f.signal_id = any(coalesce(p_signal_ids, array[]::text[]))
    and f.created_at >= coalesce(p_since, now() - interval '90 days')
    and f.verdict in ('helpful', 'not_helpful', 'stale', 'wrong_country');
$function$;

comment on function api.signal_relevance_feedback_for_ranking(text[], timestamptz) is
  'Service-role-only verdict projection for signed Digest ranking. Returns no notes, user IDs, or other operator data.';

revoke all on function api.signal_relevance_feedback_for_ranking(text[], timestamptz) from public, anon, authenticated;
grant execute on function api.signal_relevance_feedback_for_ranking(text[], timestamptz) to service_role;
