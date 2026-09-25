-- HISTORICAL RECOVERY ARTIFACT
-- Production migration version: 20260925131318
-- Recovered verbatim from production supabase_migrations.schema_migrations.statements.
-- DO NOT REPLAY: archival source only.


create or replace function public.get_full_depth_provider_secret(provider text)
returns text
language sql
security definer
set search_path=public,vault
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = case lower(provider)
    when 'google' then 'gemini_api_key'
    when 'anthropic' then 'anthropic_api_key'
    when 'openai' then 'openai_api_key'
    else '__invalid__'
  end
  limit 1
$$;
revoke all on function public.get_full_depth_provider_secret(text) from public,anon,authenticated;
grant execute on function public.get_full_depth_provider_secret(text) to service_role;

