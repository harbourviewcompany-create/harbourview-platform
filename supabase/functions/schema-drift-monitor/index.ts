import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { matchesRequiredSecret } from "../_shared/harbourview-auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const ALERT_EMAIL_TO = Deno.env.get("SCHEMA_DRIFT_ALERT_EMAIL") ?? "";
const ALERT_EMAIL_FROM = Deno.env.get("SCHEMA_DRIFT_ALERT_FROM") ?? "alerts@harbourview.dev";
const CRON_SECRET = Deno.env.get("SCHEMA_DRIFT_CRON_SECRET") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: { schema: "api" },
});

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function sendAlertEmail(tables: string[], fns: string[]): Promise<void> {
  if (!RESEND_API_KEY || !ALERT_EMAIL_TO) return;
  const tableHtml = tables.length ? `<h3>Tables</h3><ul>${tables.map((n) => `<li><code>${n}</code></li>`).join("")}</ul>` : "";
  const fnHtml = fns.length ? `<h3>Functions</h3><ul>${fns.map((n) => `<li><code>${n}</code></li>`).join("")}</ul>` : "";
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: ALERT_EMAIL_FROM,
      to: ALERT_EMAIL_TO,
      subject: `Harbourview: ${tables.length + fns.length} new object(s) not exposed to api schema`,
      html: `
        <p>New public-schema table(s) or read-query function(s) detected with no
        matching exposure in the <code>api</code> schema (the one PostgREST
        serves). Any page or client calling these via REST/RPC gets 404 right now.</p>
        ${tableHtml}
        ${fnHtml}
        <p><strong>Table fix:</strong> <code>CREATE OR REPLACE VIEW api.NAME AS SELECT * FROM public.NAME;</code>
        then <code>ALTER VIEW api.NAME SET (security_invoker = true);</code> --
        without this, RLS on the underlying table is silently bypassed for every
        caller. This has regressed 6+ times; do not skip it even for a quick fix.
        Then grant to match existing RLS, then <code>NOTIFY pgrst, 'reload schema';</code>
        (a ddl_command_end event trigger now auto-applies security_invoker for any
        api-schema view going forward, but explicit is safer than relying on it.)</p>
        <p><strong>Function fix:</strong> <code>CREATE OR REPLACE FUNCTION api.NAME(...) LANGUAGE sql STABLE
        SECURITY INVOKER
        AS $$ SELECT * FROM public.NAME(...) $$;</code> then
        <code>GRANT EXECUTE ... TO anon, authenticated;</code> -- SECURITY INVOKER unless
        you specifically need elevated privilege and have verified the function's own
        internal checks gate who can actually use it.</p>
      `,
    }),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" });
  if (!CRON_SECRET) return json(503, { ok: false, error: "service_not_configured" });
  if (!matchesRequiredSecret(CRON_SECRET, req.headers.get("x-harbourview-cron-secret"))) return json(401, { ok: false, error: "unauthorized" });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(503, { ok: false, error: "missing_supabase_env" });

  const [{ data: missingTables, error: tableError }, { data: missingFns, error: functionError }] = await Promise.all([
    supabase.rpc("get_tables_missing_from_api_schema"),
    supabase.rpc("get_functions_missing_from_api_schema"),
  ]);

  if (tableError || functionError) {
    return json(500, { ok: false, error: tableError?.message ?? functionError?.message ?? "schema_drift_query_failed" });
  }

  const tableNames: string[] = (missingTables ?? []).map((row: { table_name: string }) => row.table_name);
  const fnNames: string[] = (missingFns ?? []).map((row: { function_name: string }) => row.function_name);
  const allKeys = [...tableNames, ...fnNames.map((name) => `fn:${name}`)];

  if (allKeys.length === 0) return json(200, { ok: true, missing_count: 0, new_missing: [] });

  const { data: known, error: knownError } = await supabase
    .from("schema_drift_alerts")
    .select("object_name")
    .in("object_name", allKeys);
  if (knownError) return json(500, { ok: false, error: knownError.message });

  const knownSet = new Set((known ?? []).map((row: { object_name: string }) => row.object_name));
  const newTables = tableNames.filter((name) => !knownSet.has(name));
  const newFns = fnNames.filter((name) => !knownSet.has(`fn:${name}`));
  const newKeys = [...newTables, ...newFns.map((name) => `fn:${name}`)];

  if (newKeys.length > 0) {
    const { error: insertError } = await supabase
      .from("schema_drift_alerts")
      .insert(newKeys.map((object_name) => ({ object_name, first_seen_at: new Date().toISOString() })));
    if (insertError) return json(500, { ok: false, error: insertError.message });
    await sendAlertEmail(newTables, newFns);
  }

  return json(200, {
    ok: true,
    missing_tables: tableNames.length,
    missing_functions: fnNames.length,
    new_tables: newTables,
    new_functions: newFns,
  });
});
