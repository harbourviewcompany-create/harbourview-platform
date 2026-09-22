import { withSupabase } from "npm:@supabase/server";

const cors = {
  "Access-Control-Allow-Origin": "https://harbourview.vercel.app",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function htmlToText(html: string): string {
  return html
    .replace(/<script[\\s\\S]*?<\\/script>/gi, " ")
    .replace(/<style[\\s\\S]*?<\\/style>/gi, " ")
    .replace(/<noscript[\\s\\S]*?<\\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\\s+/g, " ")
    .trim();
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(
  withSupabase({ auth: "secret" }, async (req, ctx) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
    if (req.method !== "POST") {
      return Response.json({ error: "method_not_allowed" }, { status: 405, headers: cors });
    }

    const body = await req.json().catch(() => null);
    const sourceId = body?.source_id;
    if (typeof sourceId !== "string") {
      return Response.json({ error: "source_id_required" }, { status: 400, headers: cors });
    }

    const { data: source, error: sourceError } = await ctx.supabaseAdmin
      .from("source_registry")
      .select("id,source_url,is_active,crawl_allowed,source_name,jurisdiction_code,iso")
      .eq("id", sourceId)
      .maybeSingle();

    if (sourceError) {
      return Response.json({ error: "source_lookup_failed", detail: sourceError.message }, { status: 500, headers: cors });
    }
    if (!source || !source.is_active || !source.crawl_allowed || !source.source_url) {
      return Response.json({ error: "source_not_crawlable" }, { status: 409, headers: cors });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    let response: Response;
    let html = "";
    try {
      response = await fetch(source.source_url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "Harbourview-Regulatory-Source-Capture/1.0",
          "Accept": "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.5",
        },
      });
      html = await response.text();
    } catch (error) {
      clearTimeout(timeout);
      const message = error instanceof Error ? error.message : String(error);
      await ctx.supabaseAdmin.from("source_snapshots").insert({
        source_id: source.id,
        captured_url: source.source_url,
        captured_title: source.source_name,
        captured_at: new Date().toISOString(),
        fetch_status: "error",
        error_message: message,
      });
      return Response.json({ error: "fetch_failed", detail: message }, { status: 502, headers: cors });
    }
    clearTimeout(timeout);

    const capturedAt = new Date().toISOString();
    const text = htmlToText(html);
    const hash = await sha256Hex(html);

    const { data: previous } = await ctx.supabaseAdmin
      .from("source_snapshots")
      .select("raw_html_hash")
      .eq("source_id", source.id)
      .eq("fetch_status", "success")
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: snapshot, error: insertError } = await ctx.supabaseAdmin
      .from("source_snapshots")
      .insert({
        source_id: source.id,
        captured_url: source.source_url,
        captured_title: source.source_name,
        captured_text: text,
        raw_html_hash: hash,
        captured_at: capturedAt,
        fetch_status: response.ok ? "success" : "http_error",
        error_message: response.ok ? null : `HTTP ${response.status}`,
        language_detected: "unknown",
        word_count: text ? text.split(/\\s+/).length : 0,
        requires_translation: false,
        previous_hash: previous?.raw_html_hash ?? null,
        changed: previous?.raw_html_hash ? previous.raw_html_hash !== hash : true,
        published_at: null,
      })
      .select("id,fetch_status,captured_at,raw_html_hash,changed")
      .single();

    if (insertError) {
      return Response.json({ error: "snapshot_insert_failed", detail: insertError.message }, { status: 500, headers: cors });
    }

    await ctx.supabaseAdmin
      .from("source_registry")
      .update({
        last_checked_at: capturedAt,
        next_crawl_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        network_status: response.ok ? "online" : "http_error",
        consecutive_failures: response.ok ? 0 : 1,
        last_error_log: response.ok ? null : `HTTP ${response.status}`,
      })
      .eq("id", source.id);

    return Response.json({
      ok: response.ok,
      source_id: source.id,
      jurisdiction_key: source.jurisdiction_code ?? source.iso,
      snapshot,
    }, { status: response.ok ? 200 : 502, headers: cors });
  }),
);
