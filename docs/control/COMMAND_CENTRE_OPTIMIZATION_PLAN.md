# Command Centre — Full Sub-Tab Optimization Plan

**Last updated:** 2026-09-17  
**Surfaces:** Mobile Command (`MobileCommandCentreRebuild` + `mobile-command/*`) and Desktop Command (`CommandCentre.tsx` ~657KB monolith).

---

## Inventory (mobile is canonical structure)

### Primary nav (bottom)
| ID | Label | Role |
|----|-------|------|
| overview | Command | Operator home |
| marketplace | Market | Commercial control |
| weekly-signals | Intel | Decision signals |
| next-actions | Actions | What to do next |

### Section groups → sub-tabs

**Command (overview group)**  
overview · genetics · talent · clinical · compliance · education · network · jurisdiction · settings

**Market (marketplace group)**  
marketplace · supply · market-status · market-intelligence · deal-rooms

**Intel (weekly-signals group)**  
weekly-signals · personal-briefing · regulatory · local-intel · search

**Actions (next-actions group)**  
next-actions · review-gates · financing

Desktop maps via `SECTION_TO_DESKTOP_PAGE` / `PAGE_TO_SECTION` in `mobile-command/contracts.ts`.

---

## Live vs static (trust critical)

| Area | Status | Notes |
|------|--------|-------|
| Signals / weekly-signals | **Live** | Via dashboard props + quality layer |
| Marketplace / supply | **Live** | Public listings DTOs |
| Jurisdiction / country intel | **Live** | countryIntel + playbooks |
| Corridor expand data | **Live** | `/api/corridors/data` + RPCs |
| Personal briefing | **Live** | Cadence + synthesis |
| Banking / insurance / logistics providers | **Static reference** | `components/dashboard/data/*` |
| Jobs board / industry events | **Static reference** | No backing table |
| Price benchmarks (desktop) | **Static + optional cross-check** | See PRICE_CROSSCHECK_SPEC |
| Landed cost static tables | **Static reference** | Tool workspace has live calc path |

**Rule:** Never present static provider lists as live marketplace intelligence. Label as "Reference".

---

## Optimization tracks

### Track A — Trust & data honesty (P0)
1. Badge every section: Live / Reference / Mixed  
2. Surface `corridor_regulatory_alerts` as first-class feed  
3. Signals only via `quality_confidence` (never inverted `score`)  
4. Empty states that say *why* empty (no reviewed signals vs loading)

### Track B — Performance (P0 desktop)
1. Split `CommandCentre.tsx` by domain (compliance, genetics, deals, marketplace, corridor, education)  
2. Route-level or `React.lazy` load non-active desktop pages  
3. Keep mobile as the modular reference architecture

### Track C — Sub-tab product quality (P1)
| Sub-tab | Optimize |
|---------|----------|
| overview | Attention queue from real next-actions + signal posture |
| weekly-signals | Jurisdiction-first sort (done); dossier CTA; corroboration chips |
| personal-briefing | Wire cadence prefs + Meltwater-fresh signals |
| marketplace | Inventory-first; media status; clear review states |
| supply | Same projection as marketplace supply tabs |
| regulatory | Watch rules + corpus; hit counts |
| jurisdiction | Pathway steps only when non-generic |
| clinical | Session/service-role evidence path |
| genetics | Passport modal + live catalog |
| education | Role-aware modules |
| financing | Prefer tools (corridor-plan, landed-cost) over static bank lists |
| network | Counts from live props; no fake directories |
| deal-rooms | Live panel only |
| search | Semantic search + local index |
| settings | Subscription truth only |

### Track D — IA / entitlements (P1)
1. One tier vocabulary (`billing/entitlements` vs regulatory gates vs per-report)  
2. Country funnel indicator (directory → brief → preview → dashboard)  
3. Upgrade gates consistent across intel dossiers

---

## Suggested PR sequence

1. **This PR slice:** Section data-source badges + plan doc + briefing confidence normalize  
2. Desktop lazy-load of heaviest pages (signals, marketplace, genetics) without full file split  
3. Corridor alerts feed panel  
4. Monolith split (sequenced, one domain per PR)  
5. Static panel data decisions (table vs maintain-as-reference)

---

## Definition of done for Command

- Operator can answer in <30s: *What changed in my market? What should I do? What can I transact?*  
- Every panel is either live or explicitly labeled Reference  
- Mobile and desktop share the same section → page mapping  
- Bundle does not force genetics/deals code on overview-only sessions  
