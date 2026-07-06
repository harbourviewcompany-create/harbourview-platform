-- Extend country_intel enrichment to ALSO draw on published jurisdiction_playbooks,
-- not just captured signals. This unlocks depth for countries that have a
-- real researched playbook but little/no recent signal traffic (e.g. India,
-- Nigeria) -- they were stuck at the shallow ~195-char summary because the
-- original enrichment only targeted countries with signal material.
--
-- Safety: only status='published' playbooks are used (the 178 'draft' rows are
-- empty 192-country stubs; pulling those would feed the model nothing). The
-- prompt already instructs "use ONLY facts in the provided material, never
-- invent" -- playbook facts are real researched/sourced content, so this stays
-- within the no-fabrication line.

create or replace function public.run_country_intel_enrichment()
returns jsonb
language plpgsql
security definer
set search_path to 'public','net','vault','extensions'
as $function$
declare
  v_key text;
  v_payload jsonb;
  v_countries text[];
  v_req bigint;
  v_updated int := 0;
  v_pre text := 'You are a cannabis regulatory intelligence editor for Harbourview, a B2B market intelligence platform. Below is a JSON array of countries, each with its current briefing and REAL source material: recently-captured intelligence signals and/or a researched market-entry playbook (legal framework, licensing steps, regulators, timeline, cost). Using ONLY the facts in the provided material (never invent facts, names, dates, or figures not present in the source material), write two things per country: (1) a richer "public_summary" (3-5 sentences, factual, no speculation, safe for a free public teaser page) and (2) a deeper "commercial_pathway_summary" (4-6 sentences, factual, covering licensing/market-entry/trade specifics found in the material) for a paid subscriber briefing. If the material does not support a claim, do not include it -- prefer being shorter and accurate over longer and speculative. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"country_code": string, "public_summary": string, "commercial_pathway_summary": string}.';
begin
  -- COLLECT phase (unchanged)
  perform 1 from _country_enrich_jobs j where not j.collected;
  if found then
    update _country_enrich_jobs j set collected = true
    where not j.collected and j.created_at < now() - interval '2 hours'
      and not exists (select 1 from net._http_response r where r.id = j.request_id);

    with resp as (
      select j.request_id, j.country_codes,
             (safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text') as claude_text,
             r.status_code
      from _country_enrich_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, country_codes, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, country_codes, p from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    upd as (
      update country_intel ci set
        public_summary = coalesce(nullif(trim(h->>'public_summary'), ''), ci.public_summary),
        commercial_pathway_summary = coalesce(nullif(trim(h->>'commercial_pathway_summary'), ''), ci.commercial_pathway_summary),
        last_enriched_at = now(),
        updated_at = now()
      from ok, jsonb_array_elements(ok.p) h
      where ci.country_code = h->>'country_code'
      returning 1
    ),
    done as (
      update _country_enrich_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning 1
    )
    select count(*) from upd into v_updated;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'countries_enriched', coalesce(v_updated, 0));
  end if;

  -- FIRE phase
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'anthropic_api_key' limit 1;
  if v_key is null then return jsonb_build_object('ok', false, 'reason', 'anthropic_api_key not in vault'); end if;

  with targets as (
    select ci.country_code, ci.country_name, ci.public_summary, ci.commercial_pathway_summary
    from country_intel ci
    where ci.last_enriched_at is null
      and (
        exists (select 1 from ia_signals s where s.market = ci.country_name and s.stage in ('qualified','converted_to_opportunity'))
        or exists (select 1 from signals sg where sg.country = ci.country_name)
        -- NEW: also target countries with a published playbook, even if no signals
        or exists (select 1 from jurisdiction_playbooks p where p.country_iso2 = ci.country_code and p.status = 'published')
      )
    limit 8
  ),
  material as (
    select t.country_code, t.country_name, t.public_summary, t.commercial_pathway_summary,
      (
        select jsonb_agg(jsonb_build_object('title', s.title, 'summary', s.summary, 'type', s.type, 'confidence', s.confidence))
        from (
          select title, summary, type, confidence from ia_signals
          where market = t.country_name and stage in ('qualified','converted_to_opportunity')
          order by confidence desc, created_at desc limit 6
        ) s
      ) as ia_material,
      (
        select jsonb_agg(jsonb_build_object('title', sg.headline, 'summary', sg.summary))
        from (
          select headline, summary from signals where country = t.country_name
          order by created_at desc limit 6
        ) sg
      ) as mature_material,
      -- NEW: pull the published playbook for this country as source material
      (
        select jsonb_build_object(
                 'legal_framework', p.legal_framework_summary,
                 'difficulty', p.difficulty,
                 'typical_timeline_months', p.typical_timeline_months,
                 'estimated_cost_range', p.estimated_cost_range,
                 'steps', p.steps,
                 'key_regulators', p.key_regulators,
                 'common_pitfalls', p.common_pitfalls)
        from jurisdiction_playbooks p
        where p.country_iso2 = t.country_code and p.status = 'published'
        limit 1
      ) as playbook_material
    from targets t
  )
  select
    jsonb_agg(jsonb_build_object(
      'country_code', country_code, 'country_name', country_name,
      'current_public_summary', public_summary, 'current_commercial_pathway_summary', commercial_pathway_summary,
      'signals', coalesce(ia_material, '[]'::jsonb) || coalesce(mature_material, '[]'::jsonb),
      'playbook', playbook_material
    )),
    array_agg(country_code)
  into v_payload, v_countries
  from material;

  if v_payload is null or jsonb_array_length(v_payload) = 0 then
    return jsonb_build_object('ok', true, 'skipped', 'no unenriched countries with real source material');
  end if;

  v_req := net.http_post(
    url := 'https://api.anthropic.com/v1/messages',
    headers := jsonb_build_object('x-api-key', v_key, 'anthropic-version','2023-06-01','content-type','application/json'),
    body := jsonb_build_object('model','claude-sonnet-4-6','max_tokens',4000,
      'messages', jsonb_build_array(jsonb_build_object('role','user','content',
        v_pre || E'\n\nCOUNTRIES:\n' || v_payload::text))),
    timeout_milliseconds := 90000
  );

  insert into _country_enrich_jobs (request_id, country_codes) values (v_req, v_countries);
  return jsonb_build_object('ok', true, 'phase', 'fire', 'request_id', v_req, 'countries_sent', jsonb_array_length(v_payload));
end;
$function$;
