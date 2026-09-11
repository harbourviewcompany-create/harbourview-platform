-- Rollback for: retirement of 34 non-primary-source verified_regulatory_tier publications
-- Captured 2026-09-11 from production (zvxdgdkukjrrwamdpqrg) BEFORE the retirement write.
--
-- Before-state facts that make this rollback exact:
--   * All 34 evidence rows had active = true.
--   * All 34 countries had regulatory_tier_evidence_key = the matching evidence_key (verified 1:1).
--   * All 34 countries had verified_regulatory_tier   = evidence.tier
--                          regulatory_tier_verified_at = evidence.verified_at (2026-09-07T00:05:00+00)
--                          regulatory_tier_expires_at  = evidence.expires_at  (2027-09-07T00:00:00+00)
--   * The retirement write does NOT modify evidence.tier / verified_at / expires_at, so the
--     evidence rows remain the authoritative source for restoring the country columns.

begin;

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

update public.countries c
   set verified_regulatory_tier     = e.tier,
       regulatory_tier_evidence_key = e.evidence_key,
       regulatory_tier_verified_at  = e.verified_at,
       regulatory_tier_expires_at   = e.expires_at
  from public.regulatory_market_access_evidence e
 where c.iso_alpha2 = e.jurisdiction_iso2
   and e.evidence_key in (
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

commit;

-- ---------------------------------------------------------------------------
-- SIDE-EFFECT ANALYSIS (verified post-write): NONE. This rollback is exact.
--
-- public.countries carries seven triggers. Every consequential one is scoped
-- with UPDATE OF <column list>, and none of those columns is touched by the
-- retirement statement (which writes only verified_regulatory_tier,
-- regulatory_tier_evidence_key, regulatory_tier_verified_at,
-- regulatory_tier_expires_at):
--
--   trg_sync_market_access_status          BEFORE UPDATE OF regulatory_tier      -> did not fire
--   sync_opportunity_score_trigger         BEFORE UPDATE OF market_access_status -> did not fire
--   trg_guard_regulatory_tier_write_contract BEFORE UPDATE OF regulatory_tier    -> did not fire
--   trg_push_regulatory_tier_to_airtable   AFTER UPDATE OF regulatory_tier, ...  -> did not fire (NO Airtable push)
--   trg_network_review_countries           AFTER UPDATE OF public_summary        -> did not fire
--   countries_updated_at                   BEFORE UPDATE (all)                   -> fired (updated_at bumped)
--   trg_countries_field_changes            AFTER UPDATE (all)                     -> fired (audit row written)
--
-- NOTE: information_schema.triggers does NOT expose the UPDATE OF column list.
-- Reading it alone makes every trigger look unconditional. Use
-- pg_get_triggerdef(t.oid) from pg_trigger instead. An earlier draft of this
-- file predicted a market_access_status/opportunity_score side effect on CH, JP
-- and TH on that basis; post-write verification showed all three unchanged.
--
-- SEPARATE PRE-EXISTING FINDING (untouched by this change, still latent):
-- three rows have market_access_status inconsistent with the value
-- sync_market_access_status() derives from regulatory_tier. The next write to
-- regulatory_tier on any of them will silently re-derive it:
--
--   ISO  regulatory_tier          mas stored   mas derived   score stored -> would become
--   CH   domestic_only            regulated    emerging      64 -> 52
--   JP   medical_limited_trade    limited      regulated     36 -> 64
--   TH   medical_limited_trade    emerging     regulated     52 -> 64
--
-- Also: CH has regulatory_tier='domestic_only' while verified_regulatory_tier
-- was 'medical_limited_trade' -- the two columns disagree, consistent with
-- AGENT_OPERATING_FACTS section 11 (never treat the legacy column as a proxy
-- for the verified one).
-- ---------------------------------------------------------------------------
