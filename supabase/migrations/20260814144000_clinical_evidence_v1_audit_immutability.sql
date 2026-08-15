-- Clinical Evidence V1 audit-history immutability hardening.
-- Publication versions are append-only evidence of what the public projection showed.

create or replace function public.clinical_publication_version_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  raise exception 'Clinical publication versions are immutable; append a new version instead';
end;
$function$;

revoke all on function public.clinical_publication_version_immutable() from public;

drop trigger if exists trg_clinical_publication_version_immutable
  on public.clinical_evidence_publication_versions;
create trigger trg_clinical_publication_version_immutable
before update or delete on public.clinical_evidence_publication_versions
for each row execute function public.clinical_publication_version_immutable();

comment on table public.clinical_evidence_publication_versions is
  'Private append-only immutable history of public Clinical evidence projections.';
