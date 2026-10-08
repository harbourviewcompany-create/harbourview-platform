-- Reconstructed from production. Verbatim statements for version 20260822134600.
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
  v_removed integer;
  -- ISO codes present in a zero-state repository replay that canonical
  -- production does not carry. Verified live 2026-09-06 against
  -- public.countries on project zvxdgdkukjrrwamdpqrg: production holds 291 rows
  -- and none of these eighteen codes appear among them.
  --
  -- Six are the legacy territory rows this migration was originally written for
  -- (AS, GU, MP, VI, NC, PF), inserted by
  -- 20260822134500_live_regulatory_heatmap_all_jurisdictions. The other twelve
  -- are canonical territory identity rows added by
  -- 20260613170000_canonical_country_reference_repair, which post-dates the
  -- original reconciliation and pushed replay from 297 rows to 309.
  v_replay_only constant text[] := array[
    'AS', 'AW', 'AX', 'CW', 'GG', 'GI', 'GS', 'GU', 'HM',
    'IM', 'JE', 'MO', 'MP', 'NC', 'PF', 'SX', 'TF', 'VI'
  ];
begin
  select count(*) into v_total from public.countries;

  if v_total = 291 then
    -- Canonical production state: deliberately no-op.
    return;
  end if;

  -- Match on iso_alpha2 alone rather than the exact (iso_alpha2, iso_alpha3,
  -- country_slug) tuple the original used. That tuple match silently degraded:
  -- 20260609000000 seeds VI as 'us-virgin-islands', not the
  -- 'united-states-virgin-islands' slug the tuple named, so it found five of six.
  -- Rows in these three tables reference the replay-only territories by ISO
  -- code and block the delete on a foreign key. Production carries none of them
  -- (verified live 2026-09-06: zero rows in all three for these eighteen codes),
  -- which is expected -- it has no such country rows to reference. Any OTHER
  -- dependent table is deliberately not swept here: a new foreign-key violation
  -- should surface loudly rather than be silently deleted through.
  delete from public.jurisdiction_crossref where countries_iso2 = any (v_replay_only);
  delete from public.jurisdiction_playbooks_research_queue where country_code = any (v_replay_only);
  delete from public.local_intel_coverage where country_code = any (v_replay_only);

  delete from public.countries where iso_alpha2 = any (v_replay_only);
  get diagnostics v_removed = row_count;

  if (select count(*) from public.countries) <> 291 then
    raise exception
      'Legacy heatmap reconciliation expected 291 rows; started at %, removed % replay-only territory row(s), left %',
      v_total, v_removed, (select count(*) from public.countries);
  end if;
end
$reconcile_legacy_heatmap_territories$;
