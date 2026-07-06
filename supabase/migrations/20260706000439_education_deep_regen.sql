-- Deep regeneration of ALL published education modules with richer, more
-- detailed content using illustrative specifics (example numbers/scenarios
-- explicitly framed as illustrative, not stated as verified market fact).
-- Every regenerated module is marked content_review_status='ai_generated_pending_review'.
-- Original sections are backed up in education_module_sections_backup_20260705.

create table if not exists _education_regen_jobs (
  request_id bigint primary key,
  module_id text not null,
  module_slug text not null,
  collected boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.run_education_deep_regen()
returns jsonb
language plpgsql
security definer
set search_path to 'public','net','vault','extensions'
as $function$
declare
  v_key text;
  v_mod record;
  v_req bigint;
  v_done int := 0;
  v_pre text := 'You are writing an in-depth professional education module for Harbourview, a B2B cannabis market intelligence platform used by industry operators, importers, investors, and clinicians. Write in a measured, expert, non-hyped voice -- a seasoned practitioner explaining hard-won knowledge to a competent peer who wants genuine depth, not an overview.

Follow EXACTLY this five-section structure, each section 3500-6000 characters of substantive prose: 1) "Why This Matters", 2) "The Core Framework", 3) "How This Plays Out in Practice", 4) "Common Pitfalls", 5) "Key Takeaways".

DEPTH REQUIREMENTS: Use concrete, illustrative specifics to teach -- worked numeric examples, realistic scenarios, specific decision criteria a practitioner actually applies, and step-by-step reasoning. For example, walk through an actual calculation, describe a representative timeline with rough durations, or trace a specific decision path. This makes the content genuinely useful rather than abstract.

HONESTY RULE (critical): When you use a specific number, timeline, cost, or scenario as a teaching example, frame it explicitly as illustrative -- e.g. "consider a distributor moving roughly 500kg per quarter", "a typical EU-GMP readiness timeline might run 12-18 months", "suppose a jurisdiction reports 40,000 registered patients". Do NOT present illustrative figures as verified current market data, and do NOT invent named real companies, fake citations, specific dated events, or statistics attributed to real sources. Illustrative examples = yes and encouraged; fabricated verified facts = never.

Return ONLY a JSON array of exactly 5 objects (no markdown, no prose outside JSON): [{"section_order": 1, "heading": "Why This Matters", "body": "..."}, ...].';
begin
  -- COLLECT phase: process ALL ready responses
  perform 1 from _education_regen_jobs j where not j.collected;
  if found then
    for v_mod in
      select j.request_id, j.module_id, r.status_code,
             (safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text') as claude_text
      from _education_regen_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
    loop
      if v_mod.status_code = 200 then
        declare v_arr jsonb;
        begin
          v_arr := safe_to_jsonb(trim(both from regexp_replace(v_mod.claude_text,'```(?:json)?','','g')));
          if jsonb_typeof(v_arr)='array' and jsonb_array_length(v_arr) = 5 then
            -- Replace sections atomically: delete old, insert new
            delete from education_module_sections where module_id = v_mod.module_id::uuid;
            insert into education_module_sections (module_id, section_order, heading, body, block_type)
            select v_mod.module_id::uuid, (s->>'section_order')::int, s->>'heading', s->>'body', 'text'
            from jsonb_array_elements(v_arr) s;
            update education_modules set content_review_status='ai_generated_pending_review', updated_at=now()
            where id = v_mod.module_id::uuid;
            v_done := v_done + 1;
          end if;
        end;
      end if;
      update _education_regen_jobs set collected = true where request_id = v_mod.request_id;
    end loop;
    return jsonb_build_object('ok', true, 'phase','collect','modules_regenerated', v_done);
  end if;

  -- FIRE phase: next un-regenerated published module
  select decrypted_secret into v_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  if v_key is null then return jsonb_build_object('ok',false,'reason','no vault key'); end if;

  select m.id, m.slug, m.title, m.description, t.title as track
  into v_mod
  from education_modules m
  left join education_tracks t on t.id::text = m.track_id
  where m.publication_state='published'
    and m.content_review_status is distinct from 'ai_generated_pending_review'
    and not exists (select 1 from _education_regen_jobs j where j.module_id = m.id::text)
  order by m.slug limit 1;

  if v_mod.id is null then return jsonb_build_object('ok',true,'skipped','all published modules regenerated'); end if;

  v_req := net.http_post(
    url := 'https://api.anthropic.com/v1/messages',
    headers := jsonb_build_object('x-api-key', v_key, 'anthropic-version','2023-06-01','content-type','application/json'),
    body := jsonb_build_object('model','claude-sonnet-4-6','max_tokens',12000,
      'messages', jsonb_build_array(jsonb_build_object('role','user','content',
        v_pre || E'\n\nMODULE TITLE: ' || v_mod.title
              || E'\nTRACK: ' || coalesce(v_mod.track,'')
              || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,'')))),
    timeout_milliseconds := 150000
  );
  insert into _education_regen_jobs (request_id, module_id, module_slug) values (v_req, v_mod.id::text, v_mod.slug);
  return jsonb_build_object('ok',true,'phase','fire','module',v_mod.slug,'request_id',v_req);
end;
$function$;
