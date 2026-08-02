# Threat Model

## Assets

Customer regulatory profiles, privileged legal material, source credentials, licensed datasets, raw evidence and hashes, beneficial ownership, counterparty risk, shipment/permit/transaction documents, model/prompt configuration, evaluation data, audit logs and release evidence.

## Threats

Cross-tenant access; public leakage; prompt injection; SSRF and malicious endpoints; credential compromise; spoofed sources; unauthorized publication; stale evidence presented as current; entity false merges; unsupported AI claims; licensed-data redistribution; insider misuse; export exfiltration; dependency compromise; backup compromise; and durable actions committed after authorization changes.

## Controls

Controlled egress and host allowlists; DNS/IP/redirect validation; immutable snapshots and hashes; source-authority verification; malware scanning; RLS/application policy/projections; short-lived credentials; commit-time authorization before durable writes or external effects; high-risk human approval; immutable audit; DLP/export review; rights enforcement; AI injection tests; reversible entity merges; stale-source banners; encrypted backups and restoration exercises.

## Added threat: forged request identity context

**Threat:** A runtime role sets custom GUCs to impersonate a subject, tenant or platform role.  
**Control:** Authorization helpers ignore custom identity GUCs. Only `hv_authenticator` can execute the transaction-context setter; subject, membership and platform roles are resolved from IAM tables. Runtime roles cannot read or mutate context storage. Negative privilege-escalation tests are mandatory.

