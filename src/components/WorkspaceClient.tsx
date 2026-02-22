"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface Props {
  user: { id:string; name:string; email:string; role:string; apiCallsUsed:number; apiCallsLimit:number };
  savedData: any;
}

export default function WorkspaceClient({ user, savedData }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string|null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout|null>(null);

  const saveData = useCallback(async (data: any) => {
    setSaving(true);
    try { await fetch("/api/playbooks", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({data}) }); setLastSaved(new Date().toLocaleTimeString()); } catch(e) { console.error("Save failed:",e); }
    setSaving(false);
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "PLAYBOOK_DATA_CHANGED") {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => saveData(e.data.payload), 2000);
      }
      // Handle download requests from iframe (PDF export fix)
      if (e.data?.type === "DOWNLOAD_FILE") {
        const { dataUrl, filename } = e.data;
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    };
    window.addEventListener("message", handler);
    return () => { window.removeEventListener("message", handler); if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [saveData]);

  const handleIframeLoad = () => {
    if (iframeRef.current?.contentWindow && savedData) {
      iframeRef.current.contentWindow.postMessage({ type:"LOAD_DATA", payload:savedData }, "*");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#060a14]">
      {/* Top Bar */}
      <div className="h-11 flex-shrink-0 bg-[#0b1020] border-b border-[#1a2650] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#4f6cf7] to-[#7c5cf6] flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <span className="text-sm font-semibold text-white">RunbookHQ</span>
          </div>
          <div className="h-4 w-px bg-[#1a2650] mx-1"/>
          <div className="flex items-center gap-1.5 text-xs text-[#4a5578]">
            <span className="font-mono">API</span>
            <span className="px-1.5 py-0.5 rounded bg-[#10162e] border border-[#1a2650] font-mono text-[#8892b0]">{user.apiCallsUsed}/{user.apiCallsLimit}</span>
          </div>
          {saving && <div className="flex items-center gap-1.5 text-xs text-[#4f6cf7]"><span className="w-3 h-3 border-2 border-[#4f6cf740] border-t-[#4f6cf7] rounded-full animate-spin"/>Saving...</div>}
          {lastSaved && !saving && <span className="text-xs text-[#2d3756] font-mono">Saved {lastSaved}</span>}
        </div>
        <div className="flex items-center gap-3">
          {user.role === "ADMIN" && (
            <Link href="/admin" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[#f59e0b] bg-[#f59e0b12] border border-[#f59e0b20] hover:bg-[#f59e0b20] transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Admin
            </Link>
          )}
          <div className="relative">
            <button onClick={()=>setMenuOpen(!menuOpen)} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[#10162e] transition-colors">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4f6cf7] to-[#8b5cf6] flex items-center justify-center text-[10px] font-bold text-white">{user.name.charAt(0).toUpperCase()}</div>
              <span className="text-xs text-[#8892b0] hidden sm:block">{user.name}</span>
            </button>
            {menuOpen && <>
              <div className="fixed inset-0 z-40" onClick={()=>setMenuOpen(false)}/>
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#10162e] border border-[#1a2650] rounded-xl shadow-2xl shadow-black/40 z-50 p-1">
                <div className="px-3 py-2 border-b border-[#1a2650] mb-1"><p className="text-sm font-medium text-white">{user.name}</p><p className="text-xs text-[#4a5578] truncate">{user.email}</p></div>
                <button onClick={()=>signOut({callbackUrl:"/login"})} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ef4444] hover:bg-[#ef444412] rounded-lg transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign out
                </button>
              </div>
            </>}
          </div>
        </div>
      </div>
      {/* App — allow-downloads fixes PDF export in iframe */}
      <iframe ref={iframeRef} src="/app.html" className="flex-1 w-full border-none" onLoad={handleIframeLoad} title="RunbookHQ" sandbox="allow-scripts allow-same-origin allow-downloads allow-popups allow-modals" />
    </div>
  );
}
