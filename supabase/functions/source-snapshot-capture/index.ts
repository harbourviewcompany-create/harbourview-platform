import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPERATOR_SECRET = Deno.env.get("HARBOURVIEW_SOURCE_CAPTURE_SECRET") ?? "";
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function authorized(req: Request) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\\s+/i, "");
  const supplied = req.headers.get("x-harbourview-operator-secret");
  if (SERVICE_ROLE_KEY && bearer && bearer === SERVICE_ROLE_KEY) return true;
  if (OPERATOR_SECRET && supplied && supplied === OPERATOR_SECRET) return true;
  if (supplied) {
    const { data } = await supabase.rpc("verify_source_engine_cron_secret",{candidate:supplied});
    if (data === true) return true;
  }
  return false;
}

function htmlToText(value: string) {
  return value.replace(/<script[\s\S]*?<\/script>/gi," ")
    .replace(/<style[\s\S]*?<\/style>/gi," ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi," ")
    .replace(/<[^>]+>/g," ")
    .replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&lt;/gi,"<")
    .replace(/&gt;/gi,">").replace(/&#39;/gi,"'").replace(/&quot;/gi,'"')
    .replace(/\s+/g," ").trim();
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2,"0")).join("");
}

async function fetchOne(source: any) {
  const capturedAt = new Date().toISOString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(source.source_url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Harbourview-Regulatory-Source-Capture/2.0",
        "Accept": "text/html,application/xhtml+xml,application/pdf;q=0.9,application/json;q=0.8,*/*;q=0.5"
      }
    });
    const body = await response.text();
    const text = (response.headers.get("content-type")?.toLowerCase().includes("text/html")
      ? htmlToText(body) : body).replace(/\u0000/g, " ").slice(0, 100000);
    const hash = await sha256(body);
    const { data: previous } = await supabase.from("source_snapshots")
      .select("raw_html_hash").eq("source_id",source.id).eq("fetch_status","success")
      .order("captured_at",{ascending:false}).limit(1).maybeSingle();

    let { data: snapshot, error } = await supabase.from("source_snapshots").insert({
      source_id: source.id,
      snapshot_hash: hash,
      fetched_at: capturedAt,
      http_status: response.status,
      raw_payload: null,
      captured_url: source.source_url,
      captured_title: source.source_name,
      captured_text: response.ok ? text : null,
      raw_html_hash: hash,
      captured_at: capturedAt,
      fetch_status: response.ok ? "success" : "failed",
      error_message: response.ok ? null : `HTTP ${response.status}`,
      language_detected: "unknown",
      word_count: text ? text.split(/\s+/).length : 0,
      requires_translation: false,
      previous_hash: previous?.raw_html_hash ?? null,
      changed: previous?.raw_html_hash ? previous.raw_html_hash !== hash : true,
      processing_status: "pending"
    }).select("id,fetch_status,captured_at,raw_html_hash,changed").single();
    if (error?.code === "23505") {
      const existing = await supabase.from("source_snapshots")
        .select("id,fetch_status,captured_at,raw_html_hash,changed")
        .eq("source_id", source.id)
        .eq("snapshot_hash", hash)
        .maybeSingle();
      if (existing.error) throw new Error(`snapshot_lookup_failed: ${existing.error.message}`);
      snapshot = existing.data;
      error = null;
    }
    if (error || !snapshot) throw new Error(`snapshot_insert_failed: ${error?.message ?? "snapshot_missing"}`);

    const backoffHours = response.ok ? 24 : ([401,403,404,410].includes(response.status) ? 168 : 24);
    await supabase.from("source_registry").update({
      last_checked_at: capturedAt,
      next_crawl_at: new Date(Date.now()+backoffHours*3600000).toISOString(),
      network_status: response.ok ? "online" : ([401,403,404,410].includes(response.status) ? "quarantined" : "degraded"),
      consecutive_failures: response.ok ? 0 : 1,
      last_error_log: response.ok ? null : `HTTP ${response.status}`,
      locked_by: null, locked_until: null, updated_at: capturedAt
    }).eq("id",source.id);

    return {source_id:source.id,ok:response.ok,status:response.status,snapshot_id:snapshot.id};
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const errorHash = await sha256(`${source.source_url}|${capturedAt}|${message}`);
    await supabase.from("source_snapshots").insert({
      source_id:source.id,
      snapshot_hash:errorHash,
      fetched_at:capturedAt,
      http_status:null,
      raw_payload:null,
      captured_url:source.source_url,
      captured_title:source.source_name,
      captured_at:capturedAt,
      fetch_status:"failed",
      error_message:message,
      processing_status:"pending"
    });
    await supabase.from("source_registry").update({
      last_checked_at:capturedAt,
      next_crawl_at:new Date(Date.now()+(/certificate|UnknownIssuer|NotValidForName|TLS/i.test(message) ? 168 : 24)*3600000).toISOString(),
      network_status: /certificate|UnknownIssuer|NotValidForName|TLS/i.test(message) ? "quarantined" : "degraded", consecutive_failures:1, last_error_log:message.slice(0,500),
      locked_by:null, locked_until:null, updated_at:capturedAt
    }).eq("id",source.id);
    return {source_id:source.id,ok:false,error:message};
  } finally { clearTimeout(timer); }
}

Deno.serve(async req => {
  if (req.method !== "POST") return Response.json({error:"method_not_allowed"},{status:405});
  if (!(await authorized(req))) return Response.json({error:"unauthorized"},{status:401});
  const url = new URL(req.url);
  const limit = Math.max(1,Math.min(Number(url.searchParams.get("limit") ?? "8"),8));
  const worker = url.searchParams.get("worker") ?? crypto.randomUUID();

  const { data:sources,error } = await supabase.rpc("acquire_full_depth_crawl_targets",{
    p_limit:limit,p_worker_id:worker
  });
  if (error) return Response.json({error:"acquire_failed",detail:error.message},{status:500});

  const results = await Promise.all((sources ?? []).map(fetchOne));
  return Response.json({
    ok:true,worker,claimed:(sources ?? []).length,
    succeeded:results.filter((r:any)=>r.ok).length,
    failed:results.filter((r:any)=>!r.ok).length,results
  });
});