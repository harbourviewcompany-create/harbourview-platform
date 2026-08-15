# Harbourview Platform — Current State

_Last updated: 2026-06-29_
_HEAD: `4612f3d` (main)_

Status: **SUPERSEDED — historical record only, not current authority**

> ⚠️ **Do not use this file as current platform-status authority.** It is frozen at
> 2026-06-29 (`4612f3d`). The live, actively-maintained operating handoff is the
> repo-root `HANDOFF.md` — read that first; its own "CURRENT STATE" table is the
> one to trust.
>
> This file, `docs/control/SOURCE_OF_TRUTH.md`, and `docs/control/PROJECT_STATE.md`
> all predate root `HANDOFF.md`'s 2026-08-11 state by 6+ weeks.
> `docs/control/AGENT_HANDOFF.md` was flagged on this same basis 2026-07-21 (see
> `docs/control/EVIDENCE_LOG.md`, PR #1112) but this file itself was never updated
> at that time — this pass closes that gap.
>
> Flagged during a docs-review session, 2026-08-15 — see
> `docs/control/EVIDENCE_LOG.md` for the entry.

---

## Platform Status

| Area | Status |
|------|--------|
| Globe (3D, country select, briefing sheet) | ✅ Live — `MarketOverviewSheet` renders confidence ring + all briefing sections |
| Dashboard (CommandCentre, live data) | ✅ Live — 12+ Supabase sources wired, marketplaceRows, wantedListings |
| Marketplace (listings, wanted, intake) | ✅ Live — public projection, RLS-gated mutations, category tabs |
| Deal Rooms (match → promotion) | 🟡 PR #904 open — promote route + HubPanel wired, needs: verification |
| Intelligence pipeline (ingest → extract → embed → notify) | ✅ Wired — Gemini 2.5 Flash primary, Claude Haiku fallback, cron schedule configured |
| Signals (ia_signals + curated signals table, digest) | ✅ Live — notify cron reads both tables since PR #904 bridge |
| Genetics (cultivar passports, access grants) | ✅ Live — public showcase, profile redaction enforced |
| Education (compliance, medical, export/import) | ✅ Live — tier-gated, DTO boundary tested |
| Regulatory tracking + jurisdiction comparison | ✅ Live — merged Jun 29 |
| Supplier / operator directory | ✅ Live |
| Stripe billing (subscription, webhooks) | ✅ Live — lazy-init fixed Jun 29 |
| Admin guard + roles | ✅ Typed — `as any` cast removed Jun 29 |
| Middleware auth + tier gating | ✅ Live — `/admin` matcher fixed Jun 29 |
| BGE-M3 embeddings (ia_signal_embeddings + HNSW) | ✅ Schema live — HF endpoint optional (falls back to serverless) |

---

## CI Status (main `4612f3d`)

| Workflow | Status | Notes |
|----------|--------|-------|
| Branch Verification | ✅ Passing | Build + all test gates pass |
| Type Check | ✅ Passing | |
| CI (typecheck + security + domain + intake + signal-engine) | ❌ Failing | `env-check` job fails — 5 GitHub Actions secrets unset |
| CI (smoke + build) | ⏭ Skipped | Blocked by env-check failure |
| Marketplace Category Pages Verification | ✅ Passing | |
| Production Route Audit | ✅ Passing | |
| Production Runtime Verification | ❌ Failing | Production endpoint probing fails |
| post-merge-verification | ❌ Failing | `HARBOURVIEW_PUBLIC_BASE_URL` unset as repo variable |
| sync-figma-tokens | ❌ Failing | `FIGMA_TOKEN` secret not configured |

**To restore full CI green, TY must add to GitHub Actions Secrets:**
- `HF_TOKEN_SERVER` — HF server-side token
- `GEMINI_API_KEY` — Gemini 2.5 Flash key
- `HARBOURVIEW_EDGE_OPERATOR_SECRET` — operator verify route secret
- `CRON_SECRET` — cron auth bearer
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key

---

## Open PRs

| PR | Title | Status |
|----|-------|--------|
| #904 | Deal rooms + signal digest bridge + HubPanel | Needs: verification |
| #903 | bump @tanstack/react-query 5.101.2 | Safe, auto-merge |
| #902 | bump @opennextjs/cloudflare 1.20.1 | Safe, auto-merge |
| #901 | bump lucide-react 1.22.0 (minor) | Safe |
| #900 | bump sonner 2.0.7 (major ⚠) | Review before merging |
| #899 | bump eslint 10.6.0 (minor) | Safe |
| #898 | bump postcss 8.5.16 | Safe |

---

## Outstanding Infrastructure

| Item | Action |
|------|--------|
| v2 intelligence worker host | Choose Fly.io or Railway — `Dockerfile.worker` ready |
| `FIGMA_TOKEN` secret | Add to GitHub Actions or disable `sync-figma-tokens` workflow |
| `HARBOURVIEW_PUBLIC_BASE_URL` | Set as GitHub Actions repo variable for post-merge probe |
| Vercel env vars | `GEMINI_API_KEY`, `HF_TOKEN_SERVER`, `HARBOURVIEW_EDGE_OPERATOR_SECRET`, `CRON_SECRET` — set in Vercel dashboard |

---

## Key Architecture Facts

- **Supabase project**: `zvxdgdkukjrrwamdpqrg` (locked in `lib/supabase/env.ts`)
- **Vercel project**: `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS` / team `team_0rK4jTvMLlSufR0ZzX4LCKYi`
- **Nightly cron schedule**: 02:00 ingest → 04:00 extract → 06:00 embed → 07:00 notify → 08:00 scrape → 12:00 regulatory-watch
- **Intelligence models**: Gemini 2.5 Flash (primary) → Claude Haiku 4.5 (fallback)
- **Image origins**: locked to `zvxdgdkukjrrwamdpqrg.supabase.co/storage/v1/object/**` only
