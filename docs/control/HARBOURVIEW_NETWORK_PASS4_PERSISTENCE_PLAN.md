# HARBOURVIEW NETWORK PASS 4 PERSISTENCE PLAN (Docs-Only)

## Scope, Constraints, and Intent
This plan expands Harbourview Network Pass 4 persistence into a **repo-specific implementation blueprint only**. It proposes additive schema and flow changes without implementing migrations, routes, API handlers, server actions, Supabase clients, or runtime behavior.

Hard constraints applied:
- Reuse existing `user_roles` `admin`/`operator` authorization model.
- Reuse deny-by-default RLS posture (no anon/private table access).
- Reuse review-first conventions established in migration `20260305000000_live_source_intake_v0_consumables.sql`.
- No public reads from private review tables.
- No client-side service-role usage.
- No automatic publishing.
- No production writes from this planning pass.
- No unrelated schema changes.

## Exact Existing Files Inspected
### Supabase migrations and RLS/grant posture
- `supabase/migrations/20260301000000_user_roles_admin_gate.sql`
- `supabase/migrations/20260301001000_harden_user_roles_grants.sql`
- `supabase/migrations/20260305000000_live_source_intake_v0_consumables.sql`
- `supabase/migrations/20260308000000_new_products_equipment_intake.sql`

### Auth helpers, admin guard, service-role boundaries
- `lib/auth/adminRoles.ts`
- `lib/auth/adminGuard.ts`
- `lib/supabase/adminDataClient.ts`

### Intake and review workflow conventions
- `app/actions/createLiveSourceIntake.ts`
- `lib/marketplace/liveSources.ts`
- `lib/network/adminReview.ts`
- `lib/network/dto.ts`

### Verification scripts and contract checks
- `scripts/test-live-source-intake.mjs`
- `scripts/test-admin-role-guard.mjs`
- `scripts/smoke-marketplace-rls.mjs`
- `scripts/probe-production-admin-security.mjs`

## Pass 4 Data Model (Additive Proposal)

### 1) `public.network_review_items` (private canonical review records)
Purpose: persist Network objects under review before any public projection.

Proposed columns:
- `id uuid primary key default gen_random_uuid()`
- `object_type text not null` check in (`country`, `category`, `listing`, `wanted_request`, `intelligence_brief`)
- `source_ref text null` (immutable source pointer/reference id)
- `title_internal text not null`
- `title_public_draft text null`
- `country_code text null`
- `country_label text null`
- `category_label text null`
- `review_status text not null default 'submitted'` check in (`submitted`, `under_review`, `needs_clarification`, `approved_public_summary`, `rejected`, `archived`)
- `claim_risk text not null default 'medium'` check in (`low`, `medium`, `high`)
- `private_analyst_notes text null`
- `public_summary_draft text null`
- `suppressed_fields text[] not null default '{}'::text[]`
- `requires_legal_review boolean not null default false`
- `requires_compliance_review boolean not null default false`
- `created_by uuid references auth.users(id) on delete set null`
- `reviewed_by uuid references auth.users(id) on delete set null`
- `reviewed_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:
- `(review_status, created_at desc)`
- `(object_type, claim_risk, created_at desc)`
- partial index where `review_status in ('submitted','under_review','needs_clarification')`

### 2) `public.network_review_events` (private append-only audit trail)
Purpose: immutable review-event ledger aligned to `candidate_review_events` pattern.

Proposed columns:
- `id uuid primary key default gen_random_uuid()`
- `review_item_id uuid not null references public.network_review_items(id) on delete cascade`
- `event_type text not null` check in (`created`, `status_changed`, `note_added`, `public_projection_requested`, `public_projection_approved`, `rejected`, `archived`)
- `from_status text null`
- `to_status text null`
- `event_note text null`
- `event_payload jsonb null` (structured reason codes, redaction context)
- `created_by uuid references auth.users(id) on delete set null`
- `created_at timestamptz not null default now()`

Indexes:
- `(review_item_id, created_at desc)`
- `(event_type, created_at desc)`

### 3) `public.network_public_projection` (public-safe projection only)
Purpose: explicit publish target that is populated only by protected server-side review action after approval gate.

Proposed columns:
- `id uuid primary key default gen_random_uuid()`
- `review_item_id uuid not null unique references public.network_review_items(id) on delete restrict`
- `object_type text not null`
- `slug text not null`
- `name text not null`
- `public_summary text not null`
- `country_label text null`
- `category_label text null`
- `published_at timestamptz not null default now()`
- `published_by uuid references auth.users(id) on delete set null`
- `is_active boolean not null default true`
- `version integer not null default 1`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:
- no private note fields in this table
- unique `(object_type, slug, version)`

## Proposed RLS Policies

### Deny-by-default baseline
For all three tables:
- `enable row level security`
- `revoke all ... from anon`
- `revoke all ... from authenticated`
- explicitly grant only required verbs to `authenticated`, then enforce access via RLS `using` + `with check` with existing `user_roles` lookup.

### Private tables (`network_review_items`, `network_review_events`)
Single policy shape reused from migration 007:
- policy name: `network_review_items_admin_operator_only`
- `for all to authenticated`
- `using exists(select 1 from public.user_roles where user_id = auth.uid() and role in ('admin','operator'))`
- same clause in `with check`

Equivalent event-table policy:
- `network_review_events_admin_operator_only`

### Public projection table (`network_public_projection`)
Two policies:
1. public read policy
   - `for select to anon, authenticated using (is_active = true)`
2. admin/operator write policy
   - `for insert, update, delete to authenticated`
   - `using/with check` via same `user_roles` admin/operator predicate

Explicit prohibition:
- **No select policy on private review tables for `anon`.**
- **No join-based public path from `network_public_projection` back to private tables.**

## Public/Private DTO Boundaries

### Private DTO (admin-only)
`NetworkReviewItemPrivateDTO` should include:
- `privateAnalystNotes`
- `suppressedFields`
- `reviewStatus`
- `claimRisk`
- internal workflow metadata (`createdBy`, `reviewedBy`, review flags)

### Public DTO (safe projection)
`NetworkPublicItemDTO` should include only:
- `id`, `slug`, `name`, `objectType`
- `publicSummary`
- optional `countryLabel`, `categoryLabel`

Do not include:
- analyst notes
- source evidence traces
- suppression rationale payloads
- legal/compliance internal flags
- reviewer identity metadata

Boundary rule:
- Only map from `network_public_projection` -> public DTO.
- Never map public DTO directly from `network_review_items`.

## Protected Server-Action Flow (Design Only)

1. Require `requireAdminAuth()` (reuse existing guard semantics).
2. Read target `network_review_items` by id using server-side privileged path.
3. Validate transition gate:
   - only `admin`/`operator`
   - item status must be `approved_public_summary`
   - required public fields non-empty (`slug`, `name`, `public_summary_draft`)
4. Upsert `network_public_projection` record (explicit action; no automatic trigger).
5. Insert `network_review_events` row with `event_type='public_projection_approved'`.
6. Revalidate/admin refresh only; no implicit client publish behavior.

Negative guarantees:
- No service-role key exposed to client components.
- No background job that auto-publishes approved rows.

## Review-Event Audit Model
- Event table is append-only at application contract level.
- Every status transition writes an audit event with actor + timestamp.
- Rejection and clarification require `event_note`.
- Optional structured `event_payload` carries redaction/audit reason codes.
- Audit chronology source of truth is `network_review_events.created_at`.

## Public Projection Model
- Public pages read only from `network_public_projection` (or views over it).
- Projection records are immutable by public users.
- Revisions create version increments or controlled updates by admin/operator only.
- Deactivation uses `is_active=false`; does not expose private table state.

## Migration Sequencing (Planned)
1. Add migration `00xx_network_pass4_review_tables.sql`
   - create `network_review_items`
   - create `network_review_events`
   - constraints + indexes
   - RLS + grants + admin/operator policies
2. Add migration `00xy_network_pass4_public_projection.sql`
   - create `network_public_projection`
   - constraints + indexes
   - RLS + public-read/admin-write policies
3. Add migration `00xz_network_pass4_comments.sql` (optional hardening)
   - `comment on table/column` documentation aligning with private/public boundary rules
4. No destructive alters in this pass; additive only.

## Rollback / Forward-Fix Plan
- Preferred strategy: **forward-fix**.
- If migration issue occurs:
  - stop deploy promotion at HOLD gate,
  - apply corrective additive migration (constraint/policy/index repair),
  - preserve data and audit trail.
- Emergency rollback (last resort):
  - disable reads/writes through feature flag or route hold,
  - revert app-layer references first,
  - only then consider table deactivation; avoid dropping audit records.

## Verification Commands (Planned Evidence)
Local/static checks (no production writes):
- `node scripts/test-live-source-intake.mjs`
- `node scripts/test-admin-role-guard.mjs`
- `node scripts/smoke-marketplace-rls.mjs`
- `node scripts/probe-production-admin-security.mjs`

DB migration dry-run checks (local Supabase only):
- `supabase db reset`
- `supabase db lint`
- `supabase migration list`

Expected pass criteria:
- private review tables deny anon/public reads,
- admin/operator policies present and role-scoped,
- projection table allows only explicit publish path,
- no migration introduces auto-publication.

## GO / HOLD Gates

### GO when all are true
- Schema diff is additive-only and limited to Pass 4 objects.
- RLS for private tables is admin/operator only and deny-by-default.
- Public projection has no private field leakage.
- Protected publish flow requires explicit approved status.
- Verification commands pass in local CI context.

### HOLD if any are true
- Any anon/public read path exists for private review tables.
- Any client-side service-role usage appears.
- Any trigger/job/handler auto-publishes review items.
- Any non-Pass-4 unrelated schema alteration is bundled.
- Verification scripts flag admin guard, RLS, or leakage regressions.

## Registry Impact
- **Project registry:** docs-only planning artifact should be logged as Pass 4 persistence planning evidence.
- **Schema registry impact:** none in this PR (no migration files changed).
- **Runtime/API impact:** none in this PR.
- **Production data impact:** none (no writes).

## Proposed Decision
- Current state for this docs-only planning PR: **GO (planning artifact only)**.
- Conditional implementation gate for future execution PR: **HOLD until migration SQL + server action implementation + verification evidence are provided in a separate code PR**.
