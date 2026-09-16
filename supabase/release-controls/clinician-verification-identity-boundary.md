# Clinician verification identity boundary

`public.is_verified_clinician(uuid)` and its `api` wrapper are SECURITY DEFINER authorization helpers.

For authenticated callers, the requested user ID must match `auth.uid()`; otherwise the helper returns false. This prevents verification-status probing for arbitrary user IDs.

Trusted service-role callers retain explicit-user lookup semantics for backend workflows.

Production migration: `20260916174135_tighten_clinician_verification_identity_boundary`.
