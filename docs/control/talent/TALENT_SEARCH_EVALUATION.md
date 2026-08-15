# Talent Search Evaluation

Anchors: TAL-059–064; CTL-016, CTL-017; TAC-021–023,042.

Frozen fixture corpus layout:
`tests/fixtures/talent-search/{jobs,professionals,organizations,credentials,visibility,employer-blocks,queries-jobs,queries-talent,semantic-queries,expected-results}.json`.

Each query specifies actor/employer context, query text, structured filters, mandatory matches, acceptable matches, forbidden results and expected no-result behavior.

Coverage: exact/synonym titles, capability aliases, multilingual terms, credentials, jurisdiction/subdivision, remote/hybrid, compensation, company aliases/affiliates, duplicate/stale/closed jobs, anonymous/blocked/unclaimed profiles, expired/conflicting credentials and large result sets.

Metrics: precision@K, recall@K, ranking metric where useful, duplicate rate, stale-job rate, zero-result rate, privacy violation count, p50/p95 latency. Privacy violations must equal zero. Search tuning cannot delete forbidden-result cases to manufacture a pass.