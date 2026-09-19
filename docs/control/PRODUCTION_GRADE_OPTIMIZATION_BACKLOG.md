# Harbourview — Production-Grade Optimization Backlog

**Last updated:** 2026-09-17  
**Purpose:** Ranked list of what still matters for production quality after Phase 3 Meltwater work.  
**Rule:** Prefer fixes that make the live product fresher, more accurate, or more operable — not more features.

---

## P0 — Customer-visible / revenue path

| # | Item | Why it matters | Status |
|---|------|----------------|--------|
| 1 | **Feed freshness SLO** | Historical feed age ~9d; digests and briefings starve without continuous promotion | 🟡 Meltwater path shipped; still need promote-within-24–48h monitoring |
| 2 | **Classifier → UI consistency** | `lib/signals/quality.ts` is the canonical layer; any remaining `score.desc` / fabricated confidence paths poison trust | ✅ quality module exists; audit any new readers |
| 3 | **Clinical evidence auth path** | Anon EXECUTE was revoked; Evidence tab must use service role or session JWT | 🟡 `clinicalEvidenceQuery` now prefers service role — verify mobile explorer not still broken |
| 4 | **Activate Meltwater in prod** | Code is production-grade; needs `MELTWATER_SOURCE_ID` + API key + search IDs | ⬜ Operator |

## P1 — Pipeline integrity

| # | Item | Why it matters | Status |
|---|------|----------------|--------|
| 5 | **Unify signal stores** | Parallel tables (`signals`, `ia_signals`, legacy views) cause wrong queries and orphan indexes | ⬜ Architecture cleanup |
| 6 | **Auto-promote gates** | Auto-promoted volume high, human review historically ~0; tighten quality gates + sample review queue | ⬜ |
| 7 | **Promotion health alerts** | `intelligence-health` outcome alerts exist — wire feed_age_hours critical threshold to ops email / Teams | 🟡 Partial |
| 8 | **BigQuery commercial re-score** | Skeleton + SQL template ready; needs project + write-back job | ⬜ |

## P2 — Briefing & personalization

| # | Item | Why it matters | Status |
|---|------|----------------|--------|
| 9 | **HubSpot preference sync** | Stub exists; wire into `listCadenceSubscribersForTick` / upsert path | ⬜ |
| 10 | **Google Calendar delivery windows** | Stub exists; optional schedule events when high-impact briefing generated | ⬜ |
| 11 | **min_confidence scale consistency** | `digestCadence` documents 0–10 → ×10; `briefingCadence` stores 0–100 — verify all writers/readers agree | ⬜ Audit |
| 12 | **Digest narrative eval set** | Few-shot or offline eval so commercial synthesis quality doesn't regress | ⬜ |

## P3 — Ops / platform hygiene

| # | Item | Why it matters | Status |
|---|------|----------------|--------|
| 13 | **Migration drift automation** | Repeated reconciliations; no enforced local-file-on-apply check | ⬜ Tyler / platform |
| 14 | **CI secrets** | `SUPABASE_ACCESS_TOKEN` + `SUPABASE_DB_PASSWORD` for Apply Migrations | ⬜ Tyler |
| 15 | **Disconnect dead Netlify / CF Workers / GCP triggers** | Noise on every PR; documented as safe-to-ignore but pollutes signal | ⬜ Tyler console |
| 16 | **E2E triage** | Suite never green in CI | ⬜ |
| 17 | **Command Centre mock panels** | Static arrays for some intel panels (see FRONTEND_DASHBOARD_OPTIMIZATION_PLAN) | ⬜ |

---

## Production activation checklist (Meltwater)

1. [ ] `source_registry` row for Meltwater → set `MELTWATER_SOURCE_ID`
2. [ ] `MELTWATER_API_KEY` + `MELTWATER_SEARCH_IDS` on Vercel Production
3. [ ] Dry-run `GET /api/cron/meltwater-enrich?dry=1`
4. [ ] Live run → rows in `source_snapshots` with `processing_status = pending_extraction`
5. [ ] Confirm next `intelligence-extract` promotes into `signals`
6. [ ] Confirm digests / personal briefings pick up new content within 24–48h
7. [ ] Watch `intelligence-health` feed_age_hours trend down

---

## Definition of "production grade" for this platform

- **Fresh:** promoted signal age < 48h under normal load  
- **Accurate:** customer confidence/impact badges only from `quality_confidence` / classifier impact  
- **Safe:** public surfaces never leak private provenance / contact fields  
- **Operable:** crons authenticated, health outcome alerts actionable, env documented  
- **Recoverable:** connectors no-op without credentials; schema-tolerant writes where possible  
