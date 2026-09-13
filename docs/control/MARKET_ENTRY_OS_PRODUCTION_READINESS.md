# Market Entry OS production-readiness record

## Production boundary

The Market Entry OS is an execution system, not a generic information page. A mission is persisted with its input corridor, product class, plan snapshot, evidence snapshot, reproducibility key, execution tasks, audit events, payment state and report state.

## Regulatory evidence rule

A corridor is executable only when the required claim-level evidence is current and complete. A claim requires an authoritative source URL, source effective date, retrieval timestamp, verification timestamp, expiry, and immutable SHA-256 of the exact source snapshot. Missing hashes, missing effective dates, stale evidence, superseded evidence, and absent claims fail closed.

The production backfill created claim records from the existing structured evidence rows. It did not invent source hashes. Therefore existing claims with no source snapshot hash remain `partial` and cannot make a corridor executable.

## Payment rule

Market Entry report checkout is a separate one-time Stripe Checkout flow. It does not modify subscription entitlements. The mission ID and authenticated user ID are carried in Stripe metadata. The webhook is idempotent and persists payment status, report status, payment intent, paid timestamp, report snapshot and an audit event. Checkout is refused for blocked missions.

## Migration control

The mission workspace migration was applied to the registered production Supabase project and verified. Eight historical baseline versions have no surviving SQL body and no production ledger row; they are explicitly documented in `supabase/release-controls/withdrawn-baseline-migrations.json` and are not replay candidates. Any capability represented by one of those historical versions must be restored through a new forward migration after current-state preflight.

## Dependency control

Wrangler is pinned to the patched 4.131.0 release. Miniflare and sharp are pinned through npm overrides to the patched registry versions. A GitHub Actions workflow regenerates `package-lock.json` from the npm registry and verifies the resolved Wrangler/Miniflare/sharp versions plus `npm audit --audit-level=high` before committing the lockfile to the production branch.

## Release gate

GO requires all repository CI/security/provider/migration checks to pass, a clean production read-only verification, no unresolved migration drift, a registry-generated lockfile, and complete authoritative evidence for any corridor being represented as executable.
