-- Implements is_signal_admin() which was a placeholder (always returned false).
-- Now checks user_roles table which was created in 20260313000000_relationship_intelligence_v1.sql

CREATE OR REPLACE FUNCTION is_signal_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'operator')
  );
$$;

COMMENT ON FUNCTION is_signal_admin() IS
  'Returns true if the authenticated user has admin or operator role. Used in signal engine RLS policies.';
