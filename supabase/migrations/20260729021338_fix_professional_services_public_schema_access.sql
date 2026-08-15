create or replace view public.professional_service_providers_public
with (security_invoker = true)
as
select id, category, name, description, markets_covered, website, created_at
from public.professional_service_provider_listings
where status = 'approved';

grant select on public.professional_service_providers_public to anon, authenticated;
