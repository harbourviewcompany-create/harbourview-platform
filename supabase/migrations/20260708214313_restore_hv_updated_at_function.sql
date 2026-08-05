-- Production's shared Harbourview updated-at trigger function existed out of band
-- before the restored HV artifact relations. Restore its exact live definition so
-- zero-state replay can install the production triggers without reordering tables.

create or replace function public.hv_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;
