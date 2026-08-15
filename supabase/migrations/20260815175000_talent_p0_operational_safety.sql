BEGIN;

-- Harbourview Talent P0 operational safety foundations: CTL-009/010/019,
-- TAL-075, TAL-086..092. Feature flags are independent kill switches; source
-- ingestion remains disabled until explicitly authorized outside this branch.

ALTER TABLE public.talent_job_opportunities
  ADD COLUMN IF NOT EXISTS quality_state text NOT NULL DEFAULT 'ingestible'
    CHECK (quality_state IN ('ingestible','searchable','publishable','rejected'));

UPDATE public.talent_job_opportunities
SET quality_state = CASE
  WHEN publication_state = 'published' AND lifecycle_status = 'open' THEN 'publishable'
  WHEN publication_state IN ('publishable','validation') THEN 'searchable'
  ELSE 'ingestible'
END
WHERE quality_state = 'ingestible';

CREATE TABLE IF NOT EXISTS public.talent_feature_flags (
  feature_key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  description text NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.talent_feature_flags(feature_key,enabled,description) VALUES
  ('find_jobs',true,'Canonical public job discovery API and UI'),
  ('find_talent',true,'Permissioned employer-side professional discovery'),
  ('external_ingestion',false,'External provider ingestion into canonical Talent'),
  ('candidate_semantic_search',false,'Candidate semantic/vector ranking; structured/lexical remains available'),
  ('candidate_identity_disclosure',true,'Policy-governed identity reveal after disclosure checks'),
  ('applications',true,'Canonical application submission service'),
  ('professional_claiming',true,'Authenticated user Passport/bootstrap and claim foundations'),
  ('canonical_job_reads',true,'Canonical JobOpportunity read cutover')
ON CONFLICT(feature_key) DO NOTHING;

ALTER TABLE public.talent_feature_flags ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.talent_feature_flags FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.talent_feature_flags TO service_role;

CREATE OR REPLACE FUNCTION api.talent_feature_enabled(p_feature_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=''
AS $$
  SELECT coalesce((SELECT f.enabled FROM public.talent_feature_flags f WHERE f.feature_key=p_feature_key),false);
$$;
REVOKE ALL ON FUNCTION api.talent_feature_enabled(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION api.talent_feature_enabled(text) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION api.talent_register_document(
  p_user_id uuid,
  p_application_id uuid,
  p_document_type text,
  p_storage_path text,
  p_file_name text,
  p_content_type text,
  p_size_bytes bigint,
  p_content_hash text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=''
AS $$
DECLARE
  v_person_id uuid;
  v_document_id uuid;
BEGIN
  IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'SERVICE_ROLE_REQUIRED' USING ERRCODE='42501'; END IF;
  SELECT pa.person_id INTO v_person_id FROM public.talent_person_accounts pa WHERE pa.user_id=p_user_id AND pa.revoked_at IS NULL LIMIT 1;
  IF v_person_id IS NULL THEN RAISE EXCEPTION 'PERSON_REQUIRED' USING ERRCODE='P0002'; END IF;
  IF p_application_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.talent_applications a
    WHERE a.id=p_application_id AND (a.applicant_user_id=p_user_id OR a.person_id=v_person_id)
  ) THEN RAISE EXCEPTION 'APPLICATION_FORBIDDEN' USING ERRCODE='42501'; END IF;
  IF p_document_type NOT IN ('resume','credential','application_attachment','other') THEN RAISE EXCEPTION 'INVALID_DOCUMENT_TYPE'; END IF;
  IF p_storage_path NOT LIKE v_person_id::text || '/%' THEN RAISE EXCEPTION 'INVALID_DOCUMENT_PATH'; END IF;

  INSERT INTO public.talent_documents(person_id,application_id,document_type,storage_bucket,storage_path,file_name,content_type,size_bytes,content_hash,privacy_class,retention_class)
  VALUES(v_person_id,p_application_id,p_document_type,'talent-private',p_storage_path,p_file_name,p_content_type,p_size_bytes,p_content_hash,'application_specific',CASE WHEN p_application_id IS NULL THEN 'talent_professional_document' ELSE 'talent_application_document' END)
  RETURNING id INTO v_document_id;

  INSERT INTO public.talent_document_access_events(document_id,actor_user_id,action)
  VALUES(v_document_id,p_user_id,'upload');
  INSERT INTO public.talent_audit_events(event_type,actor_user_id,subject_type,subject_id,reason_code,metadata)
  VALUES('talent_document_uploaded',p_user_id,'document',v_document_id,'OWNER_UPLOAD',jsonb_build_object('documentType',p_document_type,'applicationId',p_application_id));
  RETURN v_document_id;
END;
$$;
REVOKE ALL ON FUNCTION api.talent_register_document(uuid,uuid,text,text,text,text,bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION api.talent_register_document(uuid,uuid,text,text,text,text,bigint,text) TO service_role;

CREATE OR REPLACE FUNCTION api.talent_document_access_context(p_document_id uuid,p_user_id uuid)
RETURNS TABLE(document_id uuid,storage_bucket text,storage_path text,file_name text,content_type text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path=''
AS $$
DECLARE v_person_id uuid;
BEGIN
  IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'SERVICE_ROLE_REQUIRED' USING ERRCODE='42501'; END IF;
  SELECT pa.person_id INTO v_person_id FROM public.talent_person_accounts pa WHERE pa.user_id=p_user_id AND pa.revoked_at IS NULL LIMIT 1;
  RETURN QUERY
  SELECT d.id,d.storage_bucket,d.storage_path,d.file_name,d.content_type
  FROM public.talent_documents d
  WHERE d.id=p_document_id
    AND (
      d.person_id=v_person_id
      OR EXISTS(SELECT 1 FROM public.talent_applications a WHERE a.id=d.application_id AND (a.applicant_user_id=p_user_id OR a.person_id=v_person_id))
      OR EXISTS(SELECT 1 FROM public.talent_document_access_grants g WHERE g.document_id=d.id AND g.grantee_user_id=p_user_id AND g.revoked_at IS NULL AND g.expires_at>now())
    );
END;
$$;
REVOKE ALL ON FUNCTION api.talent_document_access_context(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION api.talent_document_access_context(uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION api.talent_record_document_access(p_document_id uuid,p_user_id uuid,p_action text,p_request_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=''
AS $$
BEGIN
  IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'SERVICE_ROLE_REQUIRED' USING ERRCODE='42501'; END IF;
  IF p_action NOT IN ('view','download','denied') THEN RAISE EXCEPTION 'INVALID_DOCUMENT_ACTION'; END IF;
  INSERT INTO public.talent_document_access_events(document_id,actor_user_id,action,request_id)
  VALUES(p_document_id,p_user_id,p_action,p_request_id);
  INSERT INTO public.talent_audit_events(event_type,actor_user_id,subject_type,subject_id,request_id,reason_code)
  VALUES('talent_document_'||p_action,p_user_id,'document',p_document_id,p_request_id,'DOCUMENT_ACCESS');
END;
$$;
REVOKE ALL ON FUNCTION api.talent_record_document_access(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION api.talent_record_document_access(uuid,uuid,text,text) TO service_role;

-- Search projections remain synchronously protected by source-table privacy and
-- employer blocks. Async projection state is observability metadata only.
CREATE INDEX IF NOT EXISTS idx_talent_search_projection_state_status ON public.talent_search_projection_state(entity_type,state,invalidated_at);
CREATE INDEX IF NOT EXISTS idx_talent_ingestion_runs_source_status ON public.talent_ingestion_runs(source_id,status,started_at DESC);
CREATE INDEX IF NOT EXISTS idx_talent_notifications_status ON public.talent_notifications(status,created_at);

COMMIT;
