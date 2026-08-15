BEGIN;

-- P0 contract hardening after canonical tables exist: TAL-017,020..022,041,
-- 043,060,071,081. This migration tightens employer verification and makes
-- the entitlement check explicit before candidate retrieval.

CREATE OR REPLACE FUNCTION public.talent_has_entitlement(
  p_workspace_id uuid,
  p_capability text,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.talent_is_platform_staff(p_user_id)
  OR EXISTS (
    SELECT 1 FROM public.talent_entitlement_grants eg
    WHERE eg.workspace_id = p_workspace_id
      AND (eg.user_id IS NULL OR eg.user_id = p_user_id)
      AND eg.capability_key = p_capability
      AND eg.status = 'active'
      AND (eg.expires_at IS NULL OR eg.expires_at > now())
  )
  OR EXISTS (
    SELECT 1 FROM public.talent_hiring_team_members tm
    WHERE tm.workspace_id = p_workspace_id
      AND tm.user_id = p_user_id
      AND tm.status = 'active'
      AND (tm.expires_at IS NULL OR tm.expires_at > now())
      AND (
        tm.talent_role = 'talent_admin'
        OR (p_capability = 'talent.people.search' AND tm.talent_role IN ('recruiter','hiring_manager','talent_viewer'))
        OR (p_capability = 'talent.people.identity_reveal' AND tm.talent_role IN ('recruiter','hiring_manager'))
        OR (p_capability = 'talent.people.contact' AND tm.talent_role IN ('recruiter','hiring_manager'))
        OR (p_capability = 'talent.requisitions.manage' AND tm.talent_role IN ('recruiter','hiring_manager'))
        OR (p_capability = 'talent.hiring.manage' AND tm.talent_role IN ('recruiter','hiring_manager'))
      )
  );
$$;
REVOKE ALL ON FUNCTION public.talent_has_entitlement(uuid,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.talent_has_entitlement(uuid,text,uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.talent_can_search_people(p_workspace_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.talent_is_platform_staff(p_user_id)
  OR (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      JOIN public.workspaces w ON w.id = wm.workspace_id
      WHERE wm.workspace_id = p_workspace_id
        AND wm.user_id = p_user_id
        AND wm.status = 'active'
        AND w.status = 'active'
        AND w.verification_status = 'verified'
    )
    AND public.talent_has_entitlement(p_workspace_id, 'talent.people.search', p_user_id)
  )
  OR EXISTS (
    SELECT 1
    FROM public.talent_agency_engagements ae
    JOIN public.workspaces employer ON employer.id = ae.employer_workspace_id
    JOIN public.workspace_members awm ON awm.workspace_id = ae.agency_workspace_id AND awm.user_id = p_user_id AND awm.status = 'active'
    JOIN public.talent_recruiter_authorizations ra ON ra.workspace_id = ae.agency_workspace_id AND ra.recruiter_user_id = p_user_id AND ra.status = 'active'
    WHERE ae.employer_workspace_id = p_workspace_id
      AND ae.status = 'active'
      AND (ae.expires_at IS NULL OR ae.expires_at > now())
      AND (ra.expires_at IS NULL OR ra.expires_at > now())
      AND employer.status = 'active'
      AND employer.verification_status = 'verified'
      AND public.talent_has_entitlement(ae.agency_workspace_id, 'talent.people.search', p_user_id)
  );
$$;
REVOKE ALL ON FUNCTION public.talent_can_search_people(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.talent_can_search_people(uuid,uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION api.talent_search_people(
  p_workspace_id uuid,
  p_query text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_limit integer DEFAULT 24,
  p_cursor_person_id uuid DEFAULT NULL
)
RETURNS TABLE(
  person_id uuid, display_name text, headline text, country_iso2 text,
  availability_state text, visibility_mode text, disclosure_level integer,
  capability_labels text[], credential_labels text[], language_labels text[],
  verification_summary text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.talent_can_search_people(p_workspace_id, auth.uid()) THEN
    RAISE EXCEPTION 'TALENT_SEARCH_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    p.person_id,
    CASE WHEN v.visibility_mode = 'public' OR coalesce(g.disclosure_level,0) >= 2 THEN tp.display_name ELSE NULL END,
    p.headline,
    p.country_iso2,
    av.availability_state,
    v.visibility_mode,
    greatest(v.identity_disclosure_level, coalesce(g.disclosure_level,0)),
    CASE
      WHEN EXISTS (SELECT 1 FROM public.talent_professional_capabilities c WHERE c.person_id=p.person_id)
      THEN coalesce((SELECT array_agg(c.capability_label ORDER BY c.capability_label) FROM public.talent_professional_capabilities c WHERE c.person_id=p.person_id),ARRAY[]::text[])
      ELSE p.legacy_specialties
    END,
    CASE
      WHEN EXISTS (SELECT 1 FROM public.talent_professional_credentials c WHERE c.person_id=p.person_id AND c.lifecycle_status NOT IN ('revoked','suspended'))
      THEN coalesce((SELECT array_agg(c.credential_label ORDER BY c.credential_label) FROM public.talent_professional_credentials c WHERE c.person_id=p.person_id AND c.lifecycle_status NOT IN ('revoked','suspended')),ARRAY[]::text[])
      WHEN p.legacy_credential_type IS NOT NULL THEN ARRAY[p.legacy_credential_type]
      ELSE ARRAY[]::text[]
    END,
    CASE
      WHEN EXISTS (SELECT 1 FROM public.talent_professional_languages l WHERE l.person_id=p.person_id)
      THEN coalesce((SELECT array_agg(l.language_label ORDER BY l.language_label) FROM public.talent_professional_languages l WHERE l.person_id=p.person_id),ARRAY[]::text[])
      ELSE p.legacy_languages
    END,
    CASE
      WHEN p.legacy_verification_status='verified' THEN 'Harbourview-reviewed directory record; credential validity remains separately evaluated'
      ELSE 'Claims require review'
    END
  FROM public.talent_professional_profiles p
  JOIN public.talent_people tp ON tp.id=p.person_id
  JOIN public.talent_profile_visibility v ON v.person_id=p.person_id
  LEFT JOIN public.talent_professional_availability av ON av.person_id=p.person_id
  LEFT JOIN LATERAL (
    SELECT max(dg.disclosure_level)::integer AS disclosure_level
    FROM public.talent_disclosure_grants dg
    WHERE dg.person_id=p.person_id AND dg.workspace_id=p_workspace_id
      AND dg.status='active' AND (dg.expires_at IS NULL OR dg.expires_at>now())
  ) g ON true
  LEFT JOIN public.talent_person_search_documents sd ON sd.person_id=p.person_id
  WHERE p.profile_status='active'
    AND v.search_enabled=true
    AND v.visibility_mode IN ('anonymous_discoverable','verified_employers','public')
    AND (p_cursor_person_id IS NULL OR p.person_id>p_cursor_person_id)
    AND (p_country IS NULL OR p.country_iso2=upper(p_country) OR EXISTS (SELECT 1 FROM unnest(p.legacy_countries) country_value WHERE upper(country_value)=upper(p_country)))
    AND (p_query IS NULL OR trim(p_query)='' OR to_tsvector('simple',coalesce(sd.search_text,concat_ws(' ',p.headline,p.summary,array_to_string(p.legacy_specialties,' '),p.legacy_credential_type))) @@ plainto_tsquery('simple',p_query))
    AND NOT EXISTS (
      SELECT 1 FROM public.talent_employer_blocks b
      WHERE b.person_id=p.person_id
        AND (
          b.workspace_id=p_workspace_id
          OR (b.include_verified_affiliates=true AND EXISTS (
            SELECT 1 FROM public.talent_organization_relationships r
            WHERE (r.from_workspace_id=b.workspace_id AND r.to_workspace_id=p_workspace_id)
               OR (r.to_workspace_id=b.workspace_id AND r.from_workspace_id=p_workspace_id)
          ))
        )
    )
  ORDER BY p.person_id
  LIMIT greatest(1,least(p_limit,50));
END;
$$;
REVOKE ALL ON FUNCTION api.talent_search_people(uuid,text,text,integer,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION api.talent_search_people(uuid,text,text,integer,uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION api.talent_submit_application_v2(
  p_job_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_resume_url text,
  p_cover_note text,
  p_idempotency_key text,
  p_consent_policy_version text DEFAULT 'talent-applications-v1',
  p_applicant_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_application_id uuid; v_person_id uuid;
BEGIN
  IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'SERVICE_ROLE_REQUIRED' USING ERRCODE='42501'; END IF;
  v_application_id := api.talent_submit_application(p_job_id,p_name,p_email,p_phone,p_resume_url,p_cover_note,p_idempotency_key,p_consent_policy_version);
  IF p_applicant_user_id IS NOT NULL THEN
    SELECT pa.person_id INTO v_person_id FROM public.talent_person_accounts pa WHERE pa.user_id=p_applicant_user_id AND pa.revoked_at IS NULL LIMIT 1;
    UPDATE public.talent_applications
    SET applicant_user_id=p_applicant_user_id, person_id=coalesce(v_person_id,person_id), updated_at=now()
    WHERE id=v_application_id AND (applicant_user_id IS NULL OR applicant_user_id=p_applicant_user_id);
    IF v_person_id IS NOT NULL THEN
      INSERT INTO public.talent_consents(person_id,purpose,policy_version,status,granted_at,source)
      VALUES(v_person_id,'application_processing',p_consent_policy_version,'granted',now(),'application_submit')
      ON CONFLICT(person_id,purpose,policy_version) DO UPDATE SET status='granted',granted_at=coalesce(public.talent_consents.granted_at,now()),revoked_at=NULL;
    END IF;
  END IF;
  RETURN v_application_id;
END;
$$;
REVOKE ALL ON FUNCTION api.talent_submit_application_v2(uuid,text,text,text,text,text,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION api.talent_submit_application_v2(uuid,text,text,text,text,text,text,text,uuid) TO service_role;

COMMIT;
