create schema if not exists job_search;

create table job_search.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  notes text,
  created_at timestamptz default now()
);

create table job_search.jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_id text,
  title text not null,
  company_id uuid references job_search.companies(id),
  location text,
  remote boolean default false,
  job_type text,
  description text,
  url text,
  posted_at date,
  fetched_at timestamptz default now(),
  status text default 'found',
  fit_score int,
  fit_reasons text,
  unique (source, external_id)
);

create table job_search.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references job_search.jobs(id),
  status text default 'interested',
  applied_at date,
  resume_version_id uuid,
  cover_note text,
  notes text,
  updated_at timestamptz default now()
);

create table job_search.resume_versions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references job_search.applications(id),
  content text,
  docx_url text,
  created_at timestamptz default now()
);

alter table job_search.applications
  add constraint fk_resume_version foreign key (resume_version_id) references job_search.resume_versions(id);

create table job_search.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references job_search.companies(id),
  name text,
  title text,
  email text,
  linkedin_url text,
  source text,
  created_at timestamptz default now()
);

create table job_search.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references job_search.applications(id),
  contact_id uuid references job_search.contacts(id),
  type text,
  draft_body text,
  status text default 'drafted',
  scheduled_for date,
  sent_at timestamptz
);

create table job_search.settings (
  id int primary key default 1,
  search_terms jsonb default '["business development manager","account manager","channel partnerships manager"]'::jsonb,
  locations jsonb default '["Ottawa, Ontario","Remote, Canada"]'::jsonb,
  base_resume jsonb,
  constraint singleton check (id = 1)
);

insert into job_search.settings (id) values (1) on conflict do nothing;

alter table job_search.companies enable row level security;
alter table job_search.jobs enable row level security;
alter table job_search.applications enable row level security;
alter table job_search.resume_versions enable row level security;
alter table job_search.contacts enable row level security;
alter table job_search.outreach_messages enable row level security;
alter table job_search.settings enable row level security;

create policy "service role full access" on job_search.companies for all using (auth.role() = 'service_role');
create policy "service role full access" on job_search.jobs for all using (auth.role() = 'service_role');
create policy "service role full access" on job_search.applications for all using (auth.role() = 'service_role');
create policy "service role full access" on job_search.resume_versions for all using (auth.role() = 'service_role');
create policy "service role full access" on job_search.contacts for all using (auth.role() = 'service_role');
create policy "service role full access" on job_search.outreach_messages for all using (auth.role() = 'service_role');
create policy "service role full access" on job_search.settings for all using (auth.role() = 'service_role');
