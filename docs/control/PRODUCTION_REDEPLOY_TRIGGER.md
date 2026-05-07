# Production Redeploy Trigger

Purpose: force a fresh Vercel production deployment so `harbourview-platform.vercel.app` can be verified against the latest `main` source containing PR #80 mobile polish.

Triggered: 2026-05-06

Reason: Vercel project metadata showed a READY production deployment from latest `main`, but the public production alias was still serving stale legacy homepage and Marketplace HTML during live external checks.

No runtime behavior, routes, auth, Supabase, schema, API or data flow changes are introduced by this file.
