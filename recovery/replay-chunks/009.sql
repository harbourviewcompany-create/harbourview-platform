
-- RECOVERY BEGIN 20260705110551_country_intel_enrichment.sql
-- Restore the exact production-owned body for migration 20260705110551.
-- The previous stub omitted public._country_enrich_jobs, which
-- 20260713221555 alters, and the enrichment function it backs.

-- Deepens country_intel briefings using REAL captured signal data (ia_signals +
-- the mature signals table), not invented content. Only processes countries
-- that actually have real qualifying signal material -- the ~236 countries
-- with no cannabis program stay as-is (their current short summary is already
-- complete and accurate; there's nothing real to add).

alter table country_intel add column if not exists last_enriched_at timestamptz;

create table if not exists _country_enrich_jobs (
  request_id bigint primary key,
  country_codes text[] not null,
  collected boolean not null default false,
  created_at timestamptz not null default now()
);

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
  v_pre text := 'You are a cannabis regulatory intelligence editor for Harbourview, a B2B market intelligence platform. Below is a JSON array of countries, each with its current briefing and a set of REAL, recently-captured intelligence signals about that market. Using ONLY the facts in the provided signals (never invent facts, names, dates, or figures not present in the source material), write two things per country: (1) a richer "public_summary" (3-5 sentences, factual, no speculation, safe for a free public teaser page) and (2) a deeper "commercial_pathway_summary" (4-6 sentences, factual, covering licensing/market-entry/trade specifics found in the signals) for a paid subscriber briefing. If the signals do not support a claim, do not include it -- prefer being shorter and accurate over longer and speculative. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"country_code": string, "public_summary": string, "commercial_pathway_summary": string}.';
begin
  -- COLLECT phase
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
      )
    limit 8
  ),
  signal_material as (
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
        select jsonb_agg(jsonb_build_object('title', sg.title, 'summary', sg.summary))
        from (
          select title, summary from signals where country = t.country_name
          order by created_at desc limit 6
        ) sg
      ) as mature_material
    from targets t
  )
  select
    jsonb_agg(jsonb_build_object(
      'country_code', country_code, 'country_name', country_name,
      'current_public_summary', public_summary, 'current_commercial_pathway_summary', commercial_pathway_summary,
      'signals', coalesce(ia_material, '[]'::jsonb) || coalesce(mature_material, '[]'::jsonb)
    )),
    array_agg(country_code)
  into v_payload, v_countries
  from signal_material;

  if v_payload is null or jsonb_array_length(v_payload) = 0 then
    return jsonb_build_object('ok', true, 'skipped', 'no unenriched countries with real signal material');
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705110551','country_intel_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705110551_country_intel_enrichment.sql

-- RECOVERY BEGIN 20260705110626_fix_country_enrichment_signals_column.sql
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
-- version 20260705110626.
--
-- Rewriting this file cannot affect production: 20260705110626 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

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
  v_pre text := 'You are a cannabis regulatory intelligence editor for Harbourview, a B2B market intelligence platform. Below is a JSON array of countries, each with its current briefing and a set of REAL, recently-captured intelligence signals about that market. Using ONLY the facts in the provided signals (never invent facts, names, dates, or figures not present in the source material), write two things per country: (1) a richer "public_summary" (3-5 sentences, factual, no speculation, safe for a free public teaser page) and (2) a deeper "commercial_pathway_summary" (4-6 sentences, factual, covering licensing/market-entry/trade specifics found in the signals) for a paid subscriber briefing. If the signals do not support a claim, do not include it -- prefer being shorter and accurate over longer and speculative. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"country_code": string, "public_summary": string, "commercial_pathway_summary": string}.';
begin
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

  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'anthropic_api_key' limit 1;
  if v_key is null then return jsonb_build_object('ok', false, 'reason', 'anthropic_api_key not in vault'); end if;

  with targets as (
    select ci.country_code, ci.country_name, ci.public_summary, ci.commercial_pathway_summary
    from country_intel ci
    where ci.last_enriched_at is null
      and (
        exists (select 1 from ia_signals s where s.market = ci.country_name and s.stage in ('qualified','converted_to_opportunity'))
        or exists (select 1 from signals sg where sg.country = ci.country_name)
      )
    limit 8
  ),
  signal_material as (
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
      ) as mature_material
    from targets t
  )
  select
    jsonb_agg(jsonb_build_object(
      'country_code', country_code, 'country_name', country_name,
      'current_public_summary', public_summary, 'current_commercial_pathway_summary', commercial_pathway_summary,
      'signals', coalesce(ia_material, '[]'::jsonb) || coalesce(mature_material, '[]'::jsonb)
    )),
    array_agg(country_code)
  into v_payload, v_countries
  from signal_material;

  if v_payload is null or jsonb_array_length(v_payload) = 0 then
    return jsonb_build_object('ok', true, 'skipped', 'no unenriched countries with real signal material');
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705110626','fix_country_enrichment_signals_column','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705110626_fix_country_enrichment_signals_column.sql

-- RECOVERY BEGIN 20260705125854_jurisdiction_playbooks_stub_remaining_192.sql
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
)
SELECT
  v.iso2, v.name, 'moderate', 12,
  NULL, 'Pending research — no verified market-entry data yet.', '[]'::jsonb, '[]'::jsonb,
  '{}'::text[], 'draft', CURRENT_DATE
FROM (VALUES
('AF','Afghanistan'),('AL','Albania'),('DZ','Algeria'),('AD','Andorra'),('AO','Angola'),
('AG','Antigua and Barbuda'),('AR','Argentina'),('AM','Armenia'),('AT','Austria'),('AZ','Azerbaijan'),
('BS','Bahamas'),('BH','Bahrain'),('BD','Bangladesh'),('BB','Barbados'),('BY','Belarus'),
('BE','Belgium'),('BZ','Belize'),('BJ','Benin'),('BT','Bhutan'),('BO','Bolivia'),
('BA','Bosnia and Herzegovina'),('BW','Botswana'),('BN','Brunei'),('BG','Bulgaria'),('BF','Burkina Faso'),
('BI','Burundi'),('KH','Cambodia'),('CM','Cameroon'),('CV','Cape Verde'),('CF','Central African Republic'),
('TD','Chad'),('CL','Chile'),('CN','China'),('KM','Comoros'),('CR','Costa Rica'),
('CI','Cote d''Ivoire'),('HR','Croatia'),('CU','Cuba'),('CY','Cyprus'),('CD','Democratic Republic of the Congo'),
('DK','Denmark'),('DJ','Djibouti'),('DM','Dominica'),('DO','Dominican Republic'),('EC','Ecuador'),
('EG','Egypt'),('SV','El Salvador'),('GQ','Equatorial Guinea'),('ER','Eritrea'),('EE','Estonia'),
('SZ','Eswatini'),('ET','Ethiopia'),('FK','Falkland Islands'),('FO','Faroe Islands'),('FJ','Fiji'),
('FI','Finland'),('GA','Gabon'),('GM','Gambia'),('GE','Georgia'),('GH','Ghana'),
('GR','Greece'),('GL','Greenland'),('GD','Grenada'),('GT','Guatemala'),('GN','Guinea'),
('GW','Guinea-Bissau'),('GY','Guyana'),('HT','Haiti'),('VA','Holy See'),('HN','Honduras'),
('HK','Hong Kong'),('HU','Hungary'),('IS','Iceland'),('IN','India'),('ID','Indonesia'),
('IR','Iran'),('IQ','Iraq'),('IE','Ireland'),('IT','Italy'),('JM','Jamaica'),
('JP','Japan'),('JO','Jordan'),('KZ','Kazakhstan'),('KE','Kenya'),('KI','Kiribati'),
('XK','Kosovo'),('KW','Kuwait'),('KG','Kyrgyzstan'),('LA','Laos'),('LV','Latvia'),
('LB','Lebanon'),('LS','Lesotho'),('LR','Liberia'),('LY','Libya'),('LI','Liechtenstein'),
('LT','Lithuania'),('MG','Madagascar'),('MW','Malawi'),('MY','Malaysia'),('MV','Maldives'),
('ML','Mali'),('MH','Marshall Islands'),('MR','Mauritania'),('MU','Mauritius'),('FM','Micronesia'),
('MD','Moldova'),('MC','Monaco'),('MN','Mongolia'),('ME','Montenegro'),('MA','Morocco'),
('MZ','Mozambique'),('MM','Myanmar'),('NA','Namibia'),('NR','Nauru'),('NP','Nepal'),
('NI','Nicaragua'),('NE','Niger'),('NG','Nigeria'),('KP','North Korea'),('MK','North Macedonia'),
('NO','Norway'),('OM','Oman'),('PK','Pakistan'),('PW','Palau'),('PS','Palestine'),
('PA','Panama'),('PG','Papua New Guinea'),('PY','Paraguay'),('PE','Peru'),('PH','Philippines'),
('PR','Puerto Rico'),('QA','Qatar'),('CG','Republic of the Congo'),('RO','Romania'),('RU','Russia'),
('RW','Rwanda'),('KN','Saint Kitts and Nevis'),('LC','Saint Lucia'),('VC','Saint Vincent and the Grenadines'),('WS','Samoa'),
('SM','San Marino'),('ST','Sao Tome and Principe'),('SA','Saudi Arabia'),('SN','Senegal'),('RS','Serbia'),
('SC','Seychelles'),('SL','Sierra Leone'),('SG','Singapore'),('SK','Slovakia'),('SI','Slovenia'),
('SB','Solomon Islands'),('SO','Somalia'),('KR','South Korea'),('SS','South Sudan'),('LK','Sri Lanka'),
('SD','Sudan'),('SR','Suriname'),('SE','Sweden'),('SY','Syria'),('TW','Taiwan'),
('TJ','Tajikistan'),('TZ','Tanzania'),('TL','Timor-Leste'),('TG','Togo'),('TO','Tonga'),
('TT','Trinidad and Tobago'),('TN','Tunisia'),('TR','Türkiye'),('TM','Turkmenistan'),('TV','Tuvalu'),
('UG','Uganda'),('UA','Ukraine'),('AE','United Arab Emirates'),('UZ','Uzbekistan'),('VU','Vanuatu'),
('VE','Venezuela'),('VN','Vietnam'),('EH','Western Sahara'),('YE','Yemen'),('ZM','Zambia'),
('ZW','Zimbabwe')
) AS v(iso2, name)
ON CONFLICT (country_iso2) DO NOTHING;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705125854','jurisdiction_playbooks_stub_remaining_192','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705125854_jurisdiction_playbooks_stub_remaining_192.sql

-- RECOVERY BEGIN 20260705130012_jurisdiction_playbooks_stub_remaining_192.sql
-- Stub jurisdiction_playbooks rows for the 192 countries missing a playbook.
-- Previously only 11 countries (DE, AU, CA, IL, MT, UY, GB, NL, CO, TH, PT, US)
-- had seeded playbooks — every country must be covered equally, so the
-- remaining 192 get a draft stub flagged for research rather than silently
-- returning null. status='draft' keeps them hidden from
-- public_read_published_playbooks until reviewed and published.

INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
)
SELECT
  v.iso2, v.name, 'moderate', 12,
  NULL, 'Pending research — no verified market-entry data yet.', '[]'::jsonb, '[]'::jsonb,
  '{}'::text[], 'draft', CURRENT_DATE
FROM (VALUES
('AF','Afghanistan'),('AL','Albania'),('DZ','Algeria'),('AD','Andorra'),('AO','Angola'),
('AG','Antigua and Barbuda'),('AR','Argentina'),('AM','Armenia'),('AT','Austria'),('AZ','Azerbaijan'),
('BS','Bahamas'),('BH','Bahrain'),('BD','Bangladesh'),('BB','Barbados'),('BY','Belarus'),
('BE','Belgium'),('BZ','Belize'),('BJ','Benin'),('BT','Bhutan'),('BO','Bolivia'),
('BA','Bosnia and Herzegovina'),('BW','Botswana'),('BN','Brunei'),('BG','Bulgaria'),('BF','Burkina Faso'),
('BI','Burundi'),('KH','Cambodia'),('CM','Cameroon'),('CV','Cape Verde'),('CF','Central African Republic'),
('TD','Chad'),('CL','Chile'),('CN','China'),('KM','Comoros'),('CR','Costa Rica'),
('CI','Cote d''Ivoire'),('HR','Croatia'),('CU','Cuba'),('CY','Cyprus'),('CD','Democratic Republic of the Congo'),
('DK','Denmark'),('DJ','Djibouti'),('DM','Dominica'),('DO','Dominican Republic'),('EC','Ecuador'),
('EG','Egypt'),('SV','El Salvador'),('GQ','Equatorial Guinea'),('ER','Eritrea'),('EE','Estonia'),
('SZ','Eswatini'),('ET','Ethiopia'),('FK','Falkland Islands'),('FO','Faroe Islands'),('FJ','Fiji'),
('FI','Finland'),('GA','Gabon'),('GM','Gambia'),('GE','Georgia'),('GH','Ghana'),
('GR','Greece'),('GL','Greenland'),('GD','Grenada'),('GT','Guatemala'),('GN','Guinea'),
('GW','Guinea-Bissau'),('GY','Guyana'),('HT','Haiti'),('VA','Holy See'),('HN','Honduras'),
('HK','Hong Kong'),('HU','Hungary'),('IS','Iceland'),('IN','India'),('ID','Indonesia'),
('IR','Iran'),('IQ','Iraq'),('IE','Ireland'),('IT','Italy'),('JM','Jamaica'),
('JP','Japan'),('JO','Jordan'),('KZ','Kazakhstan'),('KE','Kenya'),('KI','Kiribati'),
('XK','Kosovo'),('KW','Kuwait'),('KG','Kyrgyzstan'),('LA','Laos'),('LV','Latvia'),
('LB','Lebanon'),('LS','Lesotho'),('LR','Liberia'),('LY','Libya'),('LI','Liechtenstein'),
('LT','Lithuania'),('MG','Madagascar'),('MW','Malawi'),('MY','Malaysia'),('MV','Maldives'),
('ML','Mali'),('MH','Marshall Islands'),('MR','Mauritania'),('MU','Mauritius'),('FM','Micronesia'),
('MD','Moldova'),('MC','Monaco'),('MN','Mongolia'),('ME','Montenegro'),('MA','Morocco'),
('MZ','Mozambique'),('MM','Myanmar'),('NA','Namibia'),('NR','Nauru'),('NP','Nepal'),
('NI','Nicaragua'),('NE','Niger'),('NG','Nigeria'),('KP','North Korea'),('MK','North Macedonia'),
('NO','Norway'),('OM','Oman'),('PK','Pakistan'),('PW','Palau'),('PS','Palestine'),
('PA','Panama'),('PG','Papua New Guinea'),('PY','Paraguay'),('PE','Peru'),('PH','Philippines'),
('PR','Puerto Rico'),('QA','Qatar'),('CG','Republic of the Congo'),('RO','Romania'),('RU','Russia'),
('RW','Rwanda'),('KN','Saint Kitts and Nevis'),('LC','Saint Lucia'),('VC','Saint Vincent and the Grenadines'),('WS','Samoa'),
('SM','San Marino'),('ST','Sao Tome and Principe'),('SA','Saudi Arabia'),('SN','Senegal'),('RS','Serbia'),
('SC','Seychelles'),('SL','Sierra Leone'),('SG','Singapore'),('SK','Slovakia'),('SI','Slovenia'),
('SB','Solomon Islands'),('SO','Somalia'),('KR','South Korea'),('SS','South Sudan'),('LK','Sri Lanka'),
('SD','Sudan'),('SR','Suriname'),('SE','Sweden'),('SY','Syria'),('TW','Taiwan'),
('TJ','Tajikistan'),('TZ','Tanzania'),('TL','Timor-Leste'),('TG','Togo'),('TO','Tonga'),
('TT','Trinidad and Tobago'),('TN','Tunisia'),('TR','Türkiye'),('TM','Turkmenistan'),('TV','Tuvalu'),
('UG','Uganda'),('UA','Ukraine'),('AE','United Arab Emirates'),('UZ','Uzbekistan'),('VU','Vanuatu'),
('VE','Venezuela'),('VN','Vietnam'),('EH','Western Sahara'),('YE','Yemen'),('ZM','Zambia'),
('ZW','Zimbabwe')
) AS v(iso2, name)
ON CONFLICT (country_iso2) DO NOTHING;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705130012','jurisdiction_playbooks_stub_remaining_192','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705130012_jurisdiction_playbooks_stub_remaining_192.sql

-- RECOVERY BEGIN 20260705130246_jurisdiction_playbooks_provenance_and_queue.sql
-- Provenance tracking, mirroring local_authorities' source_id/confidence_label/last_verified_at pattern.
ALTER TABLE public.jurisdiction_playbooks
  ADD COLUMN IF NOT EXISTS source_id uuid REFERENCES public.source_registry(id),
  ADD COLUMN IF NOT EXISTS confidence_label text,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;

-- Research queue, mirroring local_intel_research_queue's per-country tracking pattern.
CREATE TABLE IF NOT EXISTS public.jurisdiction_playbooks_research_queue (
  country_code        text PRIMARY KEY REFERENCES public.countries(iso_alpha2),
  country_name        text NOT NULL,
  region              text,
  subregion           text,
  queue_rank          integer,
  playbook_status     text NOT NULL DEFAULT 'unresearched'
                       CHECK (playbook_status IN ('unresearched','researching','published','needs_review')),
  last_researched_at  timestamptz,
  last_researched_by  text,
  research_notes      text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.jurisdiction_playbooks_research_queue (country_code, country_name, region, subregion, playbook_status)
SELECT c.iso_alpha2, c.country_name, c.region, c.subregion,
       CASE WHEN jp.status = 'published' THEN 'published' ELSE 'unresearched' END
FROM public.countries c
LEFT JOIN public.jurisdiction_playbooks jp ON jp.country_iso2 = c.iso_alpha2
ON CONFLICT (country_code) DO NOTHING;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705130246','jurisdiction_playbooks_provenance_and_queue','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705130246_jurisdiction_playbooks_provenance_and_queue.sql

-- RECOVERY BEGIN 20260705130500_jurisdiction_playbooks_provenance_and_queue.sql
-- Provenance tracking, mirroring local_authorities' source_id/confidence_label/last_verified_at pattern.
ALTER TABLE public.jurisdiction_playbooks
  ADD COLUMN IF NOT EXISTS source_id uuid REFERENCES public.source_registry(id),
  ADD COLUMN IF NOT EXISTS confidence_label text,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;

-- Research queue, mirroring local_intel_research_queue's per-country tracking pattern.
CREATE TABLE IF NOT EXISTS public.jurisdiction_playbooks_research_queue (
  country_code        text PRIMARY KEY REFERENCES public.countries(iso_alpha2),
  country_name        text NOT NULL,
  region              text,
  subregion           text,
  queue_rank          integer,
  playbook_status     text NOT NULL DEFAULT 'unresearched'
                       CHECK (playbook_status IN ('unresearched','researching','published','needs_review')),
  last_researched_at  timestamptz,
  last_researched_by  text,
  research_notes      text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.jurisdiction_playbooks_research_queue (country_code, country_name, region, subregion, playbook_status)
SELECT c.iso_alpha2, c.country_name, c.region, c.subregion,
       CASE WHEN jp.status = 'published' THEN 'published' ELSE 'unresearched' END
FROM public.countries c
LEFT JOIN public.jurisdiction_playbooks jp ON jp.country_iso2 = c.iso_alpha2
ON CONFLICT (country_code) DO NOTHING;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705130500','jurisdiction_playbooks_provenance_and_queue','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705130500_jurisdiction_playbooks_provenance_and_queue.sql

-- RECOVERY BEGIN 20260705131000_jurisdiction_playbooks_batch1_ar_in_ng.sql
-- Research batch 1 of jurisdiction_playbooks: Argentina, India, Nigeria.
-- Real, sourced content replacing the 'draft'/pending stub rows created in
-- 20260705130012_jurisdiction_playbooks_stub_remaining_192.sql.
-- Countries chosen deliberately to span regions (Latin America, South Asia,
-- West Africa) rather than defaulting to large/wealthy markets.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Harris Sliwoski Canna Law Blog — Argentina ARICCAME framework', 'https://harris-sliwoski.com/cannalawblog/argentinas-regulatory-framework-for-hemp-and-medical-cannabis/', 'Argentina', 'AR', 'Latin America', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'Law 27.669 / ARICCAME structure, licensing scope'),
  ('LegalClarity — Argentina REPROCANN and Resolution 1780/2025', 'https://legalclarity.org/drugs-in-argentina-laws-penalties-and-regulations/', 'Argentina', 'AR', 'Latin America', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'REPROCANN cultivation/possession limits post reform'),
  ('Lexology — General introduction to cannabis law in India', 'https://www.lexology.com/library/detail.aspx?g=988e0f27-70db-42bb-a35b-f11f01243a87', 'India', 'IN', 'South Asia', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'NDPS Act plant-part distinctions, FSSAI hemp standard'),
  ('IASPOINT — India cannabis laws state patchwork', 'https://iaspoint.com/indias-cannabis-laws-cultivation-use-and-legal-nuances/', 'India', 'IN', 'South Asia', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'State-level hemp licensing, bhang regulation variance'),
  ('LegalClarity — Legal status of marijuana in Nigeria', 'https://legalclarity.org/the-legal-status-of-marijuana-in-nigeria/', 'Nigeria', 'NG', 'West Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'NDLEA Act / Indian Hemp Act penalty structure'),
  ('Wikipedia — Drug policy of Nigeria', 'https://en.wikipedia.org/wiki/Drug_policy_of_Nigeria', 'Nigeria', 'NG', 'West Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'NDLEA Act statutory history')
ON CONFLICT DO NOTHING;

-- Argentina
UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high',
  typical_timeline_months = 18,
  estimated_cost_range = 'Varies by activity — self-cultivation registration is low-cost; commercial licensing under ARICCAME''s successor bodies is capital-intensive and currently in flux',
  legal_framework_summary = 'Medical cannabis has been legal since Law 27.350 (2017), expanded by Decree 883/2020 which created the REPROCANN patient registry. Law 27.669 (2022) established a commercial/industrial framework and created ARICCAME as regulator, later dissolved in 2025 with functions folded into health and agriculture ministries. Resolution 1780/2025 tightened REPROCANN eligibility and cultivation limits. Recreational use remains illegal; commercial high-THC pharmaceutical cultivation is largely still theoretical, with licensing concentrated in low-THC hemp fiber/grain.',
  steps = '[{"step":"Patient/self-cultivator route","detail":"Register via REPROCANN with a physician in the Federal Network of Health Professionals; self-cultivation permits run 3 years, org/research permits 1 year"},{"step":"Commercial/industrial route","detail":"Apply for licensing under Law 27.669 for import/export/cultivation/manufacture; currently administered across health and agriculture ministries following ARICCAME dissolution"},{"step":"Provincial engagement","detail":"Coordinate with provincial programs (e.g., Jujuy, Chaco, Santa Fe) which are currently ahead of national commercial infrastructure"}]'::jsonb,
  key_regulators = '["ANMAT (National Administration of Drugs, Foods and Medical Devices)","Ministry of Health","Ministry of Productive Development / Agriculture (post-ARICCAME)","RENPRE (chemical precursors)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming ARICCAME still exists as a standalone agency — it was dissolved in 2025 and its functions redistributed',
    'Registering high-THC pharmaceutical-grade cultivation, which remains largely unauthorized in practice despite the legal framework',
    'Missing REPROCANN renewal deadlines under the tightened Resolution 1780/2025 rules'
  ],
  status = 'published',
  last_reviewed = CURRENT_DATE,
  confidence_label = 'medium — regulatory structure in active transition (ARICCAME dissolution, 2025 REPROCANN reform)',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://harris-sliwoski.com/cannalawblog/argentinas-regulatory-framework-for-hemp-and-medical-cannabis/')
WHERE country_iso2 = 'AR';

-- India
UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high',
  typical_timeline_months = 24,
  estimated_cost_range = 'State-dependent; hemp cultivation licensing fees are modest but legal ambiguity raises effective compliance cost',
  legal_framework_summary = 'The NDPS Act 1985 criminalizes the cannabis "genus" nationally, but Section 10/14 lets state governments permit low-THC (<0.3%) cultivation for industrial/scientific purposes — a carve-out legal scholars flag as potentially ultra vires the parent Act. Ganja (flowering tops) and charas (resin) are prohibited; leaves and seeds are excluded from the NDPS cannabis definition, which is why bhang remains legal in several states under state excise law. Hemp food products are separately regulated by FSSAI (Standard 2.16: <=0.3% THC, <=75mg/kg CBD).',
  steps = '[{"step":"Confirm state-level authorization","detail":"Only a handful of states (Uttarakhand, Himachal Pradesh, Madhya Pradesh, UP) have active hemp cultivation licensing regimes"},{"step":"Apply through state agriculture/forestry department","detail":"Submit land records, character certificate, storage proof, and THC-compliance undertaking to the District Magistrate"},{"step":"FSSAI registration for food-category products","detail":"Hemp seed, seed oil, and flour require compliance with FSSAI Fifth Amendment Standard 2.16"},{"step":"Central Bureau of Narcotics clearance","detail":"Required for import of hemp-derived material sourced from an NDPS-scheduled origin"}]'::jsonb,
  key_regulators = '["Narcotics Control Bureau (NCB)","Central Bureau of Narcotics","FSSAI (Food Safety and Standards Authority of India)","State Excise Departments","State Agriculture/Forestry Departments"]'::jsonb,
  common_pitfalls = ARRAY[
    'Treating state hemp-cultivation rules as settled law — legal scholars argue the 0.3% THC carve-out has no basis in the NDPS Act''s genus-level definition and remains legally contested',
    'Assuming CBD is uniformly legal nationwide — it is not scheduled under NDPS but sits in a regulatory gray zone with no explicit central approval pathway',
    'Attempting inter-state transport of any cannabis-derived product without an NDPS narcotics transport license, even for products legally produced in-state'
  ],
  status = 'published',
  last_reviewed = CURRENT_DATE,
  confidence_label = 'medium — central law and state implementing rules are in active legal dispute',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.lexology.com/library/detail.aspx?g=988e0f27-70db-42bb-a35b-f11f01243a87')
WHERE country_iso2 = 'IN';

-- Nigeria
UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high',
  typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis in all forms — recreational, medical, and industrial hemp — is illegal in Nigeria. The Indian Hemp Act 1966 and the NDLEA Act (Cap N30, LFN 2004) make no distinction between low-THC hemp and drug-type cannabis; cultivation of any cannabis plant is a criminal offense. No licensing pathway, medical program, or hemp pilot exists at the federal level. Proposed legislative amendments to allow NDLEA-issued cultivation/production licenses have been introduced in the National Assembly but have not passed.',
  steps = '[]'::jsonb,
  key_regulators = '["NDLEA (National Drug Law Enforcement Agency)","NAFDAC (has not registered any hemp-derived product for retail)","Central Bank of Nigeria Trade and Exchange Department (cannabis items are FX-restricted)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming any distinction exists between industrial hemp and drug cannabis under Nigerian law — none does',
    'Relying on proposed legalization bills as a signal of imminent change — none have passed despite repeated introduction',
    'Attempting to import hemp-derived consumer products at commercial scale — Customs routinely refuses these even when small personal-use quantities are tolerated'
  ],
  status = 'published',
  last_reviewed = CURRENT_DATE,
  confidence_label = 'high — prohibition is unambiguous and consistently enforced',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://legalclarity.org/the-legal-status-of-marijuana-in-nigeria/')
WHERE country_iso2 = 'NG';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('AR','IN','NG');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705131000','jurisdiction_playbooks_batch1_ar_in_ng','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705131000_jurisdiction_playbooks_batch1_ar_in_ng.sql

-- RECOVERY BEGIN 20260705140000_jurisdiction_playbooks_batch2_af_al_dz_ad.sql
-- Research batch 2 of jurisdiction_playbooks: Afghanistan, Albania, Algeria, Andorra.
-- Real, sourced content replacing draft stub rows.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Wikipedia — Cannabis in Afghanistan', 'https://en.wikipedia.org/wiki/Cannabis_in_Afghanistan', 'Afghanistan', 'AF', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', 'Prohibition history, Taliban-era enforcement'),
  ('UNODC Sherloc — Afghanistan Law on Campaign Against Intoxicants', 'https://sherloc.unodc.org/cld/en/legislation/afg/law_on_campaign_against_intoxicants_drugs_and_their_control/chapter_iv/article_41-47/article_41-47.html', 'Afghanistan', 'AF', 'Asia', 1, 'html_snapshot', 'quarterly', 'primary_legislation', 'Official statutory penalty structure'),
  ('NACC (National Agency for Cannabis Control) — Albania Licensing', 'https://www.nacc.gov.al/en/licensing/', 'Albania', 'AL', 'Europe', 1, 'html_snapshot', 'monthly', 'regulator_official', 'Official regulator: license terms, fees, area caps'),
  ('Business of Cannabis — Albania green-lights cultivation', 'https://businessofcannabis.com/albania-officially-green-lights-medical-and-industrial-cannabis-cultivation/', 'Albania', 'AL', 'Europe', 2, 'html_snapshot', 'monthly', 'trade_press', 'Law 61/2023 passage, vote count, regulator creation'),
  ('Wikipedia — Cannabis in Algeria', 'https://en.wikipedia.org/wiki/Cannabis_in_Algeria', 'Algeria', 'DZ', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Law 04-18 / Decree 07-228 framework'),
  ('CannabisLaws.Global — Algeria', 'https://cannabislaws.global/algeria/', 'Algeria', 'DZ', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'CBD/THC non-distinction, no medical program in practice'),
  ('High Life Global — Is Cannabis Legal in Andorra 2026', 'https://hghlfglbl.com/legalization/is-cannabis-legal-in-andorra/', 'Andorra', 'AD', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Sativex-only cannabinoid protocol, penalty structure'),
  ('Andorra Insiders — Cannabis, Andorra, CBD, Marijuana Crops', 'https://andorrainsiders.com/en/cannabis-andorra-cbd-marijuana-crops/', 'Andorra', 'AD', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Draft cultivation law status, CBD cosmetic-only pathway')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis cultivation, possession, and trafficking are illegal under the Counter Narcotics Drug Law of 2005, with penalties ranging from fines and short prison terms for small personal amounts up to 10-20 years or life imprisonment for large-scale cultivation, and the death penalty theoretically available for trafficking. Since the Taliban retook power in 2021, cannabis and hemp cultivation have been reaffirmed as banned nationwide, with enforcement under Sharia-based penalties including corporal punishment for violators. Despite this, Afghanistan remains the world''s largest producer of cannabis resin (hashish), and a 2021 Taliban-announced agreement with a German pharmaceutical firm to build an export-only medical cannabis facility has not translated into any domestic legal pathway.',
  steps = '[]'::jsonb,
  key_regulators = '["Taliban Ministry of Interior / counter-narcotics enforcement (not internationally recognized as a governing authority by most states)","UNODC (monitoring only, no domestic regulatory role)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Treating the 2021 Taliban-Cpharm export agreement as an active legal pathway — it has not materialized into licensing or operations',
    'Assuming international recognition issues with the Taliban government create ambiguity in enforcement — domestic penalties are applied regardless',
    'No distinction exists between hemp and drug-type cannabis under Afghan law — low-THC cultivation is equally prohibited'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — prohibition is unambiguous and consistently documented, though the governing authority itself is unrecognized by most states',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Afghanistan')
WHERE country_iso2 = 'AF';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 24,
  estimated_cost_range = 'Medical license: minimum ~100 million lek (~€1M) capital requirement plus non-refundable ALL 100,000 application fee, annual fee of 1.5% of turnover (floor €100,000) after year 3. Industrial hemp: lower barrier, minimum 1-hectare plot, 5-year permit.',
  legal_framework_summary = 'Law No. 61/2023 (passed July 2023, 69-23 vote) legalized licensed cultivation and processing of cannabis for medical and industrial purposes, but strictly for export — there is no domestic patient access, retail, or consumer market. The National Agency for Cannabis Control (NACC), under the Ministry of Health, issues 15-year medical licenses (5-10 hectare units, 200-hectare national cap) requiring applicants to show 3 years of OECD-market cannabis experience. Industrial hemp is rolled out through designated cadastral zones (first approved March 2025 in Shkodra/Malësi e Madhe) under 5-year permits, with a notably high 0.8% THC ceiling. Recreational and domestic medical use remain criminal offenses under Criminal Code Article 283, carrying 5-10 years imprisonment.',
  steps = '[{"step":"Confirm export-only scope","detail":"No license type permits domestic sale, prescription, or retail — plan for 100% export from the outset"},{"step":"Meet licensing bar","detail":"Demonstrate 3 years of cannabis production/cultivation experience in an OECD country; capitalize at ~€1M+ for medical license"},{"step":"Apply via NACC","detail":"Submit application with ALL 100,000 non-refundable fee; medical license runs 15 years, reassessed every 3 years"},{"step":"Build to security spec","detail":"Outdoor sites require 4m+ concrete perimeter walls, barbed wire, 24/7 CCTV directly accessible to regulator, alarm links to local police"},{"step":"Industrial hemp alternative","detail":"Apply for a plot within a designated cadastral zone (Shkodra/Malësi e Madhe as of 2025); 5-year permit, 1+ hectare minimum, 0.8% THC ceiling"}]'::jsonb,
  key_regulators = '["National Agency for Cannabis Control (NACC) — primary regulator","Ministry of Health and Social Protection","Ministry of Agriculture and Rural Development (industrial hemp)","Albanian State Police"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming licensed cultivation means a domestic market exists — the entire regime is export-only with zero in-country retail or patient access',
    'Underestimating the OECD-experience and capital requirements, which are deliberately structured to favor established foreign operators over domestic entrants',
    'Confusing the licensed export framework with broader legalization — unlicensed possession, use, or cultivation remains criminal under Article 283'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated by the NACC''s own official licensing page plus multiple independent trade-press sources on the 2023 law and 2025 hemp-zone rollout',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.nacc.gov.al/en/licensing/')
WHERE country_iso2 = 'AL';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no functioning legal market-entry pathway exists',
  legal_framework_summary = 'Cultivation, commerce, and possession of cannabis are prohibited under Law No. 04-18 (2004) and enforcement Decree No. 07-228 (2007), except for narrow case-by-case medical or research use pre-authorized by the Minister of Health. A 2020 Prime Ministerial decree set procedural rules for any such cannabinoid prescriptions — capped at 3-month outpatient scripts, weekly renewal for hospitalized patients, dispensing restricted to hospital pharmacies — but this framework functions rarely in practice and does not amount to an accessible medical program. Algerian law draws no distinction between CBD and THC, and industrial hemp cultivation is not permitted.',
  steps = '[]'::jsonb,
  key_regulators = '["Ministry of Health (sole authority for rare case-by-case medical/research authorization)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Treating the Minister of Health medical exception as an operating program — approvals are rare, ad hoc, and hospital-pharmacy-only, not a commercial pathway',
    'Assuming CBD is treated differently from THC — Algerian law makes no such distinction, so CBD is equally prohibited',
    'Assuming low-THC hemp is a viable workaround — industrial hemp cultivation is not legally permitted'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently documented across reference and legal-analysis sources with no conflicting claims',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Algeria')
WHERE country_iso2 = 'DZ';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal for both recreational and medical use under the Andorran Penal Code (Article 284); personal possession can carry up to 12 months imprisonment and a ~€1,200 fine, rising to 2 years and ~€1,800 for public use, with trafficking/cultivation treated as more serious offenses. The only cannabinoid pathway is a narrow government protocol permitting prescription of Sativex for spasticity treatment — not a general medical cannabis program. A 2021 research initiative and a 2022 government-commissioned draft cultivation law have not resulted in passed legislation as of 2026. CBD exists in a legal gray area: it can only be sold as an EU-approved, foreign-manufactured cosmetic product, since Andorra is outside the EU and has no domestic CBD statute.',
  steps = '[]'::jsonb,
  key_regulators = '["Govern d''Andorra (cannabinoid prescription protocol)","Police Cos d''Andorra","Ministry of Health"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming proximity to Spain/France cannabis tolerance carries over — Andorra enforces strict prohibition independent of neighboring policy',
    'Treating the narrow Sativex/spasticity protocol as a general medical cannabis program — it is not, and there is no broader patient-access route',
    'Selling CBD without confirming EU manufacture/approval — domestically produced or unapproved CBD product has no legal basis and remains a gray-zone risk'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistent across government-protocol references and independent legal guides; a 2022-commissioned draft cultivation law remains unpassed with no update found',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://hghlfglbl.com/legalization/is-cannabis-legal-in-andorra/')
WHERE country_iso2 = 'AD';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('AF','AL','DZ','AD');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705140000','jurisdiction_playbooks_batch2_af_al_dz_ad','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705140000_jurisdiction_playbooks_batch2_af_al_dz_ad.sql

-- RECOVERY BEGIN 20260705150000_jurisdiction_playbooks_batch3_ao_ag_am_at.sql
-- Research batch 3 of jurisdiction_playbooks: Angola, Antigua and Barbuda, Armenia, Austria.
-- Real, sourced content replacing draft stub rows.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Wikipedia — Cannabis in Angola', 'https://en.wikipedia.org/wiki/Cannabis_in_Angola', 'Angola', 'AO', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Law 3/99, no medical program, UN CND 2022 reaffirmation'),
  ('CannabisRegulations.ai — Angola CBD', 'https://www.cannabisregulations.ai/country-legality/angola-cbd', 'Angola', 'AO', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'ARMED non-approval, customs seizure practice'),
  ('US Dept of State — 2023 Intl Religious Freedom Report: Antigua and Barbuda', 'https://www.state.gov/reports/2023-report-on-international-religious-freedom/antigua-and-barbuda/', 'Antigua and Barbuda', 'AG', 'Caribbean', 1, 'html_snapshot', 'quarterly', 'government_official', '2018 Cannabis Act thresholds, 2023 Rastafari/Hindu religious license'),
  ('Tripbase — Antigua and Barbuda drug laws 2026', 'https://www.tripbase.com/drug-laws/antigua-and-barbuda/', 'Antigua and Barbuda', 'AG', 'Caribbean', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Current possession/cultivation thresholds, MCA role'),
  ('Wikipedia — Cannabis in Armenia', 'https://en.wikipedia.org/wiki/Cannabis_in_Armenia', 'Armenia', 'AM', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', '2021 industrial hemp legalization, no personal/medical pathway'),
  ('Raw Organics EU — Is CBD legal in Armenia', 'https://www.raworganics.eu/en-us/blogs/news/is-cbd-legal-in-armenia', 'Armenia', 'AM', 'Asia', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Hemp license terms: 10yr, THC cap, tonnage caps'),
  ('CMS Expert Guides — Cannabis law and legislation in Austria', 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/austria', 'Austria', 'AT', 'Europe', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Law firm expert guide: SMG framework, medical/CBD/cosmetics rules'),
  ('Cannabis Europa — Is cannabis legal in Austria 2026 business guide', 'https://cannabis-europa.com/insights/is-cannabis-legal-in-austria/', 'Austria', 'AT', 'Europe', 2, 'html_snapshot', 'quarterly', 'trade_press', 'Medical channel scope, no adult-use reform in progress')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cultivation, sale, possession, and consumption of cannabis are prohibited under Angolan drug law (Law No. 3/99), with no medical marijuana program in place. CBD is not explicitly addressed by separate legislation, but in practice the medicines regulator ARMED has not approved any cannabinoid product and customs authorities seize CBD imports at ports of entry. Enforcement of personal-use offenses is reportedly inconsistent despite the formal illegality, and cannabis remains Angola''s most widely cultivated illicit cash crop. Angola explicitly reaffirmed its prohibitionist stance at the UN Commission on Narcotic Drugs in 2022, even as neighboring Zimbabwe and Zambia have moved toward legalization.',
  steps = '[]'::jsonb,
  key_regulators = '["Ministry of Health","ARMED (medicines regulatory agency) — has not approved any cannabinoid product","AGT Customs (seizes CBD/cannabis imports at ports of entry)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming inconsistent street-level enforcement signals tolerance for any commercial activity — no legal commercial pathway exists regardless of enforcement patterns',
    'Assuming CBD is treated separately from THC — ARMED has approved no cannabinoid product and customs seizes CBD shipments the same as any cannabis product',
    'Assuming regional liberalization momentum (South Africa, Zimbabwe, Zambia) signals imminent Angolan reform — Angola explicitly reaffirmed prohibition at the 2022 UN CND'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently documented across reference and legal-analysis sources with no conflicting claims',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Angola')
WHERE country_iso2 = 'AO';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 18,
  estimated_cost_range = 'Personal possession/cultivation carries no licensing cost (15g/4-plant household threshold). Rastafari/Hindu religious cultivation license fees are waived by government policy. Commercial medical cultivation licensing fees via the Medicinal Cannabis Authority are not publicly standardized.',
  legal_framework_summary = 'The Cannabis Act, passed November 2018, decriminalized personal possession (currently applied at up to 15 grams) and home cultivation (up to 4 plants per household) for adults 18+, and established the Medicinal Cannabis Authority (MCA) to license medical cultivation, processing, and distribution. In 2023 the government extended sacramental cultivation and use rights to Rastafari and Hindu practitioners via a special religious license, permitting cultivation and use within a private dwelling or approved place of worship (with transport between the two), and waived licensing fees for Rastafari-owned operations — though this religious license explicitly excludes any commercial or financial transaction. There is no general legal retail market: sale outside licensed or religious channels and public consumption remain offenses, and importing cannabis into the country — even if legally obtained elsewhere — remains illegal.',
  steps = '[{"step":"Personal-use route","detail":"Adults 18+ may possess up to 15g and cultivate up to 4 plants per household without criminal prosecution"},{"step":"Religious/Rastafari or Hindu route","detail":"Apply for a special religious cultivation/use license; permits cultivation and use within a private dwelling or approved place of worship and transport between the two; commercial transactions explicitly excluded; fees waived for Rastafari-owned operations"},{"step":"Medical/commercial route","detail":"Apply to the Medicinal Cannabis Authority (MCA) for cultivation, processing, or distribution licensing"}]'::jsonb,
  key_regulators = '["Medicinal Cannabis Authority (MCA)","Royal Police Force of Antigua and Barbuda"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming decriminalization equals a legal commercial retail market — none exists; sale outside licensed channels remains illegal',
    'Assuming the Rastafari/Hindu religious license permits commercial activity — it explicitly excludes any commercial or financial transaction',
    'Bringing cannabis into the country from abroad — importation is illegal regardless of the domestic decriminalization framework'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated by the US State Department''s official religious-freedom reporting plus multiple independent news sources on the 2018 Act and 2023 religious licensing',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.state.gov/reports/2023-report-on-international-religious-freedom/antigua-and-barbuda/')
WHERE country_iso2 = 'AG';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 12,
  estimated_cost_range = 'Not applicable for personal, recreational, or medical use — no legal pathway exists. Industrial hemp: license issued by the Ministry of Health for a 10-year term (renewable); production capped at 20,000 tons of hemp flower and 20,000 tons of CBD oil annually per licensee.',
  legal_framework_summary = 'All cannabis use, possession, cultivation, and sale for personal, recreational, or medical purposes remains illegal and criminally prosecuted in Armenia, with no medical marijuana program despite past legislative discussion. In 2021, Armenia legalized industrial hemp production, manufacturing, sale, and export exclusively under a Ministry of Health license (10-year renewable term), requiring THC content below 0.3% and capping annual output at 20,000 tons of hemp flower and 20,000 tons of CBD oil per licensee, with growers required to report expected CBD levels before production. The industrial hemp law does not explicitly legalize CBD oil for consumer sale, and CBD/THC products are separately treated as illegal for import and possession — travelers have reportedly been denied entry for carrying CBD or THC products.',
  steps = '[{"step":"Industrial hemp license","detail":"Apply to the Ministry of Health for a 10-year hemp production/export license; THC must stay below 0.3%; annual production capped at 20,000 tons flower and 20,000 tons CBD oil"},{"step":"Pre-production compliance reporting","detail":"Licensees must report expected CBD levels to authorities before production begins"}]'::jsonb,
  key_regulators = '["Ministry of Health of the Republic of Armenia (hemp licensing authority)","Ministry of Economy (industrial hemp policy origin)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the 2021 industrial hemp law creates any personal, medical, or CBD-consumption legality — it covers licensed industrial production/export only',
    'Traveling with CBD or THC products — Armenia does not distinguish CBD from THC for import/possession purposes and travelers have been denied entry over this',
    'Assuming personal use is decriminalized — Armenia''s Ministry of Health explicitly confirmed in 2019 there were no plans to decriminalize despite public rumors'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across Wikipedia, industry legal-analysis sources, and a news.am report citing the US Embassy Yerevan',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Armenia')
WHERE country_iso2 = 'AM';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 12,
  estimated_cost_range = 'Hemp/CBD retail entry is relatively low-cost (certified seed sourcing, standard business registration). Medical/pharmaceutical-channel cultivation is restricted solely to AGES (the state health/food-safety agency) — no private domestic cultivation license is available for that channel.',
  legal_framework_summary = 'Recreational cannabis remains illegal under the Suchtmittelgesetz (Narcotic Substances Act, SMG, 1998), though small-quantity possession has been handled administratively rather than criminally since 2016. Medical cannabis has been legal since 2008 but only in a narrow pharmaceutical form: doctors may prescribe finished medicines — Sativex, pharmacy-compounded dronabinol, nabilone, and Epidyolex — but cannabis flower itself is not an authorized dispensing format, and AGES (Austrian Agency for Health and Food Safety) is the sole entity permitted to cultivate cannabis domestically for pharmaceutical use. Industrial hemp cultivation is legal for EU Common Catalogue varieties at or below 0.3% THC, and CBD products are widely sold but must be marketed as "aroma" or "technical" products rather than food or medicine under EU Novel Food rules. A 2025 Supreme Administrative Court ruling, codified into law in December 2025, reclassifies low-THC smokable hemp flower as a tobacco-monopoly product — from 2029 it may be sold only through licensed tobacconists (Trafiken), not ordinary hemp/CBD shops.',
  steps = '[{"step":"Hemp/CBD route","detail":"Source certified EU Common Catalogue seed varieties (<=0.3% THC); market CBD strictly as an aroma/technical product, not food or supplement, per EU Novel Food restrictions"},{"step":"Medical/pharma route","detail":"Obtain Austrian Trade Act production authorization from the Federal Ministry of Health for any cannabis-based pharmaceutical activity; note domestic flower cultivation for this channel is restricted solely to AGES"},{"step":"Plan for 2029 smokable-hemp transition","detail":"Once the Tobacco Monopoly Act amendment takes effect, low-THC smokable hemp flower must be sourced from approved wholesalers and sold exclusively through licensed tobacconists"}]'::jsonb,
  key_regulators = '["Federal Ministry of Health (medical/narcotics authorization)","AGES — Austrian Agency for Health and Food Safety (sole authorized domestic cultivator for pharmaceutical-channel cannabis)","Federal Ministry of Justice (SMG enforcement)","Tobacco Monopoly Administration (smokable hemp flower from 2029)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming Austria mirrors Germany''s flower-prescription medical model — it does not; only finished pharmaceutical products are prescribable, and flower is not an authorized dispensing format',
    'Marketing CBD as a food supplement or medicine — Austrian and EU Novel Food rules restrict this to aroma/technical product labeling only',
    'Planning smokable hemp flower retail through ordinary CBD shops after 2029 — the amended Tobacco Monopoly Act channels this exclusively through licensed tobacconists'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — well corroborated across a law firm expert guide (CMS), independent trade-press analysis, and Wikipedia; one lower-quality source claimed broader flower-prescription reforms that could not be corroborated and was disregarded',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/austria')
WHERE country_iso2 = 'AT';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('AO','AG','AM','AT');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705150000','jurisdiction_playbooks_batch3_ao_ag_am_at','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705150000_jurisdiction_playbooks_batch3_ao_ag_am_at.sql

-- RECOVERY BEGIN 20260705160000_jurisdiction_playbooks_batch4_az_bs_bh_bd.sql
-- Research batch 4 of jurisdiction_playbooks: Azerbaijan, Bahamas, Bahrain, Bangladesh.
-- Bahamas is flagged 'needs_review' (draft, not published) rather than auto-published:
-- three sources directly conflict on whether the governing Cannabis Act/Bill has
-- actually been enacted (2023 per Wikipedia, assented July 2024 per two sources,
-- still not enacted as of May 2026 per another). Requires human verification
-- against the official Bahamas government legislation gazette.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Wikipedia — Cannabis in Azerbaijan', 'https://en.wikipedia.org/wiki/Cannabis_in_Azerbaijan', 'Azerbaijan', 'AZ', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', '1998 Law on Narcotic Drugs, cultivation extent, penalty structure'),
  ('CannabisLaws.Global — Azerbaijan', 'https://cannabislaws.global/azerbaijan/', 'Azerbaijan', 'AZ', 'Asia', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Small-quantity non-prosecution practice, no CBD distinction'),
  ('CannaCarib — Cannabis in the Bahamas 2026', 'https://www.cannacarib.net/bahamas/', 'Bahamas', 'BS', 'Caribbean', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'Reports Cannabis Bill 2024 as introduced but NOT enacted as of May 2026 — conflicts with other sources'),
  ('Herb.co — How to Buy Weed in the Bahamas 2026', 'https://herb.co/city-guides/buy-weed-bahamas', 'Bahamas', 'BS', 'Caribbean', 2, 'html_snapshot', 'monthly', 'trade_press', 'Reports Cannabis Act 2024 assented July 26 2024 but not fully operationalized — conflicts with cannacarib.net'),
  ('Wikipedia — Cannabis in the Bahamas', 'https://en.wikipedia.org/wiki/Cannabis_in_the_Bahamas', 'Bahamas', 'BS', 'Caribbean', 2, 'html_snapshot', 'monthly', 'reference', 'States Cannabis Bill enacted 2023 — third conflicting version of enactment timeline'),
  ('Wikipedia — Cannabis in Bahrain', 'https://en.wikipedia.org/wiki/Cannabis_in_Bahrain', 'Bahrain', 'BH', 'Middle East', 2, 'html_snapshot', 'quarterly', 'reference', 'Prohibition confirmed, case example of 2014 conviction'),
  ('Leafwell — Is Marijuana Legal in Bahrain', 'https://leafwell.com/blog/is-marijuana-legal-in-bahrain', 'Bahrain', 'BH', 'Middle East', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Law 15/2007 penalty structure detail'),
  ('Wikipedia — Cannabis in Bangladesh', 'https://en.wikipedia.org/wiki/Cannabis_in_Bangladesh', 'Bangladesh', 'BD', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', 'Narcotics Control Act 2018, death penalty threshold, cultivation regions')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Sale, use, possession, and cultivation of cannabis are illegal under the 1998 Law on Narcotic Drugs, Psychotropic Substances, and Precursors, with no medical program in place. In practice, possession of small amounts (sources cite thresholds between roughly 2.5 and 10 grams) is often treated as personal use and handled through family referral for addiction treatment rather than criminal prosecution, but cultivation or possession above that threshold is prosecuted as trafficking, carrying penalties up to 8 years imprisonment for cultivation and up to 12 years for possession of over 1,000 grams. CBD is treated identically to THC with no cannabinoid distinction, so it is equally illegal, and state-authorized cultivation is limited strictly to experimental medical product samples under direct government control.',
  steps = '[]'::jsonb,
  key_regulators = '["Ministry of Internal Affairs","State Customs Committee"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming small-amount non-prosecution equals formal decriminalization or legality — it is prosecutorial discretion, not a legal exemption',
    'Assuming CBD is treated differently from THC — Azerbaijani law makes no such distinction',
    'Assuming the state-authorized experimental medical cultivation exception signals an emerging program — it is narrow, government-controlled, and not accessible to private entities'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently documented across reference and legal-analysis sources with no conflicting claims',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Azerbaijan')
WHERE country_iso2 = 'AZ';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 12,
  estimated_cost_range = 'Unresolved — dependent on which legislative status is accurate (see confidence note); if the Cannabis Act 2024 framework is confirmed in force, import/export licenses were reported at $10,000 each with 100% Bahamian ownership required for cultivation/sales/transport licenses',
  legal_framework_summary = 'Bahamian cannabis law is in a confirmed state of legislative flux with directly conflicting reports as of mid-2026. Some 2026 sources state a Cannabis Act 2024 received formal assent on July 26, 2024, establishing a $250 fixed-penalty framework for possession under 30 grams, legalizing medical and religious use, and creating the Bahamas Cannabis Authority — but report that implementing/commencement regulations have not been fully operationalized, so on-the-ground enforcement under the older Dangerous Drugs Act (a criminal offense carrying up to $125,000 in fines or 10 years imprisonment) reportedly continued through at least September 2025. A separate May 2026 source instead describes an equivalent "Cannabis Bill 2024" as merely introduced and not yet enacted. Wikipedia states a Cannabis Bill was already enacted in 2023 alongside amendments removing "Indian Hemp" from the Dangerous Drugs Act. Given this direct three-way conflict on whether the governing law has actually passed, this entry requires human verification against the official Bahamian government legislation gazette before being treated as authoritative.',
  steps = '[]'::jsonb,
  key_regulators = '["Bahamas Cannabis Authority (proposed/established per some sources; licensing platform reportedly built but not accepting applications)","Royal Bahamas Police Force","Ministry of Agriculture (cultivation zoning)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Relying on any single source for current Bahamian cannabis legal status — sources actively conflict on whether the governing Act has passed at all',
    'Assuming the $250 fixed-penalty framework is currently enforced — multiple 2026 sources report enforcement still followed the older criminal Dangerous Drugs Act as of late 2025',
    'Assuming licensing is open — the Cannabis Authority''s platform is reported as built but not yet accepting applications'
  ],
  status = 'draft', last_reviewed = CURRENT_DATE,
  confidence_label = 'medium — conflicting 2026 sources disagree on whether the governing Cannabis Act/Bill has been enacted; flagged for human verification against the official Bahamas legislation gazette',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.cannacarib.net/bahamas/')
WHERE country_iso2 = 'BS';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is classified as a Schedule I narcotic under Law No. 15 of 2007, with no legal pathway for recreational or medical use and no distinction drawn between CBD and THC. Bahrain applies among the harshest penalty structures in the world for cannabis offenses: fines of up to BD 50,000, life imprisonment, or the death penalty for trafficking-scale possession or distribution, with stiffer penalties for repeat offenders and public officials. As a GCC member, Bahrain enforces a zero-tolerance drug policy with heavily monitored borders and active anti-trafficking cooperation with the UNODC since 2014; even CBD-containing skincare products can be treated as illicit.',
  steps = '[]'::jsonb,
  key_regulators = '["Ministry of Interior (narcotics enforcement)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming Bahrain''s relatively liberal regional reputation in other areas extends to drug policy — cannabis enforcement is among the strictest in the world',
    'Assuming CBD-only products are exempt — Bahraini law makes no distinction from THC-containing cannabis, and even skincare products have been treated as illicit',
    'Carrying any cannabis-derived product across the border, including for prescribed medical use elsewhere — enforcement applies regardless of intent or THC content'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently documented across reference, legal-analysis, and legal-directory sources with no conflicting claims',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Bahrain')
WHERE country_iso2 = 'BH';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cultivation, transport, sale, purchase, and possession of cannabis in all forms have been illegal in Bangladesh since 1989, currently governed by the Narcotics Control Act 2018, which gives courts discretionary power to impose the death penalty for possession over 2 kilograms. CBD is not legally distinguished from cannabis and is equally illegal. Despite this strict statutory framework, enforcement is reported to be lax in practice, and Bangladesh remains a notable cultivator in specific districts (Naogaon, Rajshahi, Jamalpur, Netrokona, and Chittagong Hill Tract areas near Cox''s Bazaar), with cannabis retaining deep cultural and traditional roots, including at the annual Lalon Shah folk festival in Kushtia.',
  steps = '[]'::jsonb,
  key_regulators = '["Department of Narcotics Control","Bangladesh Police"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming lax on-the-ground enforcement signals tolerance for any commercial activity — no legal pathway exists and the 2018 Act permits the death penalty for larger quantities',
    'Assuming CBD is treated separately from THC — Bangladeshi law makes no such distinction',
    'Confusing cultural or traditional tolerance at specific events or in specific communities with legal permission — cultivation, sale, and possession remain criminal offenses nationwide'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently documented across reference and legal-analysis sources with no conflicting claims',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Bangladesh')
WHERE country_iso2 = 'BD';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('AZ','BH','BD');

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'needs_review', last_researched_at = now(), last_researched_by = 'claude-agent',
    research_notes = 'Three sources conflict on whether the Cannabis Act/Bill has actually been enacted (2023 per Wikipedia, assented July 2024 per two sources, still not enacted as of May 2026 per another). Needs verification against official Bahamas government gazette.'
WHERE country_code = 'BS';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705160000','jurisdiction_playbooks_batch4_az_bs_bh_bd','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705160000_jurisdiction_playbooks_batch4_az_bs_bh_bd.sql

-- RECOVERY BEGIN 20260705165137_add_dossier_drive_file_id.sql
-- Adds Google Drive as an alternate (additive, not replacing) storage
-- backend for dossier files, alongside the existing storage_bucket/
-- file_path columns for Supabase Storage. A dossier can be backed by
-- either — the app checks drive_file_id first, falling back to
-- storage_bucket/file_path if unset. See lib/google/driveClient.ts.

alter table public.dossiers
  add column if not exists drive_file_id text;

comment on column public.dossiers.drive_file_id is 'Google Drive file ID (from the file''s share URL: drive.google.com/file/d/FILE_ID/view). File must be shared with the service account configured in GOOGLE_SERVICE_ACCOUNT_JSON_B64.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705165137','add_dossier_drive_file_id','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705165137_add_dossier_drive_file_id.sql

-- RECOVERY BEGIN 20260705170000_jurisdiction_playbooks_batch5_bb_by_be_bz.sql
-- Research batch 5 of jurisdiction_playbooks: Barbados, Belarus, Belgium, Belize.
-- Real, sourced content replacing draft stub rows.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('BMCLA — Barbados Medicinal Cannabis Licensing Authority (official)', 'https://www.bmcla.bb/', 'Barbados', 'BB', 'Caribbean', 1, 'html_snapshot', 'monthly', 'regulator_official', 'Official regulator: licensing structure, dispensing rules, National Drug Formulary'),
  ('MJBizDaily — Barbados medical cannabis law clears final hurdle', 'https://mjbizdaily.com/barbados-medical-cannabis-law-clears-final-hurdle-in-parliament/', 'Barbados', 'BB', 'Caribbean', 2, 'html_snapshot', 'monthly', 'trade_press', '2019 Act passage detail, ownership/residency requirements, tier structure'),
  ('Wikipedia — Cannabis in Belarus', 'https://en.wikipedia.org/wiki/Cannabis_in_Belarus', 'Belarus', 'BY', 'Europe', 2, 'html_snapshot', 'quarterly', 'reference', '2016 industrial hemp ban, prohibition scope'),
  ('Leafwell — Is Marijuana Legal in Belarus', 'https://leafwell.com/blog/is-marijuana-legal-in-belarus', 'Belarus', 'BY', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Documented 2021 foreign-cardholder arrest case, penalty structure'),
  ('FAMHP — Medicines and products based on cannabis or CBD (official)', 'https://www.famhp.be/en/human_use/particular_products/specially_reglemented_substances/narcotics_psychotropics/frequently', 'Belgium', 'BE', 'Europe', 1, 'html_snapshot', 'monthly', 'regulator_official', 'Official regulator: Sativex/Epidyolex status, CBD compounding rules'),
  ('CMS Expert Guides — Cannabis law and legislation in Belgium', 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/belgium', 'Belgium', 'BE', 'Europe', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Law firm guide: magistral preparation THC exposure limits'),
  ('Cannabis Europa — Is cannabis legal in Belgium 2026 business guide', 'https://cannabis-europa.com/insights/is-cannabis-legal-in-belgium-a-2026-guide-for-businesses/', 'Belgium', 'BE', 'Europe', 2, 'html_snapshot', 'quarterly', 'trade_press', 'Social clubs grey zone, hemp permit regional authority structure'),
  ('Wikipedia — Cannabis in Belize', 'https://en.wikipedia.org/wiki/Cannabis_in_Belize', 'Belize', 'BZ', 'Caribbean', 2, 'html_snapshot', 'quarterly', 'reference', '2017 decriminalization amendment, 2022 legalization bill history'),
  ('DrugLawReform.info — Belize country profile', 'https://druglawreform.info/en/country-information/caribbean/belize.html', 'Belize', 'BZ', 'Caribbean', 2, 'html_snapshot', 'quarterly', 'ngo_policy_tracker', 'Original 2017 Senate/Governor General assent detail')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 12,
  estimated_cost_range = 'License categories tiered by scale: Tier 1 cultivation under 1 acre up to Tier 3 over 5 acres; application/renewal fees and compliance costs vary by tier and category (cultivation, processing, import/export, laboratory, retail distributor). Sacramental Rastafarian cultivation/use is exempt from commercial licensing fees.',
  legal_framework_summary = 'Recreational cannabis remains illegal, though small possession (up to 14 grams) is treated as a $200 fixed fine payable within 30 days rather than criminal prosecution. Medical use was legalized in November 2019 through the Medicinal Cannabis Industry Act (regulations following in 2020), establishing the Barbados Medicinal Cannabis Licensing Authority (BMCLA) to regulate cultivation, processing, dispensing, and export under an eight-category licensing structure covering microgrowers, importers, exporters, laboratories, and retail "therapeutic facility" distributors. A companion Sacramental Cannabis Act permits registered Rastafarians to cultivate and use cannabis as a religious sacrament. Five cannabis-based medicines are approved on the National Drug Formulary, dispensable only via prescription through a pharmacy or licensed therapeutic facility, capped at a 30-day supply per fill. The first licensed dispensary, Island Therapeutics Inc., opened in June 2025.',
  steps = '[{"step":"Apply online via BMCLA portal","detail":"Submit application through the official BMCLA portal selecting a license category (cultivation Tier 1-3, processing, import/export, laboratory, retail distributor, etc.)"},{"step":"Meet ownership/residency requirements","detail":"License holders must be Barbadian citizens, permanent residents, hold immigrant/investor status, or be a CARICOM member-state citizen"},{"step":"Comply with tiered cultivation limits","detail":"Tier 1 cultivation licenses are capped under 1 acre, Tier 2 covers 1-5 acres, Tier 3 allows over 5 acres"},{"step":"Retail via therapeutic facility license","detail":"A Retail Distributor License permits establishing a therapeutic facility where patients receive and consume prescribed medicinal cannabis on-site under professional supervision"}]'::jsonb,
  key_regulators = '["Barbados Medicinal Cannabis Licensing Authority (BMCLA)","Medicinal Cannabis Licensing Board","Ministry of Health and Wellness","Barbados Drug Service"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming recreational use is legal because a medical licensing regime exists — recreational cannabis remains illegal, with only small possession decriminalized to a fixed fine',
    'Assuming any foreign entity can hold a license — ownership is restricted to Barbadian citizens/residents/investors or CARICOM nationals',
    'Confusing the Sacramental Cannabis Act''s religious exemption with general legalization — it applies specifically to registered Rastafarian practitioners'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated directly by the official BMCLA regulator site plus independent trade press and Wikipedia',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.bmcla.bb/')
WHERE country_iso2 = 'BB';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'All cannabis use, possession, cultivation, and sale — for recreational or medical purposes — are illegal in Belarus, among the strictest drug regimes in Europe, with no distinction made between cannabis, hemp, and other narcotics under the Criminal Code. On December 31, 2016, Belarus extended its ban to cover cultivation of industrial hemp with THC content below 0.2%, closing off even the low-THC pathway available in most of Europe. Penalties are severe and draw little distinction between simple possession and trafficking, ranging from 5 to 25 years imprisonment; even small personal-use amounts have led to multi-year sentences, including a documented case of a foreign medical-cannabis-card holder arrested for carrying 2.5 grams. CBD is equally illegal, and as a non-EU state Belarus is not bound by the 2020 EU Court ruling that CBD is not a narcotic.',
  steps = '[]'::jsonb,
  key_regulators = '["Ministry of Internal Affairs of Belarus","State Border Committee"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming industrial hemp is a viable low-THC entry point — Belarus banned even sub-0.2% THC hemp cultivation in 2016, closing a pathway open in most of Europe',
    'Assuming a foreign medical cannabis card provides any protection — a documented 2021 case saw a foreign cardholder arrested and facing years in prison for a small personal quantity',
    'Assuming EU CBD rulings apply — Belarus is not an EU member and is not bound by the 2020 EU Court of Justice decision on CBD'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across reference and legal-analysis sources, including a specific documented enforcement case',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Belarus')
WHERE country_iso2 = 'BY';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 12,
  estimated_cost_range = 'Hemp cultivation requires a permit from the competent regional authority (Flanders/Wallonia/Brussels), modest cost. CBD magistral-preparation supply is restricted to a single FAMHP-authorized domestic supplier of pharmaceutical-grade CBD powder — a high barrier for that specific channel. Full pharmaceutical marketing authorization (as for Sativex/Epidyolex) is a major EMA/FAMHP undertaking.',
  legal_framework_summary = 'Recreational cannabis remains illegal under the 1921 Narcotics Act and a 2017 Royal Decree, but since a 2005 prosecutorial directive (revised 2015), adult possession of up to 3 grams or one cultivated plant without aggravating circumstances (public use, minors present, disturbance) is treated as the lowest police/prosecution priority — an administrative tolerance policy, not formal decriminalization or legalization; a police report is still filed and forwarded to the prosecutor. Medical cannabis access is tightly restricted to two EU-authorized pharmaceutical products — Sativex (a THC:CBD spray for MS spasticity) and Epidyolex (CBD, for severe epilepsy, though not currently marketed in Belgium) — dispensed only via hospital/public pharmacy on specialist prescription; whole-plant flower is not a dispensable medical format. Industrial hemp cultivation is legal under regional permit for EU Common Catalogue varieties at or below 0.3% THC, and CBD for external/cosmetic use is legal, but ingestible CBD (oils, edibles, food supplements) falls under EU Novel Food rules and remains commercially restricted; only one company is FAMHP-authorized to supply pharmaceutical-grade CBD powder for pharmacist compounding. Cannabis social clubs operate in a long-standing legal grey area — never formally recognized, occasionally subject to police closure, but often tolerated in practice.',
  steps = '[{"step":"Hemp/CBD cultivation route","detail":"Obtain a cultivation permit from the competent regional authority (Flanders, Wallonia, or Brussels) for EU Common Catalogue varieties at or below 0.3% THC"},{"step":"Medical/pharma route","detail":"Engage FAMHP for marketing authorization of any new cannabis-based medicine, or partner with the single FAMHP-authorized domestic CBD powder supplier for magistral pharmacy compounding"},{"step":"CBD retail route","detail":"Market CBD strictly for external/cosmetic use, or navigate EU Novel Food authorization for any ingestible CBD product"}]'::jsonb,
  key_regulators = '["Federal Agency for Medicines and Health Products (FAMHP/AFMPS/FAGG)","Federal Public Service Economy","Federal Agency for the Safety of the Food Chain (AFSCA/FAVV)","Regional authorities (Flanders/Wallonia/Brussels) for hemp cultivation permits","Police / College of Prosecutors General (tolerance-policy enforcement)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Mistaking the prosecution-priority tolerance policy for formal decriminalization or legalization — it is administrative discretion only, varies by district/officer, and a police report is still filed',
    'Assuming dried cannabis flower can be prescribed or imported for medical use — a 2015 Royal Decree makes flower non-dispensable in Belgium, so even valid foreign prescriptions for flower are not recognized for import',
    'Assuming any CBD product can be sold as a food/supplement — ingestible CBD falls under strict EU Novel Food authorization, distinct from the more permissive external-use/cosmetic category'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across the official FAMHP site, a law firm expert guide (CMS), trade-press business analysis, and multiple independent legal/travel guides',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.famhp.be/en/human_use/particular_products/specially_reglemented_substances/narcotics_psychotropics/frequently')
WHERE country_iso2 = 'BE';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 12,
  estimated_cost_range = 'No cost for personal decriminalized possession. The stalled 2022 Cannabis and Industrial Hemp Control and Licensing Bill would have created an eight-category commercial license structure, but there is no operative commercial licensing regime as of 2026.',
  legal_framework_summary = 'The Misuse of Drugs (Amendment) Act, 2017 decriminalized possession of up to 10 grams of cannabis for adults on private premises with the property owner''s consent, and separately decriminalized smoking on private premises, but buying, selling, cultivating, importing, exporting, and public use all remain illegal, with importation treated as trafficking regardless of quantity. A more ambitious Cannabis and Industrial Hemp Control and Licensing Bill passed both houses of the National Assembly in 2022, proposing eight license types for a full commercial supply chain, but a planned public referendum was cancelled over cost concerns and the bill has stalled in the legislature since, with no further progress as of 2026. A local October 2025 referendum on Caye Caulker specifically rejected supporting cannabis legalization (roughly 79% "No"), though this vote has no effect on national law. There is no medical cannabis program, and Belize does not recognize foreign medical cannabis cards or prescriptions for import purposes.',
  steps = '[{"step":"Personal-use route","detail":"Adults may possess up to 10g and consume on private premises with the property owner''s consent; no license required"},{"step":"Await commercial framework","detail":"The 2022 Cannabis and Industrial Hemp Control and Licensing Bill remains stalled with no operative licensing pathway; monitor Ministry of New Growth Industries statements for revival"}]'::jsonb,
  key_regulators = '["Ministry of New Growth Industries (assessing legalization prospects)","Belize Police Department","Belize Customs and Excise Department"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming decriminalized private possession extends to commercial activity — buying, selling, cultivating, importing, and exporting all remain illegal with no operative license regime',
    'Assuming the stalled 2022 legalization bill is close to passage — it has been stalled since a 2022 referendum cancellation with no confirmed new timeline as of 2026',
    'Bringing any cannabis product, including CBD, across the border — Belize Customs treats importation as a trafficking offense regardless of amount or product type'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — well corroborated across Wikipedia, multiple independent 2026 travel-law guides, and a specialized drug-policy reform tracker citing the original 2017 legislative assent',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Belize')
WHERE country_iso2 = 'BZ';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('BB','BY','BE','BZ');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705170000','jurisdiction_playbooks_batch5_bb_by_be_bz','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705170000_jurisdiction_playbooks_batch5_bb_by_be_bz.sql

-- RECOVERY BEGIN 20260705180000_jurisdiction_playbooks_batch6_bj_bt_ba.sql
-- Research batch 6 of jurisdiction_playbooks: Benin, Bhutan, Bosnia and Herzegovina.
-- Real, sourced content replacing draft stub rows. Bosnia is a recent, in-progress
-- legal change (medical cannabis legalized Dec 2025, implementing regulations still
-- being finalized as of April 2026) — noted explicitly in the summary and confidence label.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Wikipedia — Cannabis in Benin', 'https://en.wikipedia.org/wiki/Cannabis_in_Benin', 'Benin', 'BJ', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Prohibition context, transshipment role, seizure trend'),
  ('Grokipedia — Cannabis in Benin', 'https://grokipedia.com/page/cannabis_in_benin', 'Benin', 'BJ', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Act No. 97-025 (1997) statutory detail, penalty range'),
  ('Wikipedia — Cannabis in Bhutan', 'https://en.wikipedia.org/wiki/Cannabis_in_Bhutan', 'Bhutan', 'BT', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', 'Wild-growth context, enforcement history'),
  ('Grokipedia — Cannabis in Bhutan', 'https://grokipedia.com/page/cannabis_in_bhutan', 'Bhutan', 'BT', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', '2015 Act name, penalty tiers, licensed hemp fiber program, 2023 PM statement'),
  ('Soft Secrets — Bosnia and Herzegovina Moves to Regulate Medical Cannabis', 'https://softsecrets.com/en-US/article/bosnia-legalizes-medicinal-cannabis', 'Bosnia and Herzegovina', 'BA', 'Europe', 2, 'html_snapshot', 'monthly', 'trade_press', 'Dec 2025 Council of Ministers decision, effective Jan 1 2026, pharmaceutical-only scope'),
  ('Newsweed — BiH Continues Rollout of Medical Cannabis', 'https://www.newsweed.fr/en/bosnia-and-herzegovina-continues-to-roll-out-medical-cannabis-following-its-legalization/', 'Bosnia and Herzegovina', 'BA', 'Europe', 2, 'html_snapshot', 'monthly', 'trade_press', 'April 2026 roundtable confirming implementation still in progress'),
  ('CMS Expert Guides — Cannabis law and legislation in Bosnia & Herzegovina', 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/bosnia-and-herzegovina', 'Bosnia and Herzegovina', 'BA', 'Europe', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Pre-existing industrial hemp framework baseline (0.2% THC)')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis production, processing, possession, use, importation, exportation, sale, and trafficking are all prohibited under Act No. 97-025 of July 18, 1997 on the control of drugs and precursors, with no exemptions for medical, scientific, or recreational purposes. Penalties range from 2 to 20 years imprisonment depending on offense severity, with the higher end reserved for trafficking or organized distribution. Enforcement is handled primarily by the National Police and Gendarmerie; despite the ban, cannabis is the only drug produced domestically (mostly small-scale) and Benin, particularly Porto-Novo, has increasingly become a regional transshipment point for cannabis moving toward Nigeria.',
  steps = '[]'::jsonb,
  key_regulators = '["National Police","Gendarmerie Nationale"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming small personal-use amounts are tolerated in practice — enforcement is variable but the law provides no formal exemption, and penalties start at 2 years even for lower-severity offenses',
    'Confusing Benin''s role as a transit/transshipment country with any domestic legal tolerance — transshipment activity is itself criminalized and increasingly targeted by law enforcement',
    'Assuming any distinction exists between hemp and drug-type cannabis — the 1997 Act makes no such distinction'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across reference sources with specific statutory detail (Act No. 97-025) confirmed',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Benin')
WHERE country_iso2 = 'BJ';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable for personal, recreational, or medical use. A narrow licensed non-psychoactive hemp fiber program (under ~1% THC) operates in parts of western Bhutan under government authorization, with no published general fee schedule.',
  legal_framework_summary = 'Possession, cultivation, sale, and recreational use of cannabis are illegal under the Narcotic Drugs, Psychotropic Substances and Substance Abuse Act of 2015, which classifies cannabis as a Schedule I controlled narcotic; despite this, the plant grows wild and prolifically across the country and has long been used for non-psychoactive purposes such as pig fodder, rope, and hemp fiber for archery bows. Small-scale possession or cultivation is a misdemeanor carrying up to 3 years imprisonment, while larger-quantity cultivation, harvesting, or trafficking is a third- or fourth-degree felony carrying several years or more; courts may substitute mandatory counseling for incarceration in qualifying cases. Licensed non-psychoactive fiber production is permitted in parts of western Bhutan, but no exception exists for CBD, recreational seeds, or any psychoactive use. Prime Minister Lotay Tshering explicitly reaffirmed in 2023 that Bhutan rejects legalization, prioritizing cultural preservation — cannabis use conflicts with Vajrayana Buddhist principles — and abuse prevention.',
  steps = '[{"step":"Licensed industrial fiber route only","detail":"Non-psychoactive hemp fiber cultivation (roughly under 1% THC) is permitted in designated western regions under government license, strictly for fiber/fodder use — no psychoactive, CBD, or seed-sale pathway exists"}]'::jsonb,
  key_regulators = '["Royal Bhutan Police — National Drug Law Enforcement Unit","Ministry of Health"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the plant''s wild abundance implies legal tolerance — possession and use remain fully criminalized regardless of the plant growing unmanaged',
    'Assuming CBD is treated separately from THC — Bhutanese law makes no such distinction and CBD products are equally illegal',
    'Assuming the licensed hemp-fiber program signals movement toward broader legalization — the Prime Minister explicitly rejected this in 2023'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across reference and legal-analysis sources, including the specific 2015 Act name and the 2023 PM statement',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Bhutan')
WHERE country_iso2 = 'BT';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 24,
  estimated_cost_range = 'Not yet determinable — implementing regulations (professional guidelines, operational procedures) were still being developed as of April 2026; no licensing or patient-fee structure has been published. Separately, pre-existing industrial hemp cultivation requires authorization from a competent body with no widely published fee schedule.',
  legal_framework_summary = 'On December 29, 2025, the Council of Ministers of Bosnia and Herzegovina approved reclassifying cannabis, its resins, extracts, and tinctures from the list of strictly prohibited substances to a "strict monitoring" table, legalizing cannabis for medical purposes effective January 1, 2026 — ending roughly a decade of legislative deadlock. Access will be limited to patients with a valid prescription from an authorized physician, with cannabis dispensed exclusively as pharmaceutical products (oils, tinctures, or magistral preparations) rather than whole-plant flower. As of an April 24, 2026 roundtable convened by the Ministry of Civil Affairs, authorities were still developing the implementing regulations, professional guidelines, and operational procedures needed before patients can actually access cannabis-based medicines through pharmacies — meaning the legal change is confirmed but practical patient access was not yet operational as of that date. Separately, industrial hemp cultivation (fiber/seed, THC at or below 0.2%) has long been permitted under the pre-existing Law on Prevention and Suppression of Narcotic Drugs Abuse, requiring authorization and registered hemp varieties; recreational cannabis remains fully prohibited.',
  steps = '[{"step":"Monitor implementation regulations","detail":"As of April 2026, the Ministry of Civil Affairs was still finalizing professional guidelines and operational procedures required before cannabis-based medicines reach pharmacies — check for published implementing rules before assuming patient access is live"},{"step":"Industrial hemp route (separately established)","detail":"Apply for authorization from the competent body to grow, import, or sell registered hemp varieties at or below 0.2% THC for fiber, animal feed seed, or further processing"}]'::jsonb,
  key_regulators = '["Council of Ministers of Bosnia and Herzegovina","Ministry of Civil Affairs","Entity-level Ministries of Health (Federation of BiH / Republika Srpska)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the December 2025 legalization decision means patients can access medical cannabis today — as of an April 2026 government roundtable, implementing regulations were still being finalized with no confirmed pharmacy-access date',
    'Assuming whole-plant flower will be dispensable — the framework is designed around pharmaceutical-grade oils, tinctures, and magistral preparations, not flower',
    'Overlooking Bosnia and Herzegovina''s split entity structure (Federation of BiH / Republika Srpska) — implementation may proceed at different paces or through different health authorities across entities'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high on the legal reform itself (extensively corroborated across independent trade press and government statements); medium on the implementation timeline, which was explicitly still in progress as of April 2026',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://softsecrets.com/en-US/article/bosnia-legalizes-medicinal-cannabis')
WHERE country_iso2 = 'BA';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('BJ','BT','BA');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705180000','jurisdiction_playbooks_batch6_bj_bt_ba','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705180000_jurisdiction_playbooks_batch6_bj_bt_ba.sql

-- RECOVERY BEGIN 20260705181915_country_enrichment_add_playbook_source.sql
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705181915','country_enrichment_add_playbook_source','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705181915_country_enrichment_add_playbook_source.sql

-- RECOVERY BEGIN 20260705190000_jurisdiction_playbooks_batch7_bo_bw_bn_bg.sql
-- Research batch 7 of jurisdiction_playbooks: Bolivia, Botswana, Brunei, Bulgaria.
-- Real, sourced content replacing draft stub rows.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Wikipedia — Cannabis in Bolivia', 'https://en.wikipedia.org/wiki/Cannabis_in_Bolivia', 'Bolivia', 'BO', 'Latin America', 2, 'html_snapshot', 'quarterly', 'reference', 'Ley 1008 (1988) penalty structure, treated equal to cocaine'),
  ('Leafwell — Is Marijuana Legal in Bolivia', 'https://leafwell.com/blog/is-marijuana-legal-in-bolivia', 'Bolivia', 'BO', 'Latin America', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Law 913 (2017) sovereignty reform context, cultivation penalties'),
  ('CannabisRegulations.ai — Bolivia', 'https://www.cannabisregulations.ai/country-legality/bolivia-marijuana', 'Bolivia', 'BO', 'Latin America', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Article 49 treatment-alternative provision, no medical law enacted as of 2026'),
  ('High Life Global — Is Cannabis Legal in Botswana 2026', 'https://hghlfglbl.com/legalization/is-cannabis-legal-in-botswana/', 'Botswana', 'BW', 'Africa', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'Cannabis Bill 2025 passage, recreational still illegal'),
  ('CannaReporter — Botswana high licensing fees', 'https://cannareporter.eu/en/2026/02/04/botswana-elevadas-taxas-de-licenciamento-ameacam-mercado-justo-para-o-canhamo-e-a-canabis-medicinal/', 'Botswana', 'BW', 'Africa', 2, 'html_snapshot', 'monthly', 'trade_press', 'Specific fee figures by license category, equity criticism'),
  ('Hemp Today — Botswana industrial cannabis regulations', 'https://hemptoday.net/botswana-government-says-it-will-support-hemp-after-issuing-strict-regulations/', 'Botswana', 'BW', 'Africa', 2, 'html_snapshot', 'monthly', 'trade_press', '0.7% THC industrial cannabis definition, real license example, President Boko agenda'),
  ('Tripbase — Brunei drug laws 2026', 'https://www.tripbase.com/drug-laws/brunei/', 'Brunei', 'BN', 'Asia', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '500g trafficking threshold, penalty tiers, citing Misuse of Drugs Act directly'),
  ('Brunei Narcotics Control Bureau — Drug Laws (official)', 'https://www.narcotics.gov.bn/SitePages/Drug%20Laws.aspx', 'Brunei', 'BN', 'Asia', 1, 'html_snapshot', 'quarterly', 'regulator_official', 'Official confirmation Misuse of Drugs Act is primary legislation'),
  ('Wikipedia — Cannabis in Brunei', 'https://en.wikipedia.org/wiki/Cannabis_in_Brunei', 'Brunei', 'BN', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', '2013 Act cultivation penalties, documented death sentence cases'),
  ('CMS Expert Guides — Cannabis law and legislation in Bulgaria', 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/bulgaria', 'Bulgaria', 'BG', 'Europe', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'NSPCA framework, licensed hemp cultivation conditions, doctor liability'),
  ('CannabisRegulations.ai — Bulgaria', 'https://www.cannabisregulations.ai/country-legality/bulgaria-marijuana', 'Bulgaria', 'BG', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Penal Code Art 354a/354c penalty ranges, regulator names'),
  ('Cannigma — Cannabis laws in Bulgaria', 'https://cannigma.com/regulation/cannabis-laws-in-bulgaria/', 'Bulgaria', 'BG', 'Europe', 2, 'html_snapshot', 'quarterly', 'reference', '2019 CBD-as-traditional-food classification, first EU country to allow CBD sale')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cultivation, possession, and sale of cannabis are illegal in Bolivia under Ley 1008 (1988), the Anti-Drug Law, which treats cannabis with the same severity as cocaine: possession of even one gram can carry a 10-25 year prison sentence, and manufacturing carries 5-15 years. Cultivation specifically (sowing, harvesting, gathering) carries 1-2 years for a first offense, with longer sentences for repeat offenders. Article 49 allows judges discretion to order treatment rather than incarceration for first-time personal users, though this is not a decriminalization and remains rarely applied in practice. Law 913 (2017) reasserted Bolivian sovereignty over drug policy and shifted rhetoric toward public health and human rights, but made no changes to cannabis-specific penalties. Medical cannabis legislation has been repeatedly debated in the Asamblea Legislativa Plurinacional (including a 2023 public debate) but no bill has been enacted as of 2026; CBD import and use are equally prohibited, with no cannabinoid medicines available even in pharmacies.',
  steps = '[]'::jsonb,
  key_regulators = '["Consejo Nacional de Lucha Contra el Trafico Ilicito de Drogas (CONALTID)","Fuerza Especial de Lucha Contra el Narcotrafico (FELCN)","Ministerio de Gobierno"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming Article 49''s treatment-alternative provision amounts to decriminalization — it is narrow judicial discretion for first-time personal users, not a legal exemption, and possession remains criminalized regardless of quantity',
    'Assuming Law 913 (2017) softened cannabis penalties — it reasserted sovereignty and public-health framing but did not change cannabis-specific sentences',
    'Bringing CBD products into Bolivia expecting leniency — CBD is treated as a controlled-substance derivative with no THC-content exemption, and personal shipments are routinely seized'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across Wikipedia, legal-analysis, and reform-tracking sources; two lower-quality sources claiming a 2016 medical-cannabis law and a 50g decriminalization threshold were discarded as contradicted by the stronger multi-source consensus',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Bolivia')
WHERE country_iso2 = 'BO';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 18,
  estimated_cost_range = 'Cultivation licenses range from roughly €214 to €534 per year for resident applicants; non-resident processing/manufacturing licenses can exceed €2 million per year — a fee structure widely criticized locally as excluding smallholder farmers',
  legal_framework_summary = 'Recreational cannabis remains illegal in Botswana under the Drugs and Related Substances Act, but the country has moved decisively toward a regulated medicinal, scientific, and industrial framework: Parliament adopted a licit-use cannabis policy in April 2025 and passed the Cannabis Bill, 2025, tightly regulating cultivation, production, storage, distribution, import, and export strictly for medicinal, scientific, research, and industrial purposes. The regulations define "industrial cannabis" (rather than using a separate "hemp" category) with a THC cap of 0.7%, while both CBD and recreational marijuana remain illegal outside the licensed framework. Cultivation is restricted to licensed operators under specific categories (commercial growing, nurseries, seed production), with licenses issued for three-year terms subject to inspection and renewal. President Duma Boko''s government has framed the sector as part of an economic diversification strategy to reduce reliance on diamond exports, and has issued licenses to companies including Hemp Innovations Botswana (linked to a Swedish partner).',
  steps = '[{"step":"Choose a license category","detail":"Apply under one of the specific categories: commercial cultivation, nursery, seed production, processing/manufacturing, or dispensary (medicinal)"},{"step":"Meet the THC/product definition","detail":"Note Botswana uses \"industrial cannabis\" (THC capped at 0.7%) rather than a separate hemp category; CBD and recreational marijuana remain illegal regardless of licensing"},{"step":"Budget for steep licensing fees","detail":"Resident cultivation licenses run roughly €214-534/year; non-resident processing/manufacturing licenses can exceed €2 million/year — factor this into any market-entry model, especially partnership structures with non-resident entities"},{"step":"Plan for 3-year license terms","detail":"Licenses are subject to periodic inspection and renewal on a three-year cycle"}]'::jsonb,
  key_regulators = '["Ministry overseeing the Cannabis Bill 2025 licensing regime","Botswana University of Agriculture and Natural Resources (pilot trials)","Drugs and Related Substances Act enforcement bodies (recreational prohibition)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the 2025 reform legalized recreational or CBD use — it strictly covers medicinal, scientific, research, and industrial purposes; recreational cannabis and CBD remain illegal',
    'Underestimating licensing costs for non-resident partnerships — fees for non-resident processing/manufacturing licenses can exceed €2 million/year, and partnering with a non-resident entity can push a project into the highest fee tier',
    'Assuming smallholder or informal cultivation has a place in the new framework — cultivation is restricted to licensed operators only, and critics note the rules effectively exclude ordinary Batswana farmers'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across independent trade press, industry forums, and consistent reporting on the 2025 Cannabis Bill and licensing fee structure',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://hghlfglbl.com/legalization/is-cannabis-legal-in-botswana/')
WHERE country_iso2 = 'BW';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Brunei under the Misuse of Drugs Act (Chapter 27), with no medical or recreational exemption, and Brunei''s legal system is shaped by Sharia-Islamic principles under the Sultan. Possession of more than 500 grams of cannabis is presumed to be trafficking and carries the mandatory death penalty; smaller personal-possession amounts typically bring lengthy imprisonment (commonly cited around a 20-year minimum) plus caning. Cultivating cannabis carries 3 to 20 years imprisonment and/or a fine up to USD 40,000 under the 2013 Act provisions. While no executions for drug offenses are known to have been carried out in recent decades and Brunei is generally considered abolitionist in practice, the death sentence has been formally handed down in documented cases (2004 and 2017), and the law remains fully in force with no reform trajectory.',
  steps = '[]'::jsonb,
  key_regulators = '["Narcotics Control Bureau (NCB)","Royal Brunei Police Force"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the lack of recent executions signals de facto tolerance — the law remains fully enforced through long prison sentences, caning, and formal death sentences even without carried-out executions',
    'Underestimating the trafficking threshold — possession of just over 500 grams triggers a presumption of trafficking and mandatory death penalty exposure, a much lower bar than in most jurisdictions',
    'Assuming CBD or hemp products are treated differently from THC-containing cannabis — Brunei''s Misuse of Drugs Act makes no such distinction and any cannabis-derived product carries the same severe exposure'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated directly by the Brunei Narcotics Control Bureau''s official site plus the primary statute text and multiple independent legal-analysis sources',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.narcotics.gov.bn/SitePages/Drug%20Laws.aspx')
WHERE country_iso2 = 'BN';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 12,
  estimated_cost_range = 'Industrial hemp cultivation license from the Ministry of Agriculture, Food and Forestry (no widely published standard fee); CBD businesses face compliance costs for lab testing and labeling but no special novel-food licensing fee, since Bulgaria classifies compliant CBD as a "traditional food" rather than requiring EU Novel Food authorization',
  legal_framework_summary = 'Cannabis remains illegal in Bulgaria for both recreational and medical use under the Narcotic Substances and Precursors Control Act (NSPCA) and Penal Code Articles 354a and 354c, with standard possession carrying 1-6 years imprisonment and fines of 2,000-10,000 leva, rising to 3-12 years for trafficking or cultivation under aggravating circumstances. There is no formally recognized personal-use threshold, though Article 354a(5) allows judges to impose a fine (up to roughly 1,000 leva) for insignificant quantities — this still constitutes a criminal conviction, not decriminalization. Bulgaria has no medical cannabis program, unlike neighboring Greece and Romania. Industrial hemp cultivation is legal only under Ministry of Agriculture license, restricted to fiber, animal feed seed, or sowing use, with THC content below 0.2% by weight (one source references a possible increase to 0.3%, unconfirmed across other sources) and subject to State Agency for National Security supervision. Bulgaria was the first EU country to permit legal CBD sales (2019), classifying compliant hemp-derived CBD (under 0.2% THC) as a "traditional food" rather than requiring EU Novel Food authorization — a notably more permissive stance than most EU states on that specific point.',
  steps = '[{"step":"Industrial hemp cultivation route","detail":"Apply to the Ministry of Agriculture, Food and Forestry for a cultivation license restricted to fiber, seed, or sowing use; THC must stay below 0.2% by weight; cultivation is supervised by the State Agency for National Security"},{"step":"CBD product route","detail":"Source CBD from licensed industrial hemp under 0.2% THC; Bulgaria''s traditional-food classification (rather than EU Novel Food) simplifies market entry relative to most EU states, but quality, THC-testing, and labeling standards still apply via the Bulgarian Food Safety Agency"},{"step":"Avoid any medical cannabis assumption","detail":"There is no medical cannabis program; doctors who prescribe cannabis outside narcotics regulations face criminal liability up to 5 years imprisonment"}]'::jsonb,
  key_regulators = '["Bulgarian Drug Agency (Ministry of Health)","Ministry of Interior — General Directorate for Combating Organized Crime (GDBOP)","Ministry of Agriculture, Food and Forestry (hemp licensing)","Bulgarian Food Safety Agency (CBD product oversight)","State Agency for National Security (hemp cultivation supervision)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming Bulgaria''s permissive CBD market signals broader cannabis reform — CBD''s traditional-food classification is a narrow exception; recreational and medical cannabis remain fully illegal with no program of either kind',
    'Assuming hemp cultivation is open to any grower — it requires a specific Ministry of Agriculture license and ongoing State Agency for National Security supervision, not simple registration',
    'Assuming Article 354a(5)''s reduced fine for insignificant quantities is a decriminalization threshold — it remains a criminal conviction, just with a lighter sanction'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across a law firm expert guide (CMS), independent legal-analysis sources, and Cannigma''s detailed 2019 CBD-classification reporting',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/bulgaria')
WHERE country_iso2 = 'BG';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('BO','BW','BN','BG');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705190000','jurisdiction_playbooks_batch7_bo_bw_bn_bg','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705190000_jurisdiction_playbooks_batch7_bo_bw_bn_bg.sql

-- RECOVERY BEGIN 20260705194736_enable_rls_country_intel_backup_20260630.sql
-- Fix: public.country_intel_backup_20260630 was exposed with RLS disabled.
-- Backup snapshot tables should never be reachable via anon/authenticated
-- roles through PostgREST. Enabling RLS with no policies = default-deny for
-- those roles; service_role (bypassrls) is unaffected.
--
-- The backup relation was created directly in production and is not part of
-- the reproducible zero-state schema. Guard the repair so production remains
-- hardened while clean rebuilds continue when the backup table is absent.

do $enable_country_intel_backup_rls$
begin
  if to_regclass('public.country_intel_backup_20260630') is not null then
    alter table public.country_intel_backup_20260630 enable row level security;
  end if;
end
$enable_country_intel_backup_rls$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705194736','enable_rls_country_intel_backup_20260630','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705194736_enable_rls_country_intel_backup_20260630.sql

-- RECOVERY BEGIN 20260705200000_jurisdiction_playbooks_batch8_bf_bi_kh_cm.sql
-- Research batch 8 of jurisdiction_playbooks: Burkina Faso, Burundi, Cambodia, Cameroon.
-- Real, sourced content replacing draft stub rows.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Leafwell — Is Marijuana Legal in Burkina Faso', 'https://leafwell.com/blog/is-marijuana-legal-in-burkina-faso', 'Burkina Faso', 'BF', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Code des drogues au Burkina, Table I classification detail'),
  ('CannabisLaws.Global — Burkina Faso', 'https://cannabislaws.global/burkina-faso/', 'Burkina Faso', 'BF', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Up to 10 years imprisonment penalty range'),
  ('Wikipedia — Cannabis in Burundi', 'https://en.wikipedia.org/wiki/Cannabis_in_Burundi', 'Burundi', 'BI', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', '1977 US Congressional report, fine range, rare enforcement'),
  ('Leafwell — Is Marijuana Legal in Burundi', 'https://leafwell.com/blog/is-marijuana-legal-in-burundi', 'Burundi', 'BI', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'No hemp/THC distinction, cultivation penalty detail'),
  ('Wikipedia — Cannabis in Cambodia', 'https://en.wikipedia.org/wiki/Cannabis_in_Cambodia', 'Cambodia', 'KH', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', 'Law on Drug Management Article 2, historical enforcement pattern, Happy restaurants'),
  ('CannabisRegulations.ai — Cambodia', 'https://www.cannabisregulations.ai/country-legality/cambodia-marijuana', 'Cambodia', 'KH', 'Asia', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Post-2019-2020 tourist-area enforcement tightening, regulator names'),
  ('Leafwell — Is Marijuana Legal in Cameroon', 'https://leafwell.com/blog/is-marijuana-legal-in-cameroon', 'Cameroon', 'CM', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Law No. 97/19 (1997) Sections 91-95 penalty detail, 2001/2003/2019 failed medical-export attempts'),
  ('Wikipedia — Cannabis in Cameroon', 'https://en.wikipedia.org/wiki/Cannabis_in_Cameroon', 'Cameroon', 'CM', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Transit-hub role, 2001 BBC medical import report')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis production, trade, transport, and possession are fully prohibited under the Code des drogues au Burkina, which classifies cannabis under "Table I" — high-risk plants and substances of no recognized medical interest — alongside a general ban derived from Burkina Faso''s adherence to international UN drug-control conventions. The law makes no distinction between medical and recreational use, and there is no CBD-specific exemption. Despite the ban, Burkina Faso''s tropical climate makes it well-suited to cultivation, and cannabis is grown clandestinely in rural areas (particularly around Ouagadougou), primarily for export to neighboring countries such as Nigeria and Mali rather than domestic consumption, which remains comparatively low among Burkinabé youth.',
  steps = '[]'::jsonb,
  key_regulators = '["Police and judicial enforcement under the Code des drogues au Burkina","UNODC-coordinated border monitoring"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming rural cultivation activity signals any legal tolerance — cultivation is criminalized under Table I of the Code des drogues regardless of scale or intent',
    'Assuming any hemp/CBD carve-out exists — the law makes no distinction between low-THC hemp and drug-type cannabis, and CBD has no separate legal status',
    'Assuming neighboring reform momentum (Ghana''s decriminalization, Nigeria''s medical-cannabis discussions) signals imminent Burkinabé change — no legislative movement has been reported'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across reference and legal-analysis sources with specific statutory classification (Table I) confirmed',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://leafwell.com/blog/is-marijuana-legal-in-burkina-faso')
WHERE country_iso2 = 'BF';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Burundi for all purposes, with no distinction made between recreational and medical use, hemp and drug-type cannabis, or CBD and THC — even 0-THC smokable hemp or medical CBD products are prohibited. A 1977 U.S. Congressional report documented cultivation, transport, and possession penalties of fines ranging from 100 to 100,000 francs, though enforcement was noted even then as rare, with no cannabis violations recorded in the prior eight years. Current personal possession penalties range from fines up to roughly one year imprisonment, and cultivation carries scaling fines and prison time with plant confiscation. The plant grows only in small, wild batches given Burundi''s climate, which is not well-suited to cultivation, and cannabis use is considered a comparatively minor drug issue domestically, with no indication of near-term legal reform given Burundi''s adherence to the UN''s blanket cannabis ban.',
  steps = '[]'::jsonb,
  key_regulators = '["Burundian national police and judicial enforcement bodies"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming low enforcement activity signals informal tolerance for commercial cultivation or trade — the law provides no legal pathway regardless of enforcement intensity',
    'Assuming CBD or 0-THC hemp products are exempt — Burundian law treats all cannabis-derived products identically, with no cannabinoid-content distinction',
    'Assuming Burundi''s climate supports viable commercial cultivation — the country''s conditions are poorly suited to the plant, limiting it to small wild-growing batches'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across Wikipedia''s historical statutory detail and independent legal-analysis sources',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Burundi')
WHERE country_iso2 = 'BI';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Cambodia under the Law on Drug Management, which since 1961/1992 (in compliance with the Single Convention on Narcotic Drugs) explicitly prohibits cultivation of cannabis indica and sativa, with penalties for possession ranging from fines up to 10 years imprisonment and cultivation/trafficking carrying sentences up to life imprisonment. However, enforcement has historically been opportunistic and inconsistent rather than systematic: "Happy" restaurants in Phnom Penh, Siem Reap, and Sihanoukville have long openly served cannabis-infused food ("happy pizza") to tourists, and the UNODC noted cannabis cultivation had "ceased to be a major concern" by 2009. Enforcement in tourist areas tightened following 2019-2020 crackdowns on informal happy-pizza venues, and foreign nationals are prosecuted under the same statute as citizens, though bribery of local police to avoid prosecution has been documented. There is no medical cannabis program and no separate legal status for CBD, which falls under the general cannabis prohibition.',
  steps = '[]'::jsonb,
  key_regulators = '["National Authority for Combating Drugs (NACD)","Anti-Drug Department, Cambodian National Police","Ministry of Health"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the visible "Happy" restaurant scene means cannabis is effectively legal — it remains a criminal offense under the Law on Drug Management, with enforcement applied opportunistically rather than never',
    'Assuming enforcement leniency is uniform nationwide or guaranteed to continue — tourist-area enforcement has tightened since 2019-2020, and crackdowns can occur without warning',
    'Assuming CBD is treated separately from THC-containing cannabis — Cambodian law does not distinguish CBD, leaving its status governed by the same general prohibition'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across Wikipedia''s statutory citation (Law on Drug Management Article 2) and multiple independent legal-analysis and travel sources describing the enforcement pattern consistently',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Cambodia')
WHERE country_iso2 = 'KH';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis cultivation, production, possession, use, and trafficking are prohibited under Law No. 97/19 of 7 August 1997, which classifies cannabis and cannabis resin as "high-risk drugs" under Cameroon''s narcotics control framework; Sections 91-95 impose 10 to 20 years imprisonment plus fines of CFAF 250,000 to 1,250,000 for cultivation, production, import/export, or sale. No exemption exists for medical use, industrial hemp, or CBD, even though Cameroon''s climate is well-suited to hemp cultivation. Despite the ban, cannabis (locally "banga") is widely and traditionally grown, particularly by rural farmers in northern Cameroon who derive significant income from it, and the country has made several unsuccessful attempts to establish a legal medical-cannabis export industry: a 2001 BBC report on a proposed Canada-import medical program that Canadian health authorities denied any agreement for, a 2003 UN-registered request for medicinal cultivation/export that was never implemented, and a 2019 scheme involving foreign investors and rainforest road-building that was later exposed as financial fraud.',
  steps = '[]'::jsonb,
  key_regulators = '["Cameroonian judicial and police enforcement under Law No. 97/19","Customs authorities at Douala and Yaoundé airports (documented transit points for cannabis trafficking to Europe)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming Cameroon''s repeated past attempts at a legal medical-cannabis export program signal an imminent legal pathway — all prior attempts (2001, 2003, 2019) failed or were exposed as fraudulent, with no current legal framework in place',
    'Assuming widespread rural cultivation implies informal legal tolerance — cultivation remains a serious criminal offense carrying 10-20 years imprisonment regardless of local prevalence',
    'Assuming industrial hemp (low-THC) is distinguished from drug-type cannabis — Law No. 97/19 makes no such distinction; any cannabis or hemp cultivation is equally prohibited'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across Wikipedia, Sensi Seeds, and Leafwell, with consistent statutory citation (Law No. 97/19, Sections 91-95) and consistent historical detail on the failed 2001/2003/2019 reform attempts',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://leafwell.com/blog/is-marijuana-legal-in-cameroon')
WHERE country_iso2 = 'CM';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('BF','BI','KH','CM');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705200000','jurisdiction_playbooks_batch8_bf_bi_kh_cm','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705200000_jurisdiction_playbooks_batch8_bf_bi_kh_cm.sql

-- RECOVERY BEGIN 20260705210000_jurisdiction_playbooks_batch9_cv_cf_td_cl.sql
-- Research batch 9 of jurisdiction_playbooks: Cape Verde, Central African Republic, Chad, Chile.
-- Real, sourced content replacing draft stub rows. Chile required correcting a widely-
-- repeated myth (the "6 plants per household" figure never became law) and flagging a
-- live 2026 political/legal risk (penalty-reform under Constitutional Court challenge).

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Tripbase — Cape Verde cannabis drug laws', 'https://www.tripbase.com/drug-laws/cape-verde/cannabis/', 'Cape Verde', 'CV', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Consumption vs trafficking penalty distinction, citing UK FCDO'),
  ('Dagga Diaries — Legality of Cannabis in Cape Verde', 'https://www.daggadiaries.com/countries/cannabis-in-cape-verde', 'Cape Verde', 'CV', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Law No. 78/IV/93 and Law No. 92/92 statutory citation, treatment-alternative option'),
  ('Leafwell — Is Marijuana Legal in the Central African Republic', 'https://leafwell.com/blog/is-marijuana-legal-in-central-african-republic', 'Central African Republic', 'CF', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Fine threshold over 1,000,000 francs, no CBD distinction, rising youth use'),
  ('Wikipedia — Cannabis in the Central African Republic', 'https://en.wikipedia.org/wiki/Cannabis_in_the_Central_African_Republic', 'Central African Republic', 'CF', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Prohibition since Central African Empire era (1976-1979)'),
  ('Leafwell — Is Marijuana Legal in Chad', 'https://leafwell.com/blog/is-marijuana-legal-in-chad', 'Chad', 'TD', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'No CBD distinction, no decrim/legalization progress noted'),
  ('Wikipedia — Cannabis in Chad', 'https://en.wikipedia.org/wiki/Cannabis_in_Chad', 'Chad', 'TD', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Lake Chad wild cultivation note, limited available data'),
  ('MyCannabis — Is Weed Legal in Chile 2026', 'https://www.mycannabis.com/is-weed-legal-in-chile/', 'Chile', 'CL', 'Latin America', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'Corrects the widely-repeated "6 plants" myth; 2026 political shift and May 2026 penalty-reform legal challenge'),
  ('CMS Expert Guides — Cannabis law and legislation in Chile', 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/chile', 'Chile', 'CL', 'Latin America', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'No industrial authorization, no CBD statutory reference, self-cultivation personal-use-only scope'),
  ('Leafwell — Is Marijuana Legal in Chile', 'https://leafwell.com/blog/is-marijuana-legal-in-chile', 'Chile', 'CL', 'Latin America', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Sativex pharmacy pricing, large-scale cultivation restriction detail')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Cape Verde for all purposes under Law No. 78/IV/93 (1993) and Law No. 92/92 (1992), with no recreational or medical program. Personal drug consumption is penalized more leniently than trafficking or production (consumption reported at around three months'' imprisonment, with defendants able to seek treatment plus a financial penalty in lieu of incarceration), but possession still routinely results in arrest, fines, and jail, and travelers have been arrested for personal-use amounts. Enforcement in practice is described as comparatively lax for small quantities given limited police presence, but this does not amount to any legal exemption or tolerance policy.',
  steps = '[]'::jsonb,
  key_regulators = '["Cape Verdean national police and judicial enforcement bodies"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming light on-the-ground enforcement (a documented pattern given limited police presence) signals legal tolerance — no legal pathway exists regardless of practical enforcement intensity',
    'Relying on low-quality sources claiming a 25-gram legal possession threshold or the existence of legal dispensaries — no such threshold or retail market exists; cannabis is illegal for all purposes',
    'Assuming CBD or hemp products are treated separately from THC-containing cannabis — no such distinction is established in Cape Verdean law'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across UK FCDO travel advisories, Wikipedia, and legal-analysis sources; one templated low-quality source falsely claiming a 25g legal threshold and dispensaries was discarded as contradicted by every credible source',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.tripbase.com/drug-laws/cape-verde/cannabis/')
WHERE country_iso2 = 'CV';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis possession, sale, distribution, cultivation, and consumption are all illegal in the Central African Republic, with no distinction made between recreational and medical use and no legal status for CBD or other cannabis derivatives — prohibition dates back at least to the Central African Empire administration (1976-1979). Violators face extended jail time and fines exceeding 1,000,000 francs. Despite the ban, cannabis is reportedly the most widely cultivated and consumed illicit substance in the country, with use said to be rising among young men under 35, though ongoing instability and weakened rule of law limit available data on the actual scale of cultivation, consumption, and enforcement. There is no known proposed legislation, past or present, to legalize cannabis for any purpose.',
  steps = '[]'::jsonb,
  key_regulators = '["Central African Republic judicial and law enforcement bodies (data on specific agencies is limited given ongoing instability)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming widespread illicit cultivation and use signal any movement toward legal reform — no proposed legislation exists, and cultivation remains a serious criminal offense',
    'Assuming CBD or non-psychoactive hemp derivatives are exempt — no such distinction exists in CAR''s drug law',
    'Treating enforcement data as reliable or current — ongoing instability and weak rule of law mean available information on actual enforcement practice is limited and may not reflect ground reality'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'medium-high — legal prohibition itself is consistently confirmed across sources, but detailed enforcement data is acknowledged as limited given the country''s instability',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://leafwell.com/blog/is-marijuana-legal-in-central-african-republic')
WHERE country_iso2 = 'CF';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Chad for both recreational and medical use, with no legal distinction made for CBD products regardless of THC content. Specific sentencing guidelines and fine amounts are not well documented in available English-language sources, but law enforcement is reported to treat drug possession of any kind seriously, and cultivation is entirely prohibited. A 1999 report noted wild cannabis cultivation on islands in Lake Chad that local police had not moved to destroy, suggesting some enforcement gaps in remote areas, though this does not constitute any legal tolerance. There is no known legislative movement toward decriminalization or legalization. Available legal documentation on Chad specifically is comparatively thin relative to most other jurisdictions in this database, reflecting limited English-language legal-analysis coverage of the country.',
  steps = '[]'::jsonb,
  key_regulators = '["Chadian national police and judicial enforcement bodies (specific agency names not well documented in available sources)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the documented enforcement gap around wild Lake Chad cultivation signals broader tolerance — this is a localized, remote-area enforcement gap, not a legal exemption',
    'Assuming CBD is treated separately from THC-containing cannabis — no such distinction exists in Chadian law',
    'Treating this entry as equally well-documented as other countries — available sourcing on Chad specifically is thin and should be supplemented with local legal counsel before any commercial decision'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'medium — prohibition itself is consistently confirmed, but specific penalty/enforcement detail is thin across available English-language sources; flagged for follow-up research if French-language primary sources become available',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Chad')
WHERE country_iso2 = 'TD';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 18,
  estimated_cost_range = 'Medical cannabis pharmaceuticals (chiefly Sativex) cost patients out of pocket, with generics reported around $120 and typically not covered by insurance; large-scale cultivation authorization is restricted to a small number of specially licensed firms with no standardized public fee schedule; personal/home cultivation for self-consumption carries no licensing cost',
  legal_framework_summary = 'Chile decriminalized private personal cannabis consumption in 2005 under Law 20,000, and courts have consistently held that small-scale home cultivation for genuine personal/immediate use (not quantified by a specific plant count) is not a criminal act — though the widely-cited "six plants per household" figure never actually became law: a 2015 bill establishing that limit passed the lower house 68-39 but died in the Senate. Medical cannabis has been legal since Supreme Decree 84 (2015), letting patients with qualifying conditions (cancer, epilepsy, multiple sclerosis, among others) access prescribed cannabis-based medicines — chiefly Sativex — through more than 500 licensed pharmacies overseen by the Instituto de Salud Pública (ISP); a 2023 amendment lets a treating doctor''s prescription itself justify home cultivation for medical purposes. Recreational sale, distribution, transport, and large-scale production remain fully illegal, with trafficking carrying 5-15 years imprisonment, and large-scale cultivation authorization is restricted to a handful of specially licensed firms (one operation scaled to roughly 7,000 plants/year under Agriculture and Livestock Service supervision). CBD has no standalone legal definition and is treated identically to other cannabis-based medicines, requiring the same prescription-and-pharmacy pathway. As of 2026, the political and legal environment has shifted: right-wing president José Antonio Kast (elected December 2025, took office March 2026) has prioritized a law-and-order agenda over drug reform, and a May 2026 statutory reform broadening trafficking-level penalties to smaller quantities of substances deemed capable of "serious harm" is being challenged before the Constitutional Court by opposition deputies who argue it could sweep in personal and medicinal users, since cannabis remains classified as a hard drug under a 2007 decree.',
  steps = '[{"step":"Personal-use route","detail":"Private, non-public consumption and small-scale home cultivation for genuine personal use are decriminalized in practice through consistent judicial interpretation of Law 20,000 — not through a specific plant-count statute"},{"step":"Medical route","detail":"Obtain a qualifying diagnosis and physician prescription; access Sativex or other ISP-approved cannabis-based medicines through licensed pharmacies, or cultivate at home under a 2023-amendment medical justification"},{"step":"Large-scale/commercial route","detail":"Apply for special cultivation authorization (very limited number granted to date) under Agriculture and Livestock Service supervision; recreational sale and distribution remain illegal regardless of scale"},{"step":"Monitor the 2026 penalty-reform legal challenge","detail":"A May 2026 reform expanding trafficking-level penalties to smaller quantities is under Constitutional Court review; outcome could affect risk exposure for personal/medical users"}]'::jsonb,
  key_regulators = '["Instituto de Salud Pública (ISP) — pharmaceutical/medical cannabis oversight","Servicio Agrícola y Ganadero (SAG) — cultivation licensing and supervision","SENDA (Servicio Nacional para la Prevención y Rehabilitación del Consumo de Drogas y Alcohol)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Repeating the widely-cited "six plants per household" rule as current law — it comes from a 2015 bill that passed the lower house but never cleared the Senate; actual protection for home growers rests on judicial interpretation of "personal use," not a codified plant limit',
    'Assuming medical legalization created a normal commercial market — large-scale cultivation remains restricted to a small handful of specially authorized firms, and recreational sale/distribution/transport remain fully criminal with 5-15 year trafficking penalties',
    'Assuming the 2026 political and legal environment is static — a new law-and-order government and a May 2026 penalty-reform under active Constitutional Court challenge could meaningfully change enforcement risk for personal and medical users'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across a law firm expert guide (CMS), multiple independent legal-analysis sources, and recent 2026 reporting on the political/legal shift; the "6 plants" myth was specifically identified and corrected using the most current (June 2026) source',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.mycannabis.com/is-weed-legal-in-chile/')
WHERE country_iso2 = 'CL';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('CV','CF','TD','CL');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705210000','jurisdiction_playbooks_batch9_cv_cf_td_cl','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705210000_jurisdiction_playbooks_batch9_cv_cf_td_cl.sql

-- RECOVERY BEGIN 20260705220000_jurisdiction_playbooks_batch10_cn_km_cr_ci.sql
-- Research batch 10 of jurisdiction_playbooks: China, Comoros, Costa Rica, Cote d'Ivoire.
-- Real, sourced content replacing draft stub rows.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('CannabisRegulations.ai — China marijuana', 'https://www.cannabisregulations.ai/country-legality/china-marijuana', 'China', 'CN', 'Asia', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Article 347 trafficking thresholds, PSAPL possession penalty detail'),
  ('Cannigma — Cannabis laws in China', 'https://cannigma.com/regulation/cannabis-laws-china/', 'China', 'CN', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', 'Industrial hemp export market, 1985 Convention on Psychotropic Substances accession'),
  ('Leafwell — Is Marijuana Legal in China', 'https://leafwell.com/blog/is-marijuana-legal-in-china', 'China', 'CN', 'Asia', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '1985 cultivation ban, CBD food/medicine prohibition despite export'),
  ('Wikipedia — Cannabis in Comoros', 'https://en.wikipedia.org/wiki/Cannabis_in_Comoros', 'Comoros', 'KM', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', '1975-1978 legalization under Ali Soilih, current prohibition'),
  ('CannaConnection — Legal status of cannabis in Comoros', 'https://www.cannaconnection.com/blog/14828-legal-status-comoros', 'Comoros', 'KM', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'No near-term reform indicated'),
  ('Central Law — Costa Rica Medicinal Cannabis Regulatory Framework', 'https://central-law.com/en/costa-rica-medicinal-cannabis-an-evolving-regulatory-framework-and-investment-opportunities/', 'Costa Rica', 'CR', 'Latin America', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'Law 10113 license categories and terms, One-Stop Investment Window'),
  ('Costa Rica Immigration — Costa Rica Cannabis Law', 'https://costarica-immigration.com/costa-rica-cannabis-law/', 'Costa Rica', 'CR', 'Latin America', 2, 'html_snapshot', 'monthly', 'legal_analysis', '2024 recreational bill status, foreign investment rules'),
  ('High Times — Costa Rica Grants First Medical Cannabis Cultivation License', 'https://hightimes.com/news/costa-rica-grants-first-medical-cannabis-cultivation-license/', 'Costa Rica', 'CR', 'Latin America', 2, 'html_snapshot', 'monthly', 'trade_press', 'Real first-licensee example (Azul Wellness S.A.), 1% THC hemp threshold'),
  ('Leafwell — Is Marijuana Legal in Cote d''Ivoire', 'https://leafwell.com/blog/is-marijuana-legal-in-cote-divoire', 'Cote d''Ivoire', 'CI', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Law No. 88-686 (1988), 2022 Senate committee reform bill, real 2021 case example'),
  ('Wikipedia — Cannabis in Ivory Coast', 'https://en.wikipedia.org/wiki/Cannabis_in_Ivory_Coast', 'Cote d''Ivoire', 'CI', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', '1989-1990 cocoa crisis cultivation surge context')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable for any consumer/recreational/medical pathway. China has a large industrial hemp export industry (Yunnan and Heilongjiang "hemp hubs") with an NMPA cosmetics-approval pathway for CBD, but no domestic consumption market — cost structures apply only to export-oriented hemp fiber/cosmetic ingredient production, not consumer cannabis or CBD products.',
  legal_framework_summary = 'Cannabis is completely illegal in China for recreational and medical use, classified under the Criminal Law as equivalent to heroin, opium, and methamphetamine, with no exceptions. Personal possession of any quantity triggers administrative detention of 10-15 days plus fines up to 2,000 RMB under the Public Security Administration Punishments Law; possessing 200 grams or more crosses into criminal territory carrying sentences starting at three years, and Article 347 allows life imprisonment or the death penalty for trafficking 50+ grams of resin or 10+ kilograms of leaf cannabis. Despite this, China has never banned hemp cultivation for industrial purposes and is the world''s largest hemp producer, with government-sanctioned "hemp hubs" in Yunnan and Heilongjiang provinces growing fiber and CBD strictly for export — domestic sale and consumption of CBD in food, medicine, or consumer products has been banned since 2021, and CBD cosmetics require separate NMPA approval. Foreign nationals face the same zero-tolerance enforcement as citizens, typically resulting in detention, imprisonment, deportation, and a lifetime re-entry ban.',
  steps = '[{"step":"Industrial hemp export route only","detail":"Cultivation and export of fiber and CBD for international markets is permitted through licensed operations concentrated in Yunnan and Heilongjiang provinces — this is strictly an export/industrial channel with zero domestic consumer market access"},{"step":"CBD cosmetics route","detail":"A narrow NMPA approval pathway exists for CBD as a cosmetic ingredient; food, beverage, and medicinal CBD products remain banned domestically regardless of THC content"}]'::jsonb,
  key_regulators = '["National Medical Products Administration (NMPA) — cosmetics approval","Ministry of Public Security — narcotics enforcement","Customs — border seizure of CBD/cannabis products regardless of stated THC content"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming China''s massive industrial hemp export industry implies any domestic consumer legality — hemp/CBD produced in China is exclusively for export; domestic sale and consumption in food, medicine, or consumer products has been banned since 2021',
    'Bringing any CBD product into China expecting leniency because it is legal at the point of origin — customs treats CBD the same as high-THC cannabis products and routinely seizes it',
    'Assuming foreign nationals receive different treatment than citizens — enforcement is applied equally, with typical outcomes including detention, imprisonment, deportation, and a lifetime re-entry ban'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across multiple independent legal-analysis sources with consistent statutory citation (Article 347, PSAPL thresholds) and consistent detail on the hemp-export/domestic-ban dichotomy',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.cannabisregulations.ai/country-legality/china-marijuana')
WHERE country_iso2 = 'CN';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is currently illegal in Comoros for cultivation, sale, and possession, with no legal recreational or medical pathway as of the most recent available confirmation (September 2019). Notably, Comoros had a distinct historical period of legal cannabis: between January 1975 and May 1978, President Ali Soilih legalized cannabis as part of a broader set of radical youth-oriented reforms following his seizure of power — one of the few documented instances globally of a national government fully legalizing cannabis, only to later reverse the policy. No indication of any near-term legislative movement toward re-legalization has been identified in available sources.',
  steps = '[]'::jsonb,
  key_regulators = '["Comorian national police and judicial enforcement bodies (specific agency names not well documented in available English-language sources)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the 1975-1978 legalization period has any bearing on current law — cannabis has been illegal again for decades and there is no indication of movement to restore that earlier policy',
    'Assuming CBD or hemp products are treated separately from THC-containing cannabis — no such distinction is established in available Comorian legal sources',
    'Treating this entry as equally well-documented as larger jurisdictions — available English-language legal sourcing on Comoros is comparatively thin'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high on the core prohibition and the historical 1975-1978 legalization period, both consistently corroborated across multiple sources; lower confidence on granular penalty specifics, which are thinly documented',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Comoros')
WHERE country_iso2 = 'KM';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 18,
  estimated_cost_range = 'Six-year renewable licenses across four categories (cultivation/primary production, manufacturing, import of psychoactive derivatives, import of propagative material); fees are proportional to business size and nature per the Ministry of Agriculture and Livestock, with no self-cultivation option available at any scale',
  legal_framework_summary = 'Costa Rica legalized medical and therapeutic cannabis and industrial hemp under Law 10113 ("The Law for the Medical and Therapeutic Use of Cannabis and for the Industrial Use of Hemp"), signed March 2, 2022 — the country''s first cannabis legal framework. The law establishes distinct licensing categories for cultivation/primary production, manufacturing of psychoactive derivatives and medicines, and import of derivatives, finished products, or propagative material, each granted for a renewable six-year term by the Ministry of Health and Ministry of Agriculture and Livestock (MAG); home cultivation is explicitly prohibited, and unlicensed cultivation or sale carries 6-12 years imprisonment. Industrial hemp is defined at up to 1% THC by dry weight (more permissive than the 0.3% US standard) and is legal for food and industrial use. Recreational cannabis remains illegal, though personal possession in small doses (informally understood as roughly 1-8 grams) is not typically prosecuted in practice due to statutory ambiguity in the underlying Narcotics Law No. 8204, and a separate 2024 government-submitted recreational legalization bill remains under legislative discussion with no enactment as of 2026. The first medical cultivation license was granted to Azul Wellness S.A. in 2023.',
  steps = '[{"step":"Choose a license category","detail":"Apply for one of: cultivation/primary production, manufacturing of psychoactive derivatives/medicines, import of finished products, or import of propagative material — each is a distinct 6-year renewable license issued by Ministry of Health and/or MAG"},{"step":"Meet registration and compliance requirements","detail":"Register as an employer with the Costa Rican Social Security Fund (CCSS), obtain environmental and local government permits, and submit a sworn statement of no disqualifying prohibitions"},{"step":"Plan for traceability requirements","detail":"A seed-to-sale traceability system is being phased in; until fully operational, oversight runs through MAG, Ministry of Health, and the Costa Rica Institute on Drugs (ICD)"},{"step":"Do not plan around home cultivation","detail":"Self-cultivation for personal medical use is explicitly prohibited under Law 10113 — all cultivation must occur under a licensed commercial operation"}]'::jsonb,
  key_regulators = '["Ministry of Health (Ministerio de Salud)","Ministry of Agriculture and Livestock (MAG)","Costa Rica Institute on Drugs (ICD)","Costa Rican Foreign Trade Promotion Agency (PROCOMER) — One-Stop Investment Window coordination"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming home cultivation is available for medical patients — Law 10113 explicitly prohibits self-cultivation; all product must come from a licensed commercial operation via pharmacy or CCSS',
    'Assuming tourist or foreign medical cannabis prescriptions are honored — Costa Rica does not recognize foreign prescriptions and tourists cannot access the medical program',
    'Assuming the 2024 recreational legalization bill is close to passage — it remains under legislative discussion with no confirmed enactment timeline as of 2026'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across a specialized regulatory law firm analysis, multiple independent trade-press sources, and Wikipedia, including a real documented first-licensee example',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://central-law.com/en/costa-rica-medicinal-cannabis-an-evolving-regulatory-framework-and-investment-opportunities/')
WHERE country_iso2 = 'CR';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Cote d''Ivoire for both medical and recreational use under Law No. 88-686 (1988) on the suppression of trafficking and illicit use of narcotic drugs, with no distinction made between THC-rich cannabis and CBD/hemp products. Simple possession or consumption can carry 3-5 years imprisonment plus fines, and cultivation is prosecuted severely — a documented 2021 case saw a grower sentenced to 10 years imprisonment plus a fine of roughly 1,680 USD for a discovered cannabis field. The country has among the highest cannabis seizure rates in Africa, with cultivation notably surging after a 1989-1990 "cocoa crisis" made cannabis dramatically more profitable per hectare than the country''s traditional cocoa export crop. In May 2022, a Senate committee passed a bill reframing drug users as needing therapeutic/rehabilitative assistance rather than punishment, but available sources do not confirm this bill was subsequently signed into law or is currently in force — its enactment status should be verified before relying on it.',
  steps = '[]'::jsonb,
  key_regulators = '["Anti-drug police (PAD — Police Anti-Drogue)","Ministry of Interior and Security","Judicial enforcement under Law No. 88-686"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the 2022 Senate committee-passed rehabilitation-focused bill is current law — available sources confirm committee passage but do not confirm final enactment; verify current status before relying on a more lenient framework',
    'Assuming CBD or hemp products are treated separately from THC-containing cannabis — Cote d''Ivoire''s law makes no such distinction',
    'Underestimating enforcement severity for cultivation specifically — a documented 2021 case resulted in a 10-year sentence for a single discovered cannabis field, reflecting the country''s aggressive anti-trafficking posture'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high on the core prohibition and penalty structure, extensively corroborated across multiple independent sources including a specific documented case; medium on the 2022 reform bill''s final enactment status, which is not confirmed in available sources',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://leafwell.com/blog/is-marijuana-legal-in-cote-divoire')
WHERE country_iso2 = 'CI';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('CN','KM','CR','CI');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705220000','jurisdiction_playbooks_batch10_cn_km_cr_ci','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705220000_jurisdiction_playbooks_batch10_cn_km_cr_ci.sql

-- RECOVERY BEGIN 20260705230000_jurisdiction_playbooks_batch11_hr_cu_cy_cd.sql
-- Research batch 11 of jurisdiction_playbooks: Croatia, Cuba, Cyprus, DRC.
-- Croatia required discarding a fabricated "2026 Drug Reform Act" claim (full
-- recreational legalization + tourist dispensaries) contradicted by every other
-- source. DRC is flagged 'needs_review' (draft, not published): sources directly
-- conflict on whether a real medical/industrial cannabis licensing framework
-- exists (Wikipedia + named licensees) versus full illegality (multiple other
-- guides), and a peer-reviewed review could not access DRC's provisions at all.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Wikipedia — Cannabis in Croatia', 'https://en.wikipedia.org/wiki/Cannabis_in_Croatia', 'Croatia', 'HR', 'Europe', 2, 'html_snapshot', 'quarterly', 'reference', 'April 2025 domestic licensed production update, 2013 decriminalization detail'),
  ('Leafwell — Is Marijuana Legal in Croatia', 'https://leafwell.com/blog/is-marijuana-legal-in-croatia', 'Croatia', 'HR', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '7.5g/30-day medical dose cap, no MMJ card recognition'),
  ('Hemp King — Croatia and Hemp Law (CBD and THC)', 'https://hempking.eu/en/croatia-and-hemp-law-cbd-and-thc/', 'Croatia', 'HR', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '2019 amendment removing Cannabis Sativa L from narcotics list, Ministry of Agriculture oversight'),
  ('Wikipedia — Cannabis in Cuba', 'https://en.wikipedia.org/wiki/Cannabis_in_Cuba', 'Cuba', 'CU', 'Caribbean', 2, 'html_snapshot', 'quarterly', 'reference', 'Penalty structure, death-penalty moratorium since 2003'),
  ('CannaCarib — Cannabis in Cuba', 'https://www.cannacarib.net/cuba/', 'Cuba', 'CU', 'Caribbean', 2, 'html_snapshot', 'monthly', 'legal_analysis', '2022/2023 revised Penal Code confirmation, no reform indication'),
  ('High Life Global — Is Cannabis Legal in Cyprus', 'https://hghlfglbl.com/legalization/is-cannabis-legal-in-cyprus/', 'Cyprus', 'CY', 'Europe', 2, 'html_snapshot', 'monthly', 'legal_analysis', '2026 framing: medical/hemp regulated, recreational illegal'),
  ('Leafwell — Is Marijuana Legal in Cyprus', 'https://leafwell.com/blog/is-marijuana-legal-in-cyprus', 'Cyprus', 'CY', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Confirms legal-but-inaccessible medical program gap'),
  ('CannabisRegulations.ai — Cyprus CBD', 'https://www.cannabisregulations.ai/country-legality/cyprus-cbd', 'Cyprus', 'CY', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Cyprus Drugs Council/Pharmaceutical Services CBD oversight, Epidyolex GeSY reimbursement'),
  ('Wikipedia — Cannabis in the Democratic Republic of the Congo', 'https://en.wikipedia.org/wiki/Cannabis_in_the_Democratic_Republic_of_the_Congo', 'Democratic Republic of the Congo', 'CD', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Feb 2021 legalization directive, TMIG/Instadose Pharma DRC license — CONFLICTS with other sources claiming full illegality'),
  ('PMC — Status and Impacts of Cannabis Policies in Africa (systematic review)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9225416/', 'Democratic Republic of the Congo', 'CD', 'Africa', 1, 'html_snapshot', 'quarterly', 'academic', 'Peer-reviewed: DRC provisions "not accessible" through research method; notes 2017 EXMceuticals license despite no official government announcement'),
  ('LegalityLens — Is Cannabis Legal in DRC', 'https://legalitylens.com/is-cannabis-legal-in-democratic-republic-of-the-congo/', 'Democratic Republic of the Congo', 'CD', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Claims full illegality, no medical program — CONFLICTS with Wikipedia')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 12,
  estimated_cost_range = 'Domestic licensed medical cannabis production began April 2025 under specific commercial licensing (details of fee schedule not widely published); CBD/hemp businesses face standard EU agricultural registration costs; recreational-adjacent tourist retail does not exist',
  legal_framework_summary = 'Recreational cannabis is illegal in Croatia but decriminalized for personal use since 2013 — small-quantity possession is a misdemeanor carrying a fine of roughly HRK 5,000-20,000 (EUR 664-2,654), while cultivation or sale for profit remains a felony carrying a mandatory minimum 3-year prison sentence. Medical cannabis has been legal since October 2015 for a defined list of conditions (multiple sclerosis, cancer, AIDS, and others), accessed only via specialist-referred prescription through pharmacies, capped at 7.5 grams of THC per 30-day supply; Croatia does not recognize foreign medical cannabis cards. From April 2025, licensed domestic companies have been permitted to produce medical cannabis, which is expected to reduce costs and reliance on imports/black market. Separately, a 2019 amendment removed Cannabis Sativa L. from the narcotics list and shifted hemp oversight from the Ministry of Health to the Ministry of Agriculture, legalizing cultivation, processing, and sale of hemp/CBD products under 0.2% THC as an ordinary agricultural commodity. A "Lex Cannabis" bill proposing full recreational legalization was introduced in 2020 and has generated ongoing political discussion, but has not been enacted.',
  steps = '[{"step":"CBD/hemp route","detail":"Register as an agricultural/commercial operator under Ministry of Agriculture oversight; products must test at or below 0.2% THC and are sold as an ordinary commodity, not a controlled substance"},{"step":"Medical cannabis route","detail":"As of April 2025, apply for domestic production licensing to supply the prescription-only medical channel; patient access remains specialist-referral-only with a 7.5g/30-day THC dose cap"},{"step":"Do not assume recreational legalization","detail":"The 2020 Lex Cannabis bill for full recreational legalization remains unenacted; personal possession is decriminalized (fine-only) but there is no legal retail or tourist market"}]'::jsonb,
  key_regulators = '["Ministry of Health (medical cannabis prescribing framework)","Ministry of Agriculture (hemp/CBD oversight since 2019)","Croatian police (decriminalized-possession fine enforcement)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Relying on a fabricated claim of a sweeping 2026 "Drug Reform Act" with tourist dispensaries and full recreational legalization — this claim appeared in one low-quality source and is directly contradicted by every other source, including ones from the same month; no such reform has passed',
    'Assuming foreign medical cannabis cards are recognized — Croatia requires its own specialist-referral prescription process and does not honor foreign MMJ cards',
    'Assuming decriminalization means a legal retail market exists — there are no dispensaries or legal recreational retail channels; only personal possession carries reduced (fine-only) penalties'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high on the well-corroborated decriminalization/medical/hemp framework; a single fabricated source claiming full 2026 recreational legalization was identified and explicitly discarded',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Croatia')
WHERE country_iso2 = 'HR';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is entirely illegal in Cuba for recreational, medical, and industrial purposes under the revised Penal Code (Law No. 151 of 2022), with no exceptions and no signs of reform. Possession carries roughly 6 months to 3 years imprisonment; cultivation, production, and transit of larger quantities carry 4 to 20 years; international trafficking carries 15 to 30 years or, in the most severe cases, a death sentence — though Cuba has maintained a de facto moratorium on executions since its last one in April 2003. Import and export are prohibited, with no hemp or medical cannabis import channel of any kind; customs at international airports actively screens for and seizes cannabis, including CBD products, treating undeclared items the same regardless of THC content. Foreign nationals receive no special treatment. Despite strict enforcement, an underground market persists, particularly low-grade "brick weed," reflecting genuine domestic demand alongside zero legal supply.',
  steps = '[]'::jsonb,
  key_regulators = '["Cuban National Revolutionary Police","Customs (Aduana General de la República) — active screening at international airports"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming any CBD or hemp exception exists — Cuba draws no distinction between CBD and THC-containing cannabis; both are equally prohibited with no import channel',
    'Assuming regional liberalization trends (Jamaica, US states, Mexico) create any pressure for Cuban reform — the government has shown no indication of policy change and diplomatic/enforcement cooperation with the US on drug issues has been reported as strained or paused',
    'Underestimating cultivation penalties specifically — 4 to 20 years applies even for domestically-oriented small-scale growing operations, not just large trafficking rings'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — overwhelming, near-unanimous corroboration across more than a dozen independent sources with no meaningful conflicts on the core prohibition or penalty structure',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Cuba')
WHERE country_iso2 = 'CU';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 24,
  estimated_cost_range = 'Not standardized in public sources; EU single-market membership lets Cyprus-based cannabis firms passport services across the EU without separate national approval in each state, which materially lowers the effective cost of pan-EU market access relative to a non-EU production base',
  legal_framework_summary = 'Recreational cannabis is illegal in Cyprus and classified as a Class B substance under the Narcotic Drugs and Psychotropic Substances Law of 1977, carrying penalties up to 8 years imprisonment for possession (reduced to up to 2 years for offenders under 25). Medical cannabis was first legalized in January 2017 for advanced-stage cancer patients, then substantially expanded in February/April 2019 to cover additional conditions (chronic pain associated with cancer, HIV, degenerative motor-system diseases, rheumatism, neuropathy, glaucoma, Tourette''s syndrome, and Crohn''s disease) and to legalize cultivation, manufacture, import, and export. Despite this legal framework being in place since 2019, multiple independent 2026 sources consistently confirm that a functioning patient-access system was still not fully operational — patients could not routinely obtain certification or products through ordinary channels, with access effectively limited to exceptional Minister of Health approval on a case-by-case basis. Cyprus has a genuine climate advantage for cultivation and, as an EU member, can passport medical cannabis production/services across the EU single market. CBD products under 0.2% THC are widely and legally sold in pharmacies and specialty shops, regulated by the Cyprus Drugs Council and Ministry of Health, with ingestibles subject to EU Novel Food rules and Epidyolex reimbursed through the General Healthcare System (GeSY).',
  steps = '[{"step":"CBD retail route","detail":"Source EU-approved hemp-derived CBD under 0.2% THC; ingestible products must comply with EU Novel Food Regulation (EU) 2015/2283 and the Foodstuffs Law"},{"step":"Medical cultivation/export route","detail":"Apply under the 2019 legal framework for cultivation, manufacture, import, or export licensing — Cyprus''s EU membership and favorable climate make it attractive for pan-EU medical cannabis production, though the domestic patient-access system remains underdeveloped"},{"step":"Do not plan around domestic patient volume","detail":"Multiple 2026 sources confirm ordinary patients still cannot easily obtain certification or product through the legal medical framework; a market-entry plan premised on domestic dispensing volume is currently unrealistic"}]'::jsonb,
  key_regulators = '["Ministry of Health — Advisory Committee on Medical Cannabis Regulation","Cyprus Drugs Council","Pharmaceutical Services (medical-claim products, Epidyolex/GeSY reimbursement)","Cyprus Police (Class B enforcement)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the 2019 medical legalization means patients can currently access cannabis through ordinary prescription channels — multiple 2026 sources confirm this remains effectively non-operational for most patients, with access limited to exceptional Minister of Health approval',
    'Assuming CBD is an unregulated loophole — CBD oils in particular are treated as controlled and may only be sold through pharmacies in certain circumstances; product composition and point of sale still matter',
    'Overlooking the EU passporting advantage — a Cyprus-based licensed operation can potentially serve other EU markets without separate national approval, a structural advantage worth building into any market-entry plan'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — the legal-but-not-yet-operational medical program is consistently confirmed across multiple independent 2026 sources rather than being a source conflict; this is a stable, well-documented implementation gap',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Cyprus')
WHERE country_iso2 = 'CY';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 12,
  estimated_cost_range = 'Unresolved pending verification of which legal status is accurate (see confidence note) — if a genuine industrial/medical licensing framework exists per the Feb 2021 directive, costs would follow a pharmaceutical-grade licensing model similar to at least one confirmed international licensee (TMIG/Instadose Pharma DRC)',
  legal_framework_summary = 'The legal status of cannabis in the DRC is genuinely disputed across available sources and requires verification before being treated as settled. Wikipedia states that on February 27, 2021, the DRC enacted legislation establishing conditions for narcotics and psychotropic substances "exclusively for purposes that are medical, educational or scientific," legalizing cannabis for industrial, medicinal, and scientific use (recreational use remaining illegal), and that the first cultivation/export license under this framework was granted to TMIG/Instadose Pharma DRC. A peer-reviewed systematic review of African cannabis policy separately notes that a Canadian company, EXMceuticals, became licensed to grow psychotropic cannabis in the DRC as of 2017, despite no official government announcement — suggesting real licensing activity occurred with limited public transparency. However, multiple independent legal-guide sources (dated as recently as 2025-2026) instead describe cannabis, including CBD and medical use, as fully illegal in the DRC with no legal framework of any kind, and the same peer-reviewed review notes that DRC''s cannabis provisions were "not accessible" through its standard research method — indicating the underlying legal texts are difficult to verify even for academic researchers. Recreational use, regardless of which version is accurate, is illegal, and cannabis remains widely cultivated as a rural cash crop, particularly in Kasai, Bandundu, and Lower Congo provinces, with major trafficking routes through Ndjili International Airport (Kinshasa) and the port of Matadi.',
  steps = '[{"step":"Verify current legal status before proceeding","detail":"Given the direct conflict between sources describing a real medical/industrial/scientific licensing framework (with named licensees) versus sources describing blanket illegality, confirm the current status through direct engagement with DRC''s Ministry of Health or a local legal counsel before any commercial planning"},{"step":"If the licensing framework is confirmed active","detail":"Pursue cultivation/export licensing following the pattern of confirmed licensees (TMIG/Instadose Pharma DRC, EXMceuticals) — both entered via industrial/scientific-use channels rather than domestic retail"}]'::jsonb,
  key_regulators = '["Ministry of Health (per the disputed Feb 2021 directive)","DRC national police and judicial enforcement (recreational-use prohibition, uncontested across all sources)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Treating either version of DRC''s legal status as settled without independent verification — sources directly conflict on whether a real medical/industrial cannabis legal framework exists, and even a peer-reviewed academic review could not access DRC''s specific provisions',
    'Assuming recreational cannabis is legal under any interpretation — all sources agree recreational use remains illegal regardless of the industrial/medical framework dispute',
    'Assuming rural cultivation prevalence signals legal tolerance — cultivation is a significant informal cash crop but this does not resolve the question of a formal licensing framework''s existence or accessibility'
  ],
  status = 'draft', last_reviewed = CURRENT_DATE,
  confidence_label = 'medium — sources directly conflict on the core question of whether a genuine legal industrial/medical cannabis framework exists in the DRC; flagged for verification against DRC government sources or direct legal counsel before treating either version as authoritative',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_the_Democratic_Republic_of_the_Congo')
WHERE country_iso2 = 'CD';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('HR','CU','CY');

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'needs_review', last_researched_at = now(), last_researched_by = 'claude-agent',
    research_notes = 'Sources directly conflict on whether DRC has a real, active medical/industrial/scientific cannabis licensing framework (Wikipedia + named licensees TMIG/Instadose Pharma DRC, EXMceuticals) versus full illegality with no framework (multiple 2025-2026 legal guides). A peer-reviewed systematic review notes DRC provisions were not accessible through standard research methods. Needs verification via DRC Ministry of Health or local counsel.'
WHERE country_code = 'CD';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705230000','jurisdiction_playbooks_batch11_hr_cu_cy_cd','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705230000_jurisdiction_playbooks_batch11_hr_cu_cy_cd.sql

-- RECOVERY BEGIN 20260705233347_counterparty_profile_enrichment.sql
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705233347','counterparty_profile_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705233347_counterparty_profile_enrichment.sql

-- RECOVERY BEGIN 20260705234300_education_section_generator.sql
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260705234300','education_section_generator','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260705234300_education_section_generator.sql

-- RECOVERY BEGIN 20260706000000_jurisdiction_playbooks_batch12_dj_dm_do_ec.sql
-- Research batch 12 of jurisdiction_playbooks: Djibouti, Dominica, Dominican Republic, Ecuador.
-- Real, sourced content replacing draft stub rows. Ecuador's personal-possession
-- status is a genuine, well-documented legal gray area since a Nov 2023 repeal
-- of the quantity table (not a source conflict) -- described precisely rather
-- than picking a side.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Wikipedia — Cannabis in Djibouti', 'https://en.wikipedia.org/wiki/Cannabis_in_Djibouti', 'Djibouti', 'DJ', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Penalty structure, khat contrast, port trafficking role'),
  ('Sensi Seeds — Cannabis in Djibouti', 'https://sensiseeds.com/en/blog/countries/cannabis-in-djibouti-laws-use-history/', 'Djibouti', 'DJ', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'CBD/seed non-distinction, arid climate cultivation context'),
  ('US State Dept — 2022 Intl Religious Freedom Report: Dominica', 'https://www.state.gov/reports/2022-report-on-international-religious-freedom/dominica/', 'Dominica', 'DM', 'Caribbean', 1, 'html_snapshot', 'quarterly', 'government_official', '2020 decriminalization confirmation, Rastafarian sacramental tolerance in practice'),
  ('Wikipedia — Cannabis in Dominica', 'https://en.wikipedia.org/wiki/Cannabis_in_Dominica', 'Dominica', 'DM', 'Caribbean', 2, 'html_snapshot', 'quarterly', 'reference', 'Oct 2020 amendment: 28g possession + 3-plant cultivation decriminalized'),
  ('Herb.co — How to Buy Weed in Dominica 2026', 'https://herb.co/city-guides/buy-weed-dominica', 'Dominica', 'DM', 'Caribbean', 2, 'html_snapshot', 'monthly', 'trade_press', 'National Cannabis Advisory Committee, July 2025 symposium, no retail market yet'),
  ('US Embassy Santo Domingo — STEP Message: DR Marijuana Laws', 'https://do.usembassy.gov/step-message-dominican-republic-marijuana-laws-a-quick-guide-for-u-s-travelers/', 'Dominican Republic', 'DO', 'Caribbean', 1, 'html_snapshot', 'quarterly', 'government_official', 'Official US Embassy advisory: zero-tolerance confirmation, no CBD distinction'),
  ('Herb.co — How to Buy Weed in the Dominican Republic 2026', 'https://herb.co/city-guides/buy-weed-dominican-republic', 'Dominican Republic', 'DO', 'Caribbean', 2, 'html_snapshot', 'monthly', 'trade_press', 'Real Jan 2026 and March 2025 airport arrest cases, Law 50-88 hemp-fiber exclusions'),
  ('Wikipedia — Cannabis in the Dominican Republic', 'https://en.wikipedia.org/wiki/Cannabis_in_the_Dominican_Republic', 'Dominican Republic', 'DO', 'Caribbean', 2, 'html_snapshot', 'quarterly', 'reference', 'Law 50-88 (1988) tiered penalty thresholds'),
  ('Cuenca Expat Hub — Ecuador Cannabis Laws for Expats', 'https://www.cuencaexpathub.com/ecuador-cannabis-laws-for-expats-a-guide-to-hemp--legal-risks', 'Ecuador', 'EC', 'Latin America', 2, 'html_snapshot', 'monthly', 'legal_analysis', '2023 quantity-table repeal creating personal-possession gray area, 169 licensed operators/$40M by end 2023'),
  ('LegalClarity — Cannabis Laws in Ecuador', 'https://legalclarity.org/cannabis-laws-in-ecuador-is-it-legal/', 'Ecuador', 'EC', 'Latin America', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '2019/2020 medical and hemp legalization, Nov 2023 Noboa repeal detail'),
  ('BizLatin Hub — Legal Framework for Cannabis Cultivation in Ecuador', 'https://www.bizlatinhub.com/medicinal-cannabis-ecuador-legislation-spur-commercial-boom/', 'Ecuador', 'EC', 'Latin America', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Seven hemp license types under Ministerial Agreement 109-2020')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Djibouti for both recreational and medical purposes, with production, sale, and possession all carrying fines and up to 5 years imprisonment; sale and supply are treated as a much more serious offense carrying life imprisonment, though limited enforcement funding means trafficking laws are inconsistently applied. The law makes no distinction between cannabis and CBD, or between seeds and other plant parts, so both are equally illegal. Djibouti has no domestic hemp industry, partly because its arid terrain is poorly suited to cultivation and partly because cannabis use is not a major domestic issue — Djiboutians overwhelmingly prefer khat, a legal stimulant plant that is culturally central and consumes an estimated 20-40% of average household budgets, making cannabis reform politically low-priority. Djibouti''s port is a significant transit hub for cannabis trafficking from South and Southeast Asia to Africa, the Middle East, and Europe.',
  steps = '[]'::jsonb,
  key_regulators = '["Djiboutian national police and judicial enforcement bodies","Port of Djibouti customs (transit trafficking interdiction, resource-constrained)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming khat''s legal, culturally central status extends to cannabis — the two substances are treated completely differently under Djiboutian law, with khat legal and cannabis criminalized',
    'Assuming CBD or seeds are exempt — Djiboutian law draws no distinction between cannabis and CBD, or between seeds and other plant parts',
    'Assuming resource-constrained trafficking enforcement signals tolerance — funding limitations affect enforcement consistency, not legal status; occasional arrests, particularly in the capital, still occur'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across reference and specialized sources, with the khat/cannabis contrast independently confirmed by Library of Congress research',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Djibouti')
WHERE country_iso2 = 'DJ';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 24,
  estimated_cost_range = 'No cost for decriminalized personal possession/cultivation. No commercial medical/industrial licensing framework or fee schedule exists yet — the National Task Force appointed in 2022 and National Cannabis Advisory Committee (active 2025) are still developing regulatory proposals as of the most recent available reporting.',
  legal_framework_summary = 'Dominica decriminalized personal cannabis possession (up to 28 grams) and home cultivation (up to 3 plants) for adults via an October 26, 2020 amendment to the Drugs (Prevention of Misuse) Act, following years of political back-and-forth (a 2019 decriminalization proposal from Prime Minister Roosevelt Skerrit stalled in parliament before eventually passing). Public consumption remains prohibited (EC$1,500 fine, though it does not create a criminal record), and selling or importing cannabis without authorization can carry up to 14 years imprisonment and EC$200,000 in fines. There is no medical cannabis program yet: a National Task Force was appointed in 2022 to develop a regulatory framework, and a National Cannabis Advisory Committee held a National Cannabis Symposium in July 2025 working toward a Medicinal Cannabis Bill and licensing structure, but as of the most recent reporting no such framework has been enacted. Rastafarian communities continue to press for full sacramental legalization; authorities reportedly do not enforce the law against religious use in practice, but this remains an informal tolerance rather than a codified religious exemption.',
  steps = '[{"step":"Personal-use route","detail":"Adults may possess up to 28g and cultivate up to 3 plants without criminal prosecution; public consumption remains a fineable (non-criminal-record) offense"},{"step":"Monitor the medical/commercial framework in development","detail":"Track output from the National Cannabis Advisory Committee and the proposed National Cannabis Regulatory Commission — no licensing pathway exists yet, but Dominica has stated intent to develop one"}]'::jsonb,
  key_regulators = '["National Cannabis Advisory Committee","Commonwealth of Dominica Police Force","Ministry of Ecclesiastical Affairs, Family, and Gender Affairs (religious-freedom liaison on Rastafarian sacramental use)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming decriminalization means a medical or commercial market exists — no licensing framework has been enacted; Dominica remains at the policy-development stage as of the most recent reporting',
    'Assuming Rastafarian sacramental use is formally legalized — it is informally tolerated in enforcement practice but not codified as a religious exemption, unlike some neighboring islands',
    'Confusing Dominica (the Commonwealth of Dominica) with the Dominican Republic — they are entirely separate nations with different cannabis legal frameworks'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — well corroborated across official US State Department religious-freedom reporting, Wikipedia''s statutory detail, and current 2026 trade-press coverage of the ongoing regulatory development process',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Dominica')
WHERE country_iso2 = 'DM';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is fully illegal in the Dominican Republic for both recreational and medical use under Law 50-88 on Drugs and Controlled Substances (1988, amended by Laws 17-95 and 35-90), with the US Embassy in Santo Domingo issuing a formal advisory confirming zero-tolerance enforcement. Possession is tiered by quantity: 20 grams or less carries a minimum 6-month sentence; larger amounts escalate toward trafficking classification, with possession of more than one pound (454g) treated as trafficking carrying a minimum 5 years and maximum 20 years imprisonment plus a fine of at least RD$50,000; importation specifically can carry 5 to 30 years. The law does not recognize foreign medical marijuana cards or prescriptions, and CBD/hemp products are not clearly distinguished from THC-containing cannabis — travelers should not assume any THC-content exemption will be honored, despite the statute containing narrow textual exclusions for mature stalk fiber and seed-derived oil/cake. Real 2025-2026 enforcement cases confirm this is actively applied at airports: a US citizen was arrested at Puerto Plata''s Gregorio Luperón International Airport in January 2026 for 17 packages of suspected marijuana and 29 THC vapes, and a Canadian national was arrested at the same airport in March 2025 for 32 packages. Proposed medical cannabis legislation has circulated since around 2021 with continued advocacy, but no bill has passed as of 2026, and there is no evidence of imminent legalization despite periodic government discussion of modernizing Law 50-88 for other purposes.',
  steps = '[]'::jsonb,
  key_regulators = '["Dominican National Drug Control Directorate (DNCD)","Dominican Customs (DGA) — active canine/X-ray screening at international airports"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming any foreign medical marijuana card or prescription is recognized — the Dominican Republic explicitly does not honor these, per official US Embassy guidance',
    'Assuming CBD or hemp-derived products are treated differently from THC cannabis — the law does not clearly distinguish them, and real 2025-2026 arrest cases at Puerto Plata airport show active enforcement against travelers carrying cannabis products',
    'Mistaking beach/resort-area cannabis availability for legality — cannabis is regularly offered to tourists informally, but this reflects enforcement gaps in casual street-level availability, not legal tolerance, and airport/border enforcement remains strict'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — overwhelming corroboration including an official US Embassy advisory and multiple specific, dated 2025-2026 enforcement cases',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://do.usembassy.gov/step-message-dominican-republic-marijuana-laws-a-quick-guide-for-u-s-travelers/')
WHERE country_iso2 = 'DO';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 18,
  estimated_cost_range = 'Non-psychoactive hemp/CBD licensing: seven license types under Ministerial Agreement No. 109-2020 (import/commercialization of seeds, sowing/production of seeds, cultivation, processing, plant breeding/research, export of derivatives/biomass), open only to incorporated companies, non-transferable; by end of 2023 Ecuador had approved ~$40 million in cannabis-sector investment contracts across 169 licensed operators. Medical/psychoactive cannabis licensing runs through SETED (research) and separate pharmaceutical-production channels.',
  legal_framework_summary = 'Ecuador draws a sharp legal line between non-psychoactive cannabis/hemp (under 1% THC by dry weight — legal for therapeutic, scientific, medicinal, and industrial purposes under a licensing framework established via the 2019 medical cannabis law, a December 2019 Organic Law, and Ministerial Agreement No. 109-2020) and psychoactive cannabis/marijuana (1%+ THC — recreational use not permitted). Medical cannabis was legalized by the National Assembly in September 2019 (83-23 vote), with products capped at 1.0% THC and requiring a diagnosed medical justification; ARCSA Resolution No. ARCSA-DE-002-2021-MAFG later set sanitary technical THC limits for different product categories. Personal recreational possession is in a genuine, well-documented legal gray area rather than settled either way: a 2013 reform decriminalized possession up to 10 grams, but President Daniel Noboa repealed the specific drug-quantity table on November 24, 2023, as part of an anti-micro-trafficking campaign, removing the bright-line threshold without providing a clear replacement rule. Ecuador''s National Court of Justice has since clarified that simple possession for personal use is not automatically a crime, but left it to case-by-case judicial/prosecutorial determination whether a given quantity reflects personal use or trafficking intent — creating real, acknowledged legal risk for individuals rather than a settled decriminalized threshold.',
  steps = '[{"step":"Non-psychoactive hemp/CBD route","detail":"Apply for one of seven license types under Ministerial Agreement No. 109-2020 through the Ministry of Agriculture and Livestock (MAG); only incorporated/domiciled Ecuadorian entities qualify; THC must stay below 1%"},{"step":"Medical/psychoactive cannabis route","detail":"Engage ARCSA and the Ministry of Health for medicinal product registration (THC-based products capped per ARCSA Resolution ARCSA-DE-002-2021-MAFG); SETED separately licenses cultivation for scientific research"},{"step":"Do not rely on a specific personal-possession threshold","detail":"Since the November 2023 repeal of the 10g quantity table, there is no codified safe-harbor amount for personal use — the National Court of Justice has said simple possession is not automatically criminal, but case-by-case judicial interpretation determines the outcome"}]'::jsonb,
  key_regulators = '["Ministry of Agriculture and Livestock (MAG) — hemp/non-psychoactive cannabis licensing","Agency for Health Regulation, Control, and Surveillance (ARCSA) — medical product THC/sanitary standards","Technical Secretariat of Drugs (SETED) — scientific research cultivation licensing","National Court of Justice (case-by-case personal-use determination)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the pre-2023 10-gram personal possession threshold still applies — President Noboa repealed the specific drug-quantity table in November 2023, and no replacement bright-line threshold has been established',
    'Assuming a licensed hemp/industrial cannabis operation permits any psychoactive-cannabis activity — Ecuador maintains a strict THC-based dividing line (1% by dry weight) between the legal non-psychoactive framework and the separately regulated (and more restricted) psychoactive/medical channel',
    'Assuming personal cultivation for consumption is clearly protected — while some sources describe pre-2023 tolerance for a small number of personal plants, there is no exact codified law stating this, and the post-2023 gray area affects cultivation as much as possession'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — the hemp/medical licensing framework is extensively and consistently corroborated across multiple legal-analysis and industry sources; the post-2023 personal-possession gray area is itself consistently documented as genuinely unresolved (not a source conflict, but an acknowledged real ambiguity in Ecuadorian law)',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.cuencaexpathub.com/ecuador-cannabis-laws-for-expats-a-guide-to-hemp--legal-risks')
WHERE country_iso2 = 'EC';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('DJ','DM','DO','EC');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260706000000','jurisdiction_playbooks_batch12_dj_dm_do_ec','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260706000000_jurisdiction_playbooks_batch12_dj_dm_do_ec.sql

-- RECOVERY BEGIN 20260706000439_education_deep_regen.sql
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260706000439','education_deep_regen','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260706000439_education_deep_regen.sql

-- RECOVERY BEGIN 20260706010000_jurisdiction_playbooks_batch13_eg_sv_gq_er.sql
-- Research batch 13 of jurisdiction_playbooks: Egypt, El Salvador, Equatorial Guinea, Eritrea.
-- Real, sourced content replacing draft stub rows.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('CannabisRegulations.ai — Egypt marijuana', 'https://www.cannabisregulations.ai/country-legality/egypt-marijuana', 'Egypt', 'EG', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Law 182/1960 as amended by 122/1989, ANGA enforcement detail'),
  ('Sensi Seeds — Cannabis in Egypt', 'https://sensiseeds.com/en/blog/countries/cannabis-in-egypt-laws-use-history/', 'Egypt', 'EG', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Mustafa Soliman 2010 hemp seed oil case, Sinai cultivation detail'),
  ('LegalClarity — Is Weed Legal in El Salvador', 'https://legalclarity.org/is-weed-legal-in-el-salvador-what-the-law-says/', 'El Salvador', 'SV', 'Latin America', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Ley Reguladora statutory citation, 2022 state of exception context'),
  ('Leafwell — Is Marijuana Legal in El Salvador', 'https://leafwell.com/blog/is-marijuana-legal-in-el-salvador', 'El Salvador', 'SV', 'Latin America', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '2019 Zablah medical bill failure, penalty escalation history'),
  ('Wikipedia — Cannabis in Equatorial Guinea', 'https://en.wikipedia.org/wiki/Cannabis_in_Equatorial_Guinea', 'Equatorial Guinea', 'GQ', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'No arrests in living memory as of 2000, ministers/civil servants openly using'),
  ('Leafwell — Is Marijuana Legal in Equatorial Guinea', 'https://leafwell.com/blog/is-marijuana-legal-in-equatorial-guinea', 'Equatorial Guinea', 'GQ', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Cultural "sacred weed" status, ceremonial history'),
  ('Wikipedia — Cannabis in Eritrea', 'https://en.wikipedia.org/wiki/Cannabis_in_Eritrea', 'Eritrea', 'ER', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Penal code personal-use vs trafficking distinction, arid terrain limits cultivation'),
  ('Leafwell — Is Marijuana Legal in Eritrea', 'https://leafwell.com/blog/is-marijuana-legal-in-eritrea', 'Eritrea', 'ER', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '6-plant/12-month cultivation threshold, Italian-era historical hemp industry')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Egypt in all forms (including hashish and locally-grown "bango") under Anti-Narcotics Law No. 182 of 1960, as amended by Law No. 122 of 1989, which criminalizes cultivation, possession, sale, import, and export. Personal possession carries a minimum one-year prison sentence and fines starting at LE 1,000, often following lengthy pretrial detention; cultivation under Article 33 can carry life imprisonment with hard labor or the death penalty where trafficking intent is established, alongside fines of LE 100,000-500,000. There is no medical cannabis program, clinical trial pathway, or pharmacy stock of cannabinoid medicines, and the law does not distinguish CBD from THC-containing cannabis — a documented 2010 case saw a traveler face death-penalty charges for importing hemp seed oil. Despite the severe statutory framework, enforcement is genuinely inconsistent: cannabis has deep cultural roots (hashish cafes operate openly in many areas, and Sinai Peninsula cultivation is long-standing), and law enforcement is frequently lax toward personal use in practice, even as large-scale trafficking and import/export are prosecuted aggressively, particularly at international airports.',
  steps = '[]'::jsonb,
  key_regulators = '["Anti-Narcotics General Administration (ANGA), Ministry of Interior","Customs at Cairo, Hurghada, and Sharm El Sheikh airports (canine/X-ray screening)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming widespread cultural tolerance and open hashish-cafe culture signals legal tolerance for commercial activity or safety for foreigners — enforcement is genuinely inconsistent for personal use but foreign nationals receive no leniency, and import/export is prosecuted severely regardless of local social norms',
    'Bringing any CBD, hemp, or hash-derived product across Egyptian borders — the law draws no THC-content distinction, and a documented case saw a traveler face death-penalty charges for importing hemp seed oil',
    'Assuming Egypt is moving toward reform given its cannabis-friendly cultural reputation — there is no credible indication of any active legalization or decriminalization initiative as of 2026, and a prior 2018 reform proposal drew immediate political opposition and went nowhere'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across a dozen+ independent sources with consistent statutory citation and a specific documented case example',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.cannabisregulations.ai/country-legality/egypt-marijuana')
WHERE country_iso2 = 'EG';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in El Salvador for all purposes — recreational, medical, and industrial — under the Ley Reguladora de las Actividades Relativas a las Drogas, whose Article 3 lists cannabis among six prohibited drug categories and bans growing, producing, transporting, selling, possessing, and consuming it, with only a narrow exception for government-authorized scientific research or pharmaceutical manufacturing that functions rarely if at all in practice. Article 5 defines even unauthorized transport or storage as "illicit trafficking," a far broader category than typical drug-dealing. Possession penalties scale by quantity (roughly 1-3 years for under 2 grams, escalating sharply above that threshold into trafficking-level charges), and cultivation for any purpose — personal or commercial — can carry 10-15 years imprisonment, among the harshest cultivation penalties in the region. A 2019 bill from Deputy Francisco Zablah proposing a Ministry-of-Health-supervised medical cannabis framework created a study commission but was never enacted, and public support for reform remains very low (historically in the 8-31% range across surveys). Critically, El Salvador has operated under an ongoing "state of exception" since 2022 (implemented for gang-related security purposes) that suspends certain constitutional protections and permits prolonged detention without judicial review — this significantly raises the practical risk profile for anyone arrested on drug charges, including cannabis, beyond what the statute text alone suggests.',
  steps = '[]'::jsonb,
  key_regulators = '["National Civil Police (PNC)","Attorney General''s Office (Fiscalía General de la República)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming CBD or hemp-derived products are exempt — the law does not distinguish high-THC marijuana from low-THC hemp, and the US State Department explicitly warns that CBD products legal in the US are illegal in El Salvador',
    'Underestimating the impact of the 2022 state of exception — its suspension of standard due-process protections and permission for prolonged detention without judicial review materially increases risk exposure beyond ordinary statutory penalties',
    'Assuming El Salvador is likely to reform given broader Latin American trends — public support for legalization is among the lowest in the region, and the 2019 Zablah medical bill failed to advance despite a formal study commission'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across Wikipedia, multiple independent legal-analysis sources, and official US State Department travel guidance',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://legalclarity.org/is-weed-legal-in-el-salvador-what-the-law-says/')
WHERE country_iso2 = 'SV';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Equatorial Guinea for both recreational and medical use, with severe statutory penalties for production, sale, and possession. However, this is a distinctive case of near-total non-enforcement: cannabis, referred to locally as the "sacred weed of the people," has deep ceremonial and cultural significance, and multiple independent sources consistently report that it is openly used across all strata of society — including by government ministers and civil servants — with no recorded arrests for smoking or dealing cannabis in living memory as of a 2000 report. Cultivation is officially banned but widely practiced nationwide, often intercropped with cassava or banana plants, and some product is trafficked to neighboring Gabon via the Muni River. There is no legal industrial hemp, medical cannabis, or CBD framework of any kind.',
  steps = '[]'::jsonb,
  key_regulators = '["Equatorial Guinean national police and judicial enforcement bodies (documented as not enforcing personal-use provisions in practice)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the well-documented non-enforcement pattern creates any legal protection for commercial activity — the underlying law remains fully in force with severe on-paper penalties, and enforcement discretion could shift without warning, particularly for anything resembling organized commercial activity rather than personal cultural use',
    'Assuming this pattern is unique to cannabis specifically rather than reflecting broader governance and enforcement-capacity dynamics — treat any commercial plan as legally unprotected regardless of how consistently personal use has gone unprosecuted historically',
    'Assuming CBD or industrial hemp occupies a different legal category — no such distinction or framework exists; all cannabis activity falls under the same nominally severe prohibition'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — the illegal-but-unenforced pattern is unusually consistently corroborated across Wikipedia, Leafwell, CannaConnection, and independent travel/culture sources, with the "no arrests in living memory" claim specifically repeated across multiple independent sources',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Equatorial_Guinea')
WHERE country_iso2 = 'GQ';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Eritrea for both medical and recreational purposes, with the country maintaining one of the strictest drug regimes in the world. Eritrea''s Penal Code distinguishes personal use from trafficking more explicitly than many jurisdictions: purchasing a controlled drug or plant for personal use does not by itself make someone party to trafficking, and personal possession/use is treated as a "less serious" offense than sale or distribution, which can carry lengthy imprisonment. Cultivation of up to six plants for personal use is charged as possession (up to 12 months imprisonment), while larger-scale cultivation can carry up to 10 years. CBD is not legally distinguished from other cannabis products and is equally illegal. Eritrea''s arid climate and terrain limit cannabis cultivation relative to many African neighbors, though some domestic small-scale growing persists; the country briefly had a hemp industry under Italian colonial rule in the early 20th century. Eritrea is also used as a transit hub for cannabis trafficking from South/Southeast Asia toward Africa, Asia, and Europe, and its security forces are known to actively crack down on suspected drug activity.',
  steps = '[]'::jsonb,
  key_regulators = '["Eritrean national police and security forces (active anti-trafficking enforcement)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the Penal Code''s personal-use/trafficking distinction amounts to decriminalization — personal use remains a criminal offense (up to 12 months for cultivation of up to 6 plants), just classified as less severe than trafficking',
    'Assuming CBD is treated separately from THC-containing cannabis — no such distinction exists in Eritrean law',
    'Assuming Eritrea''s brief Italian-colonial-era hemp industry has any bearing on current law or signals future reform — no legalization plans exist, and Eritrea remains among Africa''s most restrictive jurisdictions on this topic'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across reference and legal-analysis sources, with the personal-use/trafficking Penal Code distinction independently confirmed by multiple sources',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Eritrea')
WHERE country_iso2 = 'ER';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('EG','SV','GQ','ER');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260706010000','jurisdiction_playbooks_batch13_eg_sv_gq_er','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260706010000_jurisdiction_playbooks_batch13_eg_sv_gq_er.sql

-- RECOVERY BEGIN 20260706020000_jurisdiction_playbooks_thailand_staleness_correction.sql
-- Correction: jurisdiction_playbooks.TH was stale, describing Thailand's
-- pre-June-2025 permissive recreational framework as current. In reality,
-- Thailand re-criminalized recreational cannabis on June 25, 2025 (Notification
-- on Controlled Herbs B.E. 2568), moving to a medical-only PT33-prescription
-- model, with a further Ministerial Regulation on Category 5 Narcotics
-- (extracts) effective April 26, 2026. Discovered incidentally while
-- researching Eritrea (a "Legality of cannabis" Wikipedia citation referenced
-- a June 2025 Independent article on the reversal) and verified directly.
-- This is a reminder that 'published' status needs periodic re-verification,
-- not just initial sourcing -- staleness on a trusted entry is worse than an
-- honest 'draft' stub.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Al Jazeera — Thailand moves to re-criminalise cannabis', 'https://www.aljazeera.com/news/2025/6/26/thailand-moves-to-re-criminalise-cannabis-in-blow-to-1bn-industry', 'Thailand', 'TH', 'Asia', 2, 'html_snapshot', 'monthly', 'news', 'June 25 2025 Notification on Controlled Herbs, medical-only restriction'),
  ('CannabisRegulations.ai — Thailand marijuana (2026 update)', 'https://www.cannabisregulations.ai/country-legality/thailand-marijuana', 'Thailand', 'TH', 'Asia', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'PT33 prescription system, April 2026 Ministerial Regulation on Category 5 Narcotics extract import/export'),
  ('Terms.Law — Thailand Cannabis Laws 2026', 'https://terms.law/Thai/cannabis/cannabis-2025-status.html', 'Thailand', 'TH', 'Asia', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'Shop closure statistics (7,297 of 18,433 closed by Feb 2026), public health impact data')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high',
  typical_timeline_months = 12,
  estimated_cost_range = 'Medical dispensary licensing requires on-site certified medical/traditional-medicine practitioner supervision and GACP-compliant cultivation; extract import/export licensing under the April 2026 Ministerial Regulation is limited to registered medical facilities, pharmacies, and herbal medicine shops with documented medical/research/commercial-extract purposes. The pre-2025 low-barrier retail/wellness-shop model no longer applies.',
  legal_framework_summary = 'Thailand''s 2022 decriminalization era ended on June 25, 2025, when the Ministry of Public Health issued a Notification on Controlled Herbs (B.E. 2568) restricting cannabis flower to medical use only — recreational sale and possession are once again illegal. Cannabis was not returned outright to the Category 5 narcotics list; instead, flowering buds are regulated as a controlled herb (lighter penalties than narcotics offenses, but still criminal for unlicensed recreational sale/possession), while extracts above 0.2% THC remain full Category 5 narcotics. To legally purchase, a buyer needs a PT33 prescription from a certified practitioner (valid up to 30 days) from a licensed dispensary with on-site medical supervision; public consumption carries fines up to 25,000 THB. A Ministerial Regulation on Category 5 Narcotics (Cannabis/Hemp Extracts) B.E. 2569, published March 26, 2026 and effective April 26, 2026, now separately governs extract import/export licensing through the Thai FDA and Office of the Narcotics Control Board. The policy reversal has had major market impact: of roughly 18,433 cannabis shops operating nationwide, 7,297 had closed by February 2026 after failing to meet the stricter medical-supervision licensing requirements, with further license expirations (4,587 in 2026, 5,210 in 2027) expected to continue shrinking the retail base. Foreign nationals visiting or living in Thailand should not rely on pre-2025 information describing Thailand as a permissive recreational market — that framework no longer exists.',
  steps = '[{"step":"Confirm current medical-only framework before any planning","detail":"Do not rely on 2022-2024-era descriptions of Thailand as a recreational market — the June 2025 reversal is definitive and enforced"},{"step":"Medical dispensary route","detail":"Operate under GACP cultivation standards with certified medical/traditional-medicine practitioner supervision; patients require a PT33 prescription (30-day validity) to purchase"},{"step":"Extract import/export route","detail":"Apply for Thai FDA / Office of the Narcotics Control Board licensing under the April 2026 Ministerial Regulation for cannabis/hemp extract import or export; limited to registered medical facilities, pharmacies, and herbal medicine shops"},{"step":"Plan for continued consolidation","detail":"Factor in further 2026-2027 license-renewal attrition (thousands of additional shop licenses expiring) when assessing retail-channel partners"}]'::jsonb,
  key_regulators = '["Thai Food and Drug Administration (Thai FDA)","Ministry of Public Health","Department of Thai Traditional and Alternative Medicine","Office of the Narcotics Control Board"]'::jsonb,
  common_pitfalls = ARRAY[
    'Relying on 2022-2024-era information describing Thailand as a permissive recreational cannabis market — this ended definitively on June 25, 2025, and is actively enforced with real shop closures and fines',
    'Assuming CBD/hemp extracts and flower are regulated identically — flower is a "controlled herb" with lighter penalties, while extracts above 0.2% THC remain full Category 5 narcotics under separate, stricter licensing',
    'Underestimating market contraction — nearly 40% of previously operating cannabis shops (7,297 of 18,433) had closed by February 2026 due to the stricter medical-supervision requirements, with further attrition expected through 2027'
  ],
  status = 'published',
  last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across Al Jazeera, Forbes, and multiple specialized legal-analysis sources with consistent dates and mechanism detail; this update corrects a materially stale prior entry that still described the pre-June-2025 permissive framework',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.aljazeera.com/news/2025/6/26/thailand-moves-to-re-criminalise-cannabis-in-blow-to-1bn-industry')
WHERE country_iso2 = 'TH';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260706020000','jurisdiction_playbooks_thailand_staleness_correction','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260706020000_jurisdiction_playbooks_thailand_staleness_correction.sql

-- RECOVERY BEGIN 20260706030000_jurisdiction_playbooks_batch14_ee_sz_et_fk.sql
-- Research batch 14 of jurisdiction_playbooks: Estonia, Eswatini, Ethiopia, Falkland Islands.
-- Real, sourced content replacing draft stub rows.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('MyCannabis — Is Weed Legal in Estonia 2026', 'https://www.mycannabis.com/is-weed-legal-in-estonia/', 'Estonia', 'EE', 'Europe', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'Real 2026 CBD-shop enforcement case, 2026 penalty-softening-without-legalization stance'),
  ('LegalClarity — Is Weed Legal in Estonia', 'https://legalclarity.org/is-weed-legal-in-estonia-recreational-and-medical-laws/', 'Estonia', 'EE', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Sept 2022 THC limit update to 0.3% for EU alignment, SAM medical process'),
  ('Prohibition Partners — Estonia Medical Cannabis Legislation', 'https://prohibitionpartners.com/european-cannabis-markets/european-medical-cannabis-legislation-map/estonia/', 'Estonia', 'EE', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'SAM special-permit unlicensed-medicine process detail'),
  ('CannabisRegulations.ai — Eswatini marijuana', 'https://www.cannabisregulations.ai/country-legality/eswatini-marijuana', 'Eswatini', 'SZ', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '1922 Opium Act, 1929 Pharmacy Act, penalty structure'),
  ('High Times — Eswatini Introduces Medical Cannabis Legislation', 'https://hightimes.com/news/african-county-of-eswatini-introduces-medical-cannabis-legislation/', 'Eswatini', 'SZ', 'Africa', 2, 'html_snapshot', 'monthly', 'trade_press', '2020 bill tabled, resurfaced May 2023, 3/4 supermajority requirement, MRA structure'),
  ('Sensi Seeds — Cannabis in Eswatini', 'https://sensiseeds.com/en/blog/countries/cannabis-in-eswatini-laws-use-history/', 'Eswatini', 'SZ', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'PSIQ 2019 exclusive export license detail'),
  ('Reuters — Swaziland cannabis farmers fear businesses could go up in smoke', 'https://reuters.screenocean.com/record/1418191', 'Eswatini', 'SZ', 'Africa', 1, 'html_snapshot', 'quarterly', 'news', 'Real 2019 case: Profile Solutions Inc. 10-year export license alongside ongoing small-farmer prosecution'),
  ('Leafwell — Is Marijuana Legal in Ethiopia', 'https://leafwell.com/blog/is-marijuana-legal-in-ethiopia', 'Ethiopia', 'ET', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Border enforcement, Shashamane Rastafarian informal tolerance, 2019 field destruction'),
  ('AllAboutEthio — Everything About Cannabis in Ethiopia (May 2026)', 'https://allaboutethio.com/everything-about-cannabis-in-ethiopia-laws-price-and-quality.html', 'Ethiopia', 'ET', 'Africa', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'Tiered penalty structure: 6mo simple possession vs 10yr growing/selling'),
  ('Leafwell — Is Marijuana Legal in the Falkland Islands', 'https://leafwell.com/blog/is-marijuana-legal-in-the-falkland-islands', 'Falkland Islands', 'FK', 'South America (UK Overseas Territory)', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Misuse of Drugs Ordinance 1987 detail, cannabis-specific reduced penalty tier, 2022 CBD exception (1mg THC/component)'),
  ('MercoPress — Falklands approves CBD importation/sale (official ExCo decision)', 'https://en.mercopress.com/2022/07/28/falklands-approves-importation-possession-use-and-sale-of-cannabidiol-cbd', 'Falkland Islands', 'FK', 'South America (UK Overseas Territory)', 1, 'html_snapshot', 'quarterly', 'government_official', 'Official Executive Council 2022 CBD legalization decision')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 18,
  estimated_cost_range = 'Industrial hemp cultivation requires a government license, EU-certified seed, and agricultural-authority registration (standard EU hemp-farming compliance costs, no unusual barrier). Medical cannabis access runs through a case-by-case State Agency of Medicines (SAM) special-permit process for unlicensed medicine — not a commercial licensing pathway.',
  legal_framework_summary = 'Recreational cannabis is illegal in Estonia under the Narcotic Drugs and Psychotropic Substances and Precursors Act, with possession of up to 7.5 grams treated as a misdemeanor (fine up to EUR 1,200 or detention up to 30 days) and larger quantities, sale, or trafficking prosecuted as a criminal offense under Penal Code Section 184 (1-10 years, up to 15 for aggravated trafficking). Medical cannabis has technically been available since 2005 but has no broad program: a specialist doctor must justify use after exhausting licensed treatments, and the application goes through the State Agency of Medicines (SAM) as an unlicensed-medicine special permit — an onerous, case-by-case process most pharmacies rarely handle. Industrial hemp cultivation is legal under government license using EU-certified seed, with the THC limit updated in September 2022 to 0.3% to align with new EU guidelines; hemp-derived CBD products are legal as cosmetics or "technical" goods but ingestible CBD sits in an EU Novel Food gray zone with no clear domestic authorization. Enforcement of the hemp/THC boundary is active: in one documented case, testing of products seized from six CBD shops found many exceeding the legal THC limit, leading to criminal proceedings. Senior officials have repeatedly ruled out broader legalization even while considering softer treatment-focused penalties for users.',
  steps = '[{"step":"Industrial hemp/CBD route","detail":"Obtain a government cultivation license using EU-certified seed; keep THC at or below 0.3%; market CBD as cosmetic/technical product given ingestible CBD''s unresolved EU Novel Food status"},{"step":"Medical cannabis route (narrow)","detail":"A specialist doctor must justify a case-by-case special permit application through the State Agency of Medicines (SAM) after exhausting licensed treatment options; this is not a scalable commercial channel"}]'::jsonb,
  key_regulators = '["Police and Border Guard Board (PPA) — enforcement","Prosecutor''s Office (Riigiprokuratuur)","Ministry of Social Affairs — drug policy","State Agency of Medicines (SAM) — medical cannabis special permits"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming decriminalized possession signals a functioning medical cannabis market — the SAM special-permit process is onerous, case-by-case, and most pharmacies have little experience handling it',
    'Assuming ingestible CBD is clearly legal because cosmetic CBD is — ingestible products remain in an EU Novel Food authorization gray zone with no clear domestic green light',
    'Underestimating THC-limit enforcement — a documented case saw multiple CBD shops face criminal proceedings after products tested over the legal limit'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across multiple 2026-dated legal-analysis sources with consistent statutory citation and a specific documented enforcement case',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.mycannabis.com/is-weed-legal-in-estonia/')
WHERE country_iso2 = 'EE';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 24,
  estimated_cost_range = 'General cultivation/possession/sale carries no legal cost basis (illegal). A narrow existing licensed-export channel has been granted to select companies (e.g., a 2019 exclusive license to PSIQ, a separate 10-year license to Profile Solutions Inc.) under conditions including strict GMP global health standards — terms not standardized or open to ordinary applicants. A broader medical-legalization bill (tabled 2020, resurfaced 2023) proposes a new Medicines Regulatory Authority but requires a 3/4 supermajority in both the House of Assembly and Senate and has not been confirmed passed.',
  legal_framework_summary = 'Cannabis (locally insangu or dagga) is illegal in Eswatini under the Opium and Habit-Forming Drugs Act 1922 and Pharmacy Act 1929/1992 amendment, with simple possession carrying up to 5 years and sale/trafficking/cultivation for sale up to 15 years plus fines up to EUR/€15,000. Despite this, Eswatini is among the world''s largest per-capita illicit cannabis producers, driven by the globally sought-after "Swazi Gold" landrace strain grown in the Hhohho and Lubombo regions, much of which is trafficked into South Africa despite illegality on both sides of the border. Genuinely complicating the picture: select companies have already been granted narrow cultivation/export licenses under executive authority predating any general reform — a 2019 exclusive license to PSIQ and a separate 10-year license to Florida-based Profile Solutions Inc. — even as small-scale local farmers continue to be prosecuted and have crops destroyed under the general prohibition. A broader medical cannabis legalization bill, first tabled by the Ministry of Health in 2020 and resurfaced in May 2023, would establish a Medicines Regulatory Authority with import/export/wholesale powers, but requires a three-fourths vote in both the House of Assembly and Senate, and no source confirms it has passed as of the most recent reporting. Local growers and the Eswatini Cannabis Association have criticized the bill as favoring large companies over the small farmers who currently sustain their families through illicit cultivation.',
  steps = '[{"step":"General cultivation/sale — do not attempt","detail":"Remains illegal and actively prosecuted for anyone without an existing executive-granted license"},{"step":"Existing narrow executive-license precedent","detail":"At least two companies (PSIQ, Profile Solutions Inc.) have obtained cultivation/export licenses under direct government/executive authorization predating general legalization — precedent exists but terms are not standardized or publicly open"},{"step":"Monitor the pending medical legalization bill","detail":"Track whether the Ministry of Health bill (tabled 2020, resurfaced 2023) achieves the required 3/4 supermajority in both legislative houses; the proposed Medicines Regulatory Authority would centralize import/export/wholesale licensing"}]'::jsonb,
  key_regulators = '["Royal Eswatini Police Service","Eswatini Revenue Service Customs (King Mswati III Intl Airport, Matsapha Airport)","Ministry of Health (proposed Medicines Regulatory Authority under pending bill)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming existing export licenses (PSIQ, Profile Solutions Inc.) reflect an open, general licensing regime — these were granted under narrow executive authority ahead of any general legal reform, and ordinary applicants have no clear standardized pathway',
    'Assuming the pending Ministry of Health bill has passed — it requires a 3/4 supermajority in both legislative houses and no source confirms enactment as of the latest reporting',
    'Overlooking the domestic political economy risk — local farmers and the Eswatini Cannabis Association have organized opposition to the bill''s current structure, viewing it as favoring large companies over smallholder growers who currently sustain the illicit trade'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — well corroborated across Wikipedia, Sensi Seeds, Reuters, High Times, and Semafor Africa, with real documented licensee examples on both the narrow-export and general-prohibition sides',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.cannabisregulations.ai/country-legality/eswatini-marijuana')
WHERE country_iso2 = 'SZ';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Ethiopia for both medical and recreational use under the Ethiopian Criminal Code, enforced by the Ethiopian Federal Police Counter-Narcotic Division and regulated alongside other substances by the Ethiopian Food and Drug Administration and Control Authority. Penalties are tiered: simple possession carries up to roughly 6 months imprisonment, while growing, transporting, selling, or storing cannabis carries up to 10 years imprisonment and a fine of approximately $3,334. CBD products are equally illegal as a cannabis derivative. Ethiopian police actively monitor borders and points of entry, and cannabis seeds cannot be sent via mail. Despite the legal framework, enforcement varies by location: in Shashamane — a town with deep historical ties to the Rastafari movement — local law enforcement reportedly tolerates personal cannabis use informally, though this is not a legal exemption and Shashamane remains subject to the same national law as the rest of the country; cultivation enforcement is not similarly relaxed, as evidenced by a 2019 police operation destroying 17 acres of marijuana fields nationwide, including in Shashamane. A 2019 industry report estimated Ethiopia''s cannabis market could be worth up to $9.8-10 billion if legalized, with an estimated 7.1 million domestic users, but the government has shown no indication of pursuing reform.',
  steps = '[]'::jsonb,
  key_regulators = '["Ethiopian Federal Police Counter-Narcotic Division","Ethiopian Food and Drug Administration and Control Authority"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming Shashamane''s informal tolerance of personal Rastafarian cannabis use constitutes a legal exemption — it does not; the town remains subject to the same national prohibition, and cultivation enforcement (including field destruction) still occurs there',
    'Assuming CBD is treated separately from THC-containing cannabis — Ethiopian law makes no such distinction, and CBD products are equally illegal',
    'Assuming the large estimated market value ($9.8-10 billion) signals imminent government interest in legalization — no legislative movement has been reported despite years of industry reports highlighting the economic opportunity'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across multiple independent legal-analysis sources, including a May 2026-dated source confirming the tiered penalty structure remains current',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://leafwell.com/blog/is-marijuana-legal-in-ethiopia')
WHERE country_iso2 = 'ET';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 12,
  estimated_cost_range = 'CBD retail entry: standard business registration plus compliance with English/Spanish bilingual labeling requirements for products containing no more than 1mg THC per component part. No commercial cultivation or medical cannabis licensing pathway exists — the Governor/Chief Medical Officer license mechanism under Section 7 is narrow and has not been used to establish a general market.',
  legal_framework_summary = 'Cannabis is illegal in the Falkland Islands for both medical and recreational use under the Misuse of Drugs Ordinance 1987, which does not distinguish between the two — importation, exportation, production, supply, possession, and cultivation are all prohibited regardless of purpose, and there is no medical marijuana program comparable to the UK''s. Cannabis is classified as a Class B drug, but the territory''s government has specifically reduced cannabis-specific penalties below the general Class B tier: importation/exportation carries up to 7 years imprisonment and a fine up to £25,000 (versus 14 years/£125,000 for other Class B drugs), reflecting a deliberate cannabis-specific mitigation within an otherwise strict ordinance. Section 7 allows the Governor or Chief Medical Officer to license specific activities (e.g., authorized medical research/prescription) as lawful, but this exception is narrow and has not produced a functioning patient-access system. In July 2022, the Executive Council approved a specific exception legalizing the importation, possession, use, and retail sale of CBD products containing no more than 1 milligram of THC per component part, provided products are in original packaging with English/Spanish labeling — bringing the territory''s CBD access roughly in line with the UK''s.',
  steps = '[{"step":"CBD retail route","detail":"Source or sell CBD products containing no more than 1mg THC per component part, in original packaging with English and/or Spanish labeling, per the 2022 Executive Council exception"},{"step":"Do not plan around cultivation or medical cannabis","detail":"Section 6 bans cultivation of any Cannabis genus plant (including hemp) except under rare Governor/Minister of Health authorization; no general licensing pathway exists"}]'::jsonb,
  key_regulators = '["Falkland Islands Governor / Chief Medical Officer (Section 7 licensing authority)","Royal Falkland Islands Police","Executive Council of the Falkland Islands (CBD exception policy)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming UK medical cannabis legality extends to the Falkland Islands — it is a separate British Overseas Territory with its own ordinance, and no medical marijuana program exists locally',
    'Assuming any hemp cultivation is permitted — Section 6''s ban on "any plant of the genus Cannabis" explicitly includes hemp, with cultivation authorization reserved for rare Governor/Minister of Health cases',
    'Selling CBD products exceeding the 1mg-THC-per-component-part threshold or lacking the required English/Spanish labeling — these fall outside the narrow 2022 exception and remain fully illegal'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated directly by an official Falkland Islands Executive Council announcement (via MercoPress) plus independent legal-analysis detail on the ordinance''s cannabis-specific penalty structure',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.mercopress.com/2022/07/28/falklands-approves-importation-possession-use-and-sale-of-cannabidiol-cbd')
WHERE country_iso2 = 'FK';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('EE','SZ','ET','FK');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260706030000','jurisdiction_playbooks_batch14_ee_sz_et_fk','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260706030000_jurisdiction_playbooks_batch14_ee_sz_et_fk.sql

-- RECOVERY BEGIN 20260706040000_jurisdiction_playbooks_batch15_dk_fo_fj_fi.sql
-- Research batch 15 of jurisdiction_playbooks: Denmark, Faroe Islands, Fiji, Finland.
-- Denmark was skipped in the earlier alphabetical pass (sits between DRC and
-- Djibouti) and is caught up here. Real, sourced content replacing draft stubs.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('LegalClarity — Is Cannabis Legal in Denmark', 'https://legalclarity.org/is-cannabis-legal-in-denmark-the-law-explained/', 'Denmark', 'DK', 'Europe', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'Euphoriant Substances Act, 2026 reimbursement figures, four prescribing frameworks'),
  ('Business of Cannabis — Denmark Legalises Medical Cannabis Permanently', 'https://businessofcannabis.com/denmark-legalises-medical-cannabis-permanently-but-ludicrous-subsidy-gap-remains/', 'Denmark', 'DK', 'Europe', 2, 'html_snapshot', 'monthly', 'trade_press', 'Bill L135 detail, four distinct prescribing frameworks, reimbursement system criticism'),
  ('Herb.co — How to Buy Weed in Denmark 2026', 'https://herb.co/city-guides/buy-weed-denmark', 'Denmark', 'DK', 'Europe', 2, 'html_snapshot', 'monthly', 'trade_press', 'Christiania closure 2024, enhanced penalty zone, 30-day medical import limit'),
  ('Leafwell — Is Marijuana Legal in the Faeroe Islands', 'https://leafwell.com/blog/is-marijuana-legal-in-the-faeroe-islands', 'Faroe Islands', 'FO', 'Europe', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '11-product list, no flower, no MMJ cards, cultivation ban'),
  ('Local.fo — Faroe cannabis enforcement and Cannabis Party context', 'https://local.fo/faroe-coppers-carry-out-huge-cannabis-operation-in-torshavn-meanwhile-cannabis-party-all-but-announces-it-will-run-for-parliament/', 'Faroe Islands', 'FO', 'Europe', 2, 'html_snapshot', 'quarterly', 'news', 'Local enforcement posture, political reform movement context'),
  ('Blimburn Seeds — Is Weed Legal in Fiji', 'https://blimburnseeds.com/blog/news-and-law/is-weed-legal-in-fiji/', 'Fiji', 'FJ', 'Oceania', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '2022 industrial hemp exception, 2024 medical-export policy framework'),
  ('Leafwell — Is Marijuana Legal in Fiji', 'https://leafwell.com/blog/is-marijuana-legal-in-fiji', 'Fiji', 'FJ', 'Oceania', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'August 2022 hemp Schedule 1 removal detail, named political advocates'),
  ('GanjaVacations — How to Buy Weed in Fiji 2026', 'https://www.ganjavacations.net/how-to-buy-weed-in-fiji-cannabis-laws-penalties-2026/', 'Fiji', 'FJ', 'Oceania', 2, 'html_snapshot', 'monthly', 'trade_press', 'Illicit Drugs Control Act 2004 confirmation, no legal grey zones for visitors'),
  ('CannabisRegulations.ai — Finland marijuana', 'https://www.cannabisregulations.ai/country-legality/finland-marijuana', 'Finland', 'FI', 'Europe', 2, 'html_snapshot', 'monthly', 'legal_analysis', 'Huumausainelaki 373/2008, Fimea special-permit process, Tulli import enforcement'),
  ('CannaInsider — Is Marijuana Legal in Finland (May 2026)', 'https://cannainsider.com/articles/is-weed-legal-in-finland/', 'Finland', 'FI', 'Europe', 2, 'html_snapshot', 'monthly', 'legal_analysis', '2026 parliamentary rejection of legalization proposal by large margin'),
  ('Cannigma — Cannabis Laws in Finland', 'https://cannigma.com/regulation/cannabis-laws-finland/', 'Finland', 'FI', 'Europe', 2, 'html_snapshot', 'quarterly', 'reference', '2019 citizens'' initiative, Green League party program detail')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 12,
  estimated_cost_range = 'Licensing for cultivation/production/import/distribution under the permanent program runs through the Danish Medicines Agency. Patient reimbursement: state covers 50% of costs up to DKK 20,000 (~€2,700) per 12-month period (100% for terminally ill), so patients pay up to DKK 10,000 out of pocket before the subsidy caps out.',
  legal_framework_summary = 'Recreational cannabis is illegal in Denmark under the Euphoriant Substances Act (1955, amended), applying equally to residents and visitors; possession alone can bring fines (commonly 2,000+ DKK) or jail time. Denmark operates one of Europe''s most developed medical cannabis frameworks: a pilot program launched January 2018 became a permanent legislative framework on January 1, 2026 under Bill L135, formally adopted by parliament in April 2025. Under the permanent program, any doctor (not just specialists) may prescribe medical cannabis for any condition they judge appropriate, across four distinct frameworks: fully authorized pharmaceutical products (Sativex, Epidyolex), pilot-programme-approved products (like Stenocare''s oil range), unlicensed special-dispensation products (Nabilone, Marinol), and custom pharmacy-compounded magistral products. Roughly 1,800 patients received treatment annually with about 20,000 prescriptions filled since 2018. Christiania''s historically tolerated open cannabis market (Pusher Street) was dismantled in 2024 amid gang violence, and Copenhagen Police created an enhanced-penalty zone around the area from January 2024. CBD is legal under a 0.2% THC threshold for cosmetics/food-adjacent products, but the Danish Medicines Agency treats the only legal ingestible CBD products as prescription-only.',
  steps = '[{"step":"Medical cannabis licensing route","detail":"Apply to the Danish Medicines Agency for cultivation, production, import, or distribution authorization under the permanent program (Bill L135, effective Jan 1 2026); product can be domestically grown or imported as finished product"},{"step":"Understand the four prescribing frameworks","detail":"Authorized pharma products (Sativex, Epidyolex) have the strongest evidence base; pilot-programme and unlicensed/magistral routes offer broader but less-established options depending on patient need"},{"step":"Do not plan around Christiania or informal retail","detail":"Pusher Street''s open cannabis market was permanently dismantled in 2024, and an enhanced-penalty zone has applied in the area since January 2024"}]'::jsonb,
  key_regulators = '["Danish Medicines Agency (Lægemiddelstyrelsen) — licensing, prescribing guidance, Central Reimbursement Register","Danish Patient Safety Authority — driving-impairment criteria","Ministry of the Interior and Health","Copenhagen Police (Christiania enforcement zone)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming Christiania still offers a workable tourist cannabis-buying route — Pusher Street''s open market was permanently dismantled in 2024 and an enhanced-penalty zone has applied since January 2024',
    'Assuming the reimbursement system is straightforward — a widely criticized imbalance has concentrated an outsized share of the ~85% government reimbursement rate at a single pharmacy, a structural issue the permanent law carried over from the pilot largely unchanged',
    'Assuming any CBD product is a casual loophole — the Danish Medicines Agency treats the only legal ingestible CBD products as prescription-only, distinct from cosmetic/technical CBD'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across the Danish Medicines Agency-sourced reporting, multiple trade-press outlets, and a licensed operator (Stenocare) directly engaged in the legislative process',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://legalclarity.org/is-cannabis-legal-in-denmark-the-law-explained/')
WHERE country_iso2 = 'DK';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 18,
  estimated_cost_range = 'No licensing pathway for cultivation exists (illegal for both medical and recreational purposes). Medical access is limited to 11 pre-approved imported products dispensed by prescription; costs are patient-borne with no equivalent to Denmark''s reimbursement structure identified in available sources.',
  legal_framework_summary = 'Recreational cannabis use is "completely forbidden" under the Faroese Policy on Alcohol and Drugs, which explicitly aims to keep the islands drug-free. Medical cannabis is legal but far narrower than in Denmark (of which the Faroe Islands is a self-governing part): only 11 specific cannabis-based products are approved for prescription, none of which include raw flower or buds, and the Faroes do not use medical marijuana cards. A doctor''s prescription is required, granted only as a last-resort option after other treatments have failed, and cultivation is illegal even for approved medical patients — patients cannot grow their own supply under any circumstance. There is no indication the Faroe Islands will adopt Denmark''s broader pilot-turned-permanent medical program; a local "Cannabis Party" campaign has pushed for legalization (medical first, recreational eventually) but has not achieved parliamentary representation, and police enforcement (including proactive night patrols in areas known for cannabis use) remains active.',
  steps = '[{"step":"Narrow medical route only","detail":"A doctor may prescribe from a fixed list of 11 approved cannabis-based products (no flower) as a last-resort treatment after other options have failed; no MMJ card system exists"},{"step":"Do not plan around cultivation","detail":"Growing cannabis is illegal in the Faroe Islands for both medical and recreational purposes, with no exception for approved patients"}]'::jsonb,
  key_regulators = '["Faroese Ministry of Health","Faroe Islands Police","Faroese pharmacies (limited to the 11-product approved list)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming Denmark''s broader medical cannabis program (including the 2026 permanent framework) extends to the Faroe Islands — the Faroes maintain a distinct, much narrower 11-product list with no flower and no MMJ cards',
    'Assuming any home cultivation is possible for medical patients — cultivation is banned outright regardless of prescription status',
    'Assuming political reform is imminent — a local Cannabis Party campaign exists but has not achieved parliamentary representation, and police enforcement remains active'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across Leafwell''s detailed program description and independent local news on enforcement posture and political context',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://leafwell.com/blog/is-marijuana-legal-in-the-faeroe-islands')
WHERE country_iso2 = 'FO';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 18,
  estimated_cost_range = 'Industrial hemp (under 1% THC) was removed from Schedule 1 of the Illicit Drugs Control Act in August 2022, permitting import, possession, cultivation, sale, and supply — standard agricultural licensing costs apply, no unusual barrier identified. General cannabis cultivation/sale for any THC-bearing product remains illegal with no licensing pathway.',
  legal_framework_summary = 'Cannabis is classified as a prohibited/dangerous drug under the Fiji Illicit Drugs Control Act 2004, with possession, cultivation, and distribution all criminal offenses; possession can carry imprisonment (some sources cite up to 20 years depending on quantity and criminal history, others describe shorter terms for smaller amounts). There is no domestic medical cannabis program, though registered pharmacists are nominally permitted to manufacture extracts/tinctures of "Indian hemp" under older statutory language — a provision no other source confirms is actively used. A significant carve-out exists for industrial hemp: in August 2022, Fiji''s parliament removed hemp (defined as cannabis containing less than 1% THC) from Schedule 1 of the Illicit Drugs Control Act, legalizing its importation, possession, cultivation, sale, and supply — a move championed by MPs seeking an alternative industry to Fiji''s declining sugar sector. In 2024, the government separately endorsed a policy framework to investigate the potential export of medical cannabis, though domestic medical use remains off the table and this remains at the investigative-policy stage rather than an operative licensing regime. Despite legal risk, cannabis remains widely available through Fiji''s black market and is a significant illicit export via inter-island trafficking routes.',
  steps = '[{"step":"Industrial hemp route","detail":"Import, cultivate, sell, or supply hemp (under 1% THC) under the August 2022 Schedule 1 removal — this is the only currently operative legal cannabis-adjacent pathway"},{"step":"Monitor the medical-export policy framework","detail":"Track development of the 2024-endorsed policy framework investigating medical cannabis export; as of the most recent reporting this remains investigative, not an operative license regime, and domestic medical use is explicitly excluded"}]'::jsonb,
  key_regulators = '["Fiji Police Force (Illicit Drugs Control Act enforcement)","Ministry of Health (nominal pharmacist extract-manufacturing provision)","Ministry responsible for the 2024 medical-cannabis-export policy framework"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the 2022 industrial hemp exception or 2024 medical-export policy discussion means general cannabis is legal — recreational and general medical cannabis (THC-bearing) remain fully illegal with active police enforcement',
    'Assuming the 2024 medical-export policy framework is an operative licensing regime — available sources describe it as investigative/exploratory, not yet a functioning program, and domestic medical use remains excluded entirely',
    'Assuming Rastafari cultural presence signals legal tolerance — recreational marijuana use is not legally permitted regardless of religious or cultural context'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — well corroborated across multiple independent legal-analysis sources with consistent detail on the August 2022 hemp exception and named political advocates',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://leafwell.com/blog/is-marijuana-legal-in-fiji')
WHERE country_iso2 = 'FJ';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 18,
  estimated_cost_range = 'No licensing pathway for cultivation exists (illegal). Medical access requires a Fimea special permit (erityislupa) applied for by a physician on behalf of an individual patient — not a scalable commercial channel. CBD/hemp: standard EU agricultural compliance costs for cultivation under the 0.2% THC limit; ingestible CBD products face EU Novel Food authorization costs with no product yet approved.',
  legal_framework_summary = 'Recreational cannabis is illegal in Finland under the Narcotics Act (Huumausainelaki 373/2008) and Chapter 50 of the Penal Code, which transpose UN Single Convention scheduling into domestic law; a basic narcotics offense carries up to 2 years imprisonment and an aggravated offense up to 10 years, though police/prosecutors retain discretion to waive charges (day-fines) for small personal-use amounts. Medical cannabis has been available since 2008 through Fimea (the Finnish Medicines Agency), which issues case-by-case special permits (erityislupa) under Section 21f of the Medicines Act after a physician certifies standard therapies have failed; uptake remains very small (roughly 250-500 patients), with Sativex the only product holding full Finnish marketing authorization and Bedrocan/Bediol/Bedica imported from the Netherlands via special permit accounting for most other dispensed product. CBD sits in a narrow, EU-Novel-Food-constrained lane: pure CBD is not itself scheduled as a narcotic, but Fimea has held since 2019 (reaffirmed 2022) that any CBD product marketed with health claims requires pharmaceutical marketing authorization, and no ingestible CBD product has completed EU Novel Food authorization, so Finnish authorities consider such products non-marketable; hemp cultivation under 0.2% THC is legal for industrial/cosmetic purposes. As recently as 2026, Finnish lawmakers rejected the latest citizen-initiated legalization proposal by a large margin, continuing a pattern (a 2019 decriminalization petition with ~59,600 signatures also did not result in legislative change), even as the Green League party has included cannabis legalization/regulation in its official program since 2021.',
  steps = '[{"step":"Industrial hemp/CBD route","detail":"Cultivate under 0.2% THC for industrial/cosmetic use; avoid health claims on CBD products, since Fimea treats health-claim CBD as requiring pharmaceutical marketing authorization; do not market ingestible CBD without EU Novel Food clearance, which no product has yet obtained"},{"step":"Medical cannabis route (narrow)","detail":"A physician applies to Fimea for a case-by-case special permit after documenting that standard therapies have failed; most product beyond Sativex is imported from the Netherlands via the Office for Medicinal Cannabis"}]'::jsonb,
  key_regulators = '["Finnish Medicines Agency (Fimea) — special permits, CBD health-claim enforcement","Tulli (Finnish Customs) — active narcotics-import interdiction, including mail-order seizures","Valvira and Ruokavirasto — food/novel-food oversight for CBD products","Finnish police and prosecutors (Chapter 50 Penal Code enforcement)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Relying on a fabricated claim of "licensed dispensaries open to adults 21+" citing the US 2018 Farm Bill — this appeared in one low-quality templated source and is nonsensical for Finland (a US federal law has no bearing on Finnish law); no dispensaries or adult-use market exist',
    'Assuming CBD products are broadly legal for ingestion — Fimea treats health-claim CBD as requiring drug marketing authorization, and no ingestible CBD product has completed EU Novel Food authorization, making such products effectively non-marketable',
    'Assuming the 2026 legalization proposal''s parliamentary rejection signals settled policy — citizen-initiative pressure and Green League party advocacy continue, so monitor for renewed legislative activity'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across Wikipedia, Fimea-referencing legal-analysis sources, and a May 2026-dated source confirming the recent parliamentary rejection; one fabricated low-quality source was identified and discarded',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.cannabisregulations.ai/country-legality/finland-marijuana')
WHERE country_iso2 = 'FI';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('DK','FO','FJ','FI');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260706040000','jurisdiction_playbooks_batch15_dk_fo_fj_fi','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260706040000_jurisdiction_playbooks_batch15_dk_fo_fj_fi.sql

-- RECOVERY BEGIN 20260706220724_seed_mainstream_media_source_registry.sql
-- Repair stub: migration 20260706220724 (seed_mainstream_media_source_registry) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260706220724','seed_mainstream_media_source_registry','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260706220724_seed_mainstream_media_source_registry.sql

-- RECOVERY BEGIN 20260706221013_create_editorial_items_table.sql
-- Editorial content pipeline: mainstream-media cannabis news/commentary,
-- fully separate from ia_signals (trade/regulatory intelligence).
-- No confidence score, no TRADE action — this is read-only editorial content.

CREATE TABLE IF NOT EXISTS editorial_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id         uuid REFERENCES source_registry(id),
  snapshot_id       uuid REFERENCES source_snapshots(id),
  headline          text NOT NULL,
  summary           text NOT NULL,
  why_it_matters    text,
  outlet_name       text,
  source_url        text,
  country           text,
  region            text,
  language          text,
  tone              text,
  published_at      timestamptz,
  used_in_digest_at timestamptz,
  stage             text NOT NULL DEFAULT 'qualified' CHECK (stage IN ('qualified','rejected','archived')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_editorial_items_stage_created ON editorial_items (stage, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_editorial_items_unused ON editorial_items (used_in_digest_at) WHERE used_in_digest_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_editorial_items_country ON editorial_items (country);

ALTER TABLE editorial_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY editorial_items_public_read ON editorial_items
  FOR SELECT
  USING (stage = 'qualified');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260706221013','create_editorial_items_table','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260706221013_create_editorial_items_table.sql

-- RECOVERY BEGIN 20260706221146_add_editorial_headlines_to_daily_digest.sql
ALTER TABLE daily_digest
ADD COLUMN IF NOT EXISTS editorial_headlines jsonb;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260706221146','add_editorial_headlines_to_daily_digest','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260706221146_add_editorial_headlines_to_daily_digest.sql

-- RECOVERY BEGIN 20260706221210_create_run_editorial_digest_function.sql
-- Restore the exact production-owned body for migration 20260706221210.
-- The previous stub omitted public._editorial_digest_jobs, which
-- 20260713213101 alters, and the run_editorial_digest function it backs.

-- Mirrors run_daily_digest()'s async fire/collect pattern, but sources
-- editorial_items (mainstream media) instead of ia_signals (trade signals),
-- and prompts Claude with genuine editorial framing rather than B2B intelligence framing.

CREATE TABLE IF NOT EXISTS _editorial_digest_jobs (
  request_id  bigint PRIMARY KEY,
  digest_date date NOT NULL,
  item_ids    text[] NOT NULL,
  collected   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.run_editorial_digest()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'net', 'vault', 'extensions'
AS $function$
declare
  v_key text;
  v_items jsonb;
  v_item_ids text[];
  v_req bigint;
  v_pre text := 'You are the editor of a global cannabis news digest for a general audience — not a trade or industry briefing. Below is a JSON array of candidate news items drawn from mainstream (non-cannabis-industry) news outlets worldwide. Select the ~8 most interesting or globally significant items (fewer if fewer are given), covering a healthy geographic spread where possible. For each, write a sharp original headline (max 110 chars, your own words) and keep the editorial why_it_matters sentence. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"headline": string, "why_it_matters": string, "market": string (country or "Global"), "item_id": string (the id field from the input item you used)}. Order by editorial importance, not commercial value.';
begin
  if exists (select 1 from daily_digest where digest_date = current_date and editorial_headlines is not null) then
    return jsonb_build_object('ok',true,'skipped','editorial digest exists for today');
  end if;

  perform 1 from _editorial_digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    update _editorial_digest_jobs j set collected = true
    where j.digest_date = current_date and not j.collected
      and j.created_at < now() - interval '1 hour'
      and not exists (select 1 from net._http_response r where r.id = j.request_id);

    with resp as (
      select j.request_id, j.item_ids,
             (safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text') as claude_text,
             r.status_code
      from _editorial_digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, item_ids, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, item_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    upsert as (
      insert into daily_digest (digest_date, headlines, markets, editorial_headlines, status, generated_at)
      select current_date, '[]'::jsonb, '{}', o.p, 'published', now()
      from ok o
      on conflict (digest_date) do update
        set editorial_headlines = excluded.editorial_headlines,
            updated_at = now()
      returning id
    ),
    mark_used as (
      update editorial_items e set used_in_digest_at = now()
      from ok o
      where e.id::text = any(o.item_ids) and exists (select 1 from upsert)
      returning e.id
    ),
    done as (
      update _editorial_digest_jobs j set collected = true
      from parsed p
      where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'published', exists(select 1 from upsert),
      'items_marked', (select count(*) from mark_used))
    into v_items;

    return coalesce(v_items, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  if v_key is null then return jsonb_build_object('ok',false,'reason','anthropic_api_key not in vault'); end if;

  select jsonb_agg(jsonb_build_object(
           'id', e.id, 'headline', e.headline, 'summary', e.summary,
           'why_it_matters', e.why_it_matters, 'country', e.country,
           'outlet_name', e.outlet_name, 'tone', e.tone, 'created_at', e.created_at)),
         array_agg(e.id::text)
  into v_items, v_item_ids
  from (
    select * from editorial_items
    where stage = 'qualified' and used_in_digest_at is null
      and created_at > now() - interval '3 days'
    order by created_at desc
    limit 40
  ) e;

  if v_items is null or jsonb_array_length(v_items) < 3 then
    return jsonb_build_object('ok',true,'skipped','fewer than 3 unused editorial items in last 3 days',
      'available', coalesce(jsonb_array_length(v_items),0));
  end if;

  v_req := net.http_post(
    url := 'https://api.anthropic.com/v1/messages',
    headers := jsonb_build_object('x-api-key', v_key, 'anthropic-version','2023-06-01','content-type','application/json'),
    body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',2500,
      'messages', jsonb_build_array(jsonb_build_object('role','user','content',
        v_pre || E'\n\nITEMS:\n' || v_items::text))),
    timeout_milliseconds := 60000
  );

  insert into _editorial_digest_jobs (request_id, digest_date, item_ids)
  values (v_req, current_date, v_item_ids);

  return jsonb_build_object('ok',true,'phase','fire','request_id',v_req,'items_sent',jsonb_array_length(v_items));
end $function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260706221210','create_run_editorial_digest_function','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260706221210_create_run_editorial_digest_function.sql

-- RECOVERY BEGIN 20260706221328_add_source_type_to_extract_candidates.sql
-- Repair stub: migration 20260706221328 (add_source_type_to_extract_candidates) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260706221328','add_source_type_to_extract_candidates','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260706221328_add_source_type_to_extract_candidates.sql

-- RECOVERY BEGIN 20260706224253_add_public_insert_policy_supplier_applications.sql
-- Repair stub: migration 20260706224253 (add_public_insert_policy_supplier_applications) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260706224253','add_public_insert_policy_supplier_applications','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260706224253_add_public_insert_policy_supplier_applications.sql

-- RECOVERY BEGIN 20260706224356_grant_insert_supplier_applications_public.sql
-- Repair stub: migration 20260706224356 (grant_insert_supplier_applications_public) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260706224356','grant_insert_supplier_applications_public','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260706224356_grant_insert_supplier_applications_public.sql

-- RECOVERY BEGIN 20260706232524_revert_unused_supplier_applications_public_access.sql
-- Repair stub: migration 20260706232524 (revert_unused_supplier_applications_public_access) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260706232524','revert_unused_supplier_applications_public_access','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260706232524_revert_unused_supplier_applications_public_access.sql

-- RECOVERY BEGIN 20260707000000_ia_signals_intel_tier_rls.sql
-- =============================================================================
-- Fix tier-gated RLS on ia_signals + ia_signal_embeddings
-- =============================================================================
-- Problem:
--   ia_signals_admin_operator_all checks user_roles.role IN ('admin','operator')
--   user_roles is for internal Harbourview staff only.
--   Stripe subscribers get user_profiles.tier = 'intel' | 'operator'.
--   Intel/operator paying subscribers have NO user_roles row → zero rows returned.
--
-- Fix:
--   Keep admin_operator_all for full CRUD (internal ops).
--   Add intel_read SELECT policy that checks user_profiles.tier instead.
--   Operator tier inherits intel read (tierAtLeast logic mirrored in SQL).
-- =============================================================================

-- ── ia_signals ────────────────────────────────────────────────────────────────

-- Read: intel + operator tiers (Stripe subscribers)
DROP POLICY IF EXISTS ia_signals_intel_tier_read ON public.ia_signals;
CREATE POLICY ia_signals_intel_tier_read
  ON public.ia_signals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.tier IN ('intel', 'operator')
    )
  );

-- ── ia_signal_embeddings ──────────────────────────────────────────────────────
-- Same pattern — intel/operator can SELECT their signal embeddings.
-- (The search RPC is SECURITY DEFINER so it bypasses RLS, but direct
--  table access from the client SDK needs this policy too.)

DROP POLICY IF EXISTS ia_signal_embeddings_intel_tier_read ON public.ia_signal_embeddings;
CREATE POLICY ia_signal_embeddings_intel_tier_read
  ON public.ia_signal_embeddings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.tier IN ('intel', 'operator')
    )
  );

-- ── signal_subscriptions — already correct (user_self policy) ─────────────────
-- No change needed: signal_subscriptions uses auth.uid() = user_id which is
-- correct. The subscribe API enforces tier gating at the application layer.

-- ── Indexes to support the new policy predicate ───────────────────────────────
-- user_profiles.tier lookups in RLS predicates hit this on every row-check.
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier
  ON public.user_profiles (id, tier);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707000000','ia_signals_intel_tier_rls','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707000000_ia_signals_intel_tier_rls.sql

-- RECOVERY BEGIN 20260707094500_signals_digest_step1_coverage_batch17.sql
-- Repair stub: migration 20260707094500 (signals_digest_step1_coverage_batch17) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707094500','signals_digest_step1_coverage_batch17','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707094500_signals_digest_step1_coverage_batch17.sql

-- RECOVERY BEGIN 20260707094631_run_signal_extraction_provider_fallback_and_circuit_breaker.sql
-- Repair stub: migration 20260707094631 (run_signal_extraction_provider_fallback_and_circuit_breaker) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707094631','run_signal_extraction_provider_fallback_and_circuit_breaker','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707094631_run_signal_extraction_provider_fallback_and_circuit_breaker.sql

-- RECOVERY BEGIN 20260707094647_platform_health_surface_extraction_outage.sql
-- Repair stub: migration 20260707094647 (platform_health_surface_extraction_outage) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707094647','platform_health_surface_extraction_outage','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707094647_platform_health_surface_extraction_outage.sql

-- RECOVERY BEGIN 20260707100803_manual_editorial_items_2026_07_07.sql
-- Repair stub: migration 20260707100803 (manual_editorial_items_2026_07_07) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707100803','manual_editorial_items_2026_07_07','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707100803_manual_editorial_items_2026_07_07.sql

-- RECOVERY BEGIN 20260707100830_publish_editorial_digest_2026_07_07.sql
-- Repair stub: migration 20260707100830 (publish_editorial_digest_2026_07_07) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707100830','publish_editorial_digest_2026_07_07','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707100830_publish_editorial_digest_2026_07_07.sql

-- RECOVERY BEGIN 20260707102235_manual_editorial_items_emerging_markets.sql
-- Repair stub: migration 20260707102235 (manual_editorial_items_emerging_markets) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707102235','manual_editorial_items_emerging_markets','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707102235_manual_editorial_items_emerging_markets.sql

-- RECOVERY BEGIN 20260707102301_append_emerging_markets_to_digest.sql
-- Repair stub: migration 20260707102301 (append_emerging_markets_to_digest) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707102301','append_emerging_markets_to_digest','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707102301_append_emerging_markets_to_digest.sql

-- RECOVERY BEGIN 20260707111223_remove_public_assets_listing_policy.sql
-- Repair stub: migration 20260707111223 (remove_public_assets_listing_policy) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707111223','remove_public_assets_listing_policy','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707111223_remove_public_assets_listing_policy.sql

-- RECOVERY BEGIN 20260707120000_country_education_overlay.sql
-- Country/module-specific education overlay. Falls back to the existing
-- generic MODULE_TOPICS lookup in MobileCommandCentre.tsx whenever no
-- published row exists for a given country_iso2 + module_key. Reuses the
-- review-status vocabulary from lib/education/types.ts so this plugs into
-- the existing claim-review gate rather than inventing a parallel one.

create table if not exists country_education_overlay (
  id            uuid primary key default gen_random_uuid(),
  country_iso2  text not null,
  module_key    text not null,
  role_id       text,
  topics        jsonb not null,
  action_label  text not null,
  source_ids    uuid[] not null default '{}',
  review_status text not null default 'review_pending',
  reviewer      text,
  last_verified_at timestamptz,
  updated_at    timestamptz not null default now(),
  constraint country_education_overlay_review_status_check
    check (review_status in (
      'verified_primary_source','verified_professional_body','verified_peer_reviewed',
      'verified_secondary_source','conflicting_sources','stale_source','jurisdiction_unclear',
      'clinical_review_required','legal_review_required','review_pending','do_not_publish'
    )),
  unique (country_iso2, module_key, role_id)
);

alter table country_education_overlay enable row level security;

drop policy if exists "public read published country overlays" on country_education_overlay;

create policy "public read published country overlays"
  on country_education_overlay for select
  using (review_status in ('verified_primary_source','verified_professional_body','verified_peer_reviewed','verified_secondary_source'));


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707120000','country_education_overlay','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707120000_country_education_overlay.sql

-- RECOVERY BEGIN 20260707185511_grant_anon_insert_supplier_profiles.sql
-- Repair stub: migration 20260707185511 (grant_anon_insert_supplier_profiles) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707185511','grant_anon_insert_supplier_profiles','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707185511_grant_anon_insert_supplier_profiles.sql

-- RECOVERY BEGIN 20260707192916_manual_editorial_items_emerging_markets_batch2.sql
-- Repair stub: migration 20260707192916 (manual_editorial_items_emerging_markets_batch2) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707192916','manual_editorial_items_emerging_markets_batch2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707192916_manual_editorial_items_emerging_markets_batch2.sql

-- RECOVERY BEGIN 20260707192929_append_emerging_markets_batch2_to_digest.sql
-- Repair stub: migration 20260707192929 (append_emerging_markets_batch2_to_digest) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707192929','append_emerging_markets_batch2_to_digest','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707192929_append_emerging_markets_batch2_to_digest.sql

-- RECOVERY BEGIN 20260707193633_backfill_published_at_editorial_headlines.sql
-- Repair stub: migration 20260707193633 (backfill_published_at_editorial_headlines) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707193633','backfill_published_at_editorial_headlines','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707193633_backfill_published_at_editorial_headlines.sql

-- RECOVERY BEGIN 20260707193718_fix_run_editorial_digest_published_at.sql
-- Repair stub: migration 20260707193718 (fix_run_editorial_digest_published_at) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707193718','fix_run_editorial_digest_published_at','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707193718_fix_run_editorial_digest_published_at.sql

-- RECOVERY BEGIN 20260707194140_replace_lesotho_source_industry_to_mainstream.sql
-- Repair stub: migration 20260707194140 (replace_lesotho_source_industry_to_mainstream) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707194140','replace_lesotho_source_industry_to_mainstream','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707194140_replace_lesotho_source_industry_to_mainstream.sql
