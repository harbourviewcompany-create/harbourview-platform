-- Authoritative adjudication tranche 5: one prohibited market and one
-- deliberately blocked market where the current legal framework is not yet
-- operational. Resolved uncertainty is preferable to forced classification.

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-kh-20260923','KH','prohibited',
 'Cambodia''s National Trade Repository records a continuing prohibition on import of narcotic plants and substances in Table I, and the official Law on Drug Management prohibits cultivation of cannabis except specified licensed pharmaceutical purposes. The current official framework does not establish general commercial cannabis retail or adult-use trade.',
 'Cambodia National Trade Repository / Royal Government of Cambodia',
 'https://cambodiantr.gov.kh/measure/?title=ban-on-the-import-of-narcotic-plants-substances-and-ingredients-in-table-i-of-the-law',
 '1996-09-12',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-kh-20260923');

update public.jurisdiction_data_depth_dimension_state s
set applicability='applicable',
    status='blocked',
    blocker_reason='Current Fiji government materials describe medicinal-cannabis policy development and legislation drafting, but explicitly state there was no specific cultivation/production legislation at the cited decision point. Government materials also state there are no local sales or marketing under the proposed export-oriented model. No current operational commercial regulatory instrument meeting Harbourview''s publication bar was identified; do not force a tier.',
    evidence_count=0,
    primary_source_count=1,
    confidence='high',
    evidence_basis='Fiji Government Cabinet decisions and current government statement on medicinal-cannabis legislative development',
    last_evaluated_at=now(),
    updated_at=now()
where s.jurisdiction_key='FJ'
  and s.dimension_key='regulatory_tier'
  and s.contract_version='2026-09-23.v2';

select * from api.refresh_verified_market_access_tiers('primary-evidence-kh-20260923');
