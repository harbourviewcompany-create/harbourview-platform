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

## Production verification rule

After every production push, verify the active deployment through Vercel and confirm that the production alias resolves to `https://harbourview.vercel.app`. Do not treat preview URLs, stale deployment URLs, or branch deployment URLs as the canonical production target.

Harbourview is a Next.js App Router platform for the public Harbourview Network experience and protected admin workflows.

## Project registry

The canonical project map is maintained in [`docs/control/PROJECT_REGISTRY.md`](docs/control/PROJECT_REGISTRY.md).

Before opening or merging a Harbourview PR, deployment task, Supabase task, Vercel task, cleanup action or agent handoff, identify the affected registry row and state whether the registry must change. Cleanup execution is tracked in [`docs/control/HARBOURVIEW_CLEANUP_CHECKLIST.md`](docs/control/HARBOURVIEW_CLEANUP_CHECKLIST.md).

## Local validation

Run local validation in this order:

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run build`
5. `npm test`
6. Run applicable targeted suites for changed domains.

Record exact commands and results in the PR evidence log.

## Platform baseline

- Next.js App Router
- TypeScript
- Tailwind CSS
- Public marketplace and network pages render without requiring a database dependency for baseline page delivery
- Legacy redirects are managed centrally in `proxy.ts` for the current Next.js runtime
- Protected admin paths remain server-guarded and must deny anonymous access
- Production branch remains `main`

## Governance guardrails

- Do not expose private provenance, source evidence, contactEmail, or internal review fields in public routes.
- Do not weaken admin role protections or bypass auth checks on `/admin` routes.
- Keep public positioning consistent with: **"Market access backed by intelligence and relationships."**
- Keep contact fallback aligned to `harbourviewcompany@gmail.com` unless verified governance docs and implementation are updated together.

## Build targets

- **Production web:** Vercel is the canonical web deployment target and production authority.
- **Local / Node build:** Use `npm run build` for standard Next.js/Node validation.
- **Cloudflare:** Cloudflare/OpenNext is not the canonical production web runtime. Cloudflare tooling is limited to separately governed Worker/intelligence workflows. Do not use obsolete `npm run preview`, `npm run deploy`, or `npm run upload` commands unless those scripts are present in `package.json` and the applicable Cloudflare target is explicitly documented.

## Database migrations

Repository migrations are the source of truth for reproducible database state. Do not apply a new production migration before its migration file is committed and reviewed. After merge, apply the migration and record the production ledger/evidence result. Production-only schema changes require explicit reconciliation.
