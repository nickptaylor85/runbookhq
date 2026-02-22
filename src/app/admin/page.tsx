"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  company: string | null;
  jobTitle: string | null;
  apiCallsUsed: number;
  apiCallsLimit: number;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  playbookData: { updatedAt: string } | null;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "ACTIVE" | "SUSPENDED" | "PENDING">("all");
  const [modal, setModal] = useState<{ type: string; user: User } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error("Failed to fetch users:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session.user as any).role !== "ADMIN") {
      router.push("/workspace");
      return;
    }
    fetchUsers();
  }, [session, status, router, fetchUsers]);

  const doAction = async (userId: string, action: string, data: any) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, data }),
      });
      if (res.ok) {
        await fetchUsers();
        showToast(`Action completed: ${action}`);
      }
    } catch (e) {
      showToast("Action failed");
    }
    setActionLoading(null);
    setModal(null);
  };

  const deleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/users?userId=${userId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchUsers();
        showToast("User deleted");
      }
    } catch (e) {
      showToast("Delete failed");
    }
    setActionLoading(null);
    setModal(null);
  };

  const filtered = users.filter((u) => {
    if (filter !== "all" && u.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.email.toLowerCase().includes(q) ||
        (u.name || "").toLowerCase().includes(q) ||
        (u.company || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "ACTIVE").length,
    suspended: users.filter((u) => u.status === "SUSPENDED").length,
    admins: users.filter((u) => u.role === "ADMIN").length,
    totalApiCalls: users.reduce((s, u) => s + u.apiCallsUsed, 0),
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#060a14] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#1a2650] border-t-[#4f6cf7] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a14]">
      {/* Top Bar */}
      <div className="h-11 bg-[#0b1020] border-b border-[#1a2650] flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/workspace" className="flex items-center gap-2 text-[#8892b0] hover:text-white transition-colors text-xs">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to Workspace
          </Link>
          <div className="h-4 w-px bg-[#1a2650]" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#f59e0b] to-[#ef4444] flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">Admin Control Panel</span>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs text-[#4a5578] hover:text-[#ef4444] transition-colors"
        >
          Sign out
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total Users", value: stats.total, color: "#4f6cf7", bg: "#4f6cf712" },
            { label: "Active", value: stats.active, color: "#22c55e", bg: "#22c55e12" },
            { label: "Suspended", value: stats.suspended, color: "#ef4444", bg: "#ef444412" },
            { label: "Admins", value: stats.admins, color: "#f59e0b", bg: "#f59e0b12" },
            { label: "Total API Calls", value: stats.totalApiCalls, color: "#8b5cf6", bg: "#8b5cf612" },
          ].map((s) => (
            <div key={s.label} className="bg-[#0b1020] border border-[#1a2650] rounded-xl p-4">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-[#4a5578] mt-0.5 font-mono uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a5578" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#0b1020] border border-[#1a2650] rounded-xl text-white text-sm outline-none focus:border-[#4f6cf7] placeholder:text-[#2d3756]"
              placeholder="Search users..."
            />
          </div>
          <div className="flex gap-1 p-1 bg-[#0b1020] border border-[#1a2650] rounded-xl">
            {(["all", "ACTIVE", "SUSPENDED", "PENDING"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filter === f
                    ? "bg-[#10162e] text-white shadow"
                    : "text-[#4a5578] hover:text-[#8892b0]"
                }`}
              >
                {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#0b1020] border border-[#1a2650] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a2650]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4a5578] font-mono">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4a5578] font-mono">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4a5578] font-mono">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4a5578] font-mono">API Usage</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4a5578] font-mono">Last Login</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4a5578] font-mono">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#4a5578] font-mono">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-[#1a265040] hover:bg-[#10162e] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4f6cf7] to-[#8b5cf6] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">{user.name || "—"}</div>
                        <div className="text-xs text-[#4a5578] truncate">{user.email}</div>
                        {user.company && (
                          <div className="text-xs text-[#2d3756]">{user.company}{user.jobTitle ? ` · ${user.jobTitle}` : ""}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                      user.role === "ADMIN"
                        ? "bg-[#f59e0b18] text-[#f59e0b] border border-[#f59e0b25]"
                        : "bg-[#4f6cf712] text-[#a5b4fc] border border-[#4f6cf725]"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                      user.status === "ACTIVE"
                        ? "bg-[#22c55e18] text-[#22c55e] border border-[#22c55e25]"
                        : user.status === "SUSPENDED"
                        ? "bg-[#ef444418] text-[#ef4444] border border-[#ef444425]"
                        : "bg-[#f59e0b18] text-[#f59e0b] border border-[#f59e0b25]"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#10162e] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min((user.apiCallsUsed / user.apiCallsLimit) * 100, 100)}%`,
                            background: user.apiCallsUsed >= user.apiCallsLimit ? "#ef4444" : "#4f6cf7",
                          }}
                        />
                      </div>
                      <span className="text-xs text-[#8892b0] font-mono">
                        {user.apiCallsUsed}/{user.apiCallsLimit}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#4a5578]">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Never"}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#4a5578]">
                    {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Toggle status */}
                      <button
                        onClick={() =>
                          doAction(user.id, "updateStatus", {
                            status: user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                          })
                        }
                        disabled={actionLoading === user.id}
                        className={`p-1.5 rounded-lg text-xs transition-all ${
                          user.status === "ACTIVE"
                            ? "text-[#ef4444] hover:bg-[#ef444412]"
                            : "text-[#22c55e] hover:bg-[#22c55e12]"
                        }`}
                        title={user.status === "ACTIVE" ? "Suspend user" : "Activate user"}
                      >
                        {user.status === "ACTIVE" ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        )}
                      </button>

                      {/* Toggle role */}
                      <button
                        onClick={() =>
                          doAction(user.id, "updateRole", {
                            role: user.role === "ADMIN" ? "USER" : "ADMIN",
                          })
                        }
                        disabled={actionLoading === user.id || user.id === (session?.user as any)?.id}
                        className="p-1.5 rounded-lg text-[#f59e0b] hover:bg-[#f59e0b12] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        title={user.role === "ADMIN" ? "Demote to user" : "Promote to admin"}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                      </button>

                      {/* Edit API limit */}
                      <button
                        onClick={() => setModal({ type: "apiLimit", user })}
                        className="p-1.5 rounded-lg text-[#8b5cf6] hover:bg-[#8b5cf612] transition-all"
                        title="Edit API limit"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>

                      {/* Reset password */}
                      <button
                        onClick={() => setModal({ type: "resetPassword", user })}
                        className="p-1.5 rounded-lg text-[#4f6cf7] hover:bg-[#4f6cf712] transition-all"
                        title="Reset password"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setModal({ type: "delete", user })}
                        disabled={user.id === (session?.user as any)?.id}
                        className="p-1.5 rounded-lg text-[#ef4444] hover:bg-[#ef444412] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Delete user"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#4a5578] text-sm">
              {search ? "No users match your search." : "No users found."}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setModal(null)}>
          <div className="bg-[#10162e] border border-[#1a2650] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {modal.type === "apiLimit" && <ApiLimitModal user={modal.user} onSave={(limit) => doAction(modal.user.id, "updateApiLimit", { limit })} onClose={() => setModal(null)} />}
            {modal.type === "resetPassword" && <ResetPasswordModal user={modal.user} onSave={(password) => doAction(modal.user.id, "resetPassword", { password })} onClose={() => setModal(null)} />}
            {modal.type === "delete" && <DeleteModal user={modal.user} onConfirm={() => deleteUser(modal.user.id)} onClose={() => setModal(null)} />}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 px-4 py-2.5 bg-[#10162e] border border-[#22c55e30] rounded-xl text-sm text-[#22c55e] shadow-2xl shadow-black/40 flex items-center gap-2 z-50 animate-fade-up">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          {toast}
        </div>
      )}
    </div>
  );
}

function ApiLimitModal({ user, onSave, onClose }: { user: User; onSave: (n: number) => void; onClose: () => void }) {
  const [limit, setLimit] = useState(String(user.apiCallsLimit));
  return (
    <>
      <h3 className="text-lg font-semibold text-white mb-1">Edit API Limit</h3>
      <p className="text-sm text-[#4a5578] mb-4">Set the monthly API call limit for {user.name || user.email}</p>
      <div className="mb-3">
        <label className="block text-xs font-semibold text-[#4a5578] uppercase tracking-wider font-mono mb-1.5">Limit</label>
        <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} className="w-full px-4 py-3 bg-[#0b1020] border border-[#1a2650] rounded-xl text-white text-sm outline-none focus:border-[#4f6cf7]" min="0" />
      </div>
      <div className="text-xs text-[#4a5578] mb-4">Current usage: {user.apiCallsUsed} calls</div>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 text-sm text-[#8892b0] bg-[#0b1020] border border-[#1a2650] rounded-xl hover:bg-[#1a2650] transition-colors">Cancel</button>
        <button onClick={() => onSave(parseInt(limit) || 0)} className="px-4 py-2 text-sm text-white bg-[#4f6cf7] rounded-xl hover:bg-[#5f7af8] transition-colors">Save</button>
      </div>
    </>
  );
}

function ResetPasswordModal({ user, onSave, onClose }: { user: User; onSave: (p: string) => void; onClose: () => void }) {
  const [password, setPassword] = useState("");
  return (
    <>
      <h3 className="text-lg font-semibold text-white mb-1">Reset Password</h3>
      <p className="text-sm text-[#4a5578] mb-4">Set a new password for {user.name || user.email}</p>
      <div className="mb-4">
        <label className="block text-xs font-semibold text-[#4a5578] uppercase tracking-wider font-mono mb-1.5">New Password</label>
        <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-[#0b1020] border border-[#1a2650] rounded-xl text-white text-sm outline-none focus:border-[#4f6cf7]" placeholder="Min. 8 characters" />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 text-sm text-[#8892b0] bg-[#0b1020] border border-[#1a2650] rounded-xl hover:bg-[#1a2650] transition-colors">Cancel</button>
        <button onClick={() => password.length >= 8 && onSave(password)} disabled={password.length < 8} className="px-4 py-2 text-sm text-white bg-[#4f6cf7] rounded-xl hover:bg-[#5f7af8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Reset</button>
      </div>
    </>
  );
}

function DeleteModal({ user, onConfirm, onClose }: { user: User; onConfirm: () => void; onClose: () => void }) {
  return (
    <>
      <h3 className="text-lg font-semibold text-white mb-1">Delete User</h3>
      <p className="text-sm text-[#4a5578] mb-4">
        Permanently delete <span className="text-white font-medium">{user.name || user.email}</span> and all their data? This cannot be undone.
      </p>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 text-sm text-[#8892b0] bg-[#0b1020] border border-[#1a2650] rounded-xl hover:bg-[#1a2650] transition-colors">Cancel</button>
        <button onClick={onConfirm} className="px-4 py-2 text-sm text-white bg-[#ef4444] rounded-xl hover:bg-[#dc2626] transition-colors">Delete User</button>
      </div>
    </>
  );
}
