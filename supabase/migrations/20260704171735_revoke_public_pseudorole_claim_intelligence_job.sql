-- Follow-up to close_public_schema_default_acl_leak: that migration
-- revoked from the *named* roles anon/authenticated, which fixed
-- enqueue_regulatory_enrichment and get_command_centre_stats. But
-- public.claim_intelligence_job's leak is a different, older
-- mechanism — an explicit grant to the PUBLIC pseudo-role itself
-- (proacl showed '=X/postgres', the empty-grantee-name ACL entry
-- that denotes PUBLIC), predating the project's default-ACL rule.
-- Revoking from named roles doesn't touch a PUBLIC-pseudo-role grant;
-- this needs the pseudo-role-targeted form specifically.
revoke all on function public.claim_intelligence_job(text, text) from public;
