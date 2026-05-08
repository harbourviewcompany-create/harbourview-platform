revoke all on table public.user_roles from anon;
revoke all on table public.user_roles from authenticated;

grant select on table public.user_roles to authenticated;

comment on table public.user_roles is 'Internal Harbourview role assignments for admin provenance access. Grants are intentionally limited to authenticated SELECT with RLS self-read policy; anon has no table privileges.';
