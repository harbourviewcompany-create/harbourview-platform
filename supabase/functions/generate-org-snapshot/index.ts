import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EDGE_OPERATOR_SECRET = Deno.env.get("HARBOURVIEW_EDGE_OPERATOR_SECRET")!;

// PostgREST on this project only exposes the `api` schema (not `public`).
// Without db.schema set, every query below 406'd with PGRST106.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { db: { schema: "api" } });

Deno.serve(async (req) => {
  const callerSecret = req.headers.get("x-operator-secret") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  if (callerSecret !== EDGE_OPERATOR_SECRET && !authHeader.includes("service_role")) {
    return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), { status: 401 });
  }

  let org_id: string;
  try {
    const body = await req.json();
    org_id = body.org_id;
    if (!org_id) throw new Error("org_id required");
  } catch {
    return new Response(JSON.stringify({ error: "INVALID_BODY" }), { status: 400 });
  }

  try {
    const snapshot = await buildSnapshot(org_id);
    const { error } = await supabase
      .from("hv_org_snapshots")
      .upsert({ org_id, ...snapshot, updated_at: new Date().toISOString() }, { onConflict: "org_id" });
    if (error) throw new Error(`Snapshot upsert failed: ${error.message}`);
    return new Response(JSON.stringify({ ok: true, org_id, snapshot }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`[generate-org-snapshot] ${org_id}:`, err);
    return new Response(JSON.stringify({ error: "SNAPSHOT_FAILED", detail: String(err) }), { status: 500 });
  }
});

async function buildSnapshot(org_id: string) {
  const [orgRes, passportRes, licencesRes, facilitiesRes, docsRes, listingsRes] = await Promise.all([
    supabase.from("workspaces").select("id,legal_name,trade_name,org_type,jurisdiction_country,verification_status,slug,created_at").eq("id", org_id).single(),
    supabase.from("hv_passports").select("completeness_score,completeness_band,verification_level,export_readiness_band,last_computed_at").eq("org_id", org_id).maybeSingle(),
    supabase.from("hv_licences").select("id,status,licence_type,expires_at").eq("org_id", org_id).eq("status", "active"),
    supabase.from("hv_facilities").select("id,status,facility_type").eq("org_id", org_id),
    supabase.from("hv_evidence_documents").select("id,document_type,verification_status").eq("org_id", org_id),
    supabase.from("marketplace_candidates").select("id,listing_id,status").eq("org_id", org_id),
  ]);

  const org = orgRes.data;
  const passport = passportRes.data;
  const licences = licencesRes.data ?? [];
  const facilities = facilitiesRes.data ?? [];
  const docs = docsRes.data ?? [];
  const listings = listingsRes.data ?? [];

  return {
    legal_name: org?.legal_name ?? null,
    trade_name: org?.trade_name ?? null,
    org_type: org?.org_type ?? null,
    jurisdiction_country: org?.jurisdiction_country ?? null,
    verification_status: org?.verification_status ?? "unverified",
    slug: org?.slug ?? null,
    completeness_score: passport?.completeness_score ?? 0,
    completeness_band: passport?.completeness_band ?? "incomplete",
    verification_level: passport?.verification_level ?? "none",
    export_readiness_band: passport?.export_readiness_band ?? "not_ready",
    passport_last_computed_at: passport?.last_computed_at ?? null,
    active_licence_count: licences.length,
    licence_types: [...new Set(licences.map((l: Record<string,unknown>) => l.licence_type).filter(Boolean))],
    facility_count: facilities.filter((f: Record<string,unknown>) => f.status === "active").length,
    verified_doc_count: docs.filter((d: Record<string,unknown>) => d.verification_status === "verified").length,
    marketplace_listing_count: listings.length,
    has_export_licence: licences.some((l: Record<string,unknown>) =>
      typeof l.licence_type === "string" &&
      (l.licence_type.toLowerCase().includes("export") || l.licence_type.toLowerCase().includes("import"))
    ),
    has_coa: docs.some((d: Record<string,unknown>) => d.document_type === "coa" && d.verification_status === "verified"),
    member_since: org?.created_at ?? null,
  };
}
