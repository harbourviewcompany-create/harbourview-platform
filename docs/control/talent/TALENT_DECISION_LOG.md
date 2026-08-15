# Talent Decision Log

Control: CTL-004. Material architecture/implementation decisions use stable `TDEC-###` IDs.

Initial frozen decisions:
- TDEC-001 APPROVED — `workspaces` remains canonical Harbourview-managed organization identity; external organizations resolve to it only when evidence supports the link. TAL-006/007/016.
- TDEC-002 APPROVED — durable `talent_people` identity is separate from applications and `talent_candidates`. TAL-001/071.
- TDEC-003 APPROVED — JobOpportunity is canonical job identity; source records/snapshots remain immutable lineage. TAL-025/034/035.
- TDEC-004 APPROVED — authorization precedes candidate lexical/semantic retrieval. TAL-060/062/063.
- TDEC-005 APPROVED — `hv_professionals` becomes compatibility/input to Passport without invented credential semantics. TAL-039/043/080.
- TDEC-006 APPROVED — global workspace roles are not expanded for recruiting; Talent-specific roles/authority layer is used. TAL-019–021.
- TDEC-007 APPROVED — P0 uses controlled dark deployment/backfill/shadow comparison/cutover rather than one-step replacement. TAL-079–084; CTL-007.

New material choices discovered during runtime implementation must be appended, not buried in commit messages.