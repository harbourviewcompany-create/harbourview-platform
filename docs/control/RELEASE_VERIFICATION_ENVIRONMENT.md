# Protected release-verification environment

The manual immutable release workflow is fail-closed unless GitHub contains an
environment named exactly `release-verification`.

Required controls:

- Deployment branches and tags: protected `main` only.
- Required reviewers: at least one repository administrator/operator who did not
  author the audited commit.
- Environment secrets: `VERCEL_TOKEN` and
  `VERCEL_AUTOMATION_BYPASS_SECRET` only.
- No Supabase service-role key, database URL, payment credential, or unrelated
  production secret.
- Prevent self-review where supported.
- Do not bypass environment approval for reruns.

The workflow also checks `github.ref == refs/heads/main`, verifies that the
audited SHA is already an ancestor of protected `main`, validates immutable
Vercel deployment metadata with trusted `main` code, disables Playwright trace
capture, removes HAR/ZIP network archives before artifact upload, and validates
every redirect before forwarding the Vercel protection-bypass header.

If the environment is absent, misnamed, unrestricted, or missing approval, the
release-verification jobs must not be treated as passing evidence.
