-- Recovery Data API parity with Harbourview's documented production contract.
-- Repository code pins most supabase-js clients to schema "api".
alter role authenticator set pgrst.db_schemas = 'public, graphql_public, job_search, api';
notify pgrst, 'reload config';
notify pgrst, 'reload schema';