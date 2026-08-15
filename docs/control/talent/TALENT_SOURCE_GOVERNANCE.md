# Talent Source Governance

Anchors: TAL-032–038, TAL-082, TAL-091–092; CTL-012, CTL-013, CTL-015; TAC-009–012,039,048.

Every source/provider record stores provider identity, acquisition method, jurisdiction, expected cadence, rate-limit policy, active/suspended state and rights metadata for storage, redistribution, derived data, public display and commercial use. Rights are a runtime ingestion/publication gate, not documentation trivia.

Each run records start/end, parameters, records seen/accepted/rejected/changed, provider/rate-limit state and outcome. Each source job retains stable source identity, raw snapshot/hash, observation times and canonical resolution.

Freshness states: `confirmed`, `recent`, `stale`, `source_unavailable`, `removed`, `closed`, `conflicted`, `unknown`. Source disappearance does not delete history or automatically equal employer-confirmed closure.

Provider credentials must come from managed secrets, never source/migration literals. Leak response requires provider kill switch, rotation, invalidation and secret scanning (CTL-013).

Current `job-refresh` logic is treated as legacy ingestion machinery only; fixed location/search/fit scoring cannot become canonical Talent matching.