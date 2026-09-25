-- Partial unique index: one application per authenticated user per opportunity
create unique index if not exists talent_applications_user_opportunity_uidx
  on public.talent_applications (opportunity_id, user_id)
  where user_id is not null;
