# Global Regulatory OS Phase 0 Replacement Package

## Controlling source

- Archive: `source/global-cannabis-regulatory-os-control-pack-v1.0.zip`
- SHA-256: `33a1b3de6f295aaeaf61017937a21b364bac7c0600f4038706013cb6b47cd136`
- Original manifest SHA-256: `e3d4f2303abbb4271e91e27fcadeef1cac37fc7469fb361618f0893218814146`

The archive bytes are committed directly and validated before the canonical tree is trusted. The canonical package is materialized as normal source files under `canonical/`; multipart Base64 is not used.

## Authorization correction

The source package's client-settable `app.*` identity GUCs are replaced by a transaction-scoped trusted context. `hv_authenticator` establishes the context from a verified external subject, runtime roles are NOLOGIN, and negative escalation tests prove runtime identities cannot forge subject, tenant or platform roles.

## Release boundary

Repository-level technical validation may reach GO. Production migration, public publication, deployment, policy ratification and regulated activity remain separately authorized operator decisions. Canonical migrations remain isolated from `supabase/migrations`.
