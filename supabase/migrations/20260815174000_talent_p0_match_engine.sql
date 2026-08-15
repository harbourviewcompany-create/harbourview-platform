BEGIN;

-- Harbourview Talent P0 deterministic baseline matching: TAL-065..068.
INSERT INTO public.talent_match_policy_versions(policy_key,version_number,status,factor_config)
VALUES('talent-p0-baseline',1,'active',jsonb_build_object(
  'principle','hard eligibility separated from ranking; absence of evidence is unresolved',
  'factorClasses',jsonb_build_array('hard_eligibility','required_capability','preferred_capability','context')
))
ON CONFLICT(policy_key,version_number) DO UPDATE SET status='active';

CREATE OR REPLACE FUNCTION api.talent_generate_match(p_job_id uuid,p_person_id uuid,p_workspace_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid(); v_owner_person_id uuid; v_policy_id uuid; v_req_version_id uuid; v_taxonomy_version_id uuid;
  v_run_id uuid; v_match_id uuid; v_passport_hash text; v_credential_hash text; v_overall text := 'satisfied';
  v_unresolved integer := 0; v_required integer := 0; v_satisfied integer := 0; r record; v_state text; v_reason text;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
  v_owner_person_id := public.talent_person_for_user(v_user_id);
  IF v_owner_person_id IS DISTINCT FROM p_person_id AND (p_workspace_id IS NULL OR NOT public.talent_can_search_people(p_workspace_id,v_user_id)) THEN
    RAISE EXCEPTION 'MATCH_FORBIDDEN' USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.talent_job_opportunities j WHERE j.id=p_job_id AND j.lifecycle_status='open' AND j.publication_state='published') THEN
    RAISE EXCEPTION 'JOB_NOT_AVAILABLE' USING ERRCODE='P0002';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.talent_people p WHERE p.id=p_person_id) THEN RAISE EXCEPTION 'PERSON_NOT_FOUND' USING ERRCODE='P0002'; END IF;

  SELECT id INTO v_policy_id FROM public.talent_match_policy_versions WHERE policy_key='talent-p0-baseline' AND status='active' ORDER BY version_number DESC LIMIT 1;
  SELECT id INTO v_req_version_id FROM public.talent_job_requirement_versions WHERE job_id=p_job_id ORDER BY version_number DESC LIMIT 1;
  SELECT id INTO v_taxonomy_version_id FROM public.talent_taxonomy_versions WHERE status='active' ORDER BY published_at DESC NULLS LAST,created_at DESC LIMIT 1;

  SELECT md5(coalesce(row_to_json(x)::text,'{}')) INTO v_passport_hash FROM (
    SELECT p.headline,p.summary,p.country_iso2,p.region_code,p.locality,v.visibility_mode,v.search_enabled,av.availability_state,
      (SELECT jsonb_agg(jsonb_build_object('term',c.capability_term_id,'label',c.capability_label,'state',c.verification_state) ORDER BY c.id) FROM public.talent_professional_capabilities c WHERE c.person_id=p_person_id) capabilities
    FROM public.talent_professional_profiles p
    LEFT JOIN public.talent_profile_visibility v ON v.person_id=p.person_id
    LEFT JOIN public.talent_professional_availability av ON av.person_id=p.person_id
    WHERE p.person_id=p_person_id
  ) x;
  SELECT md5(coalesce(jsonb_agg(jsonb_build_object('id',c.id,'term',c.credential_term_id,'status',c.lifecycle_status,'expires',c.expires_on) ORDER BY c.id)::text,'[]'))
  INTO v_credential_hash FROM public.talent_professional_credentials c WHERE c.person_id=p_person_id;

  INSERT INTO public.talent_match_runs(policy_version_id,job_id,person_id,job_requirement_version_id,taxonomy_version_id,passport_snapshot_hash,credential_snapshot_hash,input_snapshot)
  VALUES(v_policy_id,p_job_id,p_person_id,v_req_version_id,v_taxonomy_version_id,coalesce(v_passport_hash,md5('{}')),coalesce(v_credential_hash,md5('[]')),jsonb_build_object('jobId',p_job_id,'personId',p_person_id,'requirementVersionId',v_req_version_id,'taxonomyVersionId',v_taxonomy_version_id))
  RETURNING id INTO v_run_id;
  INSERT INTO public.talent_matches(run_id,eligibility_state,score,explanation_summary) VALUES(v_run_id,'satisfied',NULL,'Evaluation in progress') RETURNING id INTO v_match_id;

  IF v_req_version_id IS NULL THEN
    v_overall := 'unresolved'; v_unresolved := 1;
    INSERT INTO public.talent_match_factors(match_id,factor_key,factor_class,result_state,reason)
    VALUES(v_match_id,'requirements','hard_eligibility','unresolved','No structured requirement version exists for this job; Harbourview does not infer qualification from job prose.');
  ELSE
    FOR r IN SELECT * FROM public.talent_job_requirements WHERE requirement_version_id=v_req_version_id ORDER BY sort_order,id LOOP
      IF r.importance='required' THEN v_required := v_required+1; END IF;
      v_state := 'unresolved'; v_reason := 'No sufficient structured evidence is available.';
      IF r.requirement_type='capability' AND r.taxonomy_term_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.talent_professional_capabilities c WHERE c.person_id=p_person_id AND c.capability_term_id=r.taxonomy_term_id AND (c.valid_to IS NULL OR c.valid_to>=current_date)) THEN v_state:='satisfied'; v_reason:='Passport contains the required structured capability.'; END IF;
      ELSIF r.requirement_type='credential' AND r.taxonomy_term_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.talent_professional_credentials c WHERE c.person_id=p_person_id AND c.credential_term_id=r.taxonomy_term_id AND c.lifecycle_status='active_verified' AND (c.expires_on IS NULL OR c.expires_on>=current_date)) THEN
          v_state:='satisfied'; v_reason:='Passport contains a currently active verified credential matching the requirement.';
        ELSIF EXISTS (SELECT 1 FROM public.talent_professional_credentials c WHERE c.person_id=p_person_id AND c.credential_term_id=r.taxonomy_term_id AND c.lifecycle_status IN ('expired','suspended','revoked')) THEN
          v_state:=CASE WHEN r.hard_gate THEN 'not_satisfied' ELSE 'unresolved' END; v_reason:='A matching credential exists but its current lifecycle state does not satisfy an active requirement.';
        END IF;
      ELSIF r.requirement_type='language' THEN
        IF EXISTS (SELECT 1 FROM public.talent_professional_languages l WHERE l.person_id=p_person_id AND (r.structured_value->>'languageCode' IS NULL OR lower(l.language_code)=lower(r.structured_value->>'languageCode'))) THEN v_state:='satisfied'; v_reason:='Passport contains the required language claim.'; END IF;
      ELSIF r.requirement_type='work_authorization' THEN
        IF EXISTS (SELECT 1 FROM public.talent_work_authorizations wa WHERE wa.person_id=p_person_id AND upper(wa.country_iso2)=upper(coalesce(r.structured_value->>'countryIso2','')) AND (wa.valid_to IS NULL OR wa.valid_to>=current_date)) THEN v_state:='satisfied'; v_reason:='Passport contains a current work-authorization claim for the required jurisdiction.'; END IF;
      ELSIF r.requirement_type='jurisdiction_experience' THEN
        IF EXISTS (SELECT 1 FROM public.talent_professional_jurisdictions jx WHERE jx.person_id=p_person_id AND upper(jx.country_iso2)=upper(coalesce(r.structured_value->>'countryIso2',''))) THEN v_state:='satisfied'; v_reason:='Passport contains jurisdiction experience matching the requirement.'; END IF;
      END IF;
      IF v_state='satisfied' AND r.importance='required' THEN v_satisfied:=v_satisfied+1; END IF;
      IF v_state='unresolved' THEN v_unresolved:=v_unresolved+1; END IF;
      IF v_state='not_satisfied' AND r.hard_gate THEN v_overall:='not_satisfied'; ELSIF v_state='unresolved' AND v_overall<>'not_satisfied' THEN v_overall:='unresolved'; END IF;
      INSERT INTO public.talent_match_factors(match_id,factor_key,factor_class,result_state,weight,reason,input_value)
      VALUES(v_match_id,'requirement:'||r.id::text,CASE WHEN r.hard_gate THEN 'hard_eligibility' WHEN r.importance='required' THEN 'required_capability' ELSE 'preferred_capability' END,v_state,CASE WHEN r.importance='required' THEN 1 ELSE 0.5 END,v_reason,jsonb_build_object('requirementType',r.requirement_type,'importance',r.importance,'text',r.requirement_text,'taxonomyTermId',r.taxonomy_term_id));
    END LOOP;
  END IF;

  UPDATE public.talent_matches SET eligibility_state=v_overall,
    score=CASE WHEN v_required>0 THEN round((v_satisfied::numeric/v_required::numeric)*100,2) ELSE NULL END,
    explanation_summary=CASE WHEN v_req_version_id IS NULL THEN 'No structured requirements are available; match remains unresolved.' ELSE format('%s of %s required structured factors satisfied; %s factor(s) unresolved.',v_satisfied,v_required,v_unresolved) END
  WHERE id=v_match_id;

  RETURN (SELECT jsonb_build_object('matchId',m.id,'runId',v_run_id,'eligibilityState',m.eligibility_state,'score',m.score,'summary',m.explanation_summary,'policyVersionId',v_policy_id,'requirementVersionId',v_req_version_id,'taxonomyVersionId',v_taxonomy_version_id,'factors',coalesce((SELECT jsonb_agg(jsonb_build_object('key',f.factor_key,'class',f.factor_class,'state',f.result_state,'reason',f.reason) ORDER BY f.id) FROM public.talent_match_factors f WHERE f.match_id=m.id),'[]'::jsonb)) FROM public.talent_matches m WHERE m.id=v_match_id);
END;
$$;
REVOKE ALL ON FUNCTION api.talent_generate_match(uuid,uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION api.talent_generate_match(uuid,uuid,uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.talent_invalidate_matches_for_requirement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_req_version_id uuid; v_job_id uuid; BEGIN
  v_req_version_id := CASE WHEN TG_OP='DELETE' THEN OLD.requirement_version_id ELSE NEW.requirement_version_id END;
  SELECT rv.job_id INTO v_job_id FROM public.talent_job_requirement_versions rv WHERE rv.id=v_req_version_id;
  IF v_job_id IS NOT NULL THEN
    UPDATE public.talent_matches m SET stale_at=coalesce(m.stale_at,now()),invalidation_reason='job_or_requirement_changed'
    FROM public.talent_match_runs r WHERE r.id=m.run_id AND r.job_id=v_job_id AND m.stale_at IS NULL;
    INSERT INTO public.talent_match_invalidations(match_id,trigger_type,trigger_id,reason)
    SELECT m.id,'requirements',v_job_id,'Job requirement changed after match generation'
    FROM public.talent_matches m JOIN public.talent_match_runs r ON r.id=m.run_id
    WHERE r.job_id=v_job_id;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END; $$;
DROP TRIGGER IF EXISTS talent_requirements_invalidate_matches ON public.talent_job_requirements;
CREATE TRIGGER talent_requirements_invalidate_matches AFTER INSERT OR UPDATE OR DELETE ON public.talent_job_requirements FOR EACH ROW EXECUTE FUNCTION public.talent_invalidate_matches_for_requirement();

CREATE OR REPLACE FUNCTION public.talent_invalidate_matches_for_person()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_person_id uuid; v_trigger text := TG_ARGV[0]; BEGIN
  v_person_id := CASE WHEN TG_OP='DELETE' THEN OLD.person_id ELSE NEW.person_id END;
  UPDATE public.talent_matches m SET stale_at=coalesce(m.stale_at,now()),invalidation_reason=v_trigger
  FROM public.talent_match_runs r WHERE r.id=m.run_id AND r.person_id=v_person_id AND m.stale_at IS NULL;
  INSERT INTO public.talent_match_invalidations(match_id,trigger_type,trigger_id,reason)
  SELECT m.id,v_trigger,v_person_id,'Relevant Passport/credential/privacy state changed after match generation'
  FROM public.talent_matches m JOIN public.talent_match_runs r ON r.id=m.run_id WHERE r.person_id=v_person_id;
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END; $$;
DROP TRIGGER IF EXISTS talent_capabilities_invalidate_matches ON public.talent_professional_capabilities;
CREATE TRIGGER talent_capabilities_invalidate_matches AFTER INSERT OR UPDATE OR DELETE ON public.talent_professional_capabilities FOR EACH ROW EXECUTE FUNCTION public.talent_invalidate_matches_for_person('passport');
DROP TRIGGER IF EXISTS talent_credentials_invalidate_matches ON public.talent_professional_credentials;
CREATE TRIGGER talent_credentials_invalidate_matches AFTER INSERT OR UPDATE OR DELETE ON public.talent_professional_credentials FOR EACH ROW EXECUTE FUNCTION public.talent_invalidate_matches_for_person('credential');
DROP TRIGGER IF EXISTS talent_visibility_invalidate_matches ON public.talent_profile_visibility;
CREATE TRIGGER talent_visibility_invalidate_matches AFTER INSERT OR UPDATE OR DELETE ON public.talent_profile_visibility FOR EACH ROW EXECUTE FUNCTION public.talent_invalidate_matches_for_person('privacy');

COMMIT;
