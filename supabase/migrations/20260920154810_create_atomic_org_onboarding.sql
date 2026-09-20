begin;

create or replace function api.create_workspace_for_user(
  p_user_id uuid,
  p_legal_name text,
  p_trade_name text,
  p_org_type text,
  p_jurisdiction_country text,
  p_jurisdiction_region text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_workspace public.workspaces%rowtype;
  v_now timestamptz := now();
  v_legal text := trim(coalesce(p_legal_name, ''));
  v_trade text := nullif(trim(coalesce(p_trade_name, '')), '');
  v_country text := upper(trim(coalesce(p_jurisdiction_country, '')));
  v_region text := nullif(trim(coalesce(p_jurisdiction_region, '')), '');
  v_slug_base text;
  v_slug text;
begin
  if p_user_id is null then
    raise exception using errcode = '22023', message = 'USER_REQUIRED';
  end if;

  if v_legal = '' then
    raise exception using errcode = '22023', message = 'LEGAL_NAME_REQUIRED';
  end if;

  if v_country !~ '^[A-Z]{2}$' then
    raise exception using errcode = '22023', message = 'COUNTRY_CODE_INVALID';
  end if;

  if p_org_type is null or p_org_type not in (
    'supplier','buyer','broker','lab','pharmacy','clinic','equipment',
    'service','financial','distributor','exporter','importer'
  ) then
    raise exception using errcode = '22023', message = 'ORG_TYPE_INVALID';
  end if;

  v_slug_base := lower(regexp_replace(coalesce(v_trade, v_legal), '[^a-zA-Z0-9\s-]', '', 'g'));
  v_slug_base := regexp_replace(v_slug_base, '\s+', '-', 'g');
  v_slug_base := regexp_replace(v_slug_base, '-+', '-', 'g');
  v_slug_base := trim(both '-' from v_slug_base);
  v_slug_base := left(coalesce(nullif(v_slug_base, ''), 'organization'), 48);
  v_slug := v_slug_base || '-' || substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 8);

  insert into public.workspaces (
    name, slug, legal_name, trade_name, org_type,
    jurisdiction_country, jurisdiction_region,
    verification_status, is_public, settings, status
  )
  values (
    coalesce(v_trade, v_legal), v_slug, v_legal, v_trade, p_org_type,
    v_country, v_region, 'unverified', false, '{}'::jsonb, 'active'
  )
  returning * into v_workspace;

  insert into public.workspace_members (
    workspace_id, user_id, role, status, invited_at, joined_at
  )
  values (v_workspace.id, p_user_id, 'admin', 'active', v_now, v_now);

  insert into public.hv_passports (
    org_id, verification_level, completeness_band,
    recall_exposure_flag, public_snapshot
  )
  values (
    v_workspace.id, 'none', 'incomplete', false,
    jsonb_build_object(
      'legal_name', v_legal,
      'trade_name', v_trade,
      'org_type', p_org_type,
      'jurisdiction_country', v_country,
      'jurisdiction_region', v_region,
      'created_via', 'org.create'
    )
  )
  on conflict (org_id) do update set
    public_snapshot = excluded.public_snapshot,
    updated_at = v_now;

  insert into public.user_dashboard_preferences (
    user_id, active_workspace_id, updated_at
  )
  values (p_user_id, v_workspace.id, v_now)
  on conflict (user_id) do update set
    active_workspace_id = excluded.active_workspace_id,
    updated_at = excluded.updated_at;

  begin
    insert into public.audit_events (
      entity_type, entity_id, action, actor,
      actor_user_id, actor_org_id, metadata
    )
    values (
      'workspace', v_workspace.id, 'org.created', p_user_id::text,
      p_user_id, v_workspace.id,
      jsonb_build_object(
        'org_type', p_org_type,
        'jurisdiction_country', v_country,
        'passport', true,
        'active_context', true
      )
    );
  exception when others then
    null;
  end;

  return jsonb_build_object(
    'org_id', v_workspace.id,
    'slug', v_workspace.slug,
    'name', v_workspace.name,
    'legal_name', v_workspace.legal_name,
    'trade_name', v_workspace.trade_name,
    'org_type', v_workspace.org_type,
    'jurisdiction_country', v_workspace.jurisdiction_country,
    'jurisdiction_region', v_workspace.jurisdiction_region,
    'verification_status', v_workspace.verification_status,
    'status', v_workspace.status,
    'active_workspace_id', v_workspace.id,
    'role', 'admin',
    'passport', true,
    'profile_bound', true
  );
end;
$$;

revoke all on function api.create_workspace_for_user(uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function api.create_workspace_for_user(uuid, text, text, text, text, text) to service_role;

commit;
