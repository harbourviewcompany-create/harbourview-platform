# Validation Report

**Generated:** 2026-07-31

| Check | Result | Detail |
|---|---|---|
| Required artifact coverage | PASS | 38 required artifact classes present |
| api/openapi.yaml YAML and references | PASS | Parsed; 126 local references resolved |
| events/asyncapi.yaml YAML and references | PASS | Parsed; 43 local references resolved |
| JSON Schema validation | PASS | 7 Draft 2020-12 schemas valid |
| Event catalogue machine list | PASS | 98 unique versioned event types |
| Migration ordering | PASS | 13 contiguous migrations 0001-0013 |
| SQL table dependency references | PASS | 83 tables; all 44 FK and 13 regclass targets resolve |
| Migration transaction wrappers | PASS | All 13 migrations wrapped |
| SQL dollar quoting | PASS | All dollar-quoted tags paired |
| PostgreSQL execution | WARN | No PostgreSQL server or parser binary was available; SQL received dependency, wrapper, identifier-reference and delimiter checks but was not executed. |
| Ticket identifiers | PASS | 96 unique tickets |
| Ticket phase coverage | PASS | Phases 0-7 represented |
| Ticket dependencies | PASS | All explicit ticket dependencies resolve; range dependencies are documented notation |
| Role matrix coverage | PASS | 33 platform, editorial, customer, external and machine roles |
| ADR coverage | PASS | 15 individual accepted ADRs plus index |
| Global scope ledger | PASS | Country, territory, subnational, activity, trade and transaction scope markers present |
| Secret scan | PASS | No common API key/private-key patterns detected |

## Limits

- SQL was not executed because this environment has no PostgreSQL server, `psql`, or installable PostgreSQL parser package.
- OpenAPI and AsyncAPI were parsed as YAML and all local references were resolved; a dedicated standards-validator package was not available.
- Production source rights, live data, external services, legal review, security testing and deployment evidence remain future implementation gates.

## Result

**STRUCTURAL VALIDATION PASS.** The artifact is ready for repository initialization and PostgreSQL execution validation.
