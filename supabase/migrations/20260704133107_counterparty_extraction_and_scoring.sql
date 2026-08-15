-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260704133107.
--
-- Rewriting this file cannot affect production: 20260704133107 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

alter table ia_signals add column if not exists counterparty_extracted_at timestamptz;

create table if not exists _counterparty_jobs (
  request_id bigint primary key,
  signal_ids text[] not null,
  collected boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.run_signal_counterparty_extraction()
returns jsonb
language plpgsql
security definer
set search_path to 'public','net','vault','extensions'
as $function$
declare
  v_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_req bigint;
  v_inserted int := 0;
  v_pre text := 'You extract named commercial counterparties from cannabis industry intelligence signals for a B2B relationship-memory system. Below is a JSON array of qualified signals. For each signal that names a SPECIFIC company, brand, or named regulator/agency (not a generic unnamed reference), extract one counterparty record. Classify role as exactly one of: buyer, seller, importer, distributor, supplier, consultant, equipment_vendor, packaging_supplier, logistics_provider, market_access_partner (use market_access_partner for named regulators/agencies). Skip signals with no clearly named entity — most signals should be skipped. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"name": string, "role": string, "market": string, "category": string (short tag e.g. licensing, enforcement, market_entry, supply), "signal_id": string}. If none qualify, return [].';
begin
  -- COLLECT phase
  perform 1 from _counterparty_jobs j where not j.collected;
  if found then
    update _counterparty_jobs j set collected = true
    where not j.collected and j.created_at < now() - interval '1 hour'
      and not exists (select 1 from net._http_response r where r.id = j.request_id);

    with resp as (
      select j.request_id, j.signal_ids,
             (r.content::jsonb -> 'content' -> 0 ->> 'text') as claude_text,
             r.status_code
      from _counterparty_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, signal_ids, p from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array'
    ),
    extracted as (
      select
        'rm-' || md5(lower(trim(h->>'name'))) as id,
        trim(h->>'name') as name,
        coalesce(h->>'role','buyer') as role,
        coalesce(h->>'market','Global') as market,
        coalesce(h->>'category','general') as category
      from ok, jsonb_array_elements(ok.p) h
      where coalesce(h->>'name','') <> ''
    ),
    ins as (
      insert into ia_counterparties (id, name, role, markets, categories, interaction_count, introduction_count, documentation_status, last_interaction, notes)
      select id, name, role, array[market], array[category], 1, 0, 'missing', current_date,
             'Auto-extracted from a qualified intelligence signal — review and enrich.'
      from extracted
      on conflict (id) do update set
        markets           = (select array_agg(distinct m) from unnest(ia_counterparties.markets || excluded.markets) m),
        categories        = (select array_agg(distinct c) from unnest(ia_counterparties.categories || excluded.categories) c),
        interaction_count = ia_counterparties.interaction_count + 1,
        last_interaction  = greatest(ia_counterparties.last_interaction, excluded.last_interaction),
        updated_at        = now()
      returning 1
    ),
    mark_used as (
      update ia_signals s set counterparty_extracted_at = now()
      from ok o where s.id = any(o.signal_ids)
      returning 1
    ),
    done as (
      update _counterparty_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning 1
    )
    select count(*) from ins into v_inserted;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'counterparties_touched', coalesce(v_inserted,0));
  end if;

  -- FIRE phase
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'anthropic_api_key' limit 1;
  if v_key is null then return jsonb_build_object('ok', false, 'reason', 'anthropic_api_key not in vault'); end if;

  select jsonb_agg(jsonb_build_object('id', s.id, 'title', s.title, 'market', s.market, 'category', s.category, 'summary', s.summary)),
         array_agg(s.id)
  into v_signals, v_signal_ids
  from (
    select * from ia_signals
    where stage in ('qualified','converted_to_opportunity') and counterparty_extracted_at is null
    order by created_at desc
    limit 25
  ) s;

  if v_signals is null then
    return jsonb_build_object('ok', true, 'skipped', 'no unprocessed qualified signals');
  end if;

  v_req := net.http_post(
    url := 'https://api.anthropic.com/v1/messages',
    headers := jsonb_build_object('x-api-key', v_key, 'anthropic-version','2023-06-01','content-type','application/json'),
    body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',2000,
      'messages', jsonb_build_array(jsonb_build_object('role','user','content', v_pre || E'\n\nSIGNALS:\n' || v_signals::text))),
    timeout_milliseconds := 60000
  );

  insert into _counterparty_jobs (request_id, signal_ids) values (v_req, v_signal_ids);
  return jsonb_build_object('ok', true, 'phase', 'fire', 'request_id', v_req, 'signals_sent', jsonb_array_length(v_signals));
end;
$function$;

-- Deterministic scoring recompute — pure SQL, no LLM needed, safe to run often.
create or replace function public.sync_ia_scoring()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_count int;
begin
  with scored as (
    select
      id, name, role, interaction_count, introduction_count, documentation_status, last_interaction, markets,
      least(100, interaction_count * 15 + case documentation_status when 'complete' then 25 when 'partial' then 10 else 0 end) as fit,
      case documentation_status when 'complete' then 90 when 'partial' then 55 else 20 end as readiness,
      least(100, interaction_count * 10 + introduction_count * 15) as trust,
      coalesce(current_date - last_interaction, 999) as days_since
    from ia_counterparties
  )
  insert into ia_scoring_records (
    id, counterparty_id, counterparty_name, counterparty_role,
    fit_score, readiness_score, trust_score,
    routing_priority, follow_up_priority, introduction_priority,
    market_access_relevance, scored_at, score_drivers
  )
  select
    'sc-' || id, id, name, role,
    fit, readiness, trust,
    case when fit >= 70 then 'high' when fit >= 40 then 'medium' else 'low' end,
    case when interaction_count = 0 then 'dormant'
         when days_since <= 14 then 'urgent'
         when days_since <= 30 then 'soon'
         else 'when_ready' end,
    case when fit >= 70 and trust >= 60 then 'high'
         when fit >= 40 and trust >= 30 then 'medium'
         when fit > 0 then 'low'
         else 'not_ready' end,
    markets, current_date,
    array_remove(array[
      interaction_count || ' recorded interaction(s)',
      case documentation_status when 'complete' then 'documentation complete' when 'partial' then 'documentation partial' else null end,
      case when introduction_count > 0 then introduction_count || ' introduction(s) made' else null end
    ], null)
  from scored
  on conflict (id) do update set
    fit_score              = excluded.fit_score,
    readiness_score         = excluded.readiness_score,
    trust_score             = excluded.trust_score,
    routing_priority        = excluded.routing_priority,
    follow_up_priority      = excluded.follow_up_priority,
    introduction_priority   = excluded.introduction_priority,
    market_access_relevance = excluded.market_access_relevance,
    scored_at               = excluded.scored_at,
    score_drivers           = excluded.score_drivers,
    updated_at              = now();
  get diagnostics v_count = row_count;
  return jsonb_build_object('ok', true, 'scored', v_count);
end;
$function$;
