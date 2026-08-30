-- Replay-safe reconciliation for 20260822134500_live_regulatory_heatmap_all_jurisdictions.
--
-- That historical migration inserted six standalone territory rows (AS, GU, MP,
-- VI, NC, PF). Production never retained those rows: the later canonical map
-- contract is 291 rows and production records 20260822134500 as superseded
-- history. A clean repository replay, however, executes the historical body and
-- reaches 297 rows before 20260830140000 asserts the canonical 291-row shape.
--
-- Remove only the exact six legacy rows, and only when the database is in that
-- exact 297-row historical replay state. On canonical production (291 rows) this
-- migration is intentionally a no-op.

do $reconcile_legacy_heatmap_territories$
declare
  v_total integer;
  v_legacy integer;
begin
  select count(*) into v_total from public.countries;

  select count(*) into v_legacy
  from public.countries
  where (iso_alpha2, iso_alpha3, country_slug) in (
    ('AS','ASM','american-samoa'),
    ('GU','GUM','guam'),
    ('MP','MNP','northern-mariana-islands'),
    ('VI','VIR','united-states-virgin-islands'),
    ('NC','NCL','new-caledonia'),
    ('PF','PYF','french-polynesia')
  );

  if v_total = 297 and v_legacy = 6 then
    delete from public.countries
    where (iso_alpha2, iso_alpha3, country_slug) in (
      ('AS','ASM','american-samoa'),
      ('GU','GUM','guam'),
      ('MP','MNP','northern-mariana-islands'),
      ('VI','VIR','united-states-virgin-islands'),
      ('NC','NCL','new-caledonia'),
      ('PF','PYF','french-polynesia')
    );

    if (select count(*) from public.countries) <> 291 then
      raise exception 'Legacy heatmap reconciliation expected 291 rows after deleting six exact seed rows';
    end if;
  elsif v_total = 291 and v_legacy = 0 then
    -- Canonical production state: deliberately no-op.
    null;
  else
    raise exception 'Unexpected heatmap reconciliation state: total=%, exact_legacy_rows=%', v_total, v_legacy;
  end if;
end
$reconcile_legacy_heatmap_territories$;
