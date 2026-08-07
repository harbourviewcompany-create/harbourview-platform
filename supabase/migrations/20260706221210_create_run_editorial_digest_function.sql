-- Restore the exact production-owned body for migration 20260706221210.
-- The previous stub omitted public._editorial_digest_jobs, which
-- 20260713213101 alters, and the run_editorial_digest function it backs.

-- Mirrors run_daily_digest()'s async fire/collect pattern, but sources
-- editorial_items (mainstream media) instead of ia_signals (trade signals),
-- and prompts Claude with genuine editorial framing rather than B2B intelligence framing.

CREATE TABLE IF NOT EXISTS _editorial_digest_jobs (
  request_id  bigint PRIMARY KEY,
  digest_date date NOT NULL,
  item_ids    text[] NOT NULL,
  collected   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.run_editorial_digest()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'net', 'vault', 'extensions'
AS $function$
declare
  v_key text;
  v_items jsonb;
  v_item_ids text[];
  v_req bigint;
  v_pre text := 'You are the editor of a global cannabis news digest for a general audience — not a trade or industry briefing. Below is a JSON array of candidate news items drawn from mainstream (non-cannabis-industry) news outlets worldwide. Select the ~8 most interesting or globally significant items (fewer if fewer are given), covering a healthy geographic spread where possible. For each, write a sharp original headline (max 110 chars, your own words) and keep the editorial why_it_matters sentence. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"headline": string, "why_it_matters": string, "market": string (country or "Global"), "item_id": string (the id field from the input item you used)}. Order by editorial importance, not commercial value.';
begin
  if exists (select 1 from daily_digest where digest_date = current_date and editorial_headlines is not null) then
    return jsonb_build_object('ok',true,'skipped','editorial digest exists for today');
  end if;

  perform 1 from _editorial_digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    update _editorial_digest_jobs j set collected = true
    where j.digest_date = current_date and not j.collected
      and j.created_at < now() - interval '1 hour'
      and not exists (select 1 from net._http_response r where r.id = j.request_id);

    with resp as (
      select j.request_id, j.item_ids,
             (safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text') as claude_text,
             r.status_code
      from _editorial_digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, item_ids, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, item_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    upsert as (
      insert into daily_digest (digest_date, headlines, markets, editorial_headlines, status, generated_at)
      select current_date, '[]'::jsonb, '{}', o.p, 'published', now()
      from ok o
      on conflict (digest_date) do update
        set editorial_headlines = excluded.editorial_headlines,
            updated_at = now()
      returning id
    ),
    mark_used as (
      update editorial_items e set used_in_digest_at = now()
      from ok o
      where e.id::text = any(o.item_ids) and exists (select 1 from upsert)
      returning e.id
    ),
    done as (
      update _editorial_digest_jobs j set collected = true
      from parsed p
      where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'published', exists(select 1 from upsert),
      'items_marked', (select count(*) from mark_used))
    into v_items;

    return coalesce(v_items, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  if v_key is null then return jsonb_build_object('ok',false,'reason','anthropic_api_key not in vault'); end if;

  select jsonb_agg(jsonb_build_object(
           'id', e.id, 'headline', e.headline, 'summary', e.summary,
           'why_it_matters', e.why_it_matters, 'country', e.country,
           'outlet_name', e.outlet_name, 'tone', e.tone, 'created_at', e.created_at)),
         array_agg(e.id::text)
  into v_items, v_item_ids
  from (
    select * from editorial_items
    where stage = 'qualified' and used_in_digest_at is null
      and created_at > now() - interval '3 days'
    order by created_at desc
    limit 40
  ) e;

  if v_items is null or jsonb_array_length(v_items) < 3 then
    return jsonb_build_object('ok',true,'skipped','fewer than 3 unused editorial items in last 3 days',
      'available', coalesce(jsonb_array_length(v_items),0));
  end if;

  v_req := net.http_post(
    url := 'https://api.anthropic.com/v1/messages',
    headers := jsonb_build_object('x-api-key', v_key, 'anthropic-version','2023-06-01','content-type','application/json'),
    body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',2500,
      'messages', jsonb_build_array(jsonb_build_object('role','user','content',
        v_pre || E'\n\nITEMS:\n' || v_items::text))),
    timeout_milliseconds := 60000
  );

  insert into _editorial_digest_jobs (request_id, digest_date, item_ids)
  values (v_req, current_date, v_item_ids);

  return jsonb_build_object('ok',true,'phase','fire','request_id',v_req,'items_sent',jsonb_array_length(v_items));
end $function$;
