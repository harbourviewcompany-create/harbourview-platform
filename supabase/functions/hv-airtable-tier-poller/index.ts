import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Pull-based inbound sync: periodically read the Airtable "Regulatory Tiers" table and
// reconcile any Airtable-side Tier edits into Supabase. Replaces the need for an
// Airtable automation (which can only be created by a human in the Airtable UI).
// Auth: gateway JWT (verify_jwt) + internal x-hv-sync-key. PAT read from vault via api RPC.

const AIRTABLE_BASE = "app6SS1hpMDU2O4Fh";
const AIRTABLE_TABLE = "tblxX0pIvQBiqzIP3";
const PAT_PLACEHOLDER = "__REPLACE_WITH_AIRTABLE_PAT__";
const F_ISO = "fldWenqf51YdyxrN2";
const F_TIER = "fldED8KPZvVHyj4Nf";

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}

function cellToString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "name" in (v as Record<string, unknown>)) {
    return String((v as Record<string, unknown>).name);
  }
  return String(v);
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return json({ error: "missing_runtime_env" }, 500);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: cfg, error: cfgErr } = await admin.schema("api").rpc("get_airtable_sync_config");
    if (cfgErr) return json({ error: "config_lookup_failed", detail: cfgErr.message }, 500);
    const syncKey: string | null = cfg?.sync_key ?? null;
    const pat: string | null = cfg?.pat ?? null;

    const provided = req.headers.get("x-hv-sync-key") ?? "";
    if (!syncKey || provided !== syncKey) return json({ error: "unauthorized" }, 401);
    if (!pat || pat === PAT_PLACEHOLDER) return json({ skipped: true, reason: "no_airtable_token" });

    const AT = "https://api.airtable.com/v0";
    const headers = { Authorization: `Bearer ${pat}` };

    // Page through the whole table, collecting {iso, tier}.
    const rows: Array<{ iso: string; tier: string }> = [];
    let offset: string | undefined = undefined;
    let pages = 0;
    do {
      const params = new URLSearchParams({ pageSize: "100", returnFieldsByFieldId: "true" });
      params.append("fields[]", F_ISO);
      params.append("fields[]", F_TIER);
      if (offset) params.set("offset", offset);
      const url = `${AT}/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?${params.toString()}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        return json({ error: "airtable_list_failed", status: res.status, detail: await res.text() }, 502);
      }
      const data = await res.json();
      for (const rec of data.records ?? []) {
        const f = rec.fields ?? {};
        const iso = cellToString(f[F_ISO]);
        const tier = cellToString(f[F_TIER]);
        if (iso && tier) rows.push({ iso, tier });
      }
      offset = data.offset;
      pages++;
    } while (offset && pages < 10);

    const { data: result, error: rpcErr } = await admin.schema("api").rpc("reconcile_airtable_tiers", { p_rows: rows });
    if (rpcErr) return json({ error: "reconcile_failed", detail: rpcErr.message }, 502);

    return json({ ok: true, scanned: rows.length, pages, result });
  } catch (e) {
    return json({ error: "unhandled", detail: String(e) }, 500);
  }
});
