-- Restore public.hv_promote_staging_to_artifacts into the repository, and fix the
-- null-derivation bug that has been failing the hv-promote-staging cron.
--
-- WHY THIS EXISTS
--
-- The function is a production-owned object that was never in this repository --
-- `grep -rl hv_promote_staging_to_artifacts supabase/ lib/ app/ scripts/` matched
-- only `supabase/release-controls/pending-production-migration-decisions.json`.
-- Category: production object created outside the recorded ledger, restored here
-- as a replay foundation.
--
-- THE BUG
--
-- `cron.job_run_details` for `hv-promote-staging` over three days: 22 failed, 50
-- succeeded. Every failure is identical:
--
--   ERROR: null value in column "object_class" of relation "hv_artifacts"
--          violates not-null constraint
--   DETAIL: Failing row contains (..., null, internal, null,
--           Medical Marijuana - Arkansas Department of Health, ...)
--
-- The original derivation:
--
--   v_class_text := v_norm->>'object_class';
--   BEGIN
--     v_object_class := v_class_text::hv_object_class;
--   EXCEPTION WHEN invalid_text_representation THEN
--     v_object_class := 'regulatory_event'::hv_object_class;
--   END;
--
-- `NULL::hv_object_class` is NULL, not an error. When `normalized_payload` has no
-- `object_class` key -- or a JSON null -- the cast raises nothing, the handler
-- never fires, `v_object_class` stays NULL, and the INSERT hits the NOT NULL
-- constraint. The handler only ever catches a non-null but invalid string such as
-- 'garbage'. `hv_artifacts.object_class` is NOT NULL with no default (verified).
--
-- Because the whole batch aborts, the offending staging row is never marked and is
-- picked up again on the next tick, so it recurs until the payload changes.
-- `hv_import_staging` currently holds 380 unpromoted rows.
--
-- `v_authority` had the identical flaw: `(v_norm->>'authority_level')::hv_authority_level`
-- yields NULL for a missing key rather than raising, so its 'G' fallback was also
-- unreachable for that case. Fixed the same way, matching the function's own
-- evident intent.
--
-- THE FIX
--
-- Two lines. `coalesce(nullif(btrim(...), ''), <fallback>)` before the cast, so a
-- missing, null, empty or whitespace-only value takes the same fallback the
-- exception handler already established. The `EXCEPTION` blocks are retained
-- unchanged -- they still cover the non-null-but-invalid case they were written
-- for. Everything else is a byte-faithful replay of the production body
-- (5482 chars, md5 e3501b60dabe593b46abb2d155db2b8c), captured read-only from
-- `pg_proc.prosrc`.
--
-- GRANTS
--
-- The production copy is currently executable by `anon` and `authenticated` -- it
-- appears in both the anon_definer_execute and authenticated_definer_execute
-- assertion results. It is a SECURITY DEFINER writer that inserts artifacts,
-- evidence and jobs; nothing about it should be callable from the Data API. The
-- explicit revoke/grant below follows the pattern 20260710190300 established, and
-- includes PUBLIC because leaving it out lets anon keep EXECUTE through the
-- pseudo-role.

create or replace function public.hv_promote_staging_to_artifacts(
  p_batch_size integer,
  p_workspace_id uuid
)
returns table(staging_id uuid, artifact_id uuid, action text, title text, country text)
language plpgsql
volatile
security definer
set search_path = public
as $hv_promote_staging_to_artifacts$
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
$hv_promote_staging_to_artifacts$;

revoke all privileges on function public.hv_promote_staging_to_artifacts(integer, uuid)
  from public, anon, authenticated;
grant execute on function public.hv_promote_staging_to_artifacts(integer, uuid)
  to service_role;
