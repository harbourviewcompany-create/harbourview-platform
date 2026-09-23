-- Reclassify source-registry rows that are already known official legal,
-- health, or drug-control endpoints. This affects source metadata only;
-- publication still requires a successful snapshot plus claim-level evidence.

begin;

update public.source_registry
set regulator_class = case
  when source_url ilike '%legislation%'
    or source_url ilike '%gazette%'
    or source_url ilike '%uradni-list%'
    or source_url ilike '%revosax%'
    or source_url ilike '%leg.state%'
    or source_url ilike '%ris.bka%'
    or source_url ilike '%finlex%'
    or source_url ilike '%logir%'
    or source_url ilike '%slov-lex%'
    then 'official_gazette'
  when lower(source_name) ~ '(health|medical|medicine|fimea|cannabis)'
    then 'health_authority'
  else 'drug_control_authority'
end,
tier=1,
relevance_status='active',
updated_at=now()
where is_active
  and regulator_class='other'
  and tier=1
  and source_url not ilike '%theguardian.com%'
  and source_url not ilike '%un.org%'
  and (
    source_url ~* '^https://[^/]*\.(gov|gouv|govt|go|gc)(\.|/)'
    or source_url ~* '^https://(www\.)?(finlex|fimea|basg|ris\.bka|revosax|jazmp|sukl|slov-lex|logir)'
  );

update public.source_registry
set tier=1,
    relevance_status='active',
    updated_at=now()
where is_active
  and regulator_class in (
    'official_gazette',
    'legislature',
    'health_authority',
    'drug_control_authority',
    'medicine_license_registry',
    'customs_import_export'
  )
  and tier>1;

commit;
