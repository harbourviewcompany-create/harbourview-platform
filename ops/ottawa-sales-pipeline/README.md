# Ottawa Website Sales Pipeline V1 (Wurx)

This package is ready for daily outreach execution using verified Ottawa lead lists.

## Files
- `pipeline_template.csv` — master table with all required fields.
- `message_scripts.md` — trade-specific first messages, voicemail, follow-up, and pricing block.
- `pipeline.py` — command-line workflow for import, prioritization, today list, follow-up list, status updates, and CSV export.

## Core rules enforced
1. No fake contact data: rows missing public contact are flagged.
2. Source link required for every lead.
3. `verified_facts` and `assumptions` fields are separate and mandatory.
4. Priority list sorts highest `website_gap_confidence` and `priority_score` first.

## Required statuses
- not contacted
- DM sent
- called
- follow-up due
- interested
- quote sent
- won
- lost
- bad fit

## Quick start
```bash
python3 ops/ottawa-sales-pipeline/pipeline.py validate ops/ottawa-sales-pipeline/pipeline_template.csv
python3 ops/ottawa-sales-pipeline/pipeline.py today ops/ottawa-sales-pipeline/pipeline_template.csv --date 2026-05-11 --limit 25
python3 ops/ottawa-sales-pipeline/pipeline.py followups ops/ottawa-sales-pipeline/pipeline_template.csv --date 2026-05-11
python3 ops/ottawa-sales-pipeline/pipeline.py update-status ops/ottawa-sales-pipeline/pipeline_template.csv --lead "Acme Painting" --status "DM sent" --date-field dm_sent_date --date 2026-05-11
python3 ops/ottawa-sales-pipeline/pipeline.py export ops/ottawa-sales-pipeline/pipeline_template.csv --out ops/ottawa-sales-pipeline/daily_execution_2026-05-11.csv --date 2026-05-11
```

## Daily execution workflow
1. Import/append verified leads into `pipeline_template.csv`.
2. Run `validate` (ensures at least 30 leads, required fields, and valid statuses).
3. Run `today` to generate outreach queue sorted by priority.
4. Run `followups` to generate follow-up due list.
5. Send DMs/calls, then use `update-status` and date fields.
6. Run `export` for a simple daily CSV handoff.
