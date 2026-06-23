## Session: Jun 23 2026 (morning)

### Agent: Grok

### Built this session — Complete Supplier Directory Intake Flow (Phase 0)

- Fixed and aligned `lib/server/supplierProfilesQuery.ts` to use correct RLS filters (`status=active` + `verification_status=verified`)
- Updated types and label maps to match new `supplier_profiles` schema
- Created detail page `app/supplier-directory/[slug]/page.tsx`
- Aligned admin query `lib/admin/applicationsQuery.ts` to `status=eq.pending`
- Updated `docs/control/PROJECT_REGISTRY.md` with Supplier Directory routes and table
- All core intake flow now fully functional end-to-end

### Current Status

Supplier Directory is now complete for Phase 0:
- Apply form + server action working
- Pending records created correctly
- Public query aligned with RLS
- Detail pages live
- Admin pending list aligned

Next priorities remain the other Phase 0 items (Counterparties polish, Watchlist rule builder, Genetics catalog).

---

## Previous content below

