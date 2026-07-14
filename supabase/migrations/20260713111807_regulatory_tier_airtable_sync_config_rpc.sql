create or replace function api.get_airtable_sync_config()
returns json
language sql
security definer
set search_path to ''
as $$
  select json_build_object(
    'sync_key', (select decrypted_secret from vault.decrypted_secrets where name = 'hv_airtable_sync_key'),
    'pat',      (select decrypted_secret from vault.decrypted_secrets where name = 'airtable_pat')
  );
$$;

comment on function api.get_airtable_sync_config() is
  'Returns internal sync key + Airtable PAT for the hv-airtable-tier-sync edge function. service_role only.';

revoke all on function api.get_airtable_sync_config() from public;
revoke all on function api.get_airtable_sync_config() from anon;
revoke all on function api.get_airtable_sync_config() from authenticated;
grant execute on function api.get_airtable_sync_config() to service_role;