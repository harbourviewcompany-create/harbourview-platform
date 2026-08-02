# Elite Digest deploy checklist (PR #1221)

> **Release status (2026-07-31 18:08 UTC): HOLD.** PR #1221 is merged, but the
> production deployment recorded by GitHub/Vercel is still commit `21ac080`,
> which predates the Elite Digest merge (`a1e11f6`) and release hardening
> (`4227d70`). Both one-use release attempts passed typecheck, targeted tests,
> the full test suite, and the production build, then failed while creating the
> Vercel deployment. Do not mark this checklist complete until a production
> deployment containing at least `4227d70` is READY and the authenticated SQL
> and product smoke checks below have passed.

## 1. Apply migrations (order matters)

```text
20260730230000_elite_digest_from_pipeline_b.sql
20260730233000_intelligence_self_improve_loop.sql
20260731090000_digest_rank_includes_feedback.sql
20260731100000_run_daily_digest_uses_feedback_rank.sql
20260731110000_feedback_service_aggregates.sql
20260802073000_hv_dedup_assign_restore_hnsw_knn.sql
20260731130000_elite_digest_release_hardening.sql
```

Branch-test on a Supabase preview if available; otherwise apply to production after merge.

## 2. Vault / env

- [ ] `openai_api_key` (preferred) or anthropic / gemini in vault (live value not verified)
- [ ] `CRON_SECRET` on Vercel (live value not verified)
- [ ] `RESEND_API_KEY` + `HARBOURVIEW_PIPELINE_REVIEW_NOTIFY_EMAIL` (Stage G alerts; live values not verified)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` for server-side Supabase client construction (live value not verified)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` present for feedback aggregates + health RPC (live value not verified)

Repository-level verification confirms these are the required names and
locations; it is not evidence that the live secret values exist or are valid.

## 3. Smoke SQL

```sql
-- Fire (or collect if a job is already pending)
select public.run_daily_digest();

-- Expect phase fire or collect / published
select digest_date, status, jsonb_array_length(headlines) as n
from public.daily_digest
order by digest_date desc
limit 3;

-- Outcome health
select public.hv_intelligence_outcome_check();
```

## 4. Product smoke

1. `GET /api/dashboard/digest` → `mode: "curated-edition"` or `elite-ranked-fallback`
2. Digest UI shows corroboration / language chips when present
3. Choose a designated release-verification signal and record its `signal_id`, the
   authenticated verifier `user_id`, and the UTC start timestamp. Mark it **Useful**,
   capture the exact inserted `signal_relevance_feedback.id`, verify the UI response,
   then delete that exact row through the authorized admin path before ending the
   smoke. Confirm the captured ID no longer exists so release verification cannot
   bias digest ranking for 90 days.
4. `GET /api/admin/intelligence-health` includes `product_outcome`
5. After deploy, Vercel cron hits `/api/cron/intelligence-health` **once a day, scheduled
   `15 10 * * *` (the 10:00 UTC hour)**.
   - On Hobby, each cron job may run **at most once per day**. This is a per-job frequency
     cap, not a project-wide one-run-total cap — `vercel.json` carries nine cron jobs and
     production deploys succeed. A sub-daily schedule fails the deploy outright: the earlier
     `15 */6 * * *` returned `HTTP 400 cron_jobs_limits_reached` (Actions run 30642287937).
   - The 10:00 hour is deliberately AFTER the 06:00-09:00 digest window. As the only run of
     the day, a slot inside that window would report `digest_missed_today` for a digest that
     is still legitimately pending, with no later run to correct the false alarm.
   - Treat the fire time as approximate, not as exactly 10:15. Vercel is reported to trigger
     Hobby crons at some point within the scheduled hour rather than on the minute; that
     behaviour was **not confirmed against Vercel's own docs** in the session that wrote this
     note (the pricing page 403s to automated fetches), so it is recorded as unverified. The
     choice of hour is robust either way — anywhere in 10:00-10:59 is still clear of the
     digest window.

## 5. Guardrails

- Does not change human `reviewed` flags
- Only sets `used_in_digest_at` on selected rows
- Ranking soft-boost from feedback is clamped ±25

## 6. Release verification record

Verified at `2026-07-31 18:08 UTC` without privileged production credentials:

- PR #1221 is merged as `a1e11f64994c1f49a91b30161408cdc2caaaa38c`.
- Release-hardening PR #1228 is merged as
  `4227d70df46c20e556fb537d3bacd38823d54033`.
- Release workflow runs
  [30642287937](https://github.com/harbourviewcompany-create/harbourview-platform/actions/runs/30642287937)
  and
  [30642444790](https://github.com/harbourviewcompany-create/harbourview-platform/actions/runs/30642444790)
  passed install, typecheck, targeted tests, full tests, and build. Both failed
  at **Create Vercel production deployment from exact Git SHA**; neither reached
  the readiness check.
- GitHub's latest recorded production deployment is `21ac080` at
  `2026-07-31 11:05:38 UTC`. The production host returns `404` for
  `/api/cron/intelligence-health`, confirming that the deployed artifact does
  not yet contain the Elite Digest cron route. The authenticated admin and
  dashboard endpoints return `401` without credentials, as expected.
- The repository config schedules `/api/cron/intelligence-health` at
  `15 10 * * *`; this is configuration evidence only until the target artifact
  is deployed and cron execution is observed.

### Remaining release actions

1. Reconcile the seven migration files in section 1 against the target Supabase
   migration ledger. Apply every missing migration through the sanctioned
   migration path in the listed dependency order, and verify the exact function,
   view, grant, and index definitions before any production alias change.
2. Verify the live Vault and Vercel values in section 2 by name only. Do not
   copy secret values into logs, commits, issues, or PRs.
3. Repair or replace the Vercel deployment credential/integration used by the
   release workflow, then create an immutable deployment for a `main` commit
   containing at least `4227d70`. Keep it unaliased until the database and
   environment prerequisites above are verified and the deployment reaches
   `READY`.
4. Run the smoke SQL and authenticated product smoke checks in sections 3 and
   4 against the unaliased deployment. Record sanitized outputs and timestamps
   in the release PR/evidence log.
5. Alias the verified immutable deployment to production only after steps 1-4
   pass, then observe at least one successful Vercel cron invocation of
   `/api/cron/intelligence-health`.
