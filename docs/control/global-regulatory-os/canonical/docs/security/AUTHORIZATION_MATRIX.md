# Authorization Matrix

## Control dimensions

A request is authorized only when authentication, tenant membership, role, action, resource ownership, jurisdiction/matter scope, classification clearance, entitlement, reviewer authority and authentication strength all pass.

| Resource | Public | Tenant member | Tenant lead/admin | Analyst | Authorized specialist | Platform security/governance |
|---|---|---|---|---|---|---|
| Public projections | Read | Read | Read | Read | Read | Read |
| Tenant profile | None | Scoped read | Create/update | None unless assigned | None unless assigned | Incident/support policy only |
| Applicability result | None | Scoped read | Execute/approve internal action | Review if assigned | Approve high-risk if authorized | Governance audit |
| Raw snapshot | None | None by default | None by default | Read by source/review scope | Read by assigned matter | Security/integrity access |
| Draft claim/interpretation | None | None | Customer-private drafts only | Create/update | Approve within authority | Governance/correction |
| Published claim | Public/registered projection | Entitled read | Entitled read | Read | Read | Read/correct |
| Obligations/controls | Public subset only | Entitled read | Tenant controls write | Canonical authoring | High-risk approval | Governance |
| Entities/licences | Public subset | Entitled projection | Private profile write | Canonical authoring | Review by domain | Governance/privacy |
| People/ownership | None by default | Purpose-limited | Purpose-limited | Restricted | Restricted | Privacy/security |
| Corridor/project | None | Matter-scoped read | Create/update | Evidence support | Gate/determination approval | Audit/incident |
| Market observations | Public/licensed projection | Entitled read | Customer-private data write | Canonical authoring | Method review | Rights/governance |
| Alerts/tasks | None | Own/scoped | Manage tenant routing | Assigned workflow | Assigned workflow | Audit |
| Models/prompts | None | Tenant run metadata only | Tenant run metadata | Approved tools only | Approved tools only | Model-risk administration |
| Audit events | None | Own events where allowed | Tenant audit | Assigned review | Assigned review | Full authorized audit |

## Database roles

`hv_public_runtime`, `hv_tenant_runtime`, `hv_analyst_runtime`, `hv_ingestion_runtime` and `hv_governance_runtime` are NOLOGIN group roles. Workload identities assume the minimum role. Database owner and `BYPASSRLS` roles never process normal requests.

## Mandatory tests

- Cross-tenant direct IDs and nested child records.
- Hidden-record enumeration through 404/403 differences.
- Public projections and bundle fields.
- Search, cache, embeddings, logs and analytics.
- Reviewer jurisdiction, topic, language and risk ceilings.
- Service-account scopes and expired matter access.
- Pooler/session request-context reset.
