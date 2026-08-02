# Elite Digest deployment control

Status: **HOLD until explicitly authorized for production activation.**

Merging application or migration code is not authorization to apply migrations,
create a deployment, or move a production alias. The production migration
workflow is manual-dispatch only and requires the explicit
`APPLY_PRODUCTION_MIGRATIONS` selection.

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
```

The previous HNSW file shared `20260731090000` with the feedback-ranking
migration. It is replaced by the unique `20260802073000` forward version.

Use a Supabase preview branch for application tests. If a preview is unavailable,
keep production on HOLD. Do not use production as an automatic preview fallback.
Production application requires remote-ledger reconciliation, all documented
fixtures and checks, and separate explicit operator approval.

## 2. Environment names

Verify names and presence without copying values into logs or PRs:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `openai_api_key` or an approved alternative provider key in Vault
- `RESEND_API_KEY`
- `HARBOURVIEW_PIPELINE_REVIEW_NOTIFY_EMAIL`

## 3. Database verification

Before any deployment alias changes:

```sql
select public.run_daily_digest();
select public.hv_intelligence_outcome_check();
select pg_get_functiondef('public.hv_dedup_assign(double precision,integer)'::regprocedure);
select pg_get_functiondef('api.submit_signal_relevance_feedback(text,text,text,text)'::regprocedure);
select pg_get_functiondef('api.signal_relevance_feedback_for_ranking(text[],timestamptz)'::regprocedure);
```

Confirm the HNSW body retains `ORDER BY <=> LIMIT`, the feedback writer forces
`user_id` from `auth.uid()`, and the ranking projection is executable only by
`service_role`.

## 4. Product smoke

Run only against a verified unaliased artifact after database and environment
gates pass:

1. `GET /api/dashboard/digest` returns `curated-edition` or `elite-ranked-fallback`.
2. Corroboration, language, source confidence, and decoded text render correctly.
3. Select a designated test signal and record the authenticated verifier ID and
   UTC start time.
4. Submit each verdict through `POST /api/signals/feedback` and capture the exact
   returned `feedbackId` values.
5. Verify helpful is positive and `not_helpful`, `stale`, and `wrong_country` are
   negative ranking effects.
6. Delete only those captured rows through a separately authorized service-role
   cleanup action, then prove the IDs no longer exist. Verification feedback must
   not bias live ranking for 90 days.
7. Verify `/api/admin/intelligence-health` includes `product_outcome`.

## 5. Deployment and alias order

1. Reconcile and explicitly authorize migrations.
2. Verify environment names without exposing values.
3. Create an immutable deployment and keep it unaliased.
4. Run database and authenticated product smoke checks.
5. Record sanitized evidence.
6. Move the production alias only under separate explicit authorization.
7. Observe a successful daily `/api/cron/intelligence-health` invocation at
   `15 10 * * *`.

## 6. Guardrails

- Human `reviewed` flags are unchanged.
- Only actually selected Digest signals receive `used_in_digest_at`.
- Feedback effects remain signed: helpful `+8`, not helpful `-12`, stale `-6`,
  wrong country `-10`; the final ranking contribution remains clamped by the
  Digest ranker.
- The underlying feedback table is not exposed through PostgREST.
- No production migration or deployment action is implied by merge.
