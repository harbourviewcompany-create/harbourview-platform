# Phase 2 — Production smoke checklist

**Status:** Operator-run verification  
**Canonical domain:** `https://harbourview.vercel.app`  
**Last automated pass:** 2026-08-19 ~02:05 UTC (pre-proxy fix)

## Findings (2026-08-19)

| Check | Result |
|-------|--------|
| `GET /api/corridor-plan?origin=CA&destination=DE` | ✅ 200 + plan body |
| `GET /api/landed-cost` + `?meta=1` | ✅ 200 |
| `GET /marketplace/genetics` | ✅ 200 public |
| `GET /manifest.webmanifest` | ✅ 200 |
| Anonymous `/admin` | ✅ 307 → `/login?next=/admin` (denied) |
| `/marketplace/financing` | ✅ 307 → Command Centre financing tool (policy) |
| Orientation pages under `/intelligence/*` | ❌ were 307 → login — **fixed in proxy PUBLIC_AUTH_EXCEPTIONS** |
| `/education/cpd` | ❌ same — **fixed** |
| `GET /api/corridor-coverage` | ⏳ 404 until deploy includes material-gaps commit |

Re-run after `fix/public-orientation-proxy` is on production.

## B. Public routes (expect **200**, not login)

```bash
BASE="${BASE:-https://harbourview.vercel.app}"
bash scripts/smoke-phase2.sh
# Also:
curl -sS -o /dev/null -w "%{http_code}\n" "$BASE/intelligence/corridor-plan?origin=CA&destination=DE"
# must be 200, Location must NOT be /login
```

## C–G

See prior sections: auth tools hub, cron dry-run, HOLD gates, repo visibility, playbook editorial.

## Record

| Date | Operator | BASE | Result |
|------|----------|------|--------|
| 2026-08-19 | agent smoke | harbourview.vercel.app | APIs OK; pages gated until proxy fix |
