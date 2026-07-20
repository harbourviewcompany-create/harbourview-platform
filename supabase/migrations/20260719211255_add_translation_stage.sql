-- §5 pipeline stage: NORMALIZE + DETECT LANGUAGE → translate → title_en/summary_en, BEFORE classify.
-- Root cause of classifier recall 0.40 on non-English: it reads raw foreign text. This stage fixes that.

alter table public.signals
  add column if not exists title_en text,
  add column if not exists summary_en text,
  add column if not exists lang_detected text,
  add column if not exists translated_at timestamptz,
  add column if not exists translation_model text;

create table if not exists public.hv_translation_jobs (
  request_id  bigint primary key,
  signal_id   text not null,
  dispatched_at timestamptz not null default now(),
  harvested   boolean not null default false
);
create index if not exists hv_translation_jobs_unharvested on public.hv_translation_jobs (harvested) where not harvested;

-- Fire translation calls (async via pg_net) for non-English, untranslated signals.
create or replace function public.hv_translate_dispatch(p_limit int default 30, p_eval_only boolean default false)
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare r record; v_rid bigint; v_key text; n int := 0;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name='openai_api_key';
  for r in
    select s.id, s.headline, s.summary
    from public.signals s
    where coalesce(s.lang,'en') not in ('en','EN')
      and s.title_en is null
      and s.headline is not null
      and (not p_eval_only or s.id in (select signal_id from public.intel_eval_set))
    order by s.created_at desc
    limit p_limit
  loop
    select net.http_post(
      url := 'https://api.openai.com/v1/chat/completions',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key),
      body := jsonb_build_object(
        'model','gpt-4o-mini','temperature',0,
        'response_format', jsonb_build_object('type','json_object'),
        'messages', jsonb_build_array(
          jsonb_build_object('role','system','content','You translate cannabis-industry news to English for a B2B regulatory-intelligence pipeline. Detect the original language and translate the headline and summary into natural English. Return ONLY strict JSON: {"lang":"<ISO 639-1>","title_en":"...","summary_en":"..."}. If already English, echo it back with lang:"en".'),
          jsonb_build_object('role','user','content','HEADLINE: '||coalesce(r.headline,'')||E'\nSUMMARY: '||coalesce(left(r.summary,1000),''))
        )
      ),
      timeout_milliseconds := 30000
    ) into v_rid;
    insert into public.hv_translation_jobs(request_id, signal_id) values (v_rid, r.id)
      on conflict (request_id) do nothing;
    n := n + 1;
  end loop;
  return n;
end$fn$;

-- Collect completed responses; write title_en/summary_en/lang_detected back to signals.
create or replace function public.hv_translate_harvest()
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare r record; v_out jsonb; n int := 0;
begin
  for r in
    select j.request_id, j.signal_id, resp.status_code, resp.content
    from public.hv_translation_jobs j
    join net._http_response resp on resp.id = j.request_id
    where not j.harvested
  loop
    if r.status_code = 200 then
      begin
        v_out := (r.content::jsonb->'choices'->0->'message'->>'content')::jsonb;
        update public.signals s set
          title_en   = nullif(btrim(v_out->>'title_en'),''),
          summary_en = nullif(btrim(v_out->>'summary_en'),''),
          lang_detected = nullif(btrim(v_out->>'lang'),''),
          translated_at = now(),
          translation_model = 'gpt-4o-mini'
        where s.id = r.signal_id;
        n := n + 1;
      exception when others then null;
      end;
    end if;
    update public.hv_translation_jobs set harvested = true where request_id = r.request_id;
  end loop;
  return n;
end$fn$;