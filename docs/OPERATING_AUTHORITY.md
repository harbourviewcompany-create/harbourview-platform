# HarbourView Hugging Face Intelligence Layer — Operating Authority

**Status: HOLD for execution. Approved for design ratification only.**
Last updated: 2026-06-07
Inspection basis: Live Supabase schema + full GitHub repo inspection (main @ 726930d) + HF org verification

---

## Required decisions before implementation

| ID | Decision | Selected value | Evidence | Status |
|---|---|---|---|---|
| D1 | Hugging Face org slug | **`Harbourview`** (already exists at huggingface.co/Harbourview) | HF profile page verified. Free plan. 1 member (TYLEROTT). 0 public repos. | **RESOLVED** |
| D2 | Vector store | **pgvector in Supabase** (`zvxdgdkukjrrwamdpqrg`) | `public.hv_embeddings` table, HNSW indexes confirmed live. BGE-M3 requires additive `vector(1024)` column — migration not yet written. | **CONDITIONAL GO — migration pending** |
| D3 | Role mapping | `reviewer` → `analyst`, `model-ops` → `operator`, `marketplace-reviewer` → `operator`, `education-reviewer` → `operator` | `lib/auth/adminRoles.ts` has: `admin`, `operator`, `analyst`, `viewer`. No `reviewer` or `model-ops` exist. Mapping is an approximation — must be confirmed before Ticket 3. | **HOLD — confirm mapping** |
| D4 | Vercel timeout / compute strategy | TBD | `vercel.json` has no `maxDuration`. Repo is multi-target (Vercel + OpenNext + Wrangler + Netlify). `hv_processing_jobs` async queue confirmed in Supabase. No queue worker found in repo. Heavy model calls (Qwen3-30B) must use the job queue. | **HOLD — confirm deployment target + wire worker** |
| D5 | Chunking strategy | TBD | `hv_embeddings.chunk_index` and `chunk_text` columns exist. No window size, overlap, or splitter defined. | **HOLD — define parameters** |
| D6 | Repo structure | **Single Next.js 15 app. No `packages/` directory.** | Confirmed via full tree. Design packet path `/packages/harbourview-ai` is wrong. Correct: `/lib/hf/` following `lib/llm/` convention. | **RESOLVED** |
| D7 | Release-candidate repo naming | `Harbourview/hv-release-candidates-private` | Original name `hv-public-safe-facts` rejected. Org slug is `Harbourview` (not `harbourview-ai`). Apply correct name at repo creation. | **RESOLVED — apply at Ticket 2** |

---

## HF plan tier — impact on design packet

**Current plan: Free.**
Resource groups, SSO, and audit logs are Team/Enterprise-only features.

| Design packet feature | Available on Free? | Status |
|---|---|---|
| Private repos | Yes | Available now |
| Private Spaces | Yes | Available now |
| Private Inference Endpoints | Yes (billed per hour) | Available now |
| Resource groups (`rg-core-admin`, etc.) | **No — Team/Enterprise only** | **BLOCKED until upgrade** |
| SSO | **No — Enterprise only** | **BLOCKED until upgrade** |
| Audit logs | **No — Team/Enterprise only** | **BLOCKED until upgrade** |
| Organization access control (per-member role) | Basic only on Free | Partial |

**Immediate consequence:** Tickets 1's resource group sub-tasks cannot execute on the current plan.
Ticket 1 scope on Free plan = org settings + default visibility + member roles only.
Resource groups are deferred until a Team/Enterprise upgrade decision is made.

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

## Known blockers before code tickets can execute

### BLOCKER-1 — `hv_core.current_role()` JWT hook missing

The `hv_*` schema RLS model reads `hv_role` from the JWT via `hv_core.current_role()`.
No `custom_access_token` Supabase hook exists in the repo.
Without it, `is_operator_or_admin()` returns false for all authenticated users.
All `hv_core`, `hv_private`, `hv_commercial`, `hv_marketplace` RLS policies silently deny authenticated users.

Options:
- (a) Add a Supabase `custom_access_token` hook migration that reads `hv_core.app_profiles.hv_role` and injects it into the JWT. Correct long-term approach.
- (b) All HF server routes use service_role client exclusively. Add guard that throws if service_role key is absent. Faster, higher privilege.

**Decision required before Ticket 3.**
Selected option: TBD

### BLOCKER-2 — BGE-M3 1024-dim column does not exist

`hv_embeddings` has `embedding vector(1536)` and `embedding_384 vector(384)`.
BGE-M3 outputs 1024-dim vectors. Required migration before Ticket 7:

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
Confirm this migration is applied to production before any HF integration begins.
Check: Supabase Dashboard → Database → Migrations → verify `20260606210000` is listed as applied.

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

## Corrected org slug in all env vars and dataset paths

All references in the design packet to `harbourview-ai/` must be replaced with `Harbourview/`.

```
HF_ORG=Harbourview
HF_TOKEN_SERVER=
HF_ENDPOINT_EMBED_BGE_M3=
HF_ENDPOINT_RERANK_BGE_V2_M3=
HF_ENDPOINT_EXTRACT_QWEN3_4B=
HF_ENDPOINT_EXTRACT_QWEN3_30B=
HF_DATASET_SOURCE_CORPUS=Harbourview/hv-source-corpus-private
HF_DATASET_EVALS=Harbourview/hv-eval-sets-private
HF_DATASET_REVIEWED_FACTS=Harbourview/hv-reviewed-facts-private
HF_DATASET_RELEASE_CANDIDATES=Harbourview/hv-release-candidates-private
```

Add to `.env.example` (blank values only) and Vercel project env before Ticket 3.

---

## Corrected ticket execution order

- **Ticket 0** — This document. D1–D7 resolved/recorded. ✅
- **Ticket 1** — HF org settings on Free plan (default visibility, member roles). Resource groups deferred until Team/Enterprise upgrade.
- **Ticket 2** — Private dataset repos using `Harbourview/hv-release-candidates-private`.
- **Ticket 3** — `lib/hf/serverOnly.ts`, `lib/hf/env.ts`, `lib/hf/client.ts`. Role-protected route shell. Blocked until D3 confirmed and BLOCKER-1 decided.
- **Ticket 4** — Structural public DTO `Pick<>` serializers + tests. Parallel with Ticket 3.
- **Ticket 5** — Leakage auditor as second-layer verification.
- **Ticket 6** — BGE-M3 1024-dim migration + `hv_search_artifacts` update. BLOCKER-2.
- **Ticket 7** — Embedding pipeline.
- **Ticket 8** — Retrieval + reranking.
- **Ticket 9** — Review queue.
- **Ticket 10** — Extraction pipeline via async job queue.
- **Ticket 11** — Eval harness with CI gate.
- **Ticket 12** — Private HF Spaces.

Do not run Tickets 3+ in parallel until Ticket 3 is merged and route protection is verified.

---

## GO rule

GO on full execution is only possible after:
- [ ] D3 role mapping confirmed
- [ ] D4 deployment target + worker strategy confirmed
- [ ] D5 chunking parameters defined
- [ ] BLOCKER-1 option selected and actioned
- [ ] BLOCKER-2 migration written and applied
- [ ] BLOCKER-3 confirmed applied to production
- [ ] `lib/hf/` module skeleton merged with `import 'server-only'`
- [ ] `grep -r "NEXT_PUBLIC_HF" .` returns zero results
- [ ] DTO `Pick<>` serializers implemented for all HF-facing types
- [ ] Eval/leakage gates present in CI

**Current verdict: HOLD — Ticket 1 now executable (org confirmed, Free plan scope only).**

---

## Ticket 4 Authority Patch

Status date: 2026-06-07

### BLOCKER-3 — RESOLVED

Migration `security_harden_anon_functions_and_regulatory_signals_rls` appeared
twice in production (`20260606230905`, `20260607083616`). Neither run revoked
EXECUTE from PUBLIC — only from individual roles. Since `anon` inherits PUBLIC,
all five functions remained callable unauthenticated.

Fix applied via Supabase MCP — migration `fix_revoke_public_execute_security_definer_fns`
applied 2026-06-07. Verified: all five functions now show `anon_execute: false`,
`auth_execute: false`, `proacl: {postgres=X/postgres, service_role=X/postgres}`.

BLOCKER-3 status: **RESOLVED**.

### Schema drift — new finding

10 `hv_passport_*` migrations (`20260607145803`–`20260607150001`) are live in Supabase
production but are NOT in the repo `supabase/migrations/` directory. Applied directly,
bypassing the migration file workflow.

Action required (separate from HF integration): reverse-engineer passport migrations
into `supabase/migrations/` and enforce repo-first migration workflow going forward.

### Ticket 4 scope

**Files changed:**
- `lib/harbourview/dto/internal.ts` — new. Full-field internal types for all entities. Passport tables internal only.
- `lib/harbourview/dto/public.ts` — rewritten. All public types use `Pick<Internal>`. Explicit serializers. Passport tables excluded.
- `lib/harbourview/dto/allowlists.ts` — expanded. Forbidden keys cover passport-specific sensitive fields. `enforcePublicDtoAllowlist()` added. `HV_PASSPORT_TABLES_NO_PUBLIC_DTO` added.
- `lib/harbourview/dto/__tests__/serializers.test.ts` — new. Serializer, forbidden field, and passport exclusion tests.

**Finding:** DTO layer was dead code — not imported by any route. Ticket 4 delivers the infrastructure. Route wiring is a separate ticket.

Ticket 4 HOLD for: route wiring, HF calls, ingestion, production DB writes.
