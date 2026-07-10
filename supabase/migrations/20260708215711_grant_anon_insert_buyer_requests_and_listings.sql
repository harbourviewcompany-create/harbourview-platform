-- Same root cause as the supplier_profiles fix earlier: RLS policy exists for
-- anon INSERT, but the base-table GRANT was never applied, so submissions fail
-- at the permission-check layer before RLS is even evaluated.

GRANT INSERT ON public.buyer_requests TO anon;
GRANT INSERT ON public.listings TO anon;