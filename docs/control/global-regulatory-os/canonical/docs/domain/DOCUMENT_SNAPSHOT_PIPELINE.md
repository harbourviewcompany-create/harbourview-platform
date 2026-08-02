# Document and Snapshot Pipeline

## State machine

```text
registered source
  -> rights approved
  -> acquisition scheduled
  -> secure fetch running
  -> raw snapshot written
  -> integrity verified
  -> duplicate classified
  -> document matched/created
  -> version created
  -> content parsed/OCRed
  -> passages anchored
  -> translation candidates created
  -> structural/semantic diff created
  -> materiality triaged
  -> instrument/provision candidates created
  -> specialist review
  -> publication projection
  -> downstream applicability, alerts and correction monitoring
```

## Hard sequencing rules

1. Rights approval precedes network access.
2. Endpoint allowlist and DNS/IP validation precede every fetch.
3. Original bytes are written before parsing or model processing.
4. Snapshot hash and storage confirmation precede success events.
5. Parser output references an immutable snapshot and parser version.
6. Publication references passages, document version and snapshot.
7. A source-failure or stale state can block publication even when a prior snapshot exists.
8. Reprocessing creates new processing lineage; it does not mutate raw evidence.
9. Source deletion or contract termination follows the recorded rights policy and preserves required audit evidence.

## Acquisition controls

- Per-source rate and concurrency limits.
- Conditional requests where supported.
- Idempotency key: source, endpoint, schedule window and request fingerprint.
- Run lock by source and partition.
- Retry categories: transient, rate-limited, authentication, parser, rights, security and permanent.
- SSRF controls: scheme allowlist, registered host allowlist, DNS rebinding defense, private/reserved IP denial and redirect revalidation.
- Browser-based acquisition isolated from internal networks.
- Credential references only; credentials never stored in source records or events.
- Response-size, content-type and decompression limits.
- Malware and active-content scanning.

## Snapshot record

Required fields include source, run, canonical URI, retrieval/publication/effective timestamps, HTTP metadata, content/binary hashes, byte size, MIME type, storage URI/version, object-lock status, language, classification and duplicate link.

## Document matching

Priority order:

1. Official persistent identifier.
2. Authority plus source identifier.
3. Canonical URI and version metadata.
4. Jurisdiction/instrument/title/date composite.
5. Analyst-reviewed similarity candidate.

No high-impact document merge occurs from title similarity alone.

## Parsing and passage anchors

Parsers emit a document tree containing page, article, section, paragraph, table, row, cell, figure and attachment nodes. Stable anchors combine official identifiers where available with structural path and content fingerprints. Exact source text is retained separately from normalized text.

## OCR and translation

- OCR confidence is retained per document and passage where available.
- Low-confidence or legally material passages require visual review.
- Translation is a distinct versioned record linked to original text.
- The original language remains primary evidence.
- High-risk translated obligations require a qualified language/domain reviewer.

## Diffing

Diffs distinguish:

- Created or deleted text.
- Modified wording.
- Moved text.
- Definition change.
- Status change.
- Effective/commencement date change.
- Scope or exception change.
- Table/threshold change.
- Metadata-only change.

Materiality is a candidate until analyst approval.

## Failure behavior

| Failure | Required behavior |
|---|---|
| Rights unresolved | Block acquisition and create review task |
| Network/security violation | Terminate request, raise security event |
| Hash/storage failure | Mark run failed; do not parse |
| Unsupported format | Preserve snapshot and route parser task |
| Parser failure | Preserve snapshot; retry versioned parser or manual capture |
| Citation instability | Block publication |
| Source conflict | Retain both; create conflict review |
| Source stale | Display stale state and enforce publication policy |

## Replay and reproducibility

A processing replay specifies snapshot ID, parser/OCR/translation/model/prompt versions and deterministic configuration. Outputs receive new processing IDs and can be compared to prior output. Historical published releases retain the original lineage.
