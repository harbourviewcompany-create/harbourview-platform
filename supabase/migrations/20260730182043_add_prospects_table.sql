create table job_search.prospects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references job_search.companies(id),
  company_name text not null,
  signal text not null,
  signal_source_url text,
  status text default 'watching',
  created_at timestamptz default now()
);

alter table job_search.prospects enable row level security;
create policy "service role full access" on job_search.prospects for all using (auth.role() = 'service_role');

insert into job_search.prospects (company_name, signal, signal_source_url)
values (
  'Evidence Partners',
  'Ottawa SaaS company (DistillerSR) reported outgrowing its office within four months of moving, a documented rapid-growth signal worth a warm approach before any BD/ops role is posted publicly.',
  'https://www.investottawa.ca/blog/10-ottawa-global-tech-companies-with-job-openings-in-june-2026/'
);
