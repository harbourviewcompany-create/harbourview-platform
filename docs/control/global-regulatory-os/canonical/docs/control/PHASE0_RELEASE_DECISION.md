# Phase 0 Release Decision

## Technical decision: GO

The replacement package directly verifies the controlling archive bytes, materializes source files normally, records all canonical post-source changes in the regenerated manifest, validates the 249-entry ISO country/territory universe, verifies all P0-001 through P0-012 evidence paths, and passes isolated PostgreSQL 17 clean-install, simulated-upgrade, RLS and negative authorization tests.

## Operator decision: HOLD

Technical verification does not ratify policy or authorize production. Explicit operator decisions remain required for constitution ratification, source-rights policy, retention/residency policy, bounded-context adoption, production migration sequencing, deployment, and public claims.

## Production boundary

The 13 canonical migrations remain under `docs/control/global-regulatory-os/canonical/db/migrations`. They are not copied into `supabase/migrations`, are not applied by this PR, and must not be treated as a production migration plan without a separately reviewed integration design and operator authorization.
