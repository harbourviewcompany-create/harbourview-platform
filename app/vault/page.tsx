"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;

const STATUSES = ["raw","needs_work","can_be_built","complete","archived"] as const;
const CATEGORIES = ["website","app","program","html","tool","game","other"] as const;
type Status = typeof STATUSES[number];
type Category = typeof CATEGORIES[number];

const STATUS_LABELS: Record<Status,string> = { raw:"Raw", needs_work:"Needs work", can_be_built:"Can be built", complete:"Complete", archived:"Archived" };
const STATUS_COLORS: Record<Status,string> = { raw:"text-zinc-400", needs_work:"text-amber-400", can_be_built:"text-blue-400", complete:"text-emerald-400", archived:"text-zinc-500" };
const STATUS_DOT: Record<Status,string> = { raw:"bg-zinc-400", needs_work:"bg-amber-400", can_be_built:"bg-blue-400", complete:"bg-emerald-400", archived:"bg-zinc-500" };
const CAT_ICONS: Record<Category,string> = { website:"🌐", app:"📱", program:"⚙️", html:"🗂️", tool:"🔧", game:"🎮", other:"📦" };

interface QueueItem { id:string; file:File; name:string; originalFilename:string; category:Category; status:Status; notes:string; progress:number; uploadState:"queued"|"uploading"|"done"|"error"; errorMsg:string; }
interface LibraryItem { id:string; name:string; original_filename:string; file_path:string; file_type:string; file_size_bytes:number; status:Status; category:Category; notes:string|null; uploaded_at:string; }

function detectCategory(fn:string):Category {
  const l=fn.toLowerCase();
  if(/\.html?$/i.test(fn)) return "html";
  if(l.includes("website")||l.includes("-site")||l.includes("landing")||l.includes("portfolio")||l.includes("browser-engine")) return "website";
  if(l.includes("dashboard")||l.includes("portal")||l.includes("os-v")) return "app";
  if(l.includes("tool")||l.includes("util")||l.includes("sorter")||l.includes("analyzer")) return "tool";
  if(l.includes("game")) return "game";
  if(l.includes("sandbox")||l.includes("engine")||l.includes("command")||l.includes("program")) return "program";
  return "other";
}
function detectStatus(fn:string):Status {
  const l=fn.toLowerCase();
  if(l.includes("complete")||l.includes("final")||l.includes("-go")||l.includes("production")||l.includes("milestone-3")) return "complete";
  if(l.includes("prototype")||l.includes("hold")||l.includes("wip")||l.includes("draft")) return "needs_work";
  if(l.includes("milestone")||l.includes("readiness")||l.includes("v4")||l.includes("v5")) return "can_be_built";
  return "raw";
}
function fmt(b:number|null):string {
  if(!b) return "—";
  if(b<1048576) return (b/1024).toFixed(1)+" KB";
  if(b<1073741824) return (b/1048576).toFixed(1)+" MB";
  return (b/1073741824).toFixed(2)+" GB";
}
function cleanName(fn:string):string {
  return fn.replace(/\.(zip|html?|rar|tar\.gz|7z)$/i,"").replace(/[-_]/g," ").replace(/\s+/g," ").trim();
}

function QueueRow({item,onUpdate,onRemove,onUpload,uploading}:{item:QueueItem;onUpdate:(u:Partial<QueueItem>)=>void;onRemove:()=>void;onUpload:()=>void;uploading:boolean}) {
  const done=item.uploadState==="done", err=item.uploadState==="error", busy=item.uploadState==="uploading";
  return (
    <div className={`rounded-lg border px-3 py-2.5 mb-1.5 ${err?"border-red-800/60 bg-red-950/20":done?"border-emerald-800/40 bg-emerald-950/10":"border-white/10 bg-white/[0.03]"}`}>
      <div className="flex gap-2.5 items-start">
        <span className="text-lg pt-0.5 flex-shrink-0">{CAT_ICONS[item.category]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex gap-1.5 flex-wrap items-center">
            <input value={item.name} onChange={e=>onUpdate({name:e.target.value})} disabled={done||busy}
              className="flex-1 min-w-[120px] text-sm font-medium bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-white/30 disabled:opacity-60" />
            <select value={item.category} onChange={e=>onUpdate({category:e.target.value as Category})} disabled={done}
              className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-zinc-300 cursor-pointer focus:outline-none">
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <select value={item.status} onChange={e=>onUpdate({status:e.target.value as Status})} disabled={done}
              className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-zinc-300 cursor-pointer focus:outline-none font-medium">
              {STATUSES.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {item.originalFilename} · {fmt(item.file.size)}
            {err&&<span className="text-red-400 ml-2">✕ {item.errorMsg}</span>}
            {done&&<span className="text-emerald-400 ml-2">✓ Uploaded</span>}
            {busy&&<span className="text-zinc-400 ml-2">{item.progress}%</span>}
          </div>
          {busy&&<div className="h-0.5 bg-white/10 rounded-full overflow-hidden mt-1.5"><div className="h-full bg-emerald-500 rounded-full transition-all duration-200" style={{width:item.progress+"%"}}/></div>}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {item.uploadState==="queued"&&!uploading&&<button onClick={onUpload} className="text-xs px-2 py-1 rounded border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-colors">↑</button>}
          {!done&&!busy&&<button onClick={onRemove} className="text-xs px-2 py-1 rounded border border-white/10 text-zinc-500 hover:text-red-400 hover:border-red-800/40 transition-colors">✕</button>}
        </div>
      </div>
    </div>
  );
}

function LibraryRow({item,onReload}:{item:LibraryItem;onReload:()=>void}) {
  const [editing,setEditing]=useState(false);
  const [d,setD]=useState({name:item.name,status:item.status,category:item.category,notes:item.notes||""});
  const [saving,setSaving]=useState(false);
  const save=async()=>{
    setSaving(true);
    await fetch(`${SB_URL}/rest/v1/project_vault?id=eq.${item.id}`,{method:"PATCH",headers:{apikey:SB_KEY,Authorization:"Bearer "+SB_KEY,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify(d)});
    setSaving(false); setEditing(false); onReload();
  };
  return (
    <div className="border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] rounded-lg px-3 py-2.5 mb-1.5 transition-colors">
      {editing?(
        <div>
          <div className="flex gap-1.5 flex-wrap mb-2">
            <input value={d.name} onChange={e=>setD(p=>({...p,name:e.target.value}))} className="flex-1 min-w-[120px] text-sm bg-white/5 border border-white/20 rounded px-2 py-1 text-white focus:outline-none focus:border-white/40"/>
            <select value={d.category} onChange={e=>setD(p=>({...p,category:e.target.value as Category}))} className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-zinc-300 cursor-pointer focus:outline-none">{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>
            <select value={d.status} onChange={e=>setD(p=>({...p,status:e.target.value as Status}))} className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-zinc-300 cursor-pointer focus:outline-none font-medium">{STATUSES.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select>
          </div>
          <input value={d.notes} onChange={e=>setD(p=>({...p,notes:e.target.value}))} placeholder="Notes..." className="w-full text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-zinc-300 mb-2 focus:outline-none focus:border-white/30"/>
          <div className="flex gap-1.5">
            <button onClick={save} disabled={saving} className="text-xs px-3 py-1 rounded border border-white/20 bg-white/5 text-white font-medium hover:bg-white/10 transition-colors disabled:opacity-50">{saving?"Saving…":"Save"}</button>
            <button onClick={()=>setEditing(false)} className="text-xs px-3 py-1 rounded border border-white/10 text-zinc-400 hover:text-white transition-colors">Cancel</button>
          </div>
        </div>
      ):(
        <div className="flex items-center gap-2.5">
          <span className="text-base flex-shrink-0">{CAT_ICONS[item.category]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-white">{item.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">{item.category}</span>
              <span className={`flex items-center gap-1 text-[11px] font-medium ${STATUS_COLORS[item.status]}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[item.status]}`}/>
                {STATUS_LABELS[item.status]}
              </span>
            </div>
            <div className="text-[11px] text-zinc-600 mt-0.5">{item.original_filename} · {fmt(item.file_size_bytes)}{item.notes&&<span className="ml-2 italic text-zinc-500">— {item.notes}</span>}</div>
          </div>
          <button onClick={()=>setEditing(true)} className="text-[11px] px-2.5 py-1 rounded border border-white/10 text-zinc-500 hover:text-white hover:border-white/20 transition-colors flex-shrink-0">Edit</button>
        </div>
      )}
    </div>
  );
}

export default function VaultPage() {
  const [tab,setTab]=useState<"upload"|"library">("upload");
  const [queue,setQueue]=useState<QueueItem[]>([]);
  const [library,setLibrary]=useState<LibraryItem[]>([]);
  const [libLoading,setLibLoading]=useState(false);
  const [filter,setFilter]=useState<{status:Status|"all";category:Category|"all"}>({status:"all",category:"all"});
  const [search,setSearch]=useState("");
  const [uploading,setUploading]=useState(false);
  const [dragOver,setDragOver]=useState(false);
  const fileRef=useRef<HTMLInputElement>(null);

  const loadLib=useCallback(async()=>{
    setLibLoading(true);
    try { const r=await fetch(`${SB_URL}/rest/v1/project_vault?order=uploaded_at.desc&limit=1000`,{headers:{apikey:SB_KEY,Authorization:"Bearer "+SB_KEY}}); const data=await r.json(); if(Array.isArray(data)) setLibrary(data); } catch(e){}
    setLibLoading(false);
  },[]);

  useEffect(()=>{ if(tab==="library") loadLib(); },[tab,loadLib]);

  const addFiles=(files:FileList|null)=>{
    if(!files) return;
    setQueue(p=>[...p,...Array.from(files).map(f=>({id:Math.random().toString(36).slice(2),file:f,name:cleanName(f.name),originalFilename:f.name,category:detectCategory(f.name),status:detectStatus(f.name),notes:"",progress:0,uploadState:"queued" as const,errorMsg:""}))]);
  };

  const uploadFile=(item:QueueItem)=>new Promise<boolean>(resolve=>{
    const path=Date.now()+"_"+item.originalFilename.replace(/[^a-zA-Z0-9._-]/g,"_");
    const xhr=new XMLHttpRequest();
    setQueue(p=>p.map(q=>q.id===item.id?{...q,uploadState:"uploading",progress:0}:q));
    xhr.upload.onprogress=e=>{ if(e.lengthComputable) setQueue(p=>p.map(q=>q.id===item.id?{...q,progress:Math.round(e.loaded/e.total*100)}:q)); };
    xhr.onload=async()=>{
      if(xhr.status>=200&&xhr.status<300){
        try { await fetch(`${SB_URL}/rest/v1/project_vault`,{method:"POST",headers:{apikey:SB_KEY,Authorization:"Bearer "+SB_KEY,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({name:item.name,original_filename:item.originalFilename,file_path:path,bucket:"project-vault",file_type:item.file.type||(item.originalFilename.endsWith(".zip")?"application/zip":"application/octet-stream"),file_size_bytes:item.file.size,status:item.status,category:item.category,notes:item.notes||null})}); } catch(e){}
        setQueue(p=>p.map(q=>q.id===item.id?{...q,uploadState:"done",progress:100}:q)); resolve(true);
      } else { setQueue(p=>p.map(q=>q.id===item.id?{...q,uploadState:"error",errorMsg:"HTTP "+xhr.status}:q)); resolve(false); }
    };
    xhr.onerror=()=>{ setQueue(p=>p.map(q=>q.id===item.id?{...q,uploadState:"error",errorMsg:"Network error"}:q)); resolve(false); };
    xhr.open("POST",`${SB_URL}/storage/v1/object/project-vault/${path}`);
    xhr.setRequestHeader("Authorization","Bearer "+SB_KEY);
    xhr.setRequestHeader("apikey",SB_KEY);
    xhr.setRequestHeader("Content-Type",item.file.type||"application/octet-stream");
    xhr.send(item.file);
  });

  const uploadAll=async()=>{ setUploading(true); for(const item of queue.filter(q=>q.uploadState==="queued")) await uploadFile(item); setUploading(false); };
  const updateQ=(id:string,u:Partial<QueueItem>)=>setQueue(p=>p.map(q=>q.id===id?{...q,...u}:q));
  const removeQ=(id:string)=>setQueue(p=>p.filter(q=>q.id!==id));

  const filtered=library.filter(i=>{
    if(filter.status!=="all"&&i.status!==filter.status) return false;
    if(filter.category!=="all"&&i.category!==filter.category) return false;
    if(search&&!i.name.toLowerCase().includes(search.toLowerCase())&&!i.original_filename?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats={ total:library.length, complete:library.filter(i=>i.status==="complete").length, can_be_built:library.filter(i=>i.status==="can_be_built").length, needs_work:library.filter(i=>i.status==="needs_work").length, raw:library.filter(i=>i.status==="raw").length };
  const pending=queue.filter(q=>q.uploadState==="queued").length;

  return (
    <div className="min-h-screen bg-[#040A14] text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">Project Vault</h1>
            <p className="text-sm text-zinc-500 mt-1">Upload, tag, and track all your file assets</p>
          </div>
          <div className="flex gap-2">
            {(["upload","library"] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)} className={`px-4 py-1.5 text-sm rounded-lg border transition-colors ${tab===t?"border-white/20 bg-white/5 text-white font-medium":"border-white/10 text-zinc-400 hover:text-white hover:border-white/20"}`}>
                {t==="upload"?(queue.length?`Upload (${queue.length})`:"Upload"):`Library${library.length?" ("+library.length+")":""}`}
              </button>
            ))}
          </div>
        </div>

        {tab==="upload"&&(
          <div>
            <div onDrop={e=>{e.preventDefault();setDragOver(false);addFiles(e.dataTransfer.files);}} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onClick={()=>fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all mb-6 ${dragOver?"border-emerald-500/60 bg-emerald-950/20":"border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"}`}>
              <div className="text-4xl mb-3">📂</div>
              <p className="font-medium">Drop files here or click to browse</p>
              <p className="text-sm text-zinc-500 mt-1">ZIPs, HTML files, any type · Multiple files · Large files supported</p>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={e=>addFiles(e.target.files)}/>
            </div>
            {queue.length>0&&(
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-zinc-400">{queue.length} file{queue.length!==1?"s":""} · {queue.filter(q=>q.uploadState==="done").length} done · {pending} pending</span>
                  <div className="flex gap-2">
                    <button onClick={()=>setQueue([])} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-zinc-500 hover:text-white transition-colors">Clear all</button>
                    {pending>0&&<button onClick={uploadAll} disabled={uploading} className="text-xs px-4 py-1.5 rounded-lg border border-white/20 bg-white/5 text-white font-medium hover:bg-white/10 transition-colors disabled:opacity-50">{uploading?"Uploading…":`↑ Upload ${pending} file${pending!==1?"s":""}`}</button>}
                  </div>
                </div>
                {queue.map(item=><QueueRow key={item.id} item={item} onUpdate={u=>updateQ(item.id,u)} onRemove={()=>removeQ(item.id)} onUpload={()=>uploadFile(item)} uploading={uploading}/>)}
              </div>
            )}
          </div>
        )}

        {tab==="library"&&(
          <div>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {[{label:"Total",val:stats.total,fv:"all",color:"text-white"},{label:"Complete",val:stats.complete,fv:"complete",color:"text-emerald-400"},{label:"Can build",val:stats.can_be_built,fv:"can_be_built",color:"text-blue-400"},{label:"Needs work",val:stats.needs_work,fv:"needs_work",color:"text-amber-400"},{label:"Raw",val:stats.raw,fv:"raw",color:"text-zinc-400"}].map(s=>(
                <button key={s.label} onClick={()=>setFilter(f=>({...f,status:s.fv as Status|"all"}))} className={`rounded-lg p-3 text-left transition-all border ${filter.status===s.fv?"border-white/20 bg-white/5":"border-white/5 bg-white/[0.02] hover:border-white/10"} ${filter.status!=="all"&&filter.status!==s.fv?"opacity-40":""}`}>
                  <div className="text-[11px] text-zinc-500 mb-1">{s.label}</div>
                  <div className={`text-2xl font-medium ${s.color}`}>{s.val}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-5 flex-wrap">
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or filename…" className="flex-1 min-w-[160px] text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-white/20"/>
              <select value={filter.category} onChange={e=>setFilter(f=>({...f,category:e.target.value as Category|"all"}))} className="text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-zinc-300 cursor-pointer focus:outline-none">
                <option value="all">All categories</option>
                {CATEGORIES.map(c=><option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
              </select>
              <button onClick={loadLib} className="text-sm px-3 py-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white transition-colors">↻</button>
            </div>
            {libLoading?<div className="text-center py-16 text-zinc-600 text-sm">Loading library…</div>:filtered.length===0?<div className="text-center py-16 text-zinc-600 text-sm">{library.length===0?"No files uploaded yet. Switch to Upload to get started.":"No files match the current filters."}</div>:(
              <div>
                <div className="text-xs text-zinc-600 mb-3">{filtered.length} item{filtered.length!==1?"s":""}</div>
                {filtered.map(item=><LibraryRow key={item.id} item={item} onReload={loadLib}/>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
