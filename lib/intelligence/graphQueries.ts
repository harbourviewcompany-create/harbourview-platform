/**
 * lib/intelligence/graphQueries.ts
 *
 * Core graph traversal logic for the Harbourview knowledge graph.
 * Builds on the existing ia_graph_entities + ia_graph_edges tables
 * (20 nodes / 20 edges at seed; grows as the intelligence pipeline
 * extracts new entities).
 *
 * All queries fetch the full graph in 2 parallel DB calls (service-role,
 * bypasses RLS) then filter in JS. At 20 nodes this is trivially fast;
 * at 10K+ nodes, replace with direct SQL traversal queries.
 *
 * This file is server-only. Never import it in client components.
 */

import 'server-only'
import {
  listIaGraphEntities,
  listIaGraphEdges,
} from '@/lib/intelligence-automation/db'
import type { GraphEntity, GraphEdge } from '@/lib/intelligence-automation/types'

// ── Public result type ────────────────────────────────────────────────────────

export interface GraphQueryResult {
  /** Nodes returned by this query (may be a subgraph of the full graph). */
  nodes: GraphEntity[]
  /** Edges returned by this query (connecting the returned nodes). */
  edges: GraphEdge[]
  /**
   * Focal entity — present when the query was anchored to a single entity
   * (entity_id or label lookup). Null for full/type/market queries.
   */
  focal: GraphEntity | null
  /** Total node count across the entire graph (not just this subgraph). */
  totalNodes: number
  /** Total edge count across the entire graph (not just this subgraph). */
  totalEdges: number
  /** Whether the data came from a live DB query or the seed fixture fallback. */
  source: 'live' | 'fixture'
}

// ── Internal: fetch the complete graph once ───────────────────────────────────

interface FullGraph {
  allNodes: GraphEntity[]
  allEdges: GraphEdge[]
  source: 'live' | 'fixture'
}

async function fetchFullGraph(): Promise<FullGraph> {
  const [entitiesResult, edgesResult] = await Promise.all([
    listIaGraphEntities(),
    listIaGraphEdges(),
  ])

  const allNodes = entitiesResult.ok ? entitiesResult.data : []
  const allEdges = edgesResult.ok ? edgesResult.data : []

  // 'live' only if both queries hit the DB (not fixture fallback)
  const isLive =
    entitiesResult.ok &&
    edgesResult.ok &&
    (entitiesResult as { source?: string }).source === 'db' &&
    (edgesResult as { source?: string }).source === 'db'

  return { allNodes, allEdges, source: isLive ? 'live' : 'fixture' }
}

// ── Internal: 1-hop neighborhood from an already-fetched graph ────────────────

function neighborhoodFrom(
  focal: GraphEntity,
  allNodes: GraphEntity[],
  allEdges: GraphEdge[],
  source: 'live' | 'fixture',
): GraphQueryResult {
  // Edges where focal entity is either endpoint
  const connectedEdges = allEdges.filter(
    e => e.fromLabel === focal.label || e.toLabel === focal.label,
  )

  // Collect the labels of every neighbor
  const neighborLabels = new Set<string>()
  for (const e of connectedEdges) {
    if (e.fromLabel !== focal.label) neighborLabels.add(e.fromLabel)
    if (e.toLabel   !== focal.label) neighborLabels.add(e.toLabel)
  }

  const neighbors = allNodes.filter(n => neighborLabels.has(n.label))

  return {
    nodes:      [focal, ...neighbors],
    edges:      connectedEdges,
    focal,
    totalNodes: allNodes.length,
    totalEdges: allEdges.length,
    source,
  }
}

// ── Public query functions ────────────────────────────────────────────────────

/**
 * queryFullGraph
 * Returns every node and every edge in the graph.
 * Use for overview/visualisation surfaces.
 */
export async function queryFullGraph(): Promise<GraphQueryResult> {
  const { allNodes, allEdges, source } = await fetchFullGraph()
  return {
    nodes:      allNodes,
    edges:      allEdges,
    focal:      null,
    totalNodes: allNodes.length,
    totalEdges: allEdges.length,
    source,
  }
}

/**
 * queryEntityNeighborhood
 * Returns the focal entity + all entities reachable via a single edge,
 * plus those connecting edges.
 *
 * Returns an empty result (with graph totals) when the entity is not found.
 */
export async function queryEntityNeighborhood(
  entityId: string,
): Promise<GraphQueryResult> {
  const { allNodes, allEdges, source } = await fetchFullGraph()

  const focal = allNodes.find(n => n.id === entityId) ?? null
  if (!focal) {
    return {
      nodes:      [],
      edges:      [],
      focal:      null,
      totalNodes: allNodes.length,
      totalEdges: allEdges.length,
      source,
    }
  }

  return neighborhoodFrom(focal, allNodes, allEdges, source)
}

/**
 * queryByLabel
 * Finds an entity by exact label match (case-insensitive), then returns
 * its 1-hop neighborhood. Falls back to partial match if no exact hit.
 *
 * Returns empty result with graph totals when nothing matches.
 */
export async function queryByLabel(label: string): Promise<GraphQueryResult> {
  const { allNodes, allEdges, source } = await fetchFullGraph()

  const labelLower = label.toLowerCase().trim()
  const focal =
    allNodes.find(n => n.label.toLowerCase() === labelLower) ??
    allNodes.find(n => n.label.toLowerCase().includes(labelLower)) ??
    null

  if (!focal) {
    return {
      nodes:      [],
      edges:      [],
      focal:      null,
      totalNodes: allNodes.length,
      totalEdges: allEdges.length,
      source,
    }
  }

  return neighborhoodFrom(focal, allNodes, allEdges, source)
}

/**
 * queryByType
 * Returns all entities of the given type, plus edges where both endpoints
 * are within that filtered set.
 */
export async function queryByType(type: string): Promise<GraphQueryResult> {
  const { allNodes, allEdges, source } = await fetchFullGraph()

  const filteredNodes = allNodes.filter(n => n.type === type)
  const filteredLabels = new Set(filteredNodes.map(n => n.label))

  // Include edges where at least one endpoint is in the filtered set
  // (so cross-type connections are visible)
  const filteredEdges = allEdges.filter(
    e => filteredLabels.has(e.fromLabel) || filteredLabels.has(e.toLabel),
  )

  // Add in any connected nodes from the other side of those edges
  const extraLabels = new Set<string>()
  for (const e of filteredEdges) {
    if (!filteredLabels.has(e.fromLabel)) extraLabels.add(e.fromLabel)
    if (!filteredLabels.has(e.toLabel))   extraLabels.add(e.toLabel)
  }
  const extraNodes = allNodes.filter(n => extraLabels.has(n.label))

  return {
    nodes:      [...filteredNodes, ...extraNodes],
    edges:      filteredEdges,
    focal:      null,
    totalNodes: allNodes.length,
    totalEdges: allEdges.length,
    source,
  }
}

/**
 * queryByMarket
 * Returns all entities where `market` matches (case-insensitive partial match),
 * or where the entity's label itself is the market name, plus connecting edges.
 */
export async function queryByMarket(market: string): Promise<GraphQueryResult> {
  const { allNodes, allEdges, source } = await fetchFullGraph()

  const mkt = market.toLowerCase().trim()

  const filteredNodes = allNodes.filter(
    n =>
      n.market?.toLowerCase().includes(mkt) ||
      n.label.toLowerCase().includes(mkt),
  )
  const filteredLabels = new Set(filteredNodes.map(n => n.label))

  // All edges connecting at least one node in the market set
  const filteredEdges = allEdges.filter(
    e => filteredLabels.has(e.fromLabel) || filteredLabels.has(e.toLabel),
  )

  // Pull in the other endpoint so edges render correctly in visualisations
  const extraLabels = new Set<string>()
  for (const e of filteredEdges) {
    if (!filteredLabels.has(e.fromLabel)) extraLabels.add(e.fromLabel)
    if (!filteredLabels.has(e.toLabel))   extraLabels.add(e.toLabel)
  }
  const extraNodes = allNodes.filter(n => extraLabels.has(n.label))

  return {
    nodes:      [...filteredNodes, ...extraNodes],
    edges:      filteredEdges,
    focal:      null,
    totalNodes: allNodes.length,
    totalEdges: allEdges.length,
    source,
  }
}
