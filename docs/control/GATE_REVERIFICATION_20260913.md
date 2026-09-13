# 15-gate re-verification — 2026-09-13

**Read-only.** Nothing was written to production, no migration applied, no deploy, no merge.
Every figure below was measured live against `zvxdgdkukjrrwamdpqrg` or a current checkout,
not carried forward from an earlier document.

Re-verifies `docs/control/FINAL_PRODUCTION_READINESS_AUDIT.md`, whose status line reads:

> HOLD (Gates 1, 2, 4 GO; Gate 9 PARTIAL; Gates 3, 5–8, 10–15 remain HOLD)

## The first finding is the status line itself

Those statuses were verified **2026-06-23 / 06-25**, on branch `claude/zealous-gates-68ziia`
at commit `ec58196`. That is **twelve weeks** and roughly **200 migrations** ago, and neither
the branch nor the commit is reachable today. `CURRENT_STATE.md`, `SOURCE_OF_TRUTH.md`,
`PROJECT_STATE.md` and `FINISH_LINE_BACKLOG.md` all carry SUPERSEDED banners for the same
reason; the readiness audit does not, and is treated as current when it is not.

Any plan built on that line is guesswork. That is what this document replaces.

## Verdicts

Four states are used deliberately. **UNVERIFIABLE HERE** is not a soft HOLD — it means the
evidence is operator-held (Vercel/GitHub admin) and no agent session can close it.

| Gate | Audit says | Verified 2026-09-13 | Basis |
|---|---|---|---|
| 1 Build recovery baseline | GO (06-23) | **GO — re-verified** | `typecheck` exit 0, `build` exit 0 today |
| 2 Canonical deployment target | GO (06-23) | **PARTIAL** | registry/domain recorded; secret mapping still unconfirmed |
| 3 Branch protection | HOLD | **HOLD — and measured** | 26 of last 60 `main` commits have no PR |
| 4 Static verification baseline | GO (06-25) | **GO — and its known gap is closed** | 1,204 tests pass, 0 fail; both missing scripts now exist |
| 5 Production route map | HOLD | **NOT ASSESSED** | artifacts exist; route-map evidence not produced |
| 6 Public leakage | HOLD | **PARTIAL** | leakage suites green; no live production sweep |
| 7 Admin denial / role matrix | HOLD | **NOT ASSESSED** | needs authenticated live probing |
| 8 Marketplace capture + RLS | HOLD | **NOT ASSESSED** | needs live write-path probing |
| 9 Supabase canonical DB + RLS | PARTIAL | **PARTIAL — 5 concrete items** | live advisor sweep, below |
| 10 Network/intelligence projection | HOLD | **PARTIAL** | `verify-public-surfaces` green in CI |
| 11 Marketplace DTO / import boundary | HOLD | **PARTIAL** | DTO suites green |
| 12 Legacy / parallel project | HOLD | **NOT ASSESSED** | operator classification |
| 13 Browser QA / visual pass | HOLD | **HOLD** | 14 e2e specs exist; `E2E (Playwright)` **skipped** in CI |
| 14 Evidence log + release decision | HOLD | **HOLD** | log is live and maintained; no release decision recorded |
| 15 Reliability / capacity / recovery | HOLD | **NOT ASSESSED** | no capacity or recovery evidence found |

**Nothing moved from HOLD to GO in twelve weeks. One gate (4) quietly closed its own gap;
one (2) is weaker than recorded.**

## The cross-cutting finding: production is ahead of the repository

This is not one of the 15 gates. It undermines all of them, because it means a gate can read
GO in the repository while production is a different system.

Measured by set difference, live ledger vs. current `main`:

| | count |
|---|---:|
| migration versions in the repository | 1,054 |
| versions applied in production | 953 |
| equivalence mappings recorded | 16 |
| attested remote-only | 2 |
| baselined committed-not-applied | 113 |
| **applied in production with no repository file and no equivalence record** | **13** |
| committed but not applied, and **not** baselined | 1 (`20260913113200`) |

The 13:

```
20260911225008  20260911225106  20260911225151  20260911225324
20260912103655  20260912103723  20260912103805  20260912103836
20260913114422  20260913114459  20260913114553  20260913124740  20260913124753
```

**None of the 13 appears in any file under `supabase/release-controls/`.** Checked directly.

The first eight are the #1812 apply-time versions. #1834 (merged today) fixed the failing
ledger *test* by renaming the repository files back to their authored versions —
`20260912103723` → `20260801150000` and so on — but did **not** add equivalence entries. The
result is that the same eight migrations now disagree with production in **both** directions
at once: the authored version is committed-not-applied, and the apply-time version is
applied-not-committed. The test passes because it only asks whether baselined versions have
files.

The last five were applied to production **today** and have no repository file at all.

`applied_not_committed` is the one class the drift gate is documented to fail on. It is
currently non-empty, and this is exactly the condition `AGENT_OPERATING_FACTS.md` warns
about: *"Merging a migration does not apply it to production."* The inverse is now also true —
production is being changed without the repository following.

## Gate 9 — the five concrete items

From a live security advisor sweep plus direct catalogue queries:

1. **7 public tables with RLS disabled entirely** —
   `country_cannabis_legal_status`, `hv_gemini_embed_queue`, `hv_gemini_key_cooldown`,
   `hv_gemini_key_rotation`, `hv_local_classifier_centroids`, `source_discovery_attempts`,
   `source_discovery_jobs`. Two of those hold API-key rotation/cooldown state.
2. **38 tables with RLS enabled and no policy.** Deny-by-default, so not a leak — but it
   means service-role-only access, and it should be a deliberate choice per table rather
   than a default nobody revisits.
3. **15 `SECURITY DEFINER` functions executable by `authenticated`**, including
   `public.is_harbourview_admin()`, `public.is_hv_staff()`,
   `api.get_command_centre_stats()` and `api.submit_signal_relevance_feedback(...)`. Several
   are role-check helpers that RLS policies legitimately need; that they are *also* callable
   directly over `/rest/v1/rpc/` by any signed-in user is worth an explicit decision.
4. **Leaked-password protection is disabled** in Supabase Auth.
5. `pg_net` installed in `public`; `public._backfill_strip_site_suffix` has a mutable
   `search_path`.

## A shipped-inert public surface, found while checking Gate 9

`20260912162110_expose_country_legal_status_via_api_schema.sql` is applied to production. It
creates `api.country_cannabis_legal_status_v1` `with (security_invoker = on)` and grants
`select` to `anon, authenticated`.

The base table has **RLS disabled and no grant to `anon`**. Because the view is
`security_invoker`, the caller's privileges apply to the base table. Tested directly:

```
set local role anon;
select count(*) from api.country_cannabis_legal_status_v1;
-- anon read blocked: 42501 permission denied for table country_cannabis_legal_status
```

**This is not a leak — it fails closed, which is the right direction.** But the view exists to
expose that data publicly and cannot return a row to the roles it was granted to. Ninety rows
sit behind it. Same bug class as the `api.signals_quality` defect of 2026-08-01: a view that
errors at request time while every monitor stays green. Either grant the base table and add a
policy, or withdraw the view — but it should not stay as-is.

## Gate 3 — measured rather than asserted

`AGENTS.md` records the missing branch-protection rule as an open gap, and
`MAIN_BRANCH_PROTECTION_SPEC.md` records that the gap produced a real outage on 2026-08-12.

**26 of the last 60 commits on `main` carry no `(#NNNN)` pull-request reference.** Among them
are five consecutive commits titled *"revert accidental main … write"*. The rule in `AGENTS.md`
— every change lands via a PR — is being bypassed at roughly a 43% rate, and the reverts show
it is not harmless.

This is the cheapest gate on the list to close and the one with the most evidence of active
harm.

## What could not be verified from this session

State it rather than leave it implied:

- **Gate 2's carry-forward**: whether GitHub secrets `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`
  point at `team_0rK4jTvMLlSufR0ZzX4LCKYi` / `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS`. Operator-held.
- **Gate 3's required-check list**: needs GitHub admin API.
- **Gates 5, 7, 8**: need authenticated live probing of the deployed app; this session cannot
  reach `harbourview.vercel.app`.
- **Gate 13**: `E2E (Playwright)` is **skipped** in CI, so the 14 spec files are not proving
  anything on merge.
- **Gate 15**: no capacity, load or recovery evidence exists in the repository to verify.

## Ranked, with reasons

1. **Reconcile the 13 applied-not-committed versions.** Until repository and production agree,
   no gate verdict means anything — including the ones marked GO here.
2. **Gate 3, branch protection.** Cheapest, operator-only, documented outage, 43% bypass rate.
3. **Gate 9 items 1 and 4.** RLS on seven tables and leaked-password protection are small,
   bounded changes with real security value.
4. **Decide `api.country_cannabis_legal_status_v1`** — grant and policy, or withdraw.
5. **Un-skip Gate 13's Playwright job**, or accept that browser QA is not gating.
6. Then Gates 5, 7, 8 — which need a reachable deployment and are the real remaining work.

## Not done

This is a status measurement, not a closure. No gate was closed, no code changed, no
production write made. The 161 countries publishing no regulatory tier (130 of 291) and the
sourcing-bar decision from `MARKET_ACCESS_RESOURCING_34_20260913.md` are untouched and still
blocked on a decision that is Tyler's.
