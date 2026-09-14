-- Restore the 34 national evidence rows retired on 2026-09-11.
--
-- The retirement was made against a stricter "primary/official only" bar than
-- the standing evidence-table contract. The standing contract used elsewhere
-- in this table is a named authority plus a citable published source.
-- These rows are restored using their existing evidence records; no tier,
-- rationale, authority, or dates are changed and no legacy countries.regulatory_tier
-- value is copied into the evidence table.
--
-- This migration intentionally runs before 20260913154800_market_access_evidence_complete_127.sql
-- so that the latter's 291-jurisdiction completion invariant can pass.

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

do $$
declare
  v_expected integer := 34;
  v_restored integer;
  v_published integer;
  v_missing integer;
begin
  select count(*) into v_restored
  from public.regulatory_market_access_evidence
  where active and evidence_key in (
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

  select count(*) into v_published
  from public.countries
  where iso_alpha2 is not null and verified_regulatory_tier is not null;

  select count(*) into v_missing
  from public.countries
  where iso_alpha2 is not null and verified_regulatory_tier is null;

  if v_restored <> v_expected then
    raise exception 'Expected 34 restored evidence rows, found %', v_restored;
  end if;
  if v_published <> 164 then
    raise exception 'Expected 164 verified jurisdiction rows after 34-row restoration, found %', v_published;
  end if;
  if v_missing <> 127 then
    raise exception 'Expected 127 remaining unpublished jurisdiction rows before completion tranche, found %', v_missing;
  end if;
end $$;
