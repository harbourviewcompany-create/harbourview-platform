# Talent Privacy and Consent

Anchors: TAL-050–058, TAL-060, TAL-062–063, TAL-075–078, TAL-087, TAL-093; TAC-017–020,023,041,047.

Visibility modes: `private`, `anonymous_discoverable`, `verified_employers`, `public`.

Progressive disclosure levels:
0 match/eligibility only; 1 anonymous summary; 2 professional identity; 3 detailed Passport; 4 contact; 5 application/evidence documents.

Disclosure grants are employer/requisition/purpose scoped, time-bounded/revocable and audited. Employer blocks apply before result generation; verified affiliate relationships may extend a block only when relationship evidence supports it. Blocked employers receive no profile, anonymous hit, semantic hit or identifying exact-count leakage.

Consent is purpose- and policy-version-specific. Contact/messaging/export actions re-check consent, blocks, authority, entitlement and disclosure at send/access time.

Privacy changes are enforced synchronously at query authorization even while indexes/caches refresh. Async index freshness never creates a privacy grace period.

Data rights cover access/export, correction, suppression, erasure and processing restriction; legal holds override automated deletion where valid. Audit may be pseudonymized/tombstoned rather than corrupted.