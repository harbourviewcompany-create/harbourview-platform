# Harbourview Talent Control Pack

Audited base: `04e306d520d69d746a5099bf778dc253296710a3`.
Control-pack branch: `docs/talent-control-pack-20260814`.

`TALENT_SCOPE_LEDGER.md` is the controlling scope document. No approved Talent capability may disappear during implementation. Anything not implemented in the active phase remains represented with target architecture, dependency, preserved foundation, tests, evidence obligation, phase, and status.

Stable identifiers:
- capabilities: `TAL-001` through `TAL-100` (`TAL-001` through `TAL-084` preserve the previously approved scope; `TAL-085` through `TAL-100` formalize previously approved cross-cutting capabilities that were not yet mechanically represented)
- acceptance criteria: `TAC-001` through `TAC-050` (`TAC-001` through `TAC-035` preserved)
- hardening controls: `CTL-001` through `CTL-025`

A capability may become `VERIFIED` only when `TALENT_TRACEABILITY_MATRIX.md` records implementation files/migrations, API/DTO/RLS contract, tests, evidence artifact, implementation SHA and independent verification SHA, or an explicitly justified N/A accepted through change control.

See `TALENT_CONTROL_MANIFEST.json` for the machine-readable frozen pack manifest.