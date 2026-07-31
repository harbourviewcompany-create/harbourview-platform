-- hv_entities_dispatch: ungated, once-per-signal, self-reaping.
--
-- Pairs with 20260730221500. Split into its own file because the first applied
-- version of this function shipped a real bug, caught by running it live rather
-- than trusting that a clean DDL apply meant correct behaviour:
--
--   ERROR 55000: record "r" is not assigned yet
--
-- The reap statement aliased net._http_response as `r`, colliding with the plpgsql
-- record variable `r` declared for the dispatch loop; plpgsql resolved `r.id` to the
-- not-yet-assigned record and raised on every call. That would have broken the
-- entities cron outright. Alias renamed to `resp`. This file is the corrected,
-- authoritative definition.
--
-- Behaviour:
--   * eligibility is quality_label = 'signal' -- NOT reviewed_by/promotion. Entity
--     extraction is read-only enrichment; making it wait on the feed gated 75% of the
--     corpus out of the graph for no benefit.
--   * each signal is attempted exactly once, tracked by signals.entities_extracted_at.
--   * jobs with no HTTP response are reaped each run so they cannot hold a signal
--     hostage via the unharvested-job guard.
--   * the Stage F daily ceiling (hv_consume_dispatch_budget) still applies unchanged.

create or replace function public.hv_entities_dispatch(p_limit integer default 60)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare r record; v_rid bigint; v_key text; n int:=0;
begin
  p_limit := least(greatest(coalesce(p_limit, 60), 1), 75);
  p_limit := public.hv_consume_dispatch_budget('entities', p_limit);
  if p_limit <= 0 then return 0; end if;

  update public.hv_entity_jobs j set harvested = true
   where not j.harvested
     and not exists (select 1 from net._http_response resp where resp.id = j.request_id);

  select decrypted_secret into v_key from vault.decrypted_secrets where name='openai_api_key';

  for r in
    select s.id,
           coalesce(s.title_en, s.headline) as h,
           coalesce(s.summary_en, left(s.summary,900), '') as sm
    from public.signals s
    where s.quality_label = 'signal'
      and s.entities_extracted_at is null
      and s.headline is not null
      and not exists (select 1 from public.hv_entity_jobs j where j.signal_id=s.id and not j.harvested)
    order by s.created_at desc
    limit p_limit
  loop
    select net.http_post(
      url:='https://api.openai.com/v1/chat/completions',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key),
      body:=jsonb_build_object('model','gpt-4o-mini','temperature',0,'response_format',jsonb_build_object('type','json_object'),
        'messages',jsonb_build_array(
          jsonb_build_object('role','system','content','Extract NAMED organizations from this cannabis-industry news item. Include licensed operators/companies, regulators/government bodies, and investors/financial firms. Return ONLY JSON {"entities":[{"name":"...","type":"operator|regulator|investor|other"}]}. Named entities only — no generic terms, no country names alone. Empty array if none.'),
          jsonb_build_object('role','user','content','HEADLINE: '||r.h||E'\nSUMMARY: '||r.sm)
        )),
      timeout_milliseconds:=30000
    ) into v_rid;
    insert into public.hv_entity_jobs(request_id, signal_id) values (v_rid, r.id) on conflict do nothing;
    n:=n+1;
  end loop;
  return n;
end$function$;

comment on function public.hv_entities_dispatch(integer) is
  'Dispatches entity extraction for classifier-confirmed signals (quality_label = signal). '
  'Not gated on promotion — enrichment does not wait for the feed. Each signal is attempted '
  'exactly once (signals.entities_extracted_at), and jobs with no HTTP response are reaped '
  'so they cannot block their signal indefinitely.';
