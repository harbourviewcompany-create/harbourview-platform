## Session: Jun 22 2026

### Agent: Claude (Sonnet 4.6)

### Built this session — PR triage, data seeding, open PR cleanup

| Action | PR | Detail |
|---|---|---|
| Merged #794 (globe test) | ✅ merged | Russia winding regression test — was draft, marked ready, merged |
| Rebased + merged #795 | ✅ merged | Genetics query column names, HubPanel DealBoard columns, orchestrator cadence comment — 1 trivial conflict resolved |
| Rebased + merged #787 | ✅ merged | Sources registry 348 → 516 (+168 sources globally) — was draft, marked ready, merged |
| Cherry-picked + merged #797 | ✅ merged | 193-country cannabis briefings (6 migration batches) + education CPD fields + drug_interaction_reference claim type. PR #765 (original branch) had 2746 unique commits from fork — cherry-pick was only viable strategy |
| Seeded genetics directory | ✅ merged #798 | 12 cultivar passports, 6 genetics profiles, 10 country opportunities, 6 service providers — `cultivar_passports` was 0 rows per Jun 21 snapshot |
| Closed stale #765 | ✅ closed | Its content fully in via #797; explained in closing comment |

### Data snapshot after this session

| Table | Before | After |
|---|---|---|
| `jurisdiction_briefings` | ~20 (active markets only) | ~213 (193 UN member states seeded) |
| `cultivar_passports` | 0 | 12 public passports |
| `genetics_profiles` | 0 | 6 breeder entities |
| `cultivar_country_opportunities` | 0 | 10 cross-market listings |
| `genetics_service_providers` | 0 | 6 public service listings |
| `source_registry` sources | 348 | 516 (+168) |
| `education_modules` cpd fields | missing | added (cpd_accreditation_body, cpd_credit_hours, cpd_jurisdiction) |

### Open PRs remaining

| PR | Branch | State | Action |
|---|---|---|---|
| #733 | lucide-react 0.x→1.18 | open | 🔴 HOLD — major icon API rewrite |
| #732 | vitest 2→4 | open | 🔴 HOLD — major breaking API changes |
| #726 | tailwindcss 3→4 | open | 🔴 HOLD — major, breaks design system |
| #724 | eslint 9→10 | open | 🔴 HOLD — major, breaking rule changes |

All four remaining open PRs are held major-version Dependabot bumps. Nothing actionable without dedicated upgrade work.

### Blockers (carried, unchanged this session)

| Blocker | Severity |
|---|---|
| Supabase Preview CI (`Remote migration versions not found`) | 🔴 P0 |
| Workers Build (Cloudflare) failing | 🟡 P1 |
| Google Cloud Build (×2) failing | 🟡 P1 |

### Next priorities

1. **Fix Supabase migration drift** — still the P0 blocker for the preview pipeline.
2. **Diagnose Cloudflare Workers Build** — failing on main since Jun 18.
3. **Admin review UI for pending `hv_professionals` / `supplier_profiles`** — applications land as `status:'pending'` with no dedicated admin list/approve view yet.
4. **Watchlist rule-builder UI** — `cc_watch_rules` has 2 rows, no UI to manage them.
5. **Merge the 4 held major Dependabot bumps** when there's a dedicated upgrade session.

---

## Session: Jun 21 2026

### Agent: Claude (Sonnet 4.6)

### Built this session — depth pass, "what's thin" follow-through

Continuation of the Jun 19 depth pass. User asked "what's thin and needs more work," then worked through the list one item at a time with verification after each merge (CI green + Vercel production deploy confirmed `READY` before moving on, not just PR-merged).

| Feature | PR | What shipped |
|---|---|---|
| Education hub live data | #756 | `/education` now renders the 12 real published `education_modules` rows grouped by track, replacing a hardcoded 6-card placeholder. New `/education/modules/[slug]` detail route. New `lib/server/educationModulesQuery.ts`. |
| Counterparty mutations | #766 | Admin `ia_counterparties` page could only list 12 seeded rows — no create, no interaction logging. Added `createIaCounterparty`, `logIaCounterpartyInteraction`, two API routes, `CounterpartyActions.tsx` (AddCounterpartyForm, LogInteractionButton). |
| Counterparty doc-status | #767 | Closed out a half-built piece from #766 — `updateIaCounterpartyDocumentationStatus` existed in `db.ts` with no route/UI. Added `DocStatusSelect` dropdown, extended the PATCH route to branch on which field is present. |
| Depth pass (merged, written previous session) | #759 | Playbook detail pages (`/intelligence/playbooks/[country]`), admin on-demand briefing synthesis trigger, professional directory application flow (`/professionals/apply`). Was sitting open since Jun 19 — merged this session after confirming CI clean. |
| Watchlist remove action | #769 | `cc_watchlist_items` could be added but never removed — RLS already had a member-scoped delete policy, the UI just never called it. Added `handleRemove` with optimistic local state + rollback. |

### Important correction made mid-session

Initially flagged `/intelligence/counterparty-intelligence` (public) as "thin" — it is **not**. It's a deliberate privacy boundary: the page explicitly states no private counterparty data is published there, and `ia_counterparties` RLS confirmed admin/operator-only access. The real gap was on the **admin side** (no mutation UI), not the public side. Caught this before wiring live data into the public page, which would have leaked private CRM-style data (interaction counts, notes) to the open internet.

Same pattern held for Watchlists: `/intelligence/watchlists` (public) is a correct static description; the real feature lives in the authenticated dashboard (`WatchlistPage.tsx`, workspace-scoped via `cc_watchlist_items`), which was already mostly built — just missing the remove action.

**Lesson for future sessions**: before wiring a "thin" public page to live data, check RLS first. If a table is admin/operator-gated or workspace-member-gated, the public page being static is correct design, not a bug — the gap is almost always inside the authenticated/admin surface instead.

### Process note: production verification

Early in this session, PRs were merged based on CI passing (`tsc --noEmit`, `verify`) without confirming the actual Vercel production deployment reached `READY`. Corrected after the user asked "did you miss anything" — every merge from #766 onward was followed by polling `Vercel:get_deployment` until `READY` before reporting completion. This should be the standing practice going forward, not just for this session.

### Known gaps, explicitly not fixed (flagged, not silently dropped)

- **Counterparties**: no edit or delete for existing rows (only create + log-interaction + doc-status). `markets` field is free text — no normalization against `country_intel` country codes/names, so "Germany" / "germany" / "DE" could all exist as different values across rows.
- **Watchlists**: `cc_watch_rules` (2 seeded rows) are fetched into `watchlistData.rules` but never rendered or manageable — only the count appears in the header subtitle. Needs a rule-builder UI, not just a wiring fix. Bigger scope, deferred.
- **Education**: `education_modules.audience` enum (`doctor_prescriber`, `clinic_healthcare_operator`, etc.) doesn't match `EducationRole` in `lib/education/country-role.ts` (`doctor`, `clinic`, etc.) — two taxonomies that have drifted apart. Added a local `AUDIENCE_LABELS` map scoped to the new query file rather than reconciling system-wide.
- **"Enforce registry impact discipline" check**: intermittently failed even when the PR body satisfied every condition in `scripts/check-project-registry-discipline.mjs` by direct simulation. Job logs are hosted on an Azure blob host (`productionresultssa*.blob.core.windows.net`) not in the network egress allowlist — could not diagnose root cause. Not a required status check, so doesn't block merges, but worth either fixing, removing, or allowlisting the log host so a future session can actually debug it.

### Still-thin surfaces not yet touched

- **Genetics** (`/genetics`, `/genetics/cultivars`) — `hv_passports`, `hv_claims`, `hv_licences`, `genetics_routing_records` all still 0 rows. Stale Codex branches exist for cultivar passport network; never merged.
- **Logistics & trade routes** (`/intelligence/logistics-trade-routes`) — static `IntelligenceModulePage` wrapper, not yet audited for an authenticated/admin equivalent the way counterparties and watchlists had one.
- **Licensing pathways** (`/intelligence/licensing-pathways`) — same wrapper pattern, likely duplicates Access Pathways; not yet audited.
- **Supplier directory** (`/supplier-directory`) — `supplier_profiles` = 0 rows, no intake flow found yet (unlike professionals, which now has one via #759).
- **Deal rooms** (`/marketplace/deals`) — built (#744) but `deal_rooms` = 0 rows; functional, just unused so far. Not a code gap, an adoption gap.

### Current data snapshot (Jun 21, end of session)

| Table | Rows |
|---|---|
| `education_modules` | 12 |
| `ia_counterparties` | 12 |
| `cc_watchlist_items` | 6 |
| `signal_subscriptions` | 4 (up from 0 — feature is being used) |
| `cc_watch_rules` | 2 |
| `hv_professionals` | 0 (apply flow just merged, expected) |
| `supplier_profiles` | 0 |
| `deal_rooms` | 0 |
| `hv_passports` / `hv_claims` / `hv_licences` / `genetics_routing_records` | 0 |

---

# HANDOFF.md — Harbourview Session Log

> **Protocol**: Updated at the end of every session by whichever agent last touched the repo.  
> **Purpose**: Single source of truth for session-to-session continuity. Read this first.  
> **Format**: Most recent session at top.

---

## Session: Jun 19 2026

### Agent: Claude (Sonnet 4.6)

### Built this session — depth pass on thin surfaces (PR #759, branch `claude/depth-pass-jun18`)

Audited the full repo tree for shallow/incomplete public surfaces (per Tyler's "review what's thin, build it deeper" request). Found three with dead-end CTAs or missing detail views, built all three, then ran real verification commands rather than just listing them.

| Feature | Route / File | Status |
|---|---|---|
| Standalone playbook detail page | `app/intelligence/playbooks/[country]/page.tsx` — full step timeline (visual Gantt bar), regulator cards, pitfalls, embedded current briefing | ✅ PR #759 open |
| Playbooks index now links to detail page | `app/intelligence/playbooks/page.tsx` — card `href` changed from country drilldown detour to `/intelligence/playbooks/[iso2]` | ✅ PR #759 open |
| Admin: on-demand briefing synthesis | `app/admin/(protected)/intelligence/briefings/page.tsx` + `app/api/admin/intelligence/synthesize-trigger/route.ts` — per-market + bulk "Synthesise All", reuses `synthesiseJurisdiction()` and `getAdminAuthCheck()` | ✅ PR #759 open |
| Professional directory application flow | `app/professionals/apply/page.tsx` + `ProfessionalApplicationForm.tsx` + `app/actions/submitProfessionalApplication.ts` | ✅ PR #759 open |
| Fixed professionals directory CTAs | `app/professionals/page.tsx`, `app/professionals/[slug]/page.tsx` — "Apply to Join" was pointing at `/intake` (marketplace listing form, wrong context); now points to `/professionals/apply` | ✅ PR #759 open |

### Verification (actually run, not just listed)

- `npm install` — 799 packages, clean install
- `npm run typecheck` — caught **one real bug**: `TS2783` duplicate `ok` key in `synthesize-trigger/route.ts` (`{ ok: result.ok, iso2, ...result }` — the spread silently overwrote the explicit key). Fixed, pushed as follow-up commit, now passes clean.
- `npm run lint` — zero warnings on any new file; all pre-existing warnings are on untouched files
- `npm run build` — succeeds, zero errors. All 4 new routes present in route manifest.

### Schema verification before writing queries

Before inserting into `hv_professionals`, fetched the actual migration (`20260618163726_hv_professionals.sql`) and found the server action's first draft would have failed: no `contact_email` column exists, and `status` column defaults to `'active'` (not `'pending'`) — would have made unreviewed applications publicly visible immediately. Fixed before pushing: contact email folded into `bio_public` with a marker, `status: 'pending'` set explicitly on insert.

### Security note

⚠️ A GitHub fine-grained PAT was pasted in plaintext into the chat at the start of this session. It was used for this session's work since it was already exposed, but **should be rotated** — same recurring issue noted in prior sessions re: GitHub secret scanning auto-revoking exposed PATs.

### Current Blockers (carried over, unchanged this session)

| Blocker | Severity | Detail |
|---|---|---|
| Supabase Preview CI | 🔴 P0 | `Remote migration versions not found in local migrations directory` — migrations applied directly to `zvxdgdkukjrrwamdpqrg` without corresponding files in `supabase/migrations/`. Confirmed this session: `jurisdiction_playbooks` table creation migration was **not found** in the tree at all (only `hv_professionals` and `jurisdiction_briefings` have matching migration files). Breaks branch-level preview pipeline until reconciled. |
| production-runtime-verification | 🔴 P0 | Failing on every merge (carried from Jun 18). Not investigated this session — scope was the depth pass only. |
| Workers Build (Cloudflare) | 🟡 P1 | Carried from Jun 18, not investigated. |
| Google Cloud Build (×2) | 🟡 P1 | Carried from Jun 18, not investigated. |

### Open PRs — Status

PR #759 (this session) is new and ready for review/merge — build/typecheck/lint all verified clean.

All PR statuses from the Jun 18 session (#737, #720, #729, #728, #695, #723, #738, #722, #725, #724, #726, #732, #733) carry over unchanged — not touched this session.

---

## Proposed Next Priorities

> Tyler to confirm, reorder, or replace before next session starts.

1. **Merge PR #759** — depth pass on playbooks/briefings/professionals, fully verified (typecheck/lint/build all pass).
2. **Reconcile `jurisdiction_playbooks` migration drift** — table exists in prod, seeded with 20 markets, but has no file in `supabase/migrations/`. Same root cause as the existing Supabase Preview CI P0; should be fixed together via `supabase db diff` against `zvxdgdkukjrrwamdpqrg`.
3. **Fix Supabase migration drift generally** — unchanged from Jun 18 priority #1, still blocking preview pipeline and PR #729.
4. **Diagnose production-runtime-verification** — unchanged from Jun 18 priority #2.
5. **Rebase #737 and #720** — unchanged from Jun 18 priority #3.
6. **Merge safe Dependabot PRs** — #723, #738 unchanged from Jun 18 priority #4.
7. **Close #695** — unchanged from Jun 18 priority #5.
8. **Branch cleanup** — unchanged from Jun 18 priority #6.
9. **New from this session**: build out admin review UI for pending `hv_professionals` rows (currently land as `status: 'pending'` with no dedicated admin list/approve view — would need to be added to `/admin/candidates` or a new `/admin/professionals` page to actually close the loop on applications).

---

## Platform State Snapshot — Jun 19 2026

| Area | State |
|---|---|
| Vercel production | ✅ READY — unchanged from Jun 18 (`fe223c4f`), PR #759 not yet merged |
| TypeScript | ✅ Clean on `main` and on `claude/depth-pass-jun18` branch (post-fix) |
| Supabase `zvxdgdkukjrrwamdpqrg` | ✅ Live — migration drift confirmed on `jurisdiction_playbooks` in addition to prior known drift |
| Playbooks | ✅ Now has standalone detail pages (pending PR #759 merge) |
| Jurisdiction briefings | ✅ Now has on-demand admin trigger in addition to weekly cron (pending PR #759 merge) |
| Professionals directory | 🟡 Apply flow built (pending PR #759 merge); still needs admin review UI for pending applications |
| Deal rooms | ✅ Unchanged from Jun 18 — table + real-time conversation UI |
| HF Inference Endpoint | ⏸ Parked — unchanged from Jun 18 |

---

## Session Protocol

At the end of every session, the active agent:
1. Prepends a new `## Session: [date]` block above this one
2. Lists what was built (PR numbers where applicable)
3. Lists current blockers with severity
4. Lists open PR status changes
5. Proposes next priorities

Tyler confirms/edits the "Next priorities" section before or at the start of the next session.

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
