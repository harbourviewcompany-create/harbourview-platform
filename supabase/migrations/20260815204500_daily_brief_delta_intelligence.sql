-- Daily Brief delta-intelligence foundation.
--
-- Preserves the existing signal_digest_canonical_links / signals_for_digest
-- presentation dedup layer and adds cross-edition event lineage, candidate
-- assessments and presentation history. The nightly writer now classifies
-- every candidate as new_event, material_advancement or unchanged_duplicate
-- before publication. Only the first two states may enter daily_digest.

create table if not exists public.digest_event_lineage (
  event_key text primary key,
  root_event_key text not null,
  latest_signal_id text references public.signals(id) on delete set null,
  prior_event_key text null,
  jurisdiction text not null default 'Global',
  entities jsonb not null default '[]'::jsonb,
  priority_domain text not null default 'other',
  verified_facts jsonb not null default '[]'::jsonb,
  inferences jsonb not null default '[]'::jsonb,
  competitive_position_change boolean not null default false,
  competitive_position_detail text null,
  latest_advancement_reason text null,
  first_presented_on date not null default current_date,
  last_presented_on date not null default current_date,
  presentation_count integer not null default 1 check (presentation_count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint digest_event_lineage_priority_domain_check check (
    priority_domain in (
      'global_medical', 'import_export_eu_gmp', 'm_and_a', 'licensing_regulatory',
      'commercial_distribution', 'genetics', 'formulations',
      'pharmaceutical_cannabinoid_technology', 'other'
    )
  )
);

create table if not exists public.digest_candidate_assessments (
  id bigint generated always as identity primary key,
  digest_date date not null,
  signal_id text not null references public.signals(id) on delete cascade,
  event_key text not null,
  prior_event_key text null,
  delta_status text not null,
  advancement_reason text null,
  jurisdiction text not null default 'Global',
  entities jsonb not null default '[]'::jsonb,
  priority_domain text not null default 'other',
  verified_facts jsonb not null default '[]'::jsonb,
  inferences jsonb not null default '[]'::jsonb,
  competitive_position_change boolean not null default false,
  competitive_position_detail text null,
  include_in_edition boolean not null default false,
  assessed_at timestamptz not null default now(),
  constraint digest_candidate_assessments_delta_status_check check (
    delta_status in ('new_event', 'material_advancement', 'unchanged_duplicate')
  ),
  constraint digest_candidate_assessments_priority_domain_check check (
    priority_domain in (
      'global_medical', 'import_export_eu_gmp', 'm_and_a', 'licensing_regulatory',
      'commercial_distribution', 'genetics', 'formulations',
      'pharmaceutical_cannabinoid_technology', 'other'
    )
  ),
  constraint digest_candidate_assessments_unique_signal_day unique (digest_date, signal_id)
);

create table if not exists public.digest_presentation_history (
  id bigint generated always as identity primary key,
  digest_date date not null,
  signal_id text not null references public.signals(id) on delete restrict,
  event_key text not null,
  prior_event_key text null,
  delta_status text not null,
  advancement_reason text null,
  headline text not null,
  why_it_matters text not null,
  jurisdiction text not null default 'Global',
  entities jsonb not null default '[]'::jsonb,
  priority_domain text not null default 'other',
  verified_facts jsonb not null default '[]'::jsonb,
  inferences jsonb not null default '[]'::jsonb,
  competitive_position_change boolean not null default false,
  competitive_position_detail text null,
  presented_at timestamptz not null default now(),
  constraint digest_presentation_history_delta_status_check check (
    delta_status in ('new_event', 'material_advancement')
  ),
  constraint digest_presentation_history_one_event_per_edition unique (digest_date, event_key)
);

create index if not exists idx_digest_candidate_assessments_signal
  on public.digest_candidate_assessments(signal_id, assessed_at desc);
create index if not exists idx_digest_candidate_assessments_event
  on public.digest_candidate_assessments(event_key, assessed_at desc);
create index if not exists idx_digest_presentation_history_event
  on public.digest_presentation_history(event_key, digest_date desc);
create index if not exists idx_digest_presentation_history_domain
  on public.digest_presentation_history(priority_domain, digest_date desc);

comment on table public.digest_event_lineage is
  'Private cross-edition event registry for Daily Brief novelty/material-advancement decisions.';
comment on table public.digest_candidate_assessments is
  'Private per-candidate Daily Brief delta classification. Underlying source signals remain unchanged.';
comment on table public.digest_presentation_history is
  'Private immutable-style record of events actually presented in each Daily Brief edition.';

alter table public.digest_event_lineage enable row level security;
alter table public.digest_candidate_assessments enable row level security;
alter table public.digest_presentation_history enable row level security;

revoke all on table public.digest_event_lineage from anon, authenticated;
revoke all on table public.digest_candidate_assessments from anon, authenticated;
revoke all on table public.digest_presentation_history from anon, authenticated;
grant all on table public.digest_event_lineage to service_role;
grant all on table public.digest_candidate_assessments to service_role;
grant all on table public.digest_presentation_history to service_role;

create or replace function public._digest_priority_domain(p_title text, p_summary text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(eu[- ]?gmp|good manufacturing practice|import permit|export permit|importer|exporter|cross-border|market access)'
      then 'import_export_eu_gmp'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(acquir|takeover|merger|m&a|strategic transaction|buyout|bid for)'
      then 'm_and_a'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(licen[cs]|regulat|gazette|rulemaking|reschedul|permit|authorization)'
      then 'licensing_regulatory'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(medical cannabis|medical marijuana|patient access|prescrib|pharmac|clinic)'
      then 'global_medical'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(distribution|wholesale|dispensar|retail channel|direct-to-consumer|showcase|marketplace)'
      then 'commercial_distribution'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(genetic|genomic|allele|cultivar|breeding|thcas|cbdas|germplasm)'
      then 'genetics'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(formulation|delivery system|rapid[- ]?onset|soft chew|capsule|pharmacokinetic)'
      then 'formulations'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(pharmaceutical cannabinoid|drug delivery|clinical-stage cannabinoid|cannabinoid medicine|nabiximols|cannabidiol drug)'
      then 'pharmaceutical_cannabinoid_technology'
    else 'other'
  end;
$$;

create or replace function public._digest_priority_weight(p_domain text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case p_domain
    when 'import_export_eu_gmp' then 24
    when 'm_and_a' then 22
    when 'global_medical' then 20
    when 'licensing_regulatory' then 18
    when 'pharmaceutical_cannabinoid_technology' then 18
    when 'commercial_distribution' then 15
    when 'formulations' then 15
    when 'genetics' then 14
    else 0
  end;
$$;

revoke all on function public._digest_priority_domain(text,text) from public, anon, authenticated;
revoke all on function public._digest_priority_weight(text) from public, anon, authenticated;
grant execute on function public._digest_priority_domain(text,text) to service_role;
grant execute on function public._digest_priority_weight(text) to service_role;

create or replace function public.run_daily_digest()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_openai_key text;
  v_anthropic_key text;
  v_gemini_key text;
  v_payload jsonb;
  v_signal_ids text[];
  v_provider text := null;
  v_attempts int;
  v_failures int;
  v_pre text := $prompt$
You are the senior editor of Harbourview Daily, a B2B regulated-cannabis market-intelligence briefing.

You receive a JSON object with:
- candidates: quality-gated, representative, canonically deduplicated signals not previously assessed for Daily Brief presentation;
- prior_presentations: previously presented real-world events and their latest material state.

You MUST classify EVERY candidate against prior_presentations as exactly one of:
- new_event: a genuinely new real-world event not already presented;
- material_advancement: the same event/event-lineage was presented before, but a new verified development materially changes commercial, regulatory, technical or competitive consequences;
- unchanged_duplicate: the candidate only repeats, paraphrases, corroborates or comments on what Harbourview already presented without a material change.

Only new_event and material_advancement may be included in the edition. For a material_advancement, set prior_event_key to the prior event it advances and explain exactly what changed. Multiple source articles about the same event or same advancement must share one event_key; set include=false for all but the strongest representative candidate. Corroborating sources remain evidence, not separate presentation records.

Priority domains are:
global_medical, import_export_eu_gmp, m_and_a, licensing_regulatory, commercial_distribution, genetics, formulations, pharmaceutical_cannabinoid_technology, other.
Use the candidate priority_domain_hint unless the evidence clearly supports a better domain. Prioritize the named domains without excluding a genuinely higher-impact development classified as other.

For every candidate return one JSON object with ALL fields below:
{
  "signal_id": string,
  "event_key": string,
  "prior_event_key": string|null,
  "delta_status": "new_event"|"material_advancement"|"unchanged_duplicate",
  "include": boolean,
  "headline": string,
  "why_it_matters": string,
  "market": string,
  "jurisdiction": string,
  "entities": string[],
  "priority_domain": string,
  "verified_facts": string[],
  "inferences": string[],
  "advancement_reason": string|null,
  "competitive_position_change": boolean,
  "competitive_position_detail": string|null,
  "priority_score": number
}

Rules:
- Ground verified_facts only in supplied candidate evidence.
- Put analytical deductions only in inferences; never present an inference as verified fact.
- competitive_position_change is true only when the new development changes the strategic/commercial position of a major operator; name the operator and change in competitive_position_detail.
- For unchanged_duplicate, include=false.
- Select at most 10 include=true candidates, ordered internally by commercial importance; still return classifications for every candidate.
- Do not invent entities, licences, GMP status, transaction status, approvals, dates or financial figures.
- Headline max 110 characters. why_it_matters should be one concise commercial sentence.
Return ONLY the JSON array.
$prompt$;
begin
  if exists (
    select 1 from daily_digest
    where digest_date = current_date
      and headlines is not null and jsonb_array_length(headlines) > 0
  ) then
    return jsonb_build_object('ok',true,'skipped','digest exists for today');
  end if;

  update _digest_jobs j set collected = true
  where j.digest_date = current_date and not j.collected
    and j.created_at < now() - interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id = j.request_id);

  perform 1 from _digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    with resp as (
      select j.request_id, j.signal_ids, j.provider, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as llm_text
      from _digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(llm_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    valid as (
      select * from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    classified as (
      select
        v.request_id,
        v.signal_ids,
        v.provider,
        e as item,
        e->>'signal_id' as signal_id,
        coalesce(nullif(e->>'event_key',''), e->>'signal_id') as event_key,
        nullif(e->>'prior_event_key','') as prior_event_key,
        e->>'delta_status' as delta_status,
        lower(coalesce(e->>'include','false')) = 'true' as include_in_edition,
        coalesce(nullif(e->>'market',''), nullif(e->>'jurisdiction',''), 'Global') as jurisdiction,
        coalesce(nullif(e->>'priority_domain',''), 'other') as priority_domain,
        case
          when coalesce(e->>'priority_score','') ~ '^-?[0-9]+([.][0-9]+)?$'
            then (e->>'priority_score')::numeric
          else 0
        end as priority_score
      from valid v
      cross join lateral jsonb_array_elements(v.p) e
      where e->>'signal_id' = any(v.signal_ids)
        and e->>'delta_status' in ('new_event','material_advancement','unchanged_duplicate')
    ),
    assessment_write as (
      insert into public.digest_candidate_assessments (
        digest_date, signal_id, event_key, prior_event_key, delta_status,
        advancement_reason, jurisdiction, entities, priority_domain,
        verified_facts, inferences, competitive_position_change,
        competitive_position_detail, include_in_edition
      )
      select
        current_date,
        c.signal_id,
        c.event_key,
        c.prior_event_key,
        c.delta_status,
        nullif(c.item->>'advancement_reason',''),
        c.jurisdiction,
        case when jsonb_typeof(c.item->'entities')='array' then c.item->'entities' else '[]'::jsonb end,
        case when c.priority_domain in (
          'global_medical','import_export_eu_gmp','m_and_a','licensing_regulatory',
          'commercial_distribution','genetics','formulations','pharmaceutical_cannabinoid_technology','other'
        ) then c.priority_domain else 'other' end,
        case when jsonb_typeof(c.item->'verified_facts')='array' then c.item->'verified_facts' else '[]'::jsonb end,
        case when jsonb_typeof(c.item->'inferences')='array' then c.item->'inferences' else '[]'::jsonb end,
        lower(coalesce(c.item->>'competitive_position_change','false')) = 'true',
        nullif(c.item->>'competitive_position_detail',''),
        c.include_in_edition and c.delta_status in ('new_event','material_advancement')
      from classified c
      on conflict (digest_date, signal_id) do update set
        event_key = excluded.event_key,
        prior_event_key = excluded.prior_event_key,
        delta_status = excluded.delta_status,
        advancement_reason = excluded.advancement_reason,
        jurisdiction = excluded.jurisdiction,
        entities = excluded.entities,
        priority_domain = excluded.priority_domain,
        verified_facts = excluded.verified_facts,
        inferences = excluded.inferences,
        competitive_position_change = excluded.competitive_position_change,
        competitive_position_detail = excluded.competitive_position_detail,
        include_in_edition = excluded.include_in_edition,
        assessed_at = now()
      returning signal_id
    ),
    ranked as (
      select c.*,
             row_number() over (partition by c.event_key order by c.priority_score desc, c.signal_id) as event_rn
      from classified c
      where c.include_in_edition is true
        and c.delta_status in ('new_event','material_advancement')
    ),
    selected as (
      select * from ranked where event_rn = 1
      order by priority_score desc, signal_id
      limit 10
    ),
    public_payload as (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'headline', left(coalesce(nullif(s.item->>'headline',''), 'Untitled'), 110),
          'why_it_matters', coalesce(s.item->>'why_it_matters',''),
          'market', s.jurisdiction,
          'jurisdiction', s.jurisdiction,
          'signal_id', s.signal_id,
          'event_key', s.event_key,
          'prior_event_key', s.prior_event_key,
          'delta_status', s.delta_status,
          'advancement_reason', nullif(s.item->>'advancement_reason',''),
          'entities', case when jsonb_typeof(s.item->'entities')='array' then s.item->'entities' else '[]'::jsonb end,
          'priority_domain', case when s.priority_domain in (
            'global_medical','import_export_eu_gmp','m_and_a','licensing_regulatory',
            'commercial_distribution','genetics','formulations','pharmaceutical_cannabinoid_technology','other'
          ) then s.priority_domain else 'other' end,
          'verified_facts', case when jsonb_typeof(s.item->'verified_facts')='array' then s.item->'verified_facts' else '[]'::jsonb end,
          'inferences', case when jsonb_typeof(s.item->'inferences')='array' then s.item->'inferences' else '[]'::jsonb end,
          'competitive_position_change', lower(coalesce(s.item->>'competitive_position_change','false')) = 'true',
          'competitive_position_detail', nullif(s.item->>'competitive_position_detail','')
        ) order by s.priority_score desc, s.signal_id
      ), '[]'::jsonb) as payload
      from selected s
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets, status, generated_at)
      select current_date, p.payload,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(p.payload) h),
        'published', now()
      from public_payload p
      where jsonb_array_length(p.payload) > 0
      on conflict (digest_date) do update
        set headlines = excluded.headlines,
            markets = (select coalesce(array_agg(distinct m), '{}') from unnest(daily_digest.markets || excluded.markets) m),
            status = 'published',
            updated_at = now()
      returning id
    ),
    presentation_write as (
      insert into public.digest_presentation_history (
        digest_date, signal_id, event_key, prior_event_key, delta_status,
        advancement_reason, headline, why_it_matters, jurisdiction, entities,
        priority_domain, verified_facts, inferences, competitive_position_change,
        competitive_position_detail
      )
      select
        current_date,
        s.signal_id,
        s.event_key,
        s.prior_event_key,
        s.delta_status,
        nullif(s.item->>'advancement_reason',''),
        left(coalesce(nullif(s.item->>'headline',''), 'Untitled'),110),
        coalesce(s.item->>'why_it_matters',''),
        s.jurisdiction,
        case when jsonb_typeof(s.item->'entities')='array' then s.item->'entities' else '[]'::jsonb end,
        case when s.priority_domain in (
          'global_medical','import_export_eu_gmp','m_and_a','licensing_regulatory',
          'commercial_distribution','genetics','formulations','pharmaceutical_cannabinoid_technology','other'
        ) then s.priority_domain else 'other' end,
        case when jsonb_typeof(s.item->'verified_facts')='array' then s.item->'verified_facts' else '[]'::jsonb end,
        case when jsonb_typeof(s.item->'inferences')='array' then s.item->'inferences' else '[]'::jsonb end,
        lower(coalesce(s.item->>'competitive_position_change','false')) = 'true',
        nullif(s.item->>'competitive_position_detail','')
      from selected s
      where exists (select 1 from ins)
      on conflict (digest_date, event_key) do nothing
      returning *
    ),
    lineage_write as (
      insert into public.digest_event_lineage (
        event_key, root_event_key, latest_signal_id, prior_event_key, jurisdiction,
        entities, priority_domain, verified_facts, inferences,
        competitive_position_change, competitive_position_detail,
        latest_advancement_reason, first_presented_on, last_presented_on,
        presentation_count
      )
      select
        p.event_key,
        coalesce((select root_event_key from public.digest_event_lineage where event_key = p.prior_event_key), p.prior_event_key, p.event_key),
        p.signal_id,
        p.prior_event_key,
        p.jurisdiction,
        p.entities,
        p.priority_domain,
        p.verified_facts,
        p.inferences,
        p.competitive_position_change,
        p.competitive_position_detail,
        p.advancement_reason,
        current_date,
        current_date,
        1
      from presentation_write p
      on conflict (event_key) do update set
        latest_signal_id = excluded.latest_signal_id,
        prior_event_key = coalesce(excluded.prior_event_key, digest_event_lineage.prior_event_key),
        jurisdiction = excluded.jurisdiction,
        entities = excluded.entities,
        priority_domain = excluded.priority_domain,
        verified_facts = excluded.verified_facts,
        inferences = excluded.inferences,
        competitive_position_change = excluded.competitive_position_change,
        competitive_position_detail = excluded.competitive_position_detail,
        latest_advancement_reason = excluded.latest_advancement_reason,
        last_presented_on = excluded.last_presented_on,
        presentation_count = digest_event_lineage.presentation_count + 1,
        updated_at = now()
      returning event_key
    ),
    mark_used as (
      update public.signals s set used_in_digest_at = now()
      where s.id in (select signal_id from presentation_write)
      returning s.id
    ),
    mark_collected as (
      update _digest_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object(
      'ok', true,
      'phase', 'collect',
      'provider', (select provider from parsed),
      'published', exists(select 1 from ins),
      'classified', (select count(*) from assessment_write),
      'presented', (select count(*) from presentation_write),
      'unchanged_suppressed', (
        select count(*) from classified where delta_status='unchanged_duplicate'
      ),
      'source', 'pipeline_b_delta'
    )
    into v_payload;

    return coalesce(v_payload, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_openai_key is null and v_anthropic_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no openai_api_key, anthropic_api_key or gemini_api_key in vault');
  end if;

  with base as (
    select
      s.id,
      coalesce(nullif(trim(s.title_en), ''), nullif(trim(s.headline), ''), d.title, 'Untitled') as title,
      coalesce(nullif(trim(s.summary_en), ''), nullif(trim(s.summary), ''), d.summary, '') as summary,
      coalesce(nullif(trim(s.country), ''), nullif(trim(d.market), ''), 'Global') as market,
      coalesce(s.content_type, d.type, 'regulatory') as content_type,
      coalesce(s.impact, 'medium') as impact,
      coalesce(s.quality_confidence, 0)::numeric as qc,
      s.cluster_rep_id,
      s.lang_detected,
      coalesce(s.date, s.created_at::date) as signal_date,
      s.created_at,
      coalesce(l.canonical_signal_id, s.cluster_rep_id, s.id) as event_key_hint,
      public._digest_priority_domain(
        coalesce(nullif(trim(s.title_en), ''), nullif(trim(s.headline), ''), d.title),
        coalesce(nullif(trim(s.summary_en), ''), nullif(trim(s.summary), ''), d.summary)
      ) as priority_domain_hint
    from public.signals_for_digest d
    join public.signals s on s.id = d.id
    left join public.signal_digest_canonical_links l on l.duplicate_signal_id = s.id
    where d.source_table = 'signals'
      and s.reviewed is true
      and s.used_in_digest_at is null
      and not exists (
        select 1 from public.digest_candidate_assessments a where a.signal_id = s.id
      )
      and coalesce(s.date, s.created_at::date) > current_date - 14
  ),
  scored as (
    select
      b.*,
      public._digest_cluster_size(b.cluster_rep_id) as corroboration_count,
      public._digest_rank_score(
        b.qc,
        b.impact,
        b.content_type,
        public._digest_cluster_size(b.cluster_rep_id),
        b.id
      ) + public._digest_priority_weight(b.priority_domain_hint) as rank_score
    from base b
  ),
  diversified as (
    select *
    from (
      select sc.*,
        row_number() over (
          partition by lower(sc.market)
          order by sc.rank_score desc, sc.signal_date desc
        ) as country_rn
      from scored sc
    ) x
    where country_rn <= 3
  ),
  top_n as (
    select * from diversified
    order by rank_score desc, signal_date desc
    limit 24
  ),
  candidate_payload as (
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'event_key_hint', t.event_key_hint,
        'title', left(t.title,200),
        'summary', left(t.summary,900),
        'market', t.market,
        'jurisdiction', t.market,
        'type', t.content_type,
        'impact', t.impact,
        'confidence', least(100, greatest(0, round(t.qc * 100)::int)),
        'corroboration_count', t.corroboration_count,
        'priority_domain_hint', t.priority_domain_hint,
        'detected_at', t.signal_date
      ) order by t.rank_score desc
    ), '[]'::jsonb) as candidates,
    array_agg(t.id order by t.rank_score desc) as ids
    from top_n t
  ),
  prior_payload as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'event_key', p.event_key,
      'prior_event_key', p.prior_event_key,
      'delta_status', p.delta_status,
      'headline', p.headline,
      'why_it_matters', p.why_it_matters,
      'jurisdiction', p.jurisdiction,
      'entities', p.entities,
      'priority_domain', p.priority_domain,
      'verified_facts', p.verified_facts,
      'inferences', p.inferences,
      'competitive_position_change', p.competitive_position_change,
      'competitive_position_detail', p.competitive_position_detail,
      'digest_date', p.digest_date
    ) order by p.digest_date desc, p.id desc), '[]'::jsonb) as history
    from (
      select * from public.digest_presentation_history
      order by digest_date desc, id desc
      limit 250
    ) p
  )
  select jsonb_build_object(
      'candidates', c.candidates,
      'prior_presentations', h.history
    ), c.ids
  into v_payload, v_signal_ids
  from candidate_payload c cross join prior_payload h;

  if v_payload is null
     or jsonb_array_length(coalesce(v_payload->'candidates','[]'::jsonb)) = 0 then
    return jsonb_build_object(
      'ok', true,
      'skipped', 'no unassessed representative digest candidates in last 14 days',
      'available', 0,
      'source', 'pipeline_b_delta'
    );
  end if;

  if v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (
      select request_id from _digest_jobs
      where provider = 'openai' and created_at > now() - interval '2 hours'
      order by created_at desc limit 10
    ) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0)=0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;

  if v_provider is null and v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (
      select request_id from _digest_jobs
      where provider = 'anthropic' and created_at > now() - interval '2 hours'
      order by created_at desc limit 10
    ) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0)=0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'anthropic'; end if;
  end if;

  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (
      select request_id from _digest_jobs
      where provider = 'gemini' and created_at > now() - interval '2 hours'
      order by created_at desc limit 10
    ) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0)=0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'gemini'; end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values (
      'daily_digest', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object(
        'available_signals', jsonb_array_length(v_payload->'candidates'),
        'source', 'pipeline_b_delta'
      )
    )
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object(
      'ok',true,'degraded',true,'reason','all_configured_llm_providers_degraded',
      'available',jsonb_array_length(v_payload->'candidates'),'source','pipeline_b_delta'
    );
  end if;

  if v_provider = 'openai' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object(
          'model','gpt-4o-mini','max_tokens',7000,'temperature',0,
          'messages',jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content',v_payload::text)
          )
        ), timeout_milliseconds := 90000
      ), current_date, v_signal_ids, 'openai'
    );
  elsif v_provider = 'anthropic' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key',v_anthropic_key,'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object(
          'model','claude-haiku-4-5-20251001','max_tokens',7000,
          'messages',jsonb_build_array(jsonb_build_object('role','user','content',v_pre||E'\n\nINPUT:\n'||v_payload::text))
        ), timeout_milliseconds := 90000
      ), current_date, v_signal_ids, 'anthropic'
    );
  else
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key',v_gemini_key,'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction',jsonb_build_object('parts',jsonb_build_array(jsonb_build_object('text',v_pre))),
          'contents',jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text',v_payload::text)))),
          'generationConfig',jsonb_build_object('temperature',0,'maxOutputTokens',7000)
        ), timeout_milliseconds := 90000
      ), current_date, v_signal_ids, 'gemini'
    );
  end if;

  return jsonb_build_object(
    'ok',true,'phase','fire','provider',v_provider,
    'signals_sent',jsonb_array_length(v_payload->'candidates'),
    'prior_events_compared',jsonb_array_length(v_payload->'prior_presentations'),
    'source','pipeline_b_delta','ranking','feedback_priority_delta_aware'
  );
end;
$function$;

revoke all on function public.run_daily_digest() from public, anon, authenticated;
grant execute on function public.run_daily_digest() to service_role;

comment on function public.run_daily_digest() is
  'Daily Brief writer with representative/canonical dedup, cross-edition delta classification, priority-domain weighting and durable presentation history.';
