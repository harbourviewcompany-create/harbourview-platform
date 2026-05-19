# Harbourview Platform

Harbourview is a Next.js App Router platform for the public Harbourview Network experience and protected admin workflows.

## Project registry

The canonical project map is maintained in [`docs/control/PROJECT_REGISTRY.md`](docs/control/PROJECT_REGISTRY.md).

Before opening or merging a Harbourview PR, deployment task, Supabase task, Vercel task, cleanup action or agent handoff, identify the affected registry row and state whether the registry must change. Cleanup execution is tracked in [`docs/control/HARBOURVIEW_CLEANUP_CHECKLIST.md`](docs/control/HARBOURVIEW_CLEANUP_CHECKLIST.md).

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
