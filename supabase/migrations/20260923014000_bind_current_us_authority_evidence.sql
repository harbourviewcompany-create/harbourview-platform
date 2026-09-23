-- Bind current first-party state authority snapshots to existing evidence rows.
-- Only rows whose captured text directly supports the published commercial/medical pathway are bound.
update public.regulatory_market_access_evidence
set tier='legal_commercial_access',
    authority_name='Maine Office of Cannabis Policy',
    authority_url='https://www.maine.gov/dafs/ocp/',
    rationale='The official Maine Office of Cannabis Policy page identifies an Adult Use program, states that Maine voters approved recreational use, and describes the office as licensing and regulating cannabis establishments; this supports an active commercial adult-use market-access pathway.',
    source_effective_date='2026-09-22',
    verified_at='2026-09-22 22:50:36.864893+00',
    expires_at='2027-09-22 22:50:36.864893+00',
    source_snapshot_sha256='50cbec1577f78cb4a3b73ce9d73beaaad558bdb2141b7fe0494d4320152aafa5',
    active=true
where evidence_key='ncsl-us-me-20260831';

update public.regulatory_market_access_evidence
set tier='legal_commercial_access',
    authority_name='Michigan Cannabis Regulatory Agency',
    authority_url='https://www.michigan.gov/cra/',
    rationale='The official Michigan Cannabis Regulatory Agency page lists Adult-Use Establishments and instructs applicants to apply, amend, renew adult-use establishment licences; it also identifies medical facilities. This supports an active commercial cannabis market-access pathway.',
    source_effective_date='2026-09-22',
    verified_at='2026-09-22 22:50:36.923168+00',
    expires_at='2027-09-22 22:50:36.923168+00',
    source_snapshot_sha256='4a6102079d1890a45bf9172c9f22ff1ceee75d973da5c545cbaf2fa53573eac9',
    active=true
where evidence_key='ncsl-us-mi-20260831';

update public.regulatory_market_access_evidence
set tier='legal_commercial_access',
    authority_name='Minnesota Office of Cannabis Management',
    authority_url='https://mn.gov/ocm/',
    rationale='The official Minnesota Office of Cannabis Management page identifies Adult-Use Cannabis and a cannabis-business licensing application process, including retail, cultivation, manufacturing, testing, transport and wholesale operation plans; this supports an active commercial cannabis market-access pathway.',
    source_effective_date='2026-09-22',
    verified_at='2026-09-22 22:50:36.847822+00',
    expires_at='2027-09-22 22:50:36.847822+00',
    source_snapshot_sha256='2089308f1305c29c247dde07bfc11075bf8b2e71ff0b535aaa9c1bb45fadc437',
    active=true
where evidence_key='ncsl-us-mn-20260831';

update public.regulatory_market_access_evidence
set tier='medical_limited_trade',
    authority_name='Pennsylvania Department of Health',
    authority_url='https://www.pa.gov/agencies/health',
    rationale='The official Pennsylvania Department of Health site identifies the Medical Marijuana program among Commonwealth health programs; this supports a medical cannabis regulatory pathway but the captured page does not by itself establish adult-use commercial access.',
    source_effective_date='2026-09-22',
    verified_at='2026-09-22 22:50:37.279844+00',
    expires_at='2027-09-22 22:50:37.279844+00',
    source_snapshot_sha256='8f11d9fde113629e134a1b131d4aa4ac7a9ee9c8058cecd5284d52eb04ff8aa2',
    active=true
where evidence_key='ncsl-us-pa-20260831';

update public.regulatory_market_access_evidence
set tier='medical_limited_trade',
    authority_name='Utah Center for Medical Cannabis',
    authority_url='https://medicalcannabis.utah.gov',
    rationale='The official Utah Center for Medical Cannabis page provides medical-cannabis patient access, provider and pharmacy pathways and links to Utah medical-cannabis law and producer/pharmacy resources; this supports a regulated medical cannabis market pathway, not adult-use access.',
    source_effective_date='2026-09-22',
    verified_at='2026-09-22 22:50:36.238599+00',
    expires_at='2027-09-22 22:50:36.238599+00',
    source_snapshot_sha256='919ffc2179fcb5075ad8d16e91a1c72c4f7ff66c2edcfada31f9b8ca88e2e442',
    active=true
where evidence_key='state-2026-us_ut-primary';

select api.refresh_verified_market_access_tiers('bind-current-us-authority-evidence-20260923');
