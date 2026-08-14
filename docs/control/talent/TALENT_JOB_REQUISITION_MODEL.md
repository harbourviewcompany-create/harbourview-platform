# Talent Job and Requisition Model

Anchors: TAL-023–031, TAL-037, TAL-071–074, TAL-097; TAC-008,011,026.

A requisition represents internal hiring demand; a JobOpportunity represents a discoverable posting. They are distinct.

Requisition lifecycle: `draft→approved→recruiting→paused→filled|closed|cancelled`, with immutable versions and openings total/filled/remaining.

JobOpportunity stores canonical identity, employer/source organization, optional requisition/site, original and normalized title, taxonomy occupation/function/seniority, geography/work mode, employment type, original description/content language, application method, lifecycle dates and freshness state.

Material job/requirement/compensation/location/application-method changes create versions/change events. Stored matches point to exact requirement version.

Compensation preserves original terms plus structured amount/range/currency/period and disclosure class (`employer_disclosed|source_disclosed|estimated`). Derived FX values never overwrite originals.

Application questions are versioned, typed and privacy-classified. Any knockout condition must map to an explicit structured hard requirement.