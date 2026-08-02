# Platform Optimization Plan
## Generated: 2026-07-29 | Branch: kimi/platform-optimization-2026-07-29

---

## Executive Summary

This plan implements the 8 GitHub issues (#1186–#1193) created during the comprehensive pipeline and data quality review. All code is committed to branch `kimi/platform-optimization-2026-07-29`.

---

## Week 1: Critical Performance & Security (P0)

### 1. Scraper Engine v2 — Batched AI + Sharded Execution
**Files:** `lib/scrapers/runner-v2.ts`, `lib/scrapers/normaliser-v2.ts`, `app/api/cron/scraper-partition-[0-3]/route.ts`

**What changes:**
- AI normalisation now batches 5 items per Claude API call (was 1 item per call)
- 4 parallel cron partitions replace single monolithic scraper
- Circuit breaker trips after 3 consecutive AI failures
- Exponential backoff retry for transient 5xxs
- Model fallback chain: Claude → Gemini → HF Qwen

**Expected impact (not yet measured):** target ~80% reduction in AI latency, elimination of TIME_BUDGET bottlenecks — needs before/after timing data to confirm.

**Required env vars:**
```
ANTHROPIC_API_KEY (existing)
GEMINI_API_KEY (existing)
HF_ENDPOINT_EXTRACT_QWEN3_4B
HF_TOKEN_SERVER
```

**Vercel cron update:**
```json
{
  "path": "/api/cron/scraper-partition-0",
  "schedule": "0 */6 * * *"
},
{
  "path": "/api/cron/scraper-partition-1",
  "schedule": "5 */6 * * *"
},
{
  "path": "/api/cron/scraper-partition-2",
  "schedule": "10 */6 * * *"
},
{
  "path": "/api/cron/scraper-partition-3",
  "schedule": "15 */6 * * *"
}
```

### 2. AI Safety — Structured Output + Prompt Sanitisation
**Files:** `lib/scrapers/normaliser-v2.ts`, `lib/ai/model-fallback.ts`

**What changes:**
- Claude `tools` / structured output enforces exact schema (no more regex JSON cleaning)
- Raw scraped text is sanitised before prompt injection (strips `{}`, HTML tags, 4k char limit)
- Zod validation on every AI response before DB insertion
- Full fallback chain prevents total pipeline degradation

**Expected impact:** mitigates (not eliminates) prompt injection risk, reduces parsing failures via schema validation. "Eliminates" overstates it — prompt-injection defense against untrusted scraped text is inherently hard to fully close off; see the sanitisation hardening done during PR review for what's actually covered, and what isn't.

### 3. Intake Security — Rate Limiting + PII Redaction
**Files:** `lib/marketplace/intakeRateLimit.ts`, `lib/marketplace/piiScanner.ts`

**What changes:**
- IP-based rate limiting: 5 submissions/hour per IP (Redis + in-memory fallback)
- PII scanner detects credit cards, SSNs, API keys, Bitcoin addresses
- Quarantines submissions with suspected PII for manual review

**Expected impact:** substantially reduces (not closes) the spam/abuse vector and data leakage risk — rate limiting and PII scanning both have known gaps (e.g. PII regex coverage, distributed rate-limit correctness) rather than fully closing these off.

**Required env vars:**
```
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

### 4. Database Schema — snapshot_id FK + Provenance
**File:** `supabase/migrations/20260729000000_platform_optimizations.sql`

**What changes:**
- `snapshot_id` UUID FK added to `signals` (enables backfills, audit trails)
- Provenance columns on `marketplace_candidates`: `raw_html_hash`, `parser_version`, `normaliser_model`, `scrape_run_id`
- `countries` reference table replaces hard-coded `COUNTRY_NAME` map
- `ia_extraction_failures` quarantine table with retry logic
- RLS policies for `professional_service_providers` (PR #1178)
- Updated `promote_snapshot_to_signals()` to populate `snapshot_id`

**Expected impact:** enables data lineage, reproducible pipelines, and compliance auditing going forward — not yet validated against a real audit/compliance review.

---

## Week 2: Parser Robustness + Data Quality (P1)

### 5. DOM-Based Parser + JSON-LD Extraction
**Files:** `lib/scrapers/parser-dom.ts`, `lib/scrapers/fetcher-v2.ts`

**What changes:**
- Replaces regex HTML parsing with `linkedom` DOM traversal
- Extracts structured product data from `<script type="application/ld+json">`
- Playwright fallback for JS-rendered sources (tagged via `jsRendered` flag)
- Source-specific CSS selector overrides in `ScraperSource.selectors`

**Required:** `npm install linkedom`

### 6. SHA-256 + Semantic Deduplication
**File:** `lib/scrapers/deduplication-v2.ts`

**What changes:**
- djb2 hash replaced with SHA-256 (collision-resistant)
- Jaccard similarity on 3-char shingles catches near-duplicates ("CO2 Extractor" vs "Used CO2 Extractor")
- Fingerprint fetch is now per-source-batch, not entire table

### 7. ISO-3166 Country Lookup
**File:** `lib/intelligence-engine/countryLookup.ts`

**What changes:**
- 92-country reference table with ISO-2, ISO-3, name, region
- Auto-detects 2-char vs 3-char codes
- Eliminates hard-coded `COUNTRY_NAME` map drift

---

## Week 3: Observability + Admin Tools (P2)

### 8. Structured Logging
**File:** `lib/observability/structuredLog.ts`

**What changes:**
- Every pipeline stage emits JSON-structured logs
- Source health alerts when Tier 1 sources hit 3 consecutive failures
- AI fallback tracking with per-model latency metrics

### 9. Pipeline Health Dashboard
**Files:** `app/admin/(protected)/pipeline-health/page.tsx`, `app/api/admin/pipeline/sources/route.ts`, `app/api/admin/pipeline/metrics/route.ts`

**What changes:**
- Interactive admin dashboard at `/admin/pipeline-health`
- KPI cards: total sources, failing sources, latest candidates, passthrough rate
- Filterable source health table (healthy/degraded/failing)
- Server-guarded auth (no client-side role checks)

---

## Week 4: Competitive Intelligence + Source Registry

### 10. New Regulatory Sources
**File:** `lib/scrapers/sources-competitive-intelligence.ts`

**Sources to add:**
- Germany BfArM Cannabis Anbauvereinbarungen (cultivation agreements)
- Thailand FDA Cannabis Control Act amendments
- European Cannabis Report 2026 (market data)
- Spain AEMPS cannabis medicinal updates
- Netherlands OGD cannabis experiment evaluation

### 11. Golden Set Validation
**New:** `scripts/validate-golden-set.ts`

- Maintain 50–100 hand-labelled listings
- Run every model/prompt change against golden set
- Block upgrades that regress F1 by >5%

---

## Migration Order

1. Run `supabase/migrations/20260729000000_platform_optimizations.sql`
2. Install `linkedom`: `npm install linkedom`
3. Add new env vars to Vercel
4. Update `vercel.json` with 4 partition cron schedules
5. Deploy branch to staging
6. Run `npm run typecheck && npm run lint && npm run build`
7. Obtain explicit sign-off (per this repo's CLAUDE.md: no merge/deploy without it)
8. Merge to main
9. Monitor dashboard for 48 hours

---

## Files Added (19 total)

| # | File | Purpose |
|---|---|---|
| 1 | `lib/scrapers/runner-v2.ts` | Batched AI, sharding, circuit breaker |
| 2 | `lib/scrapers/normaliser-v2.ts` | Structured output, model fallback |
| 3 | `lib/scrapers/deduplication-v2.ts` | SHA-256 + semantic dedup |
| 4 | `lib/scrapers/parser-dom.ts` | linkedom parser, JSON-LD |
| 5 | `lib/scrapers/fetcher-v2.ts` | Playwright fallback |
| 6 | `lib/observability/structuredLog.ts` | Structured JSON logging |
| 7 | `lib/ai/model-fallback.ts` | Unified fallback chain |
| 8 | `lib/marketplace/intakeRateLimit.ts` | IP rate limiting |
| 9 | `lib/marketplace/piiScanner.ts` | PII detection + redaction |
| 10 | `lib/intelligence-engine/countryLookup.ts` | ISO-3166 lookup |
| 11 | `app/admin/(protected)/pipeline-health/page.tsx` | Health dashboard |
| 12 | `app/api/admin/pipeline/sources/route.ts` | Sources API |
| 13 | `app/api/admin/pipeline/metrics/route.ts` | Metrics API |
| 14 | `app/api/cron/scraper-partition-0/route.ts` | Partition 0/4 |
| 15 | `app/api/cron/scraper-partition-1/route.ts` | Partition 1/4 |
| 16 | `app/api/cron/scraper-partition-2/route.ts` | Partition 2/4 |
| 17 | `app/api/cron/scraper-partition-3/route.ts` | Partition 3/4 |
| 18 | `supabase/migrations/20260729000000_platform_optimizations.sql` | Schema migration |
| 19 | `docs/control/PLATFORM_OPTIMIZATION_PLAN.md` | This document |

---

## Issues Closed By This Plan

- #1186 — Scraper batching + sharding
- #1187 — SHA-256 + semantic dedup
- #1188 — DOM parser + JSON-LD
- #1189 — AI structured output + fallback
- #1190 — snapshot_id FK + provenance
- #1191 — Intake rate limiting + PII
- #1192 — Intelligence batching + country lookup
- #1193 — Observability + dashboard
