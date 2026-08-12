# Intel activation — jurisdiction, corpus watch, commercial bridge

**Date:** 2026-08-12  
**Scope:** Product activation layer on top of existing Signal Engine + Command Centre. Does **not** replace Decision Intel Stage 0 (#1309).

## 1. Live jurisdiction registry

**Production evidence (ops log):** `docs/ops/JURISDICTIONS_SEED_PRODUCTION_APPLY.md`

- `public.jurisdictions`: **203** rows (identity-only)
- crossref linked: **203 / 203**
- Stage 0 jurisdiction-registry prerequisite: **cleared**

**Runtime surface:** `getJurisdictionRegistryStatus()` + `/api/dashboard/watch-hits` exposes `{ count, ready, claimBoundary }`.

**Still required for Decision Intel product:**

1. Merge #1309 (Stage 0 schema + dossier UI)
2. Apply three Stage 0 migrations under existing controls
3. Backfill + RLS verification
4. Dossier runtime proof on a real event

Identity seed alone does **not** publish dossiers.

## 2. Watch beyond the session

| Layer | Behavior |
|-------|----------|
| Session matcher (`watchRuleHits.ts`) | Active rules × signals already in Command Centre props |
| Corpus matcher (`getCorpusWatchHits`) | Active rules × public reviewed feed (~300 window) |
| API | `GET /api/dashboard/watch-hits` (auth required) |

**Not included:** push notifications, offline cron alerts, private staging corpus, or guaranteed full historical archive scan.

## 3. Intel that moves commercial work

`matchIntelCommercialFollowUps(signals, listings, countryLabel)` pairs jurisdiction-matched signals with marketplace rows already loaded in session. Reasons are either same-jurisdiction or light topic token overlap.

**Not included:** automatic deal creation, ranking of global supply outside the loaded Command Centre rows, or inventing counterparties.

## 4. Activation checklist

- [x] Jurisdictions identity seed applied in prod (203)
- [ ] Merge mobile watch-rule hits UI (#1358) if not already on main
- [ ] Merge signal → action queue (#1359) if not already on main
- [ ] Land this PR (corpus API + commercial helper + control doc)
- [ ] Merge + apply #1309 Stage 0 under separate GO
- [ ] Design-partner weekly path on Germany importer

## Registry impact

- Harbourview Platform — no new deployment target
- No production write in this PR
