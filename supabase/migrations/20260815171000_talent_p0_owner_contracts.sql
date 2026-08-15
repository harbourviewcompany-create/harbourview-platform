BEGIN;

-- Harbourview Talent P0 authenticated owner contracts: TAL-002, TAL-039,
-- TAL-047, TAL-051..055, TAL-069, TAL-071. Raw private tables remain dark.

DROP VIEW IF EXISTS api.talent_job_opportunities_public;
CREATE VIEW api.talent_job_opportunities_public
WITH (security_invoker = false)
AS
SELECT
  j.id, j.title, j.department, j.description,
  j.country_iso2, j.region_code, j.locality, j.location_text,
  j.employment_type, j.workplace_type, j.application_method, j.application_url,
  j.freshness_state, j.last_confirmed_at, j.published_at, j.expires_at,
  j.openings_total, j.openings_filled,
  w.id AS workspace_id,
  coalesce(w.trade_name, w.legal_name, w.name, j.employer_display_name) AS employer_name,
  w.verification_status AS employer_verification_status,
  j.created_at
FROM public.talent_job_opportunities j
JOIN public.workspaces w ON w.id = j.workspace_id
WHERE j.publication_state = 'published'
  AND j.lifecycle_status = 'open'
  AND j.freshness_state NOT IN ('removed','closed')
  AND w.is_public = true;
REVOKE ALL ON api.talent_job_opportunities_public FROM PUBLIC;
GRANT SELECT ON api.talent_job_opportunities_public TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION api.talent_ensure_my_person()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_person_id uuid;
  v_display_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
  END IF;

  SELECT pa.person_id INTO v_person_id
  FROM public.talent_person_accounts pa
  WHERE pa.user_id = v_user_id AND pa.revoked_at IS NULL
  LIMIT 1;
  IF FOUND THEN RETURN v_person_id; END IF;

  SELECT nullif(trim(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')), '')
  INTO v_display_name
  FROM auth.users u WHERE u.id = v_user_id;

  INSERT INTO public.talent_people(display_name, canonical_state)
  VALUES(v_display_name, 'claimed')
  RETURNING id INTO v_person_id;

  INSERT INTO public.talent_person_accounts(person_id, user_id, assurance_level)
  VALUES(v_person_id, v_user_id, 'account_verified');

  INSERT INTO public.talent_professional_profiles(person_id, profile_status)
  VALUES(v_person_id, 'active')
  ON CONFLICT (person_id) DO NOTHING;

  INSERT INTO public.talent_profile_visibility(person_id, visibility_mode, identity_disclosure_level, search_enabled)
  VALUES(v_person_id, 'private', 0, false)
  ON CONFLICT (person_id) DO NOTHING;

  INSERT INTO public.talent_professional_availability(person_id, availability_state, visible_to_employers)
  VALUES(v_person_id, 'undisclosed', false)
  ON CONFLICT (person_id) DO NOTHING;

  INSERT INTO public.talent_audit_events(event_type, actor_user_id, subject_type, subject_id, reason_code)
  VALUES('talent_person_claimed_from_account',v_user_id,'person',v_person_id,'AUTH_OWNER_BOOTSTRAP');

  RETURN v_person_id;
END;
$$;
REVOKE ALL ON FUNCTION api.talent_ensure_my_person() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION api.talent_ensure_my_person() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION api.talent_get_my_passport()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_person_id uuid;
  result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501'; END IF;
  v_person_id := public.talent_person_for_user(auth.uid());
  IF v_person_id IS NULL THEN RETURN jsonb_build_object('personId',NULL,'profile',NULL); END IF;

  SELECT jsonb_build_object(
    'personId', v_person_id,
    'displayName', tp.display_name,
    'profile', jsonb_build_object(
      'headline', p.headline, 'summary', p.summary, 'countryIso2', p.country_iso2,
      'regionCode', p.region_code, 'locality', p.locality, 'status', p.profile_status
    ),
    'visibility', jsonb_build_object(
      'mode', v.visibility_mode, 'disclosureLevel', v.identity_disclosure_level,
      'searchEnabled', v.search_enabled
    ),
    'availability', jsonb_build_object(
      'state', av.availability_state, 'availableFrom', av.available_from,
      'lastConfirmedAt', av.last_confirmed_at, 'visibleToEmployers', av.visible_to_employers
    ),
    'capabilities', coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'label',c.capability_label,'verificationState',c.verification_state) ORDER BY c.capability_label) FROM public.talent_professional_capabilities c WHERE c.person_id=v_person_id),'[]'::jsonb),
    'credentials', coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'label',c.credential_label,'status',c.lifecycle_status,'expiresOn',c.expires_on,'lastCheckedAt',c.last_checked_at) ORDER BY c.credential_label) FROM public.talent_professional_credentials c WHERE c.person_id=v_person_id),'[]'::jsonb),
    'languages', coalesce((SELECT jsonb_agg(jsonb_build_object('id',l.id,'label',l.language_label,'proficiency',l.proficiency,'verificationState',l.verification_state) ORDER BY l.language_label) FROM public.talent_professional_languages l WHERE l.person_id=v_person_id),'[]'::jsonb),
    'employerBlocks', coalesce((SELECT jsonb_agg(jsonb_build_object('id',b.id,'workspaceId',b.workspace_id,'includeVerifiedAffiliates',b.include_verified_affiliates,'createdAt',b.created_at) ORDER BY b.created_at DESC) FROM public.talent_employer_blocks b WHERE b.person_id=v_person_id),'[]'::jsonb),
    'consents', coalesce((SELECT jsonb_agg(jsonb_build_object('purpose',c.purpose,'policyVersion',c.policy_version,'status',c.status,'grantedAt',c.granted_at,'revokedAt',c.revoked_at) ORDER BY c.purpose) FROM public.talent_consents c WHERE c.person_id=v_person_id),'[]'::jsonb)
  ) INTO result
  FROM public.talent_people tp
  JOIN public.talent_professional_profiles p ON p.person_id=tp.id
  JOIN public.talent_profile_visibility v ON v.person_id=tp.id
  LEFT JOIN public.talent_professional_availability av ON av.person_id=tp.id
  WHERE tp.id=v_person_id;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION api.talent_get_my_passport() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION api.talent_get_my_passport() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION api.talent_patch_my_passport(p_patch jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_person_id uuid;
  v_headline text;
  v_summary text;
  v_country text;
  v_region text;
  v_locality text;
  v_availability text;
  v_available_from date;
BEGIN
  v_person_id := api.talent_ensure_my_person();
  v_headline := nullif(trim(p_patch->>'headline'),'');
  v_summary := nullif(trim(p_patch->>'summary'),'');
  v_country := nullif(upper(trim(p_patch->>'countryIso2')),'');
  v_region := nullif(upper(trim(p_patch->>'regionCode')),'');
  v_locality := nullif(trim(p_patch->>'locality'),'');
  v_availability := nullif(trim(p_patch->>'availabilityState'),'');
  IF p_patch ? 'availableFrom' AND nullif(p_patch->>'availableFrom','') IS NOT NULL THEN
    v_available_from := (p_patch->>'availableFrom')::date;
  END IF;

  UPDATE public.talent_professional_profiles p SET
    headline = CASE WHEN p_patch ? 'headline' THEN v_headline ELSE p.headline END,
    summary = CASE WHEN p_patch ? 'summary' THEN v_summary ELSE p.summary END,
    country_iso2 = CASE WHEN p_patch ? 'countryIso2' THEN v_country ELSE p.country_iso2 END,
    region_code = CASE WHEN p_patch ? 'regionCode' THEN v_region ELSE p.region_code END,
    locality = CASE WHEN p_patch ? 'locality' THEN v_locality ELSE p.locality END,
    updated_at = now()
  WHERE p.person_id=v_person_id;

  IF v_availability IS NOT NULL THEN
    IF v_availability NOT IN ('actively_looking','open_to_opportunities','contract_only','consulting_only','advisory_only','available_from_date','not_available','undisclosed') THEN
      RAISE EXCEPTION 'INVALID_AVAILABILITY';
    END IF;
    INSERT INTO public.talent_professional_availability(person_id,availability_state,available_from,last_confirmed_at,visible_to_employers,updated_at)
    VALUES(v_person_id,v_availability,v_available_from,now(),v_availability NOT IN ('not_available','undisclosed'),now())
    ON CONFLICT(person_id) DO UPDATE SET
      availability_state=EXCLUDED.availability_state,
      available_from=EXCLUDED.available_from,
      last_confirmed_at=now(),
      visible_to_employers=EXCLUDED.visible_to_employers,
      updated_at=now();
  END IF;

  INSERT INTO public.talent_audit_events(event_type,actor_user_id,subject_type,subject_id,reason_code,metadata)
  VALUES('talent_passport_updated',auth.uid(),'person',v_person_id,'OWNER_UPDATE',jsonb_build_object('fields',(SELECT jsonb_agg(key) FROM jsonb_object_keys(p_patch) key)));

  RETURN api.talent_get_my_passport();
END;
$$;
REVOKE ALL ON FUNCTION api.talent_patch_my_passport(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION api.talent_patch_my_passport(jsonb) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION api.talent_set_my_visibility(p_mode text, p_search_enabled boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_person_id uuid;
BEGIN
  IF p_mode NOT IN ('private','anonymous_discoverable','verified_employers','public') THEN RAISE EXCEPTION 'INVALID_VISIBILITY'; END IF;
  v_person_id := api.talent_ensure_my_person();
  INSERT INTO public.talent_profile_visibility(person_id,visibility_mode,identity_disclosure_level,search_enabled,updated_at)
  VALUES(v_person_id,p_mode,CASE WHEN p_mode='public' THEN 3 WHEN p_mode='private' THEN 0 ELSE 1 END,p_search_enabled AND p_mode<>'private',now())
  ON CONFLICT(person_id) DO UPDATE SET visibility_mode=EXCLUDED.visibility_mode, identity_disclosure_level=EXCLUDED.identity_disclosure_level, search_enabled=EXCLUDED.search_enabled, updated_at=now();

  INSERT INTO public.talent_search_projection_state(entity_type,entity_id,source_version,state,invalidated_at)
  VALUES('person',v_person_id,'visibility:'||extract(epoch from now())::text,CASE WHEN p_mode='private' THEN 'suppressed' ELSE 'pending' END,now())
  ON CONFLICT(entity_type,entity_id) DO UPDATE SET source_version=EXCLUDED.source_version,state=EXCLUDED.state,invalidated_at=now();

  INSERT INTO public.talent_audit_events(event_type,actor_user_id,subject_type,subject_id,reason_code,new_state)
  VALUES('talent_visibility_changed',auth.uid(),'person',v_person_id,'OWNER_UPDATE',jsonb_build_object('mode',p_mode,'searchEnabled',p_search_enabled));
  RETURN jsonb_build_object('personId',v_person_id,'mode',p_mode,'searchEnabled',p_search_enabled AND p_mode<>'private');
END;
$$;
REVOKE ALL ON FUNCTION api.talent_set_my_visibility(text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION api.talent_set_my_visibility(text,boolean) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION api.talent_add_my_employer_block(p_workspace_id uuid, p_include_affiliates boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_person_id uuid; v_id uuid;
BEGIN
  v_person_id := api.talent_ensure_my_person();
  IF NOT EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id=p_workspace_id) THEN RAISE EXCEPTION 'WORKSPACE_NOT_FOUND'; END IF;
  INSERT INTO public.talent_employer_blocks(person_id,workspace_id,include_verified_affiliates)
  VALUES(v_person_id,p_workspace_id,p_include_affiliates)
  ON CONFLICT(person_id,workspace_id) DO UPDATE SET include_verified_affiliates=EXCLUDED.include_verified_affiliates
  RETURNING id INTO v_id;
  INSERT INTO public.talent_search_projection_state(entity_type,entity_id,source_version,state,invalidated_at)
  VALUES('person',v_person_id,'block:'||extract(epoch from now())::text,'pending',now())
  ON CONFLICT(entity_type,entity_id) DO UPDATE SET source_version=EXCLUDED.source_version,state='pending',invalidated_at=now();
  INSERT INTO public.talent_audit_events(event_type,actor_user_id,subject_type,subject_id,reason_code,metadata)
  VALUES('talent_employer_block_changed',auth.uid(),'person',v_person_id,'OWNER_BLOCK',jsonb_build_object('workspaceId',p_workspace_id,'includeAffiliates',p_include_affiliates));
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION api.talent_add_my_employer_block(uuid,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION api.talent_add_my_employer_block(uuid,boolean) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION api.talent_remove_my_employer_block(p_block_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_person_id uuid;
BEGIN
  v_person_id := public.talent_person_for_user(auth.uid());
  IF v_person_id IS NULL THEN RETURN false; END IF;
  DELETE FROM public.talent_employer_blocks WHERE id=p_block_id AND person_id=v_person_id;
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO public.talent_search_projection_state(entity_type,entity_id,source_version,state,invalidated_at)
  VALUES('person',v_person_id,'block:'||extract(epoch from now())::text,'pending',now())
  ON CONFLICT(entity_type,entity_id) DO UPDATE SET source_version=EXCLUDED.source_version,state='pending',invalidated_at=now();
  INSERT INTO public.talent_audit_events(event_type,actor_user_id,subject_type,subject_id,reason_code)
  VALUES('talent_employer_block_changed',auth.uid(),'person',v_person_id,'OWNER_UNBLOCK');
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION api.talent_remove_my_employer_block(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION api.talent_remove_my_employer_block(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION api.talent_set_my_consent(p_purpose text, p_policy_version text, p_granted boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_person_id uuid; v_consent_id uuid; v_status text := CASE WHEN p_granted THEN 'granted' ELSE 'revoked' END;
BEGIN
  IF p_purpose NOT IN ('talent_discoverability','employer_contact','application_processing','matching','alert_delivery') THEN RAISE EXCEPTION 'INVALID_CONSENT_PURPOSE'; END IF;
  v_person_id := api.talent_ensure_my_person();
  INSERT INTO public.talent_consents(person_id,purpose,policy_version,status,granted_at,revoked_at,source)
  VALUES(v_person_id,p_purpose,p_policy_version,v_status,CASE WHEN p_granted THEN now() ELSE NULL END,CASE WHEN p_granted THEN NULL ELSE now() END,'user_action')
  ON CONFLICT(person_id,purpose,policy_version) DO UPDATE SET status=EXCLUDED.status,granted_at=EXCLUDED.granted_at,revoked_at=EXCLUDED.revoked_at
  RETURNING id INTO v_consent_id;
  INSERT INTO public.talent_consent_events(consent_id,action,actor_user_id) VALUES(v_consent_id,v_status,auth.uid());
  INSERT INTO public.talent_audit_events(event_type,actor_user_id,subject_type,subject_id,reason_code,metadata)
  VALUES('talent_consent_changed',auth.uid(),'person',v_person_id,'OWNER_CONSENT',jsonb_build_object('purpose',p_purpose,'policyVersion',p_policy_version,'status',v_status));
  RETURN jsonb_build_object('purpose',p_purpose,'policyVersion',p_policy_version,'status',v_status);
END;
$$;
REVOKE ALL ON FUNCTION api.talent_set_my_consent(text,text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION api.talent_set_my_consent(text,text,boolean) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION api.talent_save_job(p_job_id uuid, p_saved boolean DEFAULT true)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_person_id uuid;
BEGIN
  v_person_id := api.talent_ensure_my_person();
  IF NOT EXISTS (SELECT 1 FROM public.talent_job_opportunities j JOIN public.workspaces w ON w.id=j.workspace_id WHERE j.id=p_job_id AND j.publication_state='published' AND j.lifecycle_status='open' AND w.is_public=true) THEN
    RAISE EXCEPTION 'JOB_NOT_FOUND';
  END IF;
  IF p_saved THEN
    INSERT INTO public.talent_saved_jobs(person_id,job_id) VALUES(v_person_id,p_job_id) ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.talent_saved_jobs WHERE person_id=v_person_id AND job_id=p_job_id;
  END IF;
  RETURN p_saved;
END;
$$;
REVOKE ALL ON FUNCTION api.talent_save_job(uuid,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION api.talent_save_job(uuid,boolean) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION api.talent_my_applications()
RETURNS TABLE(id uuid, job_id uuid, title text, employer_name text, status text, submitted_at timestamptz, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT a.id,a.job_id,j.title,coalesce(w.trade_name,w.legal_name,w.name,j.employer_display_name),a.status,a.submitted_at,a.created_at
  FROM public.talent_applications a
  JOIN public.talent_job_opportunities j ON j.id=a.job_id
  LEFT JOIN public.workspaces w ON w.id=j.workspace_id
  WHERE a.applicant_user_id=auth.uid()
     OR (a.person_id IS NOT NULL AND a.person_id=public.talent_person_for_user(auth.uid()))
  ORDER BY a.created_at DESC;
$$;
REVOKE ALL ON FUNCTION api.talent_my_applications() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION api.talent_my_applications() TO authenticated, service_role;

COMMIT;
