-- Partially-public feed for regulatory_pending_changes (previously dark: no api path).
-- Teaser (always visible): country, change_type, entity_type, confidence, coarse year,
--   and that details exist + whether they're locked. Drives signups.
-- Specifics (current/expected value, note, exact effective date, source) gated to intel/operator.

create or replace function api.regulatory_pending_changes_feed()
returns table (
  id uuid, country_iso2 text, change_type text, entity_type text, confidence text,
  timeframe_hint text, has_details boolean, locked boolean,
  current_value text, expected_value text, expected_note text,
  expected_effective_date date, source_url text
)
language plpgsql stable security definer set search_path to ''
as $function$
declare v_paid boolean;
begin
  v_paid := exists (select 1 from public.user_profiles up
    where up.id = (select auth.uid()) and up.tier = any(array['intel','operator']));
  return query
  select
    r.id,
    (select rp.iso_alpha2 from public.regulatory_pathways rp where rp.id = r.entity_id),
    r.change_type::text, r.entity_type::text, r.confidence::text,
    case when r.expected_effective_date is not null then to_char(r.expected_effective_date,'YYYY') else null end,
    (r.expected_value is not null or nullif(btrim(coalesce(r.expected_note,'')),'') is not null),
    (not v_paid),
    case when v_paid then r.current_value end,
    case when v_paid then r.expected_value end,
    case when v_paid then r.expected_note end,
    case when v_paid then r.expected_effective_date end,
    case when v_paid then r.source_url end
  from public.regulatory_pending_changes r
  where r.status::text is distinct from 'retracted'
  order by case r.confidence::text
    when 'enacted_pending_force' then 1 when 'announced' then 2 when 'draft' then 3 else 4 end,
    (select rp.iso_alpha2 from public.regulatory_pathways rp where rp.id = r.entity_id);
end;
$function$;

comment on function api.regulatory_pending_changes_feed() is
  'Partially-public regulatory-change feed. Teaser fields (country, change_type, confidence, coarse year) visible to all; specifics gated to intel/operator tiers. Surfaces the previously-dark public.regulatory_pending_changes.';

revoke all on function api.regulatory_pending_changes_feed() from public;
grant execute on function api.regulatory_pending_changes_feed() to anon, authenticated;
