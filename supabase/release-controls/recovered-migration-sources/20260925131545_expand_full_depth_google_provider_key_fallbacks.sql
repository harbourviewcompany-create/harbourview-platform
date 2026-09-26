-- HISTORICAL RECOVERY ARTIFACT
-- Production migration version: 20260925131545
-- Recovered verbatim from production supabase_migrations.schema_migrations.statements.
-- DO NOT REPLAY: archival source only.


create or replace function public.get_full_depth_provider_secret(provider text)
returns text language sql security definer set search_path=public,vault
as $$
  select case lower(provider)
    when 'google' then coalesce(
      (select decrypted_secret from vault.decrypted_secrets where name='gemini_api_key_b' limit 1),
      (select decrypted_secret from vault.decrypted_secrets where name='gemini_api_key' limit 1),
      (select decrypted_secret from vault.decrypted_secrets where name='hv_gemini_embed_key' limit 1)
    )
    when 'anthropic' then (select decrypted_secret from vault.decrypted_secrets where name='anthropic_api_key' limit 1)
    when 'openai' then (select decrypted_secret from vault.decrypted_secrets where name='openai_api_key' limit 1)
    else null
  end
$$;
revoke all on function public.get_full_depth_provider_secret(text) from public,anon,authenticated;
grant execute on function public.get_full_depth_provider_secret(text) to service_role;

