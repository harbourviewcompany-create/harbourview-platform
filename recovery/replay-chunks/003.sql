
-- RECOVERY BEGIN 20260621220513_cultivar_passport_network_p0_synfix.sql
-- Cultivar Passport Network P0
-- Permissioned genetics commercialization foundation: passports, country opportunities,
-- evidence metadata, access requests, collaboration projects, service providers, admin
-- claim review, and append-only audit events. Public reads must use DTO allowlists;
-- raw file paths/private evidence are never exposed through public routes.
-- NOTE: applied as a forward-fix of 20260607130000_cultivar_passport_network_p0.sql,
-- which never successfully applied due to 4 unbalanced-parenthesis syntax errors
-- (lines 364, 374, 379, 388 in the repo file). Confirmed via live schema check that
-- none of these objects existed prior to this migration.

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

drop trigger if exists genetics_profiles_touch_updated_at on genetics_profiles;
create trigger genetics_profiles_touch_updated_at before update on genetics_profiles for each row execute function touch_updated_at();
drop trigger if exists cultivar_passports_touch_updated_at on cultivar_passports;
create trigger cultivar_passports_touch_updated_at before update on cultivar_passports for each row execute function touch_updated_at();
drop trigger if exists cultivar_country_opportunities_touch_updated_at on cultivar_country_opportunities;
create trigger cultivar_country_opportunities_touch_updated_at before update on cultivar_country_opportunities for each row execute function touch_updated_at();
drop trigger if exists genetics_evidence_items_touch_updated_at on genetics_evidence_items;
create trigger genetics_evidence_items_touch_updated_at before update on genetics_evidence_items for each row execute function touch_updated_at();
drop trigger if exists genetics_access_requests_touch_updated_at on genetics_access_requests;
create trigger genetics_access_requests_touch_updated_at before update on genetics_access_requests for each row execute function touch_updated_at();
drop trigger if exists genetics_access_grants_touch_updated_at on genetics_access_grants;
create trigger genetics_access_grants_touch_updated_at before update on genetics_access_grants for each row execute function touch_updated_at();
drop trigger if exists genetics_claims_touch_updated_at on genetics_claims;
create trigger genetics_claims_touch_updated_at before update on genetics_claims for each row execute function touch_updated_at();
drop trigger if exists genetics_collaboration_projects_touch_updated_at on genetics_collaboration_projects;
create trigger genetics_collaboration_projects_touch_updated_at before update on genetics_collaboration_projects for each row execute function touch_updated_at();
drop trigger if exists genetics_service_providers_touch_updated_at on genetics_service_providers;
create trigger genetics_service_providers_touch_updated_at before update on genetics_service_providers for each row execute function touch_updated_at();
drop trigger if exists genetics_claim_reviews_touch_updated_at on genetics_claim_reviews;
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

drop policy if exists genetics_profiles_public_read on genetics_profiles;
create policy genetics_profiles_public_read on genetics_profiles for select using (review_status in ('submitted','evidence_attached','approved_public','approved_private_only'));
drop policy if exists genetics_profiles_owner_all on genetics_profiles;
create policy genetics_profiles_owner_all on genetics_profiles for all using (owner_user_id = auth.uid() or is_genetics_admin_or_reviewer()) with check (owner_user_id = auth.uid() or is_genetics_admin_or_reviewer());

drop policy if exists genetics_profile_roles_owner_read on genetics_profile_roles;
create policy genetics_profile_roles_owner_read on genetics_profile_roles for select using (exists (select 1 from genetics_profiles gp where gp.id = profile_id and (gp.owner_user_id = auth.uid() or is_genetics_admin_or_reviewer())));
drop policy if exists genetics_profile_roles_owner_all on genetics_profile_roles;
create policy genetics_profile_roles_owner_all on genetics_profile_roles for all using (exists (select 1 from genetics_profiles gp where gp.id = profile_id and (gp.owner_user_id = auth.uid() or is_genetics_admin_or_reviewer()))) with check (exists (select 1 from genetics_profiles gp where gp.id = profile_id and (gp.owner_user_id = auth.uid() or is_genetics_admin_or_reviewer())));

drop policy if exists cultivar_passports_public_read on cultivar_passports;
create policy cultivar_passports_public_read on cultivar_passports for select using (is_public = true and claim_review_status in ('submitted','evidence_attached','approved_public','approved_private_only','needs_evidence'));
drop policy if exists cultivar_passports_owner_all on cultivar_passports;
create policy cultivar_passports_owner_all on cultivar_passports for all using (owner_user_id = auth.uid() or is_genetics_admin_or_reviewer()) with check (owner_user_id = auth.uid() or is_genetics_admin_or_reviewer());

drop policy if exists cultivar_aliases_public_read on cultivar_aliases;
create policy cultivar_aliases_public_read on cultivar_aliases for select using (is_public = true and exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.is_public = true));
drop policy if exists cultivar_aliases_owner_all on cultivar_aliases;
create policy cultivar_aliases_owner_all on cultivar_aliases for all using (exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and (cp.owner_user_id = auth.uid() or is_genetics_admin_or_reviewer()))) with check (exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and (cp.owner_user_id = auth.uid() or is_genetics_admin_or_reviewer())));

drop policy if exists cultivar_country_opportunities_public_read on cultivar_country_opportunities;
create policy cultivar_country_opportunities_public_read on cultivar_country_opportunities for select using (status in ('open_to_discussion','invite_only','not_assessed') and material_transfer_status in ('none','information_only','discussion_only') and exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.is_public = true));
drop policy if exists cultivar_country_opportunities_owner_all on cultivar_country_opportunities;
create policy cultivar_country_opportunities_owner_all on cultivar_country_opportunities for all using (exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and (cp.owner_user_id = auth.uid() or is_genetics_admin_or_reviewer()))) with check (exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and (cp.owner_user_id = auth.uid() or is_genetics_admin_or_reviewer())));

drop policy if exists genetics_evidence_items_public_summary_read on genetics_evidence_items;
create policy genetics_evidence_items_public_summary_read on genetics_evidence_items for select using (visibility = 'public_summary' and file_is_private = true and exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.is_public = true));
drop policy if exists genetics_evidence_items_owner_all on genetics_evidence_items;
create policy genetics_evidence_items_owner_all on genetics_evidence_items for all using (created_by = auth.uid() or is_genetics_admin_or_reviewer() or exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.owner_user_id = auth.uid())) with check (created_by = auth.uid() or is_genetics_admin_or_reviewer() or exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.owner_user_id = auth.uid()));
drop policy if exists genetics_evidence_items_grant_read on genetics_evidence_items;
create policy genetics_evidence_items_grant_read on genetics_evidence_items for select using (exists (select 1 from genetics_access_grants gag join genetics_profiles gp on gp.id = gag.grantee_profile_id where gag.cultivar_id = genetics_evidence_items.cultivar_id and gp.owner_user_id = auth.uid() and gag.status = 'active' and gag.starts_at <= now() and (gag.expires_at is null or gag.expires_at > now()) and gag.revoked_at is null and (genetics_evidence_items.id = any(gag.allowed_evidence_item_ids) or genetics_evidence_items.evidence_type = any(gag.allowed_evidence_types))));

drop policy if exists genetics_access_requests_owner_all on genetics_access_requests;
create policy genetics_access_requests_owner_all on genetics_access_requests for all using (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = requester_profile_id and gp.owner_user_id = auth.uid()) or exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.owner_user_id = auth.uid())) with check (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = requester_profile_id and gp.owner_user_id = auth.uid()) or exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.owner_user_id = auth.uid()));

drop policy if exists genetics_access_grants_admin_owner_all on genetics_access_grants;
create policy genetics_access_grants_admin_owner_all on genetics_access_grants for all using (is_genetics_admin_or_reviewer() or grantor_user_id = auth.uid() or exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.owner_user_id = auth.uid())) with check (is_genetics_admin_or_reviewer() or grantor_user_id = auth.uid() or exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.owner_user_id = auth.uid()));
drop policy if exists genetics_access_grants_grantee_read on genetics_access_grants;
create policy genetics_access_grants_grantee_read on genetics_access_grants for select using (exists (select 1 from genetics_profiles gp where gp.id = grantee_profile_id and gp.owner_user_id = auth.uid()));

drop policy if exists genetics_claims_public_read on genetics_claims;
create policy genetics_claims_public_read on genetics_claims for select using (public_display_allowed = true and review_status = 'approved_public');
drop policy if exists genetics_claims_owner_admin_all on genetics_claims;
create policy genetics_claims_owner_admin_all on genetics_claims for all using (is_genetics_admin_or_reviewer() or exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.owner_user_id = auth.uid())) with check (is_genetics_admin_or_reviewer() or exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.owner_user_id = auth.uid()));

drop policy if exists genetics_collaboration_projects_public_read on genetics_collaboration_projects;
create policy genetics_collaboration_projects_public_read on genetics_collaboration_projects for select using (visibility = 'public_summary');
drop policy if exists genetics_collaboration_projects_owner_all on genetics_collaboration_projects;
create policy genetics_collaboration_projects_owner_all on genetics_collaboration_projects for all using (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = owner_profile_id and gp.owner_user_id = auth.uid())) with check (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = owner_profile_id and gp.owner_user_id = auth.uid()));
drop policy if exists genetics_project_members_member_read on genetics_project_members;
create policy genetics_project_members_member_read on genetics_project_members for select using (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = profile_id and gp.owner_user_id = auth.uid()));
drop policy if exists genetics_project_members_admin_all on genetics_project_members;
create policy genetics_project_members_admin_all on genetics_project_members for all using (is_genetics_admin_or_reviewer()) with check (is_genetics_admin_or_reviewer());

drop policy if exists genetics_service_providers_public_read on genetics_service_providers;
create policy genetics_service_providers_public_read on genetics_service_providers for select using (is_public = true and review_status in ('submitted','evidence_attached','approved_public','approved_private_only'));
drop policy if exists genetics_service_providers_owner_all on genetics_service_providers;
create policy genetics_service_providers_owner_all on genetics_service_providers for all using (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = profile_id and gp.owner_user_id = auth.uid())) with check (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = profile_id and gp.owner_user_id = auth.uid()));

drop policy if exists genetics_claim_reviews_admin_all on genetics_claim_reviews;
create policy genetics_claim_reviews_admin_all on genetics_claim_reviews for all using (is_genetics_admin_or_reviewer()) with check (is_genetics_admin_or_reviewer());
drop policy if exists genetics_claim_reviews_owner_read on genetics_claim_reviews;
create policy genetics_claim_reviews_owner_read on genetics_claim_reviews for select using (exists (select 1 from cultivar_passports cp where cp.id = cultivar_id and cp.owner_user_id = auth.uid()));

-- Audit events are intentionally not publicly readable. Insert is restricted to server/admin
-- contexts (service role bypasses RLS; reviewers may insert operational audit events).
drop policy if exists genetics_audit_events_admin_insert on genetics_audit_events;
create policy genetics_audit_events_admin_insert on genetics_audit_events for insert with check (is_genetics_admin_or_reviewer());
drop policy if exists genetics_audit_events_admin_read on genetics_audit_events;
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621220513','cultivar_passport_network_p0_synfix','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621220513_cultivar_passport_network_p0_synfix.sql

-- RECOVERY BEGIN 20260621220514_seed_genetics_cultivar_passports.sql
-- Reconciled historical seed marker.
--
-- Production records version 20260621220514 as a comment-only reconciliation;
-- it does not execute the incompatible draft seed contained in the former
-- repository file. The draft referenced profile columns and cultivar-category
-- enum values that are not part of the canonical Cultivar Passport Network
-- schema, and the corresponding synthetic profile/passport rows are not present
-- in production.
--
-- Evidence-bearing cultivar and rights-holder records must be introduced only by
-- a separately reviewed, provenance-backed seed or controlled application flow.


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621220514','seed_genetics_cultivar_passports','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621220514_seed_genetics_cultivar_passports.sql

-- RECOVERY BEGIN 20260621220515_restore_audit_events_foundation.sql
-- Production's immutable public.audit_events relation existed out of band before
-- repository migrations began indexing, exposing, and hardening it. Restore the
-- exact table contract during zero-state replay without replacing or updating data.

create table if not exists public.audit_events (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor text not null default 'system',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  actor_user_id uuid references auth.users(id),
  actor_org_id uuid references public.workspaces(id),
  deal_room_id uuid,
  ip_address text,
  user_agent text
);

create index if not exists idx_audit_events_actor
  on public.audit_events(actor);
create index if not exists idx_audit_events_actor_org
  on public.audit_events(actor_org_id, created_at desc);
create index if not exists idx_audit_events_actor_user
  on public.audit_events(actor_user_id, created_at desc);
create index if not exists idx_audit_events_created_at
  on public.audit_events(created_at desc);
create index if not exists idx_audit_events_entity
  on public.audit_events(entity_type, entity_id);

alter table public.audit_events enable row level security;

do $restore_audit_events_policy$
begin
  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.audit_events'::regclass
      and polname = 'admin_operator_select'
  ) then
    create policy admin_operator_select
      on public.audit_events
      for select
      to public
      using (
        exists (
          select 1
          from public.user_roles
          where user_roles.user_id = (select auth.uid())
            and user_roles.role = any (array['admin'::text, 'operator'::text])
        )
      );
  end if;
end
$restore_audit_events_policy$;

comment on table public.audit_events is
  'Immutable event log. Service role INSERT only. No user writes.';

-- Preserve production ACLs. RLS permits only the explicit admin/operator read
-- policy; application-role writes remain denied while service_role can append.
grant select, insert, update, delete on table public.audit_events
  to anon, authenticated;
grant all privileges on table public.audit_events to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621220515','restore_audit_events_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621220515_restore_audit_events_foundation.sql

-- RECOVERY BEGIN 20260621232637_seed_briefings_europe_a.sql

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'austria','country','AT','Medical — Prescription Only; CBD Legal',
'Austria permits medical cannabis under the Suchtmittelgesetz (SMG), overseen by the Austrian Agency for Health and Food Safety (AGES). Cannabis-based medicinal products including Sativex and magistral (compounding pharmacy) preparations are accessible via physician prescription for medically appropriate conditions. Austria was among the earlier EU states to allow magistral cannabis formulations, enabling licensed pharmacies to prepare cannabis oils and other preparations directly for patients. Hemp-derived CBD products below 0.3% THC are permitted as nutritional supplements under food law. The Austrian medical cannabis market is served by imported pharmaceutical-grade cannabis and a small number of domestic cultivators licensed by AGES. Patient numbers are estimated in the low tens of thousands, concentrated in pain, neurological, and oncology settings.',
'Austrian patients access medical cannabis through physician prescription without specialist restriction. Most statutory health insurers (Krankenkasse) do not reimburse cannabis prescriptions; out-of-pocket payment is the norm. Magistral preparations from licensed compounding pharmacies are the most accessible route. CBD products below 0.3% THC are sold freely at specialty stores and online.',
'Any Austrian physician licensed by the Österreichische Ärztekammer (AK) may prescribe cannabis-based medicinal products without specialist restriction. Magistral prescriptions must be prepared by licensed compounding pharmacies. Standard SMG controlled substance documentation requirements apply.',
'The Austrian medical cannabis market is moderate in scale. Several pharmacies specialise in cannabis compounding. Austria imports pharmaceutical-grade cannabis from Netherlands, Germany, and Canadian producers. CBD retail is well-established in Vienna, Graz, and Salzburg. Domestic cultivation under AGES licence supplies both domestic and export markets.',
'Austria is monitoring EU regulatory developments closely, particularly Germany''s CanG reform. No near-term framework reform beyond the existing medical prescription route is expected. CBD regulation may tighten in alignment with EFSA Novel Food final rulings.',
'Austrian Agency for Health and Food Safety (AGES) — ages.at; Austrian Medical Chamber (Ärztekammer) — aerztekammer.at; Suchtmittelgesetz (SMG)',
'Austrian Federal Health Ministry publications; AGES regulatory guidance; EMCDDA Austria country report',
'Based on AGES public guidance and EMCDDA data. No patient-level prescription volume data reviewed.',
'Quarterly','National regulatory framework; prescription access; CBD product status; physician prescribing rules; health insurance reimbursement.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AT' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'belgium','country','BE','Medical — Limited (Sativex); CBD Legal; Personal Use Deprioritised',
'Belgium has a complex cannabis landscape. Personal possession of up to 3 grams for adults is deprioritised for enforcement under a 2003 ministerial directive, though cannabis remains technically illegal. Medical cannabis access is limited to Sativex (nabiximols), approved for multiple sclerosis-related spasticity via specialist prescription. Other cannabis-based medicines may be accessed on a named-patient basis through the Federal Agency for Medicines and Health Products (FAMHP), though this route is rarely used in practice. Hemp-derived CBD products with THC below 0.2% are permitted under food law. Belgium hosts significant cannabis pharmaceutical research activity and is the European base for several cannabis companies. Multiple parliamentary proposals for expanded medical access or a regulated adult-use model have been submitted but not yet enacted.',
'Belgian patients may access Sativex through neurologist prescription with potential RIZIV/INAMI reimbursement for qualifying MS indications. Named-patient access to other cannabis medicines is possible through FAMHP on a case-by-case basis. CBD products below 0.2% THC are available in retail. No broad patient registration programme exists.',
'Belgian neurologists registered with the Order of Physicians may prescribe Sativex. Named-patient compassionate use for other preparations requires FAMHP authorisation with specialist documentation. No general cannabis prescribing right for flower or oils exists outside the Sativex and named-patient pathway.',
'Belgium has an active CBD retail sector in Brussels, Antwerp, and Ghent. Several Belgian companies are pursuing EU-GMP production licences targeting German and UK export markets. Underground cannabis consumption is widespread. The absence of a broader medical programme suppresses the legitimate market relative to population size.',
'Multiple legislative proposals for broader medical access or regulated adult-use reform are active as of 2026. Belgium is expected to follow EU harmonisation trends. A regulatory pilot programme or expanded medical framework is plausible in 2026-2028.',
'Federal Agency for Medicines and Health Products (FAMHP) — fagg-afmps.be; RIZIV/INAMI — riziv.fgov.be',
'FAMHP regulatory guidance; EMCDDA Belgium country report; Belgian parliamentary records on cannabis reform proposals',
'Based on FAMHP public guidance, parliamentary records, and EMCDDA data.',
'Quarterly','Legal framework; Sativex access and reimbursement; CBD regulation; named-patient pathway; reform status.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'bulgaria','country','BG','Medical — Limited (Sativex); CBD Legal',
'Bulgaria permits cannabis-based medicinal products under the Law on Narcotics and Precursors, allowing Sativex and approved preparations via prescription. The programme is very limited in practice — most prescribing is concentrated in MS-related spasticity treated with Sativex. Hemp cultivation is legal for industrial and food purposes under EU Common Agricultural Policy rules for low-THC cultivars, and Bulgaria is a significant EU hemp producer. CBD products derived from hemp are permitted below the 0.2% THC limit. Personal cannabis use remains criminalised, and Bulgaria maintains conservative enforcement standards. Reform discussions are in early stages, influenced by developments in Germany and Czechia.',
'Bulgarian patients can access Sativex through specialist prescription. Named-patient access to other cannabis-based medicines exists via the Bulgarian Drug Agency (BDA) but requires case-by-case approval. Out-of-pocket costs are significant as health insurance does not typically cover cannabis medicines. Patient numbers are very small.',
'Bulgarian neurologists and relevant specialists may prescribe Sativex and approved cannabis-based medicines. Named-patient applications for other preparations require BDA approval. No general prescribing right for cannabis flower or oils exists. Physician education on medical cannabis remains limited.',
'The Bulgarian medical cannabis market is very small. Hemp agricultural production is significant — Bulgaria ranks among the top EU hemp producers by cultivated area. CBD product retail has expanded in Sofia and other cities. No significant domestic medical cannabis production industry has developed for human medicines.',
'Bulgaria is monitoring EU reform trajectories. No near-term unilateral domestic reform is expected. EFSA Novel Food rulings on CBD will influence the regulatory approach. A broader medical programme could emerge from EU-level harmonisation pressure.',
'Bulgarian Drug Agency (BDA) — bda.bg; Ministry of Health — mh.government.bg',
'Bulgarian Drug Agency regulatory guidance; EMCDDA Bulgaria country report; EU hemp cultivation statistics',
'Based on BDA public guidance and EMCDDA data. Limited domestic data on prescription volumes.',
'Annual','Legal framework; Sativex access; hemp cultivation status; CBD retail; named-patient pathway.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'bosnia-and-herzegovina','country','BA','Prohibited — No Medical Programme',
'Bosnia and Herzegovina maintains cannabis as a prohibited substance under narcotic laws in both the Federation of Bosnia and Herzegovina and Republika Srpska entities, with no medical cannabis programme established. Cannabis possession and use are criminal offences. The country has not advanced formal legislative proposals for medical or adult-use cannabis reform as of 2026. The complex bi-entity political structure makes coordinated reform challenging. Bosnia and Herzegovina is an EU candidate country; its drug policy will eventually face harmonisation pressure. The reform trajectories of neighbouring Balkan states (Serbia, North Macedonia, Croatia) with established medical programmes represent the most immediate external comparison.',
'No legal patient access pathway exists. Patients requiring cannabis-based medicines must seek informal channels or travel to neighbouring Croatia, Serbia, or North Macedonia.',
'No cannabis prescribing right exists for physicians in Bosnia and Herzegovina. Healthcare providers cannot legally recommend or prescribe cannabis.',
'No legal cannabis market exists. Hemp and CBD products are available through informal retail without legal clarity. No licensed cannabis companies operate domestically for medical production.',
'EU accession discussions and the reform trajectories of neighbouring Balkan states are the primary reform pressure points. Cannabis reform is not a current political priority for either entity government.',
'Ministry of Civil Affairs (BiH) — mcp.gov.ba; Entity health ministries',
'EMCDDA BiH country report; national narcotics law review; EU accession assessment documents',
'Based on EMCDDA country reporting and legislative review. No domestic medical cannabis registry data available.',
'Annual','Legal framework; absence of medical programme; hemp status; EU accession context.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'croatia','country','HR','Medical — Prescription Programme (Since 2015)',
'Croatia established a formal medical cannabis programme in 2015, making it one of the first countries in the Western Balkans and among the early EU member states to do so. Licensed physicians may prescribe cannabis-based medicinal products for appropriate indications, and HALMED (Croatian Agency for Medicinal Products and Medical Devices) oversees licensing for both import and domestic EU-GMP cultivation. Cannabis remains prohibited for non-medical use, with misdemeanour penalties or treatment referral applicable for personal possession. The Croatian medical cannabis market has developed steadily since 2015, with increasing patient numbers and a growing number of licensed importers and domestic producers exporting to Germany, the UK, and other EU markets.',
'Croatian patients access medical cannabis through physician prescription. The programme covers chronic pain, MS spasticity, epilepsy, and chemotherapy-related nausea. Prescriptions are dispensed at licensed pharmacies. The Croatian Health Insurance Fund (HZZO) may provide partial reimbursement for specific conditions. Patient access has improved significantly since programme inception.',
'Croatian physicians with a valid licence from the Croatian Medical Chamber (HLK) may prescribe medical cannabis for approved indications. HALMED has issued prescribing guidance. Neurology, oncology, and pain medicine specialists lead prescribing in practice. Standard controlled substance documentation is required.',
'Croatia has a small but growing medical cannabis market with several domestic EU-GMP licensed producers. Export activity to Germany, the UK, and other EU markets is increasing. Several licensed importers also supply the domestic market. Croatia has become a minor but notable EU cannabis production country.',
'Croatia is likely to continue expanding its medical programme in alignment with EU regulatory trends. HALMED may broaden approved indications and products. Croatia''s role as an EU production and export hub may grow as German market demand increases under CanG.',
'Croatian Agency for Medicinal Products and Medical Devices (HALMED) — halmed.hr; Croatian Medical Chamber (HLK) — hlk.hr; Croatian Health Insurance Fund (HZZO) — hzzo.hr',
'HALMED regulatory guidance; HZZO reimbursement documentation; EMCDDA Croatia country report',
'Based on HALMED public guidance, EMCDDA data, and published export licensing information.',
'Quarterly','Medical programme legal framework; prescribing access; HZZO reimbursement; domestic production and export; patient numbers.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='HR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'cyprus','country','CY','Medical — Prescription Programme (Since 2019); Export Hub',
'Cyprus legalised medical cannabis in 2019 under an amendment to the Narcotic Drugs and Psychotropic Substances Law, with the Ministry of Health administering the programme. Licensed physicians may prescribe cannabis-based medicinal products for approved indications, and licensing frameworks exist for both import and domestic EU-GMP cultivation. Cyprus has positioned itself as a Mediterranean pharmaceutical cannabis production hub, attracting significant international investment due to its EU membership, business environment, and strategic location. Multiple large-scale EU-GMP cultivation and processing facilities have been established with production capacity substantially exceeding domestic patient demand, targeting export to Germany, the UK, and Israel. Personal cannabis use remains illegal.',
'Cypriot patients access medical cannabis through physician prescription under Ministry of Health protocols. Approved indications include chronic pain, MS, epilepsy, PTSD, and cancer-related symptoms. Prescriptions are dispensed through licensed pharmacies. No public reimbursement scheme covers cannabis medicines; all costs are out-of-pocket.',
'Cyprus-licensed physicians may prescribe medical cannabis after completing relevant continuing medical education and registering with the Medical Council. Neurologists, pain specialists, and oncologists are the primary prescribers. A physician training and registration requirement distinguishes the Cypriot model from some EU peers.',
'Cyprus has attracted substantial cannabis investment. Multiple large-scale EU-GMP cultivation facilities are operational, with production primarily intended for export. Major international cannabis companies have incorporated or established subsidiaries in Cyprus. The domestic patient market remains small relative to production capacity.',
'Cyprus is expected to continue positioning as a Mediterranean production and export hub. The domestic patient programme may expand modestly. As German market demand grows under CanG, Cyprus-based producers are well-positioned to supply. Regulatory alignment with EU standards will remain the primary driver.',
'Cyprus Ministry of Health — mohph.gov.cy; Cyprus Medical Council — medicalcouncil.org.cy',
'Cyprus Ministry of Health regulatory guidance; EMCDDA Cyprus country report; company investor disclosures',
'Based on Ministry of Health public guidance and EMCDDA reporting. Export volume data from company public disclosures.',
'Quarterly','Medical programme legal framework; specialist prescribing; EU-GMP production capacity; export activity; domestic patient access.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CY' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'czechia','country','CZ','Medical Legal (Since 2013); Adult-Use Reform Advancing',
'Czechia has one of the most progressive cannabis regulatory environments in Europe. Medical cannabis has been legal since 2013 under a structured prescription programme administered by SÚKL (State Institute for Drug Control). Personal possession of up to 10 grams for adults is effectively decriminalised through low-priority enforcement, though it remains technically an administrative offence. In 2024-2025, the Czech government advanced legislation to establish a regulated adult-use cannabis market, positioning Czechia as one of the most reform-oriented EU member states alongside Germany and Luxembourg. Medical cannabis patients number in the tens of thousands, served by a licensed import and domestic EU-GMP production system. Domestic producers supply both the Czech market and export to Germany and the UK.',
'Czech medical cannabis patients access treatment through specialist or GP prescription under the Zákon o návykových látkách. Approved indications include chronic pain, MS spasticity, nausea from chemotherapy, and epilepsy. Health insurance (VZP and others) has provided partial reimbursement for registered patients. Access barriers have decreased significantly since the programme launched.',
'Czech physicians with standard medical licences may prescribe medical cannabis without specialist restriction. SÚKL maintains a list of approved preparations. Neurologists, oncologists, and pain specialists are primary prescribers, but GPs may also prescribe. Electronic prescribing is integrated into the standard system.',
'Czechia has an active medical cannabis market with licensed domestic EU-GMP producers and importers. The CBD retail market is substantial. Informal cannabis use is widespread and the effective decriminalisation framework has created a tolerant enforcement culture. The adult-use reform, if enacted, will create a new licensed retail sector.',
'Czechia is actively advancing adult-use cannabis regulation as of 2026, making it one of the most dynamic regulatory environments in Europe. Legislative progress is expected in 2026-2027. SÚKL continues to expand the approved products list for medical use.',
'State Institute for Drug Control (SÚKL) — sukl.cz; Czech Medical Chamber — lkcr.cz; Ministry of Health — mzcr.cz',
'SÚKL regulatory guidance; EMCDDA Czechia country report; parliamentary records on adult-use legislation; licensed producer disclosures',
'Based on SÚKL guidance, EMCDDA data, and legislative tracking of adult-use reform proposals.',
'Quarterly','Medical programme; decriminalisation framework; adult-use reform progress; EU-GMP production; export activity; health insurance reimbursement.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CZ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'denmark','country','DK','Medical — Permanent Framework (Post-Pilot, 2022 Onwards)',
'Denmark ran a comprehensive four-year medical cannabis pilot programme from January 2018 to December 2021, during which licensed physicians could prescribe standardised cannabis products for specific conditions. Following pilot evaluation, Denmark established a permanent medical cannabis framework under the Danish Medicines Act administered by the Lægemiddelstyrelsen (Danish Medicines Agency). Cannabis for personal non-medical use remains prohibited, with the Christiania district of Copenhagen historically operating an open cannabis market that has faced periodic law enforcement action. Denmark has significant pharmaceutical and life sciences industry presence, and several Danish companies are active in the medical cannabis production sector.',
'Danish patients access medical cannabis through physician prescription under the permanent framework. Approved products must be authorised by Lægemiddelstyrelsen. The Danish health insurance system has provided reimbursement for qualifying patients under specific criteria. Covered conditions include MS spasticity, chronic pain, and chemotherapy-related nausea.',
'Danish licensed physicians may prescribe authorised medical cannabis products. Specialist recommendation is typically required for initial prescription. Lægemiddelstyrelsen maintains a list of authorised products. Pilot evaluation data directly informed prescribing guidelines for the permanent scheme.',
'Denmark''s medical cannabis market is served by imported products and a small number of domestic EU-GMP licensed cultivators. Export to other EU markets, particularly Germany, is increasing. The domestic patient population has grown steadily. Denmark is a notable hub for cannabis pharmaceutical research.',
'The permanent medical cannabis framework is expected to continue expanding its approved products list and potentially covered indications. Denmark is monitoring EU harmonisation developments. No near-term movement toward adult-use legislation is expected. The Christiania situation remains an ongoing policy challenge.',
'Danish Medicines Agency (Lægemiddelstyrelsen) — laegemiddelstyrelsen.dk; Ministry of Health — sum.dk',
'Lægemiddelstyrelsen regulatory guidance; pilot programme evaluation reports; EMCDDA Denmark country report',
'Based on Lægemiddelstyrelsen guidance, pilot evaluation reports, and EMCDDA data.',
'Quarterly','Permanent medical framework; prescribing access; approved product list; domestic production; export activity; pilot evaluation outcomes.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DK' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'estonia','country','EE','Medical — Named Patient Only; CBD Legal',
'Estonia has a very limited medical cannabis framework. Cannabis-based medicinal products, including Sativex, may be authorised on a named-patient basis through the State Agency of Medicines (Ravimiamet). Estonia does not have a broad-access medical programme; patients must apply for individual authorisation for specific cannabis products. The programme is minimal in patient numbers. Personal cannabis use remains prohibited with criminal penalties. Estonia has historically maintained strict drug enforcement standards and has not advanced legislative reform proposals for medical expansion or adult-use access.',
'Estonian patients seeking medical cannabis must obtain individual authorisation from Ravimiamet on a named-patient basis. No general prescription programme exists. Access is effectively restricted to patients with specialist documentation for conditions such as MS-related spasticity. Full out-of-pocket costs apply.',
'Estonian physicians may apply to Ravimiamet for named-patient authorisation to prescribe specific cannabis-based medicines. No general prescribing right exists. Neurologists and relevant specialists are typical applicants. The authorisation process is administratively burdensome.',
'The Estonian medical cannabis market is negligible. CBD product retail exists in urban areas, particularly Tallinn. No domestic medical cannabis production industry has developed.',
'Estonia is likely to follow broader EU regulatory developments on medical cannabis harmonisation but is not expected to unilaterally expand its framework in the near term. Conservative drug policy is embedded in the political consensus.',
'State Agency of Medicines (Ravimiamet) — ravimiamet.ee; Ministry of Social Affairs — sm.ee',
'Ravimiamet guidance; EMCDDA Estonia country report',
'Based on Ravimiamet public guidance and EMCDDA data.',
'Annual','Named-patient access; Sativex availability; CBD retail status; absence of general medical programme.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='EE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'finland','country','FI','Medical — Sativex via Specialist Prescription; CBD Legal',
'Finland permits medical cannabis under the Narcotic Drugs Act, administered by Fimea (Finnish Medicines Agency). Sativex is registered in Finland for MS-related spasticity and available through specialist prescription, with Kela (Social Insurance Institution) reimbursement for qualifying patients. Other cannabis preparations may be authorised on a named-patient basis but are very limited in practice. Personal cannabis use is prohibited, with Finland maintaining one of the stricter drug enforcement cultures in Northern Europe. Citizens'' initiatives on decriminalisation have gathered significant signatures but have not translated into legislative change.',
'Finnish MS patients may access Sativex through neurologist prescription with Kela reimbursement under the high-cost protection scheme. Other cannabis medicines require individual Fimea authorisation and are essentially inaccessible without exceptional circumstances. Patient numbers for cannabis medicines are estimated in the hundreds to low thousands.',
'Finnish neurologists and relevant specialists may prescribe Sativex. Named-patient requests for other cannabis preparations face significant administrative barriers. Finnish physician culture has been conservative regarding cannabis prescribing beyond the narrow Sativex indication. No general GP prescribing right exists.',
'Finland has no commercial medical cannabis market beyond the Sativex prescription segment. CBD products derived from hemp are regulated under food law through Ruokavirasto (Finnish Food Authority). No domestic medical cannabis production. Underground cannabis market is modest relative to neighbouring countries.',
'Finland is likely to remain conservative on cannabis reform in the near term. EU harmonisation and the influence of Denmark''s evolving approach may eventually prompt modest programme expansion. Fimea may align CBD guidance with EFSA rulings.',
'Finnish Medicines Agency (Fimea) — fimea.fi; Kela — kela.fi; Finnish Food Authority (Ruokavirasto) — ruokavirasto.fi',
'Fimea guidance; Kela reimbursement data; EMCDDA Finland country report',
'Based on Fimea public guidance and EMCDDA data.',
'Annual','Sativex access and Kela reimbursement; named-patient pathway; CBD food law status; absence of broad medical programme.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='FI' AND jurisdiction_type='country');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621232637','seed_briefings_europe_a','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621232637_seed_briefings_europe_a.sql

-- RECOVERY BEGIN 20260621232826_seed_briefings_europe_b.sql

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'greece','country','GR','Medical Legal (Since 2017); Licensed Export Industry',
'Greece legalised medical cannabis in 2017 and has systematically expanded its regulatory framework since then. Law 4523/2018 and subsequent updates established the basis for cannabis cultivation, processing, and export, with the National Organization for Medicines (EOF) administering the framework. Greece operates one of the more developed EU medical cannabis frameworks in Southern Europe. Personal cannabis use remains illegal, though small-quantity personal possession can result in administrative rather than criminal penalties. Greece attracted international cannabis investment early due to its agricultural advantages — climate, land availability, lower production costs — and EU membership. By 2026, Greece hosts multiple licensed EU-GMP cultivation facilities primarily focused on export to Germany, the UK, and other EU markets.',
'Greek patients may access medical cannabis through specialist prescription under EOF protocols. Approved indications include chronic pain, MS, epilepsy, and cancer-related symptoms. Prescriptions are dispensed through licensed pharmacies. Health insurance coverage is limited; significant out-of-pocket costs apply for most patients.',
'Greek physicians on the specialist register may prescribe medical cannabis for approved indications under EOF protocols. Neurologists, oncologists, pain specialists, and psychiatrists are the primary prescribers. EOF has issued prescribing guidelines and a physician registration requirement applies.',
'Greece has developed a significant medical cannabis cultivation sector. Several large-scale EU-GMP licensed facilities are operational, with production primarily intended for export. Greek agricultural companies and international cannabis firms have invested substantially. Domestic patient numbers are growing but the export industry dominates economically.',
'Greece is expected to continue expanding its medical cannabis export infrastructure. Regulatory alignment with EU standards will remain the primary driver. Domestic patient programme expansion is anticipated. The Greek government has been broadly supportive of the medical and export industry as an economic development vehicle.',
'National Organization for Medicines (EOF) — eof.gr; Ministry of Health — moh.gov.gr',
'EOF regulatory guidance; Greek Ministry of Health public communications; EMCDDA Greece country report; company investor disclosures',
'Based on EOF guidance, EMCDDA data, and published producer licensing information.',
'Quarterly','Medical programme legal framework; specialist prescribing; EOF oversight; export industry; EU-GMP production capacity; domestic patient access.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'hungary','country','HU','Prohibited — Sativex Named-Patient Access Only',
'Hungary maintains one of the most restrictive drug policy approaches in the European Union. Cannabis is a Schedule I drug under the Criminal Code (Büntető Törvénykönyv), with criminal sanctions applicable even for small personal quantities. Hungary has not established a formal medical cannabis programme. The only legal cannabis-derived medicine available is Sativex, which may be obtained on an individual named-patient basis through the National Institute of Pharmacy and Nutrition (OGYÉI), but access is severely limited in practice. The government has shown no interest in cannabis reform, and CBD products exist in a legally uncertain environment — the government has periodically taken enforcement action against CBD retailers.',
'Patient access to cannabis-based medicines in Hungary is extremely limited. Named-patient import of Sativex can be requested through OGYÉI but requires substantial documentation and specialist approval. Health insurance does not cover cannabis medicines. Many Hungarian patients seek access through neighbouring Austria or Slovakia.',
'No prescribing right for cannabis beyond Sativex named-patient procedures exists. The medical community has had limited engagement with cannabis medicine given the restrictive policy environment. Neurologists may apply for named-patient Sativex access but face significant administrative barriers.',
'Hungary has no commercial medical cannabis market. Hemp fibre production exists under EU agricultural rules with strict THC controls. CBD products exist in a legally uncertain environment. No domestic medical cannabis production industry has developed.',
'No cannabis reform is anticipated under the current political framework. The government has explicitly opposed cannabis reform at EU level. Changes would likely require significant EU-level policy shifts. Hungary is likely to remain among the most restrictive EU member states for the foreseeable future.',
'National Institute of Pharmacy and Nutrition (OGYÉI) — ogyei.gov.hu; Ministry of the Interior — kormany.hu',
'OGYÉI regulatory guidance; EMCDDA Hungary country report',
'Based on OGYÉI public guidance and EMCDDA data. Limited transparency on named-patient approval rates.',
'Annual','Prohibition framework; named-patient Sativex pathway; CBD legal uncertainty; absence of medical programme; reform prospects.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='HU' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'iceland','country','IS','Medical — Limited Prescription; CBD Legal',
'Iceland permits cannabis-based medicines on a prescription basis, with the Icelandic Medicines Agency (Lyfjastofnun) responsible for product authorisation. Sativex is registered in Iceland and available through specialist prescription. Other cannabis-based products may be authorised on a named-patient basis. Iceland is not an EU member but participates in the EEA and aligns with EU pharmaceutical regulations. Personal cannabis use is prohibited; cultural attitudes have been slowly evolving, particularly among younger demographics. Iceland''s small population of approximately 370,000 limits market scale significantly.',
'Icelandic patients can access Sativex through neurologist or specialist prescription. Named-patient authorisation for other cannabis products is available through Lyfjastofnun. Health insurance coverage is limited. Patient numbers are very small given the population.',
'Icelandic physicians may prescribe Sativex and seek Lyfjastofnun authorisation for named-patient cannabis products. No general prescribing right for cannabis beyond authorised medicines exists. Specialist recommendation is required for most access pathways.',
'Iceland''s cannabis market is negligible in commercial terms. No domestic medical cannabis production. CBD imports from EU are the primary cannabis-adjacent retail activity. Iceland''s small population and geographic isolation limit market development.',
'No legislative cannabis reform is expected in Iceland in the near term. The country typically follows EU regulatory trends and could align with any EU-level medical cannabis harmonisation. Public health-focused drug policy discussions continue but have not translated into reform initiatives.',
'Icelandic Medicines Agency (Lyfjastofnun) — lyfjastofnun.is; Directorate of Health — landlaeknir.is',
'Lyfjastofnun guidance; EMCDDA Iceland reporting; Health Directorate publications',
'Based on Lyfjastofnun public guidance and available drug policy data.',
'Annual','Sativex access; named-patient pathway; CBD import status; small market context.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='IS' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'ireland','country','IE','Medical — MCAP Programme (Since 2019); Permanent Framework Established',
'Ireland established its Medical Cannabis Access Programme (MCAP) in 2019, administered by the Health Products Regulatory Authority (HPRA). MCAP allows specialist physicians to enrol patients with three specific conditions: refractory epilepsy, MS-related spasticity, and severe treatment-resistant nausea from chemotherapy. In 2023, Ireland progressed the Health (Amendment) Act establishing a permanent medical cannabis framework. Simultaneously, the government introduced a drugs diversion scheme for personal cannabis quantities, redirecting them to health services rather than criminal prosecution — a significant shift in Irish drug policy. Patient numbers under MCAP have grown to several hundred.',
'Irish patients can access cannabis under MCAP through specialist physician enrolment. Eligible conditions are refractory epilepsy, MS-related spasticity, and chemotherapy-induced nausea. Products must be on the HPRA approved list. Patients pay out-of-pocket as the HSE does not currently reimburse cannabis medicines under the Drug Payment Scheme.',
'Only specialist physicians may apply to enrol patients in MCAP. Specialists in neurology, neurosurgery, and medical oncology are the primary practitioners. The HPRA oversees the scheme. The permanent framework under the 2023 Act is expected to broaden physician access rules.',
'The Irish medical cannabis market is small and import-dependent. No significant domestic production has developed. Licensed importers supply approved products. The CBD market has grown under food law. Ireland''s EU membership creates import and re-export opportunities as the framework matures.',
'The permanent framework under the 2023 Act is being implemented and is expected to broaden both the eligible condition list and the prescriber base. The personal possession diversion scheme signals a broader policy re-evaluation. Ireland is likely to progressively expand medical cannabis access through 2026-2028.',
'Health Products Regulatory Authority (HPRA) — hpra.ie; Health Service Executive (HSE) — hse.ie; Department of Health — gov.ie/health',
'HPRA MCAP guidance; EMCDDA Ireland country report; Oireachtas records on Health Amendment Act 2023',
'Based on HPRA guidance, Oireachtas records, and EMCDDA data.',
'Quarterly','MCAP framework; specialist prescribing; approved conditions; HSE reimbursement status; permanent framework implementation; personal possession policy.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='IE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'italy','country','IT','Medical — Prescription Programme; Military Farm Sole Domestic Cultivator',
'Italy has operated a medical cannabis programme since 2007, significantly expanded following the DM 9 November 2015 decree that simplified prescribing procedures. Any licensed Italian physician may prescribe medical cannabis without specialist restriction, making Italy one of the most accessible prescribing environments in the EU. The only licensed domestic cultivator is the Military Chemical-Pharmaceutical Plant (Stabilimento Chimico Farmaceutico Militare, SCFM) in Florence — a state military facility producing pharmaceutical-grade cannabis under strict GMP conditions. Despite SCFM production, supply is chronically insufficient to meet growing demand, requiring substantial imports from the Netherlands and other EU producers. Regional SSN reimbursement varies widely — some regions (Toscana, Puglia, Liguria) cover costs; others require full out-of-pocket payment. The CBD regulatory environment has been subject to significant legal uncertainty from conflicting court rulings.',
'Italian patients access medical cannabis through any licensed physician (medico curante) without specialist restriction. Prescriptions are filled at pharmacies that compound or dispense approved preparations. Regional reimbursement varies: some Italian regions cover cannabis medicines under the SSN; others require full out-of-pocket payment. Patient numbers are in the tens of thousands and growing.',
'Any Italian physician with a standard medical licence (iscrizione all''Albo dei Medici) may prescribe medical cannabis following DM 9 November 2015 protocols. No specialist restriction applies. AIFA provides prescribing guidance. This makes Italy one of the most open prescribing markets in the EU, embraced by GPs and specialists alike.',
'Italy''s medical cannabis market is characterised by demand chronically exceeding domestic supply. The SCFM produces limited quantities; imports from Netherlands, Portugal, Germany, and Canadian producers are essential. Private cannabis clinics have emerged in major cities. Industrial hemp cultivation is significant for food and cosmetic sectors.',
'Italy is expected to eventually expand domestic production capacity, potentially opening cultivation to private licensed producers beyond the SCFM monopoly — a reform repeatedly discussed but not yet enacted. The CBD regulatory environment may stabilise following definitive EU-level EFSA classification. Regional reimbursement disparities are a continuing policy challenge.',
'Italian Medicines Agency (AIFA) — aifa.gov.it; Stabilimento Chimico Farmaceutico Militare (SCFM); Ministry of Health — salute.gov.it',
'AIFA regulatory guidance; DM 9 November 2015; EMCDDA Italy country report; Italian court rulings on CBD; SCFM production reports',
'Based on AIFA guidance, ministerial decree text, EMCDDA data, and published court decisions.',
'Quarterly','Prescribing framework; SCFM domestic production; import dependency; regional reimbursement variation; CBD regulatory status; patient numbers.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='IT' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'kosovo','country','XK','Prohibited — No Medical Programme',
'Kosovo maintains cannabis prohibition under its Law on Prevention of and Fight Against Illicit Traffic in Narcotics, Psychotropic Substances and Precursors. Cannabis use and possession are criminal offences. Kosovo does not have a medical cannabis programme. As a partially recognised state and EU candidate, Kosovo''s long-term EU integration aspiration creates some external pressure for drug policy alignment, but no domestic reform initiative has been advanced. Kosovo''s close ties to neighbouring North Macedonia — which has a well-developed medical cannabis export industry — create awareness of cannabis policy developments, but this has not yet translated into legislative action.',
'No legal patient access exists. Some residents may access cannabis through informal cross-border channels from North Macedonia or Serbia.',
'No cannabis prescribing right exists for Kosovo physicians.',
'No legal cannabis market. No significant hemp cultivation industry.',
'EU integration aspirations over the long term may drive alignment with EU medical cannabis frameworks. North Macedonia''s experience is the most immediately relevant regional model. No near-term domestic reform anticipated.',
'Kosovo Ministry of Health — msh.rks-gov.net',
'Limited available data; EMCDDA indirect reporting',
'Based on available legislative information.',
'Annual','Prohibition framework; EU candidate context; no medical programme.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='XK' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'latvia','country','LV','Medical — Named Patient Only; CBD Legal',
'Latvia has a very limited medical cannabis framework under the Law on Narcotic and Psychotropic Substances and the Pharmacies Law. Cannabis-based medicinal products including Sativex may be authorised on a named-patient basis through the State Agency of Medicines (Zāļu valsts aģentūra, ZVA). No broad medical programme exists. Personal cannabis use is prohibited with criminal penalties. Latvia has one of the more conservative drug enforcement approaches among the Baltic states. Hemp cultivation for industrial fibre and seed is legal under EU rules. CBD products are available in retail in a legally ambiguous status.',
'Named-patient access through ZVA is the only legal pathway for medical cannabis in Latvia. Patient numbers are very small. Sativex is the primary product available. Out-of-pocket costs apply fully. No public reimbursement exists for cannabis medicines.',
'Latvian physicians may apply to ZVA for named-patient cannabis medicine authorisation. Neurologists and pain specialists are typical applicants. No general prescribing right exists. The authorisation process is administratively burdensome relative to the practical access it enables.',
'Latvia has no commercial medical cannabis market. Hemp industrial cultivation exists at modest scale. CBD retail operates without clear legal authorisation. No Latvian cannabis companies have achieved significant regional market presence.',
'Latvia is likely to follow broader EU regulatory developments without unilateral domestic reform. Any expansion of the medical cannabis framework would most plausibly come from EU-level harmonisation. Conservative drug policy is entrenched in the political consensus.',
'State Agency of Medicines (ZVA) — zva.gov.lv; Ministry of Health — vm.gov.lv',
'ZVA guidance; EMCDDA Latvia country report',
'Based on ZVA public guidance and EMCDDA data.',
'Annual','Named-patient Sativex access; absence of general medical programme; hemp status; CBD regulatory status.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LV' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'liechtenstein','country','LI','Medical — Swiss Framework Alignment',
'Liechtenstein is a microstate of approximately 40,000 residents with close economic and regulatory ties to Switzerland via a customs union. Cannabis regulation in Liechtenstein broadly aligns with Swiss frameworks — cannabis-based medicines authorised in Switzerland may be accessible through equivalent channels. Liechtenstein has no independent cannabis regulatory authority of significance. Personal cannabis use is prohibited. The country''s tiny population and Swiss economic integration mean regulatory developments in Switzerland directly shape the Liechtenstein context, including any adult-use pilot developments.',
'Patient access in Liechtenstein is effectively via Swiss regulatory channels. Patients may seek medical cannabis through Swiss-style specialist prescriptions. Patient numbers are negligible given the population.',
'Liechtenstein physicians follow Swiss prescribing norms for controlled substances. Cannabis-based medicines authorised by Swissmedic are the primary available products.',
'No cannabis market of significance exists in Liechtenstein. Swiss retail dynamics apply by proximity.',
'Liechtenstein will follow Switzerland''s approach to cannabis reform, including adult-use pilot developments. No independent reform is anticipated.',
'Office for Food Control and Veterinary Affairs (Liechtenstein) — llv.li; Swissmedic (alignment reference) — swissmedic.ch',
'Swiss regulatory publications; limited Liechtenstein-specific guidance',
'Very limited data available; analysis relies on Swiss regulatory alignment.',
'Annual','Swiss regulatory alignment; microstate context; absence of independent programme.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LI' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'lithuania','country','LT','Medical — Limited; CBD Legal; Decriminalisation Debated',
'Lithuania permits cannabis-based medicinal products via the State Medicines Control Agency (VASPVT). Sativex is authorised and named-patient access to other preparations is possible. The programme is small, similar in scale to Latvia and Estonia. Personal possession is criminalised. Hemp is cultivated industrially under EU rules. CBD products are in a regulatory grey zone. Lithuania has had more active parliamentary debate about drug policy reform than its Baltic neighbours, with discussions about decriminalisation and expanded medical access, but no legislative reform had been enacted as of 2026.',
'Named-patient authorisation and Sativex prescription are the primary access pathways. Patient numbers are very small. Out-of-pocket costs apply fully. Some Lithuanian patients access cannabis through informal channels or travel to Germany or the Netherlands.',
'Lithuanian physicians may prescribe authorised cannabis medicines and apply for named-patient access through VASPVT. No specialist restriction formally applies but physician familiarity with cannabis prescribing is low.',
'No significant commercial cannabis market. Hemp cultivation is present. CBD retail is growing but legally uncertain. A small number of Lithuanian companies have explored EU-GMP cannabis production prospects.',
'Lithuania is somewhat more reform-oriented than its Baltic peers in terms of political discussion. Decriminalisation has gathered parliamentary support. Medical programme expansion following EU trends is plausible in the 2026-2028 window.',
'State Medicines Control Agency (VASPVT) — vaspvt.gov.lt; Ministry of Health — sam.lrv.lt',
'VASPVT guidance; EMCDDA Lithuania country report',
'Based on VASPVT guidance and EMCDDA data.',
'Annual','Named-patient access; Sativex availability; reform discussion status; CBD legal status; hemp cultivation.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LT' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'luxembourg','country','LU','Adult-Use Legal — Home Cultivation (Since 2023); First EU Member State',
'Luxembourg became the first European Union member state to legalise adult-use cannabis in July 2023 under the Loi du 8 avril 2023. Adults 18+ may grow up to four plants per household for personal use and possess up to 3 grams in public. Seeds may be purchased legally. A regulated commercial retail market was proposed but commercial sales to the general public had not yet launched as of mid-2026, given EU legal complexities and Schengen border concerns. Medical cannabis has been accessible for years via physician prescription under the Direction de la Santé framework. Luxembourg''s small population of approximately 660,000 limits domestic market scale, but its central EU location and EU institution presence give it disproportionate policy influence.',
'Adults 18+ in Luxembourg may legally possess up to 3 grams in public and cultivate up to 4 plants at home. Medical cannabis patients access treatment through physician prescription for approved cannabis medicines. No commercial retail for adult-use cannabis is currently available.',
'Luxembourg physicians may prescribe cannabis-based medicinal products without specialist restriction under standard controlled substance prescribing rules administered by the Direction de la Santé.',
'Luxembourg''s cannabis market is shaped by home cultivation legalisation rather than commercial sales, which have not yet launched. Cross-border concerns with France, Belgium, and Germany — all with varying legal frameworks — dominate the commercial policy discussion. Medical cannabis is available through licensed pharmacies.',
'Luxembourg''s adult-use framework is expected to evolve over 2026-2028, potentially incorporating commercial sales once political and legal frameworks are resolved. Medical access continues in parallel. Luxembourg''s experience as the first EU member-state adult-use legalisation will be closely observed across Europe.',
'Direction de la Santé (Luxembourg) — sante.public.lu; Luxembourg Ministry of Health — gouvernement.lu',
'Ministry of Health communications; Loi du 8 avril 2023 text; EMCDDA Luxembourg country report',
'Based on legal text, Ministry of Health guidance, and EMCDDA data.',
'Quarterly','Adult-use home cultivation legalisation; absence of commercial retail; medical prescription access; EU first-mover significance; cross-border policy implications.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LU' AND jurisdiction_type='country');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621232826','seed_briefings_europe_b','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621232826_seed_briefings_europe_b.sql

-- RECOVERY BEGIN 20260621233009_seed_briefings_europe_c.sql

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'malta','country','MT','Adult-Use — Personal Cultivation Legal (Since 2021); First EU Adult-Use State',
'Malta became the first EU member state to legalise personal cannabis use in 2021 under the Cannabis Reform Act (Att dwar ir-Riforma tal-Cannabis). Adults 18+ may possess up to 7 grams in public, grow up to 4 plants at home, and participate in licensed cannabis associations (non-commercial clubs of up to 500 members) that can collectively grow cannabis for members. Medical cannabis has been available since 2018 under the Medical Cannabis Programme administered by the Medicines Authority, with approved products dispensed through licensed pharmacies. Malta''s small population of approximately 530,000 limits market scale, but the framework is significant as a pioneering EU model. The cannabis association (club) approach has influenced discussions in France, Belgium, and other EU states.',
'Adults 18+ in Malta may legally possess up to 7 grams, cultivate up to 4 plants, and join licensed cannabis associations. Medical cannabis patients access treatment through physician prescription under the Medical Cannabis Programme, covering epilepsy, multiple sclerosis, chronic pain, and cancer-related conditions. Products are dispensed through licensed pharmacies.',
'Maltese physicians may prescribe medical cannabis under the Medical Cannabis Programme for approved indications. The Medicines Authority oversees prescribing. No specialist restriction is specified for the medical programme.',
'Malta''s cannabis market is shaped by the association model. Licensed cannabis associations operate providing a non-commercial supply chain for adult members. No commercial retail cannabis sales occur. The medical market is served by imported pharmaceutical products. CBD and hemp markets follow EU frameworks.',
'Malta''s framework is stable and established. Commercial adult-use sales remain legally prohibited and no near-term launch is planned. The association model is under ongoing evaluation. EU harmonisation discussions will be influenced by Malta''s experience. Medical programme expansion with broader indication coverage is possible in 2026-2028.',
'Medicines Authority (Malta) — medicinesauthority.gov.mt; Authority for the Responsible Use of Cannabis (ARUC) — aruc.gov.mt',
'Medicines Authority guidance; Cannabis Reform Act 2021; EMCDDA Malta country report; ARUC public communications',
'Based on legislative text, Medicines Authority guidance, and EMCDDA data.',
'Quarterly','Adult-use home cultivation and association model; medical prescription programme; no commercial retail; EU first-mover significance; Medicines Authority oversight.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MT' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'moldova','country','MD','Prohibited — No Medical Programme',
'Moldova maintains cannabis as a prohibited substance under its drug control law, with criminal penalties for possession and use. No medical cannabis programme has been established. Moldova is a candidate country for EU accession and will face pressure to align drug policies with EU standards over time, though this is a long-term prospect. Hemp cultivation for industrial fibre is permitted in Moldova under regulations aligned with EU standards for low-THC varieties. CBD products exist in limited quantities in a legally ambiguous environment.',
'No legal patient access pathway exists in Moldova. Patients must seek access through informal channels or travel to neighbouring Romania or other EU states with medical programmes.',
'No cannabis prescribing right exists for Moldovan physicians. Medical practitioners cannot legally recommend cannabis medicines.',
'No commercial cannabis market. Hemp industrial cultivation exists at a small scale. No cannabis investment activity of note in Moldova.',
'EU accession trajectory over the long term is the primary reform driver. No near-term change anticipated. Romania''s developing medical programme may eventually be emulated.',
'Ministry of Health (Moldova) — msmps.gov.md',
'EMCDDA Moldova reporting; national drug control legislation',
'Based on EMCDDA country data and legislative review.',
'Annual','Prohibition framework; absence of medical programme; hemp cultivation; EU accession trajectory.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MD' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'monaco','country','MC','Medical — French Framework Alignment',
'Monaco is a microstate of approximately 39,000 residents with close economic and administrative ties to France. Cannabis regulation in Monaco broadly aligns with French law and practice. Cannabis remains generally prohibited for non-medical use. Medical cannabis accessible under French ANSM frameworks may be accessible for Monaco residents through French medical channels. No independent Monégasque cannabis regulatory body or programme exists. Patient access is negligible given the population size.',
'Monaco residents with medical needs may access cannabis through French medical channels. No Monaco-specific patient programme exists.',
'Physicians in Monaco follow French prescribing frameworks for controlled substances. No independent cannabis prescribing framework.',
'No commercial cannabis market of significance in Monaco. Proximity to France and Italy means any regulatory development follows these neighbours.',
'Monaco will follow French regulatory developments on medical cannabis as the permanent framework emerges from the pilot evaluation. No independent reform expected.',
'Monaco Ministry of State (Health) — gouv.mc',
'French ANSM frameworks (applicable by alignment); limited Monaco-specific guidance',
'Very limited data; relies on French regulatory alignment.',
'Annual','French regulatory alignment; microstate context; negligible independent programme.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MC' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'montenegro','country','ME','Medical — Limited; EU Accession Candidate',
'Montenegro has limited medical cannabis provisions under its narcotics legislation. Cannabis-based medicinal products including Sativex are accessible on a named-patient basis through the Agency for Medicines and Medical Devices of Montenegro (CALIMS). No broad medical programme exists. Montenegro is a candidate country for EU accession and has been developing drug policy in alignment with EU standards. Cannabis for non-medical use is prohibited with significant personal possession penalties. Montenegro has been monitoring regional Balkan developments in Serbia and North Macedonia regarding medical cannabis frameworks and export industry development.',
'Named-patient access through CALIMS is the only legal pathway. Patient numbers are negligible. Out-of-pocket costs apply. Some patients access cannabis through neighbouring markets.',
'Montenegrin physicians may apply for named-patient authorisation through CALIMS. No general prescribing right exists. Medical familiarity with cannabis medicines is limited.',
'No commercial cannabis market. Hemp cultivation is present at small scale. No cannabis investment activity of significance. EU accession process may catalyse reform.',
'EU accession and alignment with regional Balkan states that have more developed frameworks (North Macedonia, Serbia) are the primary reform drivers. A medical programme legislation similar to neighbouring countries is plausible in the 2026-2028 window.',
'Agency for Medicines and Medical Devices (CALIMS) — calims.gov.me; Ministry of Health — gov.me',
'CALIMS guidance; EMCDDA Montenegro reporting',
'Based on CALIMS guidance and EMCDDA data.',
'Annual','Named-patient access; absence of broad medical programme; EU accession context; regional comparison.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ME' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'north-macedonia','country','MK','Medical Legal — Established Programme and Export Industry',
'North Macedonia legalised medical cannabis in 2016 under amendments to the Law on Control of Narcotic Drugs and Psychotropic Substances. The Agency for Medicines and Medical Devices (MALMED) oversees licensing of cannabis cultivation, processing, and product manufacturing. Any licensed physician may prescribe medical cannabis for medically appropriate conditions. North Macedonia has become one of the notable medical cannabis cultivation and export hubs in the Western Balkans, supplying EU markets including Germany, Switzerland, and the UK. The country has EU accession candidate status, and its cannabis regulatory framework has been developed with EU-GMP standards in mind to facilitate export. Personal cannabis use remains prohibited.',
'North Macedonian patients access medical cannabis through licensed physician prescription. Neurologists, oncologists, and pain specialists are primary prescribers. The Republican Health Insurance Fund does not currently cover cannabis medicines; out-of-pocket costs apply. Patient access is improving as the programme matures.',
'Any North Macedonian physician with a valid licence from the Medical Chamber may prescribe medical cannabis. No specialist restriction applies. MALMED prescribing guidance is available. Physician education on cannabis medicine is growing.',
'North Macedonia has developed a growing medical cannabis production sector. Multiple EU-GMP standard facilities cultivate and process cannabis primarily for export. Key export markets include Germany, Switzerland, and the UK. The domestic patient market is expanding. North Macedonia is positioned as a cost-effective, quality-compliant supplier within the European supply network.',
'North Macedonia will continue expanding its production and export capacity as EU market demand grows. Domestic patient access is expected to improve. EU accession will drive further regulatory harmonisation. The country is well-positioned as a cost-efficient EU-standard producer.',
'Agency for Medicines and Medical Devices (MALMED) — malmed.gov.mk; Ministry of Health — zdravstvo.gov.mk',
'MALMED regulatory guidance; EMCDDA North Macedonia reporting; company export disclosures',
'Based on MALMED guidance and EMCDDA data. Export volumes from company public disclosures.',
'Quarterly','Medical legal framework; general physician prescribing; export production industry; EU-GMP compliance; domestic patient access.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MK' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'norway','country','NO','Medical — Prescription Programme; CBD Legal',
'Norway permits medical cannabis under the Medicines Act, administered by the Norwegian Medicines Agency (NoMA, Legemiddelverket). Cannabis-based medicines including Sativex are registered, and named-patient access to other preparations is available through NoMA''s pre-approval system. Norway is not an EU member but participates in the EEA and aligns closely with EU pharmaceutical standards. Personal cannabis use is prohibited. Norway conducted a significant drug policy reform debate — a government-commissioned committee recommended decriminalisation in 2019, and Parliament debated but narrowly rejected this. CBD products are regulated under food law frameworks similar to EU Novel Food guidelines.',
'Norwegian patients may access Sativex through neurologist or MS specialist prescription with potential Helfo reimbursement under specific criteria. Other cannabis medicines require individual NoMA pre-approval. Patient numbers are modest. Out-of-pocket costs are a barrier for non-reimbursed products.',
'Norwegian neurologists, oncologists, and pain specialists may prescribe Sativex and apply for NoMA pre-approval for other cannabis preparations. GPs can continue prescriptions initiated by specialists. The prescribing environment is moderately accessible for licensed products.',
'Norway''s medical cannabis market is small but served by EU imports. Sativex is the primary product. CBD products are a growing retail category under food law. No domestic cannabis production for medical purposes. Norwegian patients with means sometimes seek consultation in the Netherlands or Germany.',
'Norway is likely to progressively expand medical cannabis access, consistent with its evidence-based healthcare approach. Full adult-use legalisation is not expected in the near term. EEA membership ensures alignment with evolving EU pharmaceutical cannabis standards.',
'Norwegian Medicines Agency (Legemiddelverket) — legemiddelverket.no; Helfo — helfo.no',
'NoMA regulatory guidance; Helfo reimbursement criteria; EMCDDA Norway country report',
'Based on NoMA guidance and EMCDDA data.',
'Quarterly','Medical prescription access; Sativex reimbursement; NoMA named-patient pathway; decriminalisation debate; CBD food law status.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NO' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'poland','country','PL','Medical — General Prescription Programme (Since 2017)',
'Poland legalised medical cannabis in November 2017 under the Act on Counteracting Drug Addiction, permitting any licensed physician to prescribe cannabis-based medicines for medically appropriate conditions without restriction to specific indications or specialists. This created one of the most permissive prescribing frameworks in the EU on paper, though patient access has been constrained by high costs, lack of insurance reimbursement, limited physician familiarity, and a supply chain dependent on imports from Canada, the Netherlands, Germany, and other licensed exporters. The Polish medical cannabis market has grown steadily since 2017, becoming one of the faster-growing import markets in Europe. Personal cannabis use remains illegal, though CBD products are permitted under food law.',
'Polish patients access medical cannabis through any physician prescription without condition restriction. Prescriptions must be filled at licensed pharmacies. The National Health Fund (NFZ) does not reimburse cannabis medicines, making out-of-pocket costs a significant barrier (typically PLN 500-2000 per month). Online medical services and cannabis clinics have emerged to serve demand.',
'Any Polish physician with a valid licence from the Supreme Medical Council may prescribe medical cannabis without specialist restriction. Despite broad access rights, physician education on cannabis is variable. A growing number of private cannabis clinics and online consultation platforms serve patients.',
'Poland''s medical cannabis market is one of the fastest-growing in Europe from a low base. Imports from Canada and EU producers are the primary supply. Annual import volumes have grown significantly each year since 2017. Private cannabis clinics operate in Warsaw, Kraków, Gdańsk, and other cities. Several Polish companies have obtained cultivation licences but domestic production remains marginal.',
'Poland is expected to continue growing as a significant EU cannabis import market. Domestic production may expand if the licensing framework becomes more accessible. NFZ reimbursement for specific conditions is a policy priority for patient advocacy groups. Adult-use reform is not politically supported by the current government but decriminalisation discussions are active.',
'Main Pharmaceutical Inspectorate (GIF) — gif.gov.pl; Supreme Medical Council — nil.org.pl; National Health Fund (NFZ) — nfz.gov.pl',
'GIF regulatory guidance; NFZ communications; EMCDDA Poland country report; licensed importer disclosures',
'Based on GIF guidance, EMCDDA data, and published importer market data.',
'Quarterly','Medical prescribing access; absence of NFZ reimbursement; import market size; domestic cultivation status; physician education landscape.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PL' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'portugal','country','PT','Medical Legal (Since 2018); Personal Use Decriminalised (Since 2001)',
'Portugal is internationally recognised for its landmark 2001 decriminalisation of all drugs for personal use (possession of up to a 10-day personal supply), widely cited as a harm-reduction success. Medical cannabis was legalised separately in June 2018 under Law 33/2018, permitting the cultivation, production, distribution, and export of medicinal cannabis. INFARMED (Autoridade Nacional do Medicamento e dos Produtos de Saúde) oversees the medical cannabis framework. Portugal has attracted significant investment in cannabis cultivation and production, leveraging its agricultural climate, EU membership, and export-friendly framework. Multiple EU-GMP cannabis facilities have been established, primarily targeting export markets. Portugal''s combination of the longest-standing personal use decriminalisation in Europe with a developed medical programme makes it one of the most complete policy frameworks globally.',
'Portuguese patients access medical cannabis through specialist physician prescription for approved indications including chronic pain, MS spasticity, epilepsy, and oncology indications. INFARMED oversees product authorisation. The National Health Service (SNS) provides limited reimbursement. Private sector access is more readily available. Patient numbers are in the low tens of thousands and growing.',
'Portuguese physicians — primarily neurologists, oncologists, and pain specialists — may prescribe medical cannabis for approved conditions. INFARMED has issued prescribing protocols. The prescribing framework has been progressively expanded since 2018. GPs may continue prescriptions initiated by specialists.',
'Portugal is a significant EU cannabis production country. Multiple large-scale EU-GMP cultivation and processing operations have been established, particularly in the Alentejo region, taking advantage of excellent growing climate and lower production costs. Export markets include Germany, the UK, and other EU states. Major international producers including Tilray operate facilities in Portugal.',
'Portugal is expected to continue expanding as a cannabis production and export hub within the EU. Medical programme access will likely broaden. The country''s unique 2001 decriminalisation legacy positions it well for any EU-level harmonisation on drug policy. Portugal''s production capacity will increasingly serve the growing German market.',
'INFARMED — infarmed.pt; Direcção-Geral da Saúde (DGS) — dgs.pt; Institute of Drugs and Drug Addiction (SICAD) — sicad.pt',
'INFARMED regulatory guidance; Law 33/2018; EMCDDA Portugal country report; EU-GMP producer disclosures',
'Based on INFARMED guidance, law text, EMCDDA data, and company production disclosures.',
'Quarterly','Medical legal framework; specialist prescribing; SNS reimbursement; export production industry; 2001 decriminalisation context.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PT' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'romania','country','RO','Medical — Limited (Sativex); CBD Legal',
'Romania permits cannabis-based medicines in a limited framework. Sativex is registered in Romania and available through specialist prescription for MS spasticity. Named-patient access to other cannabis preparations is possible through the National Agency for Medicines and Medical Devices (ANMDM). Romania does not have a broad-access medical cannabis programme. Personal cannabis use is prohibited with criminal sanctions. Romania is an EU member state and will be influenced by EU-level regulatory harmonisation trends. Hemp cultivation is legal for industrial purposes. No near-term domestic reform is politically indicated.',
'Named-patient and Sativex specialist prescription are the only access pathways. Neurologists treating MS patients are the primary prescribers of Sativex. ANMDM authorisation is required for other preparations. Reimbursement is not provided by CNAS (National Health Insurance). Patient numbers are very small.',
'Romanian neurologists may prescribe Sativex. Named-patient import authorisation for other preparations must be sought from ANMDM. No general prescribing right exists. Physician awareness of cannabis medicine options is limited.',
'No commercial medical cannabis market exists in Romania. Hemp is cultivated for industrial purposes. CBD products are available through retail channels. Romanian agricultural conditions are suitable for hemp but no medical cannabis production industry has developed.',
'Romania will follow EU regulatory trends on medical cannabis harmonisation. A formal medical programme expansion is more likely to come from EU-level direction than domestic political initiative. Conservative drug policy consensus is stable.',
'National Agency for Medicines and Medical Devices (ANMDM) — anm.ro; National Health Insurance House (CNAS) — cnas.ro',
'ANMDM guidance; EMCDDA Romania country report',
'Based on ANMDM public guidance and EMCDDA data.',
'Annual','Named-patient access; Sativex availability; absence of broad medical programme; hemp cultivation; CBD legal status.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='RO' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'serbia','country','RS','Medical — General Prescription Programme (Since 2019); Export Industry',
'Serbia legalised medical cannabis in 2019 under amendments to the Law on Psychoactive Controlled Substances, administered by the Medicines and Medical Devices Agency of Serbia (ALIMS). Any licensed physician may prescribe medical cannabis for medically appropriate conditions. Serbia is not an EU member but is an EU accession candidate, and its cannabis regulatory framework has been developed with EU-GMP standards in mind to facilitate export to EU markets. The export industry is a significant economic driver. Personal cannabis use remains prohibited. Hemp cultivation for industrial purposes is permitted under standard frameworks.',
'Serbian patients access medical cannabis through licensed physician prescription. Neurologists, oncologists, and pain specialists are primary prescribers. The Republican Health Insurance Fund (RFZO) does not currently cover cannabis medicines; out-of-pocket costs apply. Patient access is improving as the programme matures.',
'Any Serbian physician with a valid licence from the Serbian Medical Chamber may prescribe medical cannabis without specialist restriction. ALIMS prescribing guidance is available. Physician education on cannabis medicine is growing, supported by professional association programmes.',
'Serbia has developed a growing medical cannabis production sector. Multiple EU-GMP standard facilities cultivate and process cannabis primarily for export to Germany, Switzerland, and the UK. The domestic patient market is expanding. Serbia is positioned as a cost-effective, quality-compliant producer within the European supply network.',
'Serbia will continue expanding its production and export capacity as EU market demand grows. Domestic patient access is expected to improve. EU accession will drive further regulatory harmonisation. RFZO reimbursement is a medium-term policy discussion.',
'Medicines and Medical Devices Agency of Serbia (ALIMS) — alims.gov.rs; Serbian Medical Chamber — lekarskomorba.rs; Ministry of Health — zdravlje.gov.rs',
'ALIMS regulatory guidance; EMCDDA Serbia reporting; company export disclosures',
'Based on ALIMS guidance and EMCDDA data. Export volumes from company public disclosures.',
'Quarterly','Medical legal framework; general physician prescribing; export production industry; EU-GMP compliance; domestic patient access.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='RS' AND jurisdiction_type='country');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621233009','seed_briefings_europe_c','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621233009_seed_briefings_europe_c.sql

-- RECOVERY BEGIN 20260621233144_seed_briefings_europe_d.sql

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'slovakia','country','SK','Medical — Named Patient Only; CBD Legal',
'Slovakia has a very limited medical cannabis framework. Cannabis-based medicinal products including Sativex may be accessed on a named-patient basis through the State Institute for Drug Control (ŠÚKL). No broad medical cannabis programme exists. Personal cannabis use is prohibited with criminal sanctions. Slovakia is an EU member state and among the more conservative in drug policy. Hemp cultivation is legal under EU rules. Czechia''s developments, given geographic and cultural proximity, are closely observed by Slovak policymakers and patients.',
'Named-patient ŠÚKL authorisation and Sativex specialist prescription are the only access pathways. Patient numbers are negligible. Full out-of-pocket costs apply. Some Slovak patients access cannabis in neighbouring Czechia or Austria.',
'Slovak physicians may apply to ŠÚKL for named-patient cannabis medicine authorisation. No general prescribing right exists. Medical cannabis awareness is low among Slovak practitioners.',
'No commercial medical cannabis market. Hemp cultivation present. CBD retail operates in an ambiguous legal environment. No significant Slovak cannabis production industry.',
'Slovakia may follow EU harmonisation trends toward a more structured medical programme over time. No near-term unilateral reform anticipated. Czechia''s adult-use reform developments are observed with interest.',
'State Institute for Drug Control (ŠÚKL) — sukl.sk; Ministry of Health — health.gov.sk',
'ŠÚKL guidance; EMCDDA Slovakia country report',
'Based on ŠÚKL public guidance and EMCDDA data.',
'Annual','Named-patient access; absence of broad medical programme; Czechia comparison; hemp and CBD status.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SK' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'slovenia','country','SI','Medical — Prescription Programme; CBD Legal',
'Slovenia permits medical cannabis prescription under the Medicines Act, with oversight by the Agency for Medicinal Products and Medical Devices (JAZMP). Cannabis-based medicines including Sativex are registered. Named-patient access to other preparations is possible. Slovenia has a somewhat more developed medical access framework than some Central European peers, with specialist prescribing rights and an established pharmacy dispensing system. Personal cannabis use is prohibited but Slovenia has had progressive drug policy reform discussions. CBD products are regulated under food law. Hemp cultivation is legal under EU rules.',
'Slovenian patients may access registered cannabis medicines including Sativex through specialist prescription. Named-patient access to other preparations requires JAZMP authorisation. The Health Insurance Institute of Slovenia (ZZZS) has limited reimbursement provisions for specific cannabis medicines. Patient numbers are in the hundreds.',
'Slovenian neurologists and relevant specialists may prescribe registered cannabis medicines. Named-patient authorisation from JAZMP is required for non-registered products. No general GP prescribing right for cannabis. Physician awareness of cannabis medicine options is growing.',
'Slovenia''s medical cannabis market is small. No significant domestic production for medical cannabis. EU-GMP imports from established producers supply the market. CBD retail is established under food law frameworks.',
'Slovenia may expand its medical programme access in alignment with EU trends. A broader prescribing right and expanded indication list are plausible outcomes of EU harmonisation. Adult-use reform is not a near-term political priority.',
'Agency for Medicinal Products and Medical Devices (JAZMP) — jazmp.si; Health Insurance Institute (ZZZS) — zzzs.si',
'JAZMP regulatory guidance; EMCDDA Slovenia country report',
'Based on JAZMP guidance and EMCDDA data.',
'Annual','Medical prescribing framework; JAZMP oversight; ZZZS reimbursement; named-patient pathway; hemp and CBD status.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SI' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'sweden','country','SE','Medical — Very Limited (Sativex Only); CBD Legal; Reform Debated',
'Sweden maintains one of the most restrictive cannabis environments in Western Europe. The Narcotics Act (Narkotikastrafflagen) prohibits cannabis use, possession, and supply with significant criminal penalties. Sweden is notable for treating cannabis use itself as a criminal offence, unlike most EU peers who have moved toward administrative penalties for personal possession. Sativex is registered by the Medical Products Agency (Läkemedelsverket) and available through specialist prescription for MS-related spasticity, with Försäkringskassan reimbursement under the TLV formulary for qualifying MS patients. Swedish drug policy reform debate is active, with discussions on decriminalisation, but no reform has been enacted. Sweden has a strong emphasis on complete abstinence in its drug policy tradition.',
'Swedish MS patients may access Sativex through neurologist prescription with Försäkringskassan reimbursement under the TLV high-cost protection scheme. Other cannabis medicines are essentially inaccessible without exceptional individual circumstances. Patient numbers for cannabis medicines are very small.',
'Swedish neurologists specialising in MS may prescribe Sativex. Named-patient requests for other cannabis preparations face significant administrative barriers. The Medical Products Agency oversees controlled substance frameworks. Swedish physician culture has been resistant to cannabis prescribing beyond the narrow Sativex indication.',
'Sweden has no commercial medical cannabis market beyond the Sativex prescription segment. CBD products derived from hemp are regulated under food law. No domestic cannabis production for medical purposes. Sweden''s conservative policy has limited market development relative to its population and economic scale.',
'Sweden is likely to remain conservative on cannabis reform in the near term. EU harmonisation and the influence of neighbouring Denmark''s more accessible approach may eventually drive modest expansion. Sativex access for MS will continue as the primary cannabis medicine access point. A decriminalisation debate continues without near-term legislation.',
'Medical Products Agency (Läkemedelsverket) — lakemedelsverket.se; TLV — tlv.se; Försäkringskassan — forsakringskassan.se',
'Läkemedelsverket guidance; TLV formulary data; EMCDDA Sweden country report',
'Based on Läkemedelsverket guidance, TLV data, and EMCDDA reporting.',
'Annual','Sativex MS access and reimbursement; restrictive legal framework; CBD food law status; reform debate; no commercial medical market.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'switzerland','country','CH','Medical Legal; Adult-Use Pilot Programmes (From 2025)',
'Switzerland has one of the most innovative cannabis policy environments in Europe, reflecting its tradition of evidence-based public health policy. Medical cannabis has been available through Swissmedic-authorised channels since 2011, with Sativex registered and a broader framework for medical cannabis products established from 2022. Switzerland launched canton-level adult-use cannabis pilot programmes from 2025 under the Federal Law on Research Pilots, with cities including Basel, Bern, Geneva, and Zurich operating or preparing controlled adult-use trials with registered adults using a structured research methodology. Switzerland is not an EU member, but its approach is closely observed by EU states. CBD products with less than 1% THC (higher than the EU 0.2% limit) are legal in Switzerland under hemp product rules, making Switzerland one of Europe''s most mature CBD retail markets.',
'Swiss patients may access Sativex and authorised medical cannabis preparations through physician prescription. Health insurance (Krankenversicherung) provides limited reimbursement for some cannabis medicines under specific conditions. Pilot programme participants receive cannabis products through regulated research channels for adult recreational use.',
'Swiss physicians can prescribe Sativex and authorised medical cannabis preparations under Swissmedic oversight. Pilot programme participants receive cannabis through regulated research channels rather than standard prescription. Swissmedic has issued prescribing guidance for medical applications.',
'Switzerland has a well-developed cannabis market across multiple segments. The CBD/hemp retail market is one of Europe''s most mature, with CBD products sold in pharmacies, supermarkets, and specialty stores. Medical cannabis imports are established. Adult-use pilot programmes are generating significant research data. Several Swiss companies are active in cannabis research and production.',
'Switzerland''s pilot programmes are expected to generate data supporting a permanent adult-use framework within a few years. Swissmedic will likely expand the medical cannabis product list. The 1% THC threshold for hemp gives Switzerland a more flexible CBD framework than most EU states. Swiss pilot programme outcomes will inform EU policy discussions.',
'Swissmedic — swissmedic.ch; Federal Office of Public Health (FOPH/BAG) — bag.admin.ch',
'Swissmedic regulatory guidance; FOPH pilot programme data; Federal Law on Research Pilots; EMCDDA Switzerland country report',
'Based on Swissmedic guidance, FOPH publications, and EMCDDA data. Pilot programme data from published research protocols.',
'Quarterly','Medical legal framework; adult-use pilot programmes; Swissmedic oversight; CBD 1% threshold; health insurance reimbursement; pilot data outcomes.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CH' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'turkey','country','TR','Prohibited — Hemp Expansion Underway; No Medical Programme',
'Türkiye (Turkey) maintains a broadly prohibitory cannabis framework. Cannabis is a Schedule I drug under Turkish narcotics law, with significant criminal penalties for possession, use, and supply. No general medical cannabis programme exists. However, Türkiye has a long history of hemp (kendir) cultivation, and the government has been progressively expanding licensed hemp cultivation zones since 2018. Industrial hemp cultivation is expanding significantly, driven by government agricultural promotion and export opportunities. Türkiye has identified hemp as a strategic agricultural crop. CBD products derived from very low-THC hemp are increasingly available in a regulated framework controlled by the Tobacco and Alcohol Market Regulatory Authority (TAPDK) and relevant health ministries.',
'No medical cannabis patient access programme exists in Türkiye. Pharmaceutical cannabis preparations are not available through standard healthcare channels. Individual named-patient imports may be possible in exceptional circumstances through the Turkish Medicines and Medical Devices Agency (TMMDA), but this is extremely rare in practice.',
'No cannabis prescribing right exists for Turkish physicians. The healthcare system does not accommodate medical cannabis prescribing under current law.',
'Türkiye''s cannabis-adjacent market is characterised by hemp cultivation expansion. The country has significant agricultural capacity and is developing industrial hemp as an export crop. Several provinces have been designated for hemp cultivation. The domestic market for CBD products is limited by strict THC controls. International cannabis companies cannot operate in Türkiye for medical cannabis production under current law.',
'Türkiye''s trajectory is toward expanding industrial hemp and CBD frameworks rather than medical cannabis. No medical cannabis reform is currently on the official policy agenda. The government''s focus on hemp as an agricultural opportunity distinguishes Türkiye from a near-term medical reform trajectory.',
'Turkish Medicines and Medical Devices Agency (TMMDA) — titck.gov.tr; Ministry of Agriculture and Forestry — tarimorman.gov.tr',
'TMMDA guidance; Turkish agricultural ministry hemp cultivation statistics; EMCDDA Turkey country report',
'Based on TMMDA guidance, EMCDDA data, and Turkish agricultural ministry publications.',
'Annual','Hemp cultivation expansion; absence of medical cannabis programme; CBD framework status; criminal prohibition framework.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'ukraine','country','UA','Medical — Reform Advanced (2023); Wartime Implementation',
'Ukraine legalised cannabis for medical purposes in 2023 under legislation passed by the Verkhovna Rada, with emphasis on addressing the healthcare needs of wounded military veterans with chronic pain, PTSD, and trauma-related conditions. Prior to the 2022 full-scale Russian invasion, Ukraine had active parliamentary discussions on cannabis legalisation for medical purposes. The veteran-focused policy rationale garnered broad political support across the spectrum. Implementation of the medical cannabis programme has proceeded under wartime conditions, with supply chains dependent on imports given disruption of domestic agricultural capacity.',
'Ukrainian patients — initially focused on wounded military veterans — are being integrated into the medical cannabis programme. The framework covers chronic pain, PTSD, and trauma-related disorders particularly relevant to the military context, as well as civilian conditions including epilepsy and oncology. Prescriptions are administered through healthcare providers under Ministry of Health guidelines.',
'Ukrainian physicians may prescribe medical cannabis under implementing regulations. Ministry of Health guidelines govern prescribing protocols. Given wartime conditions, implementation has been pragmatic. Specialist involvement in initial prescriptions is expected.',
'The Ukrainian medical cannabis market is in its earliest operational stages. Supply chains are dependent on imports. The post-war reconstruction scenario includes development of domestic cannabis cultivation as an agricultural recovery crop. Ukraine''s substantial agricultural capacity positions it as a potential future cannabis producer.',
'Ukraine''s medical cannabis programme is expected to expand significantly as the country stabilises and post-war reconstruction advances. The veteran-driven policy rationale has broad political support. Ukraine''s EU accession candidacy will drive regulatory alignment with EU standards over time.',
'Ukrainian Ministry of Health — moz.gov.ua; Verkhovna Rada — rada.gov.ua',
'Verkhovna Rada legislative records; Ministry of Health implementing regulations; international press reporting on programme implementation',
'Based on legislative records and Ministry of Health publications. Implementation data is limited due to wartime conditions.',
'Quarterly','Medical legalisation framework; veteran-priority implementation; wartime operational context; EU accession alignment; post-war expansion outlook.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='UA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'albania','country','AL','Prohibited — No Medical Programme',
'Albania maintains strict cannabis prohibition under the Law on Narcotic and Psychotropic Substances. Cannabis use and possession carry criminal penalties. Albania does not have a medical cannabis programme. Albania is a EU candidate country and a NATO member. The country has historically been a significant source of illicitly produced cannabis supplying European markets — an issue that has drawn major law enforcement attention. Recent government efforts have focused on eradicating illicit cannabis cultivation, particularly in the Lazarat region which was historically a major production area.',
'No legal patient access exists. Patients seeking cannabis-based medicines must access through informal channels or travel to neighbouring countries with programmes (North Macedonia, Serbia, or Greece).',
'No cannabis prescribing right exists for Albanian physicians.',
'No legal cannabis market. Albania''s EU accession process may eventually drive alignment with EU medical cannabis frameworks.',
'EU accession process over the medium to long term is the primary potential driver of reform. No near-term domestic cannabis policy reform is expected. The government''s focus has been on eradicating illicit production rather than establishing licensed frameworks.',
'General Directorate of State Police — policia.gov.al; Ministry of Health — shendetesia.gov.al',
'EMCDDA Albania country report; government communications on illicit cultivation eradication',
'Based on EMCDDA data and legislative review.',
'Annual','Prohibition framework; illicit production history; no medical programme; EU accession context.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AL' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'andorra','country','AD','Prohibited — No Medical Programme',
'Andorra is a microstate between France and Spain with a strictly prohibitory approach to cannabis. Cannabis use and possession are criminal offences under Andorran law. Andorra has no medical cannabis programme and no industrial hemp framework of significance. Andorra''s proximity to Spain (where cannabis social clubs are tolerated) and France means residents may access cannabis informally through cross-border means, but no domestic legal framework exists. Andorra''s economic relationship with the EU (customs union but not EU member) means pharmaceutical standards align with French or Spanish norms in practice, but no formal cannabis regulatory alignment has been implemented.',
'No legal patient access exists in Andorra. Residents may access cannabis through informal cross-border channels.',
'No cannabis prescribing right exists.',
'No legal cannabis market. Andorra''s primary economic activities are retail tourism and banking.',
'No near-term cannabis reform is anticipated. Any EU-level harmonisation would eventually influence domestic discussions. Andorra''s relationship with France and Spain means developments in those countries shape the context.',
'Ministry of Social Affairs, Justice and Interior (Andorra) — govern.ad',
'Limited available data; EMCDDA peripheral reporting',
'Very limited data available for this microstate.',
'Annual','Prohibition framework; microstate context; no medical programme.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AD' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'belarus','country','BY','Prohibited — Strict Enforcement',
'Belarus maintains strict cannabis prohibition under the Law on Narcotic Drugs, Psychotropic Substances, and Analogues. Criminal penalties for cannabis possession, use, and supply are severe. Belarus is an authoritarian state with close ties to Russia and has shown no interest in cannabis law reform. No medical cannabis programme exists. Belarus is subject to Western sanctions related to human rights and political repression. Hemp cultivation has historically existed in Belarus for industrial fibre as part of state-controlled textile manufacturing.',
'No legal patient access exists. Cannabis medicines are entirely unavailable through healthcare channels.',
'No cannabis prescribing right exists for Belarusian physicians.',
'No legal cannabis market. Industrial hemp cultivation for state-controlled textile production is the only cannabis-adjacent industry.',
'No cannabis reform is anticipated under the current authoritarian government. Belarus is expected to maintain strict prohibition in alignment with Russian drug policy.',
'Ministry of Health (Belarus) — minzdrav.gov.by',
'Limited available data; EMCDDA peripheral reporting',
'Based on available legislative information and geopolitical context.',
'Annual','Strict prohibition; no medical programme; industrial hemp context; authoritarian government; sanctions environment.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BY' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'san-marino','country','SM','Medical — Italian Framework Alignment',
'San Marino is a microstate of approximately 34,000 residents completely surrounded by Italy. Cannabis regulation in San Marino broadly follows Italian frameworks. Medical cannabis accessible under Italian AIFA protocols is the primary reference for San Marino residents. No independent San Marinese cannabis regulatory agency exists. The Republic of San Marino''s health authority (Segreteria di Stato per la Sanità) defers to Italian pharmaceutical standards for controlled substances in practice.',
'San Marino residents typically access medical cannabis through Italian medical channels given the geographic and regulatory relationship. A small number of San Marinese patients may be served through the Italian prescription framework.',
'Physicians in San Marino follow Italian prescribing norms. No independent cannabis prescribing framework exists.',
'No commercial cannabis market of significance in San Marino. Italian retail dynamics apply by proximity.',
'San Marino will follow Italian regulatory developments, including any expansion of domestic cultivation rights.',
'Segreteria di Stato per la Sanità (San Marino) — segreteria.sanita.sm',
'Italian AIFA frameworks; limited San Marinese specific guidance',
'Very limited independent data; analysis relies on Italian regulatory alignment.',
'Annual','Italian regulatory alignment; microstate context.',
DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SM' AND jurisdiction_type='country');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621233144','seed_briefings_europe_d','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621233144_seed_briefings_europe_d.sql

-- RECOVERY BEGIN 20260621233459_seed_briefings_americas_a.sql

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'argentina','country','AR','Medical Legal; Adult-Use Home Cultivation Permitted',
'Argentina legalized medical cannabis in 2017 under the CANNABIS Act (Law 27.350), and Law 27.669 (2022) created a comprehensive National Regulatory Program for medicinal cannabis, industrial hemp, and scientific research. Home cultivation for personal and medical use is permitted. A regulated adult-use commercial market is under legislative development.',
'Patients access cannabis through pharmacies and licensed dispensaries under physician authorization. The national registry (REPROCANN) allows registered patients to cultivate at home. Imported and domestically produced medical products are both available through licensed channels.',
'Physicians may authorize cannabis treatment across a broad range of conditions including pain, epilepsy, anxiety, and palliative care. Prescribers must register with REPROCANN and follow national clinical guidelines. Specialist referral is not required for most conditions.',
'Argentina has a growing domestic cultivation sector supported by government investment. CONICET (national research council) licenses for research and production have expanded significantly. Exports of medicinal cannabis products began in 2021, establishing Argentina as a Southern Cone producer.',
'The regulatory framework continues to mature with adult-use legislation under discussion in Congress. Domestic producers are positioning for export markets in Europe and North America. Policy momentum strongly favors further liberalization over the 2025–2027 period.',
'ANMAT (Administración Nacional de Medicamentos, Alimentos y Tecnología Médica) regulates medical cannabis products. SENASA oversees hemp cultivation. The Secretaría de Políticas Integrales sobre Drogas (SEDRONAR) coordinates national policy.',
'ANMAT regulatory circulars; Law 27.350; Law 27.669; REPROCANN registry data','Current as of Q2 2026; verified against ANMAT official guidance','Quarterly','Full country-level briefing covering medical program, home cultivation rights, and emerging adult-use framework',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'barbados','country','BB','Medical Legal; Decriminalized',
'Barbados legalized medical cannabis in 2019 through the Cannabis Control Authority Act. The Cannabis Control Authority (CCA) licenses cultivation, processing, retail, and research activities. Possession of small amounts has been decriminalized for personal use, and the country has positioned itself to develop a licensed cannabis tourism and export sector.',
'Registered patients obtain medical cannabis from licensed dispensaries with a physician recommendation. The CCA maintains a patient registry. Products include oils, capsules, and dried flower where licensed retail is operational.',
'Physicians registered with the Medical Council of Barbados may recommend cannabis for qualifying conditions including chronic pain, cancer, epilepsy, and PTSD. No specialist requirement; general practitioners may recommend.',
'Barbados has actively courted cannabis tourism as an economic development pillar alongside its hospitality sector. Licensed dispensaries operate in Bridgetown and resort areas. Domestic cultivation licenses have been issued to local and joint-venture operators.',
'The CCA is developing export licensing frameworks to allow Barbados to compete with regional peers for European medical cannabis market access. Further adult-use liberalization is politically possible given regional trends in Jamaica and Trinidad.',
'Cannabis Control Authority (CCA) under the Ministry of Economic Affairs and Investment.',
'CCA official gazette notices; Cannabis Control Authority Act 2019; regional regulatory monitoring','Current as of Q2 2026','Quarterly','Country-level briefing covering medical program, decriminalization, and tourism/export development',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BB' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'belize','country','BZ','Decriminalized; No Formal Medical Program',
'Belize decriminalized possession of up to 10 grams of cannabis for personal use in 2017. There is no formally regulated medical cannabis program. Cannabis cultivation and sale outside of personal-use quantities remains illegal. Hemp has not been separately legalized.',
'No formal patient access pathway exists. Patients seeking cannabis-based medicines must import licensed pharmaceutical products, which is a complex process. No domestic dispensaries or licensed medical supply chains operate.',
'Physicians cannot formally prescribe cannabis as no medical program exists. Anecdotal therapeutic use occurs outside the regulatory framework. Medical tourism to neighboring countries with programs is not structured.',
'The domestic cannabis market is informal. No licensed commercial operators exist. Economic interest in cannabis agriculture has been expressed by farming communities given agricultural conditions, but no licensing framework has emerged.',
'Regional trends including Mexico and Costa Rica establishing medical programs may influence Belizean policy. There is civil society advocacy for medical access. No imminent legislative action anticipated.',
'Ministry of Health and Wellness. Drug enforcement falls under the Belize Police Department.',
'Belize Misuse of Drugs (Amendment) Act 2017; regional policy tracking','Current as of Q2 2026; limited official data available','Annual','Country-level briefing covering decriminalization status and absence of medical framework',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BZ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'bolivia','country','BO','Traditional Use Tolerated; No Formal Medical Program',
'Bolivia has a constitutionally protected tradition of coca leaf cultivation and use. Cannabis possession of small amounts is effectively decriminalized in practice, though technically illegal under Law 1008. Bolivia has not established a formal medical cannabis program. The country''s drug policy is shaped by its stance defending coca leaf sovereignty at international forums.',
'No formal patient access pathway exists for cannabis. Patients cannot obtain licensed medical cannabis products through official channels. Any therapeutic use occurs outside the legal framework.',
'Physicians cannot legally prescribe cannabis as no regulated program exists. Medical use of cannabis-derived pharmaceuticals (such as Epidiolex) may be possible through individual import authorization processes.',
'No licensed cannabis market exists. Bolivia''s drug policy focus remains on coca leaf and combating cocaine production. The informal cannabis market operates in major urban areas.',
'Bolivia''s leadership has historically focused drug policy attention on coca leaf rather than cannabis reform. Medical cannabis legislation has not advanced in Congress. Regional pressure from neighboring Argentina and Peru could prompt future action.',
'SENAD (Servicio Nacional para la Prevención y Control del Tráfico Ilícito de Drogas) handles drug enforcement. Ministry of Health oversees pharmaceutical policy.',
'Law 1008 (Ley del Régimen de la Coca y Sustancias Controladas); regional policy monitoring','Current as of Q2 2026','Annual','Country-level briefing covering traditional use context and absence of medical program',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BO' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'brazil','country','BR','Medical Legal (CBD and THC Products); No Adult-Use',
'Brazil has progressively expanded medical cannabis access since 2015, when ANVISA first permitted CBD-based products. In 2019, THC-containing cannabis products were authorized for medical use. In 2020 and 2021, ANVISA issued comprehensive resolutions establishing licensing for domestic cultivation and industrial production. Brazil is now one of Latin America''s largest medical cannabis markets by patient volume.',
'Patients access cannabis through physician prescription with ANVISA-registered products available at licensed pharmacies. Both imported products (primarily from Canada and Portugal) and domestically produced items are available. Patient registry requirements apply. Costs remain a barrier for lower-income patients, though government reimbursement discussions are ongoing.',
'Physicians registered with the Conselho Federal de Medicina may prescribe authorized cannabis products for conditions including epilepsy, chronic pain, Parkinson''s disease, anxiety, and others. Prescriptions must specify approved products. No specialist-only restriction applies though complexity of conditions may direct patients to specialists.',
'The Brazilian medical cannabis market is estimated at one of the fastest-growing in the Americas, with over 100,000 patients registered by 2025. Domestic production licenses have been issued to multiple companies. International players including Canadian LPs and Portuguese operators have established import partnerships. Market value projections exceed USD 1 billion by 2027.',
'ANVISA continues to refine cultivation and processing regulations. Adult-use legalization is debated in Congress but faces significant opposition from conservative and religious blocs. Medical market expansion with insurance reimbursement is the more likely near-term development. Export potential for domestically produced cannabis is under policy review.',
'ANVISA (Agência Nacional de Vigilância Sanitária) is the primary regulator for medical cannabis products, licensing, and standards. The Conselho Federal de Medicina sets prescriber guidelines.',
'ANVISA Resolution RDC No. 327/2019; Resolution RDC No. 660/2022; ANVISA licensed product list; Conselho Federal de Medicina guidelines','Current as of Q2 2026; verified against ANVISA official registry','Quarterly','Full country-level briefing covering medical program depth, domestic production, and market scale',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'chile','country','CL','Medical Legal; Home Cultivation Permitted; No Adult-Use Sale',
'Chile established one of Latin America''s most progressive medical cannabis frameworks, with Law 20.000 amended to permit medical and therapeutic cultivation and Law 21.020 enabling regulated medical access. Home cultivation for personal medical use is permitted. The Chilean Cannabis Institute (ICAL) and private operators supply regulated products. No adult-use commercial market exists, though possession of small amounts is decriminalized.',
'Patients access medical cannabis through licensed pharmacies with a physician prescription. Home cultivation of up to six plants is tolerated for personal medical use. The ISP (Instituto de Salud Pública) maintains a registry of authorized products. Affordability programs exist for low-income patients through public hospital channels.',
'Physicians may prescribe authorized cannabis products for a wide range of conditions. Both public and private sector physicians can prescribe. The Colegio Médico de Chile has issued guidance supporting evidence-based prescription.',
'Chile has a relatively mature medical cannabis supply chain with domestic cultivation, extraction, and pharmaceutical preparation licensed. Exports have begun to European markets, particularly Germany. The market is valued in the hundreds of millions of USD and growing. Several international companies operate in partnership with Chilean growers.',
'Chile''s regulatory framework is among the most developed in South America. Adult-use legalization has public support in polling but has not advanced legislatively. Export market development is a government economic priority. Regulatory refinements for quality standards and GMP compliance are ongoing.',
'ISP (Instituto de Salud Pública de Chile) regulates medical cannabis products. SAG (Servicio Agrícola y Ganadero) licenses cultivation. MINSAL (Ministerio de Salud) sets clinical guidelines.',
'ISP resolution database; Law 20.000 amendments; Law 21.020; SAG cultivation license registry','Current as of Q2 2026; verified against ISP official guidance','Quarterly','Full country-level briefing covering medical access, home cultivation, domestic production, and export activity',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CL' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'costa-rica','country','CR','Medical Legal; No Adult-Use',
'Costa Rica passed Law 10113 in 2022, legalizing medical and therapeutic cannabis and industrial hemp. The law created a licensing system for cultivation, processing, distribution, and research. Implementation regulations have been progressively issued. Costa Rica''s medical cannabis market is in early commercial development as of 2026.',
'Patients access medical cannabis through pharmacies with a valid medical prescription. Licensed importers and domestic producers supply authorized products. Patient costs are currently borne by individuals; social security (CCSS) reimbursement has not yet been implemented.',
'Physicians registered with the Colegio de Médicos y Cirujanos de Costa Rica may prescribe cannabis for qualifying conditions. No specialist-only requirement applies. Clinical guidelines are being developed by the Ministry of Health.',
'Domestic cultivation and processing licenses are being issued under the new framework. Several international cannabis companies have established Costa Rican operations or partnerships, attracted by the country''s agricultural infrastructure and trade relationships. The market is nascent but has strong growth potential.',
'The regulatory framework under Law 10113 continues to be implemented. Adult-use is not on the current legislative agenda. Export market access, particularly to Europe, is a potential economic driver. Clarity on GMP and export certification requirements is expected in 2026–2027.',
'MINISTERIO DE SALUD (Ministry of Health) and the Servicio Nacional de Salud Animal (SENASA) for hemp. MINAE may have involvement for environmental compliance in cultivation.',
'Law 10113 (2022); Ministry of Health implementing regulations; Costa Rica Cannabis Chamber (industry body) reports','Current as of Q2 2026','Quarterly','Country-level briefing covering medical program establishment and early market development',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'cuba','country','CU','Prohibited',
'Cannabis is prohibited in Cuba under the Ley de la Salud Pública and criminal drug laws. There is no medical cannabis program and no decriminalization framework. The Cuban government has not publicly engaged with cannabis reform at the legislative level.',
'No legal patient access pathway exists. Patients cannot obtain cannabis-based medicines through Cuban healthcare channels. Any therapeutic use of cannabis occurs outside the legal framework.',
'Cuban physicians cannot prescribe cannabis or cannabis-derived products as no regulatory pathway exists. The Cuban healthcare system does not include cannabis-based therapies in its formulary.',
'No licensed cannabis market exists. Cuba''s centrally planned economy and strict drug enforcement make commercial cannabis activity effectively impossible. No foreign investment in cannabis has occurred.',
'Cannabis reform is not a visible policy priority for the Cuban government. Given the political context, significant regulatory change in the near term is unlikely. Regional trends in Caribbean neighbours such as Jamaica and Barbados have not influenced Cuban policy visibly.',
'MINSAP (Ministerio de Salud Pública) and MININT (Ministerio del Interior) oversee health and drug enforcement policy respectively.',
'Cuban criminal code; MINSAP pharmaceutical policy; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and absence of reform pathway',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CU' AND jurisdiction_type='country');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621233459','seed_briefings_americas_a','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621233459_seed_briefings_americas_a.sql

-- RECOVERY BEGIN 20260621233543_seed_briefings_americas_b.sql

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'dominica','country','DM','Decriminalized; No Formal Medical Program',
'Dominica decriminalized possession of small amounts of cannabis in 2018 through amendments to the Drugs (Prevention of Misuse) Act. The law allows personal possession without criminal penalty up to defined limits. No formal medical cannabis program has been established, and commercial sale remains illegal.',
'No formal patient access pathway exists. Patients cannot obtain regulated cannabis-based medicines through Dominican healthcare. Any therapeutic use occurs informally outside the legal framework.',
'Physicians cannot prescribe cannabis as no medical regulatory framework exists. Clinical interest is limited by the absence of approved products and legal prescription pathways.',
'No licensed commercial cannabis market exists. Economic interest in cannabis agriculture and tourism has been expressed in civil society but no licensing framework has been created. The informal market operates.',
'Regional OECS trends and economic development pressures may prompt Dominica to develop medical or adult-use frameworks. No imminent legislative action has been announced.',
'Ministry of Health of Dominica; Dominica Police Force handles enforcement.',
'Drugs (Prevention of Misuse) Act (amended 2018); OECS regional policy monitoring','Current as of Q2 2026','Annual','Country-level briefing noting decriminalization and absence of formal medical program',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'dominican-republic','country','DO','Prohibited',
'Cannabis is prohibited in the Dominican Republic under Law 50-88 on Drugs and Controlled Substances. There is no medical cannabis program. Enforcement has historically been strict and penalties can be severe. The country has not engaged in formal drug policy reform regarding cannabis.',
'No legal patient access pathway exists. Pharmaceutical CBD products may be imported under exceptional circumstances but no formal program exists.',
'Physicians cannot prescribe cannabis. No approved cannabis-derived medical products are available through the Dominican public or private healthcare system.',
'No licensed market exists. The informal market operates but faces active law enforcement. No foreign cannabis investment has been established.',
'Drug policy reform is not a current government priority. Regional trends have not yet significantly influenced Dominican legislative debate. No medical cannabis legislation is anticipated in the near term.',
'DNCD (Dirección Nacional de Control de Drogas) enforces drug laws. Ministry of Public Health oversees pharmaceuticals.',
'Law 50-88; DNCD enforcement reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DO' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'ecuador','country','EC','Medical Legal; Decriminalized for Personal Use',
'Ecuador legalized medical and therapeutic cannabis in 2019 through a national assembly resolution and subsequent regulation. Possession of small quantities for personal use is effectively decriminalized under Constitutional Court rulings. The State Agency for Quality Control and Phytosanitary Regulation (AGROCALIDAD) and ARCSA regulate the medical cannabis sector. The market is in early development.',
'Patients access medical cannabis through licensed pharmacies with physician authorization. Domestic production is beginning, supplemented by imported products. Patient registration is required. Access in rural areas remains limited.',
'Physicians registered with the Ministry of Public Health may prescribe authorized cannabis products. Guidelines have been issued for neurological conditions, chronic pain, and palliative care. General practitioners may prescribe.',
'Ecuador''s medical cannabis market is nascent but growing. Domestic cultivation and extraction licenses have been issued. Ecuador''s agricultural infrastructure, particularly in regions with suitable climate, positions it for potential export market development. Several national and international companies have established operations.',
'The regulatory framework continues to develop. Decriminalization thresholds and medical access expansion are expected to be refined. Export licensing is a policy priority given Ecuador''s agricultural export orientation. Adult-use is not under active consideration.',
'ARCSA (Agencia Nacional de Regulación, Control y Vigilancia Sanitaria) regulates medical cannabis products. AGROCALIDAD oversees cultivation licensing.',
'Resolution 002-2019 (National Assembly); ARCSA technical regulations; AGROCALIDAD licensing registry','Current as of Q2 2026','Quarterly','Country-level briefing covering medical legalization and early market development',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='EC' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'el-salvador','country','SV','Prohibited',
'Cannabis is prohibited in El Salvador under the Ley Reguladora de las Actividades Relativas a las Drogas (Law 1015). There is no medical cannabis program and no decriminalization policy. El Salvador has some of the strictest drug enforcement policies in Central America, and cannabis-related penalties remain severe.',
'No legal patient access pathway exists. Cannabis-based pharmaceutical products are not available through the public or private healthcare system.',
'Physicians cannot prescribe cannabis. No regulatory pathway exists for clinical use of cannabis-based medicines.',
'No licensed market exists. Strong enforcement reduces informal market activity relative to neighboring countries. No cannabis investment has occurred.',
'Drug policy reform is not a current government priority. The security-focused government has reinforced strict law enforcement approaches across drug categories. No medical cannabis legislation is anticipated.',
'Ministry of Justice and Public Security; Ministry of Health (MINSAL) for pharmaceutical regulation.',
'Law 1015 (Ley Reguladora de las Actividades Relativas a las Drogas); MINSAL pharmaceutical policy','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SV' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'grenada','country','GD','Decriminalized; No Formal Medical Program',
'Grenada amended its drug laws in 2019 to decriminalize possession of small amounts of cannabis for personal use. No formal medical cannabis program or adult-use licensing framework exists. The country has expressed interest in developing a regulated cannabis sector aligned with CARICOM regional initiatives.',
'No formal patient access pathway exists. Patients cannot obtain regulated cannabis medicines through official Grenadian healthcare channels.',
'Physicians cannot formally prescribe cannabis as no medical regulatory framework exists. Clinical use is not recognized in the Grenadian healthcare system.',
'No licensed commercial cannabis market exists. There is economic interest in cannabis and hemp agriculture given the island''s agricultural tradition. Regional CARICOM discussions on cannabis policy are tracked.',
'CARICOM regional cannabis policy discussions may influence Grenada to develop a formal medical or commercial framework. No imminent legislation has been introduced.',
'Royal Grenada Police Force and the Ministry of Health of Grenada.',
'Grenada drug law amendments 2019; CARICOM cannabis policy working group reports','Current as of Q2 2026','Annual','Country-level briefing noting decriminalization and CARICOM regional context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GD' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'guatemala','country','GT','Decriminalized (Small Amounts); Otherwise Prohibited',
'Guatemala amended its drug law in 2021 to decriminalize possession of small amounts of cannabis for personal use, removing criminal penalties for minor possession. Commercial sale, cultivation, and supply remain illegal. No medical cannabis program exists, though there is civil society advocacy for reform.',
'No formal patient access pathway exists. No regulated cannabis-based medical products are available through Guatemalan healthcare channels.',
'Physicians cannot prescribe cannabis. No approved cannabis-based medical products exist within the Guatemalan regulatory system.',
'No licensed market exists. Guatemala''s geographic position as a transit country influences its drug policy framework, which remains aligned with regional enforcement approaches.',
'Drug policy reform is under civil society advocacy but has not gained significant legislative traction. Regional pressures from Mexico''s reforms and economic arguments for regulated cannabis may influence future policy.',
'Ministry of Public Health and Social Assistance (MSPAS); SECCATID (Secretaría Ejecutiva de la Comisión Contra las Adicciones y el Tráfico Ilícito de Drogas).',
'Guatemala drug law amendment 2021; SECCATID reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting limited decriminalization and absence of medical framework',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GT' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'guyana','country','GY','Decriminalized (Small Amounts); No Formal Medical Program',
'Guyana decriminalized possession of up to 30 grams of cannabis in 2020 under the Narcotic Drugs and Psychotropic Substances (Amendment) Act. Commercial sale and cultivation remain illegal. No medical cannabis program has been established. The government has indicated interest in reviewing cannabis policy further given economic development potential.',
'No formal patient access pathway exists. Patients cannot access regulated cannabis medicines through the Guyanese public health system.',
'Physicians cannot prescribe cannabis as no legal framework exists. Clinical use is not supported by the current regulatory environment.',
'No licensed market exists. Guyana''s expanding economy (driven by oil revenues) has shifted policy attention, but cannabis agriculture interest remains in rural communities.',
'The Guyanese government has expressed general openness to reviewing cannabis policy. Medical cannabis legislation has been discussed but not advanced. Regional CARICOM developments may accelerate reform.',
'Ministry of Home Affairs handles enforcement. Guyana Food and Drug Department (under Ministry of Health) oversees pharmaceutical matters.',
'Narcotic Drugs and Psychotropic Substances (Amendment) Act 2020; Guyana Ministry of Home Affairs reports','Current as of Q2 2026','Annual','Country-level briefing noting decriminalization and policy review context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GY' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'haiti','country','HT','Prohibited',
'Cannabis is prohibited in Haiti and no medical cannabis program exists. The country faces significant institutional and governance challenges that have prevented cannabis policy reform. Drug enforcement capacity is limited due to ongoing security and political instability.',
'No legal patient access pathway exists. Cannabis-based medicines are unavailable through official Haitian healthcare channels.',
'Physicians cannot prescribe cannabis. No approved cannabis-based products are available within the Haitian healthcare system.',
'No licensed market exists. Governance and security challenges constrain any formal market development.',
'Cannabis reform is not a current policy priority given Haiti''s complex governance situation. No legislative action is anticipated in the near term.',
'Ministry of Public Health and Population (MSPP) for pharmaceutical matters. Drug enforcement through the Haitian National Police.',
'Haitian drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and governance context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='HT' AND jurisdiction_type='country');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621233543','seed_briefings_americas_b','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621233543_seed_briefings_americas_b.sql

-- RECOVERY BEGIN 20260621233640_seed_briefings_americas_c.sql

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'honduras','country','HN','Prohibited',
'Cannabis is prohibited in Honduras under the Ley sobre Uso Indebido y Tráfico Ilícito de Drogas y Sustancias Psicotrópicas. There is no medical cannabis program and no decriminalization policy. Enforcement is active and penalties can be significant. The country has not engaged in cannabis policy reform discussions at the legislative level.',
'No legal patient access pathway exists. No regulated cannabis-based medical products are available through the public or private healthcare system.',
'Physicians cannot prescribe cannabis. No regulatory framework for clinical cannabis use exists.',
'No licensed market exists. Honduras faces significant drug-related security challenges that have reinforced prohibition approaches.',
'Cannabis reform is not anticipated given the current government''s security-focused policy orientation. No legislative action is expected in the near term.',
'Ministerio Público and Policía Nacional for enforcement. Secretaría de Salud for pharmaceutical regulation.',
'Drug law (Ley sobre Uso Indebido y Tráfico Ilícito de Drogas); regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='HN' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'jamaica','country','JM','Decriminalized; Medical and Sacramental Use Licensed',
'Jamaica amended its Dangerous Drugs Act in 2015 to decriminalize possession of up to 2 ounces, recognize Rastafarian sacramental use, and create a medical and therapeutic licensing framework. The Cannabis Licensing Authority (CLA) licenses cultivation, processing, retail, and research. Jamaica is one of the Caribbean''s most significant cannabis policy reformers and has positioned itself as a wellness tourism and export hub.',
'Patients access licensed medical cannabis from CLA-registered dispensaries with a prescription. Tourists and visitors can access cannabis through licensed herb houses. Sacramental use by Rastafarians is explicitly protected. Retail dispensaries operate in major tourism areas.',
'Physicians registered with the Medical Council of Jamaica may recommend cannabis for qualifying conditions. No specialist requirement applies. Clinical guidelines have been developed. Medical tourism programmes allow visitors to access cannabis legally.',
'Jamaica''s licensed cannabis market includes cultivators, processors, retailers, and research operators. The wellness tourism segment is a significant driver, with cannabis spa treatments and experiences offered. Export licensing to markets including the UK and EU has been pursued by several operators. The market attracts international investment.',
'The CLA continues to refine licensing and quality standards to enable export market access, particularly to the EU with its GMP requirements. Further integration of Jamaican cannabis into high-value medical markets is the regulatory priority. Adult-use commercial legalization is politically possible given public sentiment.',
'Cannabis Licensing Authority (CLA) under the Ministry of Industry, Investment and Commerce.',
'Dangerous Drugs (Amendment) Act 2015; CLA licensing registry; CLA annual reports','Current as of Q2 2026; verified against CLA official guidance','Quarterly','Full country-level briefing covering decriminalization, medical access, sacramental rights, and export positioning',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='JM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'mexico','country','MX','Medical Legal; Adult-Use Pending Full Regulation',
'Mexico''s Supreme Court ruled cannabis prohibition unconstitutional in a series of landmark decisions from 2018 onwards. Medical cannabis was formally regulated under COFEPRIS in 2017. In 2021 Congress failed to meet a Supreme Court deadline for adult-use legislation, creating a legal gap. Regulatory frameworks for adult-use have been proposed but comprehensive federal legislation had not been enacted as of mid-2026. Medical use is well-established and the market is growing rapidly.',
'Patients access medical cannabis through COFEPRIS-licensed pharmacies and medical providers with a prescription. Imported products from Canada, the US, and Europe are available alongside growing domestic production. Home cultivation for personal use is constitutionally protected following Supreme Court rulings.',
'Physicians may prescribe authorized medical cannabis products. COFEPRIS has issued guidance on conditions including epilepsy, chronic pain, and cancer-related symptoms. General practitioners may prescribe; specialist referral is not required.',
'Mexico is Latin America''s largest potential cannabis market by population. Domestic cultivation and processing capacity is expanding. Multiple international cannabis companies have established Mexican operations or licensing agreements. The constitutional protection for personal use has created a de facto market for personal cultivation. When formal adult-use regulation is enacted, Mexico is expected to become one of the world''s largest legal cannabis markets.',
'Full adult-use legislative framework remains the primary policy gap as of 2026. Congress is expected to pass comprehensive legislation, though timeline remains uncertain due to political complexities. COFEPRIS will be the primary federal regulator when adult-use legislation is enacted. Export market development is a medium-term priority.',
'COFEPRIS (Comisión Federal para la Protección contra Riesgos Sanitarios) regulates medical cannabis. Supreme Court jurisprudence shapes constitutional rights. SEMARNAT and SAGARPA may be involved in cultivation regulation.',
'COFEPRIS medical cannabis regulations; Supreme Court amparo decisions 2018–2021; Mexican Congress legislative tracking','Current as of Q2 2026; verified against COFEPRIS official guidance','Quarterly','Full country-level briefing covering medical program, constitutional rights, pending adult-use framework, and market scale',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MX' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'nicaragua','country','NI','Prohibited',
'Cannabis is prohibited in Nicaragua under the Ley 177 (Ley de Estupefacientes, Psicotrópicos y Otras Sustancias Controladas). No medical cannabis program exists and no decriminalization policy is in place. The current government has not engaged with cannabis reform at the legislative level.',
'No legal patient access pathway exists. No regulated cannabis-based medical products are available.',
'Physicians cannot prescribe cannabis. No regulatory framework for medical cannabis use exists.',
'No licensed market exists. Cannabis activity is actively enforced against.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Ministerio de Salud (MINSA) for pharmaceutical regulation. Policía Nacional for enforcement.',
'Ley 177; MINSA pharmaceutical policy; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NI' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'panama','country','PA','Medical Legal (since 2021); No Adult-Use',
'Panama passed Law 242 in 2021 (Ley 242) legalizing medical and therapeutic cannabis. The Ministry of Health (MINSA) and the Institute for Agricultural Innovation of Panama (IDIAP) share regulatory responsibility. Implementation regulations have been progressively issued since 2022. The medical market is in early-stage development as of 2026.',
'Patients access medical cannabis through licensed pharmacies with a valid medical authorization. Products include oils, capsules, and topicals from licensed domestic producers and importers. Patient registration is required through the MINSA system.',
'Physicians licensed by the Medical-Surgical Council of Panama may authorize cannabis treatment. Guidance covers chronic pain, epilepsy, and cancer-related symptoms. No specialist-only restriction applies.',
'Panama''s medical cannabis market is nascent, with initial licenses issued for cultivation, processing, and distribution. The country''s role as a regional hub and its strong regulatory infrastructure positions it for measured growth. International investor interest is growing.',
'The MINSA regulatory framework is being refined. Export market development is a medium-term policy goal. Full adult-use legalization is not on the current agenda but regional trends may influence future policy.',
'MINSA (Ministerio de Salud) for medical cannabis regulation. IDIAP for cultivation oversight.',
'Law 242 (2021); MINSA implementing regulations; IDIAP cultivation guidance','Current as of Q2 2026','Quarterly','Country-level briefing covering medical legalization and early market development',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'paraguay','country','PY','Medical Legal (CBD-Focused); Limited Program',
'Paraguay legalized medical cannabis in 2019 under Law 6007/17, with a primary focus on CBD-based products. INAN (National Institute of Food and Nutrition) and DINAVISA (National Directorate of Sanitary Surveillance) regulate medical cannabis. Paraguay is also one of the region''s largest tobacco producers and has agricultural infrastructure transferable to cannabis cultivation, though the program remains limited in scope.',
'Patients access medical cannabis through DINAVISA-authorized pharmacies with a physician prescription. The program initially focused on CBD products for epilepsy and chronic pain. THC-containing products face more significant regulatory barriers.',
'Physicians may prescribe authorized CBD-based cannabis medicines. The regulatory guidance is primarily oriented toward neurological conditions. Specialist referral may be required for complex cases.',
'Paraguay''s medical cannabis market is small but has potential given agricultural capacity. Domestic cultivation for CBD extraction has been licensed. Several companies have expressed interest in Paraguay as a South American production base.',
'The regulatory framework is expected to expand in scope to include more THC-containing products as clinical evidence develops. Export market development is under consideration. Adult-use is not under active consideration.',
'DINAVISA (Dirección Nacional de Vigilancia Sanitaria) for product authorization. INAN for nutritional supplement classification. SENAVE for agricultural licensing.',
'Law 6007/17; DINAVISA resolutions; SENAVE cultivation licensing','Current as of Q2 2026','Annual','Country-level briefing covering limited medical program focused on CBD',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PY' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'peru','country','PE','Medical Legal; Growing Market',
'Peru enacted Law 30681 in 2017 legalizing medical cannabis, making it one of the first South American countries to do so. Regulations under DIGEMID (Dirección General de Medicamentos, Insumos y Drogas) authorize import, domestic production, and commercialization of cannabis-based medical products. The market has grown significantly since 2020 as domestic production capacity expanded.',
'Patients access medical cannabis through DIGEMID-authorized pharmacies with a prescription from a licensed physician. Domestic products and imports from international producers are available. Costs have declined as domestic production has scaled.',
'Physicians registered with the Colegio Médico del Perú may prescribe authorized cannabis medicines. Guidance covers epilepsy, chronic pain, cancer, multiple sclerosis, and palliative care. No specialist-only restriction applies though complex cases may involve referral.',
'Peru''s medical cannabis sector has matured significantly. Multiple domestic producers hold DIGEMID licenses for cultivation, extraction, and manufacturing. Export markets, particularly in Europe and North America, are being developed. The sector has attracted investment from international cannabis companies establishing Peruvian operations.',
'DIGEMID regulatory frameworks are continuing to evolve with improved GMP standards. Export certification frameworks are a key policy priority. Adult-use legalization is not under active consideration but decriminalization provisions remain in effect for small amounts. Peru''s agricultural export orientation makes it a potential long-term cannabis export powerhouse.',
'DIGEMID (under Ministerio de Salud) for product licensing and market authorization. SERFOR (Servicio Nacional Forestal y de Fauna Silvestre) for cultivation.',
'Law 30681 (2017); Supreme Decree 005-2019-SA; DIGEMID product registry; SERFOR cultivation licensing','Current as of Q2 2026; verified against DIGEMID official guidance','Quarterly','Full country-level briefing covering medical program, growing domestic production, and export positioning',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'saint-kitts-and-nevis','country','KN','Decriminalized; No Formal Medical Program',
'Saint Kitts and Nevis has moved toward decriminalization of small amounts of cannabis, aligned with CARICOM regional policy discussions. No formal medical cannabis program or adult-use licensing framework exists. The country participates in the CARICOM Regional Commission on Marijuana discussions.',
'No formal patient access pathway exists. No regulated cannabis-based medical products are available through official healthcare channels.',
'Physicians cannot formally prescribe cannabis as no medical regulatory framework exists.',
'No licensed commercial market exists. Interest in cannabis tourism as a supplement to the existing tourism economy has been noted.',
'CARICOM regional developments and economic diversification pressures may prompt formal policy action. No imminent legislation has been introduced.',
'Saint Kitts and Nevis Police Force; Ministry of Health.',
'CARICOM cannabis commission reports; regional comparative monitoring','Current as of Q2 2026','Annual','Country-level briefing noting decriminalization trend and CARICOM context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KN' AND jurisdiction_type='country');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621233640','seed_briefings_americas_c','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621233640_seed_briefings_americas_c.sql

-- RECOVERY BEGIN 20260621233743_seed_briefings_americas_d.sql

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'saint-lucia','country','LC','Decriminalized; No Formal Medical Program',
'Saint Lucia enacted the Cannabis Control Act in 2021, decriminalizing possession of 14 grams or less for personal use. The Act also established a framework for considering future medical and adult-use licensing. No licensed commercial or medical market was operational as of 2026, but the legislative foundation has been laid.',
'No formal patient access pathway exists. No licensed medical cannabis dispensaries operate. The Cannabis Control Act framework may enable future medical access.',
'Physicians cannot formally prescribe cannabis under the current framework. The Cannabis Control Act is expected to be followed by further regulations enabling medical prescription.',
'No licensed commercial market exists. The Cannabis Control Act''s licensing provisions are expected to be operationalized, with potential for cannabis tourism applications.',
'The Cannabis Control Act is a foundational step. Full implementation including licensing regulations for medical and commercial use is the near-term priority. Saint Lucia is positioned to develop a regulated market in alignment with regional trends.',
'Cannabis Control Authority (anticipated under the Cannabis Control Act 2021). Royal Saint Lucia Police Force.',
'Cannabis Control Act 2021; OECS/CARICOM regional policy monitoring','Current as of Q2 2026','Annual','Country-level briefing covering Cannabis Control Act and pending implementation',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LC' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'suriname','country','SR','Prohibited; Limited Tolerance in Practice',
'Cannabis is technically prohibited in Suriname under the Verdovende Middelen Wet (Narcotics Act). In practice, enforcement of small personal-use amounts has been lenient in urban areas. No formal medical cannabis program or decriminalization policy exists. Suriname has not engaged in legislative cannabis reform.',
'No formal patient access pathway exists. No regulated cannabis-based medical products are available.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. The informal market operates in urban areas with limited enforcement.',
'Cannabis reform is not a current policy priority. Regional developments may create future reform pressure but no legislative action is anticipated in the near term.',
'Ministerie van Volksgezondheid (Ministry of Health); Korps Politie Suriname for enforcement.',
'Verdovende Middelen Wet; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status with limited practical enforcement',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'trinidad-and-tobago','country','TT','Decriminalized (30g); Cannabis Control Authority Established',
'Trinidad and Tobago decriminalized possession of up to 30 grams of cannabis in 2019 through the Dangerous Drugs (Amendment) Act. The Cannabis Licensing Authority (CLA) was established to develop licensing frameworks for medical, research, and potentially adult-use cannabis. Full commercial operations had not yet launched as of mid-2026, but framework development is advanced.',
'Patient access is not yet formally available through a licensed medical program. The CLA framework, once fully operational, will enable medical cannabis dispensaries. Individuals may possess up to 30g decriminalized and cultivate up to 4 plants at home.',
'Physicians will be able to authorize medical cannabis under the forthcoming CLA medical licensing framework. No products are yet available through official pharmaceutical channels.',
'No licensed commercial market has launched as of 2026. The CLA is finalizing licensing procedures. Trinidad and Tobago''s oil and gas expertise and infrastructure are seen as potentially transferable to a pharmaceutical cannabis industry.',
'The CLA framework operationalization is the key near-term development. A medical program launch followed by potential adult-use licensing is the anticipated trajectory. Caribbean regional context and economic diversification pressures support development.',
'Cannabis Licensing Authority (CLA) of Trinidad and Tobago. Ministry of Health for pharmaceutical aspects.',
'Dangerous Drugs (Amendment) Act 2019; CLA official guidance and licensing framework documents','Current as of Q2 2026','Quarterly','Country-level briefing covering decriminalization, home cultivation rights, and forthcoming licensed market',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TT' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'uruguay','country','UY','Adult-Use Legal; Medical Legal; World Pioneer',
'Uruguay became the world''s first country to legalize adult-use cannabis nationally in 2013 under Law 19.172. The Instituto de Regulación y Control del Cannabis (IRCCA) regulates all cannabis activity including cultivation, clubs, pharmacy sales, and medical use. Residents may purchase cannabis from licensed pharmacies, join cannabis social clubs, or cultivate up to 6 plants at home. The system is restricted to Uruguayan residents and citizens.',
'Residents access cannabis from licensed IRCCA-registered pharmacies at regulated prices. Cannabis social clubs allow member cultivation. Home cultivation of up to 6 plants is permitted. Medical cannabis products are available for qualifying conditions under physician guidance. Non-residents cannot access the regulated market.',
'Physicians may recommend cannabis for medical purposes through a separate but parallel track. The pharmacy-based adult-use system effectively provides broad access to any adult resident. Medical guidance is integrated into the overall regulated system.',
'Uruguay''s market remains a national monopoly model with state involvement in production and distribution. Price controls keep cannabis affordable. The IRCCA-licensed system serves tens of thousands of registered users. Uruguay does not export cannabis despite its pioneer status. The market is stable rather than rapidly growing, reflecting the policy design as a public health model rather than a commercial industry.',
'Uruguay''s model is well-established and stable. Regulatory refinements focus on product variety, quality controls, and addressing the persistent informal market through competitive pricing. Export potential may be explored as part of economic diversification. International interest in Uruguay''s model for evidence-based policy remains high.',
'IRCCA (Instituto de Regulación y Control del Cannabis) under the Junta Nacional de Drogas (JND), Ministry of Education and Culture.',
'Law 19.172 (2013); IRCCA regulations; JND annual cannabis monitoring reports; academic evaluations of the Uruguayan model','Current as of Q2 2026; verified against IRCCA official data','Quarterly','Full country-level briefing covering world''s first national adult-use legalization and mature regulated market',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='UY' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'venezuela','country','VE','Prohibited',
'Cannabis is prohibited in Venezuela under the Ley Orgánica de Drogas. No medical cannabis program exists and no decriminalization framework has been enacted. The country faces significant economic and governance challenges that have not allowed for cannabis policy reform. Enforcement capacity varies significantly across regions.',
'No legal patient access pathway exists. No regulated cannabis-based medical products are available through Venezuelan healthcare.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Economic collapse and governance challenges dominate policy attention.',
'Cannabis reform is not a current policy priority given Venezuela''s political and economic situation. No legislative action is anticipated.',
'CONACUID (Comisión Nacional Contra el Uso Ilícito de las Drogas); Ministerio de Salud for pharmaceutical matters.',
'Ley Orgánica de Drogas; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and governance context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='VE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'saint-vincent-and-grenadines','country','VC','Decriminalized; No Formal Medical Program',
'Saint Vincent and the Grenadines decriminalized small amounts of cannabis in 2018. The country has participated in CARICOM regional cannabis policy discussions. No formal medical program or adult-use licensing framework has been established. The Saint Vincent government has expressed interest in developing a regulated cannabis sector given the country''s agricultural tradition.',
'No formal patient access pathway exists. No regulated medical cannabis products are available through official healthcare channels.',
'Physicians cannot formally prescribe cannabis as no medical regulatory framework exists.',
'No licensed commercial market exists. Saint Vincent''s agricultural history (including the former banana export economy) is seen as a transferable foundation for cannabis cultivation.',
'CARICOM regional developments and economic diversification pressures may prompt policy action. No imminent legislation has been formally introduced.',
'Ministry of Health of Saint Vincent and the Grenadines; Royal Saint Vincent and the Grenadines Police Force.',
'Drug laws amendment 2018; CARICOM regional policy monitoring','Current as of Q2 2026','Annual','Country-level briefing noting decriminalization and agricultural potential for cannabis sector',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='VC' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'antigua-and-barbuda','country','AG','Decriminalized; No Formal Medical Program',
'Antigua and Barbuda decriminalized possession of small amounts of cannabis in 2018 through the Misuse of Drugs (Amendment) Act. Personal cultivation of up to 4 plants was also decriminalized. No formal medical program or adult-use commercial licensing has been established. The country participates in CARICOM regional cannabis policy forums.',
'No formal patient access pathway exists. No regulated cannabis-based medical products are available through official healthcare channels.',
'Physicians cannot formally prescribe cannabis as no medical regulatory framework exists.',
'No licensed commercial market exists. Economic interest in cannabis tourism has been expressed given the country''s substantial tourism economy.',
'CARICOM regional developments, particularly frameworks in Barbados and Jamaica, may influence Antigua and Barbuda to develop medical or adult-use frameworks. No imminent legislation has been introduced.',
'Royal Antigua and Barbuda Police Force; Ministry of Health.',
'Misuse of Drugs (Amendment) Act 2018; CARICOM regional monitoring','Current as of Q2 2026','Annual','Country-level briefing noting decriminalization and home cultivation rights',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'bahamas','country','BS','Decriminalized (1 oz); Medical Discussions Ongoing',
'The Bahamas amended the Dangerous Drugs Act in 2023 to decriminalize possession of up to one ounce of cannabis for personal use. Medical cannabis discussions have been ongoing in parliament. The country has not yet enacted a formal medical cannabis program, but the decriminalization amendment signals policy liberalization. The Bahamas'' significant tourism economy creates commercial interest in cannabis policy development.',
'No formal medical patient access pathway exists. The decriminalization amendment removes criminal penalties for personal possession. No licensed dispensaries operate.',
'Physicians cannot formally prescribe cannabis as no medical regulatory framework exists.',
'No licensed commercial market exists. Tourism industry stakeholders have expressed interest in a cannabis tourism framework aligned with regional peers.',
'Medical cannabis legislation is expected to follow the decriminalization amendment. The Bahamas is positioned to follow Caribbean neighbors such as Jamaica and Barbados in developing a regulated medical and potentially adult-use framework.',
'Royal Bahamas Police Force; Ministry of Health of The Bahamas.',
'Dangerous Drugs Act (amended 2023); parliamentary cannabis committee reports','Current as of Q2 2026','Annual','Country-level briefing covering recent decriminalization and pending medical program discussions',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BS' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'united-states','country','US','Federal: Schedule I (DEA Rescheduling Proposed); State Programs Vary',
'Cannabis remains a Schedule I controlled substance under the federal Controlled Substances Act (CSA), creating a fundamental federal-state law conflict. However, as of 2026, 38+ states have enacted medical cannabis programs and 24+ states plus DC have enacted adult-use legalization. The FDA approved Epidiolex (cannabidiol) as a pharmaceutical. The DEA proposed rescheduling cannabis to Schedule III in 2024, and administrative proceedings are ongoing. Hemp (cannabis with below 0.3% THC) is federally legal under the 2018 Farm Bill.',
'Patient access varies dramatically by state. In states with adult-use programs, any adult 21+ may purchase from licensed dispensaries. Medical program patients in qualifying states register with state health departments and access licensed dispensaries. Interstate commerce of cannabis remains federally illegal regardless of state law. Federal employees and those on federal property cannot legally access cannabis.',
'In states with medical programs, physicians (and in some states nurse practitioners) may recommend cannabis. Federal law does not recognize cannabis prescriptions; state programs use "recommendations." Physicians in states without programs cannot recommend cannabis. Federal healthcare systems (VA, Indian Health Service) face unique restrictions.',
'The US cannabis industry is the world''s largest regulated market by revenue, estimated at USD 30+ billion annually. California, Colorado, Illinois, Michigan, and New York are among the largest state markets. Multi-state operators (MSOs) dominate commercial cannabis with vertically integrated operations. The industry faces persistent challenges including federal taxation (280E), lack of banking access, interstate commerce restrictions, and social equity licensing backlogs. Hemp-derived products including CBD, delta-8, and THCA are a significant parallel market with overlapping legal complexity.',
'DEA rescheduling from Schedule I to Schedule III would significantly reduce regulatory burden, potentially enable banking access, and eliminate IRC 280E tax penalties. Congressional cannabis banking legislation (SAFE Banking Act) has passed the House multiple times without Senate passage. Full federal legalization (the MORE Act or similar) remains politically contested. State-level legalization continues to expand through ballot initiatives.',
'DEA (Drug Enforcement Administration) for federal scheduling. FDA (Food and Drug Administration) for pharmaceutical cannabis products. USDA (Department of Agriculture) for hemp. State cannabis control boards and agencies for state-level programs (e.g., California DCC, Colorado MED, Illinois IDFPR).',
'Controlled Substances Act (21 USC 801 et seq.); 2018 Farm Bill; DEA proposed rescheduling rule; state cannabis statutes (by state); FDA CBD guidance; Congressional Research Service cannabis law reports','Current as of Q2 2026; federal status based on DEA administrative proceedings','Quarterly','Full country-level federal briefing covering Schedule I status, DEA rescheduling proceedings, state program landscape, and market scale',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='US' AND jurisdiction_type='country');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621233743','seed_briefings_americas_d','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621233743_seed_briefings_americas_d.sql

-- RECOVERY BEGIN 20260621233852_seed_briefings_africa_a.sql

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'algeria','country','DZ','Prohibited',
'Cannabis is prohibited in Algeria under Law 04-18 relating to prevention and repression of illegal drug use and trafficking. Penalties are strict and enforcement is active. Despite Algeria''s geographic position adjacent to Morocco (the world''s largest hashish producer), Algeria treats cannabis transit and use as serious criminal offences. No medical cannabis program exists.',
'No legal patient access pathway exists. Cannabis-based pharmaceuticals are not available through the Algerian public health system.',
'Physicians cannot prescribe cannabis. No regulatory framework for cannabis-based medicines exists.',
'No licensed cannabis market exists. Algeria''s position as a transit corridor for Moroccan hashish creates enforcement challenges. No investment in licensed cannabis has occurred.',
'Cannabis reform is not a current policy priority. Algeria''s drug policy is oriented toward strict enforcement. Morocco''s 2021 legalization has not visibly influenced Algerian policy.',
'Ministry of Justice; Ministry of Health; Office National de Lutte contre la Drogue et la Toxicomanie (ONLCDT).',
'Law 04-18; ONLCDT annual reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DZ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'angola','country','AO','Prohibited',
'Cannabis is prohibited in Angola under the Lei do Combate à Droga. No medical cannabis program has been established. Enforcement capacity is variable across the country''s regions. Angola has not engaged in formal cannabis policy reform.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. No investment in licensed cannabis has occurred.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated in the near term.',
'SIDA (Serviço de Investigação Criminal) for drug enforcement. Ministry of Health for pharmaceutical regulation.',
'Lei do Combate à Droga; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AO' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'benin','country','BJ','Prohibited',
'Cannabis is prohibited in Benin under the Loi portant répression du trafic de stupéfiants. No medical cannabis program exists. Enforcement intensity varies. Benin has not engaged in cannabis policy reform discussions.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no framework exists.',
'No licensed market exists. No cannabis investment has occurred.',
'Cannabis reform is not a current policy priority. No imminent legislative change is anticipated.',
'Office Central de Répression du Trafic Illicite de Drogues (OCERTID); Ministry of Health.',
'Drug trafficking law; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BJ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'botswana','country','BW','Prohibited',
'Cannabis is prohibited in Botswana under the Drugs and Related Substances Act of 1992. Botswana has strict drug laws with significant penalties. No medical cannabis program exists. The country has not engaged in formal cannabis policy reform, though there is some civil society advocacy.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. No cannabis investment has occurred in the regulated sector.',
'Cannabis reform has been discussed at the civil society level. No legislative action is anticipated in the near term, though regional developments including South Africa''s constitutional ruling may influence future discussions.',
'Botswana Police Service; Department of Health for pharmaceutical matters.',
'Drugs and Related Substances Act 1992; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BW' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'burkina-faso','country','BF','Prohibited',
'Cannabis is prohibited in Burkina Faso under the Loi portant organisation de la lutte contre la drogue. No medical cannabis program exists. Enforcement capacity is affected by ongoing security challenges in parts of the country.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority given the country''s security situation. No legislative action is anticipated.',
'Direction Générale de la Police Nationale; Ministry of Health.',
'Drug law; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BF' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'burundi','country','BI','Prohibited',
'Cannabis is prohibited in Burundi under national drug laws. No medical cannabis program exists. Governance challenges and poverty constrain regulatory capacity for cannabis policy reform.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Police Nationale du Burundi; Ministry of Public Health.',
'National drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BI' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'cameroon','country','CM','Prohibited',
'Cannabis is prohibited in Cameroon under Law No. 97/019 on drugs and precursor substances. No medical cannabis program exists. Some traditional use of cannabis occurs in rural areas. Enforcement is variable across the country''s diverse regions.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Cameroon''s agricultural potential has been noted in regional cannabis industry discussions but no licensed activity has occurred.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated in the near term.',
'DGSN (Délégation Générale à la Sûreté Nationale); Ministry of Public Health.',
'Law No. 97/019; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and traditional use context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'cape-verde','country','CV','Prohibited',
'Cannabis is prohibited in Cape Verde. The island nation has focused drug policy attention on cocaine transit given its Atlantic position. Cannabis possession and sale are illegal with penalties applied. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Polícia Judiciária; Ministry of Health.',
'Cape Verde drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CV' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'central-african-republic','country','CF','Prohibited; Enforcement Severely Limited',
'Cannabis is technically prohibited in the Central African Republic but enforcement is extremely limited due to ongoing armed conflict and the near-collapse of state institutions across much of the country. Informal cannabis cultivation occurs in some regions. No medical program exists or is being developed.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Informal cultivation occurs in regions outside government control.',
'Cannabis policy reform is not a realistic near-term prospect given the country''s governance and security situation.',
'Government structures extremely limited. Formal drug oversight by MINUSCA and remaining state institutions.',
'Regional security monitoring; limited official data available','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and governance limitations',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CF' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'chad','country','TD','Prohibited',
'Cannabis is prohibited in Chad. Drug enforcement focuses primarily on the country''s position as a transit corridor and the Sahel security environment. No medical cannabis program exists. Enforcement capacity is constrained by resources and ongoing security challenges.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Ministère de la Santé Publique; security forces for enforcement.',
'Chad drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TD' AND jurisdiction_type='country');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621233852','seed_briefings_africa_a','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621233852_seed_briefings_africa_a.sql

-- RECOVERY BEGIN 20260621233922_seed_briefings_africa_b.sql

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'comoros','country','KM','Prohibited',
'Cannabis is prohibited in the Comoros. The island nation''s drug policy focuses on the widely used khat (miraa) locally. Cannabis prohibition is maintained with no medical program or reform discussions underway.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Ministère de la Santé; Gendarmerie Nationale.',
'Comorian drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'democratic-republic-of-congo','country','CD','Prohibited; Enforcement Limited',
'Cannabis is prohibited in the Democratic Republic of Congo under national drug laws, but enforcement across this vast country is extremely uneven and largely symbolic in many regions. Informal cannabis cultivation occurs widely. No medical program exists. The DRC''s scale and governance challenges make coherent drug policy enforcement difficult.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Informal cultivation and trade occur across many provinces.',
'Cannabis policy reform is not a realistic near-term prospect given governance and resource constraints.',
'Agence Nationale de Renseignements (ANR); Ministry of Public Health for pharmaceuticals.',
'DRC drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and enforcement limitations',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CD' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'cote-divoire','country','CI','Prohibited',
'Cannabis is prohibited in Côte d''Ivoire under Law 88-686 on combating drug trafficking and abuse. Enforcement is active in urban areas. No medical cannabis program exists. Côte d''Ivoire has not engaged in cannabis policy reform discussions at the legislative level.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Office Central de Répression du Trafic Illicite de Drogues (OCRTID); Ministry of Health.',
'Law 88-686; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CI' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'djibouti','country','DJ','Prohibited',
'Cannabis is prohibited in Djibouti. Drug policy in Djibouti focuses primarily on khat, which is widely used and legally tolerated in the country and region. Cannabis prohibition is maintained with no reform discussion underway.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Police Nationale de Djibouti; Ministry of Health.',
'Djibouti drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DJ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'egypt','country','EG','Prohibited; Strict Enforcement',
'Cannabis is prohibited in Egypt under Law 182 of 1960 on combating narcotic drugs. Egypt imposes severe penalties for cannabis possession and trafficking, with minimum mandatory sentences for many offences. The country has historically been a transit point for hashish from other regions but maintains aggressive enforcement domestically. No medical cannabis program exists and no reform is under consideration.',
'No legal patient access pathway exists. Egypt''s strict drug laws offer no pathways for medical cannabis access.',
'Physicians cannot prescribe cannabis. No approved cannabis-based pharmaceuticals are available through Egyptian health channels.',
'No licensed market exists. Egypt''s historic role as a regional transit point does not translate to licensed commercial activity.',
'Cannabis reform is not a current government priority. Egypt''s drug policy framework is firmly prohibitionist. No legislative change is anticipated.',
'NCCDP (National Council for Combating and Controlling Drugs Phenomenon); Ministry of Health (MOHP) for pharmaceutical matters.',
'Law 182 of 1960; NCCDP annual reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition and absence of reform pathway',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='EG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'equatorial-guinea','country','GQ','Prohibited',
'Cannabis is prohibited in Equatorial Guinea. The country''s oil-wealth-driven economy has not generated political interest in cannabis policy reform. No medical program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Ministry of Health and Social Welfare; National Police.',
'Equatorial Guinea drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GQ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'eritrea','country','ER','Prohibited',
'Cannabis is prohibited in Eritrea. The country''s isolated political environment and limited international engagement mean cannabis policy reform is not a consideration. No medical program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not anticipated given Eritrea''s political isolation. No legislative action is expected.',
'Ministry of Health; national security services.',
'Eritrean drug laws; limited official data available','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and political isolation context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ER' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'ethiopia','country','ET','Prohibited',
'Cannabis is prohibited in Ethiopia under the Drug Administration and Control Proclamation. Drug policy in Ethiopia focuses significantly on khat (qat), which is legal, culturally important, and a significant export crop. Cannabis remains prohibited with enforcement varying by region. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Khat is the primary legal stimulant plant.',
'Cannabis reform is not currently being considered. The policy focus remains on khat regulation and traditional agricultural exports. No legislative action is anticipated.',
'Ethiopian Food and Drug Authority (EFDA); Federal Police for enforcement.',
'Drug Administration and Control Proclamation; EFDA pharmaceutical policy; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibition and khat policy context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ET' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'gabon','country','GA','Prohibited',
'Cannabis is prohibited in Gabon under national drug laws. No medical cannabis program exists. Gabon''s oil revenues have dominated economic policy, and cannabis reform has not been a legislative priority.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Direction Générale de la Pharmacie, du Médicament et des Laboratoires; Gendarmerie Nationale.',
'Gabonese drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'gambia','country','GM','Prohibited',
'Cannabis is prohibited in The Gambia under the Drug Control Act. No medical cannabis program exists. The country''s small size and limited regulatory infrastructure constrain policy development capacity.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'National Drug Enforcement Agency (NDEA); Ministry of Health.',
'Drug Control Act; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GM' AND jurisdiction_type='country');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621233922','seed_briefings_africa_b','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621233922_seed_briefings_africa_b.sql

-- RECOVERY BEGIN 20260621234014_seed_briefings_africa_c.sql

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'ghana','country','GH','Prohibited; Medical Reform Under Discussion',
'Cannabis is prohibited in Ghana under the Narcotic Drugs (Control, Enforcement and Sanctions) Law of 1990. However, the Narcotics Control Commission (NCC) Act of 2020 modernized the regulatory framework and the government has been publicly exploring medical cannabis licensing for export purposes. Ghana has not yet enacted a medical cannabis program but is one of the more active reformers in West Africa.',
'No formal patient access pathway currently exists. Parliamentary debates on medical cannabis access have occurred. Future medical program implementation is possible pending legislation.',
'Physicians cannot prescribe cannabis under the current legal framework. Medical professionals have participated in policy consultations.',
'No licensed cannabis market currently exists. Ghana''s government has expressed interest in licensing medical cannabis cultivation primarily for export to EU markets. Agricultural infrastructure and a professional regulatory culture position Ghana as a potential West African cannabis hub when legislation advances.',
'Ghana is one of the more likely near-term African medical cannabis legalizers. Parliamentary support has been expressed. Legislation enabling export-oriented medical cannabis cultivation is anticipated in the 2025–2027 policy window.',
'Narcotics Control Commission (NCC) under the Ministry of Interior. Food and Drugs Authority (FDA) for pharmaceutical matters.',
'Narcotic Drugs Law 1990; NCC Act 2020; parliamentary cannabis committee proceedings; FDA pharmaceutical guidelines','Current as of Q2 2026','Quarterly','Country-level briefing covering prohibition with active medical reform discussion and export potential',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GH' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'guinea','country','GN','Prohibited',
'Cannabis is prohibited in Guinea. Political instability and governance challenges have constrained regulatory capacity across all sectors. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority given governance challenges. No legislative action is anticipated.',
'Ministry of Public Health; Gendarmerie Nationale for enforcement.',
'Guinean drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GN' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'guinea-bissau','country','GW','Prohibited; Limited Enforcement',
'Cannabis is prohibited in Guinea-Bissau but enforcement is extremely limited. The country faces significant governance and capacity challenges. Guinea-Bissau is a noted transit point for South American cocaine destined for Europe. Cannabis prohibition nominally stands but domestic use is largely unaddressed by enforcement.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Informal cannabis cultivation and use occurs with minimal enforcement.',
'Cannabis reform is not a current policy priority given governance challenges. No legislative action is anticipated.',
'Polícia Judiciária; Ministry of Health.',
'Guinea-Bissau drug laws; limited official data','Current as of Q2 2026','Annual','Country-level briefing noting limited enforcement context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GW' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'kenya','country','KE','Prohibited; Export Licensing Under Discussion',
'Cannabis is prohibited in Kenya under the Narcotic Drugs and Psychotropic Substances (Control) Act of 1994. However, Kenya has been actively exploring medical cannabis export licensing, with the government issuing statements about potential licensing for export to regulated markets. No domestic medical program exists for patients as of 2026, but export-oriented cultivation licensing is under regulatory development.',
'No formal patient access pathway exists domestically. The policy discussion is primarily oriented toward export-oriented production.',
'Physicians cannot prescribe cannabis as no medical regulatory framework for domestic use exists.',
'No licensed commercial market exists yet. Kenya''s strong agricultural infrastructure, established export channels (particularly cut flowers and tea), and proximity to European markets make it an attractive production base. Several international companies have engaged with Kenyan authorities about cultivation licenses.',
'Kenya is positioned to be a significant East African cannabis producer for export markets. Regulatory frameworks for export cultivation are under development. A domestic medical access program may follow. The timeline for licensing operationalization is the key uncertainty.',
'Pharmacy and Poisons Board (PPB) under Ministry of Health. National Police Service for enforcement.',
'Narcotic Drugs and Psychotropic Substances (Control) Act 1994; PPB cannabis export framework consultations; government ministerial statements','Current as of Q2 2026','Quarterly','Country-level briefing covering prohibition with active export licensing development',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'lesotho','country','LS','Medical Legal; Export-Oriented Pioneer',
'Lesotho became the first African country to issue a medical cannabis cultivation license when it licensed Medi Kingdom (now Medigrow) in 2017. Since then, additional cultivation licenses have been issued. Lesotho''s high-altitude growing conditions are ideal for cannabis cultivation. The regulatory framework is administered by the Lesotho Ministry of Health and the newly established Lesotho Cannabis Authority. Products are primarily exported to international pharmaceutical markets.',
'Domestic patient access to medical cannabis products is limited. The program is primarily export-oriented rather than serving a domestic medical market.',
'Domestic physician prescription pathways are in development but not yet fully operational. The medical regulatory framework focuses more on production licensing than domestic clinical access.',
'Lesotho''s cannabis sector is one of the most developed in sub-Saharan Africa by regulatory maturity. Multiple licensed cultivators produce cannabis for export, particularly to the UK and EU. The sector provides significant employment in a country with limited economic opportunities. EU GMP compliance is a key focus for exporters.',
'Lesotho''s Cannabis Authority is working to streamline licensing and improve GMP compliance for major export market access. A domestic medical access program is expected to be developed alongside the export industry. Further investment and additional license grants are anticipated.',
'Lesotho Cannabis Authority (LCA); Ministry of Health for medical matters.',
'Lesotho Cannabis Authority regulations; Pharmacy Order 2008 (amended); Ministry of Health cannabis guidelines','Current as of Q2 2026; verified against LCA official guidance','Quarterly','Full country-level briefing covering pioneer African medical cannabis status and export-oriented market',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LS' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'liberia','country','LR','Prohibited',
'Cannabis is prohibited in Liberia under the Revised Narcotic Drug Law. No medical cannabis program exists. Liberia''s post-conflict recovery context has not included cannabis policy reform as a legislative priority.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Drug Enforcement Agency (DEA) of Liberia; Ministry of Health.',
'Revised Narcotic Drug Law; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'libya','country','LY','Prohibited; Political Instability',
'Cannabis is prohibited in Libya under strict drug laws. The country''s ongoing political fragmentation and conflict between rival governments make coherent drug policy enforcement difficult. Cannabis use is prevalent in some areas. No medical cannabis program exists and no reform is being considered.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Political instability affects all regulatory functions.',
'Cannabis reform is not a current policy priority given Libya''s political fragmentation. No legislative action is anticipated.',
'Multiple competing state structures; LPHO (Libyan Pharmaceutical Health Organization) where operational.',
'Libyan drug laws; regional comparative analysis; conflict monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and political context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LY' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'madagascar','country','MG','Prohibited; Informal Production Prevalent',
'Cannabis is prohibited in Madagascar but informal cultivation is widespread, particularly in the north and northwest of the island. Madagascar is one of Africa''s significant informal cannabis producers. No medical cannabis program exists and no formal reform is underway, though enforcement against cultivation is uneven.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Informal cultivation and domestic/regional trade occurs.',
'Cannabis reform has not been formalized legislatively. Economic arguments for a licensed cannabis cultivation industry have been made given existing informal production capacity, but no action has been taken.',
'Brigade Centrale de Lutte contre les Stupéfiants; Ministry of Public Health.',
'Malagasy drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status with significant informal cultivation',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'malawi','country','MW','Medical and Industrial Cultivation Licensed; Emerging Market',
'Malawi enacted the Cannabis Regulation Act and Industrial Hemp Act in 2020, establishing a licensing framework for medical cannabis and industrial hemp cultivation. Malawi Cannabis Regulatory Authority (MCRA) was established to license and regulate the sector. The program is primarily oriented toward export to international medical and industrial markets. Malawi is one of the more progressive sub-Saharan African countries on cannabis policy.',
'Domestic patient access pathways are limited. The program focuses on export-oriented cultivation. Medical access for Malawian patients is an expected future development as the domestic regulatory framework matures.',
'Domestic physician prescription pathways are not yet well-established. The focus is on cultivation and export licensing.',
'Malawi''s cannabis sector is developing with multiple cultivation licenses issued under the MCRA framework. The country''s existing tobacco farming infrastructure and expertise create a natural fit for cannabis cultivation. Several international cannabis companies have established Malawian partnerships or operations. Export certification processes are ongoing.',
'The MCRA is refining regulatory standards to meet EU and UK GMP requirements for export access. A domestic medical access program is expected to be developed in parallel. Malawi is well-positioned as a significant African cannabis producer.',
'Malawi Cannabis Regulatory Authority (MCRA); Ministry of Health for medical matters.',
'Cannabis Regulation Act 2020; Industrial Hemp Act 2020; MCRA licensing registry and guidance','Current as of Q2 2026; verified against MCRA official guidance','Quarterly','Full country-level briefing covering licensed medical cannabis sector and export development',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MW' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'mali','country','ML','Prohibited; Enforcement Limited by Instability',
'Cannabis is prohibited in Mali but enforcement is severely constrained by the country''s ongoing political instability and security challenges in large parts of the territory. Mali is a transit country for Saharan drug routes. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Informal trade occurs through transit corridors.',
'Cannabis reform is not a current policy priority given Mali''s security situation. No legislative action is anticipated.',
'Direction des Stupéfiants et de la Police Judiciaire; Ministère de la Santé.',
'Mali drug laws; regional comparative analysis; security monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and security context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ML' AND jurisdiction_type='country');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621234014','seed_briefings_africa_c','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621234014_seed_briefings_africa_c.sql

-- RECOVERY BEGIN 20260621234103_seed_briefings_africa_d.sql

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'mauritania','country','MR','Prohibited; Strict Islamic Law Influence',
'Cannabis is prohibited in Mauritania under a legal framework influenced by Islamic jurisprudence as well as civil drug laws. Penalties are severe. No medical cannabis program exists and no reform is under consideration.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Ministère de la Santé; security forces for enforcement.',
'Mauritanian drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'mauritius','country','MU','Prohibited; Strict Enforcement',
'Cannabis is prohibited in Mauritius under the Dangerous Drugs Act. Mauritius has historically maintained strict drug enforcement policies, with significant penalties including mandatory minimum sentences. Cannabis use is prevalent in some communities but enforcement is active. No medical cannabis program exists.',
'No legal patient access pathway exists. Mauritius''s strict drug laws leave no pathways for medical access.',
'Physicians cannot prescribe cannabis. No approved cannabis-based medicines are available through the Mauritius healthcare system.',
'No licensed market exists. The country''s financial services orientation has not included cannabis industry development.',
'Cannabis reform has been discussed in civil society but is not a current government priority. Mauritius''s legal framework may be influenced by Commonwealth peer developments, particularly the UK and Australia, but no near-term legislative action is anticipated.',
'Mauritius Drug Unit (MDU); Ministry of Health and Wellness.',
'Dangerous Drugs Act; Mauritius Drug Unit reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MU' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'morocco','country','MA','Medical and Industrial Legal (since 2021); Major Global Hashish Producer',
'Morocco is the world''s largest producer of cannabis resin (hashish) and passed Law 13-21 in 2021, ending 54 years of formal prohibition by legalizing cannabis for medical, industrial, and cosmetic purposes. The National Agency for the Regulation of Cannabis Activities (ANRAC) was established to license and regulate the sector. The Rif Mountain region, particularly around Ketama, has been the center of traditional hashish production for generations. The regulated program focuses on channeling existing cultivation into a licensed framework.',
'Domestic patient access to medical cannabis products is being developed. Patients will be able to access licensed medical cannabis through authorized healthcare channels as domestic production and distribution frameworks are operationalized.',
'Moroccan physicians are beginning to engage with the new medical cannabis regulatory framework. Clinical guidelines are being developed. Specialist access initially for neurological and pain conditions.',
'Morocco''s regulated cannabis sector has enormous scale potential given existing cultivation infrastructure. The Rif region''s tens of thousands of farming families and centuries of cultivation expertise are the base. Export licensing for medical and pharmaceutical cannabis to Europe and beyond is a primary policy goal. International investment in licensed Moroccan cannabis production has begun.',
'ANRAC is developing the full licensing and regulatory infrastructure. Export market access to the EU, requiring GMP certification, is the near-term industry priority. The transition from informal to formal production is a significant social and economic policy challenge in the Rif region. Morocco''s cannabis legalization is one of the most consequential in global regulatory history given scale.',
'ANRAC (Agence Nationale de Réglementation des Activités liées au Cannabis) under the Head of Government''s Office. Ministry of Health for medical product authorization.',
'Law 13-21 (2021); ANRAC implementing regulations; Ministry of Health guidance; traditional production region data','Current as of Q2 2026; verified against ANRAC official guidance','Quarterly','Full country-level briefing covering landmark 2021 legalization, world''s largest hashish production base, and regulated sector development',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'mozambique','country','MZ','Prohibited',
'Cannabis is prohibited in Mozambique. No medical cannabis program exists. Mozambique has not engaged in formal cannabis policy reform discussions at the legislative level.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'PRM (Polícia da República de Moçambique); Ministry of Health (MISAU).',
'Mozambique drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MZ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'namibia','country','NA','Decriminalized (Personal Use); Medical Access Under Development',
'Namibia''s High Court ruled in 2018 that private cannabis use and possession was not criminally unlawful, effectively decriminalizing personal use. The government has been developing a formal medical cannabis licensing framework since 2021. No licensed commercial market exists as of 2026, but Namibia is positioned as a progressive regional reformer with growing regulatory capacity.',
'No formal licensed patient access pathway exists yet, though the constitutional recognition of personal use provides implicit tolerance. Medical program licensing, when operational, will provide formal access.',
'Physicians are not yet able to formally prescribe cannabis under a regulated framework. Medical associations have engaged with the Ministry of Health on forthcoming regulatory frameworks.',
'No licensed commercial market exists. Namibia''s combination of decriminalization, suitable agricultural conditions, and a developing regulatory framework positions it for near-term licensed production.',
'Namibia is expected to operationalize medical cannabis licensing regulations in 2025–2027. The country''s stable governance and professional regulatory infrastructure make it a credible candidate for attracting cannabis investment. Export market orientation is expected.',
'Ministry of Health and Social Services (MoHSS); Namibia Police Force (NAMPOL) for enforcement.',
'High Court ruling 2018; MoHSS cannabis framework development; regional comparative monitoring','Current as of Q2 2026','Quarterly','Country-level briefing covering decriminalization ruling and pending medical licensing framework',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'niger','country','NE','Prohibited',
'Cannabis is prohibited in Niger. The country faces significant security challenges in the Sahel region affecting all governance functions. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority given the security situation. No legislative action is anticipated.',
'Direction de la Police Judiciaire; Ministère de la Santé Publique.',
'Niger drug laws; regional security monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'nigeria','country','NG','Prohibited; Medical Reform Under Active Consideration',
'Cannabis is prohibited in Nigeria under the NDLEA Act, with enforcement by the National Drug Law Enforcement Agency. However, Nigeria''s Senate has been actively reviewing medical cannabis legislation, with committee hearings and executive briefings occurring from 2020 onwards. As Africa''s largest economy and most populous nation, Nigeria''s entry into the medical cannabis market would have continental significance.',
'No formal patient access pathway currently exists. The prospect of a future medical program is contingent on pending legislation.',
'Physicians cannot prescribe cannabis under the current legal framework. Medical professionals and the Nigerian Medical Association have participated in policy consultations on potential medical programs.',
'No licensed market exists. Nigeria''s scale—200 million population, significant agricultural capacity, and growing pharmaceutical sector—makes it a potentially transformative African cannabis market if legislation passes. International cannabis companies have been engaging with Nigerian stakeholders in anticipation of regulatory change.',
'Nigeria is one of the most closely watched African jurisdictions for cannabis reform. Senate committee deliberations on medical cannabis have been substantive. Legislation is possible in the 2025–2027 period, though political consensus is not yet secured. If enacted, Nigeria could rapidly become Africa''s largest medical cannabis market.',
'NDLEA (National Drug Law Enforcement Agency); NAFDAC (National Agency for Food and Drug Administration and Control) for pharmaceutical matters.',
'NDLEA Act; NAFDAC regulatory framework; Senate cannabis committee proceedings; NigeriaCannabisBill developments','Current as of Q2 2026','Quarterly','Country-level briefing covering prohibition with active high-stakes medical reform process',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'republic-of-congo','country','CG','Prohibited',
'Cannabis is prohibited in the Republic of Congo. No medical cannabis program exists. The country''s oil-dependent economy has not engaged in cannabis policy reform.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Direction Générale de la Pharmacie, du Médicament et des Laboratoires; Gendarmerie Nationale.',
'Congo drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'rwanda','country','RW','Prohibited; Strict Enforcement',
'Cannabis is prohibited in Rwanda under strict drug laws. Rwanda''s government maintains a strong law enforcement approach to drug policy. No medical cannabis program exists and no reform is under active consideration.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. Rwanda''s enforcement-oriented governance approach makes near-term liberalization unlikely.',
'Rwanda Investigation Bureau (RIB); Ministry of Health (Rwanda FDA) for pharmaceutical matters.',
'Rwanda drug laws; RIB enforcement reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='RW' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'sao-tome-and-principe','country','ST','Prohibited',
'Cannabis is prohibited in São Tomé and Príncipe. The small island state has not engaged in cannabis policy reform. No medical program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Ministério da Saúde; Polícia Nacional for enforcement.',
'Drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ST' AND jurisdiction_type='country');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621234103','seed_briefings_africa_d','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621234103_seed_briefings_africa_d.sql

-- RECOVERY BEGIN 20260621234147_seed_briefings_africa_e.sql

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'senegal','country','SN','Prohibited',
'Cannabis is prohibited in Senegal under the Code des Drogues. Enforcement is active. Senegal has not engaged in formal cannabis policy reform at the legislative level. Civil society organizations have called for harm reduction approaches.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Office Central pour la Répression du Trafic Illicite de Stupéfiants (OCRTIS); Ministère de la Santé et de l''Action Sociale.',
'Code des Drogues; OCRTIS reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SN' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'sierra-leone','country','SL','Prohibited',
'Cannabis is prohibited in Sierra Leone. Post-conflict governance development has not included cannabis policy reform as a priority. No medical program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Sierra Leone Police; Ministry of Health and Sanitation.',
'Sierra Leone drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SL' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'somalia','country','SO','Prohibited; Governance-Limited Enforcement',
'Cannabis is prohibited in Somalia but enforcement is functionally minimal across much of the country due to ongoing conflict and the absence of effective central governance. Khat (qat) is widely used and significant in Somali culture. Cannabis prohibition is nominal in many areas.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Governance constraints prevent any licensed sector development.',
'Cannabis policy reform is not a realistic near-term prospect given Somalia''s governance situation. No legislative action is anticipated.',
'Federal Government of Somalia (where operational); Somali Police Force; Ministry of Health.',
'Somali drug laws; governance and security monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and governance limitations',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SO' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'south-africa','country','ZA','Private Use Decriminalized (Constitutional Court); Medical Licensed; Adult-Use Framework Pending',
'South Africa''s Constitutional Court ruled in 2018 (Prince v Minister of Justice) that prohibiting private adult cannabis use and cultivation was unconstitutional. This decriminalized personal use and home cultivation for adults. Medical cannabis has been regulated under Section 22C of the Medicines and Related Substances Act since 2017, with SAHPRA licensing cultivation, manufacturing, and research. A comprehensive Cannabis for Private Purposes Act was enacted in 2024 to codify private use rights. An adult-use commercial market framework is under development.',
'Adults may privately use and cultivate cannabis. Medical cannabis patients access products through SAHPRA-licensed channels with physician recommendations. Internationally licensed medical cannabis products are available through specialist pharmacies. The regulated adult-use retail market is expected to open once commercial licensing regulations are finalized.',
'Physicians registered with the HPCSA may recommend medical cannabis products through SAHPRA-licensed dispensing channels. General practitioners and specialists may recommend. The South African Society of Cannabis Clinicians provides professional guidance.',
'South Africa''s licensed cannabis sector spans cultivation, extraction, manufacturing, and research. Export-oriented producers target EU and UK markets. The domestic adult-use market, once commercially regulated, will be one of Africa''s largest by population. Investment from local and international operators is active. The Western Cape and Mpumalanga are key cultivation regions.',
'The commercial adult-use licensing framework is the most significant pending regulatory development. SAHPRA GMP inspections and compliance requirements for export producers are ongoing. South Africa''s cannabis economy has significant potential given its scale, infrastructure, and agricultural capacity. Cannabis tourism legislation may also develop.',
'SAHPRA (South African Health Products Regulatory Authority) for medical licensing and product authorization. Department of Health for policy. SAPS (South African Police Service) for enforcement. DALRRD (Department of Agriculture) for cultivation.',
'Cannabis for Private Purposes Act 2024; Medicines and Related Substances Act Section 22C; SAHPRA licensing regulations; Constitutional Court ruling Prince v Minister of Justice 2018','Current as of Q2 2026; verified against SAHPRA official guidance','Quarterly','Full country-level briefing covering constitutional decriminalization, medical licensing, and pending commercial adult-use framework',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ZA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'south-sudan','country','SS','Prohibited; Governance Challenges',
'Cannabis is prohibited in South Sudan. Ongoing governance challenges and periodic conflict have prevented coherent drug policy development. No medical cannabis program exists. Enforcement capacity is severely limited.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'South Sudan National Police Service; Ministry of Health.',
'South Sudan drug laws; governance monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and governance limitations',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SS' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'sudan','country','SD','Prohibited; Strict Penalties',
'Cannabis is prohibited in Sudan under the Drugs and Psychotropic Substances Control Act with severe penalties. Islamic-influenced drug law provides a strong prohibitionist framework. Political transitions have not brought cannabis policy reform. No medical program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. Sudan''s political and legal framework makes near-term liberalization unlikely.',
'Sudan Counter Narcotics Police; Ministry of Health.',
'Drugs and Psychotropic Substances Control Act; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SD' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'eswatini','country','SZ','Prohibited; Traditional Cultivation Prevalent',
'Cannabis is prohibited in Eswatini (formerly Swaziland) but traditional cultivation has occurred for generations, producing varieties known internationally as "Swazi Gold." Enforcement is inconsistent in rural areas. No medical cannabis program exists. No formal reform discussions are underway, though economic arguments for licensing existing traditional production have been made.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Traditional cultivation occurs informally. Economic arguments for formalizing the existing industry have been made in civil society.',
'The economic potential of formalizing traditional cannabis cultivation could be a future policy driver. No imminent legislative action has been announced.',
'Eswatini Royal Police Service; Ministry of Health.',
'Eswatini drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibition alongside traditional cultivation heritage',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SZ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'tanzania','country','TZ','Prohibited',
'Cannabis is prohibited in Tanzania under the Drug Control and Enforcement Act. Enforcement has been active under successive governments. No medical cannabis program exists. Tanzania has participated in African cannabis policy discussions at the academic level.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Agricultural potential for cannabis cultivation is noted given geographic and climate conditions.',
'Cannabis reform is not a current legislative priority. Tanzania''s enforcement-oriented approach makes near-term liberalization unlikely.',
'Drug Control and Enforcement Authority (DCEA); Ministry of Health.',
'Drug Control and Enforcement Act; DCEA annual reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TZ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'togo','country','TG','Prohibited',
'Cannabis is prohibited in Togo. No medical cannabis program exists. Togo has not engaged in cannabis policy reform discussions.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Office Togolais de la Lutte Contre la Drogue (OTLCD); Ministry of Health.',
'Togo drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'tunisia','country','TN','Prohibited; Controversial Mandatory Minimums',
'Cannabis is prohibited in Tunisia under Law 92-52, which imposes mandatory minimum prison sentences for cannabis possession that have been widely criticized by civil society, human rights organizations, and regional legal bodies. Even possession of small amounts can result in a one-year minimum sentence. Reform advocacy has been active. No medical cannabis program exists.',
'No legal patient access pathway exists. Tunisia''s mandatory minimum sentencing makes any informal therapeutic use legally very risky.',
'Physicians cannot prescribe cannabis. No approved cannabis-based medicines are available.',
'No licensed market exists.',
'Tunisia is a jurisdiction where reform advocacy is significant and internationally supported. Law 92-52 has been identified for reform by human rights bodies. Legislative change is politically contested but possible. Reform of mandatory minimums is the most likely near-term action rather than medical legalization.',
'Ministère de la Santé; Ministère de l''Intérieur for enforcement.',
'Law 92-52 (1992); UNODC Tunisia reports; human rights monitoring','Current as of Q2 2026','Quarterly','Country-level briefing covering prohibition with significant reform advocacy context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TN' AND jurisdiction_type='country');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621234147','seed_briefings_africa_e','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621234147_seed_briefings_africa_e.sql

-- RECOVERY BEGIN 20260621234246_seed_briefings_africa_f.sql

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'uganda','country','UG','Prohibited',
'Cannabis is prohibited in Uganda under the Narcotic Drugs and Psychotropic Substances (Control) Act. Enforcement is active. No medical cannabis program exists. Uganda has not engaged in formal cannabis policy reform discussions.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Uganda''s fertile agricultural land has been noted for potential cannabis cultivation if regulation changes.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'National Drug Authority (NDA); Uganda Police Force Anti-Narcotics Unit.',
'Narcotic Drugs and Psychotropic Substances (Control) Act; NDA reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='UG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'zambia','country','ZM','Prohibited',
'Cannabis is prohibited in Zambia under the Narcotic Drugs and Psychotropic Substances Act of 1993. No medical cannabis program exists. Zambia has not engaged in formal cannabis policy reform discussions, though its neighbor Zimbabwe''s 2018 legalization has been noted in policy circles.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Zambia''s agricultural capacity and stable governance could make it a future cannabis market if reform occurs.',
'Zimbabwe''s medical cannabis program may create regional pressure for Zambia to consider reform. No near-term legislative action is anticipated.',
'Drug Enforcement Commission (DEC); Ministry of Health (Zambia Medicines Regulatory Authority, ZAMRA).',
'Narcotic Drugs and Psychotropic Substances Act 1993; DEC annual reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ZM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'zimbabwe','country','ZW','Medical Legal; Pioneer Sub-Saharan Africa',
'Zimbabwe became one of sub-Saharan Africa''s first countries to legalize medical cannabis in 2018 through the Dangerous Drugs and Controlled Substances (General) Regulations (SI 62 of 2018). The Medicines Control Authority of Zimbabwe (MCAZ) licenses cultivation, processing, and export of medical cannabis. Zimbabwe''s program is primarily export-oriented, with Zimbabwean-produced cannabis targeting European pharmaceutical markets.',
'Domestic patient access to medical cannabis products is limited. The program''s primary focus is on cultivating and processing cannabis for international medical markets. Local medical access pathways are developing.',
'Zimbabwean physicians are not yet widely able to access domestic clinical cannabis products. Medical access frameworks for local patients are being developed alongside the export sector.',
'Zimbabwe''s medical cannabis sector has attracted investment from international cannabis companies establishing licensed growing operations. Zimbabwe''s fertile agricultural land, skilled farming workforce, and established export infrastructure (tobacco) provide a strong foundation. EU GMP compliance for export access is a primary focus.',
'The MCAZ licensing framework continues to be refined. Domestic medical access program development is anticipated alongside continued export market expansion. Zimbabwe''s position in southern Africa and agricultural infrastructure makes it a significant long-term player.',
'MCAZ (Medicines Control Authority of Zimbabwe) under the Ministry of Health and Child Care.',
'SI 62 of 2018 (Dangerous Drugs and Controlled Substances Regulations); MCAZ licensing registry and guidance; Ministry of Health cannabis policy','Current as of Q2 2026; verified against MCAZ official guidance','Quarterly','Full country-level briefing covering pioneer medical cannabis legalization and export-oriented market',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ZW' AND jurisdiction_type='country');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621234246','seed_briefings_africa_f','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621234246_seed_briefings_africa_f.sql
