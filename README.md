# Harbourview Platform

## Brand spelling (canonical)

| Form | Use |
|------|-----|
| **Harbourview** | Product and company name (British/Canadian *Harbour*, not *Harbor*) |
| **HARBOURVIEW** | UI wordmark only |
| `harbourview-platform` | GitHub repository |
| `https://harbourview.vercel.app` | **Only** canonical production domain |

**Do not use:** Harborview, Harbor View, OurView, ourview, ourview.vercel.app, or truncated mobile chrome strings as the product name or production URL.

## Repository status

| Field | Value |
|---|---|
| Canonical status | Active — production platform |
| Production domain | `https://harbourview.vercel.app` |
| Production branch | `main` |
| Vercel project ID | `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS` |
| Vercel team | `harbourview` (`team_0rK4jTvMLlSufR0ZzX4LCKYi`) |
| Deployment target | Vercel (auto-deploy on push to `main`) |
| Database target | Supabase (see `docs/control/PROJECT_REGISTRY.md`) |
| Owner | `harbourviewcompany-create` |
| Safe next action | Push to `main`, then verify the production deployment at `https://harbourview.vercel.app` |

## Production verification rule

After every production push, verify the active deployment through Vercel and confirm that the production alias resolves to `https://harbourview.vercel.app`. Do not treat preview URLs, stale deployment URLs, or branch deployment URLs as the canonical production target.

Harbourview is a Next.js App Router platform for the public Harbourview Network experience and protected admin workflows.

## Project registry

The canonical project map is maintained in [`docs/control/PROJECT_REGISTRY.md`](docs/control/PROJECT_REGISTRY.md).

Before opening or merging a Harbourview PR, deployment task, Supabase task, Vercel task, cleanup action or agent handoff, identify the affected registry row and state whether the registry must change. Cleanup execution is tracked in [`docs/control/HARBOURVIEW_CLEANUP_CHECKLIST.md`](docs/control/HARBOURVIEW_CLEANUP_CHECKLIST.md).

## Local validation

Run local validation in this order:

1. Install dependencies: `npm ci`
2. Typecheck: `npm run typecheck`
3. Lint: `npm run lint`
4. Build: `npm run build`
5. Optional targeted suites (when your changes touch these areas): `npm run test:globe-router`, `npm run test:visibility`

Before opening a PR, the install, typecheck, lint, and build checks are required, while targeted suites are optional unless your changes directly affect those domains.

Include a short note in your PR validation results indicating whether `docs/control/PROJECT_REGISTRY.md` is impacted and what row(s) were reviewed or updated.

## Platform baseline

- Next.js App Router
- TypeScript
- Tailwind CSS
- Public marketplace and network pages render without requiring a database dependency for baseline page delivery
- Redirects are managed centrally in `middleware.ts` for legacy route compatibility
- Protected admin paths remain server-guarded and must deny anonymous access
- Production branch remains `main`

## Governance guardrails

- Do not expose private provenance, source evidence, contactEmail, or internal review fields in public routes.
- Do not weaken admin role protections or bypass auth checks on `/admin` routes.
- Keep public positioning consistent with: **"Market access backed by intelligence and relationships."**
- Keep contact fallback aligned to `harbourviewcompany@gmail.com` unless verified governance docs and implementation are updated together.

## Build Targets

- **Local / Node build path:** Use `npm run build` for standard local Next.js/Node build validation.
- **Cloudflare / OpenNext build path:** Use `npm run preview`, `npm run deploy`, and `npm run upload` for the Cloudflare runtime packaging, preview, and deployment pipeline.
