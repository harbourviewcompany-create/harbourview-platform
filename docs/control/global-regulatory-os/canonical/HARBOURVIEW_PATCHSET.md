# Harbourview Phase 0 Patch Set

The exact controlling source archive is retained unchanged under `../source/`. The reviewable canonical tree is derived from that archive and differs only through the following verified changes:

1. Replace forgeable custom-GUC authorization with trusted transaction context.
2. Add IAM platform-role assignments and dedicated NOLOGIN context/authenticator roles.
3. Add negative privilege-escalation SQL tests.
4. Add complete global jurisdiction and Phase 0 ontology/taxonomy registries.
5. Add P0-001 through P0-012 proof records and explicit technical-GO/operator-HOLD release decision.
6. Clarify source-rights enforcement, threat-model treatment and ADR process.
7. Regenerate `MANIFEST.json` after all changes.

No active Harbourview Supabase migration, application route, public DTO or production deployment configuration is changed by this package.
