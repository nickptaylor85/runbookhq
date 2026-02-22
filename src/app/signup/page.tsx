"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name:"", email:"", password:"", company:"", jobTitle:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const u = (f:string, v:string) => setForm(p=>({...p,[f]:v}));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error||"Signup failed"); setLoading(false); return; }
      router.push("/login?registered=true");
    } catch { setError("Something went wrong"); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#060a14]">
      <div className="auth-grid"/><div className="auth-glow auth-glow-1"/><div className="auth-glow auth-glow-2"/>
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8 animate-fade-up">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4f6cf7] to-[#7c5cf6] mb-4 shadow-lg shadow-[#4f6cf740]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-sm text-[#8892b0] mt-1">Join RunbookHQ</p>
        </div>
        <div className="animate-fade-up-d1">
          <div className="bg-[#0b1020]/80 backdrop-blur-xl border border-[#1a2650] rounded-2xl p-8 shadow-2xl shadow-black/30">
            {error && <div className="mb-4 p-3 rounded-xl bg-[#ef444412] border border-[#ef444425] text-[#ef4444] text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-[#4a5578] uppercase tracking-wider font-mono mb-1.5">Name *</label><input type="text" value={form.name} onChange={e=>u("name",e.target.value)} className="w-full px-4 py-3 bg-[#10162e] border border-[#1a2650] rounded-xl text-white text-sm outline-none focus:border-[#4f6cf7] placeholder:text-[#4a5578]" required autoFocus/></div>
                <div><label className="block text-xs font-semibold text-[#4a5578] uppercase tracking-wider font-mono mb-1.5">Company</label><input type="text" value={form.company} onChange={e=>u("company",e.target.value)} className="w-full px-4 py-3 bg-[#10162e] border border-[#1a2650] rounded-xl text-white text-sm outline-none focus:border-[#4f6cf7] placeholder:text-[#4a5578]"/></div>
              </div>
              <div><label className="block text-xs font-semibold text-[#4a5578] uppercase tracking-wider font-mono mb-1.5">Email *</label><input type="email" value={form.email} onChange={e=>u("email",e.target.value)} className="w-full px-4 py-3 bg-[#10162e] border border-[#1a2650] rounded-xl text-white text-sm outline-none focus:border-[#4f6cf7] placeholder:text-[#4a5578]" required/></div>
              <div><label className="block text-xs font-semibold text-[#4a5578] uppercase tracking-wider font-mono mb-1.5">Job Title</label><input type="text" value={form.jobTitle} onChange={e=>u("jobTitle",e.target.value)} className="w-full px-4 py-3 bg-[#10162e] border border-[#1a2650] rounded-xl text-white text-sm outline-none focus:border-[#4f6cf7] placeholder:text-[#4a5578]"/></div>
              <div><label className="block text-xs font-semibold text-[#4a5578] uppercase tracking-wider font-mono mb-1.5">Password *</label><input type="password" value={form.password} onChange={e=>u("password",e.target.value)} className="w-full px-4 py-3 bg-[#10162e] border border-[#1a2650] rounded-xl text-white text-sm outline-none focus:border-[#4f6cf7] placeholder:text-[#4a5578]" required minLength={8}/></div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-[#4f6cf7] to-[#6b5cf7] text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-[#4f6cf740] hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"/>Creating...</> : "Create Account"}
              </button>
            </form>
          </div>
          <p className="text-center text-sm text-[#4a5578] mt-5">Already have an account? <Link href="/login" className="text-[#4f6cf7] hover:text-[#6b84ff] font-medium">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
