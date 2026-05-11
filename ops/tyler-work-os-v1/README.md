# Revenue Command CRM / Tyler Work OS V1

Single operating system for Tyler's active and parked projects, money-now pipeline, build queue, launch control, lead engines, proof assets, parking lot, and weekly CEO review.

## Modules Included
1. Command Center dashboard (in `projects_master.csv` filtered by `module`).
2. Money Now Pipeline (`leads_crm.csv` where module = Money Now Pipeline).
3. Build Queue (`projects_master.csv` where module = Build Queue).
4. Harbourview Launch Control (`projects_master.csv` where module = Harbourview Launch Control).
5. Wurx / Ottawa Website Lead Engine (`projects_master.csv` + `leads_crm.csv`).
6. LinkedIn Cannabis Contact & Signal Engine (`projects_master.csv` + `leads_crm.csv`).
7. Content / Proof Assets (`projects_master.csv`).
8. Parking Lot (`projects_master.csv` where status = Parked, includes `review_date` + `resume_trigger`).
9. Automation / Agent Log (`automation_agent_log.csv`).
10. Weekly CEO Review (`weekly_ceo_review.csv`).

## Core Field Coverage
All required core fields are implemented in `projects_master.csv`.

## Operating Rules
- **Daily startup (10 minutes):** filter `projects_master.csv` to `go_hold=GO`, sort by `priority`, execute `next_action` due today.
- **Money-now first:** review `leads_crm.csv` where `daily_outreach_queue=Today` before any build work.
- **Follow-up integrity:** no lead/project may pass `follow_up_date` without update.
- **Evidence-only claims:** every shipped claim should include `evidence_link`.
- **GO/HOLD discipline:** use HOLD whenever blocker prevents revenue progress within 7 days.
- **Parking lot control:** parked items must include `review_date`, `resume_trigger`, and `kill_criteria`.
- **Weekly CEO review cadence:** update `weekly_ceo_review.csv` every Monday.

## Included Views (Airtable-compatible via filter)
- **Today's Next Actions:** records where `follow_up_date <= today` OR `due_date <= today` and `go_hold=GO`.
- **Stale Items Warning:** records where `stale_warning` starts with `STALE`.
- **Money-Now CRM:** `leads_crm.csv` sorted by `cash_value` descending.
- **Daily Outreach View:** `leads_crm.csv` where `daily_outreach_queue=Today`.
- **GO/HOLD Tracking:** group by `go_hold` in `projects_master.csv` and `leads_crm.csv`.
- **Evidence Tracking:** filter where `evidence_link` is not blank.

## Recreate/Import Notes
- Current master build queue recreated in `projects_master.csv` (includes marketplace commercial polish and live launch-control items pulled from repository state docs).
- First 7 weekly execution prompts included in `weekly_execution_prompts.md`.
- Parked projects included with review dates (`review_date` field).

## Backup / Export
- This V1 is already in CSV format (Airtable-import ready).
- Export backup: copy `ops/tyler-work-os-v1/*.csv` into dated archive (or import/export from Airtable as CSV/XLSX).

## Verification Checklist
- Add a new project: append row to `projects_master.csv`.
- Add a lead: append row to `leads_crm.csv`.
- Attach a Codex prompt: fill `codex_prompt`.
- Mark GO/HOLD: set `go_hold`.
- Record evidence: set `evidence_link`.
- Park/resume project: set `status` to `Parked`/`Active` and maintain `resume_trigger`.
- Produce today's next actions: apply Today's Next Actions view filter.
- Export CSV/XLSX backup: CSV files are directly exportable/importable; Airtable can output XLSX.
