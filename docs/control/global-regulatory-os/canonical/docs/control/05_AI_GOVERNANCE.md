# AI Governance

## Registry

Each approved model records provider, immutable model reference, approved/prohibited use cases, allowed data classes, regions, retention, prompt versions, tool permissions, evaluation suites, cost/latency limits, approval and rollback target.

## Risk classes

| Class | Examples | Control |
|---|---|---|
| A | Formatting, language detection, duplicate suggestions | Automated with monitoring |
| B | Topic and metadata classification | Automated with thresholds and sampling |
| C | Summaries, translations and entity candidates | Analyst review before publication |
| D | Obligation, deadline, applicability or corridor candidates | Specialist review |
| E | Legal interpretation, sanctions, transaction eligibility, safety impact | Dual review including qualified specialist |
| F | Permit, licence, customs, regulator or transaction authorization | Platform cannot autonomously issue |

## Input controls

Treat all source content as untrusted; isolate executable content; detect prompt injection; restrict tools; redact secrets/customer identifiers; enforce source, tenant and classification boundaries before retrieval; prohibit cross-tenant context assembly.

## Output controls

Schema validation, evidence requirement, citation-entailment checks, date/jurisdiction consistency, contradiction checks, canonical-value validation, confidence calibration, risk routing, human approval and publication-projection validation.

## Required evaluations

Legal citation retrieval; summary entailment; effective dates; amendment/supersession; obligation extraction; licence/product applicability; multilingual legal translation; entity resolution; corridor gate completeness; unsupported-claim detection; prompt injection; tenant/public leakage; abstention; cost and latency regression.

Overrides require reviewer, reason, timestamp and replacement evidence where applicable. They may update evaluation datasets but do not automatically retrain production models.
