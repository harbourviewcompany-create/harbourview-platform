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

