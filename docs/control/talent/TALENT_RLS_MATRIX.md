# Talent RLS Matrix

Anchors: TAL-016–022, TAL-050–058, TAL-060, TAL-071–078, TAL-082; TAC-006,007,017–020,029,032,040.

Actors: Anonymous (A), candidate owner (C), unrelated employer (U), blocked employer (B), authorized recruiter (R), hiring manager (H), interviewer (I), Talent viewer (V), platform staff (P), service role (S).

| Resource | A | C | U | B | R | H | I | V | P | S |
|---|---|---|---|---|---|---|---|---|---|---|
| PublicJob DTO | R | R | R | R | R | R | R | R | R | R |
| Raw job/source evidence | - | - | - | - | limited projection | scoped | - | - | controlled | RW |
| Public professional DTO | opt-in R | own | opt-in R | block applies | opt-in R | opt-in R | opt-in R | opt-in R | controlled | RW |
| Discoverable candidate search | - | own | - | - | authorized projection | authorized projection | assigned-minimum | read-only authorized | controlled | RW |
| Full Passport/contact/evidence | - | own | - | - | disclosure-grant only | disclosure-grant only | assigned minimum/no contact default | - | exceptional audited | RW |
| Employer requisition | - | - | - | - | assigned | RW assigned | assigned minimum | read assigned | controlled | RW |
| Application | - | own projection | - | - | assigned | assigned RW | assigned subset | assigned read | controlled | RW |
| Employer notes/assessments | - | candidate-safe only | - | - | assigned | assigned | assigned assessment | safe read | controlled | RW |
| Documents | - | own | - | - | grant/assignment | grant/assignment | approved subset | - | exceptional audited | RW |
| Audit/raw evidence/embeddings | - | safe own history only | - | - | - | - | - | - | controlled | RW/append |

RLS plus allowlisted views/RPCs/API authorization is mandatory. UI hiding is never authorization. Existing broad `job_search.*` client SELECT is explicitly excluded from generalized Talent (TAL-082).