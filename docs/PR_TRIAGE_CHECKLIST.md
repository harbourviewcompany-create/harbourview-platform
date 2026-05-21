# PR Triage Checklist — May 20, 2026

> Generated via MCP cross-reference scan (Notion + Linear + GitHub)

## Summary

| Category | Count | Action |
|----------|-------|--------|
| Security (Priority 1) | 8 | Merge immediately |
| Supabase Hardening | 3 | Merge with HAR-168 |
| Middleware/Routing | 8 | Review and merge |
| Image/Performance | 5 | Merge (low risk) |
| QA/Testing | 6 | Merge to improve coverage |
| Documentation | 6 | Merge (no runtime impact) |
| Feature PRs | 12 | Review carefully |
| Duplicates/Stale | ~10 | Close |
| HOLD/Blocked | 3 | Keep open, track |

---

## Priority 1: Security PRs (Merge Immediately)

These PRs directly close **HAR-166** (Seven-Blocker Gate) and **HAR-168** (Supabase findings).

| PR | Title | Linear |
|----|-------|--------|
| #387 | Harden admin login with origin and double-submit CSRF validation | HAR-166 |
| #388 | Remove Supabase config exposure from marketplace GET endpoints | HAR-168 |
| #389 | Hide sensitive fields in public genetics profiles | HAR-166 |
| #392 | Harden admin session cookie with signed expiring token | HAR-166 |
| #393 | Harden marketplace GET health payloads | HAR-166 |
| #394 | Add shared abuse protection to marketplace intake routes | HAR-166 |
| #385 | Use signed admin session cookies with origin checks | HAR-166 |
| #382 | Harden admin logout route to POST-only | HAR-166 |

---

## Priority 2: Supabase Hardening

| PR | Title | Linear |
|----|-------|--------|
| #404 | Handle invalid JSON responses in admin Supabase data client | HAR-168 |
| #405 | Guard Supabase env status URL parsing | HAR-168 |
| #364 | Safely parse network admin success responses by content type | HAR-168 |

---

## Priority 3: Middleware & Routing

| PR | Title | Action |
|----|-------|--------|
| #375 | Extend middleware matcher for nested signals routes | Merge |
| #376 | Add nested /admin middleware matcher coverage | Merge |
| #377 | Expand middleware matchers to cover section subpaths | Merge |
| #378 | Harden middleware redirect matching for trailing-slash legacy URLs | Merge |
| #379 | Align admin login cookie secure policy with logout | Merge |
| #380 | Expand middleware matcher coverage for route trees | Merge |
| #369 | Add wildcard matchers for nested no-store routes in middleware | Merge |
| #370 | Allowlist admin session cookies when resolving access token | Merge |

---

## Priority 4: Image & Performance

| PR | Title | Action |
|----|-------|--------|
| #390 | Replace raw `<img>` with Next.js Image and tighten genetics profile output | Merge |
| #391 | Replace raw `<img>` with Next.js Image and tighten genetics profile output | Close (duplicate of #390) |
| #396 | Remove dead filter encoder, make redaction lint-safe, migrate key images | Merge |
| #403 | Use next/image for marketplace visuals, sanitize public genetics exports | Merge |

---

## Priority 5: QA & Testing Infrastructure

| PR | Title | Action |
|----|-------|--------|
| #400 | Add `test:marketplace-conversion-workflow` npm script | Merge |
| #401 | Refactor listing submission validation, tighten regulatory-safety checks | Merge |
| #402 | Relax listing submission validations and add public-leakage fuzz tests | Review (conflicts with #401?) |
| #408 | Add centralized QA registry and npm QA bundle scripts | Merge |
| #330 | Harden intake safety, public DTO leakage checks, deterministic secret scanner | Merge |
| #331 | Harden marketplace intake safety and add deterministic secret scan | Close (duplicate of #330) |
| #332 | Add secret-scanning script, .env.example, and `test:secret-scan` npm script | Merge |

---

## Priority 6: Documentation

| PR | Title | Action |
|----|-------|--------|
| #359 | Add PR #334 tracking note (docs/pr-334.md) | Merge |
| #360 | docs: add 2026-05-19 codebase audit report | Merge |
| #361 | docs: add local validation workflow to README | Merge |
| #362 | docs: clarify build targets and canonical production artifact pipeline | Merge |
| #407 | Add root AGENTS.md with repo-wide coding, QA, compliance, and PR standards | Merge |
| #410 | Deduplicate public compliance/disclaimer copy into shared module | Merge |

---

## Priority 7: Feature PRs (Review Carefully)

| PR | Title | Linear | Action |
|----|-------|--------|--------|
| #398 | Wire globe route controller into homepage hero | HAR-37 | Review |
| #399 | Add public Processing Inputs marketplace pages, intake logic, types | HAR-37 | Review |
| #383 | Build globe route-query state controller | HAR-37 | Review |
| #371 | Implement globe route-query state controller + focused route tests | HAR-37 | Review (older than #383) |
| #349 | Build Harbourview globe same-screen router overlay | HAR-37 | Review |
| #356 | Fix globe router type safety and multi-market role ordering | HAR-37 | Merge |
| #358 | Add Unified AI Gateway env contract and health route | — | Review |
| #357 | Remove internal platform map copy from homepage | — | Merge |
| #333 | Add Gemini Hub Connector V1 (server-side proposal-only) | — | Review |
| #312 | Redesign cannabis inventory marketplace dealroom UI | — | Review |
| #322 | Add read-only internal admin operations hub | — | Review |
| #324 | Institutional visual system redesign preparation | — | Review |

---

## Close: Duplicates & Stale

| PR | Title | Reason |
|----|-------|--------|
| #391 | Replace raw `<img>` with Next.js Image... | Duplicate of #390 |
| #331 | Harden marketplace intake safety... | Duplicate of #330 |
| #352 | fix: allow main branch builds in Vercel ignore script... | Superseded by #351 (merged) |
| #353 | fix(vercel-ignore): allow main branch builds... | Superseded by #351 (merged) |
| #354 | fix(vercel-ignore): always allow main builds... | Superseded by #351 (merged) |
| #337 | Add local-run wrapper for signals public leakage tests... | Review if still needed |

---

## HOLD: Blocked or Needs Discussion

| PR | Title | Reason |
|----|-------|--------|
| #323 | HOLD: Preview hardening from screenshot QA | Explicitly on HOLD |
| #345 | Add full-scope launch readiness control layer | Complex, needs review |
| #338 | Track 2 HAR-39/HAR-40 public surface routing | Depends on HAR-37 completion |

---

## Recommended Merge Order

1. **Security batch** (#387, #388, #389, #392, #393, #394, #385, #382)
2. **Supabase batch** (#404, #405, #364)
3. **Middleware batch** (#375-380, #369, #370)
4. **Image/Perf batch** (#390, #396, #403)
5. **QA batch** (#400, #401, #408, #330, #332)
6. **Docs batch** (#359-362, #407, #410)
7. **Feature review** (one by one after above merged)
8. **Close duplicates** (#391, #331, #352-354)

---

## Cross-Reference Summary

| System | Status |
|--------|--------|
| **Linear HAR-55** | Done (PR #351 merged) |
| **Linear HAR-166** | PRs #387-394 ready for merge |
| **Linear HAR-168** | PRs #388, #404, #405 ready for merge |
| **Linear HAR-28** | No active PR — needs branch creation |
| **Linear HAR-37** | PRs #349, #371, #383, #398, #399 in progress |

---

*Last updated: May 20, 2026 via MCP scan*
