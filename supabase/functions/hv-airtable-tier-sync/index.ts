import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Outbound sync: Supabase regulatory_tier change -> Airtable "Regulatory Tiers" table.
// Called by the public.push_regulatory_tier_to_airtable() trigger via pg_net.
// Auth: gateway JWT (verify_jwt) + internal x-hv-sync-key header matched against vault.
// Airtable PAT is read from the vault via a service-role-only RPC in the api schema.
// If the PAT is still the placeholder, the function safely no-ops.

const AIRTABLE_BASE = "app6SS1hpMDU2O4Fh";
const AIRTABLE_TABLE = "tblxX0pIvQBiqzIP3";
const PAT_PLACEHOLDER = "__REPLACE_WITH_AIRTABLE_PAT__";

const F = {
  iso: "fldWenqf51YdyxrN2",
  tier: "fldED8KPZvVHyj4Nf",
  origin: "fld3aY7Pt5EqtA0ty",
  rationale: "fldUnKplvyUzgaCyM",
  programStatus: "fld45QBdNdW6ljkMT",
  needsReview: "fldZXQQO5ISy2EF25",
  syncOrigin: "fldL6RGAWBIGbqNru",
  lastSynced: "fldnNOPc9xo1soQWD",
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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

    // RPC lives in the api schema (what PostgREST exposes).
    const { data: cfg, error: cfgErr } = await admin.schema("api").rpc("get_airtable_sync_config");
    if (cfgErr) return json({ error: "config_lookup_failed", detail: cfgErr.message }, 500);

    const syncKey: string | null = cfg?.sync_key ?? null;
    const pat: string | null = cfg?.pat ?? null;

    // Internal auth between Postgres trigger and this function.
    const provided = req.headers.get("x-hv-sync-key") ?? "";
    if (!syncKey || provided !== syncKey) return json({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "bad_body" }, 400);

    const { iso, tier, origin, rationale, program_status, needs_review, actor } = body as Record<string, unknown>;
    if (!iso || typeof iso !== "string") return json({ error: "missing_iso" }, 400);

    // Loop guard: never echo an Airtable-originated change back to Airtable.
    if (actor === "airtable") return json({ skipped: true, reason: "actor_airtable", iso });

    // No real token yet -> safe no-op so the pipeline can be wired and tested first.
    if (!pat || pat === PAT_PLACEHOLDER) return json({ skipped: true, reason: "no_airtable_token", iso });

    const AT = "https://api.airtable.com/v0";
    const headers = { Authorization: `Bearer ${pat}`, "Content-Type": "application/json" };

    // Find the existing record by ISO.
    const formula = encodeURIComponent(`{ISO}='${iso}'`);
    const findUrl = `${AT}/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?filterByFormula=${formula}&maxRecords=1&returnFieldsByFieldId=true`;
    const findRes = await fetch(findUrl, { headers });
    if (!findRes.ok) {
      return json({ error: "airtable_find_failed", status: findRes.status, detail: await findRes.text() }, 502);
    }
    const found = await findRes.json();
    const rec = found?.records?.[0];

    const fields: Record<string, unknown> = {
      [F.tier]: tier ?? null,
      [F.origin]: origin ?? null,
      [F.syncOrigin]: "supabase",
      [F.lastSynced]: new Date().toISOString(),
    };
    if (rationale !== undefined && rationale !== null) fields[F.rationale] = rationale;
    if (program_status !== undefined && program_status !== null) fields[F.programStatus] = program_status;
    if (needs_review !== undefined && needs_review !== null) fields[F.needsReview] = Boolean(needs_review);

    let writeRes: Response;
    if (rec) {
      writeRes = await fetch(`${AT}/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?returnFieldsByFieldId=true`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ records: [{ id: rec.id, fields }], typecast: true }),
      });
    } else {
      fields[F.iso] = iso;
      writeRes = await fetch(`${AT}/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?returnFieldsByFieldId=true`, {
        method: "POST",
        headers,
        body: JSON.stringify({ records: [{ fields }], typecast: true }),
      });
    }

    if (!writeRes.ok) {
      return json({ error: "airtable_write_failed", status: writeRes.status, detail: await writeRes.text() }, 502);
    }
    const out = await writeRes.json();
    return json({ ok: true, action: rec ? "update" : "create", iso, recordId: out?.records?.[0]?.id ?? null });
  } catch (e) {
    return json({ error: "unhandled", detail: String(e) }, 500);
  }
});
