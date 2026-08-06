-- Repaired 2026-08-05. The comment block below was committed as one physical
-- line carrying literal backslash-n escapes instead of real newlines, and the
-- last thing on that line was the DELETE statement's first line. The leading
-- `--` therefore commented the DELETE out, leaving its WHERE clause stranded
-- on the next real line:
--   ERROR: syntax error at or near "WHERE" (SQLSTATE 42601)
-- Same defect already repaired at 20260727105241. Only the escapes were
-- expanded; the statement is unchanged and still matches statements[1] of the
-- live ledger row exactly (123 chars, md5 0bec6249d9fa16f907177b3fcbe826de).

-- Removes 8 duplicate legacy seed rows from ia_graph_entities (ids ge-001..ge-007, ge-019).
-- These were hand-seeded on 2026-05-31 (before the current gr-ent-<hash> entity-resolution
-- pipeline existed) and duplicated 8 labels the new pipeline had independently re-created on
-- 2026-07-04 (Germany, United Kingdom, Portugal, Canada, Australia, Netherlands, Colombia,
-- BfArM Medical Cannabis Registry) -- e.g. "Australia" existed twice as two separate graph
-- nodes, each carrying only half the real connection/signal counts.
--
-- Confirmed zero live references to the old ids before deleting: neither hv_entity_mentions
-- (FK-enforced) nor signal_entities (informal) had ever pointed to any ge-XXX id -- the old
-- rows were fully disconnected from the real signal graph, and their connection_count /
-- signal_count were static seed numbers, not live-computed. For that reason this is a plain
-- delete, not a count-merge into the surviving rows -- merging would have mixed fabricated
-- seed numbers into the new pipeline's real computed counts.
--
-- Applied directly to production via Supabase MCP; committed here per
-- docs/control/CONCURRENT_SESSION_COORDINATION.md (same-turn convention).

DELETE FROM public.ia_graph_entities
WHERE id IN ('ge-001','ge-002','ge-003','ge-004','ge-005','ge-006','ge-007','ge-019');