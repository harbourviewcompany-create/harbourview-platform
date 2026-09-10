-- Reconstructed from production. Applied 2026-08-31 via the same unmerged
-- branch as 20260831120000 (never got a PR, applied directly to prod).
-- Repoints embedding dispatch from OpenAI to Gemini's batch embedding
-- endpoint (1024-dim), storing into embedding_gemini_1024 rather than the
-- prior embedding_1024 (OpenAI) column. Confirmed byte-identical to what
-- is currently live.

CREATE OR REPLACE FUNCTION public.hv_embed_dispatch(p_signal_ids text[])
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare v_rid bigint; v_texts text[]; v_ids text[]; v_allowed int; v_requests jsonb; v_gemini_key text;
begin
  v_allowed := public.hv_consume_dispatch_budget('embed', least(coalesce(array_length(p_signal_ids,1),0), 100));
  if v_allowed <= 0 then return null; end if;
  v_ids := p_signal_ids[1 : v_allowed];

  select array_agg(coalesce(s.title_en, s.headline) || '. ' || coalesce(s.summary_en, left(s.summary,300), '') order by ord)
    into v_texts
  from unnest(v_ids) with ordinality as u(sid, ord)
  join public.signals s on s.id = u.sid;

  select jsonb_agg(
    jsonb_build_object(
      'model','models/gemini-embedding-001',
      'content', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', left(t, 4000)))),
      'outputDimensionality', 1024
    )
  ) into v_requests
  from unnest(v_texts) t;

  v_gemini_key := public.hv_get_gemini_key();

  select net.http_post(
    url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=' || v_gemini_key,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('requests', v_requests),
    timeout_milliseconds := 45000
  ) into v_rid;

  insert into public.hv_embed_jobs(request_id, signal_ids) values (v_rid, v_ids);
  return v_rid;
end
$function$
;
