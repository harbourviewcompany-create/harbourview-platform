-- Optimize source snapshot capture by issuing the batch of HTTP requests
-- before awaiting responses, and schedule continuous fail-closed capture.
create or replace function public.capture_source_snapshot_batch_v2(p_limit integer default 25)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions','net','pg_catalog'
as $$
declare
  src record;
  req record;
  response record;
  captured_at timestamptz;
  text_content text;
  content_hash text;
  previous_hash text;
  success_count integer := 0;
  error_count integer := 0;
  processed_count integer := 0;
begin
  if p_limit is null or p_limit < 1 or p_limit > 25 then
    raise exception 'p_limit must be between 1 and 25';
  end if;

  create temporary table if not exists _hv_capture_requests(
    source_id uuid, source_url text, source_name text, captured_at timestamptz, request_id bigint
  ) on commit drop;
  truncate _hv_capture_requests;

  for src in
    select sr.id,sr.source_url,sr.source_name
    from public.source_registry sr
    where sr.is_active and sr.crawl_allowed and sr.source_url is not null
      and sr.next_crawl_at <= now()
      and not exists (
        select 1 from public.source_snapshots ss
        where ss.source_id=sr.id and ss.fetch_status='success'
          and ss.captured_at >= now()-interval '24 hours'
      )
    order by sr.tier asc nulls last, sr.next_crawl_at asc nulls first, sr.id
    limit p_limit
  loop
    captured_at:=now();
    insert into _hv_capture_requests
    select src.id,src.source_url,src.source_name,captured_at,
      net.http_get(
        src.source_url,'{}'::jsonb,
        jsonb_build_object(
          'User-Agent','Harbourview-Regulatory-Source-Capture/2.0',
          'Accept','text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.5'
        ),5000
      );
    processed_count:=processed_count+1;
  end loop;

  for req in select * from _hv_capture_requests order by captured_at,source_id loop
    perform net._await_response(req.request_id);
    select r.status_code,r.content_type,r.content,r.error_msg,r.timed_out
      into response from net._http_response r where r.id=req.request_id;

    if response.content is null and (response.error_msg is not null or response.timed_out) then
      insert into public.source_snapshots(source_id,captured_url,captured_title,captured_at,fetch_status,error_message,processing_status)
      values(req.source_id,req.source_url,req.source_name,req.captured_at,'error',
        coalesce(response.error_msg,case when response.timed_out then 'request_timed_out' else 'empty_response' end),'pending');
      error_count:=error_count+1; continue;
    end if;

    text_content:=case
      when response.content_type ilike 'text/html%' or response.content_type ilike 'application/xhtml+xml%'
      then regexp_replace(regexp_replace(regexp_replace(coalesce(response.content,''),'<script[^>]*>[\\s\\S]*?</script>',' ','gi'),'<style[^>]*>[\\s\\S]*?</style>',' ','gi'),'<[^>]+>',' ','g')
      else null end;
    text_content:=nullif(trim(regexp_replace(replace(replace(replace(replace(coalesce(text_content,''),'&nbsp;',' '),'&amp;','&'),'&lt;','<'),'&gt;','>'),'\\s+',' ','g')),'');
    content_hash:=encode(digest(convert_to(coalesce(response.content,''),'UTF8'),'sha256'),'hex');

    select ss.raw_html_hash into previous_hash
    from public.source_snapshots ss where ss.source_id=req.source_id and ss.fetch_status='success'
    order by ss.captured_at desc limit 1;

    insert into public.source_snapshots(
      source_id,captured_url,captured_title,captured_text,raw_html_hash,captured_at,fetch_status,
      error_message,language_detected,word_count,requires_translation,previous_hash,changed,processing_status
    ) values (
      req.source_id,req.source_url,req.source_name,text_content,content_hash,req.captured_at,
      case when response.status_code between 200 and 299 then 'success' else 'http_error' end,
      case when response.status_code between 200 and 299 then null else coalesce(response.error_msg,'HTTP '||response.status_code::text) end,
      'unknown',case when text_content is null then null else array_length(regexp_split_to_array(text_content,'\\s+'),1) end,
      false,previous_hash,case when previous_hash is null then true else previous_hash<>content_hash end,'pending'
    );

    if response.status_code between 200 and 299 then
      success_count:=success_count+1;
      update public.source_registry set last_checked_at=req.captured_at,next_crawl_at=req.captured_at+interval '1 day',
        network_status='online',consecutive_failures=0,last_error_log=null,updated_at=now() where id=req.source_id;
    else
      error_count:=error_count+1;
      update public.source_registry set last_checked_at=req.captured_at,next_crawl_at=req.captured_at+interval '1 day',
        network_status='http_error',consecutive_failures=least(consecutive_failures+1,100),
        last_error_log='HTTP '||response.status_code::text,updated_at=now() where id=req.source_id;
    end if;
  end loop;

  return jsonb_build_object('processed',processed_count,'success',success_count,'errors',error_count,'captured_at',now());
end;
$$;

do $$
begin
  if exists (select 1 from cron.job where jobname='harbourview-source-snapshot-v2') then
    perform cron.unschedule(jobid) from cron.job where jobname='harbourview-source-snapshot-v2';
  end if;
end $$;

select cron.schedule('harbourview-source-snapshot-v2','*/5 * * * *','select public.capture_source_snapshot_batch_v2(5);');
