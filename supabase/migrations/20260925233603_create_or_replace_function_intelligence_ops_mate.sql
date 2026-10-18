-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260925233603
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create or replace function intelligence_ops.materialize_full_depth_document_chunks(p_limit integer default 50)
returns integer
language plpgsql
security definer
set search_path = public, intelligence_ops, pg_catalog
as $$
declare
  v_count integer := 0;
  s record;
  p text;
  i integer := 0;
  parts text[];
begin
  for s in
    select ss.id,ss.source_id,ss.captured_text
    from public.source_snapshots ss
    where ss.fetch_status='success'
      and ss.captured_text is not null
      and length(ss.captured_text)>0
      and not exists(select 1 from public.jurisdiction_data_depth_document_chunks c where c.source_snapshot_id=ss.id)
    order by ss.captured_at desc
    limit greatest(1,p_limit)
  loop
    i := 0;
    parts := regexp_split_to_array(s.captured_text, E'\\n{2,}|(?<=\\.)\\s{2,}');
    if array_length(parts,1) is null then
      parts := array[s.captured_text];
    end if;
    foreach p in array parts loop
      if length(trim(p)) < 40 then continue; end if;
      i := i + 1;
      insert into public.jurisdiction_data_depth_document_chunks
        (source_snapshot_id,chunk_index,content,content_sha256)
      values
        (s.id,i,substr(trim(p),1,12000),encode(digest(substr(trim(p),1,12000),'sha256'),'hex'))
      on conflict (source_snapshot_id,chunk_index) do nothing;
    end loop;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function intelligence_ops.materialize_full_depth_document_chunks(integer) from public,anon,authenticated;

do $outer$
begin
  if exists(select 1 from cron.job where jobname='harbourview-full-depth-document-chunking') then
    perform cron.unschedule('harbourview-full-depth-document-chunking');
  end if;
  perform cron.schedule(
    'harbourview-full-depth-document-chunking',
    '*/2 * * * *',
    $job$select intelligence_ops.materialize_full_depth_document_chunks(50);$job$
  );
end
$outer$;

select jobname,schedule,active from cron.job
where jobname='harbourview-full-depth-document-chunking';
