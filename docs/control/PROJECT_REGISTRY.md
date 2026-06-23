---
# Add this section or update existing Marketplace / Supplier section

## Supplier Directory

| Area | Routes / Tables | Status |
|------|------------------|--------|
| Public | `/supplier-directory`, `/supplier-directory/apply`, `/supplier-directory/[slug]` | Active (Phase 0 complete) |
| Data | `supplier_profiles` | Active — RLS: public read (active + verified), service write |
| Intake | Server action + form | Complete |
| Admin | Pending review flow (via applicationsQuery) | Partial — align status to 'pending' if needed |

---