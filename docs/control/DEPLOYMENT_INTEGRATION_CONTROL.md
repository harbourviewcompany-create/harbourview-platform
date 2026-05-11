# Deployment Integration Control

## Objective

Stop ordinary working branches from creating full failed deployments across Vercel and Netlify. Keep production deployment available from `main` while requiring explicit deploy intent for previews.

## Canonical Vercel production

The canonical production domain is `harbourview.vercel.app`.

The current Vercel project shown in the production dashboard is `harbourview` under the `harbourview` scope. The latest known production deployment points to commit `e67fbee253ffe22b147fd0e144cbd6a8297e4e69`.

## Vercel branch policy

Vercel reads `vercel.json`:

```json
{
  "ignoreCommand": "bash scripts/vercel-ignore-wbcc-only.sh"
}
```

Vercel ignore-command semantics:

- exit `1` continues the build
- exit `0` skips the build

Allowed builds:

- production environment
- `main`
- `preview/*`
- `deploy/*`

Skipped builds:

- `feature/*`
- `fix/*`
- `cloudflare/*`
- `vercel/*`
- `dependabot/*`
- `renovate/*`
- `github-actions/*`
- `bot/*`
- `codex/*`
- all other unrecognized branches by default

## Netlify branch policy

Netlify reads `netlify.toml`:

```toml
[build]
  ignore = "bash scripts/netlify-ignore-branch-policy.sh"
```

Netlify build-ignore semantics match the script in `scripts/netlify-ignore-branch-policy.sh`:

- exit `1` continues the build
- exit `0` cancels/ignores the build

Allowed builds:

- production/main
- `preview/*`
- `deploy/*`

Skipped builds:

- `feature/*`
- `fix/*`
- `cloudflare/*`
- `vercel/*`
- bot/generated branches
- all other unrecognized branches by default

## Cloudflare Workers Git integration

The repository currently contains `wrangler.jsonc`, which enables a Cloudflare Workers target, but Cloudflare's Git integration is not controlled by `vercel.json` or `netlify.toml`. If Cloudflare continues posting failed deploy statuses for ordinary PR branches, disable Cloudflare Git auto-deploys or restrict them to `main` / deploy-intent branches inside the Cloudflare dashboard.

## Operator rule

Use ordinary `feature/*` and `fix/*` branches for code work without automatic deployment. Use `preview/*` or `deploy/*` only when a full external preview deployment is explicitly required.

## Verification checklist

GO requires:

1. `main` contains the strict Vercel ignore script.
2. `main` contains `netlify.toml` and the Netlify ignore script.
3. A new `fix/*` branch no longer creates a full Vercel preview build.
4. A new `fix/*` branch no longer creates Netlify preview deployments.
5. `main` remains capable of production deployment.
6. Cloudflare Git integration is manually disabled or branch-restricted if it continues to post failed PR statuses.
