# Security and Authorization

## Layered model

1. Application policy enforcement for action, resource and context.
2. PostgreSQL roles and row-level security for tenant isolation.
3. Explicit public, partner and tenant projections with field allowlists.

Entitlement does not equal authorization. A customer can purchase a module and still lack access to a matter, jurisdiction, counterparty, source or classification.

## Request context

Validated subject ID, tenant ID, memberships, platform and tenant roles, jurisdiction/matter scopes, classification clearance, reviewer authority, entitlements, authentication strength and service-account scopes.

## Database context

Application transactions set server-controlled transaction-local settings:

```sql
select set_config('app.subject_id', :subject_id, true);
select set_config('app.tenant_id', :tenant_id, true);
select set_config('app.platform_roles', :roles_csv, true);
select set_config('app.request_id', :request_id, true);
```

Client-provided values cannot be trusted. Poolers must reset session state.

## Public leakage controls

- Public APIs query public projection schemas only.
- DTOs and exports use field allowlists.
- Search indexes are separated by tenant, visibility and licence rights.
- Restricted content has restricted embeddings and caches.
- Error messages do not reveal hidden record existence.
- Cache keys include tenant and authorization scope.
- Public HTML, APIs, bundles and search results are probed for restricted fields.
- Database owner and RLS-bypass roles are excluded from request paths.
- Raw evidence downloads use short-lived authorized links.

## Harbourview Phase 0 trusted-context amendment

Identity and platform roles must be derived from the transaction-scoped trusted request context defined in `docs/security/TRUSTED_REQUEST_CONTEXT.md`. Client-settable custom GUCs are not an authorization source. The trusted authenticator and runtime roles remain separate; runtime roles are NOLOGIN and cannot establish context.

