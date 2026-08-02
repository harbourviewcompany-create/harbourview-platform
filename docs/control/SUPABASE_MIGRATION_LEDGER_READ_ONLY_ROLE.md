# Supabase migration-ledger verification

## Trust model

The release-verification workflow does **not** receive a production database URL,
password, service-role key, or SQL-capable credential. PostgreSQL `NOINHERIT` and
`default_transaction_read_only` do not remove privileges inherited from the
`PUBLIC` pseudo-role and therefore do not establish a reliable least-privilege
identity in a database that contains callable `SECURITY DEFINER` functions.

The operator exports only migration metadata—`version` and `name`—from the target
ledger through an already-approved administrative channel. The JSON is base64
encoded and supplied as a manual workflow input. The workflow validates the
shape, rejects error responses and duplicate versions, and compares the metadata
with the files from an audited commit that is already an ancestor of protected
`main`.

Example export shape:

```json
[
  { "version": "20260731130000", "name": "elite_digest_release_hardening" }
]
```

Encode the compact JSON without storing it in the repository:

```bash
base64 -w 0 supabase-migrations.json
```

## Execution isolation

- Verification code is always checked out from the trusted workflow revision.
- The audited commit is checked out into a separate directory and treated as
  data only.
- The audited SHA must be a 40-character commit already contained in protected
  `main`.
- No executable file from the audited checkout runs with a repository or
  production secret.
- Evidence artifacts contain migration filenames, hashes and classifications,
  but no database credential or secret value.

## Canonical body hashes

Supabase migration history does not expose SQL bodies. Optional reviewed
canonical hashes may be stored in a versioned JSON file in the audited commit.
Without such a file, a version/name match remains
`version-name-match-body-unverified`; it is never represented as a body match.
