alter table public.professional_service_providers
  rename to professional_service_provider_listings;

alter index professional_service_providers_status_category_idx
  rename to professional_service_provider_listings_status_category_idx;

create or replace view api.professional_service_providers
with (security_invoker = true)
as
select id, category, name, description, markets_covered, website, created_at
from public.professional_service_provider_listings
where status = 'approved';

grant select on api.professional_service_providers to anon, authenticated;

create or replace view api.professional_service_provider_applications
with (security_invoker = true)
as select * from public.professional_service_provider_listings;

grant insert on api.professional_service_provider_applications to authenticated;

notify pgrst, 'reload schema';
