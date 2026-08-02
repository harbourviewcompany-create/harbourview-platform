# Supabase migration-ledger verification

## Trust model

The release-verification workflow does **not** receive a production database URL,
password, service-role key, or SQL-capable credential. PostgreSQL `NOINHERIT` and
`default_transaction_read_only` do not remove privileges inherited from the
`PUBLIC` pseudo-role and therefore do not establish a reliable least-privilege
identity in a database that contains callable `SECURITY DEFINER` functions.

An operator exports only migration metadata—`version` and `name`—from the target
ledger through an already-approved administrative channel. The sanitized JSON
snapshot is reviewed and committed on the protected-main release branch. The
manual workflow receives only its repository-relative path, validates the shape,
projects every row back to the approved fields, rejects error responses and
duplicate versions, and compares it with migration files from an audited commit
that is already an ancestor of protected `main`.

Example approved snapshot:

```json
[
  { "version": "20260731130000", "name": "elite_digest_release_hardening" }
]
```

The snapshot must not contain SQL bodies, database connection data, role names,
owner metadata, timestamps, error payloads, or arbitrary extra fields. The
comparison script projects input rows to `{version, name}` before generating its
30-day evidence artifact.

## Execution isolation

- Verification code is always checked out from protected `main`.
- The audited commit is checked out into a separate directory and treated as
  data only.
- The audited SHA must be a 40-character commit already contained in protected
  `main`.
- No executable file from the audited checkout runs with a repository or
  production secret.
- Evidence artifacts contain migration filenames, hashes and classifications,
  but no database credential, SQL body, leaked provider payload, or secret value.

## Canonical body hashes

Supabase migration history does not expose SQL bodies. Optional reviewed
canonical hashes may be stored in a separate versioned JSON file in the audited
commit. That file may contain only `version`, `name`, and a 64-character
`sha256`. Without such a file, a version/name match remains
`version-name-match-body-unverified`; it is never represented as a body match.
