-- Inbound write-back: Airtable tier edit -> Supabase. service_role only (edge function auth'd via sync key).
-- Stamps hv.sync_actor='airtable' so the outbound trigger does NOT echo it back (loop guard).
create or replace function api.apply_airtable_tier(p_iso text, p_tier text, p_rationale text default null)
returns public.countries
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_old public.countries;
  v_row public.countries;
  v_ps  text;
begin
  if p_tier not in ('legal_commercial_access','medical_limited_trade','domestic_only','cbd_hemp_only','prohibited') then
    raise exception 'invalid tier %', p_tier;
  end if;

  -- Loop guard: mark this write as Airtable-originated so the outbound trigger skips it.
  perform set_config('hv.sync_actor', 'airtable', true);

  select * into v_old from public.countries where iso_alpha2 = p_iso;
  if not found then raise exception 'unknown country %', p_iso; end if;

  select program_status into v_ps from public.cc_jurisdiction_briefings
   where country_iso2 = p_iso and jurisdiction_type = 'country';

  -- No-op guard: if nothing actually changed, don't churn.
  if v_old.regulatory_tier is not distinct from p_tier
     and (p_rationale is null or v_old.regulatory_tier_rationale is not distinct from p_rationale) then
    return v_old;
  end if;

  update public.countries set
    regulatory_tier = p_tier,
    regulatory_tier_origin = 'override',
    regulatory_tier_reviewed_at = now(),
    regulatory_tier_needs_review = false,
    regulatory_tier_source_hash = md5(coalesce(v_ps,'')),
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_source = 'airtable edit ' || to_char(now(),'YYYY-MM-DD'),
    regulatory_tier_rationale = coalesce(p_rationale, regulatory_tier_rationale)
  where iso_alpha2 = p_iso
  returning * into v_row;

  insert into public.regulatory_tier_audit
    (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
  values
    (p_iso, v_old.regulatory_tier, p_tier, 'override', 'airtable_writeback', v_ps, 'airtable',
     coalesce(p_rationale, 'Tier edited in Airtable'));

  return v_row;
end;
$function$;

comment on function api.apply_airtable_tier(text,text,text) is
  'Applies an Airtable-originated tier edit. service_role only; stamps hv.sync_actor=airtable for outbound loop guard.';

revoke all on function api.apply_airtable_tier(text,text,text) from public;
revoke all on function api.apply_airtable_tier(text,text,text) from anon;
revoke all on function api.apply_airtable_tier(text,text,text) from authenticated;
grant execute on function api.apply_airtable_tier(text,text,text) to service_role;