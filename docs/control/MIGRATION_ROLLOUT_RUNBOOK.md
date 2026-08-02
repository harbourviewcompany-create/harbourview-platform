# Migration Rollout Runbook
## PR #1204 — Platform Optimization
## Generated: 2026-07-29

---

## ⚠️ Pre-Flight Checklist

Before touching production, confirm ALL of the following:

- [ ] `main` branch is green (all CI checks passing)
- [ ] Database backup completed (Supabase point-in-time restore enabled)
- [ ] Staging environment is available and configured
- [ ] `npm run typecheck`, `npm run lint`, `npm run build` pass on this branch
- [ ] All required env vars are set in Vercel (see list below)
- [ ] On-call engineer is available for 2 hours post-deploy
- [ ] Rollback migration (`20260729000001_platform_optimizations_rollback.sql`) is ready

---

## 📋 Required Environment Variables

| Variable | Where | Status |
|---|---|---|
| `ANTHROPIC_API_KEY` | Vercel (existing) | ✅ |
| `GEMINI_API_KEY` | Vercel (existing) | ✅ |
| `HF_ENDPOINT_EXTRACT_QWEN3_4B` | Vercel (new) | ⬜ |
| `HF_TOKEN_SERVER` | Vercel (new) | ⬜ |
| `UPSTASH_REDIS_REST_URL` | Vercel (new) | ⬜ |
| `UPSTASH_REDIS_REST_TOKEN` | Vercel (new) | ⬜ |

---

## 🚀 Phase 1: Staging Deployment (30 min)

### Step 1.1 — Install dependency
```bash
git checkout kimi/platform-optimization-2026-07-29
npm install linkedom
npm ci
```

### Step 1.2 — Validate build
```bash
npm run typecheck
npm run lint
npm run build
```
If any of these fail, STOP. Fix and re-run.

### Step 1.3 — Apply migration to staging DB
1. Open Supabase Dashboard → SQL Editor
2. Select staging project
3. Run: `supabase/migrations/20260729000000_platform_optimizations.sql`
4. Verify: `SELECT COUNT(*) FROM countries;` → should return 12

### Step 1.4 — Run verification script
```bash
npx tsx scripts/verify-migration.ts
```
Expected: All checks pass (✅)

### Step 1.5 — Deploy to staging
```bash
vercel --target=preview
```

### Step 1.6 — Smoke tests
- [ ] `/admin/pipeline-health` loads without errors
- [ ] `/marketplace` renders correctly
- [ ] Intake form submits successfully (test with fake data)
- [ ] Run one scraper partition manually: `curl https://staging-url/api/cron/scraper-partition-0`
- [ ] Check Vercel logs for structured JSON output

---

## 🚀 Phase 2: Production Migration (15 min)

### Step 2.1 — Database backup
```sql
-- In Supabase SQL Editor (production)
-- Trigger a manual backup or verify PITR is active
SELECT now() as backup_timestamp;
```

### Step 2.2 — Apply migration
1. Open Supabase Dashboard → SQL Editor
2. Select **production** project
3. Run: `supabase/migrations/20260729000000_platform_optimizations.sql`
4. Verify: `SELECT COUNT(*) FROM countries;` → 12

### Step 2.3 — Run verification script against production
```bash
# Update .env to point to production Supabase
npx tsx scripts/verify-migration.ts
```
Expected: All checks pass

---

## 🚀 Phase 3: Production Deploy (10 min)

### Step 3.1 — Merge PR #1204
```bash
git checkout main
git merge --no-ff kimi/platform-optimization-2026-07-29
git push origin main
```

### Step 3.2 — Vercel auto-deploy
Monitor Vercel dashboard for build status.

### Step 3.3 — Update vercel.json cron schedules
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/scraper-partition-0",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/scraper-partition-1",
      "schedule": "5 */6 * * *"
    },
    {
      "path": "/api/cron/scraper-partition-2",
      "schedule": "10 */6 * * *"
    },
    {
      "path": "/api/cron/scraper-partition-3",
      "schedule": "15 */6 * * *"
    }
  ]
}
```
Commit and push.

---

## 🔍 Phase 4: Post-Deploy Monitoring (2 hours)

### Immediate (0–15 min)
- [ ] Vercel build successful
- [ ] `/admin/pipeline-health` accessible and loading data
- [ ] No 500 errors in Vercel error dashboard
- [ ] Supabase connection pool healthy

### Short-term (15–60 min)
- [ ] First scraper partition run completes without `budgetExceeded: true`
- [ ] Structured logs visible in Vercel Analytics / log aggregator
- [ ] Source health table shows expected sources
- [ ] No spike in error rates

### Medium-term (1–2 hours)
- [ ] All 4 partition cron jobs have run at least once
- [ ] AI API call count is ~1/5 of previous (batching working)
- [ ] No `circuit_breaker_open` events (unless AI is genuinely down)
- [ ] Marketplace candidates are being inserted with `parser_version` and `normaliser_model` populated

---

## 🚨 Rollback Procedure (If Needed)

### Scenario 1: Build Failure
```bash
git revert HEAD --no-edit
git push origin main
```
Vercel will auto-deploy the revert.

### Scenario 2: Database Issue
1. Open Supabase SQL Editor (production)
2. Run: `supabase/migrations/20260729000001_platform_optimizations_rollback.sql`
3. Verify with `scripts/verify-migration.ts` (should show failures for new columns — that's expected)
4. Revert code: `git revert HEAD --no-edit && git push`

### Scenario 3: Performance Degradation
1. Disable new cron routes in `vercel.json` (comment out partition routes)
2. Re-enable old single cron route
3. Push revert
4. Monitor until stable

---

## 📊 Success Criteria

| Metric | Target | Check After |
|---|---|---|
| Build passes | 0 errors | Immediately |
| Migration verification | 100% checks pass | Immediately |
| Scraper budget exceeded | <5% of runs | 2 hours |
| AI normalisation latency | ≤60% of previous | 2 hours |
| Passthrough rate | Stable or decreasing | 24 hours |
| Source health — failing | <10 sources | 2 hours |
| Intake form submissions | No 429s for legitimate users | 2 hours |
| Dashboard load time | <2s | Immediately |

---

## 📞 Escalation

If anything goes wrong:
1. Execute rollback procedure above
2. Check `docs/control/PLATFORM_OPTIMIZATION_PLAN.md` for detailed architecture
3. Review `lib/observability/structuredLog.ts` output for error traces
4. Contact: [your on-call rotation]
