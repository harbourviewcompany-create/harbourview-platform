-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260925131628
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create or replace function public.get_full_depth_google_provider_keys()
returns jsonb language sql security definer set search_path=public,vault
as $$
  select coalesce(jsonb_agg(decrypted_secret) filter(where decrypted_secret is not null and decrypted_secret<>''),'[]'::jsonb)
  from vault.decrypted_secrets
  where name in ('gemini_api_key_b','gemini_api_key','hv_gemini_embed_key')
$$;
revoke all on function public.get_full_depth_google_provider_keys() from public,anon,authenticated;
grant execute on function public.get_full_depth_google_provider_keys() to service_role;
