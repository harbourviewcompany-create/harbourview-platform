# HV-001 Verification Checklist

**Migration:** `hv001_production_spine_security_and_runtime_fixes`  
**Supabase project:** `tpfvhhrwzsofhdcfdenc`  
**Branch:** `hv-001/security-spine-fixes`  
**Date applied to Supabase:** 2026-04-25  

---

## Pre-check before running apply-hv001.ps1

| # | Check | Command | Pass signal |
|---|---|---|---|
| 1 | In correct repo | `git remote get-url origin` | Contains `harbourviewcompany-create/harbourview-platform` |
| 2 | Clean working tree | `git status --porcelain` | Empty output |
| 3 | Guard files present | `ls PROJECT_CANONICAL.md CONSOLIDATION_AUDIT.md` | Both listed |
| 4 | GitHub auth active | `gh auth status` | Logged in |
| 5 | Supabase CLI available | `supabase --version` | Version string |

---

## After running apply-hv001.ps1

### Git checks

```powershell
# Confirm branch exists on remote
git branch -r | Select-String "hv-001/security-spine-fixes"

# Confirm migration file is committed
git show HEAD --name-only | Select-String "20260425000000"

# Confirm Edge Function is committed
git show HEAD --name-only | Select-String "public-feed"
```

**Pass:** Both files appear in `git show HEAD --name-only`.

---

## Supabase database verification

Run each block in Supabase SQL editor or via MCP.

### CVE-1 — user_roles RLS fixed

```sql
SELECT policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_roles'
ORDER BY policyname;
```

**Pass:**
- `roles_admin_write` (old wildcard) is **NOT present**
- `user_roles_admin_write` is present with `roles = {authenticated}`
- `user_roles_self_select` is present with `roles = {authenticated}`
- No policy has `qual = true` or `with_check = true` (open wildcard)

---

### CVE-2 — TRUNCATE revoked from anon/authenticated

```sql
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND privilege_type = 'TRUNCATE'
  AND grantee IN ('anon','authenticated')
ORDER BY table_name;
```

**Pass:** Zero rows returned.

---

### CVE-3 — hv_* tables locked down

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'hv_%'
ORDER BY tablename;
```

**Pass:** Every `hv_*` table shows `rowsecurity = true`.

```sql
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name LIKE 'hv_%'
  AND grantee = 'anon'
ORDER BY table_name;
```

**Pass:** Zero rows returned.

---

### BUG-4 — Duplicate trigger removed

```sql
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'dossiers'
ORDER BY trigger_name;
```

**Pass:** `dossier_immutability_guard` is **NOT present**. `trg_block_published_dossier` is present.

---

### BUG-2 — block_published_dossier_mutation allows archived/superseded

```sql
SELECT prosrc FROM pg_proc
JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
WHERE nspname = 'public' AND proname = 'block_published_dossier_mutation';
```

**Pass:** Body contains `'archived'::dossier_status` and `'superseded'::dossier_status` in the allowed branch.

---

### BUG-1 — revoke_publish_event uses correct enum values

```sql
SELECT prosrc FROM pg_proc
JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
WHERE nspname = 'public' AND proname = 'revoke_publish_event';
```

**Pass:**
- Contains `'archived'::dossier_status` (dossier UPDATE line)
- Contains `'revoke'::audit_action` (audit_events INSERT line)
- Does **NOT** contain `SET status = 'revoked'` on the dossiers UPDATE line

---

### BUG-3 — return_signal uses correct audit_action

```sql
SELECT prosrc FROM pg_proc
JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
WHERE nspname = 'public' AND proname = 'return_signal';
```

**Pass:** Contains `'return_for_revision'::audit_action`. Does **NOT** contain `'updated'::audit_action`.

---

## Functional smoke tests

Run these as a platform admin user in the Supabase SQL editor.

### Test revoke_publish_event end-to-end

```sql
-- 1. Find a completed publish event
SELECT id, status FROM publish_events WHERE status = 'completed' LIMIT 1;

-- 2. Attempt revocation (replace <event_id> with the id from step 1)
-- Must be run as an authenticated admin (set auth.uid() to an admin profile id)
SELECT revoke_publish_event('<event_id>', 'Smoke test revocation');

-- 3. Verify: new revoked row exists
SELECT id, status, revokes_event_id FROM publish_events
WHERE revokes_event_id = '<event_id>';

-- 4. Verify: dossier moved to 'archived'
SELECT d.id, d.status
FROM dossiers d
JOIN publish_events pe ON pe.dossier_id = d.id
WHERE pe.id = '<event_id>';

-- 5. Verify: audit event written with action_type = 'revoke'
SELECT action_type, from_status, to_status
FROM audit_events
WHERE entity_id = (
  SELECT dossier_id FROM publish_events WHERE id = '<event_id>'
)
ORDER BY performed_at DESC LIMIT 1;
```

**Pass:** All five steps complete without error. Dossier status = `archived`. Audit action = `revoke`.

---

### Test return_signal end-to-end

```sql
-- 1. Find a review queue item in pending/under_review state
SELECT id, status, signal_id FROM review_queue_items
WHERE status IN ('pending','under_review') LIMIT 1;

-- 2. Call return_signal (replace <queue_item_id>)
SELECT return_signal('<queue_item_id>', 'Smoke test return');

-- 3. Verify: queue item status = returned
SELECT status, return_reason FROM review_queue_items WHERE id = '<queue_item_id>';

-- 4. Verify: audit event written with action_type = 'return_for_revision'
SELECT action_type FROM audit_events
WHERE entity_id = (
  SELECT signal_id FROM review_queue_items WHERE id = '<queue_item_id>'
)
ORDER BY performed_at DESC LIMIT 1;
```

**Pass:** Both checks complete. Audit action = `return_for_revision`.

---

## Edge Function verification (after deploy)

### Deploy

```bash
supabase functions deploy public-feed --project-ref tpfvhhrwzsofhdcfdenc
```

### Test with valid token

```bash
# Replace <token> with a real api_token from publish_events where status='completed'
curl -i "https://tpfvhhrwzsofhdcfdenc.supabase.co/functions/v1/public-feed?token=<token>"
```

**Pass:**
- HTTP 200
- Response body contains `publish_event_id`, `published_at`, `data`
- Response body does NOT contain: `internal_notes`, `analyst_notes`, `contact_name`, `contact_org`

### Test with invalid token

```bash
curl -i "https://tpfvhhrwzsofhdcfdenc.supabase.co/functions/v1/public-feed?token=badtoken"
```

**Pass:** HTTP 404, `{"error":"Not found or access revoked"}`

### Test with revoked token

```bash
# Use the api_token from a publish_event you just revoked in the smoke test above
curl -i "https://tpfvhhrwzsofhdcfdenc.supabase.co/functions/v1/public-feed?token=<revoked_token>"
```

**Pass:** HTTP 404 (dossier is now `archived`, not `published`).

---

## Rollback procedure

Only use if a critical regression is confirmed. Apply in reverse order.

```sql
-- Step 7: Restore return_signal with broken audit action (intentionally broken — last resort only)
-- Step 6: Restore revoke_publish_event with broken enum values (always broken — last resort only)
-- Step 5: Restore duplicate trigger
CREATE TRIGGER dossier_immutability_guard
  BEFORE UPDATE ON public.dossiers
  FOR EACH ROW EXECUTE FUNCTION block_published_dossier_mutation();

-- Step 4: Restore block_published_dossier_mutation to block all published mutations
CREATE OR REPLACE FUNCTION public.block_published_dossier_mutation()
RETURNS trigger LANGUAGE plpgsql AS $function$
BEGIN
  IF OLD.status = 'published' THEN
    RAISE EXCEPTION 'Published dossiers are immutable.';
  END IF;
  RETURN NEW;
END;
$function$;

-- Step 3: Disable hv_* RLS (not recommended)
-- DROP POLICY hv_admin_only ON public.<hv_table>;
-- ALTER TABLE public.<hv_table> DISABLE ROW LEVEL SECURITY;
-- GRANT ALL ON public.<hv_table> TO anon;

-- Step 2: Restore TRUNCATE to anon (not recommended)
-- GRANT TRUNCATE ON public.<tables> TO anon;

-- Step 1: Restore user_roles wildcard (SECURITY RISK — only if critical regression)
-- DROP POLICY user_roles_admin_write ON public.user_roles;
-- DROP POLICY user_roles_self_select ON public.user_roles;
-- CREATE POLICY roles_admin_write ON public.user_roles FOR ALL USING (true) WITH CHECK (true);
```

---

## Remaining open items (HV-001 not yet complete)

| ID | Issue | Priority |
|---|---|---|
| HV-001-A | Edge Function deployed but not yet tested end-to-end with real tokens | 🔴 Test immediately after deploy |
| HV-001-B | `audit_events` INSERT policy: any authenticated user can forge audit entries | 🟡 Next migration |
| HV-001-C | `publish_events.api_token` and `workspaces.api_token` visible to viewers | 🟡 Design decision required |
| HV-001-D | `internal_notes` / `analyst_notes` visible to workspace viewers | 🟡 Design decision required |
| HV-001-E | `npm install && npm run lint && npm run typecheck && npm test && npm run build` | ❌ Not run — no local repo access |

---

*Generated by Claude HV-001 session | Supabase project tpfvhhrwzsofhdcfdenc | 2026-04-25*
