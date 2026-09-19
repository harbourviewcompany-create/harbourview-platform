# Platform Optimization Program

Last updated: 2026-09-19

## Shipped in this program

| Area | Status | Notes |
|------|--------|--------|
| Command shell modularization | Partial / ongoing | Desktop pages + trust chrome; monolith still present on some branches |
| Pipeline health API | Shipped | `GET /api/dashboard/pipeline-health` |
| Briefing priority actions | Shipped | Role playbook + defaults fallback |
| Briefing marketplace funnel | Shipped | Listings / wanted / inquiry / deal room |
| Signal provenance | Shipped | Source + when + freshness basis |
| Signal deep-links | Shipped | Watchlist / Regulatory / Marketplace |
| Role-default home page | Shipped | `lib/dashboard/roleCommandDefaults.ts` |
| Pipeline SLO helpers | Shipped | `lib/dashboard/pipelineSlo.ts` |
| CI Command Centre smoke | Shipped |
| Marketplace funnel conversion rates | Shipped | contact / qualify / conversion via API |
| Briefing action urgency + deadlines | Shipped | from signal analysis.deadline + confidence |
| Coverage map (domain grid) | Shipped | baseline live/mixed/reference chips | `tests/dashboard/command-centre-smoke.test.ts` |

## Still required (not fully automated in UI)

### Commercial loop
- Persist inquiry outcomes (won/lost/reason) and surface conversion rates
- Enforce response SLA timers on deal rooms
- KYB as hard gate before certain reveal levels

### Clinical OS
- Run credential review jobs for real (not zero-run)
- Wire supply outlook + cross-border check into daily prescriber path with audit log

### Data quality
- Coverage map by ISO2 × topic (live vs reference)
- Human review sampling on classifier output
- Single confidence scale migration complete

### Ops / security
- Make required status checks blocking on `main` (no admin bypass)
- Align Node engines (package 22.x vs project 24.x)
- Triage Dependabot high severity issues
- Org-scoped authorization tests for inquiries/deal rooms

### Growth
- Briefing engagement analytics → content tuning
- Watchlist notifications with single CTA

## Engineering conventions
- Trust: keep `desktopPageTrust.ts` aligned with mobile SectionShell
- Freshness: prefer `signalProvenance` / `latestTimestamp` helpers
- Role UX: use `getRoleCommandDefault` / `resolveCommandHome` for any new entry points
