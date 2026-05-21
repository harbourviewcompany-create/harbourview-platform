# Vercel Deploy Trigger

Purpose: intentionally trigger a fresh Vercel production deployment from `main` after PR #426 merged the full Natural Earth globe dataset.

Trigger timestamp: 2026-05-19T04:00:00Z
Follow-up trigger timestamp: 2026-05-19T05:00:00Z
Post-PR-426 production trigger timestamp: 2026-05-20T21:08:00Z
Baseline required commit: cf2f860cb127ca2c847611c181b0d06d329a210f
Required source commit before this trigger: eba6092f3e43a7942220b44ab4e9e85d8386e775

Connector evidence before the 2026-05-19 follow-up trigger: the Vercel project deployment list still showed production deployment dpl_3y6pqU4AVZK6poDUdynPENUbXoGF on Git commit 8aed48e2adfc2d135ddfe9e3298d484e816a3656, while GitHub main had advanced to 9883cb2ce43a65110b374d135369c1b438eb0512. No project/ref-specific fresh Git deployment action was exposed by the connected Vercel tools; the generic deploy-current-project action was not used because it is not project/ref-scoped in its exposed schema.

Connector/dashboard evidence before the 2026-05-20 trigger: PR #426 was merged into main at eba6092f3e43a7942220b44ab4e9e85d8386e775, but Vercel production remained on an older deployment. Attempting to redeploy the older Vercel deployment failed because its source SHA c0fa7cab814a22a47699dd553e48c686efb0a576 no longer represents the current main tip. This metadata commit exists so Vercel receives a fresh main-branch production source commit that includes the PR #426 globe dataset.

This file is deployment-control metadata only. It does not change runtime behavior, environment variables, domains, aliases, Supabase, RLS, auth, package files, marketplace DTO allowlists, Vercel config, secrets, or production data.