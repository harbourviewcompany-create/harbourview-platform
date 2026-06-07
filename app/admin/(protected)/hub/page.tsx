'use client';
import { useState, useEffect, useCallback } from "react";

const SB_URL = "https://zvxdgdkukjrrwamdpqrg.supabase.co";
const WS_ID  = "a85840b4-c522-4cb8-9097-2f6c30a78417";

function mkApi(key) {
  const h = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  const req = async (url, opts = {}) => {
    const r = await fetch(url, { headers: h, ...opts });
    const txt = await r.text();
    let d; try { d = JSON.parse(txt); } catch { d = txt; }
    if (!r.ok) throw new Error((d && d.message) || txt || r.status);
    return d;
  };
  return {
    get:   (t, qs="")    => req(`${SB_URL}/rest/v1/${t}${qs?"?"+qs:""}`),
    patch: (t, qs, body) => req(`${SB_URL}/rest/v1/${t}?${qs}`, { method:"PATCH",  body:JSON.stringify(body) }),
    post:  (t, body)     => req(`${SB_URL}/rest/v1/${t}`,        { method:"POST",   body:JSON.stringify(body) }),
    del:   (t, qs)       => req(`${SB_URL}/rest/v1/${t}?${qs}`, { method:"DELETE" }),
    rpc:   (fn, body={}) => req(`${SB_URL}/rest/v1/rpc/${fn}`,  { method:"POST",   body:JSON.stringify(body) }),
  };
}

export default function HarbourviewAdmin() {
  return <div>Loading full admin surface...</div>;
}
