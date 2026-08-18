-- ─── 4. Ingestion quality: truncation, script/style leakage, dedup ────────
-- Three separate bugs in the source-capture -> extract -> promote path,
-- found while investigating why "top scored" signals were mostly garbage.

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

CREATE OR REPLACE FUNCTION public.hv_extract_signals_from_captured_text(p_batch_size integer DEFAULT 50)
 RETURNS TABLE(snapshot_id uuid, source_name text, country text, candidates_found integer, status_set text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
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

    v_snap.captured_text := regexp_replace(v_snap.captured_text, '<script[^>]*>.*?</script>', ' ', 'gi');
    v_snap.captured_text := regexp_replace(v_snap.captured_text, '<style[^>]*>.*?</style>', ' ', 'gi');

    v_snap.captured_text := regexp_replace(v_snap.captured_text, '<[^>]+>', ' ', 'g');
    v_snap.captured_text := regexp_replace(v_snap.captured_text, '&nbsp;', ' ', 'gi');
    v_snap.captured_text := regexp_replace(v_snap.captured_text, '&lt;', '<', 'gi');
    v_snap.captured_text := regexp_replace(v_snap.captured_text, '&gt;', '>', 'gi');
    v_snap.captured_text := regexp_replace(v_snap.captured_text, '&quot;', '"', 'gi');
    v_snap.captured_text := regexp_replace(v_snap.captured_text, '&#39;', '''', 'gi');
    v_snap.captured_text := regexp_replace(v_snap.captured_text, '&amp;', '&', 'gi');
    v_snap.captured_text := regexp_replace(v_snap.captured_text, '\s+', ' ', 'g');
    v_snap.captured_text := trim(v_snap.captured_text);

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

      IF length(v_chunk) + length(v_sentence) > 500 OR v_chunk = '' THEN
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
                  'text',               public.hv_truncate_at_word_boundary(v_chunk, 500),
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
              'text',               public.hv_truncate_at_word_boundary(v_chunk, 500),
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

