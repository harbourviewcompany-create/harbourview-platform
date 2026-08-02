# Analyst and Specialist Review Workflows

## Common review states

`candidate -> triaged -> in_review -> changes_requested/escalated -> approved -> published -> superseded/corrected/retracted`

Every transition records actor, authority scope, timestamp, decision, rationale, evidence and before/after hashes. Risk-tier and reviewer-authority policies determine who may perform a transition.

## Regulatory change

1. Diff creates candidate and cited changed passages.
2. Automated validation checks source rights, integrity, dates, identifiers, duplicates and canonical conflicts.
3. Triage confirms jurisdiction, authority, instrument, topic and materiality.
4. Analyst verifies the exact changes and drafts a fact-class summary.
5. Interpretation is created separately when meaning is not explicit in the source.
6. High/critical changes route to jurisdiction or domain specialist.
7. Publisher checks freshness, evidence, rights, public/private projection and downstream impact.
8. Release creates immutable version and triggers applicability and alerts.

## Obligation

1. Extraction creates subject/action/object/condition/exception/timing/evidence candidates.
2. Analyst links exact source provision and compares existing obligation versions.
3. Missing or conflicting inputs block approval.
4. Specialist reviews legal and domain meaning according to risk.
5. Applicability rule and control mappings are reviewed separately.
6. Approval supersedes prior version at its effective boundary.
7. Profiles are re-evaluated and affected tasks/alerts are created.

## Translation

1. Machine or human draft remains linked to original passage.
2. Terminology and named concepts are checked against the ontology.
3. Legally material translations receive qualified language/domain review.
4. Disputed terms retain alternatives and uncertainty rather than forced normalization.

## Entity merge or split

1. Candidate contains official identifiers, names, addresses, licences, ownership and evidence.
2. Conflicting official identifiers block automatic merge.
3. High-impact merges require analyst approval.
4. Operation retains aliases and source identities and is reversible.
5. Dependent graph/search/counterparty projections rebuild.
6. A split propagates correction impact to prior reports and determinations.

## Market observation

1. Dataset rights and definition mapping are approved.
2. Observation is normalized without losing raw state.
3. Unit, currency and period checks run.
4. Reconciliation compares components, totals and revisions.
5. Exceptions require analyst rationale and approval.
6. Estimates and forecasts receive distinct methodology review.
7. Published chart/report references metric version, observation state and source.

## Corridor

1. Capture origin, transit, destination, product, purpose, parties, quantity, route and date.
2. Validate input completeness and product classifications.
3. Instantiate mandatory gates effective as of the version date.
4. Gather evidence and evaluate legal, licence, permit, quota, quality, customs, logistics and counterparty gates.
5. Unknown critical data yields insufficient information or HOLD.
6. Trade, quality, customs and legal reviewers act within recorded authority.
7. Determination exposes blockers, conditions, assumptions, confidence and expiry.
8. Material input or source change creates a new version and invalidates reuse of stale GO.

## Correction and retraction

1. Receive report and assess potential materiality.
2. Freeze propagation when material or critical.
3. Reconstruct source and processing lineage.
4. Identify root cause and affected claims, obligations, evaluations, alerts, exports and determinations.
5. Create corrected version without deleting history.
6. Obtain required approval.
7. Republish and notify affected customers according to materiality SLA.
8. Update benchmark, quality rule or operational control.
9. Close only after downstream reconciliation proves completion.

## Separation of duties

- The author cannot be sole approver for high/critical output.
- Source operators cannot publish legal conclusions.
- Model operators cannot approve model-generated high-risk conclusions.
- Customer administrators cannot alter canonical official facts.
- Security administrators do not receive routine editorial publication authority.
