# Talent Trust and Safety

Anchors: TAL-085–088, TAL-020–022, TAL-076–078; CTL-013, CTL-014, CTL-021; TAC-018,019,032,044,048.

Controls include application/search/contact rate limits, anti-enumeration, recruiter volume caps, suspicious duplicate/fake-job handling, identity/credential impersonation reporting, candidate/employer reporting, moderation cases/actions and account/workspace suppression.

Moderation and staff overrides are explicit state transitions with actor, reason code, prior state, new state, evidence and immutable audit event. No destructive 'admin fix' path is permitted.

Provider credentials and API secrets are managed references, never literals in source/migrations/logs. Each provider has an independent kill switch and documented rotation/compromise procedure.

High-volume actions (bulk shortlist/outreach/export/status mutation) require distinct entitlement and abuse controls; permission for a single-record action does not imply bulk authority.