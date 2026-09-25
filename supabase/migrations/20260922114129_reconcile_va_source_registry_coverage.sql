update public.jurisdiction_dimension_coverage
set status='verified_populated',
    applicability='applicable',
    evidence_basis='Primary Vatican City State legal source registered 2026-09-22; cannabis-specific regulatory evidence remains blocked separately.',
    last_evaluated_at=now(),
    notes='Primary legal provenance exists; evidence cell remains fail-closed.'
where jurisdiction_key='VA' and dimension_key='source_registry';