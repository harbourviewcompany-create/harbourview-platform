# Automated source-metadata currentness (Phase A+)

**Library:** `lib/clinical/sourceCurrentness.ts`  
**CLI:** `scripts/clinical-source-currentness.ts`  
**Cron:** `GET /api/cron/clinical-source-currentness` (`Authorization: Bearer $CRON_SECRET`)

**Scope:** Source-metadata validation only. Does **not** approve clinical-synthesis claims.

## What it validates

| Check | Action |
|-------|--------|
| URL reachability | `source-degraded` |
| Normalized content hash (HTML stripped of scripts/styles; main/article preferred) | New snapshot + `stale` if changed |
| PDF/binary | Raw byte hash (`hash_scope: source-bytes`) |
| DOI via Crossref | Invalid notes; retraction signal → `review-required` |
| PMID via NCBI | Invalid notes |
| Title consistency (stored vs Crossref/PMID title) | Strong mismatch → `review-required` |
| Status transitions | `clinical_evidence_change_events` (`source_currentness_check`) |
| Concurrent runs | Soft lock via `currentness_lock` change-event |

## What it never does

- Publish or upgrade clinical-synthesis
- Infer efficacy, dosing, or safety
- Auto-resolve clinical conflicts

## Run

```bash
export SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...
export CROSSREF_MAILTO=ops@harbourview.example   # optional
export NCBI_API_KEY=...                          # optional

npx tsx scripts/clinical-source-currentness.ts --limit=50
npx tsx scripts/clinical-source-currentness.ts --dry-run --limit=10
```

## Cron

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://harbourview.vercel.app/api/cron/clinical-source-currentness?limit=40"
```

Optional: add to `vercel.json` crons once migration is live.

## Tests

```bash
npx vitest run tests/clinical/sourceCurrentness.test.ts
```

## Schema dependency

Requires clinical evidence spine migration for records, snapshots, and change events.

## Registry impact

- New lib module, script, cron route, tests, docs
- No public clinician routes
- Service-role + CRON_SECRET only
