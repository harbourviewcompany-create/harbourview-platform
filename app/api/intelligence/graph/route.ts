/**
 * GET /api/intelligence/graph
 *
 * Public graph query endpoint for the Harbourview knowledge graph.
 * Exposes the ia_graph_entities + ia_graph_edges tables via a
 * typed, traversal-aware REST API.
 *
 * ── Query modes ──────────────────────────────────────────────────────────────
 *
 *   (no params)             Full graph — all nodes + all edges
 *   ?entity_id={id}         Entity + 1-hop neighbourhood
 *   ?label={label}          Entity by label (case-insensitive) + 1-hop neighbourhood
 *   ?type={type}            All entities of type + connecting edges
 *   ?market={market}        All entities for market + connecting edges
 *
 * Multiple params: entity_id > label > type > market (first match wins).
 *
 * ── Response shape ───────────────────────────────────────────────────────────
 *
 *   {
 *     nodes:      GraphEntity[]   — nodes in this (sub)graph
 *     edges:      GraphEdge[]     — edges in this (sub)graph
 *     focal:      GraphEntity | null  — anchor entity (neighbourhood queries)
 *     totalNodes: number          — total nodes in the full graph
 *     totalEdges: number          — total edges in the full graph
 *     source:     "live" | "fixture"
 *     query:      { mode, ...params }
 *   }
 *
 * ── Security ─────────────────────────────────────────────────────────────────
 *
 *   - Server-side only. Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS.
 *   - The ia_graph tables contain seeded market/counterparty data; all fields
 *     are safe to expose publicly (no PII, no private commercial terms).
 *   - Cache-Control: private, max-age=120 — browser-cached only, not CDN.
 *
 * ── Valid entity types ────────────────────────────────────────────────────────
 *   market | country | pathway | opportunity | signal | counterparty |
 *   buyer | seller | importer | distributor | supplier | service_provider |
 *   consultant | document_packet | category | source
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  queryFullGraph,
  queryEntityNeighborhood,
  queryByLabel,
  queryByType,
  queryByMarket,
  type GraphQueryResult,
} from '@/lib/intelligence/graphQueries'

// Valid entity type values (mirrors GraphEntityType in types.ts)
const VALID_TYPES = new Set([
  'market', 'country', 'pathway', 'opportunity', 'signal',
  'counterparty', 'buyer', 'seller', 'importer', 'distributor',
  'supplier', 'service_provider', 'consultant', 'document_packet',
  'category', 'source',
])

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const entityId = searchParams.get('entity_id')?.trim() || null
  const label    = searchParams.get('label')?.trim()     || null
  const type     = searchParams.get('type')?.trim()      || null
  const market   = searchParams.get('market')?.trim()    || null

  // ── Input validation ────────────────────────────────────────────────────────

  if (type && !VALID_TYPES.has(type)) {
    return NextResponse.json(
      {
        error:       'Invalid type parameter',
        validTypes:  Array.from(VALID_TYPES),
        received:    type,
      },
      { status: 400 },
    )
  }

  // ── Dispatch to traversal query ─────────────────────────────────────────────

  let result: GraphQueryResult
  let queryMeta: Record<string, string>

  try {
    if (entityId) {
      result    = await queryEntityNeighborhood(entityId)
      queryMeta = { mode: 'neighborhood', entity_id: entityId }
    } else if (label) {
      result    = await queryByLabel(label)
      queryMeta = { mode: 'label', label }
    } else if (type) {
      result    = await queryByType(type)
      queryMeta = { mode: 'type', type }
    } else if (market) {
      result    = await queryByMarket(market)
      queryMeta = { mode: 'market', market }
    } else {
      result    = await queryFullGraph()
      queryMeta = { mode: 'full' }
    }
  } catch (err) {
    console.error('[/api/intelligence/graph] query error:', err)
    return NextResponse.json(
      { error: 'Graph query failed', detail: String(err) },
      { status: 500 },
    )
  }

  // ── Build response ──────────────────────────────────────────────────────────

  return NextResponse.json(
    {
      nodes:      result.nodes,
      edges:      result.edges,
      focal:      result.focal,
      totalNodes: result.totalNodes,
      totalEdges: result.totalEdges,
      source:     result.source,
      query:      queryMeta,
    },
    {
      headers: {
        // Private cache: browser-only. 2min TTL is appropriate for a graph
        // that grows incrementally via the intelligence pipeline.
        'Cache-Control': 'private, max-age=120, stale-while-revalidate=60',
      },
    },
  )
}
