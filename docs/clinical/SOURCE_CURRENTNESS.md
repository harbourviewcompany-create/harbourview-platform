# Automated source-metadata currentness (Phase A)

**Job:** `scripts/clinical-source-currentness.ts`  
**Scope:** Source-metadata validation only. Does **not** approve clinical-synthesis claims.

## What it validates

| Check | Action on failure / change |
|-------|----------------------------|
| `primary_source_url` present + http(s) | `source-degraded` |
| HTTP reachability (status, redirects) | `source-degraded` |
| Content SHA-256 vs last snapshot | New snapshot + `stale` if changed |
| DOI via Crossref (if present) | Invalid → notes; retraction signal → `review-required` |
| PMID via NCBI (if present) | Invalid → notes |

## What it never does

- Publish or upgrade `clinical-synthesis` records
- Infer efficacy, dosing, or safety
- Auto-resolve clinical conflicts

## Run

```bash
# Requires service role
export SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...
# Optional
export CROSSREF_MAILTO=ops@harbourview.example
export NCBI_API_KEY=...

npx tsx scripts/clinical-source-currentness.ts --limit=50
npx tsx scripts/clinical-source-currentness.ts --dry-run --limit=10
```

## Cron (example)

Daily after tables exist:

```cron
0 6 * * * cd /app && npx tsx scripts/clinical-source-currentness.ts --limit=200 >> /var/log/clinical-currentness.log 2>&1
```

Or invoke from an internal `/api/cron/...` route protected by CRON_SECRET, same pattern as existing intelligence crons.

## Schema dependency

Requires migration `20260818_clinical_evidence_spine.sql` applied:

- `clinical_evidence_records` (freshness columns)
- `clinical_evidence_snapshots`

## Registry impact

- New script only
- No public routes
- No change to auth or marketplace DTOs
- Writes only when service role is used; clinicians never call this path
