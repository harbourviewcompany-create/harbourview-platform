-- Gemini multi-key rotation, cooldown-aware selection, and local
-- centroid classifier gate.
--
-- Built 2026-08-20 through 2026-08-31 in response to OpenAI and
-- Anthropic both being billing-blocked (OpenAI ran out ~Aug 7,
-- Anthropic/Gemini deliberately left unfunded since 2026-07-21 per
-- Tyler pending the product making money). A free-tier Gemini key
-- was added and wired in as the working fallback tier across every
-- LLM-dependent pipeline; a second free-tier key was added shortly
-- after to roughly double effective daily headroom.
--
-- NOTE: the actual key VALUES were added directly via Vault
-- (vault.create_secret / vault.update_secret) out of band -- never
-- committed to git. Re-running this migration on a fresh environment
-- creates the correct structure, but gemini_api_key and
-- gemini_api_key_b must be populated in Vault separately before
-- anything Gemini-dependent will actually work.

CREATE OR REPLACE FUNCTION public.hv_get_gemini_key()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'vault'
AS $function$
declare
  v_pick smallint;
  v_key_a text;
  v_key_b text;
  v_a_cooling boolean;
  v_b_cooling boolean;
begin
  select decrypted_secret into v_key_a from vault.decrypted_secrets where name = 'gemini_api_key';
  select decrypted_secret into v_key_b from vault.decrypted_secrets where name = 'gemini_api_key_b';

  if v_key_b is null then return v_key_a; end if;
  if v_key_a is null then return v_key_b; end if;

  select (cooldown_until > now()) into v_a_cooling from public.hv_gemini_key_cooldown where key_name = 'gemini_api_key';
  select (cooldown_until > now()) into v_b_cooling from public.hv_gemini_key_cooldown where key_name = 'gemini_api_key_b';

  -- If exactly one key is in cooldown, skip it outright -- no reason to
  -- round-robin into a key we already know just failed.
  if coalesce(v_a_cooling,false) and not coalesce(v_b_cooling,false) then return v_key_b; end if;
  if coalesce(v_b_cooling,false) and not coalesce(v_a_cooling,false) then return v_key_a; end if;

  -- Both healthy, or both cooling (nothing better to do) -- plain rotation.
  update public.hv_gemini_key_rotation
    set next_key = case when next_key = 1 then 2 else 1 end
  where id = 1
  returning next_key into v_pick;

  return case when v_pick = 1 then v_key_a else v_key_b end;
end;
$function$
;

create table if not exists public.hv_gemini_key_rotation (
  id int primary key default 1,
  next_key smallint not null default 1,
  check (id = 1)
);
insert into public.hv_gemini_key_rotation (id, next_key) values (1, 1) on conflict (id) do nothing;

create table if not exists public.hv_gemini_key_cooldown (
  key_name text primary key,
  cooldown_until timestamptz
);

CREATE OR REPLACE FUNCTION public.hv_report_gemini_failure(p_key text, p_seconds integer DEFAULT 90)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare v_name text;
begin
  select case when decrypted_secret = p_key then name end into v_name
  from vault.decrypted_secrets where name in ('gemini_api_key','gemini_api_key_b') and decrypted_secret = p_key;

  if v_name is null then return; end if;

  insert into public.hv_gemini_key_cooldown (key_name, cooldown_until)
  values (v_name, now() + make_interval(secs => p_seconds))
  on conflict (key_name) do update set cooldown_until = excluded.cooldown_until;
end;
$function$
;
revoke all on function public.hv_report_gemini_failure(text,int) from public, anon, authenticated;
grant execute on function public.hv_report_gemini_failure(text,int) to service_role;

CREATE OR REPLACE FUNCTION public.hv_get_gemini_keys_ordered()
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'vault'
AS $function$
declare
  v_first text;
  v_key_a text;
  v_key_b text;
begin
  select decrypted_secret into v_key_a from vault.decrypted_secrets where name = 'gemini_api_key';
  select decrypted_secret into v_key_b from vault.decrypted_secrets where name = 'gemini_api_key_b';
  v_first := public.hv_get_gemini_key();

  if v_key_b is null then return array[v_key_a]; end if;
  if v_key_a is null then return array[v_key_b]; end if;

  if v_first = v_key_a then return array[v_key_a, v_key_b];
  else return array[v_key_b, v_key_a];
  end if;
end;
$function$
;
revoke all on function public.hv_get_gemini_keys_ordered() from public, anon, authenticated;
grant execute on function public.hv_get_gemini_keys_ordered() to service_role;

CREATE OR REPLACE FUNCTION public.hv_get_llm_keys()
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'vault'
AS $function$
  select jsonb_build_object(
    'anthropic_api_key', (select decrypted_secret from vault.decrypted_secrets where name = 'anthropic_api_key'),
    'openai_api_key',    (select decrypted_secret from vault.decrypted_secrets where name = 'openai_api_key'),
    'gemini_api_key',    public.hv_get_gemini_key(),
    'gemini_api_keys',   to_jsonb(public.hv_get_gemini_keys_ordered())
  );
$function$
;
revoke all on function public.hv_get_llm_keys() from public, anon, authenticated;
grant execute on function public.hv_get_llm_keys() to service_role;
