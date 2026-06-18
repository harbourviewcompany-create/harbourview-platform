# HANDOFF.md — Harbourview Session Log

> **Protocol**: Updated at the end of every session by whichever agent last touched the repo.  
> **Purpose**: Single source of truth for session-to-session continuity. Read this first.  
> **Format**: Most recent session at top.

---

## Session: Jun 18 2026

### Agent: Claude (Sonnet 4.6)

### Built this session

| Feature | Route / File | Status |
|---|---|---|
| Dashboard auth gate | `middleware.ts` → `/dashboard` added to PROTECTED_PREFIXES | ✅ Merged #746 |
| Marketplace tuple fix | `app/dashboard/page.tsx` → `mapListingToDashboardRow` index alignment | ✅ Merged #746 |
| Dead link fixes | `CommandCentre.tsx` jurisdiction href, `EvidencePage.tsx` methodology link | ✅ Merged #746 |
| Mobile CC tappable cards | `MobileCommandCentre.tsx` → internal drill-down, no outbound navigation | ✅ Merged #745 |
| Mobile CC header removal | Wordmark header removed, Context button folded into sticky titlebar | ✅ Merged #745 |
| Field label humanisation | `FIELD_LABELS` map — raw DB enums rendered as human strings | ✅ Merged #745 |
| Playbooks | `jurisdiction_playbooks` table, `/intelligence/playbooks`, 20 markets seeded | ✅ Merged #744 |
| Professionals directory | `hv_professionals` table, `/professionals`, `/professionals/[slug]` | ✅ Merged #744 |
| Deal rooms | `deal_rooms` table, `/marketplace/deals`, `/marketplace/deals/[id]`, real-time sub | ✅ Merged #744 |
| Listing deal room entry | `/marketplace/deals/new` redirect + "Open private deal room" CTA on listing | ✅ Merged #744 |
| AI jurisdiction briefings | `jurisdiction_briefings` table, synthesis pipeline, weekly cron (Mon 03:00 UTC) | ✅ Merged #744 |
| Markets live index | `/markets` — 20-country grid, live briefings, "Briefing pending" state | ✅ Merged #744 |
| Markets nav wiring | Desktop Intelligence dropdown + mobile nav links | ✅ Merged #744 |
| Signals subscribe button | Desktop SignalsPage + mobile SignalsMobile → POST/DELETE `/api/signals/subscribe` | ✅ Merged #744 |
| RLS hardening (Gate 9) | `_push_staging` RLS enabled, anon EXECUTE revoked on 2 RPCs, `search_path` pinned on 35 functions | ✅ Merged #744 |
| BGE-M3 embeddings | Curated signals corpus embedded, cron schedule tidied | ✅ Merged (Jun 17) |
| Market graph API | `GET /api/intelligence/graph`, graph traversal layer, wired to country intel page | ✅ Merged (Jun 17) |
| Country signals tab | Live curated signals table wired to dashboard country signals tab | ✅ Merged (Jun 17) |
| Intelligence pipeline repair | extract → artifact → embed pipeline closed | ✅ Merged (Jun 17) |
| Live signals feed | `GET /api/dashboard/signals`, `SignalsPage` wired to live feed | ✅ Merged (Jun 17) |

### Current Blockers

| Blocker | Severity | Detail |
|---|---|---|
| Supabase Preview CI | 🔴 P0 | `Remote migration versions not found in local migrations directory` — migrations were applied directly to `zvxdgdkukjrrwamdpqrg` without corresponding files in `supabase/migrations/`. Breaks branch-level preview pipeline permanently until reconciled. |
| production-runtime-verification | 🔴 P0 | Failing on every merge today (4 consecutive failures). Log blob hosted on Azure (not in egress allowlist). Need to run verification script manually against production to identify failing checks. |
| Workers Build (Cloudflare) | 🟡 P1 | `harbourview-platform` Cloudflare Worker failing. Likely related to migration drift or build config. |
| Google Cloud Build (×2) | 🟡 P1 | Two Supabase preview GCB triggers failing — likely downstream of migration drift. |

### Open PRs — Status

| PR | Title | State | Action |
|---|---|---|---|
| #737 | feat/commandcentre-live-data | dirty (merge conflict) | Needs rebase — 2 files, -652 net |
| #720 | fix/cc-jurisdiction-mobile-routes | dirty (merge conflict) | Needs rebase — +1199/-3 |
| #729 | feat/expand-country-flags | blocked (CI) | 1 file +4 lines — clears once migration drift fixed |
| #728 | Vercel RSC CVE fix | open | Review and merge — security patch |
| #695 | fix/static-review-blockers | unknown (Jun 11, stale) | Audit before touching — likely superseded |
| #723 | stripe 22.2.0→22.2.1 | open | ✅ Safe to merge (patch) |
| #738 | wrangler 4.100→4.101 | open | ✅ Safe to merge (patch) |
| #722 | @types/three 0.174→0.184 | open | 🟡 Minor — check Three.js API surface |
| #725 | @supabase/ssr 0.10.3→0.12.0 | open | 🟡 Minor — check auth cookie changes |
| #724 | eslint 9→10 | open | 🔴 HOLD — major, breaking rule changes |
| #726 | tailwindcss 3→4 | open | 🔴 HOLD — major, breaks design system |
| #732 | vitest 2→4 | open | 🔴 HOLD — major, breaking API changes |
| #733 | lucide-react 0.x→1.18 | open | 🔴 HOLD — major, icon API rewrite |

### Stale Branches (no open PR)

39 stale branches. Key ones to delete: `claude/zealous-gates-68ziia` (all merged via #744/#745/#746).  
Codex branches without PRs: 10 branches — need dispatch review before deletion.  
HF branches (`feat/hf-*`): parked pending Ticket 7 (live HF Inference Endpoint).

---

## Proposed Next Priorities

> Tyler to confirm, reorder, or replace before next session starts.

1. **Fix Supabase migration drift** — identify which migrations are in the DB but not in `supabase/migrations/`. Write the missing files (or generate via `supabase db diff`). This unblocks the preview pipeline and clears #729.
2. **Diagnose production-runtime-verification** — run `scripts/production-runtime-verification.mjs` manually to identify which checks are failing. Fix the failing routes/endpoints.
3. **Rebase #737 and #720** — clear dirty state, re-check CI, merge.
4. **Merge safe Dependabot PRs** — #723, #738 (patches), evaluate #722 and #725.
5. **Close #695** — 7 days stale, audit whether any of its content survived recent merges, then close.
6. **Branch cleanup** — delete `claude/zealous-gates-68ziia` + stale codex branches after dispatch review.

---

## Platform State Snapshot — Jun 18 2026

| Area | State |
|---|---|
| Vercel production | ✅ READY — `fe223c4f` deployed |
| TypeScript | ✅ Clean (`tsc --noEmit` pass) |
| Supabase `zvxdgdkukjrrwamdpqrg` | ✅ Live — migration drift in CI only (prod DB is ahead of migrations dir) |
| Globe | ✅ Stable |
| Dashboard (desktop) | ✅ Auth-gated, live signals, live marketplace, country tabs wired |
| Mobile Command Centre | ✅ Tappable cards, internal drill-down, humanised field labels |
| Marketplace | ✅ 93 listings, inquiry pipeline, image trust layer |
| Intelligence signals | ✅ 803 signals, live feed, subscribe/unsubscribe, BGE-M3 embeddings |
| Market graph | ✅ API + country intelligence page wired |
| Jurisdiction briefings | ✅ Synthesis pipeline + weekly cron |
| Playbooks | ✅ 20 markets seeded |
| Professionals directory | ✅ Table + routes (empty state — needs real data) |
| Deal rooms | ✅ Table + real-time conversation UI |
| HF Inference Endpoint | ⏸ Parked — Ticket 7 blocked pending live endpoint |

---

## Session Protocol

At the end of every session, the active agent:
1. Prepends a new `## Session: [date]` block above this one
2. Lists what was built (PR numbers where applicable)
3. Lists current blockers with severity
4. Lists open PR status changes
5. Proposes next priorities

Tyler confirms/edits the "Next priorities" section before or at the start of the next session.
