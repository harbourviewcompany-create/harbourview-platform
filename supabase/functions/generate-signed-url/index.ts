import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPERATOR_SECRET = Deno.env.get("HARBOURVIEW_EDGE_OPERATOR_SECRET") ?? "";
const STORAGE_BUCKET = "hv-project-vault";

const JSON_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };

function respond(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type, x-operator-secret",
      },
    });
  }

  if (req.method !== "POST") return respond(405, { error: "method_not_allowed" });

  // Auth: accept service-role JWT or operator secret header
  const authHeader = req.headers.get("Authorization") ?? "";
  const operatorSecret = req.headers.get("x-operator-secret") ?? "";
  const isServiceRole = authHeader.startsWith("Bearer ") && authHeader.includes(SUPABASE_SERVICE_KEY);
  const isOperator = OPERATOR_SECRET && operatorSecret === OPERATOR_SECRET;

  if (!isServiceRole && !isOperator) {
    // Fall back: validate as an authenticated user JWT
    const userToken = authHeader.replace("Bearer ", "").trim();
    if (!userToken) return respond(401, { error: "unauthorized" });
  }

  let storagePath: string;
  let expiresIn = 3600; // 1 hour default

  try {
    const body = await req.json();
    storagePath = body.storage_path;
    if (!storagePath) throw new Error("storage_path required");
    if (typeof body.expires_in === "number" && body.expires_in > 0) {
      expiresIn = Math.min(body.expires_in, 86400); // max 24h
    }
  } catch (err) {
    return respond(400, { error: "invalid_body", detail: String(err) });
  }

  // PostgREST on this project only exposes the `api` schema (not `public`).
  // This function uses two clients:
  //   1. User client (from request JWT) — for RLS-gated project_vault ownership check
  //   2. Service client — for the signed URL generation (requires service role)
  // Without db.schema set on both, table queries 406'd with PGRST106.
  const authHeader2 = req.headers.get("Authorization") ?? "";
  const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    global: { headers: { Authorization: authHeader2 } },
    auth: { persistSession: false },
    db: { schema: "api" },
  });

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
    db: { schema: "api" },
  });

  // Verify the file exists in project_vault and belongs to the caller
  const { data: vaultRecord, error: vaultErr } = await userClient
    .from("project_vault")
    .select("id, storage_path, org_id, file_name")
    .eq("storage_path", storagePath)
    .maybeSingle();

  if (vaultErr) return respond(500, { error: "vault_query_failed", detail: vaultErr.message });
  if (!vaultRecord) return respond(404, { error: "file_not_found", storage_path: storagePath });

  // Generate signed URL via service role (storage doesn't require schema)
  const { data: signedData, error: signedErr } = await serviceClient.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (signedErr || !signedData?.signedUrl) {
    return respond(500, { error: "signed_url_failed", detail: signedErr?.message ?? "no url returned" });
  }

  return respond(200, {
    ok: true,
    signed_url: signedData.signedUrl,
    expires_in: expiresIn,
    file_name: vaultRecord.file_name,
    storage_path: storagePath,
  });
});
