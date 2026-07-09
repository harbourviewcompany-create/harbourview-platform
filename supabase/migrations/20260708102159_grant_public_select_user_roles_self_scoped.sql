-- education_modules has TWO RLS policies (public-published + admin-all-via-user_roles-
-- lookup). Postgres must be able to evaluate both permissive policies for a SELECT,
-- which means the anon/authenticated role needs base SELECT privilege on user_roles
-- too, even though the public policy doesn't logically need it -- otherwise the whole
-- query fails at the privilege-check stage before RLS row-filtering ever runs.
-- Safe to grant: user_roles' own RLS policy (user_roles_self_read) already restricts
-- every role to `user_id = auth.uid()` -- an authenticated user can only ever see their
-- own single row, anon sees zero rows (no auth.uid()). No cross-user exposure.
grant select on public.user_roles to anon, authenticated;
