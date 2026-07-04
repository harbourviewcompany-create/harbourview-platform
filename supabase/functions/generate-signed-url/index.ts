import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
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

  const authHeader = req.headers.get("Authorization") ?? "";
  const operatorSecret = req.headers.get("x-operator-secret") ?? "";
  const isServiceRole = authHeader.startsWith("Bearer ") && authHeader.slice(7) === SUPABASE_SERVICE_KEY;
  const isOperator = Boolean(OPERATOR_SECRET) && operatorSecret === OPERATOR_SECRET;

  // FIX (2026-07-04): this previously accepted ANY non-empty bearer token as
  // a valid "authenticated user" with no real verification, and the ownership
  // check below ran under a service-role client regardless of caller identity
  // -- meaning that check never actually enforced anything. Now: service role
  // / operator secret bypass explicitly, otherwise the bearer token must
  // verify as a real Supabase Auth user, and the vault lookup runs under the
  // ANON key + that user's token so RLS on project_vault actually applies.
  let requestingUserId: string | null = null;
  if (!isServiceRole && !isOperator) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return respond(401, { error: "unauthorized" });

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return respond(401, { error: "unauthorized", detail: "token did not verify as an authenticated user" });
    }
    requestingUserId = userData.user.id;
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
  // Without db.schema set on both clients, table queries 406'd with PGRST106.
  //
  // Ownership check client: service role + operator callers use the service
  // client directly (trusted, no RLS needed). Regular users go through the
  // ANON key with their own verified token attached, so RLS on project_vault
  // actually restricts which rows they can see -- this is the fix; previously
  // this client always used the service role key regardless of caller.
  const ownershipClient = (isServiceRole || isOperator)
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false }, db: { schema: "api" } })
    : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
        db: { schema: "api" },
      });

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
    db: { schema: "api" },
  });

  // Verify the file exists in project_vault and belongs to the caller.
  // For a real user, RLS on project_vault (not this code) is what actually
  // restricts this to rows they're allowed to see.
  const { data: vaultRecord, error: vaultErr } = await ownershipClient
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
    requesting_user_id: requestingUserId,
  });
});
