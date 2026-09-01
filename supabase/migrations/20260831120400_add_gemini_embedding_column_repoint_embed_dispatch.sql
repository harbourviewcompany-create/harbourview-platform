-- Add signals.embedding_gemini_1024 and repoint hv_embed_dispatch/
-- hv_embed_harvest to Gemini's batchEmbedContents endpoint,
-- writing into the NEW column rather than the existing
-- embedding_1024 (OpenAI text-embedding-3-small space).
--
-- Deliberately NOT reusing embedding_1024: six live functions
-- (hv_dedup_assign, search_public_signals, search_signals_semantic,
-- hv_search_artifacts, dedup_promoted_feed, hv_pipeline_tick) read
-- that column and assume one consistent vector space. OpenAI and
-- Gemini embeddings of the same text are NOT comparable even at the
-- same dimensionality -- mixing them in place would silently
-- corrupt dedup and search relevance. embedding_1024 was already
-- stale (OpenAI embeddings dead since ~Aug 11) before this change;
-- after this change nothing will EVER populate it again by design.
--
-- IMPORTANT / NOT YET DONE: the six functions above still read the
-- old embedding_1024 column and were NOT migrated to
-- embedding_gemini_1024 as part of this change. As of 2026-08-31,
-- coverage was only 969/13,506 signals (~7%) -- repointing search/
-- dedup before that backfill completes would be a severe
-- regression (near-total loss of match coverage), worse than the
-- current staleness. hv_pipeline_tick's embed-dispatch loop (fixed
-- in the extraction-fallback migration) will clear the real
-- backlog (~5,749 quality_label='signal' rows) over roughly 4 days
-- at the existing budget ceiling. Migrate the six consumers to
-- embedding_gemini_1024 only once coverage is verified adequate --
-- do not do this reflexively.

alter table public.signals add column if not exists embedding_gemini_1024 vector(1024);

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

CREATE OR REPLACE FUNCTION public.hv_embed_harvest()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare j record; i int; n int:=0; v_emb text; v_batch_ok boolean;
begin
  for j in select hj.request_id, hj.signal_ids, resp.status_code, resp.content
           from public.hv_embed_jobs hj join net._http_response resp on resp.id=hj.request_id
           where not hj.harvested
  loop
    v_batch_ok := (j.status_code = 200);
    if v_batch_ok then
      for i in 1 .. array_length(j.signal_ids,1) loop
        begin
          v_emb := replace(((j.content::jsonb)->'embeddings'->(i-1)->'values')::text, ' ', '');
          if v_emb is not null and v_emb <> 'null' then
            update public.signals set embedding_gemini_1024 = v_emb::vector, embedded_at=now()
            where id = j.signal_ids[i];
            n := n+1;
          else
            v_batch_ok := false;
          end if;
        exception when others then
          v_batch_ok := false;
        end;
      end loop;
    end if;
    if v_batch_ok then
      update public.hv_embed_jobs set harvested=true where request_id=j.request_id;
    end if;
  end loop;
  return n;
end
$function$
;
