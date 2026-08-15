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
-- version 20260714092852.
--
-- Rewriting this file cannot affect production: 20260714092852 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Snapshot of the tier value we last observed in / pushed to Airtable, per country.
-- Lets the poller tell an Airtable-side human edit (at_tier != last_seen AND != current)
-- apart from an outbound echo (at_tier == current) without needing timestamps.
alter table public.countries add column if not exists airtable_last_seen_tier text;
update public.countries set airtable_last_seen_tier = regulatory_tier where airtable_last_seen_tier is null;

-- Reconcile a batch of {iso, tier} rows fetched from Airtable. service_role only.
create or replace function api.reconcile_airtable_tiers(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  r         jsonb;
  v_iso     text;
  v_at_tier text;
  v_cur     text;
  v_seen    text;
  v_ps      text;
  v_pulled  text[] := '{}';
  v_marked  int := 0;
  v_valid   constant text[] := array['legal_commercial_access','medical_limited_trade','domestic_only','cbd_hemp_only','prohibited'];
begin
  for r in select value from jsonb_array_elements(coalesce(p_rows,'[]'::jsonb))
  loop
    v_iso     := r->>'iso';
    v_at_tier := r->>'tier';
    if v_iso is null or v_at_tier is null then continue; end if;
    if not (v_at_tier = any(v_valid)) then continue; end if;

    select regulatory_tier, airtable_last_seen_tier into v_cur, v_seen
      from public.countries where iso_alpha2 = v_iso;
    if not found then continue; end if;

    -- Unchanged in Airtable since we last observed it -> nothing to do.
    if v_at_tier is not distinct from v_seen then
      continue;
    end if;

    if v_at_tier is distinct from v_cur then
      -- Genuine Airtable-originated edit -> pull it in (loop-guarded so it won't echo back).
      perform set_config('hv.sync_actor','airtable', true);
      select program_status into v_ps from public.cc_jurisdiction_briefings
        where country_iso2 = v_iso and jurisdiction_type = 'country';
      update public.countries set
        regulatory_tier = v_at_tier,
        regulatory_tier_origin = 'override',
        regulatory_tier_reviewed_at = now(),
        regulatory_tier_needs_review = false,
        regulatory_tier_source_hash = md5(coalesce(v_ps,'')),
        regulatory_tier_last_derived_at = now(),
        regulatory_tier_source = 'airtable poll ' || to_char(now(),'YYYY-MM-DD'),
        airtable_last_seen_tier = v_at_tier
      where iso_alpha2 = v_iso;
      insert into public.regulatory_tier_audit
        (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
      values
        (v_iso, v_cur, v_at_tier, 'override', 'airtable_poll', v_ps, 'airtable', 'Tier pulled from Airtable (poll)');
      v_pulled := v_pulled || v_iso;
    else
      -- at_tier == current Supabase tier but != last_seen: this is an outbound echo.
      -- Just advance the marker; no write to the tier, no audit.
      update public.countries set airtable_last_seen_tier = v_at_tier where iso_alpha2 = v_iso;
      v_marked := v_marked + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'pulled', to_jsonb(v_pulled),
    'pulled_count', coalesce(array_length(v_pulled,1),0),
    'echo_marked', v_marked
  );
end;
$function$;

comment on function api.reconcile_airtable_tiers(jsonb) is
  'Reconciles a batch of {iso,tier} rows read from Airtable: pulls genuine Airtable-side edits into Supabase (loop-guarded), advances the airtable_last_seen_tier marker for outbound echoes. service_role only.';

revoke all on function api.reconcile_airtable_tiers(jsonb) from public;
revoke all on function api.reconcile_airtable_tiers(jsonb) from anon;
revoke all on function api.reconcile_airtable_tiers(jsonb) from authenticated;
grant execute on function api.reconcile_airtable_tiers(jsonb) to service_role;
