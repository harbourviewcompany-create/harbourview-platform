-- One-shot generator to fill the 4 published-but-empty education modules with
-- body sections, matching the existing 5-section pedagogy (Why This Matters →
-- The Core Framework → How This Plays Out in Practice → Common Pitfalls → Key
-- Takeaways) already used across the other 27 modules.
--
-- Unlike country/counterparty enrichment (which derive from stored source
-- rows), this generates professional educational content on established
-- industry topics from the model's domain knowledge -- the same category as
-- the existing human/AI-authored modules. Prompt constrains to established
-- professional practice and explicitly forbids inventing specific figures,
-- named companies, or fabricated statistics, to keep it reference-grade.

create table if not exists _education_gen_jobs (
  request_id bigint primary key,
  module_id text not null,
  module_slug text not null,
  collected boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.run_education_section_gen()
returns jsonb
language plpgsql
security definer
set search_path to 'public','net','vault','extensions'
as $function$
declare
  v_key text;
  v_mod record;
  v_req bigint;
  v_inserted int := 0;
  v_pre text := 'You are writing a professional education module for Harbourview, a B2B cannabis market intelligence platform used by industry operators, importers, investors, and clinicians. Write in a measured, expert, non-hyped voice -- like a seasoned practitioner explaining hard-won knowledge to a competent peer. The module must follow EXACTLY this five-section structure, each section 1800-4000 characters of substantive prose (no bullet lists as the primary content, no headers within a section body): 1) "Why This Matters", 2) "The Core Framework", 3) "How This Plays Out in Practice", 4) "Common Pitfalls", 5) "Key Takeaways". Ground everything in established, generally-accepted professional practice for the topic. Do NOT invent specific statistics, market-size figures, named companies, dates, or citations -- speak at the level of durable professional principle rather than fabricated specifics. Return ONLY a JSON array of exactly 5 objects (no markdown, no prose outside JSON): [{"section_order": 1, "heading": "Why This Matters", "body": "..."}, ...].';
begin
  -- COLLECT phase
  perform 1 from _education_gen_jobs j where not j.collected;
  if found then
    for v_mod in
      select j.request_id, j.module_id, r.status_code,
             (safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text') as claude_text
      from _education_gen_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
    loop
      if v_mod.status_code = 200 then
        with p as (select safe_to_jsonb(trim(both from regexp_replace(v_mod.claude_text,'```(?:json)?','','g'))) as arr),
        ins as (
          insert into education_module_sections (module_id, section_order, heading, body, block_type)
          select v_mod.module_id::uuid,
                 (s->>'section_order')::int,
                 s->>'heading',
                 s->>'body',
                 'text'
          from p, jsonb_array_elements(p.arr) s
          where jsonb_typeof(p.arr)='array'
            and not exists (select 1 from education_module_sections es where es.module_id = v_mod.module_id::uuid)
          returning 1
        )
        select count(*) from ins into v_inserted;
      end if;
      update _education_gen_jobs set collected = true where request_id = v_mod.request_id;
    end loop;
    return jsonb_build_object('ok', true, 'phase','collect','sections_inserted', v_inserted);
  end if;

  -- FIRE phase: one module per call
  select decrypted_secret into v_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  if v_key is null then return jsonb_build_object('ok',false,'reason','no vault key'); end if;

  select m.id, m.slug, m.title, m.description, t.title as track
  into v_mod
  from education_modules m
  left join education_tracks t on t.id::text = m.track_id
  where m.publication_state='published'
    and not exists (select 1 from education_module_sections s where s.module_id = m.id)
    and not exists (select 1 from _education_gen_jobs j where j.module_id = m.id::text and not j.collected)
  order by m.slug limit 1;

  if v_mod.id is null then return jsonb_build_object('ok',true,'skipped','no empty published modules remaining'); end if;

  v_req := net.http_post(
    url := 'https://api.anthropic.com/v1/messages',
    headers := jsonb_build_object('x-api-key', v_key, 'anthropic-version','2023-06-01','content-type','application/json'),
    body := jsonb_build_object('model','claude-sonnet-4-6','max_tokens',8000,
      'messages', jsonb_build_array(jsonb_build_object('role','user','content',
        v_pre || E'\n\nMODULE TITLE: ' || v_mod.title
              || E'\nTRACK: ' || coalesce(v_mod.track,'')
              || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,'')))),
    timeout_milliseconds := 120000
  );
  insert into _education_gen_jobs (request_id, module_id, module_slug) values (v_req, v_mod.id::text, v_mod.slug);
  return jsonb_build_object('ok',true,'phase','fire','module',v_mod.slug,'request_id',v_req);
end;
$function$;
