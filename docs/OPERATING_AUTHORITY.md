# HarbourView Hugging Face Intelligence Layer — Operating Authority

**Status: HOLD for execution. Approved for design ratification only.**
Last updated: 2026-06-07
Inspection basis: Live Supabase schema + full GitHub repo inspection (main @ 726930d)

---

## Required decisions before implementation

| ID | Decision | Selected value | Evidence | Status |
|---|---|---|---|---|
| D1 | Hugging Face org slug | TBD: `harbourview-ai` or fallback | HF org creation screen / slug availability check | **HOLD** |
| D2 | Vector store | **pgvector in Supabase** (`zvxdgdkukjrrwamdpqrg`) | `public.hv_embeddings` table, HNSW indexes confirmed live. `hv_search.search_documents` in migration 20260606. BGE-M3 requires additive `vector(1024)` column — migration not yet written. | **CONDITIONAL GO** |
| D3 | Role mapping | `reviewer` → `analyst`, `model-ops` → `operator`, `marketplace-reviewer` → `operator`, `education-reviewer` → `operator` (document scope) | `lib/auth/adminRoles.ts`: roles are `admin`, `operator`, `analyst`, `viewer`. No `reviewer` or `model-ops` exist. Mapping is an approximation — must be documented here before Ticket 3. | **HOLD — write mapping decision** |
| D4 | Vercel timeout / compute strategy | TBD | `vercel.json` has no `maxDuration`. `next.config.ts` uses `output: standalone`. Repo has `open-next.config.ts`, `wrangler.jsonc`, `netlify.toml` — multi-target. `hv_processing_jobs` async queue confirmed in Supabase. No queue worker found in repo. Heavy model calls (Qwen3-30B) must go through the job queue, not synchronous routes. | **HOLD — confirm deployment target + wire worker** |
| D5 | Chunking strategy | TBD | `hv_embeddings.chunk_index` and `chunk_text` columns exist. No window size, overlap, or splitter defined anywhere. | **HOLD — define parameters** |
| D6 | Repo structure | **Single Next.js 15 app. No `packages/` directory.** | Confirmed via full tree inspection. Module path in design packet (`/packages/harbourview-ai`) is WRONG. Correct path: `/lib/hf/` following `lib/llm/` convention. | **RESOLVED** |
| D7 | Release-candidate repo naming | `harbourview-ai/hv-release-candidates-private` | Original name `hv-public-safe-facts` is rejected. No HF org exists yet — apply correct name at org creation. | **HOLD — pending D1** |

---

## Non-negotiable controls

- Hugging Face tokens are server-only. Use `import 'server-only'` on every HF module.
- No `NEXT_PUBLIC_HF_*` variables. Ever.
- No browser-to-Hugging-Face calls. All HF access goes through server routes.
- Internal routes require verified HarbourView auth roles. Follow `requireAdminAuth()` pattern from `lib/auth/adminGuard.ts`.
- New HF routes live at `/api/internal/ai/*` or `/api/admin/intelligence/*` — decision required at Ticket 3.
- Public DTOs use explicit allowlist serializers (`lib/harbourview/dto/allowlists.ts`). Apply `Pick<>` enforcement per v2 packet spec.
- Leakage audit is a second layer, not the primary boundary.
- Model outputs are candidates only. No auto-promotion to any public surface.
- Reviewer approval required before internal fact promotion.
- Separate approval required before public DTO release.
- LayoutLMv3 / `hv-doc-layout-extract` endpoint remains **HOLD** until commercial license cleared.
- Qwen3-30B and equivalent heavy extraction must use the `hv_processing_jobs` async queue — not synchronous Vercel functions.
- All HF modules must follow the `lib/llm/` pattern: Zod env schema, `import 'server-only'`, typed errors, no provider logic in route handlers.

---

## Known blockers before any ticket can execute

### BLOCKER-1 — `hv_core.current_role()` JWT hook missing

The new `hv_*` schema RLS model reads `hv_role` from the JWT via `hv_core.current_role()`.
No `custom_access_token` Supabase hook exists in the repo.
Without it, `hv_role` is never in user tokens. `is_operator_or_admin()` returns false for all users.
All `hv_core`, `hv_private`, `hv_commercial`, `hv_marketplace` RLS policies silently deny authenticated users.

**Options:**
- (a) Add a Supabase `custom_access_token` hook migration that reads `hv_core.app_profiles.hv_role` and injects it into the JWT. Correct long-term approach.
- (b) Document that all HF server routes use the service_role client exclusively. Add guard that throws if service_role key is absent. Faster, higher privilege.

**Decision required here before Ticket 3.**

Selected option: TBD

### BLOCKER-2 — BGE-M3 1024-dim column does not exist

`hv_embeddings` has `embedding vector(1536)` and `embedding_384 vector(384)`.
BGE-M3 outputs 1024-dim vectors. Migration required before Ticket 4:

```sql
ALTER TABLE hv_embeddings ADD COLUMN embedding_1024 vector(1024);
CREATE INDEX idx_hv_embeddings_hnsw_1024
  ON hv_embeddings USING hnsw (embedding_1024 vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

`hv_search_artifacts()` needs a third branch for the 1024-dim path.

### BLOCKER-3 — Security harden migration confirmation

Migration `20260606210000_security_harden_anon_functions_and_regulatory_signals_rls.sql`
revokes anon EXECUTE from `hv_requeue_failed_embed_jobs`, `hv_audit_publication`,
`hv_audit_review_decision`, `handle_new_user`, `sync_subscription_tier`.
Live Supabase inspection showed these still callable by anon before this migration's timestamp.
Confirm this migration is applied to production before any HF integration begins.

Check: Supabase Dashboard → Database → Migrations — verify `20260606210000` is listed as applied.

---

## Corrected module path

Design packet specified: `/packages/harbourview-ai/src/`
**Correct path for this repo:** `/lib/hf/`

```
lib/hf/
  serverOnly.ts       # import 'server-only' guard + assertServerOnly()
  env.ts              # Zod schema for HF_* env vars, follows lib/env/unifiedAiGatewayEnv.ts pattern
  client.ts           # HF InferenceClient, reads HF_TOKEN_SERVER only
  endpoints.ts        # Endpoint URL constants from env
  embeddings.ts       # Chunk + embed via hv-embed-bge-m3
  reranker.ts         # Rerank via hv-rerank-bge-v2-m3
  extraction.ts       # JSON extraction via Qwen3 endpoints
  leakageAudit.ts     # Forbidden-field + unsupported-claim scanner
  evalRunner.ts       # Eval harness
  schemas.ts          # Zod schemas matching HF dataset schemas
  validators.ts       # Output validation before DB write
  logging.ts          # Server-only structured logging
```

---

## Corrected ticket execution order

- **Ticket 0** — This document. Resolve D1–D7. Record BLOCKER-1 decision.
- **Ticket 1** — HF org + resource groups. Unblocked once D1 confirmed.
- **Ticket 2** — Private dataset repos using `hv-release-candidates-private`.
- **Ticket 3** — `lib/hf/serverOnly.ts`, `lib/hf/env.ts`, `lib/hf/client.ts`. Role-protected internal route shell. Blocked until D3 written and BLOCKER-1 decided.
- **Ticket 4** — Structural public DTO `Pick<>` serializers + tests. Can run in parallel with Ticket 3.
- **Ticket 5** — Leakage auditor as second-layer verification.
- **Ticket 6** — BGE-M3 1024-dim migration + `hv_search_artifacts` update. BLOCKER-2.
- **Ticket 7** — Embedding pipeline.
- **Ticket 8** — Retrieval + reranking.
- **Ticket 9** — Review queue.
- **Ticket 10** — Extraction pipeline via async job queue.
- **Ticket 11** — Eval harness with CI gate.
- **Ticket 12** — Private HF Spaces.

Do not run Tickets 3+ in parallel until Ticket 3 is merged and role protection is verified.

---

## Environment variables to add (server-only)

```
# Hugging Face — server-only. Never NEXT_PUBLIC_*.
HF_ORG=harbourview-ai
HF_TOKEN_SERVER=
HF_ENDPOINT_EMBED_BGE_M3=
HF_ENDPOINT_RERANK_BGE_V2_M3=
HF_ENDPOINT_EXTRACT_QWEN3_4B=
HF_ENDPOINT_EXTRACT_QWEN3_30B=
HF_DATASET_SOURCE_CORPUS=harbourview-ai/hv-source-corpus-private
HF_DATASET_EVALS=harbourview-ai/hv-eval-sets-private
HF_DATASET_REVIEWED_FACTS=harbourview-ai/hv-reviewed-facts-private
HF_DATASET_RELEASE_CANDIDATES=harbourview-ai/hv-release-candidates-private
```

Add to `.env.example` (blank values only) and Vercel project env before Ticket 3.

---

## GO rule

GO on full execution is only possible after:
- [ ] D1–D7 all resolved and recorded above
- [ ] BLOCKER-1 option selected and actioned
- [ ] BLOCKER-2 migration written and applied
- [ ] BLOCKER-3 confirmed applied to production
- [ ] `lib/hf/` module skeleton merged with `import 'server-only'`
- [ ] `grep -r "NEXT_PUBLIC_HF" .` returns zero results
- [ ] Internal route protection verified against actual auth model
- [ ] DTO `Pick<>` serializers implemented for all HF-facing types
- [ ] Eval/leakage gates present in CI

**Current verdict: HOLD — Ticket 1 unblocked pending D1 confirmation.**
