# Supabase + GitHub setup

This repository uses GitHub as the delivery surface and Supabase as the backend service layer.

## 1. Supabase project

Create or select the correct Supabase project for Harbourview.

Collect these values from Supabase:

- Project URL
- Publishable / anon key
- Service role key

Map them into local development via `.env.local`:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_URL=http://localhost:3000
```

## 2. GitHub repository secrets

If future workflows require live Supabase access, store secrets in GitHub Actions secrets.

Recommended secret names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Do not put the service role key in repository variables, example files or client-side code.

## 3. Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

## 4. CI intent

The current CI workflow is designed to validate:

- install
- typecheck
- lint
- tests
- production build

The workflow uses placeholder environment values for non-live verification. If the build later needs real backend access during CI, switch those values to GitHub secrets and tighten the workflow accordingly.

## 5. Operating rules

- GitHub is the source of truth for code and workflows.
- Supabase is the source of truth for backend data and auth.
- Server-only Supabase access must stay in server code.
- `SUPABASE_SERVICE_ROLE_KEY` must never reach browser code.

## 6. Next hardening steps

1. add explicit migration/version discipline if schema files are introduced
2. add preview/staging deployment rules
3. add branch protection once CI is green
4. add a production environment in GitHub with protected secrets
