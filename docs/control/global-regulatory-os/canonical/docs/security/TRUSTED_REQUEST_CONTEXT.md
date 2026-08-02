# Trusted Request Context

## Decision

Runtime identity is not accepted from `app.subject_id`, `app.tenant_id`, `app.platform_roles`, or any other client-settable custom PostgreSQL GUC.

A dedicated `hv_authenticator` connection-pool role resolves a verified external subject to `iam.subjects`, validates optional tenant membership, and writes one transaction-scoped row to `app.trusted_request_context` through `app.set_trusted_request_context`. The authenticator then uses `SET LOCAL ROLE` to enter a NOLOGIN runtime role. Runtime roles can read the context only through SECURITY DEFINER accessors owned by `hv_context_owner`.

## Trust boundary

- `hv_authenticator` credentials belong only to the verified authentication gateway or connection pool.
- `hv_context_owner` is NOLOGIN and owns the context table and accessors.
- Runtime roles are NOLOGIN and are not members of `hv_authenticator`.
- The context key combines backend PID and PostgreSQL transaction ID, so context is not reusable across transactions.
- Subject platform roles are derived from `iam.platform_role_assignments`; they are not accepted as request input.
- Tenant roles are derived from `iam.memberships`; a requested tenant is rejected when membership is absent or expired.

## Required request sequence

1. Begin a database transaction as the trusted login that is a member of `hv_authenticator`.
2. `SET LOCAL ROLE hv_authenticator`.
3. Call `app.set_trusted_request_context(verified_external_subject, tenant_id)`.
4. `SET LOCAL ROLE` to the required NOLOGIN runtime role.
5. Execute the request.
6. Commit or roll back. Context from that transaction becomes inaccessible.

## Negative controls

`tests/sql/authorization_negative.sql` proves that an untrusted login using a runtime role cannot execute the setter, cannot read or write the context table, cannot assume `hv_authenticator`, and cannot gain identity or platform roles by setting the retired custom GUC names.
