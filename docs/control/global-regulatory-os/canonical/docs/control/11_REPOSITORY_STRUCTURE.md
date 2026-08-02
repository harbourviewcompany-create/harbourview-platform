# Repository Structure

```text
apps/
  web/                         Next.js customer and analyst application
  api/                         External and internal HTTP API composition
  analyst-workbench/           Optional separately deployed analyst UI
services/
  identity-entitlements/       Request context, policy and entitlements
  source-registry/             Source configuration, rights and health
  acquisition-worker/          Network-isolated source collection
  document-processor/          Parsing, OCR, segmentation and diffing
  regulatory-core/             Instruments, provisions, changes and interpretations
  ontology/                    Concepts, mappings and versions
  applicability/               DSL compilation and deterministic evaluation
  obligations-controls/        Obligations, controls, assessments and remediation
  registry/                    Entities, facilities, licences and certifications
  counterparty-risk/           Risk components, due diligence and monitoring
  product-classification/      Product/substance jurisdiction mappings
  corridor/                    Market-entry gates and determinations
  market-intelligence/         Metrics, observations, reconciliation and forecasts
  workflow-alerting/           Durable workflows, tasks, alerts and approvals
  publication/                 Releases, corrections, exports and projections
  ai-gateway/                  Models, prompts, policy, redaction and evaluation
  integration/                 Webhooks, bulk delivery, SFTP and connectors
packages/
  contracts/                   OpenAPI, AsyncAPI and generated clients
  domain-types/                Shared value objects and identifiers
  auth-policy/                 Authorization policy helpers
  event-envelope/              Event creation and validation
  observability/               Trace, log and metric conventions
  test-fixtures/               Synthetic and licensed fixtures
  ui-system/                   Accessible design system
  config/                      Typed configuration and feature flags
db/
  migrations/                  Canonical PostgreSQL migrations
  seeds/                       Controlled ontology/configuration fixtures
  tests/                       Database, RLS and migration tests
api/                           External OpenAPI source contract
events/                        AsyncAPI source contract
schemas/json/                  Machine-readable domain contracts
docs/control/                  Constitution, governance, release control
docs/adr/                      Architecture decisions
docs/domain/                   Ontology, DSL, pipelines and metric definitions
docs/workflows/                Human and system workflows
docs/services/                 Bounded-context ownership
docs/security/                 Threat and control models
infra/
  modules/                     Reusable infrastructure modules
  environments/               Development, staging, production, DR
  policies/                    Network, IAM, encryption and backup policy
tests/
  unit/
  integration/
  contract/
  e2e/
  security/
  performance/
  resilience/
  ai-evaluation/
  domain-benchmarks/
tickets/                       Epics and importable ticket index
ops/                           Runbooks, role matrix and release evidence
```

## Repository rules

- Deployable services own their migrations or modules but canonical migration order remains globally controlled.
- Cross-service contracts are versioned before implementation changes.
- Shared packages cannot contain service-owned business rules.
- Generated clients are committed or reproducibly generated in CI.
- Secrets, production data and restricted source content are prohibited from the repository.
- Every source fixture has a rights and provenance manifest.
- Every phase has a release-evidence directory excluded from distributable source packages where it contains restricted data.
