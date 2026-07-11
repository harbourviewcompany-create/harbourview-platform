// lib/intelligence-engine/graph-writer.ts
// Promotes ia_signals rows into the cannabis_intelligence provenance chain:
//   ia_signal → source_documents → evidence_claims → regulatory_authorities
//
// Deliberately conservative:
//   - Never asserts legal_status (legal_regimes) — requires human review
//   - Writes claims as machine_extracted_unreviewed
//   - Upserts are keyed on stable natural identifiers to stay idempotent
//
// Server-only.

import 'server-only'
import { SupabaseClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

export interface GraphSignalInput {
  id: string
  title: string
  type: string
  market: string | null
  source_name: string | null
  summary: string
  detected_at: string
  confidence: number
  notes: string | null          // packed field: "Entities: ...\nRegulatory: ..."
  country_iso: string | null    // resolved from market name by caller
}

export interface GraphWriteResult {
  signal_id: string
  jurisdiction_id: string | null
  claims_written: number
  entities_written: number
  sources_written: number
  error?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse packed notes field back into named arrays. */
function parseNotes(notes: string | null): {
  entities: string[]
  regulatory: string[]
  licensing: string[]
  trade: string[]
} {
  if (!notes) return { entities: [], regulatory: [], licensing: [], trade: [] }

  const extract = (prefix: string): string[] => {
    const line = notes.split('\n').find(l => l.startsWith(prefix + ':'))
    if (!line) return []
    return line.slice(prefix.length + 1).split(', ').map(s => s.trim()).filter(Boolean)
  }

  return {
    entities:   extract('Entities'),
    regulatory: extract('Regulatory'),
    licensing:  extract('Licensing'),
    trade:      extract('Trade'),
  }
}

/** Map signal type to CI claim_type string. */
function signalTypeToClaimType(signalType: string): string {
  switch (signalType) {
    case 'regulatory_change': return 'regulatory_change'
    case 'trade_signal':      return 'trade_route'
    case 'market_entry_opportunity': return 'market_entry'
    case 'research_update':   return 'research'
    default:                  return 'general_intelligence'
  }
}

/** Derive CI source_type from signal type. */
function ciSourceType(signalType: string): string {
  switch (signalType) {
    case 'regulatory_change': return 'official_press_release'
    case 'research_update':   return 'academic'
    case 'trade_signal':      return 'government_dataset'
    default:                  return 'news'
  }
}

/** Derive reliability tier from signal confidence score. */
function ciReliabilityTier(confidence: number): string {
  if (confidence >= 85) return 'tier_2_primary_non_regulator'
  if (confidence >= 65) return 'tier_3_reputable_secondary'
  return 'tier_4_unverified_secondary'
}

// ── Main writer ───────────────────────────────────────────────────────────────

export async function writeSignalToGraph(
  supabase: SupabaseClient,
  signal: GraphSignalInput,
): Promise<GraphWriteResult> {
  const result: GraphWriteResult = {
    signal_id:      signal.id,
    jurisdiction_id: null,
    claims_written:  0,
    entities_written: 0,
    sources_written:  0,
  }

  try {
    // ── 1. Resolve jurisdiction ───────────────────────────────────────────────
    let jurisdictionId: string | null = null

    if (signal.country_iso) {
      const { data: jRow } = await supabase
        .rpc('ci_jurisdiction_id_for_iso', { p_iso: signal.country_iso })
      jurisdictionId = jRow ?? null
    }

    result.jurisdiction_id = jurisdictionId

    // ── 2. Upsert source_document ─────────────────────────────────────────────
    // Use a synthetic canonical URL keyed on signal ID — we don't always have
    // the original URL at this stage (it lives in source_registry / source_snapshots).
    // This is a lightweight provenance anchor; real URLs get added during enrichment.
    const syntheticUrl = `urn:harbourview:signal:${signal.id}`

    const { data: srcRow, error: srcErr } = await supabase
      .schema('cannabis_intelligence')
      .from('source_documents')
      .upsert(
        {
          jurisdiction_id:  jurisdictionId,
          source_type:      ciSourceType(signal.type),
          reliability_tier: ciReliabilityTier(signal.confidence),
          title:            signal.title.slice(0, 500),
          publisher:        signal.source_name?.slice(0, 300) ?? null,
          canonical_url:    syntheticUrl,
          published_at:     signal.detected_at,
          accessed_at:      new Date().toISOString(),
          evidence_status:  'machine_extracted_unreviewed',
          review_status:    'unreviewed',
          exposure_level:   'restricted_internal',
          notes_internal:   `Auto-promoted from ia_signals id=${signal.id}`,
        },
        { onConflict: 'canonical_url' },
      )
      .select('id')
      .single()

    if (srcErr || !srcRow) {
      result.error = `source_document upsert failed: ${srcErr?.message ?? 'no row returned'}`
      return result
    }

    result.sources_written = 1
    const sourceDocId: string = srcRow.id

    // ── 3. Write evidence_claims from packed notes ────────────────────────────
    const { regulatory, licensing, trade } = parseNotes(signal.notes)
    const claimType = signalTypeToClaimType(signal.type)

    // Summary claim (always written — captures the overall extraction)
    const summaryClaimHash = crypto
      .createHash('sha256')
      .update(`${sourceDocId}:summary:${signal.summary.slice(0, 200)}`)
      .digest('hex')
      .slice(0, 16)

    const claimsToInsert: Record<string, unknown>[] = [
      {
        jurisdiction_id:     jurisdictionId,
        source_document_id:  sourceDocId,
        claim_type:          claimType,
        claim_field:         'summary',
        claim_value:         summaryClaimHash,
        raw_excerpt:         signal.summary.slice(0, 2000),
        normalized_summary:  signal.title.slice(0, 500),
        machine_extracted:   true,
        confidence_score:    signal.confidence,
        evidence_status:     'machine_extracted_unreviewed',
        review_status:       'unreviewed',
        exposure_level:      'restricted_internal',
      },
    ]

    // Regulatory change claims
    for (const change of regulatory.slice(0, 10)) {
      claimsToInsert.push({
        jurisdiction_id:     jurisdictionId,
        source_document_id:  sourceDocId,
        claim_type:          'regulatory_change',
        claim_field:         'regulatory_changes',
        claim_value:         change.slice(0, 500),
        raw_excerpt:         change.slice(0, 1000),
        normalized_summary:  change.slice(0, 500),
        machine_extracted:   true,
        confidence_score:    Math.max(30, signal.confidence - 10),
        evidence_status:     'machine_extracted_unreviewed',
        review_status:       'unreviewed',
        exposure_level:      'restricted_internal',
      })
    }

    // Licensing update claims
    for (const update of licensing.slice(0, 10)) {
      claimsToInsert.push({
        jurisdiction_id:     jurisdictionId,
        source_document_id:  sourceDocId,
        claim_type:          'licensing_update',
        claim_field:         'licensing_updates',
        claim_value:         update.slice(0, 500),
        raw_excerpt:         update.slice(0, 1000),
        normalized_summary:  update.slice(0, 500),
        machine_extracted:   true,
        confidence_score:    Math.max(30, signal.confidence - 10),
        evidence_status:     'machine_extracted_unreviewed',
        review_status:       'unreviewed',
        exposure_level:      'restricted_internal',
      })
    }

    // Trade route claims
    for (const route of trade.slice(0, 10)) {
      claimsToInsert.push({
        jurisdiction_id:     jurisdictionId,
        source_document_id:  sourceDocId,
        claim_type:          'trade_route',
        claim_field:         'trade_route_information',
        claim_value:         route.slice(0, 500),
        raw_excerpt:         route.slice(0, 1000),
        normalized_summary:  route.slice(0, 500),
        machine_extracted:   true,
        confidence_score:    Math.max(30, signal.confidence - 10),
        evidence_status:     'machine_extracted_unreviewed',
        review_status:       'unreviewed',
        exposure_level:      'restricted_internal',
      })
    }

    const { error: claimErr } = await supabase
      .schema('cannabis_intelligence')
      .from('evidence_claims')
      .insert(claimsToInsert)

    if (claimErr) {
      console.warn(`graph-writer: evidence_claims partial failure for ${signal.id}:`, claimErr.message)
      // Non-fatal — proceed to entities
    } else {
      result.claims_written = claimsToInsert.length
    }

    // ── 4. Upsert regulatory_authorities from entities_mentioned ─────────────
    if (jurisdictionId) {
      const { entities } = parseNotes(signal.notes)
      // Only write entities that look like organisations (not just names)
      const orgEntities = entities.filter(e =>
        e.length > 3 &&
        /\b(authority|agency|ministry|minister|department|commission|board|office|bureau|institute|council|regulation|health|cannabis|agriculture|food|drug|pharmaceutical|government|federal|national|regulator|corp|inc|ltd|gmbh|co\.|s\.a\.|llc)\b/i.test(e)
      ).slice(0, 10)

      for (const entityName of orgEntities) {
        const { error: authorityErr } = await supabase
          .schema('cannabis_intelligence')
          .from('regulatory_authorities')
          .upsert(
            {
              jurisdiction_id:  jurisdictionId,
              name:             entityName.slice(0, 300),
              regulator_type:   'national_regulator',
              confidence_score: Math.max(25, signal.confidence - 20),
              evidence_status:  'machine_extracted_unreviewed',
              review_status:    'unreviewed',
              exposure_level:   'restricted_internal',
              notes_internal:   `Auto-extracted from ia_signals id=${signal.id}`,
            },
            { onConflict: 'jurisdiction_id,name' },
          )

        if (!authorityErr) result.entities_written++
      }
    }

    return result
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err)
    return result
  }
}
