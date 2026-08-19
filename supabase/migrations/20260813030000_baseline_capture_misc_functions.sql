-- Baseline capture: final 11 functions from the 48-function untracked-origin
-- audit (see docs/control/EVIDENCE_LOG.md and the three preceding batches
-- in this repair series). Bodies and search_path verbatim from live
-- pg_get_functiondef. Table dependencies checked before writing (all
-- present: education_modules/tracks/_education_regen_jobs,
-- marketplace_candidates, marketplace_inquiries, local_authorities,
-- jurisdiction_playbooks, user_profiles, subscriptions).
--
-- Grants preserved exactly as live, checked via pg_proc.proacl before
-- writing: api.request_signal_analysis is authenticated-executable (gates
-- on caller role internally via is_service_role_or_signal_analyst, same
-- pattern as api.get_recently_analyzed_signals in the previous batch), and
-- hv_clean_scraped_headline/norm_headline/promote_inquiry_to_candidate/
-- sync_playbook_regulators carry PUBLIC execute predating this repo's
-- default-privilege closure. Not tightening -- out of scope for a
-- restoration.
--
-- smoke_close_marketplace_inquiry / smoke_verify_marketplace_inquiry:
-- test-harness RPCs, tightly regex-gated to a specific smoke-test email/
-- marker pattern and a fixed inquiry_type allowlist -- reviewed the input
-- validation before restoring, not just copied.

CREATE OR REPLACE FUNCTION public.norm_headline(h text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
  select btrim(regexp_replace(lower(regexp_replace(coalesce(h,''), '\s+[-–]\s+[^-–]+$', '')), '[^a-z0-9 ]', '', 'g'))
$function$;
GRANT EXECUTE ON FUNCTION public.norm_headline(text) TO PUBLIC;

CREATE OR REPLACE FUNCTION public.hv_clean_scraped_headline(raw text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  v TEXT;
  probe_len INT;
  probe TEXT;
  repeat_pos INT;
BEGIN
  IF raw IS NULL THEN RETURN raw; END IF;

  v := replace(raw,   '&nbsp;', ' ');
  v := replace(v,     '&amp;',  '&');
  v := replace(v,     '&lt;',   '<');
  v := replace(v,     '&gt;',   '>');
  v := replace(v,     '&#39;',  '''');
  v := replace(v,     '&quot;', '"');
  v := regexp_replace(v, '\s{2,}', ' ', 'g');
  v := trim(v);

  -- Detect duplicate title: probe first 40 chars, look for repeat
  probe_len := LEAST(40, length(v) / 2);
  IF probe_len < 15 THEN RETURN v; END IF;

  probe := left(v, probe_len);
  repeat_pos := strpos(substring(v FROM probe_len + 1), probe);

  IF repeat_pos > 0 THEN
    -- Trim to everything before the repeat begins
    v := trim(left(v, probe_len + repeat_pos - 1));
    -- Also strip trailing " - SourceName" suffix if present
    v := regexp_replace(v, '\s+-\s+\S+\s*$', '');
    RETURN trim(v);
  END IF;

  RETURN v;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.hv_clean_scraped_headline(text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.hv_clean_scraped_headline(text) TO anon;
GRANT EXECUTE ON FUNCTION public.hv_clean_scraped_headline(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.hv_truncate_at_word_boundary(p_text text, p_max_len integer)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT CASE
    WHEN p_text IS NULL THEN NULL
    WHEN length(p_text) <= p_max_len THEN p_text
    ELSE coalesce(nullif(regexp_replace(left(p_text, p_max_len), '\s+\S*$', ''), ''), left(p_text, p_max_len)) || '…'
  END;
$function$;

CREATE OR REPLACE FUNCTION public.score_signal_from_snapshot(p_pass integer, p_lead integer, p_keywords integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  v_lane_r  integer := 0;
  v_lane_e  integer := 0;
  v_lane_t  integer := 0;
  v_score   integer := 0;
  v_pri     text    := 'MONITOR';
BEGIN
  -- Regulatory lane (R): official gazettes and parliamentary committees
  IF p_pass IN (1, 2) THEN
    v_lane_r := CASE
      WHEN p_lead >= 12 THEN 3
      WHEN p_lead >= 6  THEN 2
      ELSE 1
    END;
  END IF;

  -- Economic lane (E): procurement and MDB signals
  IF p_pass IN (3, 4) THEN
    v_lane_e := CASE
      WHEN p_lead >= 24 THEN 3
      WHEN p_lead >= 12 THEN 2
      ELSE 1
    END;
  END IF;

  -- Trade lane (T): all passes contribute, weighted by lead time
  v_lane_t := CASE
    WHEN p_lead >= 18 THEN 3
    WHEN p_lead >= 8  THEN 2
    WHEN p_lead >= 3  THEN 1
    ELSE 0
  END;

  -- Base score from keyword density + lead time + pass
  v_score := (p_keywords * 5)
           + (COALESCE(p_lead, 0) * 2)
           + (COALESCE(p_pass, 1) * 10);

  v_score := LEAST(v_score, 99);

  -- Priority classification
  v_pri := CASE
    WHEN v_score >= 75 THEN 'URGENT'
    WHEN v_score >= 50 THEN 'HIGH'
    WHEN v_score >= 30 THEN 'MONITOR'
    ELSE 'LOW'
  END;

  RETURN jsonb_build_object(
    'lane_r', v_lane_r,
    'lane_e', v_lane_e,
    'lane_t', v_lane_t,
    'score',  v_score,
    'pri',    v_pri
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.smoke_close_marketplace_inquiry(p_email text, p_marker text, p_inquiry_type text)
 RETURNS TABLE(id uuid, inquiry_type text, review_status text, contact_email text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  target_id         uuid;
  v_run_from_email  text;
  v_run_from_marker text;
BEGIN
  v_run_from_email  := replace(split_part(p_email,  'smoke+', 2), '@harbourview.local', '');
  v_run_from_marker := replace(p_marker, 'HARBOURVIEW_BROWSER_SMOKE_TEST:', '');

  IF p_email IS NULL
    OR p_email  !~ '^smoke\+browser-[a-zA-Z0-9\-]+@harbourview\.local$'
    OR p_marker IS NULL
    OR p_marker !~ '^HARBOURVIEW_BROWSER_SMOKE_TEST:browser-[a-zA-Z0-9\-]+$'
    OR v_run_from_email <> v_run_from_marker
    OR p_inquiry_type NOT IN ('quote_routing', 'listing_submission', 'wanted_request_submission')
  THEN
    RAISE EXCEPTION 'invalid smoke close input';
  END IF;

  SELECT mi.id INTO target_id
  FROM public.marketplace_inquiries mi
  WHERE lower(mi.contact_email) = lower(p_email)
    AND mi.inquiry_type = p_inquiry_type
    AND mi.message LIKE '%' || p_marker || '%'
  ORDER BY mi.created_at DESC
  LIMIT 1;

  IF target_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.marketplace_inquiries mi
  SET review_status  = 'closed',
      internal_notes = coalesce(mi.internal_notes || E'\n', '') || p_marker || ': closed by controlled marketplace smoke RPC.',
      updated_at     = now()
  WHERE mi.id = target_id;

  RETURN QUERY
  SELECT mi.id, mi.inquiry_type, mi.review_status, mi.contact_email, mi.created_at
  FROM public.marketplace_inquiries mi
  WHERE mi.id = target_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.smoke_verify_marketplace_inquiry(p_email text, p_marker text, p_inquiry_type text)
 RETURNS TABLE(id uuid, inquiry_type text, review_status text, contact_email text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  v_run_from_email  text;
  v_run_from_marker text;
BEGIN
  v_run_from_email  := replace(split_part(p_email,  'smoke+', 2), '@harbourview.local', '');
  v_run_from_marker := replace(p_marker, 'HARBOURVIEW_BROWSER_SMOKE_TEST:', '');

  IF p_email IS NULL
    OR p_email  !~ '^smoke\+browser-[a-zA-Z0-9\-]+@harbourview\.local$'
    OR p_marker IS NULL
    OR p_marker !~ '^HARBOURVIEW_BROWSER_SMOKE_TEST:browser-[a-zA-Z0-9\-]+$'
    OR v_run_from_email <> v_run_from_marker
    OR p_inquiry_type NOT IN ('quote_routing', 'listing_submission', 'wanted_request_submission')
  THEN
    RAISE EXCEPTION 'invalid smoke verifier input';
  END IF;

  RETURN QUERY
  SELECT mi.id, mi.inquiry_type, mi.review_status, mi.contact_email, mi.created_at
  FROM public.marketplace_inquiries mi
  WHERE lower(mi.contact_email) = lower(p_email)
    AND mi.inquiry_type = p_inquiry_type
    AND mi.message LIKE '%' || p_marker || '%'
  ORDER BY mi.created_at DESC
  LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.promote_inquiry_to_candidate()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  v_title text;
  v_desc  text;
  v_cat   text;

  -- helpers to parse "key: value" lines from the structured block
  v_headline   text;
  v_ltype      text;
  v_cat_key    text;
BEGIN
  IF NEW.listing_id IS NOT NULL THEN RETURN NEW; END IF;
  IF COALESCE(NEW.inquiry_type,'') NOT IN (
    'listing_submission','supply_submission','sell',
    'new_listing','wanted_request','submit_listing',
    'wanted_request_submission'
  ) THEN RETURN NEW; END IF;

  -- Parse key: value lines from the structured block appended by the form
  v_headline := (SELECT trim(split_part(line, ': ', 2))
                 FROM unnest(string_to_array(NEW.message, E'\n')) AS line
                 WHERE trim(line) LIKE 'listing_headline:%' LIMIT 1);
  v_ltype    := (SELECT trim(split_part(line, ': ', 2))
                 FROM unnest(string_to_array(NEW.message, E'\n')) AS line
                 WHERE trim(line) LIKE 'listing_type:%' LIMIT 1);
  v_cat_key  := (SELECT trim(split_part(line, ': ', 2))
                 FROM unnest(string_to_array(NEW.message, E'\n')) AS line
                 WHERE trim(line) LIKE 'category_key:%' LIMIT 1);

  v_title := COALESCE(
    NULLIF(v_headline, ''),
    NULLIF(v_ltype, ''),
    CONCAT('Intake from ', COALESCE(NEW.contact_company, NEW.contact_name, 'Unknown'))
  );
  v_cat   := COALESCE(NULLIF(v_cat_key,''), 'consumables');
  v_desc  := COALESCE(NULLIF(trim(NEW.message),''), 'No description provided');

  INSERT INTO public.marketplace_candidates (
    candidate_type, marketplace_category,
    title_internal, description_internal,
    status, source_id, source_name,
    raw_payload, confidence, discovered_at
  ) VALUES (
    'intake_form', v_cat,
    v_title, v_desc,
    'needs_review', NEW.id::text, 'intake_form',
    jsonb_build_object(
      'inquiry_id',      NEW.id,
      'contact_name',    NEW.contact_name,
      'contact_email',   NEW.contact_email,
      'contact_company', NEW.contact_company,
      'contact_phone',   NEW.contact_phone,
      'listing_type',    v_ltype,
      'raw_message',     NEW.message
    ),
    0.5, NEW.created_at
  );

  RETURN NEW;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.promote_inquiry_to_candidate() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_inquiry_to_candidate() TO anon;
GRANT EXECUTE ON FUNCTION public.promote_inquiry_to_candidate() TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_playbook_regulators(p_country text DEFAULT NULL::text)
 RETURNS TABLE(updated_country text, regulators_count integer)
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
begin
  return query
  with new_regs as (
    select
      la.country_code,
      jsonb_agg(
        jsonb_build_object(
          'name',    la.authority_name,
          'role',    la.authority_role,
          'country', la.country_code,
          'tier',    la.org_tier,
          'website', coalesce(
            (select elem->>'website'
             from public.jurisdiction_playbooks jp2,
                  jsonb_array_elements(jp2.key_regulators) elem
             where jp2.country_iso2 = la.country_code
               and lower(elem->>'name') ilike '%' || lower(split_part(la.authority_name, ' (', 1)) || '%'
             limit 1),
            null
          )
        )
        order by la.display_order
      ) as merged
    from public.local_authorities la
    where la.org_tier in ('top','mid')
      and (p_country is null or la.country_code = p_country)
    group by la.country_code
  ),
  updated as (
    update public.jurisdiction_playbooks jp
    set
      key_regulators = nr.merged,
      updated_at     = now()
    from new_regs nr
    where jp.country_iso2 = nr.country_code
    returning jp.country_iso2, jsonb_array_length(nr.merged) as cnt
  )
  select country_iso2::text, cnt::int from updated;
end;
$function$;
GRANT EXECUTE ON FUNCTION public.sync_playbook_regulators(text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_playbook_regulators(text) TO anon;
GRANT EXECUTE ON FUNCTION public.sync_playbook_regulators(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_subscription_tier()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN
  IF NEW.status = 'active' OR NEW.status = 'trialing' THEN
    UPDATE public.user_profiles SET tier = NEW.tier, updated_at = now()
    WHERE id = NEW.user_id;
  ELSIF OLD.status IN ('active','trialing') AND NEW.status NOT IN ('active','trialing') THEN
    -- Downgrade: check if any other active sub exists
    IF NOT EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE user_id = NEW.user_id AND status IN ('active','trialing') AND id != NEW.id
    ) THEN
      UPDATE public.user_profiles SET tier = 'free', updated_at = now()
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fire_education_batch(p_count integer DEFAULT 6)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  v_key text;
  v_mod record;
  v_req bigint;
  v_fired text[] := '{}';
  v_pre text;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  if v_key is null then return jsonb_build_object('ok',false,'reason','no vault key'); end if;

  v_pre := 'You are writing an in-depth professional education module for Harbourview, a B2B cannabis market intelligence platform used by industry operators, importers, investors, and clinicians. Write in a measured, expert, non-hyped voice -- a seasoned practitioner explaining hard-won knowledge to a competent peer who wants genuine depth, not an overview.

Follow EXACTLY this five-section structure, each section 3500-6000 characters of substantive prose: 1) "Why This Matters", 2) "The Core Framework", 3) "How This Plays Out in Practice", 4) "Common Pitfalls", 5) "Key Takeaways".

DEPTH REQUIREMENTS: Use concrete, illustrative specifics to teach -- worked numeric examples, realistic scenarios, specific decision criteria a practitioner actually applies, and step-by-step reasoning. Walk through an actual calculation, describe a representative timeline with rough durations, or trace a specific decision path.

HONESTY RULE (critical): When you use a specific number, timeline, cost, or scenario as a teaching example, frame it explicitly as illustrative -- e.g. "consider a distributor moving roughly 500kg per quarter", "a typical EU-GMP readiness timeline might run 12-18 months". Do NOT present illustrative figures as verified current market data, and do NOT invent named real companies, fake citations, specific dated events, or statistics attributed to real sources.

Return ONLY a JSON array of exactly 5 objects (no markdown, no prose outside JSON): [{"section_order": 1, "heading": "Why This Matters", "body": "..."}, ...].';

  for v_mod in
    select m.id, m.slug, m.title, m.description, t.title as track
    from education_modules m
    left join education_tracks t on t.id::text = m.track_id
    where m.publication_state='published'
      and m.content_review_status is distinct from 'ai_generated_pending_review'
      and not exists (select 1 from _education_regen_jobs j where j.module_id = m.id::text)
    order by m.slug limit p_count
  loop
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
    v_fired := array_append(v_fired, v_mod.slug);
  end loop;

  return jsonb_build_object('ok', true, 'fired', array_length(v_fired,1), 'modules', to_jsonb(v_fired));
end;
$function$;

CREATE OR REPLACE FUNCTION api.request_signal_analysis(p_signal_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'api', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  v_req_id bigint;
  v_status int;
  v_body jsonb;
  v_waited numeric := 0;
BEGIN
  if not public.is_service_role_or_signal_analyst() then
    raise exception 'insufficient privileges: admin/operator/analyst role required' using errcode = '42501';
  end if;

  IF NOT EXISTS (SELECT 1 FROM public.signals WHERE id = p_signal_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'signal_not_found');
  END IF;

  IF EXISTS (SELECT 1 FROM public.signals WHERE id = p_signal_id AND analysis IS NOT NULL) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_analyzed');
  END IF;

  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'hv_edge_function_base_url') ||
           '/hv-signal-analysis?signal_id=' || p_signal_id,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'hv_edge_anon_key'),
      'x-harbourview-cron-caller', 'pg_cron_hv_signal_analysis'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 28000
  ) INTO v_req_id;

  -- Normal case (healthy LLM credits): first provider succeeds in ~2-5s.
  -- Worst case (all 3 providers fail/exhausted, sequential fallback): can
  -- take close to the edge function's own 28s http timeout. Bound set to
  -- cover the worst case with headroom -- callers on Vercel should confirm
  -- their function/route timeout exceeds ~30s, or treat this as fire-and-poll
  -- from the client instead of a single blocking request.
  LOOP
    PERFORM pg_sleep(0.5);
    v_waited := v_waited + 0.5;
    SELECT status_code, content::jsonb INTO v_status, v_body
    FROM net._http_response WHERE id = v_req_id;
    EXIT WHEN v_status IS NOT NULL OR v_waited >= 30;
  END LOOP;

  IF v_status IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'timed_out', 'request_id', v_req_id);
  END IF;

  IF v_status <> 200 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'edge_function_error', 'status', v_status, 'detail', v_body);
  END IF;

  RETURN v_body;
END;
$function$;
GRANT EXECUTE ON FUNCTION api.request_signal_analysis(text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION api.request_signal_analysis(text) TO authenticated;
