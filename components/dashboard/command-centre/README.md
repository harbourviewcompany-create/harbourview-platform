# Command Centre modular layout

- `../CommandCentre.tsx` — thin re-export (types + default)
- `types.ts` — CommandPage / MarketView / MarketRow
- `navConfig.ts` — NAV_SECTIONS + BRIEFING_ROLE_MODULES (Clinical for Doctor / Pharmacist / Clinic Op.)
- `sharedHelpers.tsx` — cross-page helpers (derive*, CustomSelect, build*)
- `CommandCentreRoot.tsx` — shell, state, page switch (clinical → ClinicalCommandCase)
- `pages/bundleA.tsx` — BriefingRoom → SettingsPage
- `pages/bundleB.tsx` — LocalIntel → GeneticsPage
- `pages/bundleC.tsx` — Compliance → EventsPage

Desktop clinical tab embeds ClinicalWorkspacePage via ClinicalCommandCase (same as mobile).
