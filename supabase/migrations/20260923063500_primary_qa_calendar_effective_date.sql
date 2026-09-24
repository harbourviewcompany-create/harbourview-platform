insert into public.regulatory_calendar
(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'QA','effective','Law No. 9 of 1987 — narcotics control law','1987-04-06','confirmed',
'https://www.almeezan.qa/LawView.aspx?LawID=3989&language=en&opt=',
'Qatar Legal Portal — Al Meezan','effective'
where not exists (
  select 1 from public.regulatory_calendar
  where iso2='QA' and title='Law No. 9 of 1987 — narcotics control law'
);

update public.jurisdiction_dimension_coverage
set status='verified_populated',
    evidence_basis='Primary Qatar Legal Portal confirms Law No. 9/1987 is in force and dated 1987-04-06.',
    last_evaluated_at=now()
where jurisdiction_key='QA' and dimension_key='regulatory_calendar';

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now()
where jurisdiction_key='QA' and dimension_key='regulatory_calendar'
  and status in ('open','in_progress','blocked');
