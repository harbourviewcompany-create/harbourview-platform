# Talent Taxonomy Control

Anchors: TAL-009–011, TAL-027, TAL-041–044, TAL-064–068, TAL-089; TAC-004, TAC-037.

Controlled term classes: occupation, function, capability, credential class, seniority, employment type, workplace type, sector, product/category, regulatory activity, language and jurisdiction concept.

Each taxonomy release is immutable and versioned. Terms carry stable IDs, canonical label, aliases/localized labels, parent/child/equivalent relationships, lifecycle (`proposed|reviewed|active|deprecated|superseded`), source/provenance and effective dates. External source terms map through versioned `talent_taxonomy_mappings`; raw source text remains preserved.

Matching and job requirements store the taxonomy version used. Deprecation never rewrites historical matches. A mapping change triggers TAL-068 invalidation where relevant.

Reference data for countries/subdivisions, currencies, languages and timezone semantics is controlled/versioned under TAL-011/TAL-089. No scattered runtime constant may silently become authoritative when a controlled reference contract exists.