-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260712070059.
--
-- Rewriting this file cannot affect production: 20260712070059 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Security fix: api.set_regulatory_tier and api.accept_classifier_tier were
-- SECURITY DEFINER functions with no internal authorization check, callable by
-- any `authenticated` role via PostgREST RPC. Any signed-in user could
-- arbitrarily override a country's compliance regulatory_tier classification.
-- Found via a live advisors scan (authenticated_security_definer_function_executable),
-- 2026-07-11.
--
-- Fix: admin-only guard, matching the existing is_genetics_admin_or_reviewer()
-- pattern in this schema (user_roles.role = 'admin', keyed on auth.uid()).
-- api.get_corridor_stats is intentionally left untouched -- it is read-only and
-- was already assessed as lower severity.

create or replace function public.is_regulatory_tier_admin()
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
  );
$$;

create or replace function api.accept_classifier_tier(p_iso text, p_actor text default 'agent'::text)
returns countries
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_old public.countries;
  v_row public.countries;
  v_ps  text;
  v_new text;
begin
  if not public.is_regulatory_tier_admin() then
    raise exception 'insufficient privileges: admin role required' using errcode = '42501';
  end if;

  select * into v_old from public.countries where iso_alpha2=p_iso;
  if not found then raise exception 'unknown country %', p_iso; end if;

  select program_status into v_ps from public.cc_jurisdiction_briefings
   where country_iso2=p_iso and jurisdiction_type='country';
  v_new := api.derive_regulatory_tier(v_ps);

  update public.countries set
    regulatory_tier = coalesce(v_new, regulatory_tier),
    regulatory_tier_origin = 'auto',
    regulatory_tier_reviewed_at = now(),
    regulatory_tier_needs_review = false,
    regulatory_tier_source_hash = md5(coalesce(v_ps,'')),
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_source = 'classifier-accepted ('||p_actor||') '||to_char(now(),'YYYY-MM-DD')
  where iso_alpha2=p_iso
  returning * into v_row;

  insert into public.regulatory_tier_audit
    (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
  values
    (p_iso, v_old.regulatory_tier, coalesce(v_new,v_old.regulatory_tier), 'auto', 'manual', v_ps, p_actor, 'Accepted classifier suggestion');

  return v_row;
end;
$$;

create or replace function api.set_regulatory_tier(p_iso text, p_tier text, p_actor text default 'agent'::text, p_note text default null::text)
returns countries
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_old public.countries;
  v_row public.countries;
  v_ps  text;
begin
  if not public.is_regulatory_tier_admin() then
    raise exception 'insufficient privileges: admin role required' using errcode = '42501';
  end if;

  if p_tier not in ('legal_commercial_access','medical_limited_trade','domestic_only','cbd_hemp_only','prohibited') then
    raise exception 'invalid tier %', p_tier;
  end if;

  select * into v_old from public.countries where iso_alpha2 = p_iso;
  if not found then raise exception 'unknown country %', p_iso; end if;

  select program_status into v_ps from public.cc_jurisdiction_briefings
   where country_iso2=p_iso and jurisdiction_type='country';

  update public.countries set
    regulatory_tier = p_tier,
    regulatory_tier_origin = 'override',
    regulatory_tier_reviewed_at = now(),
    regulatory_tier_needs_review = false,
    regulatory_tier_source_hash = md5(coalesce(v_ps,'')),
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_source = 'reviewed override ('||p_actor||') '||to_char(now(),'YYYY-MM-DD'),
    regulatory_tier_rationale = coalesce(p_note, regulatory_tier_rationale)
  where iso_alpha2 = p_iso
  returning * into v_row;

  insert into public.regulatory_tier_audit
    (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
  values
    (p_iso, v_old.regulatory_tier, p_tier, 'override', 'manual', v_ps, p_actor, coalesce(p_note,'Manual override via set_regulatory_tier'));

  return v_row;
end;
$$;
