-- Read-only regression gate for primary-source market-access hardening.
-- Expected production inventory: 291 national + 88 rendered subnational = 379.
-- This test intentionally fails until every inventory row has an individually
-- reviewed, current, unique, snapshot-hashed primary source.

begin;

create temporary table _hardening_assert as
select * from api.assert_market_access_primary_source_hardening();

DO $$
declare
  v_jurisdictions bigint;
  v_national bigint;
  v_subnational bigint;
  v_hardened bigint;
  v_missing bigint;
  v_expired bigint;
  v_wrong_level bigint;
  v_wrong_parent bigint;
  v_missing_snapshot bigint;
  v_future_effective bigint;
  v_reused bigint;
  v_duplicates bigint;
begin
  select jurisdictions,national_jurisdictions,subnational_jurisdictions,hardened,missing,expired,
         wrong_level,wrong_parent,missing_snapshot,future_effective_date,reused_current_evidence_url,duplicate_source_urls
    into v_jurisdictions,v_national,v_subnational,v_hardened,v_missing,v_expired,
         v_wrong_level,v_wrong_parent,v_missing_snapshot,v_future_effective,v_reused,v_duplicates
  from _hardening_assert;

  if v_jurisdictions <> 379 then
    raise exception 'primary-source hardening inventory expected 379 jurisdictions (291 national + 88 subnational), found %', v_jurisdictions;
  end if;
  if v_national <> 291 then
    raise exception 'primary-source hardening expected 291 national jurisdictions, found %', v_national;
  end if;
  if v_subnational <> 88 then
    raise exception 'primary-source hardening expected 88 rendered subnational jurisdictions, found %', v_subnational;
  end if;
  if v_hardened <> 379 or v_missing <> 0 or v_expired <> 0 or v_wrong_level <> 0 or v_wrong_parent <> 0
     or v_missing_snapshot <> 0 or v_future_effective <> 0 or v_reused <> 0 or v_duplicates <> 0 then
    raise exception 'primary-source hardening incomplete: hardened=%, missing=%, expired=%, wrong_level=%, wrong_parent=%, missing_snapshot=%, future_effective=%, reused_current_evidence_url=%, duplicate_source_urls=%',
      v_hardened,v_missing,v_expired,v_wrong_level,v_wrong_parent,v_missing_snapshot,v_future_effective,v_reused,v_duplicates;
  end if;
end $$;

rollback;
