alter table job_search.jobs add column if not exists distance_km int;
alter table job_search.jobs add column if not exists remote boolean default false;