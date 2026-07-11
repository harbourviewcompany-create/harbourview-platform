-- Same bug class as the earlier fixes: buyer_requests_public_read policy
-- (status = 'approved', roles anon+authenticated) exists and is correctly
-- scoped, but the base-table grant was never applied. This is a live,
-- actively-used table (marketplace match engine, admin promote flow), so
-- this was silently blocking the public "browse buyer requests" read path.

GRANT SELECT ON public.buyer_requests TO anon, authenticated;
