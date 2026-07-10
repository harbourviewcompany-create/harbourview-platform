import { createClient } from 'jsr:@supabase/supabase-js@2';

const REQUIRED_SECRET_NAME = 'BULK_SOURCE_UPSERT_SECRET';
const FUNCTION_SECRET = Deno.env.get(REQUIRED_SECRET_NAME) ?? '';

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

Deno.serve(async (req: Request) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  // Validate secret header to prevent unauthorized use
  if (!FUNCTION_SECRET) {
    return json({
      ok: false,
      error: 'missing_edge_function_secret',
      required_secret: REQUIRED_SECRET_NAME,
    }, 500);
  }

  const secret = req.headers.get('x-function-secret') ?? '';
  if (secret !== FUNCTION_SECRET) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }

  // PostgREST on this project only exposes the `api` schema (not `public`).
  // Without db.schema set, the upsert below 406'd with PGRST106.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { db: { schema: 'api' } },
  );

  const body = await req.json();
  const records: Record<string, unknown>[] = body.records ?? [];
  const batchNum: number = body.batch ?? 0;

  if (!records.length) {
    return json({ ok: false, error: 'no_records', batch: batchNum }, 400);
  }

  // Build upsert payload
  const payload = records.map((r) => ({
    source_name: r.source_name,
    source_url: r.source_url,
    category_focus: r.category_focus,
    subcategory: r.subcategory,
    source_type: r.source_type,
    tier: r.tier,
    country: r.country,
    notes: r.notes,
    emerging_priority: r.emerging_priority,
    emerging_reason: r.emerging_reason,
    jurisdiction_code: r.jurisdiction_code,
    region: r.region,
    language: r.language,
    authority_level: r.authority_level,
    adapter: r.adapter,
    fetch_method: r.fetch_method,
    crawl_cadence: r.crawl_cadence,
    requires_translation: r.requires_translation,
    signal_keywords: r.signal_keywords,
    is_active: r.is_active,
  }));

  // Upsert in sub-batches of 200 to avoid payload limits
  const CHUNK = 200;
  let inserted = 0;
  const errors: string[] = [];

  for (let i = 0; i < payload.length; i += CHUNK) {
    const chunk = payload.slice(i, i + CHUNK);
    const { error, count } = await supabase
      .from('source_registry')
      .upsert(chunk, {
        onConflict: 'source_url',
        ignoreDuplicates: false,
        count: 'exact',
      });
    if (error) {
      errors.push(`chunk ${i}-${i + CHUNK}: ${error.message}`);
    } else {
      inserted += count ?? chunk.length;
    }
  }

  return json({
    ok: errors.length === 0,
    batch: batchNum,
    submitted: records.length,
    processed: inserted,
    errors: errors.length ? errors : null,
  }, errors.length ? 500 : 200);
});
