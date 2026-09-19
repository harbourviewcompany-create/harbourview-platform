# Branch protection — main

## Required (set in GitHub Settings → Branches)

1. **Require status checks to pass before merging**
   - Include at minimum: Type Check, Security / Leakage (or the aggregate CI job names from `.github/workflows/ci.yml`)
2. **Do not allow bypassing** the above settings for administrators (Enforce admins)
3. **No force pushes** to `main`
4. Prefer **Require a pull request** for human changes; automation may use a bot account with limited exceptions

## Why

Direct pushes to `main` have repeatedly bypassed expected status checks during incident fixes. That ships type errors (e.g. missing modules) to production before CI catches them.

## Apply via API (admin token)

```bash
gh api -X PUT repos/harbourviewcompany-create/harbourview-platform/branches/main/protection \
  --input branch-protection.json
```

After enabling, redeploy only from green CI on `main`.
