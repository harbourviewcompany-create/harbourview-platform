BEGIN;

-- Harbourview Talent P0 governed ingestion service: TAL-032..038 / CTL-019.
-- External ingestion remains globally disabled by default. This service stores
-- source observations only when both the feature flag and configured source
-- rights permit storage; it never auto-publishes an external vacancy.

CREATE OR REPLACE FUNCTION api.talent_ingest_job_observation(
  p_source_key text,
  p_external_id text,
  p_title text,
  p_employer_name text,
  p_location text,
  p_source_url text,
  p_source_payload jsonb,
  p_observed_at timestamptz,
  p_content_hash text,
  p_run_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=''
AS $$
DECLARE
  v_source_id uuid;
  v_rights public.talent_source_rights%ROWTYPE;
  v_run_id uuid;
  v_source_record_id uuid;
  v_job_id uuid;
  v_snapshot_id uuid;
  v_existing_hash text;
BEGIN
  IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'SERVICE_ROLE_REQUIRED' USING ERRCODE='42501'; END IF;
  IF NOT api.talent_feature_enabled('external_ingestion') THEN RAISE EXCEPTION 'EXTERNAL_INGESTION_DISABLED' USING ERRCODE='42501'; END IF;

  SELECT s.id INTO v_source_id
  FROM public.talent_ingestion_sources s
  WHERE s.source_key=p_source_key AND s.status='active';
  IF v_source_id IS NULL THEN RAISE EXCEPTION 'SOURCE_NOT_ACTIVE'; END IF;
  SELECT * INTO v_rights FROM public.talent_source_rights r WHERE r.source_id=v_source_id;
  IF v_rights.source_id IS NULL OR v_rights.storage_allowed IS DISTINCT FROM true THEN RAISE EXCEPTION 'SOURCE_STORAGE_NOT_AUTHORIZED' USING ERRCODE='42501'; END IF;

  IF p_run_key IS NOT NULL THEN
    INSERT INTO public.talent_ingestion_runs(source_id,run_key,status,started_at)
    VALUES(v_source_id,p_run_key,'running',coalesce(p_observed_at,now()))
    ON CONFLICT(run_key) DO UPDATE SET source_id=EXCLUDED.source_id
    RETURNING id INTO v_run_id;
  END IF;

  SELECT sr.id,sr.job_id INTO v_source_record_id,v_job_id
  FROM public.talent_job_source_records sr
  WHERE sr.source_id=v_source_id AND sr.external_id=p_external_id;

  IF v_source_record_id IS NULL THEN
    INSERT INTO public.talent_job_opportunities(
      employer_display_name,canonical_slug,title,location_text,application_method,
      application_url,lifecycle_status,publication_state,source_class,freshness_state,
      quality_state,first_seen_at,last_confirmed_at,created_at,updated_at
    ) VALUES(
      nullif(trim(p_employer_name),''),'external-observed-'||gen_random_uuid()::text,
      trim(p_title),nullif(trim(p_location),''),'external',nullif(trim(p_source_url),''),
      'open','validation','external','confirmed','ingestible',coalesce(p_observed_at,now()),
      coalesce(p_observed_at,now()),coalesce(p_observed_at,now()),coalesce(p_observed_at,now())
    ) RETURNING id INTO v_job_id;

    INSERT INTO public.talent_job_source_records(job_id,source_id,external_id,source_url,canonical_url,observed_title,observed_employer,observed_location,source_status,first_seen_at,last_seen_at)
    VALUES(v_job_id,v_source_id,p_external_id,nullif(trim(p_source_url),''),nullif(trim(p_source_url),''),trim(p_title),nullif(trim(p_employer_name),''),nullif(trim(p_location),''),'confirmed',coalesce(p_observed_at,now()),coalesce(p_observed_at,now()))
    RETURNING id INTO v_source_record_id;
  ELSE
    UPDATE public.talent_job_source_records
    SET source_url=coalesce(nullif(trim(p_source_url),''),source_url),
        canonical_url=coalesce(nullif(trim(p_source_url),''),canonical_url),
        observed_title=trim(p_title),
        observed_employer=nullif(trim(p_employer_name),''),
        observed_location=nullif(trim(p_location),''),
        source_status='confirmed',last_seen_at=coalesce(p_observed_at,now())
    WHERE id=v_source_record_id;
    UPDATE public.talent_job_opportunities
    SET title=trim(p_title),employer_display_name=nullif(trim(p_employer_name),''),location_text=nullif(trim(p_location),''),
        application_url=coalesce(nullif(trim(p_source_url),''),application_url),freshness_state='confirmed',last_confirmed_at=coalesce(p_observed_at,now()),updated_at=now()
    WHERE id=v_job_id;
  END IF;

  SELECT s.content_hash INTO v_existing_hash FROM public.talent_job_snapshots s WHERE s.source_record_id=v_source_record_id ORDER BY s.observed_at DESC LIMIT 1;
  INSERT INTO public.talent_job_snapshots(source_record_id,content_hash,source_payload,observed_at)
  VALUES(v_source_record_id,p_content_hash,coalesce(p_source_payload,'{}'::jsonb),coalesce(p_observed_at,now()))
  ON CONFLICT(source_record_id,content_hash) DO UPDATE SET observed_at=greatest(public.talent_job_snapshots.observed_at,EXCLUDED.observed_at)
  RETURNING id INTO v_snapshot_id;

  INSERT INTO public.talent_job_source_observations(source_record_id,run_id,state,observed_at,details)
  VALUES(v_source_record_id,v_run_id,'confirmed',coalesce(p_observed_at,now()),jsonb_build_object('contentChanged',v_existing_hash IS DISTINCT FROM p_content_hash));

  IF v_existing_hash IS DISTINCT FROM p_content_hash THEN
    INSERT INTO public.talent_job_change_events(job_id,change_type,details)
    VALUES(v_job_id,'other',jsonb_build_object('sourceRecordId',v_source_record_id,'priorContentHash',v_existing_hash,'newContentHash',p_content_hash));
  END IF;

  IF v_run_id IS NOT NULL THEN
    UPDATE public.talent_ingestion_runs
    SET records_seen=records_seen+1,records_accepted=records_accepted+1,
        records_changed=records_changed+CASE WHEN v_existing_hash IS DISTINCT FROM p_content_hash THEN 1 ELSE 0 END
    WHERE id=v_run_id;
  END IF;

  INSERT INTO public.talent_audit_events(event_type,subject_type,subject_id,reason_code,metadata)
  VALUES('talent_job_source_observed','job',v_job_id,'GOVERNED_INGESTION',jsonb_build_object('sourceKey',p_source_key,'externalId',p_external_id,'sourceRecordId',v_source_record_id,'snapshotId',v_snapshot_id));

  RETURN jsonb_build_object('jobId',v_job_id,'sourceRecordId',v_source_record_id,'snapshotId',v_snapshot_id,'publicationState','validation','qualityState','ingestible');
END;
$$;
REVOKE ALL ON FUNCTION api.talent_ingest_job_observation(text,text,text,text,text,text,jsonb,timestamptz,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION api.talent_ingest_job_observation(text,text,text,text,text,text,jsonb,timestamptz,text,text) TO service_role;

CREATE OR REPLACE FUNCTION api.talent_finish_ingestion_run(p_run_key text,p_status text,p_error_summary text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=''
AS $$
BEGIN
  IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'SERVICE_ROLE_REQUIRED' USING ERRCODE='42501'; END IF;
  IF p_status NOT IN ('succeeded','partial','failed','rate_limited','cancelled') THEN RAISE EXCEPTION 'INVALID_RUN_STATUS'; END IF;
  UPDATE public.talent_ingestion_runs SET status=p_status,completed_at=now(),error_summary=p_error_summary WHERE run_key=p_run_key;
END;
$$;
REVOKE ALL ON FUNCTION api.talent_finish_ingestion_run(text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION api.talent_finish_ingestion_run(text,text,text) TO service_role;

COMMIT;
