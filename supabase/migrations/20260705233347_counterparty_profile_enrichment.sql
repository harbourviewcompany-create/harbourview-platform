-- Enriches ia_counterparties.supply_profile / needs_profile from REAL source
-- material (ia_scoring_records score_drivers + market_access_relevance +
-- role/markets/categories), for trading counterparties only. Regulators and
-- market_access_partners (FDA, CMS, etc.) are excluded -- a "supply profile"
-- is meaningless for them and would be fabrication.
--
-- Same discipline as country enrichment: strict "use ONLY provided facts"
-- prompt, Sonnet, Vault key, fire/collect async pattern. Derives a commercial
-- profile from a counterparty's actual scored attributes (certifications,
-- market access, interaction history) -- not invented business details.

alter table ia_counterparties add column if not exists last_profile_enriched_at timestamptz;

create table if not exists _counterparty_enrich_jobs (
  request_id bigint primary key,
  counterparty_ids text[] not null,
  collected boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.run_counterparty_enrichment()
returns jsonb
language plpgsql
security definer
set search_path to 'public','net','vault','extensions'
as $function$
declare
  v_key text;
  v_payload jsonb;
  v_ids text[];
  v_req bigint;
  v_updated int := 0;
  v_pre text := 'You are a B2B cannabis market intelligence analyst for Harbourview. Below is a JSON array of trading counterparties (sellers, buyers, suppliers, distributors, importers, logistics providers). Each includes its role, markets, product categories, and REAL scored attributes derived from Harbourview''s relationship intelligence (certifications, market-access relevance, interaction history, score drivers). Using ONLY these provided facts (never invent company details, certifications, volumes, or relationships not present in the source material), write for each: (1) a "supply_profile" for sellers/suppliers/distributors/logistics (what they supply / their capabilities, 2-3 sentences) OR a "needs_profile" for buyers/importers (what they source / their requirements, 2-3 sentences). For a counterparty whose role is a seller-type, populate supply_profile and set needs_profile to null; for buyer-types, populate needs_profile and set supply_profile to null. Base every statement on the provided attributes -- if material is thin, write a shorter factual profile rather than embellishing. Return ONLY a JSON array (no markdown, no prose). Each element: {"id": string, "supply_profile": string|null, "needs_profile": string|null}.';
begin
  -- COLLECT phase
  perform 1 from _counterparty_enrich_jobs j where not j.collected;
  if found then
    update _counterparty_enrich_jobs j set collected = true
    where not j.collected and j.created_at < now() - interval '2 hours'
      and not exists (select 1 from net._http_response r where r.id = j.request_id);

    with resp as (
      select j.request_id,
             (safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text') as claude_text,
             r.status_code
      from _counterparty_enrich_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, p from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    upd as (
      update ia_counterparties c set
        supply_profile = coalesce(nullif(trim(h->>'supply_profile'), ''), c.supply_profile),
        needs_profile  = coalesce(nullif(trim(h->>'needs_profile'), ''), c.needs_profile),
        last_profile_enriched_at = now(),
        updated_at = now()
      from ok, jsonb_array_elements(ok.p) h
      where c.id = h->>'id'
      returning 1
    ),
    done as (
      update _counterparty_enrich_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning 1
    )
    select count(*) from upd into v_updated;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'counterparties_enriched', coalesce(v_updated, 0));
  end if;

  -- FIRE phase
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'anthropic_api_key' limit 1;
  if v_key is null then return jsonb_build_object('ok', false, 'reason', 'anthropic_api_key not in vault'); end if;

  with targets as (
    select c.id, c.name, c.role, c.markets, c.categories
    from ia_counterparties c
    where c.last_profile_enriched_at is null
      and c.needs_profile is null and c.supply_profile is null
      and c.role in ('seller','buyer','supplier','distributor','importer','logistics_provider','packaging_supplier','consultant')
    limit 10
  ),
  material as (
    select t.id, t.name, t.role, t.markets, t.categories,
      (
        select jsonb_agg(distinct d)
        from ia_scoring_records sr, unnest(coalesce(sr.score_drivers, array[]::text[])) d
        where sr.counterparty_id = t.id
      ) as drivers,
      (
        select jsonb_agg(distinct m)
        from ia_scoring_records sr, unnest(coalesce(sr.market_access_relevance, array[]::text[])) m
        where sr.counterparty_id = t.id
      ) as market_access
    from targets t
  )
  select
    jsonb_agg(jsonb_build_object(
      'id', id, 'name', name, 'role', role,
      'markets', to_jsonb(markets), 'categories', to_jsonb(categories),
      'score_drivers', coalesce(drivers, '[]'::jsonb),
      'market_access_relevance', coalesce(market_access, '[]'::jsonb)
    )),
    array_agg(id)
  into v_payload, v_ids
  from material;

  if v_payload is null or jsonb_array_length(v_payload) = 0 then
    return jsonb_build_object('ok', true, 'skipped', 'no unprofiled trading counterparties remaining');
  end if;

  v_req := net.http_post(
    url := 'https://api.anthropic.com/v1/messages',
    headers := jsonb_build_object('x-api-key', v_key, 'anthropic-version','2023-06-01','content-type','application/json'),
    body := jsonb_build_object('model','claude-sonnet-4-6','max_tokens',3000,
      'messages', jsonb_build_array(jsonb_build_object('role','user','content',
        v_pre || E'\n\nCOUNTERPARTIES:\n' || v_payload::text))),
    timeout_milliseconds := 90000
  );

  insert into _counterparty_enrich_jobs (request_id, counterparty_ids) values (v_req, v_ids);
  return jsonb_build_object('ok', true, 'phase', 'fire', 'request_id', v_req, 'counterparties_sent', jsonb_array_length(v_payload));
end;
$function$;
