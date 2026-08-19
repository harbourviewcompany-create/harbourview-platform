# Automated source-metadata currentness (Phase B)

**Library:** `lib/clinical/sourceCurrentness.ts`  
**CLI:** `scripts/clinical-source-currentness.ts`  
**Cron:** `GET /api/cron/clinical-source-currentness` (`Authorization: Bearer $CRON_SECRET`)  
**Schedule:** `30 6 * * *` (06:30 UTC daily) in `vercel.json`

**Scope:** Source-metadata validation only. Does **not** approve clinical-synthesis claims.  
**Hard gate:** D4 / credential-bound clinician or pharmacist review remains mandatory for `publication_scope = clinical-synthesis`.

## What it validates

| Check | Action |
|-------|--------|
| URL reachability | `source-degraded` |
| Conditional GET (`If-None-Match` / `If-Modified-Since`) | HTTP 304 → `current` (no re-hash) |
| Normalized content hash (HTML stripped of scripts/styles; main/article preferred) | New snapshot + `stale` if changed |
| PDF/binary | Raw byte hash (`hash_scope: source-bytes`) |
| DOI via **Crossref** | Invalid notes; update/retraction signal → `review-required` |
| PMID via **NCBI E-utilities** | Invalid notes; PubMed pubtype retraction → `review-required` |
| **OpenAlex** secondary registry | `is_retracted` → `review-required` |
| Title consistency (stored vs registry title) | Strong mismatch → `review-required` |
| Internet Archive availability (when URL fails) | Annotates reason; does **not** restore publication |
| Priority queue | Re-checks `review-required` / `source-degraded` / `stale` before `current` |
| Status transitions | `clinical_evidence_change_events` (`source_currentness_check`) |
| Concurrent runs | Soft lock via `currentness_lock` change-event |
| Bounded concurrency | Default 3 parallel record processors |

## What it never does

- Publish or upgrade clinical-synthesis
- Infer efficacy, dosing, or safety
- Auto-resolve clinical conflicts
- Bypass D4 credential-bound review
- Treat archive.org captures as authoritative live sources

## Run

```bash
export SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...
export CROSSREF_MAILTO=ops@harbourview.example   # optional, polite User-Agent
export NCBI_API_KEY=...                          # optional, higher NCBI rate limit

npx tsx scripts/clinical-source-currentness.ts --limit=50
npx tsx scripts/clinical-source-currentness.ts --dry-run --limit=10
npx tsx scripts/clinical-source-currentness.ts --limit=80 --concurrency=4
```

## Cron

Scheduled in `vercel.json` at **06:30 UTC** daily.

Manual:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://harbourview.vercel.app/api/cron/clinical-source-currentness?limit=40"
```

Dry-run via cron:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://harbourview.vercel.app/api/cron/clinical-source-currentness?limit=10&dryRun=1"
```

## Tests

```bash
npx vitest run tests/clinical/sourceCurrentness.test.ts
```

## Schema dependency

Requires clinical evidence spine migration from PR #1523 (`clinical_evidence_records` with freshness fields, `clinical_evidence_snapshots` with `locator_manifest` / hash scopes, `clinical_evidence_change_events` with JSON `payload`).

Until applied, the job returns empty/error and does not affect clinician surfaces.

## Observability

Run summary includes:

- counts per `freshness_status`
- `notModified` (304 hits)
- `archiveHits` (Wayback available when live URL failed)
- `durationMs`
- `skippedLock` when another run holds the soft lock

## Registry impact

- Lib module, script, cron route, tests, docs, vercel cron entry
- No public clinician routes
- Service-role + CRON_SECRET only
- Does not change marketplace DTOs or auth/middleware
