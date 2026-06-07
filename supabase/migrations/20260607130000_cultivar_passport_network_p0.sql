-- Cultivar Passport Network P0
-- Permissioned genetics commercialization foundation: passports, country opportunities,
-- evidence metadata, access requests, collaboration projects, service providers, admin
-- claim review, and append-only audit events. Public reads must use DTO allowlists;
-- raw file paths/private evidence are never exposed through public routes.

create type genetics_profile_role as enum ('breeder','geneticist','rights_holder','lab_provider','tissue_culture_provider','nursery','licensed_producer','researcher','importer_exporter','advisor','enterprise_buyer','harbourview_reviewer','harbourview_admin');
create type cultivar_category as enum ('cannabis','hemp','cbd','medical','adult_use','research','pharmaceutical','industrial','unknown');
create type cannabis_category as enum ('cbd_dominant','thc_dominant','balanced','minor_cannabinoid','industrial_hemp','unknown');
create type opportunity_type as enum ('licensing_discussion','trial_discussion','research_collaboration','verification_request','tissue_culture_project','nursery_partnership','commercial_introduction','ip_rights_review','material_transfer_discussion');
create type country_opportunity_status as enum ('open_to_discussion','invite_only','closed','unavailable','not_assessed','blocked_pending_review');
create type evidence_type as enum ('genotype_report','snp_panel','whole_genome_report','dna_fingerprint','chemotype_profile','coa','terpene_panel','cannabinoid_panel','phenotype_record','cultivation_trial','stability_record','pathogen_test','tissue_culture_report','clean_stock_report','photo_record','chain_of_custody','licence_document','ip_filing','pbr_document','plant_patent_document','trademark_document','material_transfer_agreement','licensing_agreement','provenance_note','dispute_note','other');
create type evidence_visibility as enum ('public_summary','registered_members','verified_members','qualified_buyers','nda_private','invite_only','owner_admin_only');
create type claim_status as enum ('claimed','evidence_provided','externally_verified','admin_reviewed','disputed','expired','rejected','not_assessed','private_only');
create type claim_review_status as enum ('draft','submitted','needs_evidence','evidence_attached','approved_public','approved_private_only','downgraded','rejected','disputed','expired');
create type access_request_status as enum ('draft','submitted','identity_review','licence_review','rights_holder_review','nda_required','approved_limited','approved_full','rejected','expired','revoked');
create type project_type as enum ('research_collaboration','verification_project','trial_project','licensing_discussion','tissue_culture_project','commercial_introduction');
create type project_visibility as enum ('public_summary','registered_members','invite_only','owner_admin_only');
create type service_category as enum ('genotyping','chemotype_testing','pathogen_testing','tissue_culture','clean_stock','nursery','ip_advisory','licensing_advisory','regulatory_advisory','other');
create type material_transfer_status as enum ('none','information_only','discussion_only','flagged_material_transfer','licence_required','permit_required','admin_blocked','externally_cleared');
create type jurisdiction_gate_status as enum ('not_assessed','information_only','review_required','blocked','externally_confirmed','admin_approved_for_discussion');
create type audit_event_type as enum ('profile_created','passport_created','passport_updated','evidence_attached','access_requested','access_status_changed','claim_submitted','claim_reviewed','project_created','service_listed','material_transfer_flagged','admin_note_added');
create type access_grant_status as enum ('draft','active','suspended','expired','revoked');
create type genetics_claim_kind as enum ('identity','provenance','genotype','chemotype','pathogen_status','true_to_type','ip_rights','pbr_rights','plant_patent','trademark','licensing_status','material_transfer','export_readiness','import_readiness','gmp_readiness','gacp_readiness','medical_grade','pharmaceutical_grade','stability','uniformity','exclusivity','disease_resistance','yield_performance','other');

create or replace function is_genetics_admin_or_reviewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role in ('admin', 'operator', 'analyst')
  );
$$;

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table genetics_profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  organization_name text,
  primary_role genetics_profile_role not null,
  country_code char(2),
  jurisdiction_label text,
  verification_level text not null default 'not_verified',
  public_summary text,
  website_url text,
  contact_visibility text not null default 'request_only',
  owner_user_id uuid references auth.users(id) on delete set null,
  review_status claim_review_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table genetics_profile_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references genetics_profiles(id) on delete cascade,
  role genetics_profile_role not null,
  created_at timestamptz not null default now(),
  unique (profile_id, role)
);

create table cultivar_passports (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  slug text not null unique,
  public_summary text not null,
  breeder_profile_id uuid references genetics_profiles(id) on delete set null,
  rights_holder_profile_id uuid references genetics_profiles(id) on delete set null,
  origin_country_code char(2),
  origin_jurisdiction_label text,
  cultivar_category cultivar_category not null default 'unknown',
  cannabis_category cannabis_category default 'unknown',
  claim_status claim_status not null default 'not_assessed',
  claim_review_status claim_review_status not null default 'draft',
  evidence_score_summary text,
  verification_summary text,
  public_disclaimer text not null default 'Public passport summary only. No seed, clone, pollen, plant-material shipment, import/export clearance, medical claim, pathogen-free status, or IP ownership is implied.',
  owner_user_id uuid references auth.users(id) on delete set null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cultivar_aliases (
  id uuid primary key default gen_random_uuid(),
  cultivar_id uuid not null references cultivar_passports(id) on delete cascade,
  alias text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table cultivar_country_opportunities (
  id uuid primary key default gen_random_uuid(),
  cultivar_id uuid not null references cultivar_passports(id) on delete cascade,
  country_code char(2) not null,
  jurisdiction_label text,
  opportunity_type opportunity_type not null,
  status country_opportunity_status not null default 'not_assessed',
  material_transfer_status material_transfer_status not null default 'information_only',
  jurisdiction_gate_status jurisdiction_gate_status not null default 'not_assessed',
  public_note text,
  private_note text,
  requires_admin_review boolean not null default true,
  review_status claim_review_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table genetics_evidence_items (
  id uuid primary key default gen_random_uuid(),
  cultivar_id uuid references cultivar_passports(id) on delete cascade,
  profile_id uuid references genetics_profiles(id) on delete set null,
  evidence_type evidence_type not null,
  title text not null,
  source_label text,
  source_date date,
  jurisdiction_label text,
  visibility evidence_visibility not null default 'owner_admin_only',
  claim_status claim_status not null default 'not_assessed',
  review_status claim_review_status not null default 'draft',
  public_summary text,
  private_notes text,
  file_path text,
  file_is_private boolean not null default true,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (visibility <> 'public_summary' or file_path is null or file_is_private = true)
);


create table genetics_claims (
  id uuid primary key default gen_random_uuid(),
  cultivar_id uuid not null references cultivar_passports(id) on delete cascade,
  claim_kind genetics_claim_kind not null,
  claim_label text not null,
  claim_text text not null,
  claim_status claim_status not null default 'not_assessed',
  review_status claim_review_status not null default 'draft',
  public_display_allowed boolean not null default false,
  public_display_text text,
  evidence_item_id uuid references genetics_evidence_items(id) on delete set null,
  evidence_scope text,
  evidence_source_label text,
  evidence_source_date date,
  reviewer_user_id uuid references auth.users(id) on delete set null,
  private_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    public_display_allowed = false
    or (
      evidence_item_id is not null
      and evidence_scope is not null
      and evidence_source_label is not null
      and evidence_source_date is not null
      and review_status = 'approved_public'
      and claim_status in ('externally_verified','admin_reviewed','evidence_provided')
    )
  )
);

create table genetics_access_requests (
  id uuid primary key default gen_random_uuid(),
  cultivar_id uuid not null references cultivar_passports(id) on delete cascade,
  requester_profile_id uuid references genetics_profiles(id) on delete set null,
  request_type opportunity_type not null,
  target_country_code char(2),
  target_jurisdiction_label text,
  declared_purpose text not null,
  status access_request_status not null default 'draft',
  requires_nda boolean not null default true,
  requires_licence_review boolean not null default true,
  requires_admin_review boolean not null default true,
  review_notes_private text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create table genetics_access_grants (
  id uuid primary key default gen_random_uuid(),
  access_request_id uuid references genetics_access_requests(id) on delete set null,
  cultivar_id uuid not null references cultivar_passports(id) on delete cascade,
  grantee_profile_id uuid not null references genetics_profiles(id) on delete cascade,
  grantor_profile_id uuid references genetics_profiles(id) on delete set null,
  grantor_user_id uuid references auth.users(id) on delete set null,
  grant_scope text not null,
  allowed_evidence_item_ids uuid[] not null default '{}',
  allowed_evidence_types evidence_type[] not null default '{}',
  status access_grant_status not null default 'draft',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  revocation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'active' or revoked_at is null),
  check (expires_at is null or expires_at > starts_at),
  check (array_length(allowed_evidence_item_ids, 1) is not null or array_length(allowed_evidence_types, 1) is not null)
);

create table genetics_collaboration_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  project_type project_type not null,
  visibility project_visibility not null default 'owner_admin_only',
  status text not null default 'draft',
  linked_cultivar_id uuid references cultivar_passports(id) on delete set null,
  owner_profile_id uuid references genetics_profiles(id) on delete set null,
  country_code char(2),
  jurisdiction_label text,
  public_summary text not null,
  private_notes text,
  evidence_needed text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table genetics_project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references genetics_collaboration_projects(id) on delete cascade,
  profile_id uuid not null references genetics_profiles(id) on delete cascade,
  member_role text not null,
  access_level text not null default 'summary',
  created_at timestamptz not null default now(),
  unique (project_id, profile_id)
);

create table genetics_service_providers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references genetics_profiles(id) on delete cascade,
  service_category service_category not null,
  service_summary text not null,
  country_code char(2),
  jurisdiction_label text,
  verification_level text not null default 'not_verified',
  is_public boolean not null default false,
  review_status claim_review_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table genetics_claim_reviews (
  id uuid primary key default gen_random_uuid(),
  cultivar_id uuid not null references cultivar_passports(id) on delete cascade,
  evidence_item_id uuid references genetics_evidence_items(id) on delete set null,
  claim_label text not null,
  claim_status claim_status not null default 'not_assessed',
  review_status claim_review_status not null default 'draft',
  reviewer_user_id uuid references auth.users(id) on delete set null,
  public_note text,
  private_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table genetics_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_profile_id uuid references genetics_profiles(id) on delete set null,
  event_type audit_event_type not null,
  entity_type text not null,
  entity_id uuid not null,
  public_summary text not null,
  private_metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_cultivar_passports_public_slug on cultivar_passports(slug) where is_public;
create index idx_cultivar_country_opportunities_cultivar on cultivar_country_opportunities(cultivar_id);
create index idx_genetics_evidence_items_cultivar_visibility on genetics_evidence_items(cultivar_id, visibility);
create index idx_genetics_access_requests_cultivar_status on genetics_access_requests(cultivar_id, status);
create index idx_genetics_access_grants_active on genetics_access_grants(cultivar_id, grantee_profile_id, status, expires_at);
create index idx_genetics_claims_cultivar_public on genetics_claims(cultivar_id, public_display_allowed, review_status);
create index idx_genetics_claim_reviews_status on genetics_claim_reviews(review_status);
create index idx_genetics_audit_events_entity on genetics_audit_events(entity_type, entity_id, created_at desc);

create trigger genetics_profiles_touch_updated_at before update on genetics_profiles for each row execute function touch_updated_at();
create trigger cultivar_passports_touch_updated_at before update on cultivar_passports for each row execute function touch_updated_at();
create trigger cultivar_country_opportunities_touch_updated_at before update on cultivar_country_opportunities for each row execute function touch_updated_at();
create trigger genetics_evidence_items_touch_updated_at before update on genetics_evidence_items for each row execute function touch_updated_at();
create trigger genetics_access_requests_touch_updated_at before update on genetics_access_requests for each row execute function touch_updated_at();
create trigger genetics_access_grants_touch_updated_at before update on genetics_access_grants for each row execute function touch_updated_at();
create trigger genetics_claims_touch_updated_at before update on genetics_claims for each row execute function touch_updated_at();
create trigger genetics_collaboration_projects_touch_updated_at before update on genetics_collaboration_projects for each row execute function touch_updated_at();
create trigger genetics_service_providers_touch_updated_at before update on genetics_service_providers for each row execute function touch_updated_at();
create trigger genetics_claim_reviews_touch_updated_at before update on genetics_claim_reviews for each row execute function touch_updated_at();

alter table genetics_profiles enable row level security;
alter table genetics_profile_roles enable row level security;
alter table cultivar_passports enable row level security;
alter table cultivar_aliases enable row level security;
alter table cultivar_country_opportunities enable row level security;
alter table genetics_evidence_items enable row level security;
alter table genetics_access_requests enable row level security;
alter table genetics_access_grants enable row level security;
alter table genetics_claims enable row level security;
alter table genetics_collaboration_projects enable row level security;
alter table genetics_project_members enable row level security;
alter table genetics_service_providers enable row level security;
alter table genetics_claim_reviews enable row level security;
alter table genetics_audit_events enable row level security;

create policy genetics_profiles_public_read on genetics_profiles for select using (review_status in ('submitted','evidence_attached','approved_public','approved_private_only'));
create policy genetics_profiles_owner_all on genetics_profiles for all using (owner_user_id = auth.uid() or is_genetics_admin_or_reviewer()) with check (owner_user_id = auth.uid() or is_genetics_admin_or_reviewer());

create policy genetics_profile_roles_owner_read on genetics_profile_roles for select using (exists (select 1 from genetics_profiles gp where gp.id = profile_id and (gp.owner_user_id = auth.uid() or is_genetics_admin_or_reviewer())));
create policy genetics_profile_roles_owner_all on genetics_profile_roles for all using (exists (select 1 from genetics_profiles gp where gp.id = profile_id and (gp.owner_user_id = auth.uid() or is_genetics_admin_or_reviewer()))) with check (exists (select 1 from genetics_profiles gp where gp.id = profile_id and (gp.owner_user_id = auth.uid() or is_genetics_admin_or_reviewer())));

create policy cultivar_passports_public_read on cultivar_passports for select using (is_public = true and claim_review_status in ('submitted','evidence_attached','approved_public','approved_private_only','needs_evidence'));
create policy cultivar_passports_owner_all on cultivar_passports for all using (owner_user_id = auth.uid() or is_genetics_admin_or_reviewer()) with check (owner_user_id = auth.uid() or is_genetics_admin_or_reviewer());

create policy cultivar_aliases_public_read on cultivar_aliases for select using (is_public = true and exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.is_public = true));
create policy cultivar_aliases_owner_all on cultivar_aliases for all using (exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and (cp.owner_user_id = auth.uid() or is_genetics_admin_or_reviewer()))) with check (exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and (cp.owner_user_id = auth.uid() or is_genetics_admin_or_reviewer())));

create policy cultivar_country_opportunities_public_read on cultivar_country_opportunities for select using (status in ('open_to_discussion','invite_only','not_assessed') and material_transfer_status in ('none','information_only','discussion_only') and exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.is_public = true));
create policy cultivar_country_opportunities_owner_all on cultivar_country_opportunities for all using (exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and (cp.owner_user_id = auth.uid() or is_genetics_admin_or_reviewer()))) with check (exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and (cp.owner_user_id = auth.uid() or is_genetics_admin_or_reviewer())));

create policy genetics_evidence_items_public_summary_read on genetics_evidence_items for select using (visibility = 'public_summary' and file_is_private = true and exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.is_public = true));
create policy genetics_evidence_items_owner_all on genetics_evidence_items for all using (created_by = auth.uid() or is_genetics_admin_or_reviewer() or exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.owner_user_id = auth.uid())) with check (created_by = auth.uid() or is_genetics_admin_or_reviewer() or exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.owner_user_id = auth.uid()));
create policy genetics_evidence_items_grant_read on genetics_evidence_items for select using (exists (select 1 from genetics_access_grants gag join genetics_profiles gp on gp.id = gag.grantee_profile_id where gag.cultivar_id = genetics_evidence_items.cultivar_id and gp.owner_user_id = auth.uid() and gag.status = 'active' and gag.starts_at <= now() and (gag.expires_at is null or gag.expires_at > now()) and gag.revoked_at is null and (genetics_evidence_items.id = any(gag.allowed_evidence_item_ids) or genetics_evidence_items.evidence_type = any(gag.allowed_evidence_types))));

create policy genetics_access_requests_owner_all on genetics_access_requests for all using (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = requester_profile_id and gp.owner_user_id = auth.uid()) or exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.owner_user_id = auth.uid())) with check (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = requester_profile_id and gp.owner_user_id = auth.uid()) or exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.owner_user_id = auth.uid())));

create policy genetics_access_grants_admin_owner_all on genetics_access_grants for all using (is_genetics_admin_or_reviewer() or grantor_user_id = auth.uid() or exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.owner_user_id = auth.uid())) with check (is_genetics_admin_or_reviewer() or grantor_user_id = auth.uid() or exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.owner_user_id = auth.uid()));
create policy genetics_access_grants_grantee_read on genetics_access_grants for select using (exists (select 1 from genetics_profiles gp where gp.id = grantee_profile_id and gp.owner_user_id = auth.uid()));

create policy genetics_claims_public_read on genetics_claims for select using (public_display_allowed = true and review_status = 'approved_public');
create policy genetics_claims_owner_admin_all on genetics_claims for all using (is_genetics_admin_or_reviewer() or exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.owner_user_id = auth.uid())) with check (is_genetics_admin_or_reviewer() or exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.owner_user_id = auth.uid())));

create policy genetics_collaboration_projects_public_read on genetics_collaboration_projects for select using (visibility = 'public_summary');
create policy genetics_collaboration_projects_owner_all on genetics_collaboration_projects for all using (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = owner_profile_id and gp.owner_user_id = auth.uid())) with check (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = owner_profile_id and gp.owner_user_id = auth.uid())));
create policy genetics_project_members_member_read on genetics_project_members for select using (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = profile_id and gp.owner_user_id = auth.uid()));
create policy genetics_project_members_admin_all on genetics_project_members for all using (is_genetics_admin_or_reviewer()) with check (is_genetics_admin_or_reviewer());

create policy genetics_service_providers_public_read on genetics_service_providers for select using (is_public = true and review_status in ('submitted','evidence_attached','approved_public','approved_private_only'));
create policy genetics_service_providers_owner_all on genetics_service_providers for all using (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = profile_id and gp.owner_user_id = auth.uid())) with check (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = profile_id and gp.owner_user_id = auth.uid())));

create policy genetics_claim_reviews_admin_all on genetics_claim_reviews for all using (is_genetics_admin_or_reviewer()) with check (is_genetics_admin_or_reviewer());
create policy genetics_claim_reviews_owner_read on genetics_claim_reviews for select using (exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.owner_user_id = auth.uid()));

-- Audit events are intentionally not publicly readable. Insert is restricted to server/admin
-- contexts (service role bypasses RLS; reviewers may insert operational audit events).
create policy genetics_audit_events_admin_insert on genetics_audit_events for insert with check (is_genetics_admin_or_reviewer());
create policy genetics_audit_events_admin_read on genetics_audit_events for select using (is_genetics_admin_or_reviewer());

-- Public access is intentionally exposed through allowlisted views instead of direct base-table
-- public policies, because base tables contain owner ids, private notes, and file paths.
drop policy genetics_profiles_public_read on genetics_profiles;
drop policy cultivar_passports_public_read on cultivar_passports;
drop policy cultivar_aliases_public_read on cultivar_aliases;
drop policy cultivar_country_opportunities_public_read on cultivar_country_opportunities;
drop policy genetics_evidence_items_public_summary_read on genetics_evidence_items;
drop policy genetics_collaboration_projects_public_read on genetics_collaboration_projects;
drop policy genetics_service_providers_public_read on genetics_service_providers;

create view genetics_public_profiles as
select id, display_name, organization_name, primary_role, country_code, jurisdiction_label, verification_level, public_summary, website_url, contact_visibility
from genetics_profiles
where review_status in ('submitted','evidence_attached','approved_public','approved_private_only');

create view genetics_public_cultivar_passports as
select id, display_name, slug, public_summary, breeder_profile_id, rights_holder_profile_id, origin_country_code, origin_jurisdiction_label, cultivar_category, cannabis_category, claim_status, evidence_score_summary, verification_summary, public_disclaimer, created_at, updated_at
from cultivar_passports
where is_public = true and claim_review_status in ('submitted','evidence_attached','approved_public','approved_private_only','needs_evidence');

create view genetics_public_cultivar_aliases as
select ca.id, ca.cultivar_id, ca.alias, ca.created_at
from cultivar_aliases ca
join cultivar_passports cp on cp.id = ca.cultivar_id
where ca.is_public = true and cp.is_public = true;

create view genetics_public_country_opportunities as
select id, cultivar_id, country_code, jurisdiction_label, opportunity_type, status, material_transfer_status, jurisdiction_gate_status, public_note, created_at, updated_at
from cultivar_country_opportunities
where status in ('open_to_discussion','invite_only','not_assessed')
  and material_transfer_status in ('none','information_only','discussion_only')
  and exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.is_public = true);

create view genetics_public_evidence_summaries as
select id, cultivar_id, profile_id, evidence_type, title, source_label, source_date, jurisdiction_label, claim_status, review_status, public_summary, created_at, updated_at
from genetics_evidence_items
where visibility = 'public_summary'
  and file_is_private = true
  and exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.is_public = true);

create view genetics_public_claims as
select id, cultivar_id, claim_kind, claim_label, public_display_text, claim_status, review_status, evidence_source_label, evidence_source_date, evidence_scope, created_at, updated_at
from genetics_claims
where public_display_allowed = true and review_status = 'approved_public';

create view genetics_public_collaboration_projects as
select id, title, slug, project_type, visibility, status, linked_cultivar_id, owner_profile_id, country_code, jurisdiction_label, public_summary, evidence_needed, created_at, updated_at
from genetics_collaboration_projects
where visibility = 'public_summary';

create view genetics_public_service_providers as
select gsp.id, gsp.profile_id, gp.display_name, gsp.service_category, gsp.service_summary, gsp.country_code, gsp.jurisdiction_label, gsp.verification_level, gsp.created_at, gsp.updated_at
from genetics_service_providers gsp
join genetics_profiles gp on gp.id = gsp.profile_id
where gsp.is_public = true and gsp.review_status in ('submitted','evidence_attached','approved_public','approved_private_only');

grant select on genetics_public_profiles to anon, authenticated;
grant select on genetics_public_cultivar_passports to anon, authenticated;
grant select on genetics_public_cultivar_aliases to anon, authenticated;
grant select on genetics_public_country_opportunities to anon, authenticated;
grant select on genetics_public_evidence_summaries to anon, authenticated;
grant select on genetics_public_claims to anon, authenticated;
grant select on genetics_public_collaboration_projects to anon, authenticated;
grant select on genetics_public_service_providers to anon, authenticated;


-- Private Genetics Evidence Vault storage. Evidence files must live in this private
-- bucket and must only be exposed by server-side signed URL handlers after checking
-- genetics_access_grants. Public DTOs/views intentionally never include bucket names,
-- object keys, file paths, filenames, or signed URLs.
insert into storage.buckets (id, name, public)
values ('genetics-evidence-private', 'genetics-evidence-private', false)
on conflict (id) do nothing;

drop policy if exists "Genetics reviewers can upload private evidence" on storage.objects;
drop policy if exists "Genetics reviewers can read private evidence" on storage.objects;
drop policy if exists "Genetics reviewers can update private evidence" on storage.objects;
drop policy if exists "Genetics grantees can read explicitly granted private evidence" on storage.objects;

create policy "Genetics reviewers can upload private evidence"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'genetics-evidence-private' and public.is_genetics_admin_or_reviewer());

create policy "Genetics reviewers can read private evidence"
on storage.objects
for select
to authenticated
using (bucket_id = 'genetics-evidence-private' and public.is_genetics_admin_or_reviewer());

create policy "Genetics reviewers can update private evidence"
on storage.objects
for update
to authenticated
using (bucket_id = 'genetics-evidence-private' and public.is_genetics_admin_or_reviewer())
with check (bucket_id = 'genetics-evidence-private' and public.is_genetics_admin_or_reviewer());

create policy "Genetics grantees can read explicitly granted private evidence"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'genetics-evidence-private'
  and exists (
    select 1
    from genetics_evidence_items gei
    join genetics_access_grants gag on gag.cultivar_id = gei.cultivar_id
    join genetics_profiles gp on gp.id = gag.grantee_profile_id
    where gei.file_path = storage.objects.name
      and gei.file_is_private = true
      and gp.owner_user_id = auth.uid()
      and gag.status = 'active'
      and gag.starts_at <= now()
      and (gag.expires_at is null or gag.expires_at > now())
      and gag.revoked_at is null
      and (gei.id = any(gag.allowed_evidence_item_ids) or gei.evidence_type = any(gag.allowed_evidence_types))
  )
);
