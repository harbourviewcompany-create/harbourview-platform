# Harbourview Platform

Harbourview is a Next.js App Router platform for the public Harbourview Network experience and protected admin workflows.

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
