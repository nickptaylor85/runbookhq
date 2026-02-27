"use client";
import { signOut } from "next-auth/react";
export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060a14]">
      <div className="auth-grid"/>
      <div className="relative z-10 text-center max-w-md px-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#ef444418] border border-[#ef444425] mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Account Suspended</h1>
        <p className="text-sm text-[#8892b0] mb-6">Your account has been suspended. Contact your administrator to restore access.</p>
        <button onClick={()=>signOut({callbackUrl:"/login"})} className="px-6 py-2.5 text-sm font-medium text-[#ef4444] bg-[#ef444412] border border-[#ef444425] rounded-xl hover:bg-[#ef444420] transition-colors">Sign out</button>
      </div>
    </div>
  );
}
