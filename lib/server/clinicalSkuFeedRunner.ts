import 'server-only'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { fetchAnvisaSkuFeed } from '@/lib/clinical/feeds/anvisaSkuFeed'
import { fetchTgaSkuFeed } from '@/lib/clinical/feeds/tgaSkuFeed'

export async function runClinicalSkuFeeds(opts?: { authorities?: Array<'ANVISA' | 'TGA'> }) {
  const authorities = opts?.authorities ?? (['ANVISA', 'TGA'] as const)
  const admin = await createSupabaseServiceClient()
  const results: unknown[] = []

  for (const authority of authorities) {
    const feed = authority === 'ANVISA' ? await fetchAnvisaSkuFeed() : await fetchTgaSkuFeed()

    const { data: runRow, error: runErr } = await admin
      .from('clinical_sku_feed_runs')
      .insert({
        authority: feed.authority,
        country_iso2: feed.countryIso2,
        status: feed.status,
        source_url: feed.sourceUrl,
        http_status: feed.httpStatus,
        error_message: feed.errorMessage ?? null,
        raw_fingerprint: feed.rawFingerprint ?? null,
        finished_at: new Date().toISOString(),
        rows_upserted: 0,
        metadata: { rowCount: feed.rows.length },
      })
      .select('id')
      .single()

    if (runErr) {
      results.push({ authority, error: runErr.message })
      continue
    }

    let upserted = 0
    for (const row of feed.rows) {
      const { error } = await admin.from('clinical_formulary_skus').upsert(
        {
          country_iso2: row.countryIso2,
          authority: row.authority,
          registration_code: row.registrationCode,
          brand_name: row.brandName,
          product_name: row.productName,
          strength_label: row.strengthLabel,
          dosage_form: row.dosageForm,
          route: row.route,
          cannabinoid_profile: row.cannabinoidProfile,
          authorization_status: row.authorizationStatus,
          source_url: row.sourceUrl,
          source_type: row.sourceType,
          feed_run_id: runRow.id,
          last_seen_at: new Date().toISOString(),
          review_status: 'published',
          notes: row.notes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'country_iso2,authority,registration_code,product_name' },
      )
      if (!error) upserted += 1
    }

    await admin
      .from('clinical_sku_feed_runs')
      .update({ rows_upserted: upserted, finished_at: new Date().toISOString() })
      .eq('id', runRow.id)

    results.push({
      authority: feed.authority,
      status: feed.status,
      upserted,
      httpStatus: feed.httpStatus,
      errorMessage: feed.errorMessage,
      feedRunId: runRow.id,
    })
  }

  return { ok: true, results }
}
