# Admin Command Center — Phase 0–4 candidate

Frozen implementation base: `db692bceccdcf4dc263530b947b775c93fb6b535`

Implementation branch: `codex/admin-command-center-p0-p4`

Scope implemented:

- Phase 0 machine-checkable legacy Hub parity inventory.
- Responsive protected `AdminShell` with desktop rail and mobile drawer.
- Action-first `/admin` Command Center backed by live read models with degraded-source semantics.
- `/admin/work` normalized work queue using the existing review queue plus domain adapters.
- `/admin/signals` unified Engine + Regulatory Signal Review workspace.
- Typed explicit-ID signal batch endpoint with per-record outcomes and audit append bridge.
- Auth, DTO, batch, surface, security and responsive Playwright verification coverage.

Parity controls retained during this candidate:

- `/admin/hub` remains available for comparison.
- `/api/admin/hub-proxy` remains available only for the legacy Hub caller.
- `/admin/stripe-setup` remains unchanged.

Database change staged but not applied to production:

- `supabase/migrations/20260818123000_admin_review_queue_api_rpc.sql`

No deployment or production mutation is part of this branch workflow. The verification workflow uses an isolated local Supabase instance and a local Next.js process only.

Hub retirement remains out of scope until remaining Hub-only Actions, Countries, Users, Public Feed, Stripe, Staging, Intel/Agents, and source-toggle capabilities have explicit parity dispositions.
