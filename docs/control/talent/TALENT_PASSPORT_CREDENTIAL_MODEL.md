# Talent Passport and Credential Model

Anchors: TAL-039–050, TAL-080, TAL-095–096; TAC-013–016,040.

`talent_people` is durable identity; `talent_professional_profiles` is the Talent Passport presentation. Experiences reference canonical organization/site/function/time where supported and preserve claim/evidence source.

Passport domains: headline/summary, experiences, capabilities, jurisdictions, languages, preferences, availability, work authorization, mobility and private contact points.

Credential instances reference canonical credential class and issuing authority and may store jurisdiction, registration identifier where permitted, scope/conditions, issue/effective/expiry/renewal dates, status and last verification. States include `claimed`, `pending_verification`, `active_verified`, `restricted`, `expired`, `suspended`, `revoked`, `not_found`, `unable_to_verify`, `conflicted`.

Work authorization is separate from professional/regulatory qualification. Identity assurance is separate from credential verification.

`hv_professionals` maps only evidence-supported fields into Passport compatibility. Existing public-directory status does not imply job-seeking availability, and claiming a sourced profile never erases its historical provenance.