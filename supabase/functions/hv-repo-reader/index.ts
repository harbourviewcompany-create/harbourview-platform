/**
 * hv-repo-reader — SECURITY FIX 2026-07-11
 *
 * Found during the edge-function security audit with ZERO caller
 * authentication of any kind: verify_jwt=false, no shared-secret check, no
 * header check at all. Despite that, it held a live GITHUB_PAT (pulled from
 * Vault per-request) and exposed arbitrary-path/arbitrary-branch file writes,
 * PR merging, and branch deletion to anyone who found the URL. This is the
 * same class of hole closed in github-bridge on 2026-07-10 (see HANDOFF.md
 * ADR #15/#16) — except more capable (merge + delete-branch), and it had
 * never had any protection at all.
 *
 * Fix: identical two-control pattern as github-bridge.
 *   1. verify_jwt=true at the gateway (set on deploy).
 *   2. x-hv-bridge-key checked here via api.hv_bridge_key_matches(), the same
 *      service-role-only SECURITY DEFINER verifier github-bridge uses. This
 *      function still never holds the shared secret itself.
 * Also removed the wildcard CORS header — this is a server-to-server
 * function, not something a browser page on an arbitrary origin should reach.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE='https://api.github.com/repos/harbourviewcompany-create/harbourview-platform';
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// db.schema: 'api' matches this project's PostgREST exposure convention.
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: { schema: "api" },
});

async function callerKeyIsValid(req: Request): Promise<boolean> {
  const candidate = req.headers.get('x-hv-bridge-key');
  if (!candidate) return false;
  try {
    const { data, error } = await db.rpc('hv_bridge_key_matches', { candidate });
    if (error) { console.error('[hv-repo-reader] key verifier error:', error.message); return false; }
    return data === true;
  } catch (e) {
    console.error('[hv-repo-reader] key verifier threw:', e);
    return false;
  }
}

// Pulls the current PAT from Supabase Vault on every invocation via a
// service_role-only RPC wrapper. Rotate by running, in the SQL editor:
//   SELECT vault.update_secret((SELECT id FROM vault.secrets WHERE name='GITHUB_PAT'), 'new_token_here');
// No redeploy needed after rotation.
async function getToken(): Promise<string> {
  const { data, error } = await db.rpc("get_github_pat");
  if (error || !data) throw new Error(`Vault lookup failed: ${error?.message ?? "no secret"}`);
  return data as string;
}

function b64EncodeUtf8(str:string):string{ return btoa(unescape(encodeURIComponent(str))); }
function b64DecodeUtf8(b64:string):string{ return decodeURIComponent(escape(atob(b64.replace(/\n/g,'')))); }

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return r(null,204);

  if (!(await callerKeyIsValid(req))) {
    return r({ error: 'Unauthorized' }, 401);
  }

  const b=await req.json().catch(()=>({}));

  let token:string;
  try{ token = await getToken(); }
  catch(e){ return r({ok:false,error:`vault: ${e instanceof Error?e.message:String(e)}`},500); }

  const H={'Authorization':`Bearer ${token}`,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'hv/1','Content-Type':'application/json'};

  try{
    if(b.code_search){
      const q=encodeURIComponent(`${b.code_search} repo:harbourviewcompany-create/harbourview-platform`);
      const x=await fetch(`https://api.github.com/search/code?q=${q}&per_page=20`,{headers:H});
      const d=await x.json();
      if(!x.ok)return r({ok:false,error:d.message});
      return r({ok:true,total:d.total_count,items:(d.items??[]).map((i:Record<string,unknown>)=>({path:i.path,name:i.name}))});
    }
    if(b.merge_prs){const rs=[];for(const n of b.merge_prs as number[]){const x=await fetch(`${BASE}/pulls/${n}/merge`,{method:'PUT',headers:H,body:JSON.stringify({merge_method:b.method??'squash'})});const d=await x.json();if(!x.ok){rs.push({pr:n,ok:false,error:d.message});continue;}if(b.delete_branch!==false){const p=await(await fetch(`${BASE}/pulls/${n}`,{headers:H})).json();const br=p?.head?.ref;if(br&&br!=='main')await fetch(`${BASE}/git/refs/heads/${br}`,{method:'DELETE',headers:H});}rs.push({pr:n,ok:true,sha:d.sha});}return r({ok:true,results:rs});}
    if(b.paths){const rs:Record<string,string|null>={};for(const p of b.paths as string[]){const x=await fetch(`${BASE}/contents/${p}?ref=${b.ref??'main'}`,{headers:H});if(!x.ok){rs[p]=null;continue;}const d=await x.json();rs[p]=d.encoding==='base64'?b64DecodeUtf8(d.content):null;}return r({ok:true,results:rs});}
    if(b.path&&b.content){const pb:Record<string,unknown>={message:b.message,content:b.content,branch:b.branch??'main'};if(b.sha)pb.sha=b.sha;const x=await fetch(`${BASE}/contents/${b.path}`,{method:'PUT',headers:H,body:JSON.stringify(pb)});const d=await x.json();if(!x.ok)throw new Error(`PUT ${x.status}: ${JSON.stringify(d)}`);return r({ok:true,sha:d.content?.sha,commit:d.commit?.sha});}
    if(b.operation==='get_sha'){const x=await fetch(`${BASE}/contents/${b.path}`,{headers:H});if(!x.ok)return r({ok:false});const d=await x.json();return r({ok:true,sha:d.sha});}
    if(b.job_logs){const x=await fetch(`${BASE}/actions/jobs/${b.job_logs}/logs`,{headers:{...H,Accept:'application/vnd.github+json'},redirect:'follow'});if(!x.ok)return r({ok:false,error:`${x.status}`});const t=await x.text();return r({ok:true,logs:t.slice(-(b.tail??6000))});}
    if(b.list){const x=await fetch(`${BASE}/contents/${b.list}?ref=${b.ref??'main'}`,{headers:H});if(!x.ok)return r({ok:false,error:`${x.status}`});const d=await x.json();return r({ok:true,items:Array.isArray(d)?d.map((i:Record<string,string>)=>({name:i.name,path:i.path,type:i.type})):d});}
    if(b.whoami){const x=await fetch('https://api.github.com/user',{headers:H});const d=await x.json();return r({ok:x.ok,login:d.login,status:x.status});}
    return r({error:'unknown op'});
  }catch(e){return r({ok:false,error:e instanceof Error?e.message:String(e)},500);}
});
function r(d:unknown,s=200){return new Response(d===null?null:JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json'}});}
