# PR #1307 Post-Merge Corrective Scope

Base: `150c24eec7d76b9be7322ac0e6926134dcd17d6f`

This file records the corrective scope before PR-triggered verification.

Allowed surfaces:
- marketplace media server projection/query logic;
- country-role marketplace media consumption;
- mobile marketplace provenance/fallback rendering;
- authenticated marketplace-media workflow coverage;
- focused regression tests;
- additive control documentation.

Excluded surfaces:
- Supabase migrations or migration history;
- Supabase production data/storage;
- representative-media seeds or rollout mappings;
- Vercel production deployments/configuration;
- Edge Functions;
- unrelated product/runtime work.

The exact candidate SHA is recorded in the draft PR body and verification evidence rather than embedded here, so this control document does not self-reference a stale commit after its own addition.
