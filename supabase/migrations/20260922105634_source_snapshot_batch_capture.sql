create or replace function public.capture_source_snapshot_batch(p_limit integer default 10)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, net, pg_catalog
as $$
declare
  src record;
  request_id bigint;
  status_code integer;
  content_type text;
  content text;
  error_msg text;
  timed_out boolean;
  captured_at timestamptz;
  success_count integer := 0;
  error_count integer := 0;
  processed_count integer := 0;
  text_content text;
  content_hash text;
  previous_hash text;
begin
  if p_limit is null or p_limit < 1 or p_limit > 25 then
    raise exception 'p_limit must be between 1 and 25';
  end if;

  for src in
    select sr.id,sr.source_url,sr.source_name,sr.jurisdiction_code,sr.iso
    from public.source_registry sr
    where sr.is_active and sr.crawl_allowed and sr.source_url is not null
      and sr.next_crawl_at <= now()
      and not exists (
        select 1 from public.source_snapshots ss
        where ss.source_id=sr.id and ss.fetch_status='success'
          and ss.captured_at >= now()-interval '24 hours'
      )
    order by sr.tier asc nulls last,sr.next_crawl_at asc nulls first,sr.id
    limit p_limit
  loop
    processed_count := processed_count + 1;
    captured_at := now();
    request_id := net.http_get(
      src.source_url,'{}'::jsonb,
      jsonb_build_object(
        'User-Agent','Harbourview-Regulatory-Source-Capture/1.0',
        'Accept','text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.5'
      ),20000);
    perform net._await_response(request_id);
    select r.status_code,r.content_type,r.content,r.error_msg,r.timed_out
      into status_code,content_type,content,error_msg,timed_out
    from net._http_response r where r.id=request_id;

    if content is null and (error_msg is not null or timed_out) then
      insert into public.source_snapshots(source_id,captured_url,captured_title,captured_at,fetch_status,error_message)
      values(src.id,src.source_url,src.source_name,captured_at,'error',
        coalesce(error_msg,case when timed_out then 'request_timed_out' else 'empty_response' end));
      error_count := error_count + 1;
      continue;
    end if;

    text_content := case
      when content_type ilike 'text/html%' or content_type ilike 'application/xhtml+xml%'
      then regexp_replace(
        regexp_replace(
          regexp_replace(coalesce(content,''),'<script[^>]*>[\s\S]*?</script>',' ','gi'),
          '<style[^>]*>[\s\S]*?</style>',' ','gi'),
        '<[^>]+>',' ','g')
      else null
    end;
    text_content := nullif(trim(regexp_replace(
      replace(replace(replace(replace(coalesce(text_content,''),'&nbsp;',' '),'&amp;','&'),'&lt;','<'),'&gt;','>'),
      '\s+',' ','g')),'');
    content_hash := encode(digest(convert_to(coalesce(content,''),'UTF8'),'sha256'),'hex');

    select ss.raw_html_hash into previous_hash
    from public.source_snapshots ss
    where ss.source_id=src.id and ss.fetch_status='success'
    order by ss.captured_at desc limit 1;

    insert into public.source_snapshots(
      source_id,captured_url,captured_title,captured_text,raw_html_hash,captured_at,
      fetch_status,error_message,language_detected,word_count,requires_translation,
      previous_hash,changed,processing_status
    ) values(
      src.id,src.source_url,src.source_name,text_content,content_hash,captured_at,
      case when status_code between 200 and 299 then 'success' else 'http_error' end,
      case when status_code between 200 and 299 then null else coalesce(error_msg,'HTTP '||status_code::text) end,
      'unknown',
      case when text_content is null then null else array_length(regexp_split_to_array(text_content,'\s+'),1) end,
      false,previous_hash,
      case when previous_hash is null then true else previous_hash<>content_hash end,
      'pending');

    if status_code between 200 and 299 then
      success_count := success_count + 1;
      update public.source_registry
      set last_checked_at=captured_at,next_crawl_at=captured_at+interval '1 day',
          network_status='online',consecutive_failures=0,last_error_log=null,updated_at=now()
      where id=src.id;
    else
      error_count := error_count + 1;
      update public.source_registry
      set last_checked_at=captured_at,next_crawl_at=captured_at+interval '1 day',
          network_status='http_error',
          consecutive_failures=least(consecutive_failures+1,100),
          last_error_log='HTTP '||status_code::text,updated_at=now()
      where id=src.id;
    end if;
  end loop;

  return jsonb_build_object('processed',processed_count,'success',success_count,
    'errors',error_count,'captured_at',now());
end;
$$;
revoke all on function public.capture_source_snapshot_batch(integer) from public;