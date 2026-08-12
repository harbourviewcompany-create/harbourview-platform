# Applicability DSL

The DSL is deterministic, reviewable and non-Turing-complete. It compiles to a safe AST and cannot execute arbitrary code, make network calls or invoke models.

```yaml
id: ar_01J00000000000000000000000
version: 3
status: approved
subject: organization
jurisdiction: DE
when:
  all:
    - fact: activities
      operator: contains
      value: import
    - fact: product.intended_use
      operator: in
      value: [medical, pharmaceutical]
    - fact: product.controlled_status
      operator: equals
      value: controlled_cannabis
    - fact: importer.licence_classes
      operator: contains
      value: authorized_importer
unless:
  any:
    - fact: product.excluded_classifications
      operator: contains
      value: non_controlled_hemp
then:
  result: applies
  obligation_ids: [obl_01J00000000000000000000000]
required_inputs: [product, importer, destination, purpose, as_of]
```

## Operators

equals, not_equals, in, not_in, contains, not_contains, exists, not_exists, greater_than, greater_or_equal, less_than, less_or_equal, before, on_or_before, after, on_or_after, overlaps_date_range, has_valid_status, has_current_evidence, matches_concept_or_descendant, relationship_exists, quantity_within, all, any and none.

## Result states

Applies, does not apply, potentially applies, insufficient information, conflicting evidence, review required and historical only.

## Explainability

Each evaluation returns rule/version, input snapshot/hash, passed and failed conditions, missing inputs, evidence IDs, assumptions, result, reviewer requirement and expiry/next evaluation time.

## Versioning

Approved rules are immutable. Changes create a new version. Historical evaluations retain the exact rule, ontology and input snapshot.
