-- Outbound push: countries.regulatory_tier change -> Airtable via edge function.
create or replace function public.push_regulatory_tier_to_airtable()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor text := coalesce(current_setting('hv.sync_actor', true), 'supabase');
  v_ps    text;
  v_key   text;
  v_url   text := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-airtable-tier-sync';
  v_anon  text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eGRnZGt1a2pycndhbWRwcXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDMxNzUsImV4cCI6MjA5MjgxOTE3NX0.MEGWEsDpJO3964Ef2G2Cbo-Q5JKT46WB1xtlXE-ue5M';
begin
  -- Loop guard: never echo an Airtable-originated write back to Airtable.
  if v_actor = 'airtable' then
    return new;
  end if;

  -- Only push when a tier-relevant column actually changed.
  if new.regulatory_tier is not distinct from old.regulatory_tier
     and new.regulatory_tier_origin is not distinct from old.regulatory_tier_origin
     and new.regulatory_tier_needs_review is not distinct from old.regulatory_tier_needs_review
     and new.regulatory_tier_rationale is not distinct from old.regulatory_tier_rationale then
    return new;
  end if;

  select program_status into v_ps
    from public.cc_jurisdiction_briefings
   where country_iso2 = new.iso_alpha2 and jurisdiction_type = 'country';

  select decrypted_secret into v_key
    from vault.decrypted_secrets where name = 'hv_airtable_sync_key';

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon,
      'x-hv-sync-key', v_key
    ),
    body := jsonb_build_object(
      'iso',            new.iso_alpha2,
      'tier',           new.regulatory_tier,
      'origin',         new.regulatory_tier_origin,
      'rationale',      new.regulatory_tier_rationale,
      'program_status', v_ps,
      'needs_review',   new.regulatory_tier_needs_review,
      'actor',          v_actor
    )
  );

  return new;
end;
$function$;

comment on function public.push_regulatory_tier_to_airtable() is
  'AFTER UPDATE on countries: pushes regulatory_tier changes to Airtable via hv-airtable-tier-sync. Skips writes whose hv.sync_actor session var is ''airtable'' (loop guard).';

drop trigger if exists trg_push_regulatory_tier_to_airtable on public.countries;
create trigger trg_push_regulatory_tier_to_airtable
after update of regulatory_tier, regulatory_tier_origin, regulatory_tier_needs_review, regulatory_tier_rationale
on public.countries
for each row
execute function public.push_regulatory_tier_to_airtable();

-- Loop guard on the write-back path: stamp the actor so the outbound trigger can skip it.
create or replace function api.set_regulatory_tier(p_iso text, p_tier text, p_actor text DEFAULT 'agent'::text, p_note text DEFAULT NULL::text)
 RETURNS countries
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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

  -- Make the actor visible to the outbound Airtable trigger (loop guard).
  perform set_config('hv.sync_actor', p_actor, true);

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
$function$;