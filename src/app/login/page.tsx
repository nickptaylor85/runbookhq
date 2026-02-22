"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/workspace";
  const registered = searchParams.get("registered");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false, callbackUrl });
    setLoading(false);
    if (result?.error) setError(result.error);
    else { router.push(callbackUrl); router.refresh(); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#060a14]">
      <div className="auth-grid" /><div className="auth-glow auth-glow-1" /><div className="auth-glow auth-glow-2" />
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8 animate-fade-up">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4f6cf7] to-[#7c5cf6] mb-4 shadow-lg shadow-[#4f6cf740]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">RunbookHQ</h1>
          <p className="text-[#8892b0] mt-1 font-mono text-xs tracking-wider">INCIDENT RESPONSE AUTOMATION</p>
        </div>
        <div className="animate-fade-up-d1">
          <div className="bg-[#0b1020]/80 backdrop-blur-xl border border-[#1a2650] rounded-2xl p-8 shadow-2xl shadow-black/30">
            <h2 className="text-lg font-semibold text-white mb-1">Sign in</h2>
            <p className="text-sm text-[#8892b0] mb-6">Enter your credentials to access the platform</p>
            {registered && <div className="mb-4 p-3 rounded-xl bg-[#22c55e12] border border-[#22c55e25] text-[#22c55e] text-sm flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>Account created! Sign in to continue.</div>}
            {error && <div className="mb-4 p-3 rounded-xl bg-[#ef444412] border border-[#ef444425] text-[#ef4444] text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-xs font-semibold text-[#4a5578] uppercase tracking-wider font-mono mb-1.5">Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-4 py-3 bg-[#10162e] border border-[#1a2650] rounded-xl text-white text-sm outline-none focus:border-[#4f6cf7] focus:ring-2 focus:ring-[#4f6cf718] placeholder:text-[#4a5578]" placeholder="you@company.com" required autoFocus /></div>
              <div><label className="block text-xs font-semibold text-[#4a5578] uppercase tracking-wider font-mono mb-1.5">Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-4 py-3 bg-[#10162e] border border-[#1a2650] rounded-xl text-white text-sm outline-none focus:border-[#4f6cf7] focus:ring-2 focus:ring-[#4f6cf718] placeholder:text-[#4a5578]" placeholder="••••••••" required /></div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-[#4f6cf7] to-[#6b5cf7] text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-[#4f6cf740] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"/>Signing in...</> : "Sign in"}
              </button>
            </form>
          </div>
          <p className="text-center text-sm text-[#4a5578] mt-5">Don&apos;t have an account? <Link href="/signup" className="text-[#4f6cf7] hover:text-[#6b84ff] font-medium">Create one</Link></p>
        </div>
        <div className="animate-fade-up-d2 text-center mt-8"><p className="text-xs text-[#2d3756] font-mono">RunbookHQ v1.0</p></div>
      </div>
    </div>
  );
}
