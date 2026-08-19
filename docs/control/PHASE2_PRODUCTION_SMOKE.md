# Phase 2 — Production smoke checklist

**Status:** Operator-run verification (not automated CI)  
**Canonical domain:** `https://harbourview.vercel.app` (also check custom domain if live)  
**After:** merges through PR #1535 / material-gaps closure  
**Owner:** Tyler / Harbourview ops

## A. Deploy freshness

- [ ] Vercel production deployment status = Ready
- [ ] Production commit SHA matches expected `main` tip
- [ ] Note deployment ID in this file or incident log

## B. Public routes (expect 200)

```bash
BASE="${BASE:-https://harbourview.vercel.app}"
for path in \
  "/intelligence/corridor-plan?origin=CA&destination=DE" \
  "/intelligence/corridor-coverage" \
  "/intelligence/landed-cost?origin=CA&destination=DE&product=flower-premium&volume=10" \
  "/intelligence/logistics-simulator" \
  "/marketplace/genetics" \
  "/education/cpd" \
  "/marketplace/financing" \
  "/manifest.webmanifest" \
  "/api/corridor-plan?origin=CA&destination=DE" \
  "/api/corridor-coverage" \
  "/api/landed-cost?origin=CA&destination=DE&product=flower-premium&volume=10" \
  "/api/landed-cost?meta=1"
do
  code=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE$path")
  echo "$code $path"
done
```

Or: `bash scripts/smoke-phase2.sh`

## C. Auth-gated (manual)

- [ ] `/dashboard/tools` redirects to login when anonymous; loads when signed in
- [ ] `/dashboard/corridor-plan?origin=CA&destination=DE` builds plan when playbooks published
- [ ] My Briefings cadence save → `PATCH /api/dashboard/briefing-preferences`

## D. Cron / email (ops)

```bash
# Dry-run personal briefings (requires CRON_SECRET)
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "$BASE/api/cron/personal-briefings-tick?dry=1"
```

- [ ] `RESEND_API_KEY` set on Vercel production
- [ ] `CRON_SECRET` set and matches Authorization header
- [ ] Vercel cron list includes `personal-briefings-tick` @ 08:30 UTC

## E. HOLD gates (registry)

- [ ] Anonymous `/admin` denied (no private leakage)
- [ ] Public leakage scan on sample intelligence + marketplace pages
- [ ] GitHub secrets `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` match registry team/project IDs
- [ ] Branch-protection required checks do not reference stale Netlify/Vercel contexts

## F. Repo visibility decision

- [ ] Tyler decides: keep **public** (re-baseline compliance) **or** make **private**
- [ ] Update `docs/control/PROJECT_REGISTRY.md` Master Register visibility row after decision

## G. Data quality loop

- [ ] Spot-check signal feedback (`SignalFeedbackButtons`) writes via RPC in staging/prod
- [ ] Orientation feedback posts appear as `inquiry_type=orientation_feedback`
- [ ] Review `GET /api/corridor-coverage` — prioritise publishing playbooks for non-plan-ready tracked pairs

## Record

| Date | Operator | BASE | Result |
|------|----------|------|--------|
| | | | |
