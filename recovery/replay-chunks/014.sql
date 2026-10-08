
-- RECOVERY BEGIN 20260719230517_fix_editorial_digest_fallback_status_code_durability.sql
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
-- version 20260719230517.
--
-- Rewriting this file cannot affect production: 20260719230517 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- Companion to fix_digest_fallback_status_code_durability: same status_code
-- durability fix applied to run_editorial_digest(), which has the identical
-- net._http_response-join blind spot in its own tier-degradation checks.

CREATE OR REPLACE FUNCTION public.run_editorial_digest()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'net', 'vault', 'extensions'
AS $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_items jsonb;
  v_item_ids text[];
  v_provider text := null;
  v_attempts int;
  v_failures int;
  v_pre text := 'You are the editor of Harbourview''s Daily Wire, a global cannabis news digest for a general audience -- not a trade or industry briefing. Below is a JSON array of candidate items, each from a mainstream (non-cannabis-industry) news outlet or a government source, published within the last 7 days. Select up to 8 of the most interesting or globally significant items (fewer if fewer qualify) with a strong bias toward emerging and historically underreported cannabis markets -- small or unusual jurisdictions, not the usual US/Canada/Germany/UK/Australia stories. You may include at most ONE major-market story, and only if it is genuinely globally significant this week; omit it entirely if nothing meets that bar. For each selected item, rewrite it as an original short editorial of roughly 150-250 words in Harbourview''s voice: analytical, globally-minded, measured, no hype or cannabis-culture slang, no promotional language, and no direct quotes over a few words. Ground every claim in the source material provided -- do not invent facts, figures, or context not present in the input. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"headline": string (max 110 chars, your own words), "why_it_matters": string (the full ~150-250 word editorial body), "market": string (country name, or "Global"), "item_id": string (the id field from the input item you used)}. Order by editorial importance.';
begin
  if exists (select 1 from daily_digest where digest_date = current_date and editorial_headlines is not null and jsonb_array_length(editorial_headlines) > 0) then
    return jsonb_build_object('ok',true,'skipped','editorial digest exists for today');
  end if;

  update _editorial_digest_jobs j set collected = true, status_code = 0
  where j.digest_date = current_date and not j.collected
    and j.created_at < now() - interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id = j.request_id);

  perform 1 from _editorial_digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    with resp as (
      select j.request_id, j.item_ids, j.provider, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text
      from _editorial_digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, item_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, item_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    enriched as (
      select o.request_id, o.item_ids,
        (select jsonb_agg(elem || jsonb_build_object(
                  'published_at', ei.published_at,
                  'source_url', ei.source_url,
                  'outlet_name', ei.outlet_name))
         from jsonb_array_elements(o.p) as elem
         left join editorial_items ei on ei.id::text = elem->>'item_id') as p
      from ok o
    ),
    upsert as (
      insert into daily_digest (digest_date, headlines, markets, editorial_headlines, status, generated_at)
      select current_date, '[]'::jsonb, '{}', e.p, 'published', now()
      from enriched e
      on conflict (digest_date) do update
        set editorial_headlines = excluded.editorial_headlines,
            status = 'published',
            updated_at = now()
      returning id
    ),
    mark_used as (
      update editorial_items e set used_in_digest_at = now()
      from ok o where e.id::text = any(o.item_ids) and exists (select 1 from upsert)
      returning e.id
    ),
    mark_collected as (
      update _editorial_digest_jobs j set collected = true, status_code = p.status_code
      from parsed p where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'provider', (select provider from parsed),
      'published', exists(select 1 from upsert),
      'items_marked', (select count(*) from mark_used))
    into v_items;

    return coalesce(v_items, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  select jsonb_agg(jsonb_build_object(
           'id', e.id, 'headline', e.headline, 'summary', e.summary,
           'why_it_matters', e.why_it_matters, 'country', e.country,
           'outlet_name', e.outlet_name, 'tone', e.tone, 'published_at', e.published_at)),
         array_agg(e.id::text)
  into v_items, v_item_ids
  from (
    select * from editorial_items
    where stage = 'qualified' and used_in_digest_at is null
      and coalesce(published_at, created_at) > now() - interval '7 days'
    order by coalesce(published_at, created_at) desc
    limit 60
  ) e;

  if v_items is null or jsonb_array_length(v_items) < 3 then
    return jsonb_build_object('ok',true,'skipped','fewer than 3 unused editorial items published in the last 7 days',
      'available', coalesce(jsonb_array_length(v_items),0));
  end if;

  if v_anthropic_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _editorial_digest_jobs
      where provider='anthropic' and created_at > now() - interval '2 hours' and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _editorial_digest_jobs
      where provider='openai' and created_at > now() - interval '2 hours' and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _editorial_digest_jobs
      where provider='gemini' and created_at > now() - interval '2 hours' and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('editorial_digest', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('available_items', jsonb_array_length(v_items)))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded',
      'available', jsonb_array_length(v_items));
  end if;

  if v_provider = 'anthropic' then
    insert into _editorial_digest_jobs (request_id, digest_date, item_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',6000,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nITEMS:\n' || v_items::text))),
        timeout_milliseconds := 90000
      ), current_date, v_item_ids, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _editorial_digest_jobs (request_id, digest_date, item_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',6000,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content', E'ITEMS:\n' || v_items::text)
          )),
        timeout_milliseconds := 90000
      ), current_date, v_item_ids, 'openai'
    );
  else
    insert into _editorial_digest_jobs (request_id, digest_date, item_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'ITEMS:\n' || v_items::text)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',6000)
        ),
        timeout_milliseconds := 90000
      ), current_date, v_item_ids, 'gemini'
    );
  end if;

  return jsonb_build_object('ok',true,'phase','fire','provider',v_provider,'degraded',(v_provider <> 'anthropic'),'items_sent',jsonb_array_length(v_items));
end $function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719230517','fix_editorial_digest_fallback_status_code_durability','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719230517_fix_editorial_digest_fallback_status_code_durability.sql

-- RECOVERY BEGIN 20260719231533_correct_cc_jurisdiction_briefing_namibia_prince_conflation.sql
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
-- version 20260719231533.
--
-- Rewriting this file cannot affect production: 20260719231533 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Corrects a factual error in cc_jurisdiction_briefings for Namibia: the prior entry stated
-- "Namibia's High Court ruled in 2018 that private cannabis use and possession was not
-- criminally unlawful" -- no such Namibian ruling exists. This is South Africa's Constitutional
-- Court ruling (Minister of Justice and Constitutional Development v Prince [2018] ZACC 30,
-- 18 Sept 2018, concourt.org.za / SAFLII), evidently conflated with Namibia given the two
-- countries' shared colonial-era drug-law history. Confirmed via cross-check against Namibia's
-- own, still-unresolved GUN/RUF constitutional challenge (filed 2021) -- which would make no
-- sense if personal use had already been judicially decriminalized in 2018. That challenge was
-- itself dismissed on prematurity grounds by the Windhoek High Court on 11 July 2026 (The
-- Namibian), a genuinely new development this correction also incorporates.
-- Every substantive field built on the false premise (program_status, patient/physician access,
-- market_dynamics, regulatory_outlook, data_source_summary, confidence_categories) is corrected.

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Prohibited; Legislative Reform Under LRDC Review',
  public_summary = 'Cannabis remains fully prohibited in Namibia under the apartheid-era Abuse of Dependence-Producing Substances and Rehabilitation Centres Act, No. 41 of 1971 (inherited from South African colonial administration). No judicial decriminalization has occurred: a constitutional challenge filed in August 2021 by Ganja Users of Namibia (GUN) and the Rastafari United Front, seeking to have the prohibition declared unconstitutional, was dismissed on prematurity grounds by the Windhoek High Court on 11 July 2026 -- Judge Claudia Claasen ruled the dispute is "polycentric" and deferred to the government''s ongoing Law Reform and Development Commission (LRDC) review as the appropriate channel, without ruling on the constitutional merits. The Ministry of Health and Social Services has separately and explicitly rejected proposals for commercial medical cannabis cultivation, most recently in June 2024. No licensed medical or commercial cannabis market exists.',
  patient_access = 'No patient access pathway exists. There is no licensed medical cannabis program, no prescribing framework, and no legal cultivation or dispensing channel of any kind.',
  physician_access = 'Physicians cannot lawfully prescribe cannabis under any regulated framework; no such framework exists in Namibia.',
  market_dynamics = 'No licensed commercial market exists, and none is imminent. Namibia''s Ministry of Health has explicitly declined commercial medical cultivation proposals as recently as June 2024. A coalition of advocacy groups (Cannabis and Hemp Association of Namibia, GUN, Medical Marijuana Association of Namibia, Rastafari United Front) submitted a joint decriminalization and hemp-legalization proposal to the Ministry of Justice in June 2025, in response to a government call for input on reform -- a live policy channel, but one that has not yet produced legislative change.',
  regulatory_outlook = 'The Law Reform and Development Commission (LRDC) review is the sole active reform channel following the High Court''s July 2026 dismissal of the judicial route on prematurity grounds; no public timeline for the LRDC review''s conclusion was located. Given the government''s explicit rejections of medical cultivation proposals and the absence of a published reform timeline, near-term licensing should not be assumed. Namibia''s agricultural conditions could support future cultivation if reform advances, but this remains speculative pending the LRDC''s findings.',
  regulatory_body = 'Ministry of Health and Social Services (MoHSS); Namibian Police Force (NAMPOL) for enforcement; Law Reform and Development Commission (LRDC) -- current locus of any reform activity.',
  data_source_summary = 'Windhoek High Court ruling, 11 Jul 2026 (The Namibian); Constitutional Court of South Africa, Minister of Justice v Prince [2018] ZACC 30 (verified as a South African, not Namibian, precedent); MoHSS public rejection of medical cultivation proposals, Jun 2024; CHAN/GUN/RUF/Medical Marijuana Association of Namibia joint submission to Ministry of Justice, Jun 2025.',
  verification_summary = 'Corrected and re-verified 19 Jul 2026 -- prior entry''s core premise (a 2018 Namibian High Court decriminalization ruling) did not exist in any located source and has been removed.',
  last_reviewed_date = '2026-07-19',
  confidence_score = 0.85,
  confidence_categories = '{"enforcement": 0.65, "market_access": 0.25, "regulatory_framework": 0.9}'::jsonb,
  change_notes = change_notes || '[
    {"title": "Windhoek High Court dismisses GUN/RUF constitutional challenge on prematurity grounds, deferring to LRDC review", "market": "Namibia", "timeAgo": "11 July 2026", "direction": "neutral", "sourceRef": "The Namibian -- namibian.com.na/attempt-to-legalise-cannabis-fails-in-high-court", "reviewState": "reviewed"},
    {"title": "Correction: prior entry incorrectly attributed South Africa''s 2018 Constitutional Court Prince ruling to Namibia; no such Namibian ruling exists and cannabis remains fully prohibited", "market": "Namibia", "timeAgo": "19 July 2026", "direction": "down", "sourceRef": "Constitutional Court of South Africa (concourt.org.za) -- Minister of Justice v Prince [2018] ZACC 30; cross-verified against Namibian High Court case record", "reviewState": "reviewed"}
  ]'::jsonb,
  updated_at = now()
WHERE country_iso2 = 'NA';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719231533','correct_cc_jurisdiction_briefing_namibia_prince_conflation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719231533_correct_cc_jurisdiction_briefing_namibia_prince_conflation.sql

-- RECOVERY BEGIN 20260719231616_update_namibia_playbook_july2026_ruling.sql
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
-- version 20260719231616.
--
-- Rewriting this file cannot affect production: 20260719231616 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Namibia playbook update: the GUN/RUF constitutional challenge I flagged in batch 11 as
-- "unresolved, no outcome located" was in fact decided on 11 July 2026 -- after my original
-- research (11 Jul 2026) but discoverable now. Windhoek High Court dismissed the case on
-- prematurity grounds (deferring to the LRDC review), not on the constitutional merits.
-- Surfaced while cross-checking cc_jurisdiction_briefings, which is being corrected separately.

INSERT INTO public.source_registry
  (source_name, source_url, source_type, tier, country, iso, region, adapter, crawl_cadence, relevance_status, crawl_allowed, is_active, notes)
VALUES
  ('The Namibian -- Attempt to legalise cannabis fails in High Court',
   'https://www.namibian.com.na/attempt-to-legalise-cannabis-fails-in-high-court/',
   'news', 1, 'Namibia', 'NA', 'Africa', 'html_snapshot', 'weekly', 'active', true, true,
   '11-Jul-2026 Windhoek High Court ruling: special plea upheld, GUN/RUF case dismissed on prematurity grounds, deferred to LRDC review')
ON CONFLICT (source_url) DO NOTHING;

UPDATE public.jurisdiction_playbooks
SET
  legal_framework_summary = replace(
    legal_framework_summary,
    'a special-plea hearing on that jurisdictional question was scheduled for 5-8 May 2026, and no publicly reported outcome had been located as of this review -- this is a genuinely unresolved, live case rather than a settled one.',
    'that special plea was heard and, on 11 July 2026, upheld by the Windhoek High Court: Judge Claudia Claasen ruled the cannabis dispute is "polycentric" (implicating public health policy, law enforcement, and broader social policy) and that judicial intervention ahead of the LRDC''s ongoing review would risk trespassing into the legislature''s function, dismissing the case on prematurity grounds without ruling on the constitutional merits. This closes the judicial avenue for now -- the LRDC review is the sole remaining active reform channel, with no public timeline for its conclusion.'
  ),
  common_pitfalls = ARRAY[
    'Assuming the July 2026 dismissal of the GUN/RUF case or the June 2025 advocacy submission to the Ministry of Justice signals imminent legal change -- the court dismissed on procedural (prematurity) grounds without addressing the constitutional merits, and the government has consistently resisted judicial intervention, treating reform as a legislative/LRDC matter with no published timeline',
    'Treating any single cited penalty figure (fine amount or maximum sentence) as authoritative -- available sources conflict materially on both dimensions (N$200,000 vs. N$500,000; 20 years vs. 40 years); confirm the specific statute and offense category with Namibian counsel before relying on any number',
    'Assuming CBD or hemp-derived products carry any distinct legal status in Namibia -- no such carve-out exists; CBD is treated as illegal by extension of the general cannabis prohibition'
  ],
  confidence_label = 'high on the core prohibition status (corroborated across Wikipedia, Leafwell, Accomplit, and The Namibian''s ongoing court coverage) and on the litigation outcome (the Windhoek High Court''s 11 July 2026 dismissal of the GUN/RUF case on prematurity grounds is directly reported by The Namibian); medium on specific penalty figures, which conflict materially across sources; the LRDC review''s timeline and ultimate direction remain genuinely open',
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.namibian.com.na/attempt-to-legalise-cannabis-fails-in-high-court/'),
  last_reviewed = CURRENT_DATE,
  last_verified_at = now(),
  updated_at = now()
WHERE country_iso2 = 'NA';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719231616','update_namibia_playbook_july2026_ruling','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719231616_update_namibia_playbook_july2026_ruling.sql

-- RECOVERY BEGIN 20260719231746_update_kenya_playbook_rastafari_ruling_and_flag_export_lead.sql
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
-- version 20260719231746.
--
-- Rewriting this file cannot affect production: 20260719231746 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Kenya update: the Rastafari Society of Kenya religious-exemption case, which I flagged in
-- batch 11 as pending with a judgment date that had already shifted three times, was decided
-- on schedule on 15 July 2026 -- dismissed, but with an appeal to the Court of Appeal already
-- announced. Corroborated across 7 independent Kenyan outlets (The Star, Tuko x2, Kenyans.co.ke,
-- People Daily, Nairobi Wire, Court Helicopter).
-- Also flagging, with explicit hedging, an unverified lead: both the signals pipeline and
-- cc_jurisdiction_briefings independently point to PPB-linked cannabis export-licensing activity
-- that four rounds of web search (general, targeted, site:parliament.go.ke, PPB-specific) could
-- not independently corroborate. PPB itself is real and does have a general controlled-substances
-- export-permitting mandate; no cannabis-specific initiative was confirmed. Surfaced, not asserted.

INSERT INTO public.source_registry
  (source_name, source_url, source_type, tier, country, iso, region, adapter, crawl_cadence, relevance_status, crawl_allowed, is_active, notes)
VALUES
  ('The Star (Kenya) -- Court upholds ban on bhang, urges future debate',
   'https://www.the-star.co.ke/news/2026-07-15-court-upholds-ban-on-bhang-urges-future-debate',
   'news', 1, 'Kenya', 'KE', 'Africa', 'html_snapshot', 'weekly', 'active', true, true,
   '15-Jul-2026 High Court dismissal of the Rastafari Society of Kenya petition; judge''s obiter call for a national cannabis-policy conversation'),
  ('Tuko.co.ke -- Rastafarian Society Rejects Ruling on Bhang, Heads to Court of Appeal',
   'https://www.tuko.co.ke/kenya/632762-rastafarian-society-rejects-ruling-bhang-heads-court-appeal-fight/',
   'news', 2, 'Kenya', 'KE', 'Africa', 'html_snapshot', 'weekly', 'active', true, true,
   'Confirms notice of appeal to the Court of Appeal filed by petitioners'' counsel Shadrach Wambui')
ON CONFLICT (source_url) DO NOTHING;

UPDATE public.jurisdiction_playbooks
SET
  legal_framework_summary = replace(
    legal_framework_summary,
    'The case has been repeatedly adjourned -- judgment dates were successively set for 12 March, then 27/28 May, and as of the most recent reporting located (early July 2026) had shifted again to 15 July 2026 -- with no ruling found as of this review; this is a live, closely watched, genuinely unresolved case, and even a favorable outcome would establish only a narrow religious-worship exemption, not broad legalization.',
    'The case was decided on 15 July 2026: Justice Bahati Mwamuye dismissed the petition, finding the evidence on the centrality of cannabis to Rastafarian worship "inconsistent" and insufficient to establish it as an essential element of the faith, and separately noting the petitioners had not exhausted available legal and administrative mechanisms before invoking the court''s constitutional jurisdiction. The Narcotic Drugs and Psychotropic Substances (Control) Act was upheld as constitutional, with no religious exemption created. Notably, while ruling against the petition, Mwamuye added that cannabis use "is not a question for the Rastafarian community only" -- observing that cannabinoid products are already sold openly in mainstream Kenyan shops and supermarkets and that Kenya needs a "full and frank conversation" on cannabis policy, while stressing that any such change is a matter for the legislature and executive, not the courts. The petitioners'' counsel announced a notice of appeal to the Court of Appeal within days of the ruling, so this is not yet fully final.'
  ),
  common_pitfalls = ARRAY[
    'Assuming the 1994 Act''s nominal medical/scientific use provision means a functioning medical cannabis program exists -- no operational licensing pathway for that carve-out was identified in available sources; treat Kenya as fully prohibited in practice',
    'Treating the Rastafari Society of Kenya case as resolved -- the High Court dismissed it on 15 July 2026, but petitioners have already filed notice of appeal to the Court of Appeal, so the litigation is ongoing at a higher level; even had it succeeded, it would only ever have established a narrow religious-worship exemption, not commercial or general recreational legality',
    'Citing pre-2022 penalty figures (minimum 10-year terms, life imprisonment for dealing) as current law -- the 2022 amendment introduced materially lower, quantity-tiered penalties specifically for personal-use possession; confirm which offense category and which version of the law applies before relying on any single penalty figure',
    'Treating unconfirmed leads on Kenyan cannabis export-licensing activity as settled fact -- both an internal signal and a separately-sourced briefing point to Pharmacy and Poisons Board (PPB, Kenya''s real drug regulatory authority)-linked export-framework discussion, but four rounds of web search found no independently verifiable, citable initiative; treat as an open item to verify directly with PPB or NACADA rather than as confirmed policy'
  ],
  confidence_label = 'high on the core prohibition status and the 2022 penalty-tier amendment (corroborated across Herb''s April 2026 reporting, Leafwell, Wikipedia, and NACADA''s own public statements); high on the Rastafari Society case outcome, corroborated across seven independent Kenyan outlets (The Star, Tuko, Kenyans.co.ke, People Daily, Nairobi Wire, Court Helicopter) reporting the same 15 July 2026 dismissal and the subsequent notice of appeal; low/unconfirmed on a possible PPB-linked cannabis export-licensing initiative, flagged via two independent internal sources but not independently verifiable as of this review',
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.the-star.co.ke/news/2026-07-15-court-upholds-ban-on-bhang-urges-future-debate'),
  last_reviewed = CURRENT_DATE,
  last_verified_at = now(),
  updated_at = now()
WHERE country_iso2 = 'KE';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719231746','update_kenya_playbook_rastafari_ruling_and_flag_export_lead','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719231746_update_kenya_playbook_rastafari_ruling_and_flag_export_lead.sql

-- RECOVERY BEGIN 20260719231817_add_kenya_briefing_change_note_rastafari_ruling.sql
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
-- version 20260719231817.
--
-- Rewriting this file cannot affect production: 20260719231817 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Light-touch update, unlike the Namibia correction: Kenya's cc_jurisdiction_briefings core
-- claims (prohibited status; export-licensing activity under discussion) were not disproven --
-- only independently unverifiable by me after 4 search rounds. Not rewriting content I can't
-- confirm is wrong. Adding the one fact I did fully verify (the 15 Jul 2026 court ruling, which
-- this entry doesn't yet mention) as a change note, and refreshing last_reviewed_date.

UPDATE public.cc_jurisdiction_briefings
SET
  change_notes = change_notes || '[
    {"title": "High Court dismisses Rastafari Society of Kenya religious-exemption petition; petitioners file notice of appeal to Court of Appeal", "market": "Kenya", "timeAgo": "15 July 2026", "direction": "neutral", "sourceRef": "The Star (Kenya) -- the-star.co.ke/news/2026-07-15-court-upholds-ban-on-bhang-urges-future-debate", "reviewState": "reviewed"}
  ]'::jsonb,
  last_reviewed_date = '2026-07-19',
  updated_at = now()
WHERE country_iso2 = 'KE';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719231817','add_kenya_briefing_change_note_rastafari_ruling','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719231817_add_kenya_briefing_change_note_rastafari_ruling.sql

-- RECOVERY BEGIN 20260719232121_correct_cc_briefings_batch2_tr_vc_gd_full_rewrites.sql
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
-- version 20260719232121.
--
-- Rewriting this file cannot affect production: 20260719232121 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Three confirmed factual errors in cc_jurisdiction_briefings, same class as the Namibia fix:
-- TR: flatly states "no medical cannabis programme exists" -- Turkey passed a pharmacy-only
--     medical cannabis law in 2025 with implementing regs published Jan 2026 (Daily Sabah,
--     Business of Cannabis, Coherent Market Insights -- all independently corroborated in my
--     own TR playbook research).
-- VC: states "no formal medical program has been established... expressed interest in
--     developing" -- Saint Vincent has run a genuinely operational 5-tier commercial licensing
--     program since Dec 2018, with 224 licenses issued in 2021 alone and named international
--     investors (MCA's own site, MJBizDaily, GrowerIQ).
-- GD: dates Grenada's decriminalization to 2019 -- confirmed via 6 independent sources
--     (NOW Grenada, St. Martin News Network, Tripbase, CannaCarib, MJBizDaily, International
--     CBC) this happened in 2026. The 2019 date is almost certainly conflated with Trinidad and
--     Tobago's real 2019 decriminalization -- a different Caribbean neighbor, same error pattern
--     as the Namibia/South Africa mix-up.

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Medical Legal (Pharmacy-Only, Since 2025); Industrial Hemp Expanding',
  public_summary = 'Turkiye passed a health-law package in mid-2025 legalizing regulated, pharmacy-only sale of low-THC (under 0.3%) medical cannabis products on prescription -- ending a regime that since 2016 had permitted only sublingual cannabinoid sprays (Sativex) via specialist prescription. Implementing regulations (Regulation on Cultivation and Control of Cannabis; Regulation on Products Derived from Cannabis) were published in the Official Gazette 31 January 2026. National cultivation is capped at a fixed 120,000-plant/5,000 sqm annual quota reserved for pharmaceutical API production. Curaleaf was awarded an operating license in 2025, among the first issued. Separately, industrial hemp cultivation for fiber/textile use has been licensed in 19 of Turkiye''s 81 provinces since 2016 and continues expanding. Whole-plant recreational cannabis remains a Schedule I substance with 2023-enhanced minimum sentences; officials have been explicit the 2025 law creates no recreational opening.',
  regulatory_outlook = 'The pharmacy-only medical channel is newly operational (regulations only months old) and likely to see procedural refinement through 2026-2027 as the first licensees (including Curaleaf) scale. Industrial hemp continues expanding in parallel as a distinct, older track. No recreational reform is on the agenda; officials have repeatedly and explicitly ruled it out.',
  data_source_summary = 'Daily Sabah (2025 law, ministry quotes); Business of Cannabis; Coherent Market Insights (Curaleaf license, market forecast); Wikipedia (hemp-province history).',
  confidence_score = 0.8,
  confidence_categories = '{"enforcement": 0.75, "market_access": 0.55, "regulatory_framework": 0.85}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry stated no medical cannabis programme exists; Turkiye passed a pharmacy-only medical cannabis law in 2025 with Jan 2026 implementing regulations", "market": "Turkiye", "timeAgo": "19 July 2026", "direction": "up", "sourceRef": "Daily Sabah; Business of Cannabis; Official Gazette 31-Jan-2026", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19',
  updated_at = now()
WHERE country_iso2 = 'TR';

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Medical/Commercial Legal (Since 2018); Export-Oriented Industry Operational',
  public_summary = 'Saint Vincent and the Grenadines runs a genuinely operational commercial medical cannabis industry, not merely an "interest" -- Parliament passed the Medicinal Cannabis Industry Act and the Cannabis Cultivation (Amnesty) Act in December 2018. The Medicinal Cannabis Authority (MCA) issues five tiers of cultivation license (Class A-E, priced EC$100,000 to EC$2.67 million by acreage) plus manufacturing, dispensing, laboratory-testing, and import/export licenses. The MCA approved 224 licenses in 2021 alone, including a 300-acre license to Acres Agricultural (SVG), a subsidiary of a Canadian firm, alongside licenses for local farmer cooperatives. The industry is oriented toward pharmaceutical-grade export (GMP/GACP/GlobalGAP standards), not domestic or tourist retail -- there is no walk-in dispensary model. Personal possession up to 56g was separately decriminalized in July 2018.',
  regulatory_outlook = 'The commercial export program is mature relative to Caribbean peers and continues to scale; near-term development is incremental (additional license approvals, export-market expansion) rather than foundational. No tourist-facing retail model is expected -- the industry''s economics run through licensed export.',
  data_source_summary = 'Medicinal Cannabis Authority (mca.vc, official regulator); MJBizDaily (first-licensee reporting); GrowerIQ (2021 licensing figures); Wikipedia.',
  confidence_score = 0.85,
  confidence_categories = '{"enforcement": 0.7, "market_access": 0.85, "regulatory_framework": 0.85}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry described only decriminalization plus interest in a future program; SVG has run an operational 5-tier commercial licensing regime since Dec 2018 with 224 licenses issued in 2021 alone", "market": "Saint Vincent and the Grenadines", "timeAgo": "19 July 2026", "direction": "up", "sourceRef": "Medicinal Cannabis Authority (mca.vc); MJBizDaily", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19',
  updated_at = now()
WHERE country_iso2 = 'VC';

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Decriminalized (2026); No Commercial Framework Yet',
  public_summary = 'Grenada decriminalized cannabis via the Drug Abuse (Prevention and Control) (Amendment) Act, 2026 -- tabled 20 January 2026, assented by the Governor-General 13 February 2026, gazetted 20 February 2026 -- not 2019 as previously stated (that date applies to Trinidad and Tobago''s decriminalization, a different country). Adults 21+ may possess up to 56g cannabis / 15g resin and register to cultivate up to 4 plants per household; the Act also creates a Rastafari sacramental-use framework and an amnesty/expungement mechanism for past minor offenses. The Attorney General and Health Minister were explicit during the parliamentary debate that the Act does not create a recreational commercial market. Government committed to developing a national commercial/medical cannabis policy framework within 3-6 months of January 2026; no such framework had been published as of mid-2026.',
  regulatory_outlook = 'The Cannabis Legalisation and Regulation Secretariat is leading design of the promised commercial/medical framework; government''s own 3-6 month timeline (from Jan 2026) has passed without publication as of this review, so no near-term commercial licensing should be assumed. Decriminalization and the Rastafari framework are fully in force today independent of that timeline.',
  data_source_summary = 'Cannabis Legalisation and Regulation Secretariat (cannabiscommission.gov.gd, official); NOW Grenada (parliamentary reporting); International CBC; Government Gazette Vol 144 No 9 (20-Feb-2026).',
  confidence_score = 0.85,
  confidence_categories = '{"enforcement": 0.6, "market_access": 0.2, "regulatory_framework": 0.8}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry dated decriminalization to 2019 (that is Trinidad and Tobago''s date, not Grenada''s); Grenada''s decriminalization Act was assented 13 Feb 2026 and gazetted 20 Feb 2026", "market": "Grenada", "timeAgo": "19 July 2026", "direction": "neutral", "sourceRef": "Cannabis Legalisation and Regulation Secretariat; NOW Grenada; Government Gazette Vol 144 No 9", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19',
  updated_at = now()
WHERE country_iso2 = 'GD';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719232121','correct_cc_briefings_batch2_tr_vc_gd_full_rewrites','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719232121_correct_cc_briefings_batch2_tr_vc_gd_full_rewrites.sql

-- RECOVERY BEGIN 20260720000742_correct_needs_enrichment_to_existing_captured_status.sql
-- Corrects an earlier fix this same day (20260719190929): that migration
-- invented a 'needs_enrichment' status without knowing lib/marketplace/candidates.ts
-- already defines a strict CANDIDATE_STATUSES enum + ALLOWED_TRANSITIONS state
-- machine that does NOT include it. Candidates sitting in an unrecognized
-- status would show up in /admin/candidates (which lists with no status
-- filter) with zero available transitions -- a dead end, not a fix.
--
-- The existing state machine already has the right status for this exact
-- case: 'captured' -- explicitly the pre-review entry point, with an allowed
-- transition captured -> needs_review once ready. Using it instead of an
-- invented value.
update marketplace_candidates
set status = 'captured'
where status = 'needs_enrichment';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720000742','correct_needs_enrichment_to_existing_captured_status','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720000742_correct_needs_enrichment_to_existing_captured_status.sql

-- RECOVERY BEGIN 20260720021121_reclassify_translated_eval.sql
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
-- version 20260720021121.
--
-- Rewriting this file cannot affect production: 20260720021121 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create table if not exists public.hv_reclassify_jobs (
  request_id bigint primary key,
  signal_id text not null,
  run_id text not null,
  pred_quality_label text,
  pred_confidence numeric,
  harvested boolean not null default false
);

create or replace function public.hv_reclassify_dispatch(p_run text, p_limit int default 200)
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare r record; v_rid bigint; n int:=0;
begin
  for r in
    select e.signal_id, s.title_en, coalesce(s.summary_en, s.title_en) as summ
    from public.intel_eval_set e join public.signals s on s.id=e.signal_id
    where e.quality_label is not null and s.title_en is not null
      and coalesce(e.lang_at_sample,'en')<>'en'
      and not exists (select 1 from public.hv_reclassify_jobs j where j.signal_id=e.signal_id and j.run_id=p_run)
    limit p_limit
  loop
    select net.http_post(
      url:='https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eGRnZGt1a2pycndhbWRwcXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDMxNzUsImV4cCI6MjA5MjgxOTE3NX0.MEGWEsDpJO3964Ef2G2Cbo-Q5JKT46WB1xtlXE-ue5M'),
      body:=jsonb_build_object('text', jsonb_build_object('headline', r.title_en, 'summary', r.summ)),
      timeout_milliseconds:=30000
    ) into v_rid;
    insert into public.hv_reclassify_jobs(request_id, signal_id, run_id) values (v_rid, r.signal_id, p_run) on conflict do nothing;
    n:=n+1;
  end loop;
  return n;
end$fn$;

create or replace function public.hv_reclassify_harvest(p_run text)
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare r record; v_c jsonb; n int:=0;
begin
  for r in
    select j.request_id, resp.status_code, resp.content
    from public.hv_reclassify_jobs j join net._http_response resp on resp.id=j.request_id
    where j.run_id=p_run and not j.harvested
  loop
    if r.status_code=200 then
      begin
        v_c := (r.content::jsonb->'classification');
        update public.hv_reclassify_jobs set
          pred_quality_label = v_c->>'quality_label',
          pred_confidence = (v_c->>'confidence')::numeric,
          harvested = true
        where request_id = r.request_id;
        n:=n+1;
      exception when others then
        update public.hv_reclassify_jobs set harvested=true where request_id=r.request_id;
      end;
    else
      update public.hv_reclassify_jobs set harvested=true where request_id=r.request_id;
    end if;
  end loop;
  return n;
end$fn$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720021121','reclassify_translated_eval','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720021121_reclassify_translated_eval.sql

-- RECOVERY BEGIN 20260720021544_add_embed_dedup_stage.sql
-- Restore the exact production-owned body for migration 20260720021544.
-- The previous stub omitted public.hv_embed_jobs, which later migrations
-- depend on.

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

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720021544','add_embed_dedup_stage','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720021544_add_embed_dedup_stage.sql

-- RECOVERY BEGIN 20260720022110_stage3_promote_dedup_columns.sql
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
-- version 20260720022110.
--
-- Rewriting this file cannot affect production: 20260720022110 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Stage 3: classifier verdicts + dedup on signals, and the promote path (§6.3).
alter table public.signals
  add column if not exists quality_label text,
  add column if not exists content_type text,
  add column if not exists impact text,
  add column if not exists quality_confidence numeric,
  add column if not exists classifier_version text,
  add column if not exists cluster_rep_id text,
  add column if not exists is_representative boolean,
  add column if not exists corroborating_count int;

-- Dedup: within a recent scope, mark each signal representative unless a higher-priority
-- near-twin (cosine >= tau) exists. Priority: higher score, then earlier, then id.
create or replace function public.hv_dedup_assign(p_tau float default 0.90, p_scope_days int default 120)
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare n int;
begin
  update public.signals a
  set is_representative = not exists (
        select 1 from public.signals b
        where b.id <> a.id and b.embedding_1024 is not null
          and b.created_at > now() - (p_scope_days||' days')::interval
          and ( coalesce(b.score,0) > coalesce(a.score,0)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at < a.created_at)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at = a.created_at and b.id < a.id) )
          and (1 - (a.embedding_1024 <=> b.embedding_1024)) >= p_tau
      ),
      cluster_rep_id = coalesce((
        select b.id from public.signals b
        where b.id <> a.id and b.embedding_1024 is not null
          and b.created_at > now() - (p_scope_days||' days')::interval
          and (1 - (a.embedding_1024 <=> b.embedding_1024)) >= p_tau
          and ( coalesce(b.score,0) > coalesce(a.score,0)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at < a.created_at)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at = a.created_at and b.id < a.id) )
        order by (1 - (a.embedding_1024 <=> b.embedding_1024)) desc
        limit 1
      ), a.id)
  where a.embedding_1024 is not null
    and a.created_at > now() - (p_scope_days||' days')::interval;
  get diagnostics n = row_count;
  return n;
end$fn$;

-- Promote (§6.3): only ever promotes; never demotes, never touches human rows; idempotent.
create or replace function public.hv_promote_signals(p_min_conf numeric default 0.0)
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare n int;
begin
  update public.signals s set
    reviewed = true,
    reviewed_by = 'auto:v1',
    reviewed_at = now()
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and coalesce(s.quality_confidence, 1) >= p_min_conf
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%');
  get diagnostics n = row_count;
  return n;
end$fn$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720022110','stage3_promote_dedup_columns','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720022110_stage3_promote_dedup_columns.sql

-- RECOVERY BEGIN 20260720022140_stage3_classify_corpus.sql
-- Restore the exact production-owned body for migration 20260720022140.
-- The previous stub omitted public.hv_classify_jobs, which later migrations
-- depend on.
--
-- The Authorization bearer below is the project's publishable anon key, as
-- recorded in the production ledger for this version. It is reproduced
-- verbatim so zero-state replay matches the recorded body; it is not a
-- service-role key and grants nothing beyond anon.

create table if not exists public.hv_classify_jobs (
  request_id bigint primary key,
  signal_id text not null,
  harvested boolean not null default false
);
create index if not exists hv_classify_jobs_unharvested on public.hv_classify_jobs (harvested) where not harvested;

-- Dispatch classification for recent, unreviewed, unclassified signals (prefer English-normalized text).
create or replace function public.hv_classify_corpus_dispatch(p_limit int default 100, p_scope_days int default 120)
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare r record; v_rid bigint; n int:=0;
begin
  for r in
    select s.id, coalesce(s.title_en, s.headline) as h, coalesce(s.summary_en, left(s.summary,1000), s.title_en, s.headline) as sm
    from public.signals s
    where s.quality_label is null
      and s.reviewed is distinct from true
      and s.headline is not null
      and s.created_at > now() - (p_scope_days||' days')::interval
      and not exists (select 1 from public.hv_classify_jobs j where j.signal_id=s.id and not j.harvested)
    order by s.created_at desc
    limit p_limit
  loop
    select net.http_post(
      url:='https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eGRnZGt1a2pycndhbWRwcXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDMxNzUsImV4cCI6MjA5MjgxOTE3NX0.MEGWEsDpJO3964Ef2G2Cbo-Q5JKT46WB1xtlXE-ue5M'),
      body:=jsonb_build_object('text', jsonb_build_object('headline', r.h, 'summary', r.sm)),
      timeout_milliseconds:=30000
    ) into v_rid;
    insert into public.hv_classify_jobs(request_id, signal_id) values (v_rid, r.id) on conflict do nothing;
    n:=n+1;
  end loop;
  return n;
end$fn$;

create or replace function public.hv_classify_corpus_harvest()
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare r record; v_c jsonb; n int:=0;
begin
  for r in
    select j.request_id, j.signal_id, resp.status_code, resp.content
    from public.hv_classify_jobs j join net._http_response resp on resp.id=j.request_id
    where not j.harvested
  loop
    if r.status_code=200 then
      begin
        v_c := (r.content::jsonb->'classification');
        if v_c is not null then
          update public.signals s set
            quality_label = v_c->>'quality_label',
            content_type = v_c->>'content_type',
            impact = v_c->>'impact',
            quality_confidence = (v_c->>'confidence')::numeric,
            classifier_version = 'hv-classify/openai/v1'
          where s.id = r.signal_id;
          n:=n+1;
        end if;
      exception when others then null;
      end;
    end if;
    update public.hv_classify_jobs set harvested=true where request_id=r.request_id;
  end loop;
  return n;
end$fn$;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720022140','stage3_classify_corpus','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720022140_stage3_classify_corpus.sql

-- RECOVERY BEGIN 20260720023051_stage3_pipeline_crons.sql
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
-- version 20260720023051.
--
-- Rewriting this file cannot affect production: 20260720023051 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- One pipeline tick: harvest prior async work, dispatch next batches. (Stage 5 "conductor", minimal.)
create or replace function public.hv_pipeline_tick()
returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare v_tr_h int; v_cl_h int; v_em_h int; v_cl_d int; v_tr_d int; v_em_d int := 0; v_ids text[];
begin
  -- 1) harvest anything the previous tick dispatched
  v_tr_h := public.hv_translate_harvest();
  v_cl_h := public.hv_classify_corpus_harvest();
  v_em_h := public.hv_embed_harvest();

  -- 2) dispatch next batches (bounded per tick for rate/cost)
  v_tr_d := public.hv_translate_dispatch(40, false);        -- translate non-English before classify
  v_cl_d := public.hv_classify_corpus_dispatch(120, 400);   -- classify unclassified, freshest first

  -- 3) embed ONLY promotable signals (dedup only needs signal-vs-signal)
  select array_agg(id) into v_ids from (
    select s.id from public.signals s
    where s.quality_label = 'signal' and s.embedding_1024 is null
    order by s.created_at desc limit 100
  ) q;
  if v_ids is not null then
    perform public.hv_embed_dispatch(v_ids);
    v_em_d := array_length(v_ids,1);
  end if;

  return jsonb_build_object('translate_harvested',v_tr_h,'classify_harvested',v_cl_h,'embed_harvested',v_em_h,
                            'translate_dispatched',v_tr_d,'classify_dispatched',v_cl_d,'embed_dispatched',v_em_d);
end$fn$;

-- Slower tick: dedup among embedded signals + promote representatives. Idempotent & safe.
create or replace function public.hv_quality_promote_tick()
returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare v_dd int; v_pr int;
begin
  v_dd := public.hv_dedup_assign(0.90, 400);
  v_pr := public.hv_promote_signals(0.0);
  return jsonb_build_object('deduped',v_dd,'promoted',v_pr);
end$fn$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720023051','stage3_pipeline_crons','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720023051_stage3_pipeline_crons.sql

-- RECOVERY BEGIN 20260720023832_stage3_schedule_quality_crons.sql
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
-- version 20260720023832.
--
-- Rewriting this file cannot affect production: 20260720023832 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Schedule the quality pipeline (idempotent: cron.schedule updates an existing job by name).
select cron.schedule('hv-quality-pipeline', '*/2 * * * *', $$select public.hv_pipeline_tick()$$);
select cron.schedule('hv-quality-promote', '*/10 * * * *', $$select public.hv_quality_promote_tick()$$);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720023832','stage3_schedule_quality_crons','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720023832_stage3_schedule_quality_crons.sql

-- RECOVERY BEGIN 20260720025910_source_yield_report_view.sql
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
-- version 20260720025910.
--
-- Rewriting this file cannot affect production: 20260720025910 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Per-source signal yield: which sources produce real signals vs junk. Re-runnable as the backfill grows.
create or replace view public.source_yield_report as
select
  regexp_replace(url, '^https?://(www\.)?([^/]+).*', '\2') as domain,
  count(*) as classified,
  count(*) filter (where quality_label='signal') as signals,
  round(100.0*count(*) filter (where quality_label='signal')/count(*), 0) as signal_pct,
  count(*) filter (where quality_label in ('spam','nav','boilerplate')) as junk,
  round(100.0*count(*) filter (where quality_label in ('spam','nav','boilerplate'))/count(*), 0) as junk_pct,
  count(*) filter (where quality_label='duplicate') as dupes,
  count(*) filter (where reviewed_by='auto:v1') as promoted
from public.signals
where quality_label is not null and url is not null
group by 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720025910','source_yield_report_view','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720025910_source_yield_report_view.sql

-- RECOVERY BEGIN 20260720090637_jurisdiction_playbooks_timeline_positive_check.sql
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
-- version 20260720090637.
--
-- Rewriting this file cannot affect production: 20260720090637 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

ALTER TABLE public.jurisdiction_playbooks
  ADD CONSTRAINT jurisdiction_playbooks_timeline_months_positive_check
  CHECK (typical_timeline_months IS NULL OR typical_timeline_months > 0);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720090637','jurisdiction_playbooks_timeline_positive_check','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720090637_jurisdiction_playbooks_timeline_positive_check.sql

-- RECOVERY BEGIN 20260720093632_create_education_content_citations.sql
-- Reconstructed from production on 2026-08-14.
--
-- This file previously contained no DDL at all. It carried a short comment
-- saying it had been applied directly to production via Supabase MCP and
-- existed only to satisfy local/remote migration history parity, followed by
-- a single `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing
-- nothing, so `supabase db reset --local` could not rebuild the schema this
-- migration is supposed to create. The statements below are the verbatim text
-- production actually ran, read back from
-- supabase_migrations.schema_migrations.statements for version 20260720093632.
--
-- Rewriting this file cannot affect production: 20260720093632 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.

create table if not exists public.education_content_citations (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.education_modules(id) on delete cascade,
  section_id uuid references public.education_module_sections(id) on delete cascade,
  claim text not null,
  source_type text not null check (source_type in ('case_report','review_article','consensus_guideline','pharmacokinetic_study','regulatory_pathway','mechanistic_theoretical','other')),
  source_title text,
  source_url text,
  confidence_tier text not null check (confidence_tier in ('well_established','moderate_evidence','theoretical_mechanistic','single_source')),
  open_question boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

comment on table public.education_content_citations is
  'Per-claim evidence trail for education content, especially requires_clinical_signoff=true modules. Lets a reviewer start from a fully-sourced draft (claim -> source -> confidence tier) instead of unaided prose. open_question flags claims needing clinician judgment specifically, not just fact-checking.';

alter table public.education_content_citations enable row level security;

drop policy if exists "education_content_citations_staff_all" on public.education_content_citations;
create policy "education_content_citations_staff_all" on public.education_content_citations
  for all
  using (
    exists (select 1 from user_roles where user_roles.user_id = auth.uid() and user_roles.role = any(array['admin','operator','analyst']))
  );

drop policy if exists "education_content_citations_service_write" on public.education_content_citations;
create policy "education_content_citations_service_write" on public.education_content_citations
  for all
  using (auth.role() = 'service_role');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720093632','create_education_content_citations','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720093632_create_education_content_citations.sql

-- RECOVERY BEGIN 20260720093647_expose_education_content_citations_via_api.sql
-- Reconstructed from production on 2026-08-14.
--
-- This file previously contained no DDL at all. It carried a short comment
-- saying it had been applied directly to production via Supabase MCP and
-- existed only to satisfy local/remote migration history parity, followed by
-- a single `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing
-- nothing, so `supabase db reset --local` could not rebuild the schema this
-- migration is supposed to create. The statements below are the verbatim text
-- production actually ran, read back from
-- supabase_migrations.schema_migrations.statements for version 20260720093647.
--
-- Rewriting this file cannot affect production: 20260720093647 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.

create view api.education_content_citations as
select id, module_id, section_id, claim, source_type, source_title, source_url, confidence_tier, open_question, notes, created_at
from public.education_content_citations;

grant select, insert, update, delete on api.education_content_citations to authenticated, service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720093647','expose_education_content_citations_via_api','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720093647_expose_education_content_citations_via_api.sql

-- RECOVERY BEGIN 20260720101504_correct_cc_briefings_batch3_ae_lk_li_sm_full_tt_lb_light_ie_flag.sql
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
-- version 20260720101504.
--
-- Rewriting this file cannot affect production: 20260720101504 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Four more full corrections (AE, LK, LI, SM), two lighter-touch fixes for overstated
-- operational maturity (TT, LB), and one flagged-not-asserted item (IE).
-- AE: cited the superseded 1995 law and omitted both the 2021 reform (Decree-Law 30 --
--     rehab pathway, Article 96 entry-point mechanism) and the brand-new Jan 2026 Industrial
--     Hemp Decree-Law entirely.
-- LK: claimed Ayurvedic cannabis use is "not formally recognized" -- it is, via the Ayurveda
--     Act (state Ayurvedic Drugs Corporation, ~16,000 licensed physicians); also omitted the
--     Aug 2025 BOI export-only cultivation scheme entirely.
-- LI/SM: both overstated neighbor-alignment (Switzerland / Italy respectively) in a way that
--     contradicts specific, sourced facts -- Liechtenstein's own minister explicitly rejected
--     following Switzerland (2018) and banned industrial hemp entirely (2005); San Marino's
--     medical access is a narrow domestic Sativex program, not Italian AIFA-protocol access.
-- TT/LB: not factually false, but overstate operational maturity -- TT's CLA exists in statute
--     but was never proclaimed into an operating body; LB's Authority was only constituted in
--     summer 2025, five years after the law, and says 2026 is too tight even for a first harvest.
-- IE: flagging, not asserting -- a "2023 Health (Amendment) Act" and an already-introduced
--     diversion scheme could not be corroborated against two independent research passes
--     (mine, and another agent's), both of which found MCAP still described as a pilot and the
--     diversion scheme as planned (National Drugs Strategy 2026-2029), not yet enacted.

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Prohibited (2021 Procedural Reform); New Industrial Hemp Framework (2026)',
  public_summary = 'The UAE''s narcotics law was replaced in 2021 by Federal Decree-Law No. 30 (superseding the 1995 law), which removed automatic prison time and the prior mandatory minimum for qualifying first-time personal-use offenses, substituting a rehabilitation pathway. A separate entry-point mechanism (Article 96 / Cabinet Resolution 43) allows seizure and entry denial without criminal charges for qualifying cases at borders. Trafficking and sale remain severely punished (5-year minimum, up to life or death in defined cases), and CBD/hemp consumer products are still treated as cannabis in practice -- any detectable THC can trigger prosecution. A new Industrial Hemp Decree-Law took effect 1 January 2026, creating the UAE''s first federal licensing framework for industrial hemp (THC capped at 0.3% dry-weight) covering cultivation, processing, and use in authorized medical products -- a narrow, security-heavy industrial/pharmaceutical framework, not a consumer opening. Treatment of cannabis flower and CBD extraction under the new law remains explicitly unresolved pending implementing regulations.',
  regulatory_outlook = 'Reform trajectory is narrowly industrial and pharmaceutical, state-driven rather than consumer-facing. Key open question is how flower-based cultivation and CBD extraction will be treated under the new hemp law -- unresolved as of this review. No consumer-facing reform (medical prescribing recognition, CBD retail, decriminalization) is on the agenda.',
  data_source_summary = 'Wikipedia; LYLAW (Article 96/Resolution 43, documented acquittal case); MIO & Partners (Industrial Hemp Decree-Law detail); Hemp Today (unresolved flower-treatment analysis).',
  confidence_score = 0.82,
  confidence_categories = '{"enforcement": 0.8, "market_access": 0.3, "regulatory_framework": 0.85}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry cited the superseded 1995 law and omitted the 2021 procedural reform and the new Jan 2026 Industrial Hemp Decree-Law entirely", "market": "United Arab Emirates", "timeAgo": "19 July 2026", "direction": "up", "sourceRef": "MIO & Partners; LYLAW; Wikipedia", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19', updated_at = now()
WHERE country_iso2 = 'AE';

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Prohibited; Ayurvedic Channel Formally Legal; New Export-Only Scheme (2025)',
  public_summary = 'Recreational cannabis is fully illegal in Sri Lanka under the Poisons, Opium and Dangerous Drugs Ordinance of 1935, which is interpreted to cover industrial hemp and CBD as well. Traditional Ayurvedic use IS formally legally recognized, not merely historical: the Ayurveda Act permits the state Ayurvedic Drugs Corporation as the exclusive lawful source of cannabis-based preparations, dispensed by roughly 16,000 licensed Ayurvedic physicians -- though supply has historically relied on police-seized cannabis, often degraded by the time lengthy court cases release it. In August 2025, the Board of Investment approved cannabis cultivation licenses for 7 foreign investors (of 37 proposals) strictly for pharmaceutical-grade export -- each requiring a minimum $5M investment plus a $2M performance bond with the Central Bank -- explicitly not for any domestic market, following Sri Lanka''s 2022 debt default and IMF bailout.',
  regulatory_outlook = 'The August 2025 export scheme is the development to watch, not domestic reform -- officials have stressed zero tolerance for domestic leakage. Sri Lanka''s own National Dangerous Drugs Control Board chairman has publicly questioned the scheme''s economics given global cannabis oversupply. No domestic medical or recreational reform is anticipated.',
  data_source_summary = 'Leafwell; Wikipedia; OneWorld SouthAsia (Aug 2025 licensing detail); MJBizDaily.',
  confidence_score = 0.8,
  confidence_categories = '{"enforcement": 0.75, "market_access": 0.4, "regulatory_framework": 0.75}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry said Ayurvedic use is not formally recognized (it is, via the Ayurveda Act) and omitted the Aug 2025 BOI export-only cultivation scheme entirely", "market": "Sri Lanka", "timeAgo": "19 July 2026", "direction": "up", "sourceRef": "OneWorld SouthAsia; Leafwell", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19', updated_at = now()
WHERE country_iso2 = 'LK';

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Prohibited; No Swiss-Style Reform Adopted',
  public_summary = 'Liechtenstein has not followed Switzerland''s more liberal cannabis trajectory despite the customs union -- its own government has explicitly rejected doing so. Then-Minister of Social Affairs Mauro Pedrazzini said in 2018 he preferred to "wait and see" rather than follow neighboring countries, and did not want Liechtenstein to become a "stoner stronghold in the Rhine Valley." Industrial hemp has been banned outright since a 2005 decree -- stricter than Switzerland''s framework, not aligned with it. Medical access is limited to prescription-only Sativex and Epidiolex via the EMA pharmaceutical pathway (as a European Medicines Agency-linked market), not general access to "Swiss-authorised" cannabis medicines. Cannabis under the 1983 Law on Narcotics and Psychotropic Substances is defined only above 1% THC; sub-threshold CBD sits in an unresolved gray zone rather than being affirmatively legal, and as a non-EU state Liechtenstein is not bound by EU-level CBD rulings.',
  regulatory_outlook = 'No reform is anticipated. The only organized reform push (2018, Free List party) did not advance and was explicitly rejected by the responsible minister; no government initiative has followed. Liechtenstein''s trajectory should not be assumed to track Switzerland''s.',
  data_source_summary = 'Wikipedia; Leafwell; Cannigma; CannaConnection.',
  confidence_score = 0.82,
  confidence_categories = '{"enforcement": 0.7, "market_access": 0.15, "regulatory_framework": 0.8}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry overstated Swiss regulatory alignment; Liechtenstein''s government explicitly rejected following Switzerland''s approach in 2018 and has banned industrial hemp outright since 2005", "market": "Liechtenstein", "timeAgo": "19 July 2026", "direction": "down", "sourceRef": "Wikipedia; Leafwell", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19', updated_at = now()
WHERE country_iso2 = 'LI';

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Prohibited; Narrow Domestic Sativex-Only Medical Access',
  public_summary = 'San Marino''s medical cannabis access is a narrow, self-administered domestic program, not access via Italian AIFA protocols. Since 2016, following a citizen-initiated istanza d''Arengo, San Marino has provided the pharmaceutical Sativex free of charge through its own health system for two specific conditions (MS-related pain, spinal cord/bone-marrow pain) -- imported as a finished product, with cultivation illegal even for this purpose. In 2021 San Marino entered a research partnership with Italy (data-sharing, clinical trials, continuing education), which is distinct from a general AIFA-protocol access arrangement. A 2019 proposal to regulate recreational use (30g possession, 4-plant home grow) was approved but reversed by Parliament in March 2020, which opted to wait and follow Italy''s lead -- Italy has not itself legalized recreational cannabis. Outside the Sativex program, narcotics penalties (3-8 years plus fine) apply without a specific lighter cannabis carve-out.',
  regulatory_outlook = 'No independent reform is anticipated; San Marino remains loosely tethered to Italy via the 2021 research partnership rather than full regulatory integration. Any recreational movement is tied to Italy''s own (currently absent) reform trajectory.',
  data_source_summary = 'Wikipedia; Leafwell; Cannigma; CannaConnection.',
  confidence_score = 0.78,
  confidence_categories = '{"enforcement": 0.65, "market_access": 0.15, "regulatory_framework": 0.75}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry characterized medical access as via Italian AIFA protocols; it is a narrow, self-administered domestic Sativex-only program since 2016, distinct from a 2021 Italy research partnership", "market": "San Marino", "timeAgo": "19 July 2026", "direction": "down", "sourceRef": "Wikipedia; Leafwell", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19', updated_at = now()
WHERE country_iso2 = 'SM';

UPDATE public.cc_jurisdiction_briefings
SET
  public_summary = 'Trinidad and Tobago decriminalized possession of up to 30 grams of cannabis in 2019 through the Dangerous Drugs (Amendment) Act. Separately, the Cannabis Control Act, 2022 created the Cannabis Licensing Authority in statute -- but as of mid-2026 the Act had not been proclaimed into force, meaning the Authority has not been constituted as an operating body and no commercial licenses of any kind (cultivation, dispensary, or otherwise) have been issued. Full commercial operations had not yet launched.',
  regulatory_outlook = 'Proclamation of the 2022 Act, not further framework development, is the key near-term event to watch -- the statutory framework already exists on paper and is simply dormant pending proclamation. A medical program launch followed by potential adult-use licensing is the anticipated trajectory once proclaimed.',
  change_notes = change_notes || '[{"title": "Clarification: the Cannabis Licensing Authority exists in statute (2022 Act) but has not been proclaimed into an operating body -- prior phrasing implied active framework development rather than dormancy pending proclamation", "market": "Trinidad and Tobago", "timeAgo": "19 July 2026", "direction": "neutral", "sourceRef": "Trinidad and Tobago Parliament (Act record); Jamaica Experiences regional guide", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19', updated_at = now()
WHERE country_iso2 = 'TT';

UPDATE public.cc_jurisdiction_briefings
SET
  public_summary = 'Lebanon passed Law No. 178 in April 2020, legalizing cannabis cultivation for medical and industrial purposes -- the first Arab country to do so. The implementing Regulatory Authority for Cannabis Cultivation for Medical and Industrial Use was only formally constituted in summer 2025, five years after the law''s passage, under current head Dani Fayyad. As of early 2026 the Authority itself indicated the 2026 timeline was too tight to support even a first legal harvest; no functioning legal purchase channel exists for patients, consumers, or export buyers. The Bekaa Valley remains a historically significant illicit hashish production region operating largely undisturbed by the still-dormant legal framework.',
  regulatory_outlook = 'A first legal harvest -- not export licensing -- is the realistic near-term milestone, and even that was described by the Authority itself as a stretch for 2026. Morocco, which passed comparable legislation a year later (2021), reached licensed commercial exports within three years; Lebanon''s five-year gap between law and functioning regulator is the more useful implementation benchmark than the law''s 2020 passage date.',
  change_notes = change_notes || '[{"title": "Correction: prior entry described the legal framework as \"in place\" with the regulator operating under the Ministry of Economy; the implementing Authority was only constituted in summer 2025 and had enabled no legal harvest as of early 2026", "market": "Lebanon", "timeAgo": "19 July 2026", "direction": "down", "sourceRef": "Herb; CMS Expert Guides; The Beiruter", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19', updated_at = now()
WHERE country_iso2 = 'LB';

UPDATE public.cc_jurisdiction_briefings
SET
  change_notes = change_notes || '[{"title": "Flagged, not corrected: a cited 2023 Health (Amendment) Act establishing a \"permanent\" MCAP framework, and an already-introduced diversion scheme, could not be corroborated across two independent research passes -- both instead found MCAP still described as a pilot and a diversion scheme as planned under the National Drugs Strategy 2026-2029, not yet enacted. Worth direct verification against HPRA/Oireachtas records rather than treating either version as settled.", "market": "Ireland", "timeAgo": "19 July 2026", "direction": "neutral", "sourceRef": "HPRA MCAP page; Herb; Business of Cannabis", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-19', updated_at = now()
WHERE country_iso2 = 'IE';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720101504','correct_cc_briefings_batch3_ae_lk_li_sm_full_tt_lb_light_ie_flag','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720101504_correct_cc_briefings_batch3_ae_lk_li_sm_full_tt_lb_light_ie_flag.sql

-- RECOVERY BEGIN 20260720102441_create_jurisdiction_cross_table_conflict_check.sql
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
-- version 20260720102441.
--
-- Rewriting this file cannot affect production: 20260720102441 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Automates the manual cross-check that caught 11 of 16 real errors this session, so it stops
-- depending on someone remembering to ask for it. Encodes the three error classes actually found:
--   1. polarity_conflict -- one table says prohibited, the other implies a legal/reform pathway
--      (caught Namibia, Turkey).
--   2. maturity_understated -- playbook documents a real operational program (populated steps +
--      3+ market_metrics) while the briefing says no program exists / just "interest" (caught
--      Saint Vincent).
--   3. briefing_predates_playbook -- the playbook has newer research than the briefing has
--      absorbed (staleness, cross-table version of playbook_staleness_queue).
-- Explicitly NOT caught: specific-fact errors like Grenada's wrong year, or the two neighbor-
-- conflation cases (Namibia/South Africa, Grenada/Trinidad) -- those needed a human/agent to
-- actually read and reason about the text. This is a heuristic worklist, not a fact-checker;
-- it narrows 302 rows down to a short review queue, it doesn't replace reading them.

CREATE OR REPLACE VIEW public.jurisdiction_cross_table_conflicts AS
WITH jp AS (
  SELECT
    country_iso2, country_name, difficulty, last_reviewed,
    (jsonb_array_length(steps) > 0) AS has_market_pathway,
    (steps = '[]'::jsonb AND estimated_cost_range ILIKE 'Not applicable%') AS looks_prohibited
  FROM public.jurisdiction_playbooks
  WHERE status = 'published'
),
mm AS (
  SELECT country_iso2, count(*) AS metric_count
  FROM public.market_metrics
  GROUP BY country_iso2
),
cc AS (
  SELECT
    country_iso2, program_status, last_reviewed_date,
    (program_status ILIKE 'Prohibited%') AS status_says_prohibited,
    (program_status ILIKE 'Decriminalized%' OR program_status ILIKE 'Medical%' OR program_status ILIKE 'Legal%') AS status_says_reform,
    (program_status ILIKE '%no formal%' OR public_summary ILIKE '%no formal%program%' OR public_summary ILIKE '%expressed interest in developing%') AS status_understates_maturity
  FROM public.cc_jurisdiction_briefings
)
SELECT
  jp.country_iso2,
  jp.country_name,
  jp.difficulty AS playbook_difficulty,
  jp.last_reviewed AS playbook_last_reviewed,
  cc.program_status AS briefing_program_status,
  cc.last_reviewed_date AS briefing_last_reviewed,
  coalesce(mm.metric_count, 0) AS playbook_metric_count,
  CASE
    WHEN jp.looks_prohibited AND cc.status_says_reform
      THEN 'polarity_conflict: playbook says prohibited, briefing implies reform/legal'
    WHEN jp.has_market_pathway AND cc.status_says_prohibited
      THEN 'polarity_conflict: playbook documents a real pathway, briefing says prohibited'
    WHEN jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity
      THEN 'maturity_understated: briefing implies no program despite playbook + metrics documenting an operational one'
    WHEN cc.last_reviewed_date < jp.last_reviewed
      THEN 'briefing_predates_playbook: playbook has newer research the briefing may not reflect'
    ELSE NULL
  END AS conflict_type
FROM jp
JOIN cc ON cc.country_iso2 = jp.country_iso2
LEFT JOIN mm ON mm.country_iso2 = jp.country_iso2
WHERE
  (jp.looks_prohibited AND cc.status_says_reform)
  OR (jp.has_market_pathway AND cc.status_says_prohibited)
  OR (jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity)
  OR (cc.last_reviewed_date < jp.last_reviewed)
ORDER BY
  CASE
    WHEN jp.looks_prohibited AND cc.status_says_reform THEN 1
    WHEN jp.has_market_pathway AND cc.status_says_prohibited THEN 1
    WHEN jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity THEN 2
    ELSE 3
  END;

COMMENT ON VIEW public.jurisdiction_cross_table_conflicts IS
  'Automated version of the manual cc_jurisdiction_briefings-vs-jurisdiction_playbooks audit from 19-Jul-2026 that found 11/16 real discrepancies. Re-run after any batch touching either table.';

-- Expose both QA views through the api schema (matching the pattern used for content tables)
-- but restrict to service_role only -- these are internal review worklists, not user-facing
-- content, so they should not carry the anon/authenticated SELECT grants content views get.

CREATE OR REPLACE VIEW api.jurisdiction_cross_table_conflicts AS
  SELECT * FROM public.jurisdiction_cross_table_conflicts;

CREATE OR REPLACE VIEW api.playbook_staleness_queue AS
  SELECT * FROM public.playbook_staleness_queue;

REVOKE ALL ON api.jurisdiction_cross_table_conflicts FROM anon, authenticated;
GRANT SELECT ON api.jurisdiction_cross_table_conflicts TO service_role, postgres;

REVOKE ALL ON api.playbook_staleness_queue FROM anon, authenticated;
GRANT SELECT ON api.playbook_staleness_queue TO service_role, postgres;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720102441','create_jurisdiction_cross_table_conflict_check','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720102441_create_jurisdiction_cross_table_conflict_check.sql

-- RECOVERY BEGIN 20260720120000_jurisdiction_playbooks_timeline_positive_check.sql
-- Applied directly to production via Supabase MCP apply_migration on 2026-07-20.
-- This file reconciles the migration ledger (supabase_migrations.schema_migrations)
-- with the change already live in production.
--
-- Root cause this guards against: typical_timeline_months on jurisdiction_playbooks
-- has twice been fabricated as 0 (a placeholder value) by manual SQL content-migration
-- batches, most recently reintroduced after the first fix (see
-- 20260718184353_playbook_null_fabricated_timelines.sql and the 2026-07-19/2026-07-20
-- EVIDENCE_LOG.md entries). There is no application write path for this column — all
-- writes are hand-authored migrations — so there is no code-level guard to add. This
-- CHECK constraint makes a future zero-value batch fail loudly at migration time
-- instead of silently landing on a published, customer-facing table.
-- Converted to a no-op stub on 2026-07-22: re-running the ALTER TABLE
-- below fails ("constraint already exists"). Confirmed live via
-- pg_constraint that jurisdiction_playbooks_timeline_months_positive_check
-- already exists -- the real work was already applied to production under
-- the neighboring version 20260720090637 (same filename, ~5 hours later).
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720120000','jurisdiction_playbooks_timeline_positive_check','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720120000_jurisdiction_playbooks_timeline_positive_check.sql

-- RECOVERY BEGIN 20260720130000_source_registry_coverage_summary_rpc.sql
-- Applied directly to production via Supabase MCP apply_migration on 2026-07-20.
-- This file reconciles the migration ledger (supabase_migrations.schema_migrations)
-- with the change already live in production.
--
-- Context: PR #1081 adds a "Registry Coverage" stat to the Evidence & Sources
-- page, backed by public.source_registry. That table's only RLS SELECT policy
-- (admin_operator_select) requires internal user_roles admin/operator staff --
-- it does not admit paying customers (user_profiles.tier). The api.source_registry
-- view is an unfiltered `select *` over the base table (source_url, adapter,
-- crawl_cadence, notes, last_error_log, locked_by, network_status, etc. --
-- internal crawler operational data). Broadening source_registry's RLS to admit
-- logged-in dashboard users would have handed every one of those columns to any
-- authenticated caller through that view, in violation of this repo's own
-- "no raw Supabase row without DTO projection" rule.
--
-- This RPC returns only the three aggregate fields the stat card actually needs
-- (no raw rows, no URLs/adapter/notes) and is granted to `authenticated` only --
-- the dashboard this feeds already requires login. source_registry's own RLS is
-- left untouched; crawler internals stay internal.
create or replace function api.get_source_registry_coverage(p_iso2 text)
returns table (total_active int, tier1_count int, languages text[])
language plpgsql stable security definer set search_path to ''
as $function$
begin
  if p_iso2 is null then return; end if;
  return query
  select count(*)::int, count(*) filter (where r.tier = 1)::int,
         array_agg(distinct r.language) filter (where r.language is not null)
  from public.source_registry r
  where r.iso = upper(p_iso2) and r.is_active = true;
end;
$function$;

comment on function api.get_source_registry_coverage(text) is
  'Aggregate-only source_registry coverage summary (total active, tier-1 count, distinct languages) for a country. Returns no raw rows/URLs/adapter internals -- safe for logged-in dashboard users regardless of internal user_roles membership.';

revoke all on function api.get_source_registry_coverage(text) from public;
grant execute on function api.get_source_registry_coverage(text) to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720130000','source_registry_coverage_summary_rpc','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720130000_source_registry_coverage_summary_rpc.sql

-- RECOVERY BEGIN 20260720134650_exclude_competitor_sources.sql
-- Restore the exact production-owned body for migration 20260720134650.
-- The previous stub omitted public.excluded_source_domains, which later
-- migrations depend on.

-- Policy: never ingest/surface competitor or commercial-aggregator content. Primary sources + licensed feeds only.
create table if not exists public.excluded_source_domains (
  domain text primary key,
  reason text not null default 'competitor/aggregator',
  added_at timestamptz not null default now()
);

insert into public.excluded_source_domains(domain, reason) values
  ('mjbizdaily.com','competitor'),
  ('leafly.com','competitor'),
  ('leafwell.com','competitor'),
  ('herb.co','competitor'),
  ('hightimes.com','competitor'),
  ('cannabisnow.com','aggregator'),
  ('sensiseeds.com','competitor'),
  ('mugglehead.com','aggregator'),
  ('hempindustrydaily.com','competitor'),
  ('hemptoday.net','aggregator'),
  ('news.google.com','aggregator'),
  ('en.wikipedia.org','aggregator')
on conflict (domain) do nothing;

-- Un-publish anything already auto-promoted from an excluded domain (only auto rows; never human).
update public.signals s
set reviewed = false, reviewed_by = null, reviewed_at = null
where s.reviewed_by = 'auto:v1'
  and regexp_replace(s.url, '^https?://(www\.)?([^/]+).*', '\2') in (select domain from public.excluded_source_domains);

-- Promote now refuses excluded domains outright.
create or replace function public.hv_promote_signals(p_min_conf numeric default 0.0)
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare n int;
begin
  update public.signals s set
    reviewed = true, reviewed_by = 'auto:v1', reviewed_at = now()
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and coalesce(s.quality_confidence, 1) >= p_min_conf
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and regexp_replace(coalesce(s.url,''), '^https?://(www\.)?([^/]+).*', '\2')
        not in (select domain from public.excluded_source_domains);
  get diagnostics n = row_count;
  return n;
end$fn$;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720134650','exclude_competitor_sources','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720134650_exclude_competitor_sources.sql

-- RECOVERY BEGIN 20260720135843_build1_entity_linking.sql
-- Restore the exact production-owned body for migration 20260720135843.
-- The previous stub omitted public.hv_entity_jobs and public.signal_entities,
-- which later migrations dereference.

-- Build 1: connect promoted signals to the graph. Extract named entities → resolve/create graph node → link.
create table if not exists public.signal_entities (
  signal_id text not null,
  entity_id text not null,
  mention_text text,
  entity_type text,
  confidence numeric,
  created_at timestamptz not null default now(),
  primary key (signal_id, entity_id)
);
create index if not exists signal_entities_entity on public.signal_entities(entity_id);

create table if not exists public.hv_entity_jobs (
  request_id bigint primary key,
  signal_id text not null,
  harvested boolean not null default false
);

-- Dispatch entity extraction for promoted signals not yet processed.
create or replace function public.hv_entities_dispatch(p_limit int default 60)
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare r record; v_rid bigint; n int:=0;
begin
  for r in
    select s.id, coalesce(s.title_en,s.headline) as h, coalesce(s.summary_en,left(s.summary,900),'') as sm
    from public.signals s
    where s.reviewed_by='auto:v1'
      and not exists (select 1 from public.signal_entities se where se.signal_id=s.id)
      and not exists (select 1 from public.hv_entity_jobs j where j.signal_id=s.id and not j.harvested)
    order by s.created_at desc
    limit p_limit
  loop
    select net.http_post(
      url:='https://api.openai.com/v1/chat/completions',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='openai_api_key')),
      body:=jsonb_build_object('model','gpt-4o-mini','temperature',0,'response_format',jsonb_build_object('type','json_object'),
        'messages',jsonb_build_array(
          jsonb_build_object('role','system','content','Extract NAMED organizations from this cannabis-industry news item. Include licensed operators/companies, regulators/government bodies, and investors/financial firms. Return ONLY JSON {"entities":[{"name":"...","type":"operator|regulator|investor|other"}]}. Named entities only — no generic terms, no country names alone. Empty array if none.'),
          jsonb_build_object('role','user','content','HEADLINE: '||r.h||E'\nSUMMARY: '||r.sm)
        )),
      timeout_milliseconds:=30000
    ) into v_rid;
    insert into public.hv_entity_jobs(request_id, signal_id) values (v_rid, r.id) on conflict do nothing;
    n:=n+1;
  end loop;
  return n;
end$fn$;

-- Harvest: resolve each entity to a graph node (create if new), write the signal↔entity link, bump signal_count.
create or replace function public.hv_entities_harvest()
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare r record; ent jsonb; v_name text; v_type text; v_eid text; n int:=0;
begin
  for r in
    select j.request_id, j.signal_id, resp.status_code, resp.content
    from public.hv_entity_jobs j join net._http_response resp on resp.id=j.request_id
    where not j.harvested
  loop
    if r.status_code=200 then
      begin
        for ent in select * from jsonb_array_elements(((r.content::jsonb->'choices'->0->'message'->>'content')::jsonb)->'entities')
        loop
          v_name := btrim(ent->>'name');
          v_type := coalesce(nullif(btrim(ent->>'type'),''),'other');
          if v_name is null or length(v_name) < 2 then continue; end if;
          select id into v_eid from public.ia_graph_entities where lower(label)=lower(v_name) limit 1;
          if v_eid is null then
            v_eid := 'ent:'||substr(md5(lower(v_name)),1,20);
            insert into public.ia_graph_entities(id,type,label,signal_count,last_activity,created_at,updated_at)
            values (v_eid, v_type, v_name, 0, now(), now(), now())
            on conflict (id) do nothing;
          end if;
          insert into public.signal_entities(signal_id, entity_id, mention_text, entity_type, confidence)
          values (r.signal_id, v_eid, v_name, v_type, 0.8)
          on conflict (signal_id, entity_id) do nothing;
          update public.ia_graph_entities set signal_count=coalesce(signal_count,0)+1, last_activity=now() where id=v_eid;
          n:=n+1;
        end loop;
      exception when others then null;
      end;
    end if;
    update public.hv_entity_jobs set harvested=true where request_id=r.request_id;
  end loop;
  return n;
end$fn$;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720135843','build1_entity_linking','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720135843_build1_entity_linking.sql

-- RECOVERY BEGIN 20260720184212_build1_wire_entities_into_tick.sql
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
-- version 20260720184212.
--
-- Rewriting this file cannot affect production: 20260720184212 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Wire entity extraction (Build 1) into the running pipeline tick. Idempotent re-apply of the live function.
create or replace function public.hv_pipeline_tick()
returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare v_tr_h int; v_cl_h int; v_em_h int; v_ent_h int; v_cl_d int; v_tr_d int; v_em_d int := 0; v_ent_d int; v_ids text[];
begin
  v_tr_h := public.hv_translate_harvest();
  v_cl_h := public.hv_classify_corpus_harvest();
  v_em_h := public.hv_embed_harvest();
  v_ent_h := public.hv_entities_harvest();

  v_tr_d := public.hv_translate_dispatch(40, false);
  v_cl_d := public.hv_classify_corpus_dispatch(120, 400);
  v_ent_d := public.hv_entities_dispatch(40);

  select array_agg(id) into v_ids from (
    select s.id from public.signals s where s.quality_label='signal' and s.embedding_1024 is null order by s.created_at desc limit 100
  ) q;
  if v_ids is not null then perform public.hv_embed_dispatch(v_ids); v_em_d := array_length(v_ids,1); end if;

  return jsonb_build_object('classify_dispatched',v_cl_d,'entities_harvested',v_ent_h,'entities_dispatched',v_ent_d,'embed_dispatched',v_em_d);
end$fn$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720184212','build1_wire_entities_into_tick','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720184212_build1_wire_entities_into_tick.sql

-- RECOVERY BEGIN 20260720184821_build2_legislative_bills.sql
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
-- version 20260720184821.
--
-- Rewriting this file cannot affect production: 20260720184821 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Build 2: leading-indicator sourcing. Legislative bills = "change is coming", ahead of press.
create table if not exists public.legislative_bills (
  market text not null,
  bill_id text not null,
  title text,
  stage text,
  house text,
  last_update timestamptz,
  is_act boolean,
  withdrawn boolean,
  source_url text,
  fetched_at timestamptz not null default now(),
  primary key (market, bill_id)
);

-- Reusable harvester: parse a UK Parliament Bills API response (by pg_net request id) into legislative_bills.
create or replace function public.hv_billwatch_uk_harvest(p_rid bigint)
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare n int:=0; it jsonb;
begin
  for it in select value from net._http_response r, jsonb_array_elements((r.content::jsonb)->'items') value where r.id=p_rid and r.status_code=200
  loop
    insert into public.legislative_bills(market, bill_id, title, stage, house, last_update, is_act, withdrawn, source_url, fetched_at)
    values ('GB', it->>'billId', it->>'shortTitle',
            it->'currentStage'->>'description', it->>'currentHouse',
            nullif(it->>'lastUpdate','')::timestamptz, (it->>'isAct')::boolean,
            (it->>'billWithdrawn') is not null,
            'https://bills.parliament.uk/bills/'||(it->>'billId'), now())
    on conflict (market, bill_id) do update set
      stage=excluded.stage, last_update=excluded.last_update, is_act=excluded.is_act,
      withdrawn=excluded.withdrawn, fetched_at=now();
    n:=n+1;
  end loop;
  return n;
end$fn$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720184821','build2_legislative_bills','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720184821_build2_legislative_bills.sql

-- RECOVERY BEGIN 20260720185717_signals_quality_reviewed_bypass.sql
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
-- version 20260720185717.
--
-- Rewriting this file cannot affect production: 20260720185717 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Fix: promoted/reviewed signals were still filtered out by signals_quality's pre-classifier score band,
-- hiding ~70% of what the quality brain approved. Quality-approved rows now bypass the score band.
create or replace view public.signals_quality as
 SELECT id, date, cat, pri, score, headline, summary, source, url, verification, tier, lang,
    company, country, in_network, lane_r, lane_e, lane_t, top_lane, query_pack, commercial_impact,
    reviewed, action, created_at, embedding_1024, embedding_model, embedded_at,
    analysis, analysis_generated_at, analysis_backend
   FROM signals
  WHERE (action IS NULL OR action <> 'rejected'::text)
    AND (
         reviewed = true
      OR (cat <> ALL (ARRAY['SOURCE_ENGINE'::text, 'GAZETTE'::text]))
      OR (cat = 'SOURCE_ENGINE'::text AND score >= 50 AND score < 90)
      OR (cat = 'GAZETTE'::text AND score >= 70)
    );


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720185717','signals_quality_reviewed_bypass','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720185717_signals_quality_reviewed_bypass.sql

-- RECOVERY BEGIN 20260720200000_intel_editorial_pipeline_reconcile.sql
-- Reconciliation migration: brings repo in line with the live intelligence
-- "editorial feed" pipeline built directly against production this session.
-- Captures editorial titles, source tiering (gov/press/exclude), freshness gating,
-- semantic dedup, and the classify→title→promote→dedup tick. Extracted verbatim
-- from the live database (pg_get_functiondef / pg_get_viewdef) so it matches prod.
--
-- NOTE: the pg_cron jobs are environment state, not created here. Live jobs:
--   job 13 'hv-embed-every-30min' : SELECT public.hv_trigger_embed();  (25,55 * * * *)
--   job 38 'intel-classify-promote': SELECT public.intel_pipeline_tick(); (*/4 * * * *)
-- Recreate with cron.schedule(<name>,<cron>,<cmd>) after applying, if provisioning fresh.

-- ── editorial columns ─────────────────────────────────────────────────────────
alter table public.signals add column if not exists editorial_title text;
alter table public.signals add column if not exists editorial_blurb text;

-- ── remove the stale no-arg overload that made dedup_promoted_feed() ambiguous ──
drop function if exists public.dedup_promoted_feed();

-- ── views (api surface + source tiering) ──────────────────────────────────────
create or replace view public.source_domain_type as
 SELECT domain, tier, source_type,
    CASE
        WHEN source_type = ANY (ARRAY['regulator','government_official','government_release','regulator_official','regulatory_filing','primary_legislation']) THEN 'gov'
        WHEN source_type = ANY (ARRAY['trade','trade_press','industry_press','news','mainstream_media','legal_analysis','academic']) THEN 'press'
        ELSE 'exclude'
    END AS bucket
   FROM ( SELECT regexp_replace(lower(source_url), '^https?://(www\.)?([^/]+).*$', '\2') AS domain,
            min(tier) AS tier,
            (array_agg(source_type ORDER BY tier))[1] AS source_type
           FROM public.source_registry
          WHERE source_url IS NOT NULL
          GROUP BY regexp_replace(lower(source_url), '^https?://(www\.)?([^/]+).*$', '\2')) x;

create or replace view api.signals as
 SELECT id, date, cat, pri, score, headline, summary, source, url, verification, tier, lang,
    company, country, in_network, lane_r, lane_e, lane_t, top_lane, query_pack, commercial_impact,
    reviewed, action, created_at, embedding_1024, embedding_model, embedded_at, reviewed_by, reviewed_at,
    editorial_title, editorial_blurb, country_iso2
   FROM public.signals;

create or replace view api.signal_classifications as
 SELECT id, signal_id, quality_label, content_type, impact, confidence, model, created_at
   FROM public.signal_classifications;

create or replace view api.intel_eval_predictions as
 SELECT id, run_id, signal_id, quality_label, content_type, impact, confidence, reason, model, created_at
   FROM public.intel_eval_predictions;

create or replace view api.intel_classify_review_queue as
 SELECT signal_id, headline, summary, reason, resolved, created_at
   FROM public.intel_classify_review_queue;

-- ── functions ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_junk_headline(h text)
 RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO 'public','pg_temp'
AS $function$
  select h is null
    or length(btrim(h)) < 20
    or h ~* '(most read|delivered every|no paywall|related news|related posts|skip to content|newsletter|subscribe now|sign ?up|log ?in|cookie policy|privacy policy|read more|share this|all rights reserved|^menu\M|^home\M)';
$function$;

CREATE OR REPLACE FUNCTION public.signal_bucket(p_url text)
 RETURNS text LANGUAGE sql STABLE SET search_path TO 'public','pg_temp'
AS $function$
  select coalesce(
    (select d.bucket from public.source_domain_type d
      where d.domain = regexp_replace(lower(coalesce(p_url,'')),'^https?://(www\.)?([^/]+).*$','\2')
      limit 1),
    'unknown');
$function$;

CREATE OR REPLACE FUNCTION api.apply_editorial_title(p_signal_id text, p_title text, p_blurb text)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
declare n int;
begin
  update public.signals
    set editorial_title=p_title, editorial_blurb=p_blurb, headline=p_title,
        summary=coalesce(nullif(p_blurb,''), summary)
  where id=p_signal_id;
  get diagnostics n = row_count;
  return n;
end$function$;

CREATE OR REPLACE FUNCTION public.dedup_promoted_feed(p_sim double precision DEFAULT 0.72)
 RETURNS integer LANGUAGE plpgsql SET search_path TO 'public','pg_temp'
AS $function$
declare r record; kept_ids text[] := '{}'; removed int := 0;
begin
  for r in
    select id, coalesce(url,'') as url, embedding_1024 as emb,
           lower(btrim(coalesce(editorial_title, headline))) as core
    from public.signals
    where reviewed=true and action like 'Promoted by classifier%'
    order by coalesce(created_at,'2000-01-01'::timestamptz), id
  loop
    if exists (
      select 1 from public.signals k
      where k.id = any(kept_ids) and (
        (r.url <> '' and r.url = coalesce(k.url,'')
           and r.url !~* '/feed/|/rss|rss\?|news\.google|/search\?')
        or (r.emb is not null and k.embedding_1024 is not null
           and (1 - (r.emb <=> k.embedding_1024)) >= p_sim)
        or similarity(r.core, lower(btrim(coalesce(k.editorial_title,k.headline)))) > 0.72
      )
    ) then
      update public.signals set reviewed=false, action='Deduped (semantic)' where id=r.id;
      removed := removed + 1;
    else
      kept_ids := kept_ids || r.id;
    end if;
  end loop;
  return removed;
end$function$;

CREATE OR REPLACE FUNCTION api.rows_needing_titles(p_limit integer DEFAULT 25)
 RETURNS TABLE(signal_id text, headline text, summary text)
 LANGUAGE sql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
  select s.id, s.headline, s.summary
  from public.signals s
  join public.signal_classifications c on c.signal_id = s.id and c.quality_label='signal'
  where s.editorial_title is null and not public.is_junk_headline(s.headline)
  order by s.created_at desc limit p_limit;
$function$;

CREATE OR REPLACE FUNCTION api.pool_rows_needing_classification(p_limit integer DEFAULT 50)
 RETURNS TABLE(signal_id text, headline text, summary text)
 LANGUAGE sql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
  select s.id, s.headline, s.summary
  from public.signals s
  where s.reviewed=false and s.cat='SOURCE_ENGINE'
    and not exists (select 1 from public.signal_classifications c where c.signal_id=s.id)
    and public.signal_bucket(s.url) in ('gov','press')
    and s.url !~* 'google\.|/search\?'
    and s.date >= now() - interval '30 days'
  order by (case when public.signal_bucket(s.url)='gov' then 0 else 1 end), s.date desc nulls last
  limit p_limit;
$function$;

CREATE OR REPLACE FUNCTION api.promote_classified_signals(p_min_confidence numeric DEFAULT 0.65, p_dry_run boolean DEFAULT true, p_limit integer DEFAULT 500)
 RETURNS TABLE(candidate_count bigint, promoted bigint, dry_run boolean)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
declare v_candidates bigint; v_promoted bigint := 0;
begin
  create temporary table _promote_batch on commit drop as
  select distinct on (c.signal_id) c.signal_id, c.content_type
  from public.signal_classifications c join public.signals s on s.id=c.signal_id
  where s.reviewed=false and c.quality_label='signal'
    and coalesce(c.confidence,0) >= p_min_confidence
    and s.editorial_title is not null
    and public.signal_bucket(s.url) in ('gov','press')
    and s.url !~* 'google\.|/search\?'
    and s.date >= now() - interval '30 days'
  order by c.signal_id, c.created_at desc limit p_limit;
  select count(*) into v_candidates from _promote_batch;
  if p_dry_run then return query select v_candidates,0::bigint,true; return; end if;
  update public.signals s set reviewed=true,
    top_lane=case b.content_type when 'regulatory' then 'Regulatory' when 'market' then 'Economic' else 'Trade' end,
    action='Promoted by classifier (Stage 3)'
  from _promote_batch b where s.id=b.signal_id and s.reviewed=false;
  get diagnostics v_promoted = row_count;
  return query select v_candidates,v_promoted,false;
end$function$;

-- Live version embeds the project's public anon key as the bearer; placeholder here
-- to avoid committing a token. Replace __SUPABASE_ANON_KEY__ before applying to a fresh env.
CREATE OR REPLACE FUNCTION public.intel_pipeline_tick()
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
declare hdr jsonb := jsonb_build_object('content-type','application/json',
  'Authorization','Bearer __SUPABASE_ANON_KEY__');
    url text := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify';
begin
  perform api.promote_classified_signals(0.65, false);
  perform public.dedup_promoted_feed();
  perform net.http_post(url, jsonb_build_object('mode','titles','limit',12), '{}'::jsonb, hdr, 150000);
  perform net.http_post(url, jsonb_build_object('mode','pool','limit',15), '{}'::jsonb, hdr, 150000);
end$function$;

-- ── grants ────────────────────────────────────────────────────────────────────
grant select, insert on api.signal_classifications to service_role;
grant select, insert on api.intel_eval_predictions to service_role;
grant select, insert, update on api.intel_classify_review_queue to service_role;
grant select, update on api.signals to service_role;
grant update (editorial_title, editorial_blurb, headline, summary, top_lane, reviewed, action) on public.signals to service_role;
grant execute on function public.is_junk_headline(text) to service_role;
grant execute on function public.signal_bucket(text) to service_role;
grant execute on function api.apply_editorial_title(text,text,text) to service_role;
grant execute on function api.rows_needing_titles(integer) to service_role;
grant execute on function api.pool_rows_needing_classification(integer) to service_role;
grant execute on function api.promote_classified_signals(numeric,boolean,integer) to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720200000','intel_editorial_pipeline_reconcile','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720200000_intel_editorial_pipeline_reconcile.sql

-- RECOVERY BEGIN 20260720210000_review_queue_selfclean.sql
-- Self-clean the classifier dead-letter queue. intel_classify_review_queue rows
-- that later recover (get classified) or publish were lingering as unresolved,
-- causing an ever-growing "backlog". The tick now resolves them each cycle.
-- (In-scope failures auto-retry via api.pool_rows_needing_classification, which is
--  independent of this queue; out-of-scope/stale rows are resolved separately.)
-- Live version uses the project's public anon key as bearer; placeholder here.
CREATE OR REPLACE FUNCTION public.intel_pipeline_tick()
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
declare hdr jsonb := jsonb_build_object('content-type','application/json',
  'Authorization','Bearer __SUPABASE_ANON_KEY__');
    url text := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify';
begin
  -- self-clean the dead-letter: anything now classified or published is resolved
  update public.intel_classify_review_queue r set resolved=true
  where not coalesce(r.resolved,false)
    and (exists (select 1 from public.signal_classifications c where c.signal_id=r.signal_id)
         or exists (select 1 from public.signals s where s.id=r.signal_id and s.reviewed=true));
  perform api.promote_classified_signals(0.65, false);
  perform public.dedup_promoted_feed();
  perform net.http_post(url, jsonb_build_object('mode','titles','limit',12), '{}'::jsonb, hdr, 150000);
  perform net.http_post(url, jsonb_build_object('mode','pool','limit',15), '{}'::jsonb, hdr, 150000);
end$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260720210000','review_queue_selfclean','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260720210000_review_queue_selfclean.sql

-- RECOVERY BEGIN 20260721041427_source_registry_coverage_summary_rpc.sql
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
-- version 20260721041427.
--
-- Rewriting this file cannot affect production: 20260721041427 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create or replace function api.get_source_registry_coverage(p_iso2 text)
returns table (total_active int, tier1_count int, languages text[])
language plpgsql stable security definer set search_path to ''
as $function$
begin
  if p_iso2 is null then return; end if;
  return query
  select count(*)::int, count(*) filter (where r.tier = 1)::int,
         array_agg(distinct r.language) filter (where r.language is not null)
  from public.source_registry r
  where r.iso = upper(p_iso2) and r.is_active = true;
end;
$function$;

comment on function api.get_source_registry_coverage(text) is
  'Aggregate-only source_registry coverage summary (total active, tier-1 count, distinct languages) for a country. Returns no raw rows/URLs/adapter internals -- safe for logged-in dashboard users regardless of internal user_roles membership.';

revoke all on function api.get_source_registry_coverage(text) from public;
grant execute on function api.get_source_registry_coverage(text) to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260721041427','source_registry_coverage_summary_rpc','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260721041427_source_registry_coverage_summary_rpc.sql

-- RECOVERY BEGIN 20260721063000_fix_signal_review_rpcs_missing_authz.sql
-- Applied directly to production via Supabase MCP apply_migration on 2026-07-21.
-- This file reconciles the migration ledger with the change already live in production.
--
-- Found via a proactive get_advisors security scan: five SECURITY DEFINER functions
-- in api that mutate public.signals had no internal authorization check -- only
-- PostgREST grants gated them, and all five were granted to anon/authenticated.
-- Same vulnerability class as the api.set_regulatory_tier / api.accept_classifier_tier
-- gap fixed earlier (see 20260711170000_fix_regulatory_tier_rpc_missing_authz.sql):
-- the app-level admin gate (lib/signals-engine/admin.ts is only ever called from an
-- internal admin page) was never enforced at the database layer, so anyone with the
-- public anon key could call these RPCs directly via /rest/v1/rpc/... and:
--   - approve_engine_signal / reject_engine_signal: mark any signal reviewed/approved
--     or rejected, with a fully spoofable reviewed_by
--   - bulk_approve_engine_queue: called with zero arguments, mass-approves the entire
--     SOURCE_ENGINE review queue platform-wide
--   - apply_editorial_title: rewrite any signal's public-facing headline/title/blurb
--   - save_signal_analysis: inject arbitrary JSON into the "analysis" shown to
--     dashboard users as commercial intelligence guidance
--
-- Checked public.signals.reviewed_by / analysis_backend for anomalous values before
-- fixing -- all values are legitimate internal pipeline identifiers (auto:v1,
-- automated-truncation-pattern-cleanup, openai). No evidence of prior exploitation.
--
-- Fix: added public.is_genetics_admin_or_reviewer() (existing helper, checks
-- user_roles.role in ('admin','operator','analyst')) as the first statement in all
-- five functions -- broader than admin-only since these are ordinary day-to-day
-- signal-review actions, not admin-restricted ones.
--
-- api.apply_editorial_title also has a legitimate service-role caller
-- (supabase/functions/hv-classify/index.ts calls it with SUPABASE_SERVICE_ROLE_KEY as
-- part of the automated titling pipeline). Service-role JWTs have no user_roles row,
-- so a bare is_genetics_admin_or_reviewer() check would have broken that pipeline.
-- Gated on `(select auth.role()) is distinct from 'service_role' and not
-- is_genetics_admin_or_reviewer()` instead, admitting both callers. Confirmed via
-- grep that none of the other four functions have any service-role caller anywhere
-- in the repo, so they get the plain admin/operator/analyst-only check.

create or replace function api.approve_engine_signal(p_id text, p_user_id text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  UPDATE public.signals SET reviewed = true, action = 'approved', reviewed_by = p_user_id, reviewed_at = now() WHERE id = p_id;
  RETURN FOUND;
END;
$function$;

create or replace function api.reject_engine_signal(p_id text, p_user_id text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  UPDATE public.signals SET reviewed = false, action = 'rejected', reviewed_by = p_user_id, reviewed_at = now() WHERE id = p_id;
  RETURN FOUND;
END;
$function$;

create or replace function api.bulk_approve_engine_queue(p_country text default null, p_min_score integer default 0, p_user_id text default null)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE v_count INT;
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  UPDATE public.signals s SET reviewed = true, action = 'approved', reviewed_by = p_user_id, reviewed_at = now()
  WHERE s.cat = 'SOURCE_ENGINE' AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.score >= p_min_score
    AND (p_country IS NULL OR s.country = p_country);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

create or replace function api.apply_editorial_title(p_signal_id text, p_title text, p_blurb text)
returns integer
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare n int;
begin
  if (select auth.role()) is distinct from 'service_role' and not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role or service_role required' using errcode = '42501';
  end if;
  update public.signals
    set editorial_title=p_title, editorial_blurb=p_blurb, headline=p_title,
        summary=coalesce(nullif(p_blurb,''), summary)
  where id=p_signal_id;
  get diagnostics n = row_count;
  return n;
end$function$;

create or replace function api.save_signal_analysis(p_signal_id text, p_analysis jsonb, p_backend text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  UPDATE public.signals
  SET analysis = p_analysis,
      analysis_generated_at = now(),
      analysis_backend = p_backend
  WHERE id = p_signal_id;
  RETURN FOUND;
END;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260721063000','fix_signal_review_rpcs_missing_authz','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260721063000_fix_signal_review_rpcs_missing_authz.sql

-- RECOVERY BEGIN 20260721073000_fix_readonly_review_queue_rpcs_missing_authz.sql
-- Applied directly to production via Supabase MCP apply_migration on 2026-07-21
-- (six separate apply_migration calls, one per function -- see EVIDENCE_LOG.md for why).
-- This file reconciles the migration ledger with the changes already live in production.
--
-- Follow-up to 20260721063000_fix_signal_review_rpcs_missing_authz.sql: that migration
-- fixed 5 write-mutating SECURITY DEFINER functions on public.signals with no internal
-- authorization check. The same get_advisors scan also flagged 6 read-only functions
-- with the identical gap -- lower severity (information disclosure of an internal
-- review queue, not a write/mutation), but still a real exposure: any anon/authenticated
-- caller could read the full unreviewed SOURCE_ENGINE signal queue (headline, summary,
-- source URL, verification tier, per-country breakdown) via /rest/v1/rpc/....
--
-- Callers checked via grep before fixing:
--   - list_engine_review_queue, count_engine_review_queue, list_engine_review_countries:
--     called only from lib/signals-engine/admin.ts (browser, real user session) --
--     plain is_genetics_admin_or_reviewer() check.
--   - get_signals_pending_analysis: no caller anywhere in the repo currently (part of
--     an evolving "signal analysis layer" feature alongside save_signal_analysis,
--     already fixed in the prior migration) -- given the plain check now so it's safe
--     whenever it is wired up.
--   - pool_rows_needing_classification, rows_needing_titles: called by
--     supabase/functions/hv-classify/index.ts via SUPABASE_SERVICE_ROLE_KEY, same as
--     apply_editorial_title in the prior migration. Converted from `language sql` to
--     `language plpgsql` (SQL-language functions can't use IF/RAISE) and given the same
--     `auth.role() = 'service_role' OR is_genetics_admin_or_reviewer()` carve-out.
--
-- Validation: live-tested `select * from api.list_engine_review_countries();` with no
-- privileged session -- raised 42501 insufficient_privilege as expected. Confirmed via
-- pg_proc.prosrc inspection all 6 carry the check and only the two hv-classify callers
-- carry the service-role carve-out.

create or replace function api.list_engine_review_queue(p_country text default null, p_min_score integer default 0, p_limit integer default 50)
returns table(id text, date timestamp with time zone, cat text, headline text, summary text, source text, url text, verification text, tier text, lang text, country text, score integer, reviewed boolean, action text, reviewed_by text, reviewed_at timestamp with time zone, created_at timestamp with time zone)
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  RETURN QUERY
  SELECT s.id, s.date, s.cat, s.headline, s.summary, s.source, s.url, s.verification, s.tier, s.lang, s.country, s.score, s.reviewed, s.action, s.reviewed_by, s.reviewed_at, s.created_at
  FROM public.signals s
  WHERE s.cat = 'SOURCE_ENGINE'
    AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.score >= p_min_score
    AND (p_country IS NULL OR s.country = p_country)
  ORDER BY s.score DESC NULLS LAST, s.date DESC NULLS LAST
  LIMIT p_limit;
END;
$function$;

create or replace function api.count_engine_review_queue(p_country text default null, p_min_score integer default 0)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE v_count INT;
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  SELECT count(*) INTO v_count
  FROM public.signals s
  WHERE s.cat = 'SOURCE_ENGINE'
    AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.score >= p_min_score
    AND (p_country IS NULL OR s.country = p_country);
  RETURN v_count;
END;
$function$;

create or replace function api.list_engine_review_countries()
returns table(country text)
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  RETURN QUERY
  SELECT DISTINCT s.country FROM public.signals s
  WHERE s.cat = 'SOURCE_ENGINE' AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.country IS NOT NULL
  ORDER BY s.country ASC;
END;
$function$;

create or replace function api.get_signals_pending_analysis(p_limit integer default 20, p_signal_id text default null)
returns table(id text, date timestamp with time zone, cat text, headline text, summary text, source text, country text, score integer, verification text)
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  RETURN QUERY
  SELECT s.id, s.date, s.cat, s.headline, s.summary, s.source, s.country, s.score, s.verification
  FROM public.signals s
  WHERE s.reviewed = true
    AND s.analysis IS NULL
    AND s.headline IS NOT NULL
    AND (p_signal_id IS NULL OR s.id = p_signal_id)
  ORDER BY s.date DESC NULLS LAST
  LIMIT p_limit;
END;
$function$;

create or replace function api.pool_rows_needing_classification(p_limit integer default 50)
returns table(signal_id text, headline text, summary text)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  if (select auth.role()) is distinct from 'service_role' and not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role or service_role required' using errcode = '42501';
  end if;
  return query
  select s.id, s.headline, s.summary
  from public.signals s
  where s.reviewed=false and s.cat='SOURCE_ENGINE'
    and not exists (select 1 from public.signal_classifications c where c.signal_id=s.id)
    and public.signal_bucket(s.url) in ('gov','press')
    and s.url !~* 'google\.|/search\?'
    and s.date >= now() - interval '30 days'
  order by (case when public.signal_bucket(s.url)='gov' then 0 else 1 end), s.date desc nulls last
  limit p_limit;
end;
$function$;

create or replace function api.rows_needing_titles(p_limit integer default 25)
returns table(signal_id text, headline text, summary text)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  if (select auth.role()) is distinct from 'service_role' and not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role or service_role required' using errcode = '42501';
  end if;
  return query
  select s.id, s.headline, s.summary
  from public.signals s
  join public.signal_classifications c on c.signal_id = s.id and c.quality_label='signal'
  where s.editorial_title is null and not public.is_junk_headline(s.headline)
  order by s.created_at desc limit p_limit;
end;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260721073000','fix_readonly_review_queue_rpcs_missing_authz','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260721073000_fix_readonly_review_queue_rpcs_missing_authz.sql

-- RECOVERY BEGIN 20260721103655_fix_signal_review_rpcs_missing_authz.sql
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
-- version 20260721103655.
--
-- Rewriting this file cannot affect production: 20260721103655 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create or replace function api.approve_engine_signal(p_id text, p_user_id text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  UPDATE public.signals SET reviewed = true, action = 'approved', reviewed_by = p_user_id, reviewed_at = now() WHERE id = p_id;
  RETURN FOUND;
END;
$function$;

create or replace function api.reject_engine_signal(p_id text, p_user_id text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  UPDATE public.signals SET reviewed = false, action = 'rejected', reviewed_by = p_user_id, reviewed_at = now() WHERE id = p_id;
  RETURN FOUND;
END;
$function$;

create or replace function api.bulk_approve_engine_queue(p_country text default null, p_min_score integer default 0, p_user_id text default null)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE v_count INT;
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  UPDATE public.signals s SET reviewed = true, action = 'approved', reviewed_by = p_user_id, reviewed_at = now()
  WHERE s.cat = 'SOURCE_ENGINE' AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.score >= p_min_score
    AND (p_country IS NULL OR s.country = p_country);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

create or replace function api.apply_editorial_title(p_signal_id text, p_title text, p_blurb text)
returns integer
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare n int;
begin
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  update public.signals
    set editorial_title=p_title, editorial_blurb=p_blurb, headline=p_title,
        summary=coalesce(nullif(p_blurb,''), summary)
  where id=p_signal_id;
  get diagnostics n = row_count;
  return n;
end$function$;

create or replace function api.save_signal_analysis(p_signal_id text, p_analysis jsonb, p_backend text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  UPDATE public.signals
  SET analysis = p_analysis,
      analysis_generated_at = now(),
      analysis_backend = p_backend
  WHERE id = p_signal_id;
  RETURN FOUND;
END;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260721103655','fix_signal_review_rpcs_missing_authz','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260721103655_fix_signal_review_rpcs_missing_authz.sql

-- RECOVERY BEGIN 20260721103919_allow_service_role_apply_editorial_title.sql
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
-- version 20260721103919.
--
-- Rewriting this file cannot affect production: 20260721103919 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create or replace function api.apply_editorial_title(p_signal_id text, p_title text, p_blurb text)
returns integer
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare n int;
begin
  if (select auth.role()) is distinct from 'service_role' and not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role or service_role required' using errcode = '42501';
  end if;
  update public.signals
    set editorial_title=p_title, editorial_blurb=p_blurb, headline=p_title,
        summary=coalesce(nullif(p_blurb,''), summary)
  where id=p_signal_id;
  get diagnostics n = row_count;
  return n;
end$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260721103919','allow_service_role_apply_editorial_title','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260721103919_allow_service_role_apply_editorial_title.sql

-- RECOVERY BEGIN 20260721105456_fix_list_engine_review_queue_authz.sql
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
-- version 20260721105456.
--
-- Rewriting this file cannot affect production: 20260721105456 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create or replace function api.list_engine_review_queue(p_country text default null, p_min_score integer default 0, p_limit integer default 50)
returns table(id text, date timestamp with time zone, cat text, headline text, summary text, source text, url text, verification text, tier text, lang text, country text, score integer, reviewed boolean, action text, reviewed_by text, reviewed_at timestamp with time zone, created_at timestamp with time zone)
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  RETURN QUERY
  SELECT s.id, s.date, s.cat, s.headline, s.summary, s.source, s.url, s.verification, s.tier, s.lang, s.country, s.score, s.reviewed, s.action, s.reviewed_by, s.reviewed_at, s.created_at
  FROM public.signals s
  WHERE s.cat = 'SOURCE_ENGINE'
    AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.score >= p_min_score
    AND (p_country IS NULL OR s.country = p_country)
  ORDER BY s.score DESC NULLS LAST, s.date DESC NULLS LAST
  LIMIT p_limit;
END;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260721105456','fix_list_engine_review_queue_authz','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260721105456_fix_list_engine_review_queue_authz.sql

-- RECOVERY BEGIN 20260721105504_fix_count_engine_review_queue_authz.sql
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
-- version 20260721105504.
--
-- Rewriting this file cannot affect production: 20260721105504 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create or replace function api.count_engine_review_queue(p_country text default null, p_min_score integer default 0)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE v_count INT;
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  SELECT count(*) INTO v_count
  FROM public.signals s
  WHERE s.cat = 'SOURCE_ENGINE'
    AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.score >= p_min_score
    AND (p_country IS NULL OR s.country = p_country);
  RETURN v_count;
END;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260721105504','fix_count_engine_review_queue_authz','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260721105504_fix_count_engine_review_queue_authz.sql

-- RECOVERY BEGIN 20260721105549_fix_list_engine_review_countries_authz.sql
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
-- version 20260721105549.
--
-- Rewriting this file cannot affect production: 20260721105549 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create or replace function api.list_engine_review_countries()
returns table(country text)
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  RETURN QUERY
  SELECT DISTINCT s.country FROM public.signals s
  WHERE s.cat = 'SOURCE_ENGINE' AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.country IS NOT NULL
  ORDER BY s.country ASC;
END;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260721105549','fix_list_engine_review_countries_authz','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260721105549_fix_list_engine_review_countries_authz.sql

-- RECOVERY BEGIN 20260721105811_fix_get_signals_pending_analysis_authz.sql
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
-- version 20260721105811.
--
-- Rewriting this file cannot affect production: 20260721105811 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create or replace function api.get_signals_pending_analysis(p_limit integer default 20, p_signal_id text default null)
returns table(id text, date timestamp with time zone, cat text, headline text, summary text, source text, country text, score integer, verification text)
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  if not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;
  RETURN QUERY
  SELECT s.id, s.date, s.cat, s.headline, s.summary, s.source, s.country, s.score, s.verification
  FROM public.signals s
  WHERE s.reviewed = true
    AND s.analysis IS NULL
    AND s.headline IS NOT NULL
    AND (p_signal_id IS NULL OR s.id = p_signal_id)
  ORDER BY s.date DESC NULLS LAST
  LIMIT p_limit;
END;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260721105811','fix_get_signals_pending_analysis_authz','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260721105811_fix_get_signals_pending_analysis_authz.sql

-- RECOVERY BEGIN 20260721105819_fix_pool_rows_needing_classification_authz.sql
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
-- version 20260721105819.
--
-- Rewriting this file cannot affect production: 20260721105819 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create or replace function api.pool_rows_needing_classification(p_limit integer default 50)
returns table(signal_id text, headline text, summary text)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  if (select auth.role()) is distinct from 'service_role' and not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role or service_role required' using errcode = '42501';
  end if;
  return query
  select s.id, s.headline, s.summary
  from public.signals s
  where s.reviewed=false and s.cat='SOURCE_ENGINE'
    and not exists (select 1 from public.signal_classifications c where c.signal_id=s.id)
    and public.signal_bucket(s.url) in ('gov','press')
    and s.url !~* 'google\.|/search\?'
    and s.date >= now() - interval '30 days'
  order by (case when public.signal_bucket(s.url)='gov' then 0 else 1 end), s.date desc nulls last
  limit p_limit;
end;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260721105819','fix_pool_rows_needing_classification_authz','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260721105819_fix_pool_rows_needing_classification_authz.sql

-- RECOVERY BEGIN 20260721105826_fix_rows_needing_titles_authz.sql
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
-- version 20260721105826.
--
-- Rewriting this file cannot affect production: 20260721105826 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create or replace function api.rows_needing_titles(p_limit integer default 25)
returns table(signal_id text, headline text, summary text)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  if (select auth.role()) is distinct from 'service_role' and not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role or service_role required' using errcode = '42501';
  end if;
  return query
  select s.id, s.headline, s.summary
  from public.signals s
  join public.signal_classifications c on c.signal_id = s.id and c.quality_label='signal'
  where s.editorial_title is null and not public.is_junk_headline(s.headline)
  order by s.created_at desc limit p_limit;
end;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260721105826','fix_rows_needing_titles_authz','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260721105826_fix_rows_needing_titles_authz.sql

-- RECOVERY BEGIN 20260721115037_sanitize_captured_text_in_signal_extraction.sql
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
-- version 20260721115037.
--
-- Rewriting this file cannot affect production: 20260721115037 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Defense-in-depth: hv_extract_signals_from_captured_text previously trusted
-- captured_text verbatim. Pre-2026-07-19 source-engine-fetch captures (mostly
-- Google News RSS "thin" items) can contain raw HTML (<a>/<font>) and
-- undecoded &nbsp; entities in captured_text, which this function then
-- chunks straight into signal_candidates[].text -> signals.headline/summary,
-- producing malformed headlines the classifier correctly reads as
-- "repeated boilerplate" (root-caused 2026-07-21, see the matching backfill
-- migration for already-affected rows). source-engine-fetch's own
-- decodeEntities fix (2026-07-19) stops new captures from having this
-- problem, but this function should not assume upstream is always clean --
-- other/legacy ingestion paths may still write raw HTML into
-- source_snapshots.captured_text.
CREATE OR REPLACE FUNCTION public.hv_extract_signals_from_captured_text(p_batch_size integer DEFAULT 50)
 RETURNS TABLE(snapshot_id uuid, source_name text, country text, candidates_found integer, status_set text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_snap          RECORD;
  v_source        RECORD;
  v_sentences     TEXT[];
  v_sentence      TEXT;
  v_candidates    JSONB;
  v_candidate     JSONB;
  v_kw_count      INT;
  v_chunk_start   INT;
  v_chunk         TEXT;
  v_found         INT;
  v_text_lower    TEXT;

  v_kw_pattern CONSTANT TEXT :=
    '\m(cannabis|hemp|cannabinoid|cbd|thc|marijuana|marihuana|chanvre|'
    'ca[nñ]amo|ganja|kannabis|bhang|canabis|canapa|kif|haschisch|haschish|'
    'hashish|weed|narcotics|narcotic|stupefiant|estupefaciente|'
    'controlled substance|substance contr[oô]l[eé]|'
    'pharmaceutical|pharmaceutique|farmac[eé]utico|'
    'medicinal plant|plante m[eé]dicinale|planta medicinal|'
    'licence|licencia|autorisation|permiso|registro|'
    'import permit|export permit|clinical trial|essai clinique|'
    'ensayo cl[ií]nico|konopie|konopi|hennep|c[aâ]nhamo|maconha|'
    'psilocybin|psychotropic|narcotic drugs|'
    'dea|fda|ema|who|oms|bfarm|mhra|tga|sahpra|anvisa|cofepris|invima|'
    'okana|halmed|imca|cdsco|nafdac|infarmed|swissmedic|ansm|igj|gif|'
    'sukl|zva|vvkt|arcsa|anmat|dangerous drugs board|narcotics control|'
    'pharmacy and poisons board)\M';

  v_boilerplate CONSTANT TEXT[] := ARRAY[
    'opens new tab','creative commons','code of conduct',
    'hardware, software','cookie policy','privacy policy',
    'all rights reserved','javascript','please enable',
    'sign in','log in','subscribe','newsletter','follow us',
    'terms of use','terms of service','contact us','about us',
    'sitemap','search results','page not found','404',
    '403 forbidden','access denied'
  ];

BEGIN

  FOR v_snap IN
    SELECT ss.id, ss.source_id, ss.captured_url, ss.captured_title,
           ss.captured_text, ss.intelligence_pass, ss.language_detected,
           ss.word_count, ss.captured_at
    FROM source_snapshots ss
    WHERE ss.processing_status = 'pending'
      AND ss.signal_candidates IS NULL
      AND ss.fetch_status = 'success'
      AND ss.captured_text IS NOT NULL
      AND length(ss.captured_text) > 50
    ORDER BY ss.captured_at ASC
    LIMIT p_batch_size
  LOOP

    -- 2026-07-21: sanitize before use -- strip HTML tags and decode the
    -- handful of entities seen in raw RSS descriptions (&nbsp; primarily;
    -- &amp;/&lt;/&gt;/&quot;/&#39; for completeness). See migration header.
    v_snap.captured_text := regexp_replace(
      regexp_replace(
        regexp_replace(v_snap.captured_text, '<[^>]+>', ' ', 'g'),
        '&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;', ' ', 'gi'
      ),
      '\s+', ' ', 'g'
    );
    v_snap.captured_text := trim(v_snap.captured_text);

    -- 2026-07-06: added sr.source_type so downstream extraction (hv-extract
    -- edge function) can route mainstream_media snapshots to the editorial
    -- pipeline instead of the trade-signal pipeline. Previously this metadata
    -- was dropped here, so ALL snapshots (including mainstream news) fell
    -- through to trade-signal scoring regardless of source_registry.source_type.
    SELECT sr.source_name, sr.tier, sr.iso, sr.country, sr.region,
           sr.jurisdiction_code, sr.source_type,
           sr.signal_keywords, sr.source_url
    INTO v_source
    FROM source_registry sr WHERE sr.id = v_snap.source_id;

    UPDATE source_snapshots SET processing_status = 'processing' WHERE id = v_snap.id;

    v_candidates := '[]'::JSONB;
    v_found      := 0;
    v_text_lower := lower(v_snap.captured_text);

    IF v_text_lower !~ v_kw_pattern THEN
      UPDATE source_snapshots
        SET processing_status = 'skipped',
            signal_candidates = jsonb_build_object(
              'skip_reason',   'no_keywords_found',
              'source_name',   v_source.source_name,
              'source_country', v_source.country,
              'source_type',   v_source.source_type,
              'source_region', v_source.region,
              'tier',          v_source.tier,
              'item_kind',     'html_snapshot'
            )
      WHERE id = v_snap.id;

      snapshot_id      := v_snap.id;
      source_name      := v_source.source_name;
      country          := v_source.country;
      candidates_found := 0;
      status_set       := 'skipped';
      RETURN NEXT;
      CONTINUE;
    END IF;

    v_sentences := regexp_split_to_array(
      regexp_replace(v_snap.captured_text, E'\\r\\n|\\r', E'\\n', 'g'),
      E'(?<=[.!?।।]\\s)|\\n{2,}'
    );

    v_chunk       := '';
    v_chunk_start := 0;

    FOREACH v_sentence IN ARRAY v_sentences
    LOOP
      v_sentence := trim(v_sentence);
      CONTINUE WHEN length(v_sentence) < 15;

      IF length(v_chunk) + length(v_sentence) > 600 OR v_chunk = '' THEN
        IF length(v_chunk) >= 30 THEN
          DECLARE
            v_chunk_lower TEXT := lower(v_chunk);
            v_kc INT := 0;
            v_is_boilerplate BOOLEAN := FALSE;
            v_bp TEXT;
          BEGIN
            SELECT COUNT(*) INTO v_kc
            FROM regexp_matches(v_chunk_lower, v_kw_pattern, 'g') AS m;

            IF v_kc > 0 THEN
              FOREACH v_bp IN ARRAY v_boilerplate LOOP
                IF v_chunk_lower LIKE '%' || v_bp || '%' THEN
                  v_is_boilerplate := TRUE;
                  EXIT;
                END IF;
              END LOOP;

              IF NOT v_is_boilerplate AND length(trim(v_chunk)) >= 30 THEN
                v_candidate := jsonb_build_object(
                  'text',               left(v_chunk, 500),
                  'keyword_count',      v_kc,
                  'source_country',     v_source.country,
                  'source_iso',         v_source.iso,
                  'source_type',        v_source.source_type,
                  'source_name',        v_source.source_name,
                  'source_region',      v_source.region,
                  'lead_weeks',         4,
                  'intelligence_pass',  COALESCE(v_snap.intelligence_pass, 1),
                  'requires_translation',
                    CASE WHEN v_snap.language_detected NOT IN ('en', 'english')
                         THEN TRUE ELSE FALSE END
                );
                v_candidates := v_candidates || v_candidate;
                v_found := v_found + 1;
              END IF;
            END IF;
          END;
        END IF;

        v_chunk := v_sentence;
      ELSE
        v_chunk := v_chunk || ' ' || v_sentence;
      END IF;
    END LOOP;

    IF length(v_chunk) >= 30 THEN
      DECLARE
        v_chunk_lower TEXT := lower(v_chunk);
        v_kc INT := 0;
        v_is_boilerplate BOOLEAN := FALSE;
        v_bp TEXT;
      BEGIN
        SELECT COUNT(*) INTO v_kc
        FROM regexp_matches(v_chunk_lower, v_kw_pattern, 'g') AS m;

        IF v_kc > 0 THEN
          FOREACH v_bp IN ARRAY v_boilerplate LOOP
            IF v_chunk_lower LIKE '%' || v_bp || '%' THEN
              v_is_boilerplate := TRUE; EXIT;
            END IF;
          END LOOP;

          IF NOT v_is_boilerplate THEN
            v_candidate := jsonb_build_object(
              'text',               left(v_chunk, 500),
              'keyword_count',      v_kc,
              'source_country',     v_source.country,
              'source_iso',         v_source.iso,
              'source_type',        v_source.source_type,
              'source_name',        v_source.source_name,
              'source_region',      v_source.region,
              'lead_weeks',         4,
              'intelligence_pass',  COALESCE(v_snap.intelligence_pass, 1),
              'requires_translation',
                CASE WHEN v_snap.language_detected NOT IN ('en', 'english')
                     THEN TRUE ELSE FALSE END
            );
            v_candidates := v_candidates || v_candidate;
            v_found := v_found + 1;
          END IF;
        END IF;
      END;
    END IF;

    IF v_found = 0 THEN
      UPDATE source_snapshots
        SET processing_status = 'skipped',
            signal_candidates = jsonb_build_object(
              'skip_reason',    'no_valid_chunks',
              'source_name',    v_source.source_name,
              'source_country', v_source.country,
              'source_type',    v_source.source_type,
              'source_region',  v_source.region,
              'tier',           v_source.tier,
              'item_kind',      'html_snapshot',
              'matched_keywords', ARRAY(
                SELECT m[1] FROM regexp_matches(v_text_lower, v_kw_pattern, 'g') AS m
                LIMIT 5
              )
            )
      WHERE id = v_snap.id;

      snapshot_id := v_snap.id; source_name := v_source.source_name;
      country := v_source.country; candidates_found := 0; status_set := 'skipped';
      RETURN NEXT;
      CONTINUE;
    END IF;

    UPDATE source_snapshots
      SET signal_candidates = v_candidates,
          processing_status = 'extracted',
          processed_at      = now()
    WHERE id = v_snap.id;

    snapshot_id := v_snap.id; source_name := v_source.source_name;
    country := v_source.country; candidates_found := v_found; status_set := 'extracted';
    RETURN NEXT;

  END LOOP;
END;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260721115037','sanitize_captured_text_in_signal_extraction','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260721115037_sanitize_captured_text_in_signal_extraction.sql

-- RECOVERY BEGIN 20260721115055_backfill_dedupe_malformed_signal_headlines.sql
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
-- version 20260721115055.
--
-- Rewriting this file cannot affect production: 20260721115055 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Backfill for signals ingested before source-engine-fetch's decodeEntities
-- fix (2026-07-19): headline/summary contain a duplicated title + raw
-- &nbsp;/<a>/<font> markup from unstripped Google News RSS <description>
-- content (root-caused 2026-07-21 while debugging hv-classify's eval
-- recall -- these malformed rows were the dominant false-negative pattern:
-- the classifier correctly reads genuinely-duplicated repeated text as
-- "boilerplate", it isn't a classifier defect).
--
-- Two-pass per column: (a) recurrence heuristic -- find where the clean
-- "Title - Source" prefix's title text recurs later in the string and
-- truncate there (covers ~94-97% of affected rows, verified by dry-run
-- against live data before this migration was written); (b) fallback --
-- strip the HTML/&nbsp; litter without deduping the repeated text for the
-- remainder, so at minimum no raw markup survives.
--
-- Scope-checked before writing: ALL affected rows have reviewed=false --
-- this touches only unpublished staging data, nothing on the live public
-- Intel feed.
WITH dirty AS (
  SELECT id, headline, summary
  FROM public.signals
  WHERE headline ILIKE '%&nbsp;%' OR headline ILIKE '%<a href%' OR headline ILIKE '%<font%'
     OR summary  ILIKE '%&nbsp;%' OR summary  ILIKE '%<a href%' OR summary  ILIKE '%<font%'
),
cleaned AS (
  SELECT
    id,
    CASE
      WHEN headline !~* '&nbsp;|<a href|<font' THEN headline
      WHEN position(split_part(headline, ' - ', 1) IN substring(headline FROM length(split_part(headline, ' - ', 1)) + 4)) > 0
        THEN left(headline, length(split_part(headline, ' - ', 1)) + 3 +
             position(split_part(headline, ' - ', 1) IN substring(headline FROM length(split_part(headline, ' - ', 1)) + 4)) - 1)
      ELSE trim(regexp_replace(regexp_replace(regexp_replace(headline, '<[^>]+>', ' ', 'g'), '&nbsp;', ' ', 'g'), '\s+', ' ', 'g'))
    END AS headline_clean,
    CASE
      WHEN summary !~* '&nbsp;|<a href|<font' THEN summary
      WHEN position(split_part(summary, ' - ', 1) IN substring(summary FROM length(split_part(summary, ' - ', 1)) + 4)) > 0
        THEN left(summary, length(split_part(summary, ' - ', 1)) + 3 +
             position(split_part(summary, ' - ', 1) IN substring(summary FROM length(split_part(summary, ' - ', 1)) + 4)) - 1)
      ELSE trim(regexp_replace(regexp_replace(regexp_replace(summary, '<[^>]+>', ' ', 'g'), '&nbsp;', ' ', 'g'), '\s+', ' ', 'g'))
    END AS summary_clean
  FROM dirty
)
UPDATE public.signals s
SET headline = c.headline_clean,
    summary  = c.summary_clean
FROM cleaned c
WHERE c.id = s.id
  AND s.reviewed = false;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260721115055','backfill_dedupe_malformed_signal_headlines','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260721115055_backfill_dedupe_malformed_signal_headlines.sql

-- RECOVERY BEGIN 20260721115255_backfill_truncated_html_tag_summaries.sql
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
-- version 20260721115255.
--
-- Rewriting this file cannot affect production: 20260721115255 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Follow-up to backfill_dedupe_malformed_signal_headlines: 33 rows had an
-- unclosed HTML tag (the raw Google News/Reddit <a href="..."> link, whose
-- long token got cut off by the 500-char candidate-text truncation before
-- ever reaching the closing '>'), so the tag-strip regexp_replace('<[^>]+>')
-- never matched. Verified by dry-run: in every remaining row the clean
-- "Title - Source" text is fully intact immediately before the first
-- literal '<' -- truncate there. Same scope guard as the prior backfill:
-- reviewed=false only (no published content touched).
WITH dirty AS (
  SELECT id, summary
  FROM public.signals
  WHERE reviewed = false
    AND summary LIKE '%<%'
    AND (headline ILIKE '%&nbsp;%' OR headline ILIKE '%<a href%' OR headline ILIKE '%<font%'
      OR summary  ILIKE '%&nbsp;%' OR summary  ILIKE '%<a href%' OR summary  ILIKE '%<font%')
)
UPDATE public.signals s
SET summary = trim(left(d.summary, strpos(d.summary, '<') - 1))
FROM dirty d
WHERE d.id = s.id
  AND strpos(d.summary, '<') > 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260721115255','backfill_truncated_html_tag_summaries','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260721115255_backfill_truncated_html_tag_summaries.sql

-- RECOVERY BEGIN 20260721115402_fix_intel_eval_scoring_duplicate_grading_v2.sql
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
-- version 20260721115402.
--
-- Rewriting this file cannot affect production: 20260721115402 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Retry of fix_intel_eval_scoring_duplicate_grading: CREATE OR REPLACE VIEW
-- can't reorder/insert existing columns, only append. Moved the new
-- duplicate_truth_rows column to the end of the select list.
CREATE OR REPLACE VIEW api.intel_eval_scoring AS
WITH graded AS (
  SELECT
    p.run_id,
    p.signal_id,
    p.quality_label AS pred_quality,
    p.content_type AS pred_content,
    CASE
      WHEN e.label_status = ANY (ARRAY['confirmed'::text, 'corrected'::text]) THEN e.quality_label
      ELSE e.draft_quality_label
    END AS truth_quality,
    CASE
      WHEN e.label_status = ANY (ARRAY['confirmed'::text, 'corrected'::text]) THEN e.content_type
      ELSE e.draft_content_type
    END AS truth_content,
    e.label_status = ANY (ARRAY['confirmed'::text, 'corrected'::text]) AS is_human_truth
  FROM intel_eval_predictions p
  JOIN intel_eval_set e ON e.signal_id = p.signal_id
),
graded_adj AS (
  SELECT
    *,
    CASE WHEN truth_quality = 'duplicate' THEN 'signal' ELSE truth_quality END AS truth_quality_graded
  FROM graded
)
SELECT
  run_id,
  count(*) AS n,
  count(*) FILTER (WHERE is_human_truth) AS n_human_truth,
  round(avg((pred_quality = truth_quality)::integer), 3) AS quality_accuracy,
  count(*) FILTER (WHERE pred_quality = 'signal'::text AND truth_quality_graded = 'signal'::text) AS tp_signal,
  count(*) FILTER (WHERE pred_quality = 'signal'::text AND truth_quality_graded <> 'signal'::text) AS fp_signal,
  count(*) FILTER (WHERE pred_quality <> 'signal'::text AND truth_quality_graded = 'signal'::text) AS fn_signal,
  round(
    count(*) FILTER (WHERE pred_quality = 'signal'::text AND truth_quality_graded = 'signal'::text)::numeric
    / NULLIF(count(*) FILTER (WHERE pred_quality = 'signal'::text), 0)::numeric, 3
  ) AS signal_precision,
  round(
    count(*) FILTER (WHERE pred_quality = 'signal'::text AND truth_quality_graded = 'signal'::text)::numeric
    / NULLIF(count(*) FILTER (WHERE truth_quality_graded = 'signal'::text), 0)::numeric, 3
  ) AS signal_recall,
  round(
    avg((pred_content = truth_content)::integer) FILTER (WHERE truth_quality_graded = 'signal'::text AND pred_quality = 'signal'::text), 3
  ) AS content_type_accuracy_on_signals,
  count(*) FILTER (WHERE truth_quality = 'duplicate') AS duplicate_truth_rows
FROM graded_adj
GROUP BY run_id;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260721115402','fix_intel_eval_scoring_duplicate_grading_v2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260721115402_fix_intel_eval_scoring_duplicate_grading_v2.sql

-- RECOVERY BEGIN 20260722002926_fix_jurisdiction_cross_table_conflicts_state_fanout_and_noise_v2.sql
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
-- version 20260722002926.
--
-- Rewriting this file cannot affect production: 20260722002926 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

CREATE OR REPLACE VIEW public.jurisdiction_cross_table_conflicts AS
WITH jp AS (
  SELECT
    country_iso2, country_name, difficulty, last_reviewed,
    (jsonb_array_length(steps) > 0) AS has_market_pathway,
    (steps = '[]'::jsonb AND estimated_cost_range ILIKE 'Not applicable%') AS looks_prohibited
  FROM public.jurisdiction_playbooks
  WHERE status = 'published'
),
mm AS (
  SELECT country_iso2, count(*) AS metric_count
  FROM public.market_metrics
  GROUP BY country_iso2
),
cc AS (
  SELECT
    country_iso2, program_status, last_reviewed_date,
    (program_status ILIKE 'Prohibited%') AS status_says_prohibited,
    (program_status ILIKE 'Decriminalized%' OR program_status ILIKE 'Medical%' OR program_status ILIKE 'Legal%') AS status_says_reform,
    (program_status ILIKE '%no formal%' OR public_summary ILIKE '%no formal%program%' OR public_summary ILIKE '%expressed interest in developing%') AS status_understates_maturity
  FROM public.cc_jurisdiction_briefings
  WHERE state_iso2 IS NULL
)
SELECT
  jp.country_iso2,
  jp.country_name,
  jp.difficulty AS playbook_difficulty,
  jp.last_reviewed AS playbook_last_reviewed,
  cc.program_status AS briefing_program_status,
  cc.last_reviewed_date AS briefing_last_reviewed,
  coalesce(mm.metric_count, 0) AS playbook_metric_count,
  CASE
    WHEN jp.looks_prohibited AND cc.status_says_reform
      THEN 'polarity_conflict: playbook says prohibited, briefing implies reform/legal'
    WHEN jp.has_market_pathway AND cc.status_says_prohibited
      THEN 'polarity_conflict: playbook documents a real pathway, briefing says prohibited'
    WHEN jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity
      THEN 'maturity_understated: briefing implies no program despite playbook + metrics documenting an operational one'
  END AS conflict_type,
  (cc.last_reviewed_date < jp.last_reviewed) AS briefing_predates_playbook
FROM jp
JOIN cc ON cc.country_iso2 = jp.country_iso2
LEFT JOIN mm ON mm.country_iso2 = jp.country_iso2
WHERE
  (jp.looks_prohibited AND cc.status_says_reform)
  OR (jp.has_market_pathway AND cc.status_says_prohibited)
  OR (jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity)
ORDER BY jp.country_iso2;

COMMENT ON VIEW public.jurisdiction_cross_table_conflicts IS
  'Automated cc_jurisdiction_briefings-vs-jurisdiction_playbooks conflict check. Restricted to national-level briefing rows (state_iso2 IS NULL) -- extend deliberately if sub-national comparison is ever needed, do not join state rows against country-level playbooks. Flags polarity and maturity-understatement conflicts only; date mismatch is shown but not a trigger (too noisy to be diagnostic on its own). Heuristic worklist, not a fact-checker -- verify every hit before correcting either table.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722002926','fix_jurisdiction_cross_table_conflicts_state_fanout_and_noise_v2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722002926_fix_jurisdiction_cross_table_conflicts_state_fanout_and_noise_v2.sql

-- RECOVERY BEGIN 20260722003046_fix_jurisdiction_cross_table_conflicts_content_not_array_length.sql
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
-- version 20260722003046.
--
-- Rewriting this file cannot affect production: 20260722003046 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Second real bug found by dogfooding the tool immediately after building it: "has_market_pathway"
-- was defined as jsonb_array_length(steps) > 0 -- but different agents represented "no pathway"
-- three different ways: an empty array (my own batch convention), a one-item array whose only
-- content is the string "no licensing pathway exists" (Iran, Kuwait), or a multi-step array whose
-- entire content explains why there's no pathway and what to monitor instead (Malaysia). Array
-- length can't tell these apart from a real pathway; only the text can. Rebuilt as a content check
-- across steps text + estimated_cost_range, not structure. Verified against the false positives
-- (IR/KW/MY) directly.

CREATE OR REPLACE VIEW public.jurisdiction_cross_table_conflicts AS
WITH jp AS (
  SELECT
    country_iso2, country_name, difficulty, last_reviewed, estimated_cost_range,
    NOT (
      steps = '[]'::jsonb
      OR estimated_cost_range ILIKE 'Not applicable%'
      OR estimated_cost_range ILIKE '%no operating commercial%'
      OR estimated_cost_range ILIKE '%no established commercial%'
      OR steps::text ILIKE '%no licensing pathway%'
      OR steps::text ILIKE '%no pathway exists%'
      OR steps::text ILIKE '%no operational%pathway%'
      OR steps::text ILIKE '%not currently registered%'
      OR steps::text ILIKE '%categorically prohibited%'
    ) AS has_market_pathway,
    (
      steps = '[]'::jsonb
      OR estimated_cost_range ILIKE 'Not applicable%'
      OR estimated_cost_range ILIKE '%no operating commercial%'
      OR estimated_cost_range ILIKE '%no established commercial%'
      OR steps::text ILIKE '%no licensing pathway%'
      OR steps::text ILIKE '%no pathway exists%'
      OR steps::text ILIKE '%no operational%pathway%'
      OR steps::text ILIKE '%not currently registered%'
      OR steps::text ILIKE '%categorically prohibited%'
    ) AS looks_prohibited
  FROM public.jurisdiction_playbooks
  WHERE status = 'published'
),
mm AS (
  SELECT country_iso2, count(*) AS metric_count
  FROM public.market_metrics
  GROUP BY country_iso2
),
cc AS (
  SELECT
    country_iso2, program_status, last_reviewed_date,
    (program_status ILIKE 'Prohibited%') AS status_says_prohibited,
    (program_status ILIKE 'Decriminalized%' OR program_status ILIKE 'Medical%' OR program_status ILIKE 'Legal%') AS status_says_reform,
    (program_status ILIKE '%no formal%' OR public_summary ILIKE '%no formal%program%' OR public_summary ILIKE '%expressed interest in developing%') AS status_understates_maturity
  FROM public.cc_jurisdiction_briefings
  WHERE state_iso2 IS NULL
)
SELECT
  jp.country_iso2,
  jp.country_name,
  jp.difficulty AS playbook_difficulty,
  jp.last_reviewed AS playbook_last_reviewed,
  cc.program_status AS briefing_program_status,
  cc.last_reviewed_date AS briefing_last_reviewed,
  coalesce(mm.metric_count, 0) AS playbook_metric_count,
  CASE
    WHEN jp.looks_prohibited AND cc.status_says_reform
      THEN 'polarity_conflict: playbook says prohibited, briefing implies reform/legal'
    WHEN jp.has_market_pathway AND cc.status_says_prohibited
      THEN 'polarity_conflict: playbook documents a real pathway, briefing says prohibited'
    WHEN jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity
      THEN 'maturity_understated: briefing implies no program despite playbook + metrics documenting an operational one'
  END AS conflict_type,
  (cc.last_reviewed_date < jp.last_reviewed) AS briefing_predates_playbook
FROM jp
JOIN cc ON cc.country_iso2 = jp.country_iso2
LEFT JOIN mm ON mm.country_iso2 = jp.country_iso2
WHERE
  (jp.looks_prohibited AND cc.status_says_reform)
  OR (jp.has_market_pathway AND cc.status_says_prohibited)
  OR (jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity)
ORDER BY jp.country_iso2;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722003046','fix_jurisdiction_cross_table_conflicts_content_not_array_length','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722003046_fix_jurisdiction_cross_table_conflicts_content_not_array_length.sql

-- RECOVERY BEGIN 20260722003232_tighten_jurisdiction_cross_table_conflicts_partial_status_fix.sql
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
-- version 20260722003232.
--
-- Rewriting this file cannot affect production: 20260722003232 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Third bug, different in kind from the first two: Greece got flagged as "prohibited" because
-- one of five steps says "No pathway exists for recreational/adult-use retail" -- true and
-- correctly worded, but only about recreational use specifically. The other four steps describe
-- a real medical/export pathway (EOF authorisation, GMP, INCB registration). Whole-array
-- substring matching can't distinguish "the whole country has no pathway" from "recreational
-- specifically doesn't, medical does" -- and that bifurcated status is the NORM in cannabis law
-- (Greece, Turkey, North Macedonia and most of this dataset all have exactly this shape), not an
-- edge case. Removing the two broadest, most qualifier-prone phrases ('no pathway exists',
-- 'no operational...pathway') that caused this; keeping only the phrases confirmed against real
-- false negatives (Iran/Kuwait/Malaysia) that describe the entire country having no pathway, not
-- a single carved-out activity within it.

CREATE OR REPLACE VIEW public.jurisdiction_cross_table_conflicts AS
WITH jp AS (
  SELECT
    country_iso2, country_name, difficulty, last_reviewed, estimated_cost_range,
    NOT (
      steps = '[]'::jsonb
      OR estimated_cost_range ILIKE 'Not applicable%'
      OR estimated_cost_range ILIKE '%no operating commercial%'
      OR estimated_cost_range ILIKE '%no established commercial%'
      OR steps::text ILIKE '%no licensing pathway%'
      OR steps::text ILIKE '%not currently registered%'
      OR steps::text ILIKE '%categorically prohibited%'
    ) AS has_market_pathway,
    (
      steps = '[]'::jsonb
      OR estimated_cost_range ILIKE 'Not applicable%'
      OR estimated_cost_range ILIKE '%no operating commercial%'
      OR estimated_cost_range ILIKE '%no established commercial%'
      OR steps::text ILIKE '%no licensing pathway%'
      OR steps::text ILIKE '%not currently registered%'
      OR steps::text ILIKE '%categorically prohibited%'
    ) AS looks_prohibited
  FROM public.jurisdiction_playbooks
  WHERE status = 'published'
),
mm AS (
  SELECT country_iso2, count(*) AS metric_count
  FROM public.market_metrics
  GROUP BY country_iso2
),
cc AS (
  SELECT
    country_iso2, program_status, last_reviewed_date,
    (program_status ILIKE 'Prohibited%') AS status_says_prohibited,
    (program_status ILIKE 'Medical%' OR program_status ILIKE 'Legal%' OR program_status ILIKE 'Adult-Use%')
      AS status_says_reform,
    (program_status ILIKE '%no formal%' OR public_summary ILIKE '%no formal%program%' OR public_summary ILIKE '%expressed interest in developing%') AS status_understates_maturity
  FROM public.cc_jurisdiction_briefings
  WHERE state_iso2 IS NULL
)
SELECT
  jp.country_iso2,
  jp.country_name,
  jp.difficulty AS playbook_difficulty,
  jp.last_reviewed AS playbook_last_reviewed,
  cc.program_status AS briefing_program_status,
  cc.last_reviewed_date AS briefing_last_reviewed,
  coalesce(mm.metric_count, 0) AS playbook_metric_count,
  CASE
    WHEN jp.looks_prohibited AND cc.status_says_reform
      THEN 'polarity_conflict: playbook says prohibited, briefing implies reform/legal'
    WHEN jp.has_market_pathway AND cc.status_says_prohibited
      THEN 'polarity_conflict: playbook documents a real pathway, briefing says prohibited'
    WHEN jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity
      THEN 'maturity_understated: briefing implies no program despite playbook + metrics documenting an operational one'
  END AS conflict_type,
  (cc.last_reviewed_date < jp.last_reviewed) AS briefing_predates_playbook
FROM jp
JOIN cc ON cc.country_iso2 = jp.country_iso2
LEFT JOIN mm ON mm.country_iso2 = jp.country_iso2
WHERE
  (jp.looks_prohibited AND cc.status_says_reform)
  OR (jp.has_market_pathway AND cc.status_says_prohibited)
  OR (jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity)
ORDER BY jp.country_iso2;

COMMENT ON VIEW public.jurisdiction_cross_table_conflicts IS
  'Heuristic triage worklist for cc_jurisdiction_briefings vs jurisdiction_playbooks disagreement -- NOT a fact-checker. Note "Decriminalized" was deliberately dropped from status_says_reform: personal decriminalization and commercial-market legality are different questions (see Trinidad/Grenada in the 19-Jul-2026 audit), and conflating them produces false positives. Even after three rounds of fixes (state-fanout, array-length-as-pathway-proxy, whole-array substring matching flattening bifurcated medical/recreational status), every hit still requires a human or agent to read both entries before concluding anything -- this narrows 200+ rows to a short list, it does not replace judgment.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722003232','tighten_jurisdiction_cross_table_conflicts_partial_status_fix','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722003232_tighten_jurisdiction_cross_table_conflicts_partial_status_fix.sql

-- RECOVERY BEGIN 20260722003322_refine_status_says_reform_decrim_plus_authority.sql
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
-- version 20260722003322.
--
-- Rewriting this file cannot affect production: 20260722003322 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Restores detection of TT's known issue (program_status still says "Cannabis Control Authority
-- Established" even though I fixed the prose separately) without reintroducing the Guatemala/
-- Guyana/Dominica false positives that plain "Decriminalized%" caused. Verified the distinguishing
-- signal directly: TT's status is the only one of the four containing "Authority" -- the other
-- three are pure personal-decriminalization statuses with no institutional/licensing claim.

CREATE OR REPLACE VIEW public.jurisdiction_cross_table_conflicts AS
WITH jp AS (
  SELECT
    country_iso2, country_name, difficulty, last_reviewed, estimated_cost_range,
    NOT (
      steps = '[]'::jsonb
      OR estimated_cost_range ILIKE 'Not applicable%'
      OR estimated_cost_range ILIKE '%no operating commercial%'
      OR estimated_cost_range ILIKE '%no established commercial%'
      OR steps::text ILIKE '%no licensing pathway%'
      OR steps::text ILIKE '%not currently registered%'
      OR steps::text ILIKE '%categorically prohibited%'
    ) AS has_market_pathway,
    (
      steps = '[]'::jsonb
      OR estimated_cost_range ILIKE 'Not applicable%'
      OR estimated_cost_range ILIKE '%no operating commercial%'
      OR estimated_cost_range ILIKE '%no established commercial%'
      OR steps::text ILIKE '%no licensing pathway%'
      OR steps::text ILIKE '%not currently registered%'
      OR steps::text ILIKE '%categorically prohibited%'
    ) AS looks_prohibited
  FROM public.jurisdiction_playbooks
  WHERE status = 'published'
),
mm AS (
  SELECT country_iso2, count(*) AS metric_count
  FROM public.market_metrics
  GROUP BY country_iso2
),
cc AS (
  SELECT
    country_iso2, program_status, last_reviewed_date,
    (program_status ILIKE 'Prohibited%') AS status_says_prohibited,
    (
      program_status ILIKE 'Medical%' OR program_status ILIKE 'Legal%' OR program_status ILIKE 'Adult-Use%'
      OR (program_status ILIKE 'Decriminalized%' AND (program_status ILIKE '%Authority%' OR program_status ILIKE '%Licens%'))
    ) AS status_says_reform,
    (program_status ILIKE '%no formal%' OR public_summary ILIKE '%no formal%program%' OR public_summary ILIKE '%expressed interest in developing%') AS status_understates_maturity
  FROM public.cc_jurisdiction_briefings
  WHERE state_iso2 IS NULL
)
SELECT
  jp.country_iso2,
  jp.country_name,
  jp.difficulty AS playbook_difficulty,
  jp.last_reviewed AS playbook_last_reviewed,
  cc.program_status AS briefing_program_status,
  cc.last_reviewed_date AS briefing_last_reviewed,
  coalesce(mm.metric_count, 0) AS playbook_metric_count,
  CASE
    WHEN jp.looks_prohibited AND cc.status_says_reform
      THEN 'polarity_conflict: playbook says prohibited, briefing implies reform/legal'
    WHEN jp.has_market_pathway AND cc.status_says_prohibited
      THEN 'polarity_conflict: playbook documents a real pathway, briefing says prohibited'
    WHEN jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity
      THEN 'maturity_understated: briefing implies no program despite playbook + metrics documenting an operational one'
  END AS conflict_type,
  (cc.last_reviewed_date < jp.last_reviewed) AS briefing_predates_playbook
FROM jp
JOIN cc ON cc.country_iso2 = jp.country_iso2
LEFT JOIN mm ON mm.country_iso2 = jp.country_iso2
WHERE
  (jp.looks_prohibited AND cc.status_says_reform)
  OR (jp.has_market_pathway AND cc.status_says_prohibited)
  OR (jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity)
ORDER BY jp.country_iso2;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722003322','refine_status_says_reform_decrim_plus_authority','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722003322_refine_status_says_reform_decrim_plus_authority.sql

-- RECOVERY BEGIN 20260722005051_create_talent_jobs_and_candidates.sql

-- Talent / ATS: job postings
create table public.talent_jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text,
  location text,
  workspace_id uuid references public.workspaces(id),
  status text not null default 'open' check (status in ('open','on_hold','closed')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.talent_jobs is 'Internal Harbourview job postings for operator-expansion hiring (ATS). Reads gated to admin/operator/analyst; writes service-role only, mirrors the opportunities table pattern.';

create trigger set_talent_jobs_updated_at
  before update on public.talent_jobs
  for each row execute function public.set_updated_at();

-- Talent / ATS: candidates in the pipeline
create table public.talent_candidates (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.talent_jobs(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  source text,
  stage text not null default 'sourced'
    check (stage in ('sourced','screening','interview','offer','hired','rejected')),
  stage_changed_at timestamptz not null default now(),
  tags text[] not null default '{}',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.talent_candidates is 'Candidates in the ATS pipeline, one row per candidate per job. stage_changed_at drives the "days in stage" freshness indicator in the UI; no separate audit trail yet.';

create index talent_candidates_job_id_idx on public.talent_candidates(job_id);
create index talent_candidates_stage_idx on public.talent_candidates(stage);

-- keep stage_changed_at accurate whenever stage actually changes
create or replace function public.set_talent_candidate_stage_changed_at()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if TG_OP = 'UPDATE' and NEW.stage is distinct from OLD.stage then
    NEW.stage_changed_at = now();
  end if;
  NEW.updated_at = now();
  return NEW;
end;
$$;

create trigger set_talent_candidates_stage_changed_at
  before update on public.talent_candidates
  for each row execute function public.set_talent_candidate_stage_changed_at();

create trigger set_talent_candidates_updated_at_insert
  before insert on public.talent_candidates
  for each row execute function public.set_updated_at();

-- RLS: same admin/operator/analyst read + service-role write pattern as public.opportunities
alter table public.talent_jobs enable row level security;
alter table public.talent_candidates enable row level security;

create policy talent_jobs_admin_operator_read
  on public.talent_jobs for select
  using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = any (array['admin','operator','analyst'])
  ));

create policy talent_jobs_service_write
  on public.talent_jobs for all
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

create policy talent_candidates_admin_operator_read
  on public.talent_candidates for select
  using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = any (array['admin','operator','analyst'])
  ));

create policy talent_candidates_service_write
  on public.talent_candidates for all
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722005051','create_talent_jobs_and_candidates','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722005051_create_talent_jobs_and_candidates.sql

-- RECOVERY BEGIN 20260722005615_talent_workspace_scoped_rls.sql

-- Talent is company-facing: each workspace (operator) owns and manages its
-- own job postings and candidate pipeline. Candidates can also apply
-- directly to open postings without a Harbourview account.

-- A job posting always belongs to a hiring company now.
alter table public.talent_jobs
  alter column workspace_id set not null;

-- Support a public apply flow.
alter table public.talent_candidates
  add column resume_url text,
  add column cover_note text;

comment on table public.talent_jobs is 'Company-facing job postings (ATS). Each row belongs to a workspace (the hiring operator). Open postings are publicly readable so candidates can browse/apply; full management is workspace-member-only.';
comment on table public.talent_candidates is 'Candidates in a job''s pipeline. Workspace members that own the job manage the full pipeline. External applicants may insert their own application (stage forced to sourced) but cannot read or edit other candidates.';

-- ---- drop the internal-admin-only policies from the first pass ----
drop policy if exists talent_jobs_admin_operator_read on public.talent_jobs;
drop policy if exists talent_jobs_service_write on public.talent_jobs;
drop policy if exists talent_candidates_admin_operator_read on public.talent_candidates;
drop policy if exists talent_candidates_service_write on public.talent_candidates;

-- ---- talent_jobs ----
-- Anyone can see open postings (public job board / apply flow).
create policy talent_jobs_public_read_open
  on public.talent_jobs for select
  to anon, authenticated
  using (status = 'open');

-- The owning company's members can fully manage their own postings
-- (including drafts/closed ones), matching the hv_* workspace-isolation pattern.
create policy talent_jobs_workspace_manage
  on public.talent_jobs for all
  to authenticated
  using (workspace_id in (
    select workspace_members.workspace_id from public.workspace_members
    where workspace_members.user_id = (select auth.uid())
  ))
  with check (workspace_id in (
    select workspace_members.workspace_id from public.workspace_members
    where workspace_members.user_id = (select auth.uid())
  ));

-- Platform admins keep support/moderation visibility, consistent with other tables.
create policy talent_jobs_admin_manage
  on public.talent_jobs for all
  to authenticated
  using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role = 'admin'
  ))
  with check (exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role = 'admin'
  ));

-- ---- talent_candidates ----
-- The owning company's members fully manage their own pipeline.
create policy talent_candidates_workspace_manage
  on public.talent_candidates for all
  to authenticated
  using (job_id in (
    select tj.id from public.talent_jobs tj
    where tj.workspace_id in (
      select workspace_members.workspace_id from public.workspace_members
      where workspace_members.user_id = (select auth.uid())
    )
  ))
  with check (job_id in (
    select tj.id from public.talent_jobs tj
    where tj.workspace_id in (
      select workspace_members.workspace_id from public.workspace_members
      where workspace_members.user_id = (select auth.uid())
    )
  ));

-- Anyone (logged in or not) can apply to an open posting. They can only
-- create the initial application — stage is forced to 'sourced' and no
-- read/update/delete access is granted, so applicants can't see the pipeline
-- or other candidates.
create policy talent_candidates_public_apply
  on public.talent_candidates for insert
  to anon, authenticated
  with check (
    stage = 'sourced'
    and job_id in (select id from public.talent_jobs where status = 'open')
  );

-- Platform admins keep support/moderation visibility.
create policy talent_candidates_admin_manage
  on public.talent_candidates for all
  to authenticated
  using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role = 'admin'
  ))
  with check (exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role = 'admin'
  ));


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722005615','talent_workspace_scoped_rls','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722005615_talent_workspace_scoped_rls.sql

-- RECOVERY BEGIN 20260722010431_expose_talent_via_api_schema.sql

-- PostgREST on this project only exposes the `api` schema. talent_jobs and
-- talent_candidates were created in `public` and, without this, would be
-- completely unreachable from the app (the exact "silent RPC failure"
-- pattern flagged elsewhere in this repo's history). security_invoker=on
-- means these views enforce the base tables' RLS, not view-owner privilege,
-- matching every other api.* passthrough view in this schema.

create view api.talent_jobs
  with (security_invoker = on)
  as select * from public.talent_jobs;

create view api.talent_candidates
  with (security_invoker = on)
  as select * from public.talent_candidates;

-- Public job board: anyone can list open postings.
grant select on api.talent_jobs to anon, authenticated;

-- Public apply flow: anyone can insert an application; RLS
-- (talent_candidates_public_apply) restricts what that insert can contain.
grant insert on api.talent_candidates to anon, authenticated;

-- Company pipeline management (talent_jobs_workspace_manage /
-- talent_candidates_workspace_manage / admin_manage RLS policies already
-- exist on the base tables from the prior migration) — grant the table
-- privileges those policies assume, so the future company-side dashboard
-- doesn't need another migration just to become reachable.
grant insert, update, delete on api.talent_jobs to authenticated;
grant select, update, delete on api.talent_candidates to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722010431','expose_talent_via_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722010431_expose_talent_via_api_schema.sql

-- RECOVERY BEGIN 20260722010623_talent_jobs_public_redacted_view.sql

-- Match the marketplace_public_listings_v1 pattern (PR_REVIEW_CHECKLIST.md:
-- "Public listing views are redacted"): the public job board should not read
-- from a raw passthrough of talent_jobs (which carries created_by, a user id).
-- It also has no business showing a job from a workspace that hasn't opted
-- into public visibility, even if the posting itself is 'open' — respect
-- workspaces.is_public the same way the rest of the platform does.

create view api.talent_jobs_public
  with (security_invoker = on)
  as
  select
    tj.id,
    tj.title,
    tj.department,
    tj.location,
    tj.created_at,
    w.id as workspace_id,
    coalesce(w.trade_name, w.legal_name) as operator_name,
    w.verification_status as operator_verification_status
  from public.talent_jobs tj
  join public.workspaces w on w.id = tj.workspace_id
  where tj.status = 'open'
    and w.is_public = true;

-- The board reads from the redacted view; api.talent_jobs (full columns,
-- including created_by) stays authenticated-only for the future company
-- dashboard, gated by the workspace_manage / admin_manage RLS policies.
revoke select on api.talent_jobs from anon;
grant select on api.talent_jobs_public to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722010623','talent_jobs_public_redacted_view','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722010623_talent_jobs_public_redacted_view.sql

-- RECOVERY BEGIN 20260722020000_harden_signal_review_rpc_grants_revoke_public.sql
-- Harden SECURITY DEFINER grants on signal-review RPCs: the internal
-- is_genetics_admin_or_reviewer() checks added in
-- 20260721063000_fix_signal_review_rpcs_missing_authz.sql and
-- 20260721073000_fix_readonly_review_queue_rpcs_missing_authz.sql correctly
-- block unauthorized callers, but the underlying PostgREST EXECUTE grant on
-- these 11 functions is still held by the PUBLIC pseudo-role (not
-- individually by anon/authenticated) -- exactly the trap
-- docs/INTELLIGENCE_ARCHITECTURE_SPEC.md guardrail #6 names ("watch the
-- PUBLIC pseudo-role -- revoking from anon/authenticated does nothing if
-- PUBLIC holds the grant"). Confirmed via pg_proc.proacl before this change:
-- all 11 functions below show `=X/postgres` (PUBLIC) plus postgres/service_role;
-- none show a distinct anon or authenticated grant.
--
-- This is defense-in-depth, not a live-vuln fix -- the internal check already
-- returns 42501 for anon/unprivileged callers. Revoking the PUBLIC grant and
-- replacing it with an explicit `authenticated` grant removes anon's ability
-- to even attempt the call, and matches the access pattern the internal
-- checks already assume (admin/operator/analyst authenticated users, plus
-- service_role for the hv-classify-called functions, which already carry
-- their own explicit service_role grant unaffected by this change).
--
-- Verified via grep before applying: the only real caller of the plain
-- admin/operator/analyst-gated functions is lib/signals-engine/admin.ts
-- (authenticated browser session); apply_editorial_title,
-- rows_needing_titles and pool_rows_needing_classification are also called
-- by supabase/functions/hv-classify/index.ts via service_role, which is
-- unaffected by this migration.
--
-- Deliberately NOT touched: api.accept_classifier_tier and
-- api.set_regulatory_tier -- confirmed via pg_proc.proacl these are already
-- granted only to `authenticated` (no PUBLIC grant), which combined with
-- their existing is_regulatory_tier_admin() check is the correct pattern
-- already. No PUBLIC-grant defect exists there.
--
-- Rollback: `grant execute on function <fn> to public;` for each function
-- below restores the prior (over-broad) grant. Not recommended.

revoke execute on function api.apply_editorial_title(text, text, text) from public;
grant execute on function api.apply_editorial_title(text, text, text) to authenticated;

revoke execute on function api.approve_engine_signal(text, text) from public;
grant execute on function api.approve_engine_signal(text, text) to authenticated;

revoke execute on function api.bulk_approve_engine_queue(text, integer, text) from public;
grant execute on function api.bulk_approve_engine_queue(text, integer, text) to authenticated;

revoke execute on function api.count_engine_review_queue(text, integer) from public;
grant execute on function api.count_engine_review_queue(text, integer) to authenticated;

revoke execute on function api.get_signals_pending_analysis(integer, text) from public;
grant execute on function api.get_signals_pending_analysis(integer, text) to authenticated;

revoke execute on function api.list_engine_review_countries() from public;
grant execute on function api.list_engine_review_countries() to authenticated;

revoke execute on function api.list_engine_review_queue(text, integer, integer) from public;
grant execute on function api.list_engine_review_queue(text, integer, integer) to authenticated;

revoke execute on function api.pool_rows_needing_classification(integer) from public;
grant execute on function api.pool_rows_needing_classification(integer) to authenticated;

revoke execute on function api.reject_engine_signal(text, text) from public;
grant execute on function api.reject_engine_signal(text, text) to authenticated;

revoke execute on function api.rows_needing_titles(integer) from public;
grant execute on function api.rows_needing_titles(integer) to authenticated;

revoke execute on function api.save_signal_analysis(text, jsonb, text) from public;
grant execute on function api.save_signal_analysis(text, jsonb, text) to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722020000','harden_signal_review_rpc_grants_revoke_public','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722020000_harden_signal_review_rpc_grants_revoke_public.sql

-- RECOVERY BEGIN 20260722020100_hv_quality_promote_explicit_confidence_floor.sql
-- Stage 3 promotion pipeline hardening: hv_quality_promote_tick() called
-- hv_promote_signals(0.0) -- a hardcoded zero confidence floor, meaning the
-- classifier's own confidence score was not actually enforced as a gate,
-- only quality_label='signal' was. In the one manual production run on
-- 2026-07-20 this happened not to matter (all 1,102 promoted rows carried
-- confidence >= 0.8, avg 0.856), but that was incidental, not designed-in
-- safety, and directly conflicts with
-- docs/INTELLIGENCE_ARCHITECTURE_SPEC.md guardrail #2 ("validate judgment
-- against labels before wiring it... no classifier drives promotion until
-- it clears the eval-set bar") and the now-superseded
-- docs/control/STAGE3_PROMOTION.md's own stated default of 0.65 for the
-- (unused) sibling promotion path api.promote_classified_signals.
--
-- Fix: hv_promote_signals' own default parameter changes from 0.0 to 0.65,
-- and hv_quality_promote_tick is updated to pass 0.65 explicitly rather than
-- 0.0, so the floor holds regardless of caller. This does not change
-- anything for rows already promoted -- promotion is one-directional
-- (reviewed=false -> true only) per the existing WHERE clause invariant in
-- hv_promote_signals, unchanged by this migration.
--
-- Both hv-quality-pipeline and hv-quality-promote crons remain INACTIVE --
-- this migration only changes what would happen if/when they (or a manual
-- call) run. It does not enable continuous automation. That remains a
-- separate, explicit decision -- see docs/control/STAGE3_PROMOTION.md.
--
-- Rollback: re-run CREATE OR REPLACE with the prior signature
-- (`p_min_conf numeric DEFAULT 0.0`) and revert hv_quality_promote_tick's
-- call site to pass 0.0, restoring prior (unenforced) behavior. Not
-- recommended.

create or replace function public.hv_promote_signals(p_min_conf numeric default 0.65)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare n int;
begin
  update public.signals s set
    reviewed = true, reviewed_by = 'auto:v1', reviewed_at = now()
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and coalesce(s.quality_confidence, 1) >= p_min_conf
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and regexp_replace(coalesce(s.url,''), '^https?://(www\.)?([^/]+).*', '\2')
        not in (select domain from public.excluded_source_domains);
  get diagnostics n = row_count;
  return n;
end$function$;

create or replace function public.hv_quality_promote_tick()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_dd int; v_pr int;
begin
  v_dd := public.hv_dedup_assign(0.90, 400);
  v_pr := public.hv_promote_signals(0.65);
  return jsonb_build_object('deduped',v_dd,'promoted',v_pr);
end$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722020100','hv_quality_promote_explicit_confidence_floor','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722020100_hv_quality_promote_explicit_confidence_floor.sql

-- RECOVERY BEGIN 20260722030000_analyze_hv_classify_jobs_fix_harvest_timeout.sql
-- Incident response: hv-quality-pipeline and hv-quality-promote (enabled earlier
-- this session) were failing on nearly every run -- 30 statement-timeout errors on
-- hv_classify_corpus_harvest() and 7 on hv_dedup_assign() in a 3-hour window, plus
-- 2 outright job-startup timeouts. Both crons were disabled immediately as a
-- precaution while diagnosing (see EVIDENCE_LOG.md for the full incident writeup).
--
-- Root cause for the harvest timeout: public.hv_classify_jobs (89,013 rows,
-- 2,689 dead tuples) had last_autoanalyze = null and a last manual analyze from
-- the morning of the same day -- stale enough that the planner estimated only 1
-- unharvested row (actual: ~107-121) for the join against net._http_response.
-- That misestimate produced a Nested Loop with net._http_response re-scanned
-- sequentially once per outer row (cost ~24,656 each time) instead of a single
-- Hash Join. Confirmed: net._http_response itself is tiny (243 live rows) and
-- has no index on `id` (only on `created`) -- not a missing-index problem, a
-- stale-statistics-driven bad plan.
--
-- Fix: ANALYZE the two tables feeding that join. Verified live: query plan
-- changed from Nested Loop (repeated seq scan) to Hash Join (single scan) after
-- this ran, and a manual `select hv_classify_corpus_harvest();` call then
-- completed cleanly (120 rows) with no timeout.
--
-- hv_dedup_assign() is a SEPARATE, unresolved issue -- NOT fixed by this
-- migration. It's a genuine O(n^2) self-join over embedded signals
-- (5,080 rows in the current 400-day scope, ~25.8M pairwise comparisons),
-- expressed as a threshold filter rather than an indexable ANN/KNN query, so
-- pgvector's index cannot help it regardless of statistics. hv-quality-promote
-- (jobid 48) is deliberately left INACTIVE pending a real fix (batching, a
-- narrower scope, or rewriting to use an indexed KNN query) -- see
-- docs/control/STAGE3_PROMOTION.md. hv-quality-pipeline (jobid 47) does not call
-- hv_dedup_assign and has been re-enabled.
--
-- Rollback: none needed -- ANALYZE only updates planner statistics, no data or
-- schema change. Re-running it is always safe.
analyze public.hv_classify_jobs;
analyze net._http_response;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722030000','analyze_hv_classify_jobs_fix_harvest_timeout','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722030000_analyze_hv_classify_jobs_fix_harvest_timeout.sql

-- RECOVERY BEGIN 20260722094616_fix_lb_tt_program_status_field_lagged_behind_prose.sql
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
-- version 20260722094616.
--
-- Rewriting this file cannot affect production: 20260722094616 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Closes the gap the automated conflict checker caught: LB and TT got a prose-only fix earlier
-- (public_summary/regulatory_outlook corrected) but program_status itself was never updated,
-- so it still read as more operationally mature than either country actually is.

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Medical and Industrial Legal (Since 2020); Authority Only Constituted 2025, Not Yet Operational',
  change_notes = change_notes || '[{"title": "Follow-up correction: program_status still read as fully operational after the public_summary fix; updated to reflect the Authority was only constituted in 2025 and had enabled no legal harvest as of early 2026", "market": "Lebanon", "timeAgo": "20 July 2026", "direction": "down", "sourceRef": "Herb; CMS Expert Guides; The Beiruter", "reviewState": "reviewed"}]'::jsonb,
  updated_at = now()
WHERE country_iso2 = 'LB';

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Decriminalized (30g, 2019); Cannabis Control Act Passed But Not Proclaimed',
  change_notes = change_notes || '[{"title": "Follow-up correction: program_status implied the Cannabis Licensing Authority was operating; the 2022 Act creating it has not been proclaimed into force, so it does not yet exist as an operating body", "market": "Trinidad and Tobago", "timeAgo": "20 July 2026", "direction": "down", "sourceRef": "Trinidad and Tobago Parliament (Act record); Jamaica Experiences regional guide", "reviewState": "reviewed"}]'::jsonb,
  updated_at = now()
WHERE country_iso2 = 'TT';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722094616','fix_lb_tt_program_status_field_lagged_behind_prose','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722094616_fix_lb_tt_program_status_field_lagged_behind_prose.sql

-- RECOVERY BEGIN 20260722094908_add_talent_jobs_description.sql

alter table public.talent_jobs add column description text;

drop view api.talent_jobs_public;

create view api.talent_jobs_public
  with (security_invoker = on)
  as
  select
    tj.id,
    tj.title,
    tj.department,
    tj.location,
    tj.description,
    tj.created_at,
    w.id as workspace_id,
    coalesce(w.trade_name, w.legal_name) as operator_name,
    w.verification_status as operator_verification_status
  from public.talent_jobs tj
  join public.workspaces w on w.id = tj.workspace_id
  where tj.status = 'open'
    and w.is_public = true;

grant select on api.talent_jobs_public to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722094908','add_talent_jobs_description','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722094908_add_talent_jobs_description.sql

-- RECOVERY BEGIN 20260722103428_expose_signals_country_iso2_via_api_view.sql
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
-- version 20260722103428.
--
-- Rewriting this file cannot affect production: 20260722103428 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- api.signals is the PostgREST-exposed view (schema `api` is the only schema PostgREST
-- serves on this project — see lib/supabase/client.ts). It predates the 2026-07-16
-- migration that added public.signals.country_iso2 (resolved server-side by
-- trg_signals_resolve_geo) and was never updated to expose it, so the globe's
-- client-side read of country_iso2 would 404/column-not-exist at runtime despite the
-- column existing on the base table. Additive only: appends one column to the view's
-- SELECT list, same security_invoker=true (RLS on public.signals still governs which
-- rows anon/authenticated can see; this does not change row-level access, only makes
-- an already-safe, non-sensitive derived column visible on rows already readable).
create or replace view api.signals
with (security_invoker = true)
as
select
  id, date, cat, pri, score, headline, summary, source, url, verification, tier, lang,
  company, country, in_network, lane_r, lane_e, lane_t, top_lane, query_pack,
  commercial_impact, reviewed, action, created_at, embedding_1024, embedding_model,
  embedded_at, reviewed_by, reviewed_at, editorial_title, editorial_blurb,
  country_iso2
from public.signals;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722103428','expose_signals_country_iso2_via_api_view','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722103428_expose_signals_country_iso2_via_api_view.sql

-- RECOVERY BEGIN 20260722115652_revoke_public_grant_apply_editorial_title.sql
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
-- version 20260722115652.
--
-- Rewriting this file cannot affect production: 20260722115652 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

revoke execute on function api.apply_editorial_title(text, text, text) from public;
grant execute on function api.apply_editorial_title(text, text, text) to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722115652','revoke_public_grant_apply_editorial_title','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722115652_revoke_public_grant_apply_editorial_title.sql

-- RECOVERY BEGIN 20260722115702_revoke_public_grant_approve_engine_signal.sql
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
-- version 20260722115702.
--
-- Rewriting this file cannot affect production: 20260722115702 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

revoke execute on function api.approve_engine_signal(text, text) from public;
grant execute on function api.approve_engine_signal(text, text) to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722115702','revoke_public_grant_approve_engine_signal','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722115702_revoke_public_grant_approve_engine_signal.sql

-- RECOVERY BEGIN 20260722115937_revoke_public_grant_get_signals_pending_analysis.sql
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
-- version 20260722115937.
--
-- Rewriting this file cannot affect production: 20260722115937 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

revoke execute on function api.get_signals_pending_analysis(integer, text) from public;
grant execute on function api.get_signals_pending_analysis(integer, text) to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722115937','revoke_public_grant_get_signals_pending_analysis','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722115937_revoke_public_grant_get_signals_pending_analysis.sql

-- RECOVERY BEGIN 20260722115939_revoke_public_grant_list_engine_review_countries.sql
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
-- version 20260722115939.
--
-- Rewriting this file cannot affect production: 20260722115939 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

revoke execute on function api.list_engine_review_countries() from public;
grant execute on function api.list_engine_review_countries() to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722115939','revoke_public_grant_list_engine_review_countries','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722115939_revoke_public_grant_list_engine_review_countries.sql

-- RECOVERY BEGIN 20260722115941_revoke_public_grant_list_engine_review_queue.sql
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
-- version 20260722115941.
--
-- Rewriting this file cannot affect production: 20260722115941 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

revoke execute on function api.list_engine_review_queue(text, integer, integer) from public;
grant execute on function api.list_engine_review_queue(text, integer, integer) to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722115941','revoke_public_grant_list_engine_review_queue','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722115941_revoke_public_grant_list_engine_review_queue.sql

-- RECOVERY BEGIN 20260722115943_revoke_public_grant_pool_rows_needing_classification.sql
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
-- version 20260722115943.
--
-- Rewriting this file cannot affect production: 20260722115943 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

revoke execute on function api.pool_rows_needing_classification(integer) from public;
grant execute on function api.pool_rows_needing_classification(integer) to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722115943','revoke_public_grant_pool_rows_needing_classification','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722115943_revoke_public_grant_pool_rows_needing_classification.sql

-- RECOVERY BEGIN 20260722115944_revoke_public_grant_reject_engine_signal.sql
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
-- version 20260722115944.
--
-- Rewriting this file cannot affect production: 20260722115944 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

revoke execute on function api.reject_engine_signal(text, text) from public;
grant execute on function api.reject_engine_signal(text, text) to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722115944','revoke_public_grant_reject_engine_signal','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722115944_revoke_public_grant_reject_engine_signal.sql

-- RECOVERY BEGIN 20260722115946_revoke_public_grant_rows_needing_titles.sql
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
-- version 20260722115946.
--
-- Rewriting this file cannot affect production: 20260722115946 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

revoke execute on function api.rows_needing_titles(integer) from public;
grant execute on function api.rows_needing_titles(integer) to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722115946','revoke_public_grant_rows_needing_titles','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722115946_revoke_public_grant_rows_needing_titles.sql

-- RECOVERY BEGIN 20260722115948_revoke_public_grant_save_signal_analysis.sql
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
-- version 20260722115948.
--
-- Rewriting this file cannot affect production: 20260722115948 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

revoke execute on function api.save_signal_analysis(text, jsonb, text) from public;
grant execute on function api.save_signal_analysis(text, jsonb, text) to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722115948','revoke_public_grant_save_signal_analysis','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722115948_revoke_public_grant_save_signal_analysis.sql

-- RECOVERY BEGIN 20260722120000_revoke_public_grant_bulk_approve_engine_queue_retry.sql
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
-- version 20260722120000.
--
-- Rewriting this file cannot affect production: 20260722120000 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

revoke execute on function api.bulk_approve_engine_queue(text, integer, text) from public;
grant execute on function api.bulk_approve_engine_queue(text, integer, text) to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722120000','revoke_public_grant_bulk_approve_engine_queue_retry','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722120000_revoke_public_grant_bulk_approve_engine_queue_retry.sql

-- RECOVERY BEGIN 20260722120001_revoke_public_grant_count_engine_review_queue_retry.sql
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
-- version 20260722120001.
--
-- Rewriting this file cannot affect production: 20260722120001 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

revoke execute on function api.count_engine_review_queue(text, integer) from public;
grant execute on function api.count_engine_review_queue(text, integer) to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722120001','revoke_public_grant_count_engine_review_queue_retry','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722120001_revoke_public_grant_count_engine_review_queue_retry.sql

-- RECOVERY BEGIN 20260722120002_cron_housekeeping_optimization.sql
-- Replay-safe cron/pg_net housekeeping helpers.
--
-- Renumbered 2026-08-05 from 20260722120000 to 20260722120002. Contents are
-- unchanged. This file was committed under a version the production ledger
-- already owns: supabase_migrations.schema_migrations records 20260722120000 as
-- `revoke_public_grant_bulk_approve_engine_queue_retry`, which is also present
-- in this directory under that exact version. Two files cannot share one
-- version -- the CLI applies both, then fails inserting the second ledger row:
--   duplicate key value violates unique constraint "schema_migrations_pkey"
--   (SQLSTATE 23505), Key (version)=(20260722120000) already exists
-- The production-recorded file keeps 20260722120000; this repository-only file
-- takes the next free slot, which is unused in both the repository and the live
-- ledger. 20260722120001 is likewise production-recorded, so 120002 is the
-- first available second and keeps this migration chronologically adjacent.
--
-- Nothing depends on ordering here: both neighbours only REVOKE grants on
-- unrelated api.* review RPCs, and the two functions below are created with
-- CREATE OR REPLACE behind to_regclass guards, with no other definition
-- anywhere in the repository.
--
-- Not retired as obsolete, because it is not a no-op against production: both
-- functions exist live but were created outside the recorded ledger as
-- SECURITY INVOKER with the PUBLIC execute grant still in place. This migration
-- is the forward change that makes them SECURITY DEFINER and removes that
-- grant.

create or replace function public.prune_net_http_response()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, net
as $function$
begin
  if to_regclass('net._http_response') is not null then
    execute 'delete from net._http_response where created < now() - interval ''24 hours''';
  end if;
end;
$function$;

create or replace function public.prune_cron_job_run_details()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, cron
as $function$
begin
  if to_regclass('cron.job_run_details') is not null then
    execute 'delete from cron.job_run_details where end_time < now() - interval ''7 days''';
  end if;
end;
$function$;

revoke execute on function public.prune_net_http_response() from public, anon, authenticated;
revoke execute on function public.prune_cron_job_run_details() from public, anon, authenticated;
grant execute on function public.prune_net_http_response() to service_role;
grant execute on function public.prune_cron_job_run_details() to service_role;

-- Live cron schedules remain environment state and are installed only where
-- pg_cron is available by the controlled operations runbook.


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722120002','cron_housekeeping_optimization','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722120002_cron_housekeeping_optimization.sql

-- RECOVERY BEGIN 20260722120014_hv_quality_promote_explicit_confidence_floor.sql
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
-- version 20260722120014.
--
-- Rewriting this file cannot affect production: 20260722120014 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create or replace function public.hv_promote_signals(p_min_conf numeric default 0.65)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare n int;
begin
  update public.signals s set
    reviewed = true, reviewed_by = 'auto:v1', reviewed_at = now()
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and coalesce(s.quality_confidence, 1) >= p_min_conf
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and regexp_replace(coalesce(s.url,''), '^https?://(www\.)?([^/]+).*', '\2')
        not in (select domain from public.excluded_source_domains);
  get diagnostics n = row_count;
  return n;
end$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722120014','hv_quality_promote_explicit_confidence_floor','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722120014_hv_quality_promote_explicit_confidence_floor.sql

-- RECOVERY BEGIN 20260722120017_hv_quality_promote_tick_explicit_confidence_call.sql
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
-- version 20260722120017.
--
-- Rewriting this file cannot affect production: 20260722120017 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create or replace function public.hv_quality_promote_tick()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_dd int; v_pr int;
begin
  v_dd := public.hv_dedup_assign(0.90, 400);
  v_pr := public.hv_promote_signals(0.65);
  return jsonb_build_object('deduped',v_dd,'promoted',v_pr);
end$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722120017','hv_quality_promote_tick_explicit_confidence_call','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722120017_hv_quality_promote_tick_explicit_confidence_call.sql

-- RECOVERY BEGIN 20260722182921_deprecate_unused_stage3_pipeline_a.sql
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
-- version 20260722182921.
--
-- Rewriting this file cannot affect production: 20260722182921 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Per Tyler's decision (2026-07-22): Pipeline B (hv_classify_corpus_* /
-- hv_promote_signals / hv_dedup_assign) is canonical -- it's the one actually proven
-- in production and now has continuous automation enabled. Pipeline A
-- (signal_classifications / api.promote_classified_signals) was never wired to
-- anything and is now formally deprecated. Marker only -- no drop, no data touched,
-- fully reversible. See docs/control/STAGE3_PROMOTION.md for full context.
comment on table public.signal_classifications is
  'DEPRECATED 2026-07-22: unused staging table for Pipeline A (api.promote_classified_signals), '
  'never wired to production. Pipeline B (hv_classify_corpus_* writing directly to '
  'signals.quality_label + hv_promote_signals) is canonical. See docs/control/STAGE3_PROMOTION.md.';

comment on function api.promote_classified_signals(numeric, boolean, integer) is
  'DEPRECATED 2026-07-22: never wired to production, superseded by public.hv_promote_signals '
  '(Pipeline B). Do not call. See docs/control/STAGE3_PROMOTION.md.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722182921','deprecate_unused_stage3_pipeline_a','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722182921_deprecate_unused_stage3_pipeline_a.sql

-- RECOVERY BEGIN 20260722183144_fix_rows_needing_titles_pipeline_b.sql
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
-- version 20260722183144.
--
-- Rewriting this file cannot affect production: 20260722183144 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- api.rows_needing_titles still joined against public.signal_classifications
-- (Pipeline A's staging table, just deprecated in
-- deprecate_unused_stage3_pipeline_a.sql) to find rows needing an editorial
-- title. Pipeline B (the canonical, actually-live pipeline) writes
-- quality_label directly onto public.signals and never touches
-- signal_classifications, so this RPC could only ever reach rows classified
-- by the deprecated path. Verified live before this fix: of the 919 promoted
-- rows missing editorial_title, only 9 were reachable via the old join.
--
-- Fix: match on s.quality_label='signal' directly, dropping the dependency
-- on signal_classifications entirely. Same authorization check preserved
-- unchanged (service_role or admin/operator/analyst).
--
-- Rollback: restore the join on public.signal_classifications (see git
-- history of 20260721073000_fix_readonly_review_queue_rpcs_missing_authz.sql
-- for the prior body) -- not recommended, restores the near-total miss rate.

create or replace function api.rows_needing_titles(p_limit integer default 25)
returns table(signal_id text, headline text, summary text)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  if (select auth.role()) is distinct from 'service_role' and not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role or service_role required' using errcode = '42501';
  end if;
  return query
  select s.id, s.headline, s.summary
  from public.signals s
  where s.quality_label = 'signal'
    and s.editorial_title is null
    and not public.is_junk_headline(s.headline)
  order by s.created_at desc limit p_limit;
end;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722183144','fix_rows_needing_titles_pipeline_b','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722183144_fix_rows_needing_titles_pipeline_b.sql

-- RECOVERY BEGIN 20260722185015_resolve_quality_crons_by_name.sql
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
-- version 20260722185015.
--
-- Rewriting this file cannot affect production: 20260722185015 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

do $$
declare
  v_pipeline_id bigint;
  v_promote_id bigint;
begin
  select jobid into strict v_pipeline_id from cron.job where jobname = 'hv-quality-pipeline';
  select jobid into strict v_promote_id from cron.job where jobname = 'hv-quality-promote';
  perform cron.alter_job(v_pipeline_id, active => true);
  perform cron.alter_job(v_promote_id, active => true);
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722185015','resolve_quality_crons_by_name','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722185015_resolve_quality_crons_by_name.sql

-- RECOVERY BEGIN 20260722185019_deprecate_pipeline_a_precise_wording.sql
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
-- version 20260722185019.
--
-- Rewriting this file cannot affect production: 20260722185019 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

comment on table public.signal_classifications is
  'DEPRECATED 2026-07-22: not wired to live promotion or cron automation (Pipeline A). '
  'Still holds 929 real staged rows from a 2026-07-19/20 test window, and hv-classify '
  'mode=pool could still write here if invoked manually -- do not assume this table is '
  'empty or inert. Pipeline B (hv_classify_corpus_* writing directly to '
  'signals.quality_label + hv_promote_signals) is the canonical production promotion '
  'path. See docs/control/STAGE3_PROMOTION.md.';

comment on function api.promote_classified_signals(numeric, boolean, integer) is
  'DEPRECATED 2026-07-22: not part of the live promotion path, superseded by '
  'public.hv_promote_signals (Pipeline B). No evidence this was ever invoked with '
  'p_dry_run=false. Do not wire to production without re-verifying against Pipeline B '
  'first. See docs/control/STAGE3_PROMOTION.md.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722185019','deprecate_pipeline_a_precise_wording','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722185019_deprecate_pipeline_a_precise_wording.sql

-- RECOVERY BEGIN 20260722185023_hv_promote_signals_structural_confidence_floor.sql
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
-- version 20260722185023.
--
-- Rewriting this file cannot affect production: 20260722185023 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create or replace function public.hv_promote_signals(p_min_conf numeric default 0.65)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare n int;
begin
  update public.signals s set
    reviewed = true, reviewed_by = 'auto:v1', reviewed_at = now()
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and s.quality_confidence is not null
    and s.quality_confidence >= greatest(coalesce(p_min_conf, 0.65), 0.65)
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and regexp_replace(coalesce(s.url,''), '^https?://(www\.)?([^/]+).*', '\2')
        not in (select domain from public.excluded_source_domains);
  get diagnostics n = row_count;
  return n;
end$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722185023','hv_promote_signals_structural_confidence_floor','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722185023_hv_promote_signals_structural_confidence_floor.sql

-- RECOVERY BEGIN 20260722185025_rows_needing_titles_promoted_only.sql
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
-- version 20260722185025.
--
-- Rewriting this file cannot affect production: 20260722185025 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create or replace function api.rows_needing_titles(p_limit integer default 25)
returns table(signal_id text, headline text, summary text)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  if (select auth.role()) is distinct from 'service_role' and not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role or service_role required' using errcode = '42501';
  end if;
  return query
  select s.id, s.headline, s.summary
  from public.signals s
  where s.quality_label = 'signal'
    and s.reviewed = true
    and s.editorial_title is null
    and not public.is_junk_headline(s.headline)
  order by s.created_at desc limit p_limit;
end;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722185025','rows_needing_titles_promoted_only','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722185025_rows_needing_titles_promoted_only.sql

-- RECOVERY BEGIN 20260722200145_revoke_anon_authenticated_hv_pipeline_functions.sql
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
-- version 20260722200145.
--
-- Rewriting this file cannot affect production: 20260722200145 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

revoke execute on function public.hv_classify_corpus_dispatch(integer, integer) from anon, authenticated;
revoke execute on function public.hv_classify_corpus_harvest() from anon, authenticated;
revoke execute on function public.hv_dedup_assign(double precision, integer) from anon, authenticated;
revoke execute on function public.hv_embed_dispatch(text[]) from anon, authenticated;
revoke execute on function public.hv_embed_harvest() from anon, authenticated;
revoke execute on function public.hv_entities_dispatch(integer) from anon, authenticated;
revoke execute on function public.hv_entities_harvest() from anon, authenticated;
revoke execute on function public.hv_pipeline_tick() from anon, authenticated;
revoke execute on function public.hv_promote_signals(numeric) from anon, authenticated;
revoke execute on function public.hv_quality_promote_tick() from anon, authenticated;
revoke execute on function public.hv_translate_dispatch(integer, boolean) from anon, authenticated;
revoke execute on function public.hv_translate_harvest() from anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722200145','revoke_anon_authenticated_hv_pipeline_functions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722200145_revoke_anon_authenticated_hv_pipeline_functions.sql

-- RECOVERY BEGIN 20260722200256_revoke_public_hv_pipeline_functions_actual_fix.sql
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
-- version 20260722200256.
--
-- Rewriting this file cannot affect production: 20260722200256 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

revoke execute on function public.hv_classify_corpus_dispatch(integer, integer) from public;
revoke execute on function public.hv_classify_corpus_harvest() from public;
revoke execute on function public.hv_dedup_assign(double precision, integer) from public;
revoke execute on function public.hv_embed_dispatch(text[]) from public;
revoke execute on function public.hv_embed_harvest() from public;
revoke execute on function public.hv_entities_dispatch(integer) from public;
revoke execute on function public.hv_entities_harvest() from public;
revoke execute on function public.hv_pipeline_tick() from public;
revoke execute on function public.hv_promote_signals(numeric) from public;
revoke execute on function public.hv_quality_promote_tick() from public;
revoke execute on function public.hv_translate_dispatch(integer, boolean) from public;
revoke execute on function public.hv_translate_harvest() from public;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722200256','revoke_public_hv_pipeline_functions_actual_fix','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722200256_revoke_public_hv_pipeline_functions_actual_fix.sql

-- RECOVERY BEGIN 20260722203608_lock_down_hv_pipeline_job_tables_rls.sql
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
-- version 20260722203608.
--
-- Rewriting this file cannot affect production: 20260722203608 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Found 2026-07-22 while auditing the hv_* pipeline (see
-- docs/INTELLIGENCE_ARCHITECTURE_SPEC.md Stage B): six tables had RLS
-- disabled AND full INSERT/SELECT/UPDATE/DELETE/TRUNCATE granted to
-- `anon` -- the public key shipped in the browser bundle. Whether or not
-- these are currently reachable via PostgREST (this project's convention
-- is that only the `api` schema is exposed, per ADR #9 in HANDOFF.md),
-- there is no legitimate reason for an unauthenticated caller to have
-- write access to internal async-job-tracking tables or the promotion
-- domain blocklist. service_role has BYPASSRLS on this platform by
-- default, so enabling RLS with zero policies here is the same
-- "locked to service_role only" pattern already used elsewhere in this
-- codebase (e.g. the deal_* tables) -- it does not affect the pipeline's
-- own SECURITY DEFINER functions or edge-function service-role callers.
-- Revoking the grants directly, on top of RLS, is defense in depth.
--
-- ia_graph_entities is deliberately left untouched: it already has RLS on
-- with a real authenticated-read policy, which looks intentional (a
-- public-facing entity graph feature), not an oversight.

ALTER TABLE public.excluded_source_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_classify_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_embed_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_entity_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_translation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_entities ENABLE ROW LEVEL SECURITY;

REVOKE INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.excluded_source_domains FROM anon, authenticated;
REVOKE INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.hv_classify_jobs FROM anon, authenticated;
REVOKE INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.hv_embed_jobs FROM anon, authenticated;
REVOKE INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.hv_entity_jobs FROM anon, authenticated;
REVOKE INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.hv_translation_jobs FROM anon, authenticated;
REVOKE INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.signal_entities FROM anon, authenticated;

REVOKE ALL ON public.excluded_source_domains FROM PUBLIC;
REVOKE ALL ON public.hv_classify_jobs FROM PUBLIC;
REVOKE ALL ON public.hv_embed_jobs FROM PUBLIC;
REVOKE ALL ON public.hv_entity_jobs FROM PUBLIC;
REVOKE ALL ON public.hv_translation_jobs FROM PUBLIC;
REVOKE ALL ON public.signal_entities FROM PUBLIC;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722203608','lock_down_hv_pipeline_job_tables_rls','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722203608_lock_down_hv_pipeline_job_tables_rls.sql

-- RECOVERY BEGIN 20260722222809_correct_cc_briefings_albania_botswana.sql
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
-- version 20260722222809.
--
-- Rewriting this file cannot affect production: 20260722222809 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Both confirmed via independent, multi-source verification (government sites, court records,
-- specialist industry press) -- not heuristic guesses. Both briefing entries were flatly wrong,
-- not just stale on detail: Albania's export-only medical/industrial regime has existed since
-- July 2023 (Law 61/2023, NACC); Botswana's Cannabis Bill, 2025 passed 14 Aug 2025, ten months
-- before this briefing's 21-Jun-2026 dated entry still said "Prohibited."

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Medical/Industrial Legal (Export-Only, Since 2023); NACC-Licensed',
  public_summary = 'Albania legalized licensed cannabis cultivation and processing for medical and industrial purposes via Law No. 61/2023 (passed July 2023), regulated by the National Agency for Cannabis Control (NACC) under the Ministry of Health. Every licensed product is designated exclusively for export -- domestic retail, wholesale, prescription, and personal use remain fully illegal, and Albania does not recognize foreign medical cannabis prescriptions. Licenses run 15 years; industrial hemp is defined at an unusually high 0.8% THC ceiling (vs. the 0.2-0.3% common in the EU/US). NACC joined the Cannabis Regulators Association (CANNRA) in November 2024, a genuine marker of institutional maturity. Recreational cannabis remains criminally prosecuted.',
  regulatory_outlook = 'The export-only program is real and actively maturing (CANNRA membership, active licensing pipeline), not merely proposed. No domestic retail or patient-access reform is signaled -- the policy intent is explicitly to build an export industry, not a domestic market.',
  data_source_summary = 'National Agency for Cannabis Control (nacc.gov.al, official); LegalClarity; Global Initiative Against Transnational Organized Crime risk bulletin; Wikipedia.',
  confidence_score = 0.85,
  confidence_categories = '{"enforcement": 0.75, "market_access": 0.6, "regulatory_framework": 0.85}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry stated no medical programme exists; Albania legalized export-only medical/industrial cultivation in July 2023 under NACC, which joined CANNRA in Nov 2024", "market": "Albania", "timeAgo": "20 July 2026", "direction": "up", "sourceRef": "NACC (nacc.gov.al); LegalClarity; GI-TOC risk bulletin", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-20', updated_at = now()
WHERE country_iso2 = 'AL';

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Medical/Industrial/Scientific Legal (Cannabis Bill 2025); Recreational Prohibited',
  public_summary = 'Botswana''s Parliament adopted a cannabis policy framework in April 2025 and passed the Cannabis Bill, 2025 on 14 August 2025 (25-5-4 vote), establishing a National Cannabis Control Authority to license cultivation, processing, research, and medical/scientific use. Botswana regulates hemp as "industrial cannabis" at a 0.7% THC ceiling rather than a separate hemp category. A 2018 licensed grower (Fresh Standard (Pty) Ltd) had its rights to produce hemp and cannabis for industrial/medical purposes upheld by the Botswana High Court in 2022 after wrongful cancellation -- evidence of real licensed activity predating the 2025 framework. Recreational use, sale, and CBD products remain fully illegal and criminally prosecuted. Licensing fees are steeply tiered: roughly EC[sic, should read] €214-534/year for resident cultivators versus over €2 million/year for non-resident processing/manufacturing licenses, a structure locally criticized for excluding smallholders.',
  regulatory_outlook = 'The framework is newly operational -- government-run hemp production trials were reported succeeding within days of this review, with commercial-scale licensing the next phase. Near-term development is industry scale-up under the new Authority, not further legislative change. CBD and recreational use remain outside any near-term reform path.',
  data_source_summary = 'Hemp Today (2026, government trials); News24 (2022 High Court ruling); Growers Network Forum (Aug 2025 Bill passage detail).',
  confidence_score = 0.82,
  confidence_categories = '{"enforcement": 0.7, "market_access": 0.55, "regulatory_framework": 0.8}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry said prohibited with no medical programme; Botswana passed the Cannabis Bill, 2025 in August 2025, establishing a National Cannabis Control Authority and licensing regime ten months before this entry''s last review date", "market": "Botswana", "timeAgo": "20 July 2026", "direction": "up", "sourceRef": "Hemp Today; News24; Growers Network Forum", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-20', updated_at = now()
WHERE country_iso2 = 'BW';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722222809','correct_cc_briefings_albania_botswana','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722222809_correct_cc_briefings_albania_botswana.sql

-- RECOVERY BEGIN 20260722222826_fix_typo_botswana_briefing.sql
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
-- version 20260722222826.
--
-- Rewriting this file cannot affect production: 20260722222826 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

UPDATE public.cc_jurisdiction_briefings
SET public_summary = replace(public_summary, 'roughly EC[sic, should read] €214-534/year', 'roughly €214-534/year'),
    updated_at = now()
WHERE country_iso2 = 'BW';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722222826','fix_typo_botswana_briefing','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722222826_fix_typo_botswana_briefing.sql

-- RECOVERY BEGIN 20260722223013_correct_cc_briefings_ba_fj_fo_kz_mu_sz.sql
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
-- version 20260722223013.
--
-- Rewriting this file cannot affect production: 20260722223013 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Six more corrections to the templated "Prohibited"/"Prohibited — No Medical Programme" cluster.
-- Unlike Albania/Botswana (independently re-verified via fresh web search this session), these
-- rely on the sourcing already in jurisdiction_playbooks -- real, named sources (Leafwell,
-- Lexology, Reuters, Semafor Africa, named officials) with "high" confidence labels already
-- attached, but not freshly re-verified by me externally. Scored 0.72-0.78 rather than the
-- 0.82-0.85 given to AL/BW to preserve that honest distinction.

UPDATE public.cc_jurisdiction_briefings SET
  program_status = 'Medical Legal (Law Passed); Implementing Regulations In Progress',
  public_summary = 'Bosnia and Herzegovina''s Ministry of Civil Affairs is implementing a medical cannabis legalization law; as of April 2026, the professional guidelines and operational procedures needed before cannabis-based medicines reach pharmacies were still being finalized, so patient access is not yet live. A separate, pre-existing industrial hemp pathway (registered varieties at or below 0.2% THC, competent-body authorization) already operates independently of the medical reform.',
  regulatory_outlook = 'Watch for the Ministry''s implementing regulations to be finalized -- that, not further legislation, is the remaining gate before patient access goes live.',
  data_source_summary = 'Soft Secrets (Bosnia and Herzegovina medical cannabis regulation reporting); independent trade press.',
  confidence_score = 0.75, confidence_categories = '{"enforcement": 0.6, "market_access": 0.35, "regulatory_framework": 0.75}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry said prohibited/no medical programme; a medical cannabis law has passed and implementing regulations were in progress as of April 2026", "market": "Bosnia and Herzegovina", "timeAgo": "20 July 2026", "direction": "up", "sourceRef": "Soft Secrets", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-20', updated_at = now()
WHERE country_iso2 = 'BA';

UPDATE public.cc_jurisdiction_briefings SET
  program_status = 'Industrial Hemp Legal (Since 2022); Medical Export Framework Under Investigation',
  public_summary = 'Fiji removed industrial hemp (under 1% THC) from Schedule 1 of the Illicit Drugs Control Act in August 2022, permitting import, cultivation, sale and supply under standard agricultural licensing -- the only currently operative cannabis-adjacent legal pathway. General cannabis and any THC-bearing medical product remain fully illegal with no licensing pathway. A medical-cannabis export policy framework was endorsed in 2024 but remains investigative, not an operative licensing regime, and excludes domestic medical use.',
  regulatory_outlook = 'The hemp pathway is real and operating today; medical/export development remains at the policy-study stage with no confirmed licensing timeline.',
  data_source_summary = 'Leafwell (Aug 2022 hemp exception, named political advocates).',
  confidence_score = 0.78, confidence_categories = '{"enforcement": 0.65, "market_access": 0.4, "regulatory_framework": 0.75}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry said prohibited; industrial hemp under 1% THC has been legal since August 2022, though general cannabis/medical remains illegal", "market": "Fiji", "timeAgo": "20 July 2026", "direction": "up", "sourceRef": "Leafwell", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-20', updated_at = now()
WHERE country_iso2 = 'FJ';

UPDATE public.cc_jurisdiction_briefings SET
  program_status = 'Medical Legal (Narrow, 11 Approved Products); Cultivation Fully Illegal',
  public_summary = 'The Faroe Islands permit prescription of a fixed list of 11 pre-approved imported cannabis-based products (no flower) as a last-resort treatment after other options fail -- there is no MMJ card system, and costs are entirely patient-borne with no Danish-style reimbursement structure identified. Cultivation is illegal for both medical and recreational purposes, with no exception for approved patients.',
  regulatory_outlook = 'No expansion beyond the current 11-product list or a reimbursement structure has been signaled.',
  data_source_summary = 'Leafwell (detailed programme description); independent local news on enforcement posture.',
  confidence_score = 0.78, confidence_categories = '{"enforcement": 0.7, "market_access": 0.3, "regulatory_framework": 0.75}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry said prohibited/no medical programme; a narrow prescription pathway for 11 approved imported products exists as a last-resort treatment", "market": "Faroe Islands", "timeAgo": "20 July 2026", "direction": "up", "sourceRef": "Leafwell", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-20', updated_at = now()
WHERE country_iso2 = 'FO';

UPDATE public.cc_jurisdiction_briefings SET
  program_status = 'Industrial Hemp Legal (Since 2025); No Medical or Recreational Program',
  public_summary = 'Kazakhstan enacted an industrial hemp licensing law in mid-2025, administered by the Ministry of Internal Affairs for certified non-narcotic varieties (0.3% THC or below) restricted to agricultural/industrial uses (fiber, paper, construction materials); only 4 cultivation licenses had been issued as of April 2025. No pathway exists for recreational or medical cannabis, or CBD consumer products -- full prohibition continues outside the hemp carve-out.',
  regulatory_outlook = 'Early-stage industrial hemp rollout (4 licenses as of April 2025); no medical or consumer CBD reform signaled.',
  data_source_summary = 'Multiple independent news sources quoting named Kazakh officials on the 2025 hemp law.',
  confidence_score = 0.75, confidence_categories = '{"enforcement": 0.7, "market_access": 0.25, "regulatory_framework": 0.7}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry said prohibited with no qualification; an industrial hemp licensing law passed mid-2025 with 4 licenses issued by April 2025, though no medical/recreational program exists", "market": "Kazakhstan", "timeAgo": "20 July 2026", "direction": "up", "sourceRef": "Named Kazakh officials via independent news reporting", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-20', updated_at = now()
WHERE country_iso2 = 'KZ';

UPDATE public.cc_jurisdiction_briefings SET
  program_status = 'Medical Legal (Narrow, Named-Condition Import); Industrial Hemp Pilot-Stage',
  public_summary = 'Mauritius permits a narrow medical pathway via Ministry of Health and Wellness import authorization for compliant cannabis-derived products (THC capped at 30mg/mL, volume capped at 60mL) tied to an approved condition or Medicinal Cannabis Therapeutic Committee approval. A separate industrial hemp pilot (Ministry of Agriculture/FAREI) remains early-stage, not a mature licensing regime. General recreational cannabis remains illegal and prosecuted.',
  regulatory_outlook = 'A cited 2026-2030 master plan signals further development; specifics were not independently detailed in available sources and should be confirmed directly before relying on a timeline.',
  data_source_summary = 'Lexology legal analysis (THC/volume thresholds, import-authorization structure); Leafwell; cannabisregulations.ai (general prohibition/penalties); 321CBD (hemp pilot); TalkingDrugs (2026-2030 master plan reference).',
  confidence_score = 0.75, confidence_categories = '{"enforcement": 0.65, "market_access": 0.4, "regulatory_framework": 0.7}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry said prohibited/no medical programme; a narrow named-condition medical import pathway exists via Ministry of Health authorization and a Medicinal Cannabis Therapeutic Committee", "market": "Mauritius", "timeAgo": "20 July 2026", "direction": "up", "sourceRef": "Lexology; Leafwell", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-20', updated_at = now()
WHERE country_iso2 = 'MU';

UPDATE public.cc_jurisdiction_briefings SET
  program_status = 'Narrow Executive-Licensed Export Precedent; Broader Legalization Bill Pending Supermajority',
  public_summary = 'General cannabis cultivation, possession, and sale remain illegal and actively prosecuted in Eswatini. However, at least two companies -- PSIQ (exclusive license, 2019) and Profile Solutions Inc. (10-year license) -- hold direct executive-granted cultivation/export licenses under GMP-standard conditions, predating any general legalization; terms are not standardized or open to ordinary applicants. A broader medical-legalization bill (tabled 2020, resurfaced 2023) proposing a new Medicines Regulatory Authority requires a three-quarters supermajority in both the House of Assembly and Senate and had not been confirmed passed as of the most recent reporting.',
  regulatory_outlook = 'Watch the pending bill''s supermajority requirement -- a high bar not yet cleared -- rather than assuming the existing narrow executive-license precedent will expand into general licensing.',
  data_source_summary = 'Wikipedia; Sensi Seeds; Reuters; High Times; Semafor Africa -- documented licensee examples on both the narrow-export and general-prohibition sides.',
  confidence_score = 0.78, confidence_categories = '{"enforcement": 0.7, "market_access": 0.35, "regulatory_framework": 0.7}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry said prohibited without qualification; at least two named companies hold real executive-granted cultivation/export licenses, and a broader legalization bill requiring a 3/4 legislative supermajority is pending", "market": "Eswatini", "timeAgo": "20 July 2026", "direction": "up", "sourceRef": "Reuters; Semafor Africa; Wikipedia", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-20', updated_at = now()
WHERE country_iso2 = 'SZ';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260722223013','correct_cc_briefings_ba_fj_fo_kz_mu_sz','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260722223013_correct_cc_briefings_ba_fj_fo_kz_mu_sz.sql

-- RECOVERY BEGIN 20260723084446_baseline_hv_intelligence_pipeline.sql
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
-- version 20260723084446.
--
-- Rewriting this file cannot affect production: 20260723084446 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- ============================================================================
-- BASELINE CAPTURE: the hv_* intelligence pipeline (Pipeline B)
-- ============================================================================
-- Written 2026-07-22. This pipeline (10 functions + 4 job-tracking tables +
-- 2 cron jobs) was built live over the prior week via untracked execute_sql
-- calls -- ZERO migration file, doc, or HANDOFF entry existed for any of it
-- before this. That gap is why it caused two production incidents:
--
-- 1. It duplicated Stage 0-4 of docs/INTELLIGENCE_ARCHITECTURE_SPEC.md,
--    built independently and concurrently with a second implementation
--    (the intel_*/signal_classifications family) -- neither session aware
--    of the other, because neither had left anything the other could find.
-- 2. Its cron jobs (hv-quality-pipeline every 2 min, hv-quality-promote
--    every 10 min) burned this project's Nano-tier disk-IO budget and
--    degraded the live database for 2+ hours (2026-07-21/22). Both were
--    disabled to stop it. A separate, concurrent session then re-enabled
--    hv-quality-pipeline without knowing why it was off, causing a second,
--    near-identical outage the same day -- specifically BECAUSE there was
--    nothing written down to stop them.
--
-- See docs/INTELLIGENCE_ARCHITECTURE_SPEC.md Section 2.8 and Section 8 for
-- the full incident history and the consolidation plan. The short version:
--
--   *** DO NOT re-enable hv-quality-pipeline or hv-quality-promote crons ***
--   *** without first completing: Stage C (mechanical validation gate),  ***
--   *** Stage E (cadence redesign for the disk-IO budget), and Stage F   ***
--   *** (hard dispatch/cost ceilings). Re-enabling either without those  ***
--   *** three landing first WILL reproduce this exact incident.         ***
--
-- This migration is a baseline capture, not a functional change: every
-- statement below is idempotent (CREATE OR REPLACE / CREATE TABLE IF NOT
-- EXISTS) and matches exactly what has been running live. The two cron
-- jobs are intentionally NOT re-created here -- see the note at the bottom.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Job-tracking tables (async dispatch/harvest pattern -- one row per
-- outbound net.http_post, harvested by a matching *_harvest() function once
-- net._http_response has the result)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.hv_classify_jobs (
  request_id bigint NOT NULL PRIMARY KEY,
  signal_id text NOT NULL,
  harvested boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.hv_embed_jobs (
  request_id bigint NOT NULL PRIMARY KEY,
  signal_ids text[] NOT NULL,
  harvested boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.hv_translation_jobs (
  request_id bigint NOT NULL PRIMARY KEY,
  signal_id text NOT NULL,
  dispatched_at timestamptz NOT NULL DEFAULT now(),
  harvested boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.hv_entity_jobs (
  request_id bigint NOT NULL PRIMARY KEY,
  signal_id text NOT NULL,
  harvested boolean NOT NULL DEFAULT false
);

-- RLS + grants for these four tables are handled by the companion migration
-- 20260722203608_lock_down_hv_pipeline_job_tables_rls.sql (applied first,
-- same session) -- not repeated here to avoid ordering ambiguity.

-- ---------------------------------------------------------------------------
-- Translate stage
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.hv_translate_dispatch(p_limit integer DEFAULT 30, p_eval_only boolean DEFAULT false)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end$function$;

CREATE OR REPLACE FUNCTION public.hv_translate_harvest()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end$function$;

-- ---------------------------------------------------------------------------
-- Classify stage -- calls the same hv-classify edge function hardened
-- 2026-07-21 (OpenAI-only, retry + 429 backoff). Writes DIRECTLY onto
-- signals columns, unlike Pipeline A's signal_classifications join table.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.hv_classify_corpus_dispatch(p_limit integer DEFAULT 100, p_scope_days integer DEFAULT 120)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; v_rid bigint; n int:=0;
begin
  for r in
    select s.id, coalesce(s.title_en, s.headline) as h, coalesce(s.summary_en, left(s.summary,1000), s.title_en, s.headline) as sm
    from public.signals s
    where s.quality_label is null
      and s.reviewed is distinct from true
      and s.headline is not null
      and s.created_at > now() - (p_scope_days||' days')::interval
      and not exists (select 1 from public.hv_classify_jobs j where j.signal_id=s.id and not j.harvested)
    order by s.created_at desc
    limit p_limit
  loop
    select net.http_post(
      url:='https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='hv_edge_anon_key' limit 1)),
      body:=jsonb_build_object('text', jsonb_build_object('headline', r.h, 'summary', r.sm)),
      timeout_milliseconds:=30000
    ) into v_rid;
    insert into public.hv_classify_jobs(request_id, signal_id) values (v_rid, r.id) on conflict do nothing;
    n:=n+1;
  end loop;
  return n;
end$function$;

CREATE OR REPLACE FUNCTION public.hv_classify_corpus_harvest()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; v_c jsonb; n int:=0;
begin
  for r in
    select j.request_id, j.signal_id, resp.status_code, resp.content
    from public.hv_classify_jobs j join net._http_response resp on resp.id=j.request_id
    where not j.harvested
  loop
    if r.status_code=200 then
      begin
        v_c := (r.content::jsonb->'classification');
        if v_c is not null then
          update public.signals s set
            quality_label = v_c->>'quality_label',
            content_type = v_c->>'content_type',
            impact = v_c->>'impact',
            quality_confidence = (v_c->>'confidence')::numeric,
            classifier_version = 'hv-classify/openai/v1'
          where s.id = r.signal_id;
          n:=n+1;
        end if;
      exception when others then null;
      end;
    end if;
    update public.hv_classify_jobs set harvested=true where request_id=r.request_id;
  end loop;
  return n;
end$function$;

-- ---------------------------------------------------------------------------
-- Embed stage
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.hv_embed_dispatch(p_signal_ids text[])
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end$function$;

CREATE OR REPLACE FUNCTION public.hv_embed_harvest()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end$function$;

-- ---------------------------------------------------------------------------
-- Entity extraction stage -- runs AFTER promotion (gated on
-- reviewed_by='auto:v1'), so it only processes already-published signals.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.hv_entities_dispatch(p_limit integer DEFAULT 60)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; v_rid bigint; n int:=0;
begin
  for r in
    select s.id, coalesce(s.title_en,s.headline) as h, coalesce(s.summary_en,left(s.summary,900),'') as sm
    from public.signals s
    where s.reviewed_by='auto:v1'
      and not exists (select 1 from public.signal_entities se where se.signal_id=s.id)
      and not exists (select 1 from public.hv_entity_jobs j where j.signal_id=s.id and not j.harvested)
    order by s.created_at desc
    limit p_limit
  loop
    select net.http_post(
      url:='https://api.openai.com/v1/chat/completions',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='openai_api_key')),
      body:=jsonb_build_object('model','gpt-4o-mini','temperature',0,'response_format',jsonb_build_object('type','json_object'),
        'messages',jsonb_build_array(
          jsonb_build_object('role','system','content','Extract NAMED organizations from this cannabis-industry news item. Include licensed operators/companies, regulators/government bodies, and investors/financial firms. Return ONLY JSON {"entities":[{"name":"...","type":"operator|regulator|investor|other"}]}. Named entities only — no generic terms, no country names alone. Empty array if none.'),
          jsonb_build_object('role','user','content','HEADLINE: '||r.h||E'\nSUMMARY: '||r.sm)
        )),
      timeout_milliseconds:=30000
    ) into v_rid;
    insert into public.hv_entity_jobs(request_id, signal_id) values (v_rid, r.id) on conflict do nothing;
    n:=n+1;
  end loop;
  return n;
end$function$;

CREATE OR REPLACE FUNCTION public.hv_entities_harvest()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; ent jsonb; v_name text; v_type text; v_eid text; n int:=0;
begin
  for r in
    select j.request_id, j.signal_id, resp.status_code, resp.content
    from public.hv_entity_jobs j join net._http_response resp on resp.id=j.request_id
    where not j.harvested
  loop
    if r.status_code=200 then
      begin
        for ent in select * from jsonb_array_elements(((r.content::jsonb->'choices'->0->'message'->>'content')::jsonb)->'entities')
        loop
          v_name := btrim(ent->>'name');
          v_type := coalesce(nullif(btrim(ent->>'type'),''),'other');
          if v_name is null or length(v_name) < 2 then continue; end if;
          select id into v_eid from public.ia_graph_entities where lower(label)=lower(v_name) limit 1;
          if v_eid is null then
            v_eid := 'ent:'||substr(md5(lower(v_name)),1,20);
            insert into public.ia_graph_entities(id,type,label,signal_count,last_activity,created_at,updated_at)
            values (v_eid, v_type, v_name, 0, now(), now(), now())
            on conflict (id) do nothing;
          end if;
          insert into public.signal_entities(signal_id, entity_id, mention_text, entity_type, confidence)
          values (r.signal_id, v_eid, v_name, v_type, 0.8)
          on conflict (signal_id, entity_id) do nothing;
          update public.ia_graph_entities set signal_count=coalesce(signal_count,0)+1, last_activity=now() where id=v_eid;
          n:=n+1;
        end loop;
      exception when others then null;
      end;
    end if;
    update public.hv_entity_jobs set harvested=true where request_id=r.request_id;
  end loop;
  return n;
end$function$;

-- ---------------------------------------------------------------------------
-- Dedup / clustering (cosine similarity on embedding_1024, threshold 0.90)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.hv_dedup_assign(p_tau double precision DEFAULT 0.90, p_scope_days integer DEFAULT 120)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare n int;
begin
  update public.signals a
  set is_representative = not exists (
        select 1 from public.signals b
        where b.id <> a.id and b.embedding_1024 is not null
          and b.created_at > now() - (p_scope_days||' days')::interval
          and ( coalesce(b.score,0) > coalesce(a.score,0)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at < a.created_at)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at = a.created_at and b.id < a.id) )
          and (1 - (a.embedding_1024 <=> b.embedding_1024)) >= p_tau
      ),
      cluster_rep_id = coalesce((
        select b.id from public.signals b
        where b.id <> a.id and b.embedding_1024 is not null
          and b.created_at > now() - (p_scope_days||' days')::interval
          and (1 - (a.embedding_1024 <=> b.embedding_1024)) >= p_tau
          and ( coalesce(b.score,0) > coalesce(a.score,0)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at < a.created_at)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at = a.created_at and b.id < a.id) )
        order by (1 - (a.embedding_1024 <=> b.embedding_1024)) desc
        limit 1
      ), a.id)
  where a.embedding_1024 is not null
    and a.created_at > now() - (p_scope_days||' days')::interval;
  get diagnostics n = row_count;
  return n;
end$function$;

-- ---------------------------------------------------------------------------
-- Promotion. Structural invariant preserved through this baseline capture:
-- only ever flips reviewed false->true, never touches human-reviewed rows.
-- GAP (Stage C, not yet fixed): does not check any validation gate before
-- promoting -- see docs/INTELLIGENCE_ARCHITECTURE_SPEC.md Section 6.2/6.3.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.hv_promote_signals(p_min_conf numeric DEFAULT 0.65)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare n int;
begin
  update public.signals s set
    reviewed = true, reviewed_by = 'auto:v1', reviewed_at = now()
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and s.quality_confidence is not null
    and s.quality_confidence >= greatest(coalesce(p_min_conf, 0.65), 0.65)
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and regexp_replace(coalesce(s.url,''), '^https?://(www\.)?([^/]+).*', '\2')
        not in (select domain from public.excluded_source_domains);
  get diagnostics n = row_count;
  return n;
end$function$;

-- ---------------------------------------------------------------------------
-- Orchestration entry points. NOT scheduled by this migration -- see the
-- warning at the top. Both were live crons (hv-quality-pipeline */2 min,
-- hv-quality-promote */10 min) prior to 2026-07-21; both are currently
-- unscheduled. Re-adding via cron.schedule(...) is Stage J, gated on
-- Stages C/E/F landing first, and requires explicit sign-off.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.hv_pipeline_tick()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_tr_h int; v_cl_h int; v_em_h int; v_ent_h int; v_cl_d int; v_tr_d int; v_em_d int := 0; v_ent_d int; v_ids text[];
begin
  v_tr_h := public.hv_translate_harvest();
  v_cl_h := public.hv_classify_corpus_harvest();
  v_em_h := public.hv_embed_harvest();
  v_ent_h := public.hv_entities_harvest();

  v_tr_d := public.hv_translate_dispatch(40, false);
  v_cl_d := public.hv_classify_corpus_dispatch(120, 400);
  v_ent_d := public.hv_entities_dispatch(40);

  select array_agg(id) into v_ids from (
    select s.id from public.signals s where s.quality_label='signal' and s.embedding_1024 is null order by s.created_at desc limit 100
  ) q;
  if v_ids is not null then perform public.hv_embed_dispatch(v_ids); v_em_d := array_length(v_ids,1); end if;

  return jsonb_build_object('classify_dispatched',v_cl_d,'entities_harvested',v_ent_h,'entities_dispatched',v_ent_d,'embed_dispatched',v_em_d);
end$function$;

CREATE OR REPLACE FUNCTION public.hv_quality_promote_tick()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_dd int; v_pr int;
begin
  v_dd := public.hv_dedup_assign(0.90, 400);
  v_pr := public.hv_promote_signals(0.65);
  return jsonb_build_object('deduped',v_dd,'promoted',v_pr);
end$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260723084446','baseline_hv_intelligence_pipeline','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260723084446_baseline_hv_intelligence_pipeline.sql

-- RECOVERY BEGIN 20260723084602_stage_c_classifier_validation_gate.sql
-- Restore the exact production-owned body for migration 20260723084602.
-- The previous stub omitted public.classifier_validation, which later
-- migrations depend on.

-- Stage C (docs/INTELLIGENCE_ARCHITECTURE_SPEC.md Section 8): mechanically
-- enforce the classifier validation gate instead of relying on a human
-- remembering not to promote an unvalidated classifier version.
--
-- Backfilled row reflects the live api.intel_eval_scoring result for
-- run_id='v1-smoke' (verified 2026-07-23): n_human_truth=181,
-- signal_precision=1.000, signal_recall=0.559. gate_passed is FALSE because
-- recall is below the 0.70 bar proposed in spec Section 6.2/10 -- this is
-- Tyler's open decision (ship as-is vs. hold for more prompt-tuning work),
-- not yet made. Until he flips gate_passed, hv_promote_signals structurally
-- cannot promote anything for this classifier_version, regardless of cron
-- state.

create table if not exists public.classifier_validation (
  classifier_version text primary key,
  validated_at timestamptz not null default now(),
  n_eval_rows integer,
  signal_precision numeric,
  signal_recall numeric,
  gate_passed boolean not null default false,
  notes text
);

alter table public.classifier_validation enable row level security;
revoke all on public.classifier_validation from anon, authenticated, public;

insert into public.classifier_validation
  (classifier_version, n_eval_rows, signal_precision, signal_recall, gate_passed, notes)
values
  ('hv-classify/openai/v1', 181, 1.000, 0.559, false,
   'v1-smoke eval run 2026-07-21/22. Precision clears any reasonable bar (1.000). '
   'Recall (0.559) is below the 0.70 gate proposed in spec Section 6.2 -- open '
   'decision for Tyler: ship at current recall vs. hold for more prompt-tuning. '
   'Flip gate_passed to true (and update this row) only after that decision.')
on conflict (classifier_version) do nothing;

-- hv_promote_signals now refuses to promote any row whose classifier_version
-- doesn't have a gate_passed=true row here. Everything else about the
-- function (structural confidence floor, is_representative, excluded
-- domains, human-review protection) is unchanged from the 2026-07-22
-- baseline.
create or replace function public.hv_promote_signals(p_min_conf numeric default 0.65)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare n int;
begin
  update public.signals s set
    reviewed = true, reviewed_by = 'auto:v1', reviewed_at = now()
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and s.quality_confidence is not null
    and s.quality_confidence >= greatest(coalesce(p_min_conf, 0.65), 0.65)
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and exists (
      select 1 from public.classifier_validation cv
      where cv.classifier_version = s.classifier_version
        and cv.gate_passed = true
    )
    and regexp_replace(coalesce(s.url,''), '^https?://(www\.)?([^/]+).*', '\2')
        not in (select domain from public.excluded_source_domains);
  get diagnostics n = row_count;
  return n;
end$function$;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260723084602','stage_c_classifier_validation_gate','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260723084602_stage_c_classifier_validation_gate.sql
