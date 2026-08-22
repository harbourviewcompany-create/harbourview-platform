# PROJECT_REGISTRY.md — Talent row (add on merge)

Add the following row (or equivalent) to `docs/control/PROJECT_REGISTRY.md`:

| Surface / Module | Status | Owner / Notes | Related files |
|------------------|--------|---------------|---------------|
| Talent Job Board (Command → Talent) | Active — Phase 0/1 foundation | Review-gated job board for regulated cannabis roles. Separated from counterparty records. | `supabase/migrations/20260821120000_talent_job_board.sql`, `lib/server/talentQuery.ts`, `lib/server/talentOperations.ts`, `components/command-centre/talent/*`, `app/api/talent/*`, `docs/control/TALENT_JOB_BOARD_SPEC.md` |

Also update any “static mock” references in FRONTEND_DASHBOARD_OPTIMIZATION_PLAN.md or HANDOFF.md once the live list is confirmed in production.
