# Vercel Deploy Trigger

Purpose: intentionally trigger a fresh Vercel production deployment from `main` after PR #351 repaired the Vercel ignore script.

Trigger timestamp: 2026-05-19T04:00:00Z
Follow-up trigger timestamp: 2026-05-19T05:00:00Z
Baseline required commit: cf2f860cb127ca2c847611c181b0d06d329a210f

Connector evidence before this follow-up trigger: the Vercel project deployment list still showed production deployment dpl_3y6pqU4AVZK6poDUdynPENUbXoGF on Git commit 8aed48e2adfc2d135ddfe9e3298d484e816a3656, while GitHub main had advanced to 9883cb2ce43a65110b374d135369c1b438eb0512. No project/ref-specific fresh Git deployment action was exposed by the connected Vercel tools; the generic deploy-current-project action was not used because it is not project/ref-scoped in its exposed schema.

This file is deployment-control metadata only. It does not change runtime behavior, environment variables, domains, aliases, Supabase, RLS, auth, package files, marketplace DTO allowlists, Vercel config, secrets, or production data.
