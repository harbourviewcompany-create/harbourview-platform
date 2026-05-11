#!/usr/bin/env python3
import argparse
import csv
from datetime import date

ALLOWED_STATUSES = {
    "not contacted", "DM sent", "called", "follow-up due", "interested",
    "quote sent", "won", "lost", "bad fit"
}
REQUIRED = [
    "lead_name","trade","source_link","public_contact","website_gap_confidence","priority_score",
    "owner_contact_clue","best_channel","first_message_angle","dm_sent_date","call_date",
    "follow_up_date","response","status","quoted_price","close_probability","next_action","notes",
    "verified_facts","assumptions"
]

def read_rows(path):
    with open(path, newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))

def write_rows(path, rows, fieldnames):
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

def validate(path):
    rows = read_rows(path)
    if len(rows) < 30:
        raise SystemExit(f"HOLD: need at least 30 leads, found {len(rows)}")
    for i, r in enumerate(rows, start=2):
        for k in REQUIRED:
            if k not in r:
                raise SystemExit(f"HOLD: missing field '{k}' in header")
        if not r["source_link"].strip():
            raise SystemExit(f"HOLD: missing source_link at row {i}")
        if not r["verified_facts"].strip() or not r["assumptions"].strip():
            raise SystemExit(f"HOLD: verified/assumptions split missing at row {i}")
        if r["status"] not in ALLOWED_STATUSES:
            raise SystemExit(f"HOLD: invalid status '{r['status']}' at row {i}")
    print(f"GO: validation passed for {len(rows)} leads")

def priority_sorted(rows):
    def to_num(v):
        try: return float(v)
        except: return 0.0
    return sorted(rows, key=lambda r: (to_num(r["website_gap_confidence"]), to_num(r["priority_score"])), reverse=True)

def today(path, run_date, limit):
    rows = priority_sorted(read_rows(path))
    out = [r for r in rows if r["status"] in {"not contacted", "follow-up due", "interested"}][:limit]
    print(f"Daily outreach list for {run_date} ({len(out)} leads)")
    for r in out:
        print(f"- {r['lead_name']} | {r['trade']} | status={r['status']} | priority={r['priority_score']} | gap={r['website_gap_confidence']}")

def followups(path, run_date):
    rows = read_rows(path)
    out = [r for r in rows if r["follow_up_date"] and r["follow_up_date"] <= run_date and r["status"] not in {"won","lost","bad fit"}]
    print(f"Follow-ups due by {run_date} ({len(out)} leads)")
    for r in priority_sorted(out):
        print(f"- {r['lead_name']} | due={r['follow_up_date']} | status={r['status']} | next={r['next_action']}")

def update_status(path, lead, status, date_field=None, date_value=None):
    if status not in ALLOWED_STATUSES:
        raise SystemExit(f"HOLD: invalid status '{status}'")
    rows = read_rows(path)
    found = 0
    for r in rows:
        if r["lead_name"] == lead:
            r["status"] = status
            if date_field and date_field in r:
                r[date_field] = date_value or str(date.today())
            found += 1
    if not found:
        raise SystemExit(f"HOLD: lead not found '{lead}'")
    write_rows(path, rows, rows[0].keys())
    print(f"Updated {found} row(s)")

def export_csv(path, out_path, run_date):
    rows = priority_sorted(read_rows(path))
    daily = [r for r in rows if r["status"] in {"not contacted", "follow-up due", "interested", "DM sent", "called"}]
    write_rows(out_path, daily, rows[0].keys() if rows else [])
    print(f"Exported {len(daily)} rows to {out_path} for {run_date}")

def main():
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest='cmd', required=True)
    for name in ["validate","today","followups","export"]:
        sp = sub.add_parser(name)
        sp.add_argument("csv_path")
        sp.add_argument("--date", default=str(date.today()))
        if name == "today": sp.add_argument("--limit", type=int, default=50)
        if name == "export": sp.add_argument("--out", required=True)
    up = sub.add_parser("update-status")
    up.add_argument("csv_path")
    up.add_argument("--lead", required=True)
    up.add_argument("--status", required=True)
    up.add_argument("--date-field")
    up.add_argument("--date")

    a = p.parse_args()
    if a.cmd == "validate": validate(a.csv_path)
    elif a.cmd == "today": today(a.csv_path, a.date, a.limit)
    elif a.cmd == "followups": followups(a.csv_path, a.date)
    elif a.cmd == "update-status": update_status(a.csv_path, a.lead, a.status, a.date_field, a.date)
    elif a.cmd == "export": export_csv(a.csv_path, a.out, a.date)

if __name__ == "__main__":
    main()
