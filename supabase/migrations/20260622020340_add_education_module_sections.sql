create table if not exists education_module_sections (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references education_modules(id) on delete cascade,
  section_order int not null,
  heading text not null,
  body text not null,
  block_type text not null default 'text',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, section_order)
);

alter table education_module_sections enable row level security;

create policy "public read sections of published modules"
on education_module_sections
for select
to anon, authenticated
using (
  exists (
    select 1 from education_modules m
    where m.id = education_module_sections.module_id
    and m.publication_state = 'published'
  )
);

create index if not exists idx_education_module_sections_module_id
on education_module_sections (module_id, section_order);
