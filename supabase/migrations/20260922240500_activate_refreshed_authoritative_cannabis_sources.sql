-- Activate the refreshed first-party cannabis regulator endpoints so the acquisition worker can capture them.
update public.source_registry
set relevance_status='active',
    is_active=true,
    crawl_allowed=true,
    next_crawl_at=now(),
    updated_at=now()
where jurisdiction_code in ('AU','CA-AB','CA-BC','CA-NS','CA-NU','CA-YT')
  and tier=1
  and regulator_class='drug_control_authority';
