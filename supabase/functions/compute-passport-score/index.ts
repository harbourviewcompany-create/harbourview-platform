// compute-passport-score — Harbourview MVP Phase 2
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EDGE_OPERATOR_SECRET = Deno.env.get("HARBOURVIEW_EDGE_OPERATOR_SECRET")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { db: { schema: "api" } });

const DIMENSIONS = {
  identity: { max: 15 }, licence: { max: 25 }, facility: { max: 10 },
  document: { max: 10 }, coa: { max: 15 }, recall: { max: 10 },
  export: { max: 5 }, payment: { max: 5 }, claim: { max: 5 },
} as const;

type Dimension = keyof typeof DIMENSIONS;
type Confidence = "high" | "medium" | "low" | "insufficient_data";
interface DR { score: number; max_score: number; confidence: Confidence; evidence_count: number; flags: string[]; }

function isAuthorized(req: Request): boolean {
  const callerSecret = req.headers.get("x-operator-secret") ?? "";
  if (EDGE_OPERATOR_SECRET && callerSecret === EDGE_OPERATOR_SECRET) return true;
  const authHeader = req.headers.get("Authorization") ?? "";
  return Boolean(SUPABASE_SERVICE_KEY) && authHeader === `Bearer ${SUPABASE_SERVICE_KEY}`;
}

Deno.serve(async (req) => {
  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), { status: 401 });
  }
  let org_id: string;
  try { const body = await req.json(); org_id = body.org_id; if (!org_id) throw new Error("org_id required"); }
  catch { return new Response(JSON.stringify({ error: "INVALID_BODY" }), { status: 400 }); }
  try {
    const result = await computePassport(org_id);
    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error(`[compute-passport-score] ${org_id}:`, err);
    return new Response(JSON.stringify({ error: "COMPUTATION_FAILED", detail: String(err) }), { status: 500 });
  }
});

async function computePassport(org_id: string) {
  const { data: org, error: orgErr } = await supabase.from("workspaces").select("id, legal_name, trade_name, org_type, jurisdiction_country, verification_status, slug").eq("id", org_id).single();
  if (orgErr || !org) throw new Error(`Org not found: ${org_id}`);

  const [licences, facilities, evidenceDocs, claims, coaCheck] = await Promise.all([
    supabase.from("hv_licences").select("id, status, verified, expires_at, licence_type").eq("org_id", org_id),
    supabase.from("hv_facilities").select("id, status").eq("org_id", org_id),
    supabase.from("hv_evidence_documents").select("id, document_type, verification_status, expiry_date").eq("org_id", org_id),
    supabase.from("hv_claims").select("id, status").eq("org_id", org_id),
    supabase.from("hv_evidence_documents").select("id, verification_status").eq("org_id", org_id).eq("document_type", "coa").eq("verification_status", "verified"),
  ]);

  const dims: Record<Dimension, DR> = {
    identity: scoreIdentity(org), licence: scoreLicence(licences.data ?? []),
    facility: scoreFacility(facilities.data ?? []), document: scoreDocument(evidenceDocs.data ?? []),
    coa: scoreCOA(coaCheck.data ?? []), recall: { score: DIMENSIONS.recall.max, max_score: DIMENSIONS.recall.max, confidence: "low", evidence_count: 0, flags: ["recall_check_pending_phase3"] },
    export: scoreExport(licences.data ?? []), payment: { score: 0, max_score: DIMENSIONS.payment.max, confidence: "insufficient_data", evidence_count: 0, flags: ["payment_signals_pending_od06"] },
    claim: scoreClaim(claims.data ?? []),
  };

  const completeness_score = Math.round(Object.values(dims).reduce((s, d) => s + d.score, 0) * 100) / 100;
  const completeness_band = completeness_score >= 85 ? "complete" : completeness_score >= 60 ? "substantial" : completeness_score >= 30 ? "partial" : "incomplete";
  const vl = org.verification_status !== "verified" ? "none" : dims.identity.score >= 15 && dims.licence.confidence !== "insufficient_data" && dims.facility.score > 0 && dims.document.score > 0 ? "enhanced" : dims.identity.score >= 15 && dims.licence.confidence !== "insufficient_data" ? "standard" : dims.identity.score >= 15 ? "basic" : "none";
  const export_readiness_score = dims.export.score / DIMENSIONS.export.max * 100;
  const export_readiness_band = export_readiness_score >= 80 ? "ready" : export_readiness_score >= 40 ? "partial" : "not_ready";
  const now = new Date().toISOString();

  const { data: passport, error: upsertErr } = await supabase.from("hv_passports").upsert({ org_id, completeness_score, completeness_band, verification_level: vl, export_readiness_score, export_readiness_band, recall_exposure_flag: false, last_computed_at: now, updated_at: now }, { onConflict: "org_id" }).select("id").single();
  if (upsertErr || !passport) throw new Error(`Passport upsert failed: ${upsertErr?.message}`);

  const scoreRows = (Object.entries(dims) as [Dimension, DR][]).map(([dimension, r]) => ({ passport_id: passport.id, dimension, score: r.score, max_score: DIMENSIONS[dimension].max, confidence: r.confidence, evidence_count: r.evidence_count, flags: r.flags, computed_at: now }));
  const { error: scoresErr } = await supabase.from("hv_passport_scores").upsert(scoreRows, { onConflict: "passport_id,dimension" });
  if (scoresErr) throw new Error(`Scores upsert failed: ${scoresErr.message}`);

  await supabase.from("audit_events").insert({ entity_type: "passport", entity_id: passport.id, action: "passport.score.computed", actor: "system", actor_org_id: org_id, metadata: { completeness_score, completeness_band, verification_level: vl } });
  await fetch(`${SUPABASE_URL}/functions/v1/generate-org-snapshot`, { method: "POST", headers: { "Content-Type": "application/json", "x-operator-secret": EDGE_OPERATOR_SECRET }, body: JSON.stringify({ org_id }) });

  return { org_id, passport_id: passport.id, completeness_score, completeness_band, verification_level: vl, export_readiness_band };
}

function scoreIdentity(org: Record<string, unknown>): DR {
  const flags: string[] = []; let score = 0; let ev = 0;
  if (org.legal_name && String(org.legal_name).trim()) { score += 5; ev++; } else flags.push("legal_name_missing");
  if (org.jurisdiction_country) { score += 5; ev++; } else flags.push("jurisdiction_missing");
  if (org.org_type) { score += 5; ev++; } else flags.push("org_type_missing");
  return { score, max_score: 15, confidence: ev >= 3 ? "high" : ev >= 2 ? "medium" : "low", evidence_count: ev, flags };
}

function scoreLicence(licences: Record<string, unknown>[]): DR {
  const flags: string[] = [];
  const active = licences.filter((l) => l.status === "active" && new Date(l.expires_at as string) > new Date());
  const verified = active.filter((l) => l.verified === true);
  let score = 0;
  if (active.length > 0) score += 10; else flags.push("no_active_licence");
  if (verified.length > 0) score += 15; else if (active.length > 0) flags.push("licence_not_verified");
  if (active.some((l) => (new Date(l.expires_at as string).getTime() - Date.now()) / 86400000 < 90)) flags.push("licence_expiring_within_90_days");
  return { score, max_score: 25, confidence: verified.length > 0 ? "high" : active.length > 0 ? "medium" : "insufficient_data", evidence_count: licences.length, flags };
}

function scoreFacility(facilities: Record<string, unknown>[]): DR {
  const active = facilities.filter((f) => f.status === "active");
  return { score: active.length > 0 ? 10 : 0, max_score: 10, confidence: active.length > 0 ? "medium" : "insufficient_data", evidence_count: facilities.length, flags: active.length === 0 ? ["no_facility_record"] : [] };
}

function scoreDocument(docs: Record<string, unknown>[]): DR {
  const ins = docs.filter((d) => d.document_type === "insurance" && d.verification_status === "verified");
  const exp = docs.filter((d) => d.document_type === "insurance" && d.expiry_date && new Date(d.expiry_date as string) < new Date());
  const flags: string[] = [];
  if (ins.length === 0) flags.push("no_verified_insurance");
  if (exp.length > 0) flags.push("insurance_expired");
  return { score: ins.length > 0 ? 10 : 0, max_score: 10, confidence: ins.length > 0 ? "medium" : "insufficient_data", evidence_count: docs.length, flags };
}

function scoreCOA(coas: Record<string, unknown>[]): DR {
  return { score: coas.length > 0 ? 15 : 0, max_score: 15, confidence: coas.length > 0 ? "medium" : "insufficient_data", evidence_count: coas.length, flags: coas.length === 0 ? ["no_reviewed_coa"] : [] };
}

function scoreExport(licences: Record<string, unknown>[]): DR {
  const exp = licences.filter((l) => l.status === "active" && ((l.licence_type as string)?.toLowerCase().includes("export") || (l.licence_type as string)?.toLowerCase().includes("import")));
  return { score: exp.length > 0 ? 5 : 0, max_score: 5, confidence: exp.length > 0 ? "medium" : "insufficient_data", evidence_count: exp.length, flags: exp.length === 0 ? ["no_export_import_licence"] : [] };
}

function scoreClaim(claims: Record<string, unknown>[]): DR {
  const supported = claims.filter((c) => c.status === "supported");
  return { score: supported.length > 0 ? 5 : 0, max_score: 5, confidence: supported.length > 0 ? "medium" : "insufficient_data", evidence_count: claims.length, flags: supported.length === 0 ? ["no_supported_claims"] : [] };
}
