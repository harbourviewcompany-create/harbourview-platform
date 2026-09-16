-- Restored from production migration ledger on 2026-09-16.
-- This is a data-state reconciliation migration; it restores the 34 evidence rows
-- retired on 2026-09-11 and refreshes the derived verified-tier projection.
update public.regulatory_market_access_evidence
set active = true
where evidence_key in (
  'hv-mkt-al-20260907','hv-mkt-ar-20260907','hv-mkt-bg-20260907','hv-mkt-by-20260907',
  'hv-mkt-ch-20260907','hv-mkt-cl-20260907','hv-mkt-cn-20260907','hv-mkt-cy-20260907',
  'hv-mkt-ec-20260907','hv-mkt-gy-20260907','hv-mkt-hr-20260907','hv-mkt-hu-20260907',
  'hv-mkt-in-20260907','hv-mkt-jp-20260907','hv-mkt-ke-20260907','hv-mkt-kn-20260907',
  'hv-mkt-lk-20260907','hv-mkt-lt-20260907','hv-mkt-md-20260907','hv-mkt-mx-20260907',
  'hv-mkt-ng-20260907','hv-mkt-py-20260907','hv-mkt-rs-20260907','hv-mkt-ru-20260907',
  'hv-mkt-rw-20260907','hv-mkt-se-20260907','hv-mkt-sg-20260907','hv-mkt-si-20260907',
  'hv-mkt-sk-20260907','hv-mkt-th-20260907','hv-mkt-tr-20260907','hv-mkt-tz-20260907',
  'hv-mkt-vc-20260907','hv-mkt-vu-20260907'
);
select * from api.refresh_verified_market_access_tiers('market-access-restore-34-20260913');
DO $$
declare v_restored integer; v_published integer; v_missing integer;
begin
 select count(*) into v_restored from public.regulatory_market_access_evidence where active and evidence_key in ('hv-mkt-al-20260907','hv-mkt-ar-20260907','hv-mkt-bg-20260907','hv-mkt-by-20260907','hv-mkt-ch-20260907','hv-mkt-cl-20260907','hv-mkt-cn-20260907','hv-mkt-cy-20260907','hv-mkt-ec-20260907','hv-mkt-gy-20260907','hv-mkt-hr-20260907','hv-mkt-hu-20260907','hv-mkt-in-20260907','hv-mkt-jp-20260907','hv-mkt-ke-20260907','hv-mkt-kn-20260907','hv-mkt-lk-20260907','hv-mkt-lt-20260907','hv-mkt-md-20260907','hv-mkt-mx-20260907','hv-mkt-ng-20260907','hv-mkt-py-20260907','hv-mkt-rs-20260907','hv-mkt-ru-20260907','hv-mkt-rw-20260907','hv-mkt-se-20260907','hv-mkt-sg-20260907','hv-mkt-si-20260907','hv-mkt-sk-20260907','hv-mkt-th-20260907','hv-mkt-tr-20260907','hv-mkt-tz-20260907','hv-mkt-vc-20260907','hv-mkt-vu-20260907');
 select count(*) into v_published from public.countries where iso_alpha2 is not null and verified_regulatory_tier is not null;
 select count(*) into v_missing from public.countries where iso_alpha2 is not null and verified_regulatory_tier is null;
 if v_restored <> 34 then raise exception 'Expected 34 restored evidence rows, found %', v_restored; end if;
 if v_published <> 164 then raise exception 'Expected 164 verified jurisdiction rows after 34-row restoration, found %', v_published; end if;
 if v_missing <> 127 then raise exception 'Expected 127 remaining unpublished jurisdiction rows before completion tranche, found %', v_missing; end if;
end $$;
