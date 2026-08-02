#!/usr/bin/env python3
from pathlib import Path

path = Path('docs/control/EVIDENCE_LOG.md')
text = path.read_text(encoding='utf-8')

old_row = "| 2026-08-02 | Elite Digest feedback/HNSW forward repair | Exact-head workflow evidence pending | Controlled API RPCs, unique migration versions, actual pgvector invocation, and manual-only production migration gate | Replacement PR — update with immutable run IDs before merge | **Current — merge HOLD pending exact-head evidence** |"
new_row = "| 2026-08-02 | Elite Digest feedback/HNSW forward repair | Implementation head `732cf15cb4e4b91ddec0934eab7e83929ad65d19`; dedicated run `30755310208`; CI `30755310269`; Branch Verification `30755310228` | Eight ordered/unique Digest migrations; signed current-verdict RPC tests; lint; typecheck; full tests; build; public-boundary/security; PostgreSQL 17 + pgvector invocation; safe no-write production probes | PR #1246; supporting runs `30755310256`, `30755310358`, `30755310416`, `30755310324`, `30755310217`, `30755310242`, `30755310207` | **GO on implementation head — final evidence-only head must remain green** |"

if old_row not in text:
    raise SystemExit('pending Elite Digest evidence row not found')
text = text.replace(old_row, new_row, 1)

old_tail = """- Merge remains HOLD until exact-head targeted tests, migration uniqueness, lint,
  typecheck, full tests, build, public-boundary checks, PostgreSQL fixture, CI,
  Branch Verification, and review-thread audit are all recorded with immutable
  run IDs and zero unresolved material findings.
"""
new_tail = """- Implementation head `732cf15cb4e4b91ddec0934eab7e83929ad65d19` passed:
  - Elite Digest Forward Repair Verification run `30755310208`: eight migration
    versions ordered and unique; targeted feedback regressions; lint; typecheck;
    full tests; production build; public-boundary and security checks; and the
    PostgreSQL 17 + pgvector fixture with an actual `hv_dedup_assign()` call.
  - CI run `30755310269`: install, environment, domain logic, signal runtime,
    intake/listings, security/leakage, smoke tests, and Next.js build.
  - Branch Verification run `30755310228`: build, visibility, Playwright route
    and mobile checks, and production visibility probes in safe no-write mode.
  - Supporting green runs: Project Registry Discipline `30755310256`, Migration
    Drift Check `30755310358`, Type check `30755310416`, HAR-39/HAR-40 Public
    Surfaces `30755310324`, PR 166 verification `30755310217`, Regulatory Signals
    Verify `30755310242`, and Regional Routing Verification `30755310207`.
- Review-thread audit on the implementation head found zero unresolved threads.
- The follow-up commit changes evidence only. It must retain green CI and Branch
  Verification before merge; no implementation finding may be waived by this
  evidence record.
"""
if old_tail not in text:
    raise SystemExit('pending Elite Digest evidence narrative not found')
text = text.replace(old_tail, new_tail, 1)

path.write_text(text, encoding='utf-8')
print('recorded immutable Elite Digest verification evidence')
