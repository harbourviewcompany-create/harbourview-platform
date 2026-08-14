# Talent Operations Runbook

Controls: CTL-009–CTL-013, CTL-020–CTL-025. Anchors: TAL-032–038, TAL-051–058, TAL-075, TAL-085–093, TAL-100.

Incident classes requiring runbook action: candidate exposure/block failure; stale privacy/search projection; duplicate mass ingestion; provider outage/rate-limit; leaked provider credential; application loss/duplication; document exposure; incorrect credential verification; recruiter account compromise; search outage; failed retention; restore incident.

For each incident record: severity, affected TAL IDs, containment kill switch, authorization/privacy impact, evidence preservation, customer/data-impact scope, rollback/restore path, secret rotation where applicable, audit events, verification before re-enable and postmortem/change-control link.

Production-safe verification must use representative cardinality/contract checks without dumping PII into logs/artifacts (`CTL-025`).

Restore drills verify applications, documents, identity mappings, disclosure grants, audit references and search reindexability as a coherent set (`CTL-022`).

Human overrides require reason code, prior/new state, actor, timestamp and audit (`CTL-021`).