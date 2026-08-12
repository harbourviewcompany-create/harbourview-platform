# Global Regulatory OS Phase 0 — Merge GO checklist (#1248)

**Date:** 2026-08-12  
**PR:** https://github.com/harbourviewcompany-create/harbourview-platform/pull/1248  
**Branch:** `agent/global-reg-os-phase0-replacement`  
**Disposition:** **HOLD** until every item below is GO. Do not force-merge.

This checklist exists so “Go” means an operator decision with evidence — not a drive-by merge of a 500-file control package.

---

## A. Hard process gates (operator)

| # | Decision | Status | Notes |
|---|----------|--------|-------|
| A1 | Constitution / control-pack acceptance | **PENDING** | PR body: operator decision required |
| A2 | Governance acceptance | **PENDING** | |
| A3 | Security model acceptance (trusted request context / `hv_authenticator`) | **PENDING** | Replaces client-settable session-GUC identity |
| A4 | Service-boundary acceptance | **PENDING** | |
| A5 | Release-authorization for **merge to main only** (not prod migrate) | **PENDING** | Package explicitly does not authorize production DB write |

Until A1–A5 are explicit GO from the operator, merge stays HOLD even if CI is green.

---

## B. Technical evidence gates (CI / package)

| # | Gate | Expected evidence |
|---|------|-------------------|
| B1 | Source archive SHA-256 | `33a1b3de6f295aaeaf61017937a21b364bac7c0600f4038706013cb6b47cd136` verified against committed zip |
| B2 | Deterministic `MANIFEST.json` | `regenerate_manifest.py` is a no-op diff |
| B3 | Secret scan clean | `check_secrets.py` + repo secret scanners |
| B4 | JSON Schema / OpenAPI / AsyncAPI | Phase 0 workflow `contracts-and-control` green |
| B5 | PostgreSQL 17 clean install + simulated upgrade | Phase 0 workflow `postgres-17` green |
| B6 | Auth / RLS / negative privilege escalation / public leakage | Package + security suites green |
| B7 | Lint, typecheck, full tests, production build | CI green on exact head |
| B8 | Migration isolation | Diff vs base has **no** active `supabase/migrations/**` Harbourview production path changes (canonical package migrations only) |
| B9 | Migration drift check | Green / no new remote-only surprise |
| B10 | Exact Vercel preview | **Currently FAILED** — *Deployment rate limited — retry in 24 hours* (2026-08-12) |

**B10 is the active mechanical blocker.** Additional pushes to the branch will re-queue deploys and can extend the rate-limit window. Prefer waiting, not thrashing.

---

## C. Review reality (size)

| Tool | Reality |
|------|---------|
| CodeRabbit | Often skips — file count exceeds limit (~500 files) |
| Sourcery | Cannot review — diff character limit exceeded |
| Human review | **Required** — bots cannot substitute |

Recommend review by path groups:
1. `docs/control/global-regulatory-os/**` (provenance + constitution)
2. Auth / request-context / IAM security design
3. Workflows under `.github/workflows/*global-reg*`
4. Everything else only after 1–3 are accepted

---

## D. Explicit non-goals of merge

Merging #1248 does **not**:

- Apply Global Reg OS migrations to production Harbourview DB  
- Deploy a new production identity runtime without a separate activation plan  
- Replace Decision Intel Stage 0 (#1309)  
- Ship Command Centre activation (#1358–#1360)

Those remain separate GO tracks.

---

## E. Recommended sequence

1. **Stop** unnecessary commits on `agent/global-reg-os-phase0-replacement` while Vercel is rate-limited.  
2. Wait for B10 (Vercel) + B4–B9 green on a **stable** head.  
3. Operator completes A1–A5 with recorded decisions (comment on #1248 or evidence log).  
4. Merge only after A + B are all GO.  
5. Production activation of any Reg OS runtime remains a **later**, separately authorized step.

---

## F. Parallel product work (do not wait on #1248)

While #1248 is HOLD, ship smaller product PRs independently:

- #1358 session watch-rule hits  
- #1359 signal recommended_action → Actions  
- #1360 corpus watch + jurisdiction readiness + commercial bridge  
- #1309 Decision Intel Stage 0 (own HOLD matrix)

---

**Control statement:** This document does not authorize merge or production write. It only records the GO criteria for #1248.
