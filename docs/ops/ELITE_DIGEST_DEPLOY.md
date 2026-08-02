# Elite Digest deployment control

Status: **HOLD until explicitly authorized for production activation.**

Merging application or migration code is not authorization to apply migrations,
create a deployment, or move a production alias. The production migration
workflow is manual-dispatch only, requires the explicit
`APPLY_PRODUCTION_MIGRATIONS` selection, and attaches the write job to the
protected `production-database` GitHub environment.

Configure that environment with required reviewers and a `main` branch restriction
before activation. Until those repository settings are verified, production
activation remains HOLD.

## 1. Migration sequence

Reconcile exact filenames and definitions against the target migration ledger in
this version order:

```text
20260730230000_elite_digest_from_pipeline_b.sql
20260730233000_intelligence_self_improve_loop.sql
20260731090000_digest_rank_includes_feedback.sql
20260731100000_run_daily_digest_uses_feedback_rank.sql
20260731110000_feedback_service_aggregates.sql
20260731130000_elite_digest_release_hardening.sql
20260802073000_hv_dedup_assign_restore_hnsw_knn.sql
20260802152500_signal_feedback_api_rpcs.sql
20260802163000_elite_digest_rpc_boundary_hardening.sql
```

The previous HNSW file shared `20260731090000` with the feedback-ranking
migration. It is replaced by the unique `20260802073000` forward version.

Use a Supabase preview branch for application tests. If a preview is unavailable,
keep production on HOLD. Do not use production as an automatic preview fallback.
Production application requires remote-ledger reconciliation, all documented
fixtures and checks, and separate explicit operator approval.

The feedback RPC migration fails closed if legacy duplicate `(signal_id, user_id)`
rows exist. Reconcile those rows explicitly before applying it; the migration does
not silently delete or choose operator feedback.

### Forward privilege and Data API hardening

Apply the ninth migration only after the HNSW restoration and feedback RPC
migration:

```text
20260802163000_elite_digest_rpc_boundary_hardening.sql
```

This migration preserves all feedback rows while enforcing the approved boundary:

- `public.hv_dedup_assign(double precision, integer)` and
  `public._digest_cluster_size(text)` are executable only by `service_role`.
- `anon` and `authenticated` have no direct privileges on
  `public.signal_relevance_feedback`.
- authenticated clients submit one current verdict through
  `api.submit_signal_relevance_feedback`.
- ranking reads only `signal_id` and `verdict` through the service-role-only
  `api.signal_relevance_feedback_for_ranking` projection.
- RLS remains enabled as defense in depth.

Before production application, verify the target has no duplicate
`(signal_id, user_id)` rows, capture the existing grants and function
definitions, and run the PostgreSQL 17 + pgvector boundary fixture.

### Exact production allowlist

Production activation is controlled by:

```text
supabase/release-controls/elite-digest-production-activation.json
```

Only these exact versions, filenames and mandatory Git blob SHAs are approved:

```text
20260802073000
20260802152500
20260802163000
```

The production workflow generates a complete repository-versus-live manifest and
returns HOLD when any remote-only migration, unrelated pending migration, partial
activation, duplicate pending version, invalid filename, missing content hash or
approved-file mismatch exists. It rechecks the same gate immediately before
`db push --include-all`. The broad push command is never reached unless the
complete pending set is exactly the approved sequence.

The migration drift parser accepts both ASCII and box-drawing Supabase CLI tables.
A nonempty linked-project result that parses to zero rows is a hard failure. The
drift and activation workflows use the same explicit Supabase project reference.

## 2. Environment names

Verify names and presence without copying values into logs or PRs:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `openai_api_key` or an approved alternative provider key in Vault
- `RESEND_API_KEY`
- `HARBOURVIEW_PIPELINE_REVIEW_NOTIFY_EMAIL`

The database password is passed to PostgreSQL through `PGPASSWORD`. The workflow
constructs the encoded database URL only inside the migration-push step because
the Supabase CLI requires `--db-url`; it is masked and is not written to workflow
outputs.

## 3. Database verification

The production workflow runs these evidence packets without invoking mutating
application functions:

```text
tests/sql/elite_digest_production_preflight_read_only.sql
tests/sql/elite_digest_production_postflight_read_only.sql
```

The preflight packet captures the exact live ledger names, schema prerequisites,
feedback integrity, RLS, policies, ACLs, indexes, function definitions and
definition hashes. The postflight packet verifies exact ledger names, required
object existence, RPC grants, direct-table denial, RLS, HNSW shape and
one-current-verdict enforcement. CI executes both packets against PostgreSQL 17
with pgvector.

A separate read-only fingerprint comparison proves that feedback storage did not
change during activation. Pause feedback submissions for the controlled migration
window. The comparison is intentionally strict: a concurrent legitimate feedback
write returns HOLD rather than producing ambiguous data-preservation evidence.

After activation and before any deployment alias changes, verify operational
functions separately under explicit write/run authorization:

```sql
select public.run_daily_digest();
select public.hv_intelligence_outcome_check();
select pg_get_functiondef('public.hv_dedup_assign(double precision,integer)'::regprocedure);
select pg_get_functiondef('api.submit_signal_relevance_feedback(text,text,text,text)'::regprocedure);
select pg_get_functiondef('api.signal_relevance_feedback_for_ranking(text[],timestamptz)'::regprocedure);
```

Confirm the HNSW body retains `ORDER BY <=> LIMIT`, the feedback writer forces
`user_id` from `auth.uid()`, rejects unknown signal IDs, and upserts one current
verdict per operator and signal. Confirm the ranking projection is executable
only by `service_role` and exposes no user IDs, notes, or other operator data.

## 4. Product smoke

Run only against a verified unaliased artifact after database and environment
gates pass:

1. `GET /api/dashboard/digest` returns `curated-edition` or `elite-ranked-fallback`.
2. Corroboration, language, source confidence, and decoded text render correctly.
3. Select a designated test signal and record the authenticated verifier ID and
   UTC start time.
4. Submit `helpful` through `POST /api/signals/feedback`; capture the returned
   `feedbackId` and verify a `+8` current verdict.
5. Submit `not_helpful`, `stale`, and `wrong_country` sequentially as the same
   verifier. Confirm the same current-verdict row is updated rather than creating
   repeated votes, and verify effects `-12`, `-6`, and `-10` respectively.
6. Delete only the captured test row through a separately authorized service-role
   cleanup action, then prove its ID no longer exists. Verification feedback must
   not bias live ranking for 90 days.
7. Verify `/api/admin/intelligence-health` includes `product_outcome`.

## 5. Deployment and alias order

1. Generate the exact migration manifest and require GO.
2. Select `APPLY_PRODUCTION_MIGRATIONS` from `main`.
3. Obtain independent approval through the protected `production-database`
   environment.
4. Pause feedback submissions for the controlled migration window.
5. Preserve the 90-day preflight rollback-forward evidence artifact.
6. Apply the approved sequence and require postflight GO.
7. Resume feedback submissions only after postflight GO.
8. Verify environment names without exposing values.
9. Create an immutable deployment and keep it unaliased.
10. Run database and authenticated product smoke checks.
11. Record sanitized evidence.
12. Move the production alias only under separate explicit authorization.
13. Observe a successful daily `/api/cron/intelligence-health` invocation at
    `15 10 * * *`.

## 6. Rollback-forward

Never delete an applied migration ledger row or rewrite migration history. Both
preflight and activation evidence are retained for 90 days. Use the preflight
artifact to create a new uniquely versioned repair that restores only the captured
prior grants or definitions. Preserve feedback rows, the HNSW implementation and
the RPC-only client boundary unless a reviewed production defect requires a
narrower correction.

Rollback-forward guidance applies only after a successful migration push. If an
allowlist or pre-push gate stops the run first, no migration repair is implied.

## 7. Guardrails

- Human `reviewed` flags are unchanged.
- Only actually selected Digest signals receive `used_in_digest_at`.
- Feedback effects remain signed: helpful `+8`, not helpful `-12`, stale `-6`,
  wrong country `-10`; the final ranking contribution remains clamped by the
  Digest ranker.
- One operator contributes one current verdict per signal; repeated submissions
  update that row and cannot amplify ranking weight.
- The underlying feedback table is not exposed through PostgREST.
- No production migration or deployment action is implied by merge.
