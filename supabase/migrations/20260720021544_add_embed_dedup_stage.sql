-- §6.4 dedup: embed English-normalized text so cross-language duplicates cluster.
create table if not exists public.hv_embed_jobs (
  request_id bigint primary key,
  signal_ids text[] not null,
  harvested boolean not null default false
);

create or replace function public.hv_embed_dispatch(p_signal_ids text[])
returns bigint language plpgsql security definer set search_path to 'public' as $fn$
declare v_rid bigint; v_inputs jsonb;
begin
  select jsonb_agg(coalesce(s.title_en, s.headline) || '. ' || coalesce(s.summary_en, left(s.summary,300), '') order by ord)
    into v_inputs
  from unnest(p_signal_ids) with ordinality as u(sid, ord)
  join public.signals s on s.id = u.sid;

  select net.http_post(
    url := 'https://api.openai.com/v1/embeddings',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='openai_api_key')),
    body := jsonb_build_object('model','text-embedding-3-small','dimensions',1024,'input', v_inputs),
    timeout_milliseconds := 45000
  ) into v_rid;

  insert into public.hv_embed_jobs(request_id, signal_ids) values (v_rid, p_signal_ids);
  return v_rid;
end$fn$;

create or replace function public.hv_embed_harvest()
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare j record; i int; n int:=0; v_emb text;
begin
  for j in select hj.request_id, hj.signal_ids, resp.status_code, resp.content
           from public.hv_embed_jobs hj join net._http_response resp on resp.id=hj.request_id
           where not hj.harvested
  loop
    if j.status_code = 200 then
      for i in 1 .. array_length(j.signal_ids,1) loop
        begin
          v_emb := replace(((j.content::jsonb)->'data'->(i-1)->'embedding')::text, ' ', '');
          if v_emb is not null and v_emb <> 'null' then
            update public.signals set embedding_1024 = v_emb::vector, embedding_model='text-embedding-3-small', embedded_at=now()
            where id = j.signal_ids[i];
            n := n+1;
          end if;
        exception when others then null;
        end;
      end loop;
    end if;
    update public.hv_embed_jobs set harvested=true where request_id=j.request_id;
  end loop;
  return n;
end$fn$;