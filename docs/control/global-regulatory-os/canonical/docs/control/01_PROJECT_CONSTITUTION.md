# Project Constitution

## Authority

The product owner controls scope, commercial positioning, public claims, release authorization, production connections, regulated transaction boundaries, irreversible changes, material cost commitments and source licensing. Engineering and analyst teams may make reversible decisions inside approved boundaries but may not weaken provenance, remove review gates, relax public/private separation or change GO/HOLD criteria without approval.

## Truth classes

1. Source fact.
2. Normalized fact.
3. Interpretation.
4. Estimate.
5. Forecast.
6. Recommendation.

Every record, interface and export must preserve its truth class.

## Evidence rule

A published factual or interpretive claim requires an evidence anchor, retrieval and publication timestamps, effective-date handling, processing lineage, risk-appropriate review and a correction/supersession path.

## Change rule

Historical versions are append-only. Corrections supersede but do not erase. Derived stores may be rebuilt; canonical history may not be silently rewritten.

## Security rule

Default deny. Tenant data, restricted evidence, analyst notes, privileged legal review, source credentials, licensed datasets and counterparty-sensitive information remain private unless explicitly projected.

## AI rule

AI output is a candidate until approved by the required authority. Model confidence is not legal certainty, and hidden reasoning is not evidence.

## GO/HOLD rule

GO requires verification evidence. HOLD applies when a blocker affects correctness, authorization, security, privacy, public claims, legal exposure, source rights, source freshness, production integrity, regulated activity or irreversible cost.
