# Admin login API security requirements

`/api/admin/login` enforces request-origin and CSRF checks for state-changing methods.

## `POST /api/admin/login` and `DELETE /api/admin/login`

Required headers/cookies:

- `Origin` (preferred) or `Referer` with an origin matching one of:
  - `NEXT_PUBLIC_SITE_URL` values (comma-separated), or
  - the API request origin (`request.nextUrl.origin`) fallback.
- `x-csrf-token` header.
- `hv_admin_csrf` cookie with the same value as the `x-csrf-token` header.

Failure responses:

- `403 { "error": "Forbidden: invalid origin" }` when `Origin`/`Referer` is missing or not allowed.
- `403 { "error": "Forbidden: invalid CSRF token" }` when CSRF header/cookie is missing or values do not match.

## `GET /api/admin/login`

Call this first from the admin login UI to initialize the CSRF cookie.

Response includes:

- `csrfHeader` (`x-csrf-token`)
- `csrfCookie` (`hv_admin_csrf`)
- `requiredFor` (`["POST", "DELETE"]`)

The response also sets the `hv_admin_csrf` cookie.
