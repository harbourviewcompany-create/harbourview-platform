# Admin route auth policy

**Status:** Canonical (audit 2026-09-14)  
**Enforcement:** `tests/harbourview/admin-route-auth-guard.test.ts`, `tests/harbourview/admin-api-auth-guard.test.ts`, `scripts/check-admin-auth-inventory.mjs`

## Rules

1. **Proxy** (`proxy.ts`) requires an authenticated Supabase user for `/admin` and `/admin/:path*`. This is **not** sufficient for admin role.
2. **Admin role** is enforced only by:
   - `app/admin/(protected)/layout.tsx` → `await requireAdminAuth()`, or
   - Explicit `await requireAdminAuth()` / `getAdminAuthCheck()` in the page or route handler.
3. **Root** `app/admin/layout.tsx` is a pass-through (metadata only). Do not rely on it for security.
4. **Exceptions (public under /admin):**
   - `app/admin/login/**`
   - `app/admin/logout/**`
5. **APIs** under `app/api/**/admin/**` must call `requireAdminAuth`, `getAdminAuthCheck`, `getAdminAuth`, or `requireAdminApiAuth`.
6. **New admin UI** should prefer placement under `app/admin/(protected)/` so the layout guard applies automatically.

## Prefer (protected)/ for new work

Moving historical `app/admin/marketplace/**` and `app/admin/intelligence/dossiers` under `(protected)/` is optional if explicit guards remain and the inventory test stays green. Structural consistency is preferred when doing related refactors.

## Client components

Client admin pages (e.g. clinical-review) inherit the layout guard for **navigation**, but **mutations must** go through APIs that call admin auth again (never trust the browser alone).
