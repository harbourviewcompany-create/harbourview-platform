import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  extractMarketAccessImpactsRuleBased,
  isEligibleForMarketAccessExtraction,
  type EligibleSignal,
} from '@/lib/intelligence/marketAccessAutoApply'
import { resolveCountry } from '@/lib/signals/quality'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** ISO-3 (from resolveCountry) → ISO-2 for common markets; extend as needed. */
const ISO3_TO_ISO2: Record<string, string> = {
  DEU: 'DE', BRA: 'BR', COL: 'CO', CAN: 'CA', USA: 'US', GBR: 'GB',
  AUS: 'AU', NLD: 'NL', FRA: 'FR', ITA: 'IT', ESP: 'ES', PRT: 'PT',
  CHE: 'CH', ISR: 'IL', NZL: 'NZ', POL: 'PL', CZE: 'CZ', DNK: 'DK',
  SWE: 'SE', NOR: 'NO', MEX: 'MX', THA: 'TH', ZAF: 'ZA', MLT: 'MT',
  AUT: 'AT', BEL: 'BE', IRL: 'IE', LUX: 'LU', JPN: 'JP', KOR: 'KR',
}

function resolveIso2(row: Record<string, unknown>): string | null {
  if (typeof row.country_iso2 === 'string' && /^[A-Za-z]{2}$/.test(row.country_iso2)) {
    return row.country_iso2.toUpperCase()
  }
  const identity = resolveCountry(row.country)
  if (!identity?.code) return null
  const code = identity.code.toUpperCase()
  if (code.length === 2) return code
  return ISO3_TO_ISO2[code] ?? null
}

async function alertAutoApplies(
  applies: Array<{ country: string; reason: string }>,
): Promise<void> {
  if (applies.length === 0) return
  const to =
    process.env.MARKET_ACCESS_ALERT_EMAIL?.trim() ||
    process.env.HARBOURVIEW_OPS_EMAIL?.trim()
  const resendKey = process.env.RESEND_API_KEY?.trim()
  if (!to || !resendKey) {
    console.info('market_access_promote: auto_applied (no alert email configured)', applies)
    return
  }
  const from = process.env.HARBOURVIEW_FROM_EMAIL?.trim() ?? 'ops@harbourview.co'
  const lines = applies.map((a) => `• ${a.country}: ${a.reason}`).join('\n')
  const html = `<pre style="font-family:monospace">Heat-map auto-apply\n\n${lines}</pre>`
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `[Harbourview] ${applies.length} heat-map tier auto-apply`,
        html,
      }),
    })
  } catch (err) {
    console.error('market_access_promote: alert send failed', err)
  }
}

/**
 * Cron: close the signal → heat-map loop.
 *
 * 1. Pull recent reviewed / high-confidence signals
 * 2. Extract market-access impacts (rule-based)
 * 3. Record market_access_events (idempotent RPC)
 * 4. Promote pending events into countries.regulatory_tier
 * 5. Email ops on auto_applied (optional)
 *
 * Schedule: every 15 minutes via vercel.json
 * Auth: Authorization: Bearer $CRON_SECRET
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'missing supabase env' }, { status: 500 })
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const since = new Date(Date.now() - 168 * 3600_000).toISOString()
  const { data: signalRows, error: signalErr } = await supabase
    .from('signals')
    .select(
      'id, title_en, summary_en, headline, summary, country_iso2, country, source_id, url, quality_label, quality_confidence, content_type, reviewed, date',
    )
    .or('reviewed.eq.true,quality_confidence.gte.0.8')
    .gte('date', since.slice(0, 10))
    .order('date', { ascending: false })
    .limit(200)

  if (signalErr) {
    console.error('market_access_promote: signal fetch failed', signalErr.message)
  }

  const rows = (signalRows ?? []) as Array<Record<string, unknown>>

  let extracted = 0
  let recorded = 0
  let recordErrors = 0

  for (const row of rows) {
    const iso2 = resolveIso2(row)
    if (!iso2) continue

    const confRaw = row.quality_confidence
    const conf =
      typeof confRaw === 'number'
        ? confRaw > 1
          ? confRaw / 100
          : confRaw
        : typeof confRaw === 'string'
          ? Number(confRaw) > 1
            ? Number(confRaw) / 100
            : Number(confRaw)
          : 0

    const signal: EligibleSignal = {
      id: String(row.id),
      title_en:
        (typeof row.title_en === 'string' && row.title_en) ||
        (typeof row.headline === 'string' ? row.headline : null),
      summary_en:
        (typeof row.summary_en === 'string' && row.summary_en) ||
        (typeof row.summary === 'string' ? row.summary : null),
      country_iso2: iso2,
      source_id: typeof row.source_id === 'string' ? row.source_id : null,
      url: typeof row.url === 'string' ? row.url : null,
      quality_label: typeof row.quality_label === 'string' ? row.quality_label : null,
      quality_confidence: Number.isFinite(conf) ? conf : 0,
      content_type: typeof row.content_type === 'string' ? row.content_type : null,
      reviewed: row.reviewed === true,
    }

    if (!isEligibleForMarketAccessExtraction(signal)) continue

    const impacts = extractMarketAccessImpactsRuleBased(signal)
    if (impacts.length === 0) continue
    extracted += impacts.length

    for (const impact of impacts) {
      const { error: rpcErr } = await supabase.schema('api').rpc('record_market_access_event', {
        p_signal_id: signal.id,
        p_country_iso2: signal.country_iso2,
        p_pathway: impact.pathway,
        p_direction: impact.direction,
        p_proposed_status: impact.proposed_status,
        p_confidence: impact.confidence,
        p_source_id: signal.source_id,
        p_evidence_snippet: impact.evidence_snippet ?? null,
        p_evidence_url: signal.url,
      })

      if (rpcErr) {
        const { error: rpcErr2 } = await supabase.rpc('record_market_access_event', {
          p_signal_id: signal.id,
          p_country_iso2: signal.country_iso2,
          p_pathway: impact.pathway,
          p_direction: impact.direction,
          p_proposed_status: impact.proposed_status,
          p_confidence: impact.confidence,
          p_source_id: signal.source_id,
          p_evidence_snippet: impact.evidence_snippet ?? null,
          p_evidence_url: signal.url,
        })
        if (rpcErr2) {
          console.error(
            'market_access_promote: record_market_access_event failed',
            rpcErr.message,
            rpcErr2.message,
          )
          recordErrors++
        } else {
          recorded++
        }
      } else {
        recorded++
      }
    }
  }

  let promoteResult: unknown = null
  let promoteError: string | null = null

  const { data, error } = await supabase.rpc('promote_market_access_from_signals', {
    p_lookback_hours: 168,
  })

  if (error) {
    const { data: data2, error: error2 } = await supabase
      .schema('api')
      .rpc('promote_market_access_from_signals', { p_lookback_hours: 168 })

    if (error2) {
      promoteError = `${error.message}; fallback: ${error2.message}`
    } else {
      promoteResult = data2
    }
  } else {
    promoteResult = data
  }

  // Surface auto-applies from recent proposal ledger (best-effort)
  const applies: Array<{ country: string; reason: string }> = []
  if (!promoteError) {
    const { data: recent } = await supabase
      .from('market_access_proposals')
      .select('country_iso2, decision_reason, decision')
      .eq('decision', 'auto_applied')
      .gte('decided_at', new Date(Date.now() - 20 * 60_000).toISOString())
      .limit(50)

    for (const row of recent ?? []) {
      applies.push({
        country: String((row as { country_iso2: string }).country_iso2),
        reason: String((row as { decision_reason?: string }).decision_reason ?? 'auto_applied'),
      })
    }
    await alertAutoApplies(applies)
  }

  const summary = {
    ok: !promoteError,
    signals_scanned: rows.length,
    impacts_extracted: extracted,
    events_recorded: recorded,
    record_errors: recordErrors,
    promote: promoteResult,
    promote_error: promoteError,
    auto_applied_alerted: applies.length,
  }
  console.info('market_access_promote_cron: complete', summary)

  if (promoteError) {
    return NextResponse.json(summary, { status: 500 })
  }
  return NextResponse.json(summary)
}

export async function POST(request: Request) {
  return GET(request)
}
