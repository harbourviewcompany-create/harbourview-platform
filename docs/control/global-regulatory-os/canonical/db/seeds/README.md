# Seed and Fixture Policy

Production legal, licence, market or counterparty facts are never inserted as informal seed data.

Allowed seeds:

- Global jurisdiction identifiers sourced through an approved import job.
- Canonical ontology concepts with versioned owner approval.
- Role and entitlement keys.
- Gate-definition templates.
- Data-quality rules.
- Synthetic test tenants, users, entities, products and corridors.
- Explicitly licensed public fixtures with source metadata.

Each seed file requires a manifest containing source, licence, hash, effective date, reviewer and intended environment. CI rejects production-targeted seed files containing unapproved facts or secrets.
