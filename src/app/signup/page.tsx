"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [form, setForm] = useState({ name:"", email:"", password:"", company:"", jobTitle:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);
  const [inviteRole, setInviteRole] = useState("");
  const u = (f:string, v:string) => setForm(p=>({...p,[f]:v}));

  useEffect(() => {
    if (!inviteToken) { setValidating(false); return; }
    fetch(`/api/invites/validate?token=${inviteToken}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setInviteValid(true);
          setInviteRole(data.role);
          setForm(p => ({ ...p, email: data.email || "" }));
        } else {
          setError(data.error || "Invalid invite link");
        }
        setValidating(false);
      })
      .catch(() => { setError("Could not validate invite"); setValidating(false); });
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, invite: inviteToken }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Signup failed"); setLoading(false); return; }
      router.push("/login?registered=true");
    } catch { setError("Something went wrong"); setLoading(false); }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060a14]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-[#4f6cf7] rounded-full animate-spin mx-auto mb-4"/>
          <p className="text-[#8892b0] text-sm">Validating invite...</p>
        </div>
      </div>
    );
  }

  if (!inviteToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060a14]">
        <div className="auth-grid"/><div className="auth-glow auth-glow-1"/><div className="auth-glow auth-glow-2"/>
        <div className="relative z-10 text-center max-w-md px-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4f6cf7] to-[#7c5cf6] mb-4 shadow-lg shadow-[#4f6cf740]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Invite Required</h1>
          <p className="text-[#8892b0] mb-6">SecOpsHQ is invite-only. Ask your administrator for an invite link to create an account.</p>
          <Link href="/login" className="text-[#4f6cf7] hover:text-[#6b84ff] font-medium text-sm">Back to sign in</Link>
        </div>
      </div>
    );
  }

  if (!inviteValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060a14]">
        <div className="auth-grid"/><div className="auth-glow auth-glow-1"/><div className="auth-glow auth-glow-2"/>
        <div className="relative z-10 text-center max-w-md px-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#ef444420] mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Invite</h1>
          <p className="text-[#8892b0] mb-2">{error}</p>
          <Link href="/login" className="text-[#4f6cf7] hover:text-[#6b84ff] font-medium text-sm">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#060a14]">
      <div className="auth-grid"/><div className="auth-glow auth-glow-1"/><div className="auth-glow auth-glow-2"/>
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8 animate-fade-up">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4f6cf7] to-[#7c5cf6] mb-4 shadow-lg shadow-[#4f6cf740]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-sm text-[#8892b0] mt-1">You&apos;ve been invited to join SecOpsHQ as <span className="text-[#4f6cf7] font-semibold">{inviteRole}</span></p>
        </div>
        <div className="animate-fade-up-d1">
          <div className="bg-[#0b1020]/80 backdrop-blur-xl border border-[#1a2650] rounded-2xl p-8 shadow-2xl shadow-black/30">
            {error && <div className="mb-4 p-3 rounded-xl bg-[#ef444412] border border-[#ef444425] text-[#ef4444] text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-[#4a5578] uppercase tracking-wider font-mono mb-1.5">Name *</label><input type="text" value={form.name} onChange={e=>u("name",e.target.value)} className="w-full px-4 py-3 bg-[#10162e] border border-[#1a2650] rounded-xl text-white text-sm outline-none focus:border-[#4f6cf7] placeholder:text-[#4a5578]" required autoFocus/></div>
                <div><label className="block text-xs font-semibold text-[#4a5578] uppercase tracking-wider font-mono mb-1.5">Company</label><input type="text" value={form.company} onChange={e=>u("company",e.target.value)} className="w-full px-4 py-3 bg-[#10162e] border border-[#1a2650] rounded-xl text-white text-sm outline-none focus:border-[#4f6cf7] placeholder:text-[#4a5578]"/></div>
              </div>
              <div><label className="block text-xs font-semibold text-[#4a5578] uppercase tracking-wider font-mono mb-1.5">Email *</label><input type="email" value={form.email} readOnly className="w-full px-4 py-3 bg-[#10162e]/50 border border-[#1a2650] rounded-xl text-[#8892b0] text-sm outline-none cursor-not-allowed"/></div>
              <div><label className="block text-xs font-semibold text-[#4a5578] uppercase tracking-wider font-mono mb-1.5">Job Title</label><input type="text" value={form.jobTitle} onChange={e=>u("jobTitle",e.target.value)} className="w-full px-4 py-3 bg-[#10162e] border border-[#1a2650] rounded-xl text-white text-sm outline-none focus:border-[#4f6cf7] placeholder:text-[#4a5578]"/></div>
              <div><label className="block text-xs font-semibold text-[#4a5578] uppercase tracking-wider font-mono mb-1.5">Password *</label><input type="password" value={form.password} onChange={e=>u("password",e.target.value)} className="w-full px-4 py-3 bg-[#10162e] border border-[#1a2650] rounded-xl text-white text-sm outline-none focus:border-[#4f6cf7] placeholder:text-[#4a5578]" required minLength={8}/></div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-[#4f6cf7] to-[#6b5cf7] text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-[#4f6cf740] hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"/>Creating...</> : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#060a14]"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"/></div>}><SignupForm /></Suspense>;
}
