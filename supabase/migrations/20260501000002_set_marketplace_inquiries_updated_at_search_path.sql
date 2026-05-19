-- Gate 7.1: Pin search_path for marketplace inquiry updated_at trigger.

create or replace function public.set_marketplace_inquiries_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
