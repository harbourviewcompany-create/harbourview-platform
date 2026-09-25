import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const MODEL = Deno.env.get("FULL_DEPTH_EVIDENCE_MODEL") ?? "gpt-5.6-luna";
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);



const ruleDimensions = new Set([
  "access_rules","commercial_activity","import","export","distribution",
  "testing","packaging_labeling","tax_fees",
]);

function auth(req: Request) {
  const expectedServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const suppliedBearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const suppliedOperator = req.headers.get("x-harbourview-operator-secret");
  const expectedOperator = Deno.env.get("HARBOURVIEW_FULL_DEPTH_CAPTURE_SECRET");
  return Boolean(
    (expectedServiceRole && suppliedBearer && suppliedBearer === expectedServiceRole) ||
    (expectedOperator && suppliedOperator && suppliedOperator === expectedOperator)
  );
}

async function sha256(value: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2,"0")).join("");
}

async function capture(source: any) {
  const started = new Date().toISOString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(source.source_url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Harbourview-Full-Depth-Authority-Capture/1.0",
        "Accept": "text/html,application/xhtml+xml,application/pdf;q=0.9,application/json;q=0.8,*/*;q=0.5",
      },
    });
    const body = await response.text();
    const text = body
      .replace(/<script[\s\S]*?<\/script>/gi," ")
      .replace(/<style[\s\S]*?<\/style>/gi," ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi," ")
      .replace(/<[^>]+>/g," ")
      .replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&")
      .replace(/&lt;/gi,"<").replace(/&gt;/gi,">")
      .replace(/&#39;/gi,"'").replace(/&quot;/gi,'"')
      .replace(/\s+/g," ").trim();
    const hash = await sha256(body);
    const { data, error } = await supabase.from("source_snapshots").insert({
      source_id: source.id,
      captured_text: text,
      raw_html_hash: hash,
      captured_at: started,
      fetch_status: response.ok ? "success" : "http_error",
    }).select("id,captured_text,raw_html_hash,fetch_status,captured_at").single();
    if (error) throw new Error(`snapshot_insert_failed: ${error.message}`);
    if (!response.ok) throw new Error(`http_${response.status}`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function extract(job: any, source: any, snapshot: any) {
  const schema = {
    type:"object",
    additionalProperties:false,
    properties:{
      applicability:{type:"string",enum:["applicable","not_applicable"]},
      evidence_kind:{type:"string",enum:["authority_rule","authority_statement","structural_fact","verified_research"]},
      decision:{type:"string",enum:["complete","needs_review"]},
      evidence_quote:{type:"string"},
      basis_text:{type:"string"},
      effective_from:{type:["string","null"]},
      effective_to:{type:["string","null"]},
      payload:{type:"object",additionalProperties:true},
    },
    required:["applicability","evidence_kind","decision","evidence_quote","basis_text","effective_from","effective_to","payload"],
  };
  const prompt = `You are the evidence adjudicator for Harbourview's commercial cannabis market-access intelligence system.
Use ONLY the supplied captured first-party authority text. Do not use prior knowledge.
Jurisdiction: ${job.jurisdiction_key}
Dimension: ${job.dimension_key}
Authority: ${source.source_name}
URL: ${source.source_url}

Return a decision only if the captured text directly supports the dimension. If it does not, return needs_review.
For not_applicable, the source must directly support why the dimension does not apply in this jurisdiction; do not infer N/A from silence.
The evidence_quote MUST be an exact contiguous substring of the supplied source text, <=1200 characters.
Dates must be YYYY-MM-DD or null. Payload must contain only facts supported by the quote.
`;
  const response = await fetch("https://api.openai.com/v1/responses",{
    method:"POST",
    headers:{"Authorization":`Bearer ${OPENAI_API_KEY}`,"Content-Type":"application/json"},
    body:JSON.stringify({
      model:MODEL,
      input:[{role:"system",content:prompt},{role:"user",content:snapshot.captured_text.slice(0,180000)}],
      text:{format:{type:"json_schema",name:"harbourview_full_depth_evidence",strict:true,schema}},
    }),
  });
  if (!response.ok) throw new Error(`openai_${response.status}: ${(await response.text()).slice(0,500)}`);
  const body = await response.json();
  const raw = body.output_text;
  if (typeof raw !== "string") throw new Error("missing_output_text");
  const parsed = JSON.parse(raw);
  if (!parsed.evidence_quote || !snapshot.captured_text.includes(parsed.evidence_quote)) {
    throw new Error("quote_not_found_in_snapshot");
  }
  if (parsed.decision !== "complete") return parsed;
  if (!["applicable","not_applicable"].includes(parsed.applicability)) throw new Error("invalid_applicability");
  return parsed;
}

async function processJob(job: any) {
  const { data: claimedJob, error: claimError } = await supabase
    .from("jurisdiction_data_depth_capture_jobs")
    .update({
      status:"capturing",
      attempts:(job.attempts ?? 0)+1,
      last_error:null,
      updated_at:new Date().toISOString()
    })
    .eq("id",job.id)
    .eq("status","queued")
    .select("id,jurisdiction_key,dimension_key,attempts")
    .maybeSingle();
  if (claimError) throw new Error(`job_claim_failed: ${claimError.message}`);
  if (!claimedJob) return {status:"skipped",reason:"JOB_ALREADY_CLAIMED"};
  job = claimedJob;

  const {data: sources,error: sourceError} = await supabase.from("source_registry")
    .select("id,source_name,source_url,jurisdiction_code,iso,is_active,crawl_allowed,source_type,regulator_class")
    .eq("is_active",true).eq("crawl_allowed",true)
    .or(`jurisdiction_code.eq.${job.jurisdiction_key},iso.eq.${job.jurisdiction_key}`)
    .not("source_url","is",null)
    .like("source_url","https://%")
    .order("source_type",{ascending:true}).limit(20);
  if (sourceError) throw new Error(`source_lookup_failed: ${sourceError.message}`);
  const source = (sources ?? []).find((s:any) => ["government","regulator","government_legal"].includes(s.source_type) || /regulator|government|authority|ministry|agency|department/i.test(s.source_name ?? ""));
  if (!source) {
    await supabase.from("jurisdiction_data_depth_capture_jobs").update({status:"blocked",last_error:"NO_JURISDICTION_SPECIFIC_PRIMARY_SOURCE",updated_at:new Date().toISOString()}).eq("id",job.id);
    return {status:"blocked",reason:"NO_JURISDICTION_SPECIFIC_PRIMARY_SOURCE"};
  }

  const snapshot = await capture(source);
  if (snapshot.fetch_status !== "success" || !snapshot.captured_text) throw new Error("snapshot_not_qualifying");

  const result = await extract(job,source,snapshot);
  await supabase.from("jurisdiction_data_depth_capture_jobs").update({source_registry_id:source.id,source_snapshot_id:snapshot.id,status:"captured",extracted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",job.id);

  if (result.decision !== "complete") {
    await supabase.from("jurisdiction_data_depth_capture_jobs").update({status:"needs_review",last_error:"SOURCE_CAPTURED_BUT_DIMENSION_NOT_DIRECTLY_SUPPORTED",updated_at:new Date().toISOString()}).eq("id",job.id);
    return {status:"needs_review",snapshot_id:snapshot.id};
  }

  const now = new Date().toISOString();
  const evidenceRow = {
    jurisdiction_key:job.jurisdiction_key,
    dimension_key:job.dimension_key,
    evidence_kind:result.evidence_kind,
    applicability:result.applicability,
    evidence_payload:result.payload,
    evidence_quote:result.evidence_quote,
    source_registry_id:source.id,
    source_snapshot_id:snapshot.id,
    source_url:source.source_url,
    effective_from:result.effective_from,
    effective_to:result.effective_to,
    verification_status:"verified",
    verified_at:now,
    updated_at:now,
  };
  const { data: existingEvidence, error: existingEvidenceError } = await supabase
    .from("jurisdiction_data_depth_evidence")
    .select("id")
    .eq("jurisdiction_key",job.jurisdiction_key)
    .eq("dimension_key",job.dimension_key)
    .eq("verification_status","verified")
    .maybeSingle();
  if (existingEvidenceError) throw new Error(`evidence_lookup_failed: ${existingEvidenceError.message}`);
  let evidenceWrite;
  if (existingEvidence) {
    evidenceWrite = await supabase
      .from("jurisdiction_data_depth_evidence")
      .update({...evidenceRow,updated_at:now})
      .eq("id",existingEvidence.id);
  } else {
    evidenceWrite = await supabase
      .from("jurisdiction_data_depth_evidence")
      .insert(evidenceRow);
    if (evidenceWrite.error?.code === "23505") {
      const {data: racedEvidence,error:racedLookupError}=await supabase
        .from("jurisdiction_data_depth_evidence")
        .select("id")
        .eq("jurisdiction_key",job.jurisdiction_key)
        .eq("dimension_key",job.dimension_key)
        .eq("verification_status","verified")
        .maybeSingle();
      if (racedLookupError) throw new Error(`evidence_race_lookup_failed: ${racedLookupError.message}`);
      if (!racedEvidence) throw new Error(`evidence_write_failed: ${evidenceWrite.error.message}`);
      evidenceWrite = await supabase
        .from("jurisdiction_data_depth_evidence")
        .update({...evidenceRow,updated_at:now})
        .eq("id",racedEvidence.id);
    }
  }
  if (evidenceWrite.error) throw new Error(`evidence_write_failed: ${evidenceWrite.error.message}`);

  const {error: appError}=await supabase.from("jurisdiction_data_depth_applicability_evidence").upsert({
    jurisdiction_key:job.jurisdiction_key,
    dimension_key:job.dimension_key,
    applicability:result.applicability,
    basis_type:result.evidence_kind,
    basis_text:result.basis_text,
    source_url:source.source_url,
    source_snapshot_id:snapshot.id,
    verification_status:"verified",
    verified_at:now,
  },{onConflict:"jurisdiction_key,dimension_key"});
  if(appError) throw new Error(`applicability_insert_failed: ${appError.message}`);

  const { error: stateError } = await supabase
    .from("jurisdiction_data_depth_dimension_state")
    .update({
      applicability: result.applicability,
      evidence_count: 1,
      primary_source_count: 1,
      latest_verified_at: now,
      last_evaluated_at: now,
      updated_at: now,
    })
    .eq("jurisdiction_key", job.jurisdiction_key)
    .eq("dimension_key", job.dimension_key)
    .eq("contract_version", "2026-09-23.v2");
  if (stateError) throw new Error(`state_update_failed: ${stateError.message}`);

  if (ruleDimensions.has(job.dimension_key) && result.applicability==="applicable") {
    const {error: ruleError}=await supabase.from("jurisdiction_regulatory_rules").insert({
      jurisdiction_key:job.jurisdiction_key,
      rule_dimension:job.dimension_key,
      rule_type:"authority_extracted",
      rule_value:result.payload,
      source_url:source.source_url,
      source_snapshot_id:snapshot.id,
      effective_from:result.effective_from,
      effective_to:result.effective_to,
      verification_status:"verified",
      verified_at:now,
    });
    if(ruleError && !/duplicate|unique/i.test(ruleError.message)) throw new Error(`rule_insert_failed: ${ruleError.message}`);
  }

  await supabase.from("jurisdiction_data_depth_capture_jobs").update({status:"complete",completed_at:now,updated_at:now}).eq("id",job.id);
  return {status:"complete",snapshot_id:snapshot.id};
}

Deno.serve(async (req)=>{
  if(req.method!=="POST") return Response.json({error:"method_not_allowed"},{status:405});
  if(!auth(req)) return Response.json({error:"unauthorized"},{status:401});
  if(!OPENAI_API_KEY) return Response.json({error:"OPENAI_API_KEY_missing"},{status:503});

  const url=new URL(req.url);
  const limit=Math.max(1,Math.min(Number(url.searchParams.get("limit") ?? "10"),25));
  const {data:jobs,error}=await supabase.from("jurisdiction_data_depth_capture_jobs")
    .select("id,jurisdiction_key,dimension_key,attempts")
    .eq("status","queued").order("updated_at",{ascending:true}).limit(limit);
  if(error) return Response.json({error:error.message},{status:500});

  const results=[];
  for(const job of jobs ?? []) {
    try { results.push({job_id:job.id,jurisdiction_key:job.jurisdiction_key,dimension_key:job.dimension_key,...await processJob(job)}); }
    catch(e) {
      const message=e instanceof Error?e.message:String(e);
      await supabase.from("jurisdiction_data_depth_capture_jobs").update({status:"needs_review",last_error:message.slice(0,1000),updated_at:new Date().toISOString()}).eq("id",job.id);
      results.push({job_id:job.id,status:"needs_review",error:message});
    }
  }
  return Response.json({ok:true,model:MODEL,processed:results.length,results});
});
