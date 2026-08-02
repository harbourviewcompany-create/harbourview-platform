# Exact Service Boundaries

A service owns its commands, canonical tables and emitted events. Cross-service reads use APIs, events or approved projections. Direct cross-service writes are prohibited even when modules share one deployment.

| Service | Owns | Primary commands | Emits | Cannot own or decide |
|---|---|---|---|---|
| Identity and Access | tenants, subjects, memberships, reviewer authority | establish request context, membership lifecycle | membership/authority events | Entitlements, editorial approval |
| Entitlements | plans, module/jurisdiction/data rights, quotas | grant/revoke/check entitlement | entitlement changed | Business authorization |
| Jurisdiction | jurisdictions, authorities, programmes, coverage | register/update jurisdiction and coverage | coverage changed | Source contents |
| Source Registry | source identity, rights, endpoint, schedule, parser, health policy | approve/suspend source | source events | Fetch execution, publication |
| Acquisition Worker | acquisition runs and original snapshot creation | fetch registered endpoint | acquisition/snapshot events | Source approval, parsing, publication |
| Evidence | documents, versions, passages, translations, citations, bundles | create evidence objects and bundles | evidence events | Legal interpretation |
| Document Processing | parser/OCR/diff processing lineage | parse, OCR, segment, translate candidate, diff | document-processing events | Canonical legal decisions |
| Regulatory Core | instruments, provisions, definitions, changes, interpretations | create/review/publish regulatory candidates | regulatory events | Customer applicability |
| Ontology | concepts, hierarchies, mappings and versions | approve/supersede concepts | ontology events | Customer facts |
| Applicability | organization facts, rules, ASTs, evaluations, reasons | compile/evaluate rule | applicability events | Obligation approval |
| Obligations and Controls | obligations, controls, mappings, assessments/findings | approve obligation, map control, assess | obligation/control events | Source acquisition |
| Registry | entities, people, facilities, licences, certifications, enforcement | ingest/merge/split/update records | entity/licence events | Tenant counterparty opinion |
| Counterparty Risk | tenant profiles, components, monitoring, performance | evaluate/approve profile | risk events | Canonical licence facts |
| Product Classification | product composition/form/use and jurisdiction mappings | classify product | classification events | Corridor determination |
| Corridor | versions, gates, required documents, determinations, projects | instantiate/evaluate/review corridor | corridor events | Permit issuance or legal authorization |
| Market Intelligence | metric definitions, datasets, observations, reconciliation, forecasts | ingest/reconcile/forecast/publish | metric events | Source rights approval |
| Workflow and Alerting | cases, tasks, approvals, watchlists, alerts and deliveries | create/route/escalate/acknowledge | workflow/alert events | Domain truth |
| Publication | releases, projections, reports, exports, corrections | approve/publish/correct/retract | publication events | Create unsupported claims |
| AI Gateway and Governance | models, prompts, runs, evaluations, redaction and rollback | route model run, evaluate, suspend | model events | Autonomous high-risk approval |
| Integration | API clients, webhooks, bulk/SFTP delivery logs | deliver/replay/revoke | integration events | Canonical domain edits |
| Audit and Governance | audit events, quality rules/results, incidents, retention | record audit, open correction/incident | governance events | Rewrite source history |
| Billing | subscriptions, invoices, commercial plan linkage | bill and reconcile plan state | billing events | Authorization or source rights |

## Transaction ownership

A command that spans services uses a durable workflow and compensating actions. The initiating service stores workflow intent; each participant commits only its own state and emits an event. No distributed database transaction is required.

## Derived systems

Search, cache, graph and lakehouse consumers subscribe to approved events. They may be deleted and rebuilt. They never accept user writes that create canonical facts.
