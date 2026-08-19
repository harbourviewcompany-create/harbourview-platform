# EU GMP recognition — orientation (corridor depth)

**Status:** Encoded in `lib/intelligence/gmpRecognition.ts` and surfaced on corridor execution plans via `plan.depth.gmpRecognition`.

**Not:** site certificates, legal advice, or a claim that MRA = cannabis free pass.

## Frameworks mapped

| Framework | Origins (examples) |
|-----------|-------------------|
| EEA internal | PT, NL, DE, … ↔ EEA |
| CETA GMP protocol | CA → EEA |
| ACAA | IL → EEA |
| MRA | AU, JP, NZ, CH, US → EEA |
| TCA Annex TBT-2 | GB interactions |
| No MRA | CO, TH, ZA, BR, MX, … → EEA |
| Destination not EEA | e.g. → AU, → GB special case |

## Operator update rule

When Commission/EMA MRA partner lists or operational scope change, update `EU_MRA_PARTNERS` and failure-mode extras — do not invent site-level certificate status in code.

Primary references: EMA MRA pages, European Commission bilateral GMP cooperation, Health Canada CETA protocol notes, EudraGMDP.
