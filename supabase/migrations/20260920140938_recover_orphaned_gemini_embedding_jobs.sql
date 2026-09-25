-- Recover pg_net embedding jobs that have no response row and would otherwise block the queue.
create or replace function public.hv_embed_harvest()
returns integer
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  j record;
  i int;
  n int := 0;
  v_emb text;
  v_batch_ok boolean;
begin
  update public.hv_embed_jobs hj
  set harvested = true
  where not hj.harvested
    and not exists (
      select 1 from net._http_response resp where resp.id = hj.request_id
    );

  for j in
    select hj.request_id, hj.signal_ids, resp.status_code, resp.content
    from public.hv_embed_jobs hj
    join net._http_response resp on resp.id = hj.request_id
    where not hj.harvested
  loop
    v_batch_ok := (j.status_code = 200);
    if v_batch_ok then
      for i in 1 .. array_length(j.signal_ids,1) loop
        begin
          v_emb := replace(((j.content::jsonb)->'embeddings'->(i-1)->'values')::text, ' ', '');
          if v_emb is not null and v_emb <> 'null' then
            update public.signals
            set embedding_gemini_1024 = v_emb::vector, embedded_at = now()
            where id = j.signal_ids[i];
            n := n + 1;
          else
            v_batch_ok := false;
          end if;
        exception when others then
          v_batch_ok := false;
        end;
      end loop;
    end if;
    if v_batch_ok then
      update public.hv_embed_jobs set harvested = true where request_id = j.request_id;
    end if;
  end loop;
  return n;
end
$function$;
