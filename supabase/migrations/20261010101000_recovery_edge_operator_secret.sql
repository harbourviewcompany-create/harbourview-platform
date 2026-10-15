-- Recovery-only operator authentication for runtime Edge Functions.
create extension if not exists pgcrypto with schema extensions;

do $recovery_secret$
begin
  if not exists (
    select 1 from vault.decrypted_secrets
    where name='harbourview_edge_operator_secret'
  ) then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32),'hex'),
      'harbourview_edge_operator_secret',
      'Recovery Edge Function operator secret',
      null
    );
  end if;
end
$recovery_secret$;

create or replace function public.verify_harbourview_edge_operator_secret(candidate text)
returns boolean
language sql
security definer
set search_path = public, vault, extensions
as $$
  select coalesce(
    extensions.digest(coalesce(candidate,''),'sha256') =
    extensions.digest(coalesce((
      select decrypted_secret
      from vault.decrypted_secrets
      where name='harbourview_edge_operator_secret'
      limit 1
    ),''),'sha256'),
    false
  );
$$;

revoke all on function public.verify_harbourview_edge_operator_secret(text) from public, anon, authenticated;
grant execute on function public.verify_harbourview_edge_operator_secret(text) to service_role;