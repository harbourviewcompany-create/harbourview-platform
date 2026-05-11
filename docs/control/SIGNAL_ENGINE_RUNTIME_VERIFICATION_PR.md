# Signal Engine Runtime Verification PR

Temporary production verification scope only. This PR adds a gated script for live Signal Engine runtime proof. It does not add app routes, change production UI, change RLS, change Supabase schema, or change public DTO behavior.

## Preconditions

Required environment variables:

```bash
HV_SIGNAL_RUNTIME_VERIFY=1
HV_SIGNAL_VERIFY_TOKEN=<operator-owned random token>
HV_SIGNAL_VERIFY_TOKEN_CONFIRM=<same token>
NEXT_PUBLIC_SUPABASE_URL=https://zvxdgdkukjrrwamdpqrg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production anon key>
SUPABASE_SERVICE_ROLE_KEY=<production service role key>
HARBOURVIEW_PUBLIC_BASE_URL=https://harbourview.vercel.app
HV_SIGNAL_VERIFY_OUTPUT=docs/control/evidence/signal-engine-runtime-verification.latest.json
```

Playwright is intentionally not committed as a dependency to avoid package-lock drift in this temporary PR. Install it only in the verification environment:

```bash
npm install --no-save playwright
npx playwright install chromium
npm run test:signal-engine-runtime -- --token=$HV_SIGNAL_VERIFY_TOKEN
```

## What the script verifies

1. Refuses to run unless `HV_SIGNAL_RUNTIME_VERIFY=1`.
2. Refuses to run unless the verification token is supplied twice and matches.
3. Refuses to run against any Supabase project except `zvxdgdkukjrrwamdpqrg`.
4. Creates temporary confirmed Supabase Auth users for:
   - operator
   - analyst
   - viewer
   - missing-role
5. Adds temporary `public.user_roles` rows only for operator, analyst and viewer.
6. Seeds one private temporary `signals.signals` row with slug prefix `hv_signal_runtime_verify_20260511`.
7. Runs real Supabase Auth password sessions through PostgREST against `signals.signals`:
   - operator must read, insert, update and delete.
   - analyst must read zero and fail write paths.
   - viewer must read zero and fail write paths.
   - missing-role must read zero and fail write paths.
   - anonymous must read zero and fail write paths.
8. Runs `/admin` login behavior with Playwright:
   - operator must access admin after login.
   - analyst/viewer/missing-role must be denied.
   - anonymous `/admin` must deny without Vercel Authentication.
9. Runs anonymous leakage probes against `/signals` and `/admin`.
10. Deletes all temporary signal rows, role rows and Auth users.
11. Writes a JSON proof artifact.

## GO criteria

Return GO only if:

- every check in the JSON proof has `status: "PASS"`;
- every cleanup check has `status: "PASS"`;
- the generated proof has `decision: "GO"`;
- zero temporary `signals.signals` rows remain;
- zero temporary `public.user_roles` rows remain;
- all temporary Supabase Auth users are deleted.

Any failed, warning or skipped cleanup is HOLD.

## Removal

After evidence is captured, remove this PR or revert:

- `scripts/verify-signal-engine-runtime.mjs`
- `package.json` script `test:signal-engine-runtime`
- this documentation file
