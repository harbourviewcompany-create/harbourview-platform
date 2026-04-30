# Harbourview Signal Engine V1

## 1. Purpose and Platform Context

The Harbourview Signal Engine extracts, classifies, deduplicates, and scores commercial intelligence signals from external sources — press releases, regulatory notices, operator announcements, and manually submitted information — for review by Harbourview administrators before any information reaches the public platform. Signals represent candidate marketplace listings, supplier leads, buyer demand, regulatory developments, and counterparty intelligence relevant to the regulated cannabis and adjacent industries. No signal becomes public without explicit admin approval. The engine is designed to feed the Harbourview marketplace, supplier directory, and intelligence products with reviewed, sourced, and scored commercial information.

## 2. V1 Boundaries

**Included in Milestone 1:**
- Database schema (14 tables) covering source ingestion, chunking, signal candidates, evidence, review workflow, job queue, risk flags, entity registry, model audit log, and conversion tracking
- Row Level Security: all tables locked to admin-only access with service_role write grants on processing tables
- Development seed data (fictitious, wrapped in transaction)
- TypeScript types and constants for all enums and table shapes
- This documentation

**Not included in V1:**
- UI pages, admin dashboard, or any public-facing signal exposure
- API routes or server actions
- Crawler or web scraping logic
- HuggingFace or any live model calls (embeddings, classification, NER)
- Browser-side ML models or fine-tuning
- Licence or legal inference
- Job processor / worker (queue exists, runner is Milestone 2)
- Real admin role wiring (placeholder function, replaced in Milestone 2)
- Supabase type generation (requires running Supabase instance)

## 3. Table Inventory

| Table | Purpose |
|---|---|
| `source_documents` | Root record for every external or manually entered document |
| `source_chunks` | Text chunks from source documents, with optional vector embeddings |
| `signal_duplicate_groups` | Groups of near-duplicate signal candidates with similarity scores |
| `signal_candidates` | Core table — one row per extracted commercial signal candidate |
| `signal_evidence` | Supporting evidence claims linked to a signal candidate |
| `signal_review_events` | Audit log of every status change and review action |
| `signal_jobs` | Async job queue (embed, classify, dedup, enrich, etc.) |
| `signal_risk_flags` | Structured risk and quality flags per candidate |
| `model_prompt_versions` | Versioned prompts and query templates for model tasks |
| `model_call_logs` | Audit log for every external or mock model invocation |
| `entities` | Deduplicated company / operator / organisation registry |
| `signal_entity_mentions` | Links signal candidates to resolved entity records |
| `signal_conversions` | Records promotion of a signal to a marketplace or dossier record |
| `signal_processing_errors` | Structured error log for job, source, and candidate failures |

## 4. Security and RLS Approach

Row Level Security is enabled on all 14 signal engine tables. The access model is:

| Role | Access |
|---|---|
| `anon` | Deny all — no policy created |
| `authenticated` (non-admin) | Deny all — no policy created |
| `authenticated` (admin) | Full read/write via `is_signal_admin()` function |
| `service_role` | INSERT/UPDATE on processing tables only (`signal_jobs`, `model_call_logs`, `signal_candidates`, `signal_evidence`, `signal_processing_errors`, `source_chunks`) |

**INTEGRATION POINT (Milestone 2):** The `is_signal_admin()` function in migration `20260430000002` currently returns `false` for all callers. Replace the body with the real admin check once the auth convention is confirmed — likely one of:

```sql
-- Option A: JWT role claim
SELECT auth.jwt() ->> 'role' = 'admin';

-- Option B: app_metadata flag
SELECT (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean;

-- Option C: admin table lookup
SELECT auth.uid() IN (SELECT user_id FROM admin_users);
```

No existing RLS policies were weakened. No existing tables were altered.

## 5. Migration Instructions

This project does not yet have a Supabase project configured. To apply migrations:

```bash
# 1. Install Supabase CLI (if not installed)
brew install supabase/tap/supabase   # macOS
# or: https://supabase.com/docs/guides/cli

# 2. Initialise Supabase (first time only — creates supabase/config.toml)
supabase init

# 3. Link to your Supabase project
supabase link --project-ref <your-project-ref>

# 4. Apply migrations
supabase db push

# Alternatively, for local dev:
supabase start
supabase db push --local
```

Migrations are in `supabase/migrations/` with timestamp-prefix naming:
- `20260430000001_signal_engine_schema.sql` — pgvector, 14 tables, all indexes
- `20260430000002_signal_engine_rls.sql` — RLS enable, admin/service_role policies

## 6. Seed Instructions

The seed file is `supabase/seed.sql`. It contains fictitious development data only — no real companies, emails, or private sources. All records are wrapped in a transaction.

```bash
# Apply seed to local dev database
supabase db reset   # resets and re-applies migrations + seed

# Or apply seed only (to an already-migrated DB):
psql "$DATABASE_URL" < supabase/seed.sql
```

**Seed contents:**
- 3 source documents, 8 chunks
- 2 entities, 2 duplicate groups
- 6 signal candidates (various statuses)
- 8 evidence records, 3 risk flags
- 3 prompt versions, 2 model call logs, 2 jobs
- 2 entity mentions, 1 conversion, 1 processing error

## 7. Integration Points for Milestone 2

| Item | Location | Action Required |
|---|---|---|
| Admin role check | `supabase/migrations/20260430000002_signal_engine_rls.sql` | Replace `is_signal_admin()` body with real auth check |
| Embedding pipeline | `source_chunks.embedding vector(384)` | Wire HuggingFace or equivalent to populate column; ivfflat index pre-created |
| Job processor | `signal_jobs` table | Implement worker that polls `status = 'queued'` and processes by `job_type` |
| Supabase client | Not yet configured | Add `@supabase/supabase-js`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` to env |
| Supabase type generation | `supabase gen types typescript --local` | Run after `supabase start` to generate `lib/database.types.ts`; import alongside `lib/signals/types.ts` |
| Admin UI | Not yet built | Signal review dashboard reads from `signal_candidates` filtered by `status` |

## 8. Intentional Omissions

- **pgvector ivfflat requires ≥ 100 rows** before index is efficient — the seed has far fewer; the index is created but will not accelerate queries in dev. This is expected.
- **`signal_duplicate_groups.canonical_signal_candidate_id`** creates a circular FK with `signal_candidates`. This is resolved by creating the FK as `DEFERRABLE INITIALLY DEFERRED` after both tables exist. Application code should not rely on immediate FK enforcement for this column.
- **`SignalRiskFlag` interface** has a field named `flag` of type `SignalRiskFlag` (the union type). This intentional name collision is resolved because TypeScript distinguishes interface property names from type names — the interface is `SignalRiskFlag` (the row shape) and the property type is also `SignalRiskFlag` (the union). If this causes confusion during import, rename the interface to `SignalRiskFlagRow`.
- **`signal_conversions.conversion_type`** does not include `cannabis_inventory` as a dedicated value — use `marketplace_listing` for cannabis inventory conversions (the seed does this).
