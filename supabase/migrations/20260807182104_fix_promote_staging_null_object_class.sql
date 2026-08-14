do $promote_fix$
begin
  if to_regtype('public.hv_object_class') is null
     or to_regtype('public.hv_authority_level') is null
     or to_regclass('public.hv_import_staging') is null
     or to_regclass('public.hv_artifacts') is null then
    raise notice 'hv_* import foundations absent; skipping promote-staging repair';
    return;
  end if;

  execute $create$
create or replace function public.hv_promote_staging_to_artifacts(
  p_batch_size integer default 50,
  p_workspace_id uuid default 'a85840b4-c522-4cb8-9097-2f6c30a78417'::uuid
)
returns table(staging_id uuid, artifact_id uuid, action text, title text, country text)
language plpgsql
volatile
security definer
set search_path = public
  as $body$
DECLARE
  v_row          RECORD;
  v_norm         JSONB;
  v_artifact_id  UUID;
  v_evidence_id  UUID;
  v_job_key      TEXT;
  v_existing_id  UUID;
  v_authority    hv_authority_level;
  v_object_class hv_object_class;
  v_class_text   TEXT;
BEGIN

  FOR v_row IN
    SELECT s.*
    FROM hv_import_staging s
    WHERE s.status = 'pending'
      AND s.workspace_id = p_workspace_id
    ORDER BY s.created_at ASC
    LIMIT p_batch_size
  LOOP

    v_norm := v_row.normalized_payload;

    -- Resolve object_class safely.
    -- coalesce/nullif added: a missing or empty key casts to NULL without raising,
    -- so the EXCEPTION handler below never fired and the NOT NULL insert failed.
    v_class_text := v_norm->>'object_class';
    BEGIN
      v_object_class := COALESCE(NULLIF(btrim(v_class_text), ''), 'regulatory_event')::hv_object_class;
    EXCEPTION WHEN invalid_text_representation THEN
      v_object_class := 'regulatory_event'::hv_object_class;
    END;

    -- Resolve authority_level safely (same null-derivation fix as above).
    BEGIN
      v_authority := COALESCE(NULLIF(btrim(v_norm->>'authority_level'), ''), 'G')::hv_authority_level;
    EXCEPTION WHEN invalid_text_representation THEN
      v_authority := 'G'::hv_authority_level;
    END;

    -- Dedup: check content_hash against existing artifacts
    IF v_row.content_hash IS NOT NULL THEN
      SELECT id INTO v_existing_id
      FROM hv_artifacts
      WHERE content_hash = v_row.content_hash
        AND workspace_id = p_workspace_id
      LIMIT 1;

      IF v_existing_id IS NOT NULL THEN
        -- Mark staging as duplicate
        UPDATE hv_import_staging
        SET status          = 'rejected',
            rejected_at     = now(),
            rejection_reason = 'duplicate',
            duplicate_of    = v_existing_id,
            is_duplicate_candidate = TRUE,
            duplicate_confidence   = 1.000
        WHERE id = v_row.id;

        staging_id  := v_row.id;
        artifact_id := v_existing_id;
        action      := 'duplicate_skipped';
        title       := v_row.proposed_title;
        country     := v_norm->>'country_iso';
        RETURN NEXT;
        CONTINUE;
      END IF;
    END IF;

    -- Create artifact
    INSERT INTO hv_artifacts (
      workspace_id,
      object_class,
      classification,
      authority_level,
      title,
      body,
      structured_data,
      source_system,
      source_record_id,
      source_url,
      import_batch_id,
      content_hash,
      lifecycle_stage,
      review_status,
      freshness,
      public_eligible,
      jurisdiction_code,
      country_iso,
      region
    ) VALUES (
      p_workspace_id,
      v_object_class,
      'internal'::hv_classification,
      v_authority,
      COALESCE(v_row.proposed_title, 'Untitled'),
      v_norm->>'body',
      jsonb_build_object(
        'source_name',       (v_norm->>'source_name'),
        'language',          v_norm->>'language',
        'requires_translation', (v_norm->>'requires_translation')::BOOLEAN,
        'keyword_count',     v_norm->>'keyword_count',
        'matched_keywords',  v_norm->'matched_keywords',
        'intelligence_pass', v_norm->>'intelligence_pass',
        'staging_id',        v_row.id
      ),
      COALESCE(v_norm->>'source_system', v_row.source_system),
      COALESCE(v_norm->>'source_record_id', v_row.source_record_id),
      v_row.source_url,
      v_row.import_batch_id,
      v_row.content_hash,
      'normalized'::hv_lifecycle_stage,
      'pending'::hv_review_status,
      'fresh'::hv_freshness,
      FALSE,
      v_row.proposed_jurisdiction,
      v_row.proposed_country_iso,
      v_norm->>'region'
    )
    RETURNING id INTO v_artifact_id;

    -- Create evidence record
    INSERT INTO hv_evidence (
      artifact_id,
      workspace_id,
      source_system,
      source_id,
      source_url,
      captured_at,
      import_batch_id,
      content_hash,
      mime_type,
      extracted_text,
      classification,
      access_classification,
      extraction_status,
      requires_translation,
      language_detected,
      review_status
    ) VALUES (
      v_artifact_id,
      p_workspace_id,
      v_row.source_system,
      v_row.source_record_id,
      v_row.source_url,
      v_row.created_at,
      v_row.import_batch_id,
      v_row.raw_payload_hash,
      'application/json',
      v_norm->>'body',
      'internal'::hv_classification,
      'restricted'::hv_classification,
      'completed',
      COALESCE((v_norm->>'requires_translation')::BOOLEAN, FALSE),
      v_norm->>'language',
      'pending'::hv_review_status
    )
    RETURNING id INTO v_evidence_id;

    -- Queue embed job (deterministic key — safe to rerun)
    v_job_key := 'embed:' || v_artifact_id::TEXT;

    INSERT INTO hv_processing_jobs (
      workspace_id,
      artifact_id,
      job_type,
      job_key,
      priority,
      input_payload,
      status
    ) VALUES (
      p_workspace_id,
      v_artifact_id,
      'embed'::hv_job_type,
      v_job_key,
      3,
      jsonb_build_object(
        'artifact_id',  v_artifact_id,
        'evidence_id',  v_evidence_id,
        'source_field', 'title+body',
        'model_id',     'text-embedding-3-small',
        'dimensions',   1536
      ),
      'pending'::hv_job_status
    )
    ON CONFLICT (job_key) DO NOTHING;

    -- Mark staging as promoted
    UPDATE hv_import_staging
    SET status               = 'promoted',
        promoted_artifact_id = v_artifact_id,
        promoted_at          = now()
    WHERE id = v_row.id;

    staging_id  := v_row.id;
    artifact_id := v_artifact_id;
    action      := 'created';
    title       := v_row.proposed_title;
    country     := v_row.proposed_country_iso;
    RETURN NEXT;

  END LOOP;
END;
$body$;
  $create$;

  execute 'revoke all privileges on function public.hv_promote_staging_to_artifacts(integer, uuid)'
          ' from public, anon, authenticated';
  execute 'grant execute on function public.hv_promote_staging_to_artifacts(integer, uuid)'
          ' to service_role';

  raise notice 'hv_promote_staging_to_artifacts repaired and restricted to service_role';
end
$promote_fix$;
