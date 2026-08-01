# Elite Digest deploy checklist (PR #1221)

## 1. Apply migrations (order matters)

```text
20260730230000_elite_digest_from_pipeline_b.sql
20260730233000_intelligence_self_improve_loop.sql
20260731090000_digest_rank_includes_feedback.sql
20260731100000_run_daily_digest_uses_feedback_rank.sql
20260731110000_feedback_service_aggregates.sql
```

Branch-test on a Supabase preview if available; otherwise apply to production after merge.

## 2. Vault / env

- [ ] `openai_api_key` (preferred) or anthropic / gemini in vault
- [ ] `CRON_SECRET` on Vercel
- [ ] `RESEND_API_KEY` + `HARBOURVIEW_PIPELINE_REVIEW_NOTIFY_EMAIL` (Stage G alerts)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` present for feedback aggregates + health RPC

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
3. Mark one item **Useful** → row in `signal_relevance_feedback`
4. `GET /api/admin/intelligence-health` includes `product_outcome`
5. After deploy, Vercel cron hits `/api/cron/intelligence-health` **once daily at 10:15 UTC**
   (Hobby plan allows one cron run per day; a 6h schedule fails the deploy outright with
   `HTTP 400 cron_jobs_limits_reached`. 10:15 is deliberately AFTER the 06:00-09:00 digest
   window, so the single run observes a finished cycle rather than reporting
   `digest_missed_today` while the digest is still legitimately pending.)

## 5. Guardrails

- Does not change human `reviewed` flags
- Only sets `used_in_digest_at` on selected rows
- Ranking soft-boost from feedback is clamped ±25
