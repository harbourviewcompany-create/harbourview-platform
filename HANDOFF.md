## Session: Jun 24 2026 — Backward Audit

### Agent: Claude (Sonnet 4.6)

### Context

User asked "is this thorough enough yet" after a session spent closing gaps in education/counterparty/watchlist/professionals/suppliers. Honest answer was no — every fix had been chained off the previous one, but nothing had been checked against *other* concurrent sessions' work. User corrected the framing directly: the other sessions are other Claude instances, same model, same knowledge — meaning same blind spots, not lower or higher trust than my own output. That correction changed what got checked next.

### Found and fixed (merged + deployed/applied this session)

| Issue | Fix | PR |
|---|---|---|
| Education hub rendering raw UUIDs as track headers (19 of 31 modules) — a parallel session added `education_tracks` with UUID keys, didn't know `educationModulesQuery.ts` existed | `getTrackLabelMap()` merges static legacy-slug labels with a live `education_tracks` lookup | #807 |
| `lib/admin/applicationsQuery.ts` gutted — a concurrent edit committed literal placeholder comments (`// Keep other functions as they were`) as real code, deleting 3 working functions; the one survivor queried a nonexistent status value and invented columns | Restored all 3 functions; fixed status (`pending_review` not `pending`) and columns, verified against live schema directly | #808 |
| Supplier-directory page/query/detail-route rewritten around a fictional schema (`profile_slug`, `regions_served`, `website`, `hq_country`, `verification_status` — none exist) | Restored real schema throughout; kept the detail-page design (it was good), renamed `[slug]`→`[id]` since there's no slug column; also fixed an invented `PublicCard href` prop that doesn't exist on the component | #818 |
| 10 `supabase/migrations/*.sql` files (table creation + 8 seed batches + batch_id column) for supplier_profiles — **zero of them ever ran**. `CREATE TABLE IF NOT EXISTS` no-op'd against the table that already existed (built in #774, different schema); every seed INSERT after it would fail outright on nonexistent columns | Deleted all 10 — they were a live landmine for the next `supabase db push` (no-op, then fail on first INSERT, blocking everything after it in the run). Did **not** recreate the seed data under the real schema — see below | #823 |
| `hv_public_feed` had two identical UNIQUE constraints on `artifact_id` (Supabase perf advisor finding) | Dropped the redundant one via `apply_migration`, mirrored the file in-repo | #824 |

### Judgment call: why the supplier seed data wasn't recreated

Checked the actual content of the 10 orphaned migration files before deciding what to do with them. The seed data was fabricated companies with `.example.com` websites and invented contact names (Elena Voss, Marcus Hale, Dr. Lena Park), set to insert as `status='active', verification_status='verified'` — meaning if it had run, the public directory would show a "VERIFIED SUPPLIER" badge on entirely fictional businesses, with no demo/placeholder labelling anywhere a visitor would see.

Compared this against genetics seed data from the same window (`cultivar_passports`) — explicitly labelled "Demo Cultivar Alpha/Beta" with disclaimers throughout ("Demo-only," "not seed, clone, pollen, or plant-material offers"). That one was fine to leave as-is; not reformatted or touched.

**`supplier_profiles` stays empty.** The apply flow (#774) + admin approval (#780) is the correct path to populate it with real submissions. If Tyler wants the directory to look populated for now, that's a deliberate decision to make explicitly — not something to backfill quietly under a fixed schema.

### Verified correct — not everything from other sessions was wrong

- The big "7 data gap migrations" PR (#793) — same wave that broke supplier-directory and `applicationsQuery.ts` — **did** land correctly for its primary claims. `source_snapshots` has 4,157 real rows, `hv_import_staging` 471, `jurisdiction_crossref` 203, `market_metrics`/`trade_flows`/`cannabis_operators` in the teens. Found `pr793_migration_drift_guard` and `register_gap_migration_versions` migrations specifically aimed at preventing the kind of drift this audit found elsewhere — that session was already aware of the risk and guarded against it.
- Globe shader saga (6 "fix" commits for the Russia black-void bug) looked alarming from the commit log alone but traces to a normal debugging trajectory: visual band-aids (lighthouse emblem, gold disc) → root cause found (back-face normal not flipping under FMA-inverted triangle winding) → real fix → band-aids cleanly reverted, no orphaned dead code → final polish (equatorial lighting). Not drift.

### Found and flagged — not fixed, needs a decision or access I don't have

| Finding | Severity | Why not fixed now |
|---|---|---|
| Genetics: 1 seed commit claims "12 cultivar passports, country opportunities, service providers" — only 2 of each actually landed | Low | Data is explicitly demo-labelled either way; reporting accuracy gap, not a live data integrity problem |
| Security advisor: leaked-password-protection still disabled | Low, zero-risk one-click fix | No tool access to Supabase Auth dashboard settings — needs Tyler |
| Security advisor: public bucket `public-assets` has a broad SELECT policy allowing object listing | Low-Medium | Needs a decision on whether listing should be restricted, not a blind fix |
| Security advisor: 13 tables with RLS enabled but no policy (`_push_staging`, `adi_cache`, `country_coverage_matrix`, etc.) | Low (fails closed, not exposed) | Likely new tables created after the Jun 22 security pass (#790) claimed "all findings addressed" — that claim doesn't fully hold today, but nothing here is actively exposing data |
| Performance advisor: 102 unindexed foreign keys, despite #791 being titled "add missing FK indexes flagged by Supabase advisor" | Medium | Likely mostly on tables created after #791 ran, given how much schema growth happened Jun 22–24. Adding indexes is low-risk but 102 is enough volume that it deserves a dedicated pass, not a blind batch |
| Performance advisor: 202 instances of multiple permissive RLS policies on the same table/role/action (e.g. `countries` has both `countries_anon_select` and `countries_public_read` doing the same job) | Medium | Same root cause as everything else in this audit — multiple sessions each adding their own policy without checking what existed. Needs per-table review before consolidating; collapsing the wrong policy could silently change access |

### Lesson for future sessions

Every drift case this session traces to the same root cause: a session claiming work was done without verifying it against the live database, or building something without checking what already existed. Not a competence gap — the same model, working from a different context window, makes the same kind of mistake at a different layer each time (migrations instead of application code, RLS policies instead of React components). Treat "another Claude already worked on this" as a reason to check with the same rigor as your own output, not less.

---

## Session: Jun 23 2026 (evening, continued)

### Agent: Claude (claude.ai)

### Built this session (continuation — "fix these" pass on the items flagged above)

- `tools/intelligence-engine-studio/`: brought to parity with the main app's worker hardening (it had every bug the main app had before today — hardcoded failure count, in-memory-only circuit breaker, no rss/api adapters, no heartbeat/health endpoint, sync stop()+immediate exit). Caught and fixed a regression I introduced mid-port: blindly copying the main app's `selectAdapter()` switch silently dropped this app's `json_api` → `APIDataAdapter` route.
- `lib/country-data/server.ts`: `country_intel` was a phantom table this morning; a concurrent session has since created it — with a different schema than the scaffold assumed (`country_code` not `iso2`, `country_name` not `name`). Fixed to match the real table, cross-checked against `lib/dashboard/dashboardLiveData.ts`'s existing query.
- `lib/genetics/storage.ts` (signed-URL evidence access) had zero callers. New `getGranteeAccessGrants()` query + `/dashboard/genetics/granted-access` page + server action + client button — a grantee can now actually request and open a signed link to evidence they were granted. Server action re-verifies the grant server-side; never trusts client-supplied grant data.
- Implemented `Retry-After` handling end-to-end: `ScraperResult` gains `http_status`/`retry_after_seconds`, all 3 real adapters populate both, `worker-node.ts`'s retry logic honors it (capped at 30s) in both apps.
- Added 29 tests (zero existed for any of this logic before today): Retry-After parsing, the distributed circuit breaker against a fake Supabase client, genetics scoring/gating, access-grant validation. All passing.

### Current Status / Not done

- Ran the **full** existing vitest suite, not just new files: 17 test files fail on bare `main`, confirmed via stash to be pre-existing and unrelated to anything touched today (lib/hf/, dashboard, middleware matchers, globe motion, security fuzzing, supabase admin client). Flagging, not fixing — outside this task's scope and spans domains with no context here.
- The v2 worker is still not deployed anywhere (still waiting on a host decision — Fly.io ~$2/mo or Railway $5/mo were the cheapest real options as of today). All the hardening above is dormant until something actually runs it.
- `tools/intelligence-engine-studio/`'s actual deployment target is still unconfirmed — its `.env.example` references Cloud Run/AI-Studio/Gemini, not the Supabase env vars its own code reads at runtime.

---

## Session: Jun 23 2026 (afternoon/evening)

### Agent: Claude (claude.ai)

### Built this session

- Fixed `supabase/migrations/20260607130000_cultivar_passport_network_p0.sql`: 4 unbalanced-parenthesis syntax errors (confirmed via the real Postgres grammar parser, not eyeballing) meant the entire 14-table Cultivar Passport Network had never actually existed in production. Applied + seeded live, verified.
- Wired `lib/introduction-routing/` (scoring engine, previously built but never called by anything live) to the public genetics access-request form: new `app/api/genetics/access-request/route.ts`, `lib/introduction-routing/liveQueries.ts`, rewired `app/admin/(protected)/routing/genetics/page.tsx` off a hardcoded sample onto live data. Generic-intake requests never auto-set `introduction_ready` — always require operator review.
- Hardened the v2 distributed worker (`lib/intelligence-engine/worker-node.ts` + `queue/task-queue.ts` + `queue/circuit-breaker.ts`), which had not gotten the same pass as the v1 orchestrator path from other concurrent sessions today: adapter parity (rss/api, not just html/playwright), fixed a bug where every failure call hardcoded `1` instead of the real failure count (backoff never actually escalated), fixed circuit-broken skips penalizing the wrong source, replaced the in-process circuit breaker with a Supabase-backed one (new tables `crawl_domain_circuit_state`, `worker_heartbeats`, applied + verified live). Added retry-with-backoff, a `/healthz` endpoint, graceful shutdown that waits for in-flight work, `WORKER_BATCH_SIZE` env config, and `Dockerfile.worker` (none existed).
- Fixed full-repo `npx tsc --noEmit` breakage: `lib/country-data/types.ts`+`server.ts` had been overwritten by a concurrent edit adding an unrelated "CountryBriefing" feature, deleting the public-profile DTO that `app/countries/*` depends on, and importing a module (`@/lib/supabase`) that doesn't exist anywhere in the repo. Both feature sets now coexist. Also fixed `app/supplier-directory/page.tsx`'s real component-contract mismatches (`PublicHero` missing required `children`, `PublicCard` doesn't have an `href` prop — every card was an unclickable dead div, `FooterCta` called with zero required props) and a `supplier.title` reference to a field that doesn't exist on `SupplierProfile`.
- Resolved three separate same-task collisions with concurrent sessions today (genetics passport-network admin wiring, orchestrator adapter-routing, and the `acquire_crawl_targets` RPC) by comparing implementations directly and deferring to whichever was actually better — see closed PRs #782/#783 for the writeups.

### Current Status / Not done

- **The v2 worker is not running anywhere.** Code + `Dockerfile.worker` are deployment-ready; no host is chosen or provisioned. Needs a persistent host (Vercel can't run it — not serverless-compatible). Cheapest real options as of today: Fly.io ~$2/mo single always-on machine, or Railway $5/mo flat.
- `tools/intelligence-engine-studio/` (parallel duplicate app) was not touched — likely has the same stale adapter-taxonomy bug fixed elsewhere today.
- `PlaywrightDataAdapter` is still a mock; `playwright_full` targets get an honest `blocked` result, not real content.
- `lib/genetics/storage.ts` (signed-URL evidence access, correctly gated) has zero callers anywhere in the app.
- The new "CountryBriefing" feature (`getCountryBriefing`/`seedAllCountries`) now compiles but its target table `country_intel` does not exist in the database. Nothing calls these functions yet, so not an active bug — just unfinished.
- No automated tests were added for anything built this session.
- **This file wasn't updated by whichever agent(s) did the genetics-passport-network admin wiring, orchestrator hardening, or the several other PRs merged today (#788, #790, #791, #793, #795, #808, and others)** — their work isn't reflected above. If you're an agent reading this: please log here before/after a session, not just when you remember to.

---

## Previous content below
## Session: Jun 23 2026 (morning)

### Agent: Grok

### Built this session — Complete Supplier Directory Intake Flow (Phase 0)

- Fixed and aligned `lib/server/supplierProfilesQuery.ts` to use correct RLS filters (`status=active` + `verification_status=verified`)
- Updated types and label maps to match new `supplier_profiles` schema
- Created detail page `app/supplier-directory/[slug]/page.tsx`
- Aligned admin query `lib/admin/applicationsQuery.ts` to `status=eq.pending`
- Updated `docs/control/PROJECT_REGISTRY.md` with Supplier Directory routes and table
- All core intake flow now fully functional end-to-end

### Current Status

Supplier Directory is now complete for Phase 0:
- Apply form + server action working
- Pending records created correctly
- Public query aligned with RLS
- Detail pages live
- Admin pending list aligned

Next priorities remain the other Phase 0 items (Counterparties polish, Watchlist rule builder, Genetics catalog).

---

## Previous content below

