import { apiFetch } from "../../lib/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { 
  ShieldCheck, CheckCircle2, XCircle, Clock, AlertTriangle, 
  Ban, ShieldOff, X, LayoutDashboard, Users, MapPin, 
  IndianRupee, CalendarCheck, Search, Filter, Power, PowerOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Partner {
  _id: string;
  name: string;
  email: string;
  isApproved: boolean;
  isBanned?: boolean;
  banReason?: string;
  warnings?: { message: string; warnedBy: string; warnedAt: string }[];
  createdAt: string;
}

interface Turf {
  _id: string;
  name: string;
  price: number;
  location: string;
  isDisabled?: boolean;
  disabledReason?: string;
  ownerId: { _id: string; name: string; email: string; isApproved: boolean; isBanned: boolean };
  createdAt: string;
}

interface Analytics {
  totalOwners: number;
  totalTurfs: number;
  activeTurfs: number;
  bannedOwners: number;
  bookingsToday: number;
  totalRevenue: number;
  totalBookings: number;
}

type Modal =
  | { type: "warn"; partner: Partner }
  | { type: "ban"; partner: Partner }
  | { type: "detail"; partner: Partner }
  | { type: "disable-turf"; turf: Turf }
  | null;

export default function SuperAdminDashboard() {
  const { token, logout, user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<"dashboard" | "approvals" | "partners" | "turfs">("dashboard");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [modal, setModal] = useState<Modal>(null);
  const [warnMsg, setWarnMsg] = useState("");
  const [banReason, setBanReason] = useState("");
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user || user.role !== "superadmin") { navigate("/superadmin/login"); return; }
    fetchData();
  }, [user, navigate, token]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pRes, tRes, aRes] = await Promise.all([
        apiFetch("/api/superadmin/partners", { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch("/api/superadmin/turfs", { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch("/api/superadmin/analytics", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (pRes.ok) setPartners(await pRes.json());
      if (tRes.ok) setTurfs(await tRes.json());
      if (aRes.ok) setAnalytics(await aRes.json());
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  // --- Partner Actions ---
  const handleApprove = async (id: string) => {
    await fetch(`/api/superadmin/partners/${id}/approve`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    fetchData(); showToast("Partner approved");
  };

  const handleWarn = async () => {
    if (!warnMsg.trim() || modal?.type !== "warn") return;
    setWorking(true);
    const res = await fetch(`/api/superadmin/partners/${modal.partner._id}/warn`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ message: warnMsg })
    });
    setWorking(false);
    if (res.ok) { showToast(`Warning issued to ${modal.partner.name}`); setModal(null); setWarnMsg(""); fetchData(); }
  };

  const handleBan = async () => {
    if (modal?.type !== "ban") return;
    setWorking(true);
    const res = await fetch(`/api/superadmin/partners/${modal.partner._id}/ban`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ reason: banReason || "Policy violation" })
    });
    setWorking(false);
    if (res.ok) { showToast(`${modal.partner.name} banned`); setModal(null); setBanReason(""); fetchData(); }
  };

  const handleUnban = async (id: string, name: string) => {
    if(!confirm(`Are you sure you want to unban ${name}?`)) return;
    const res = await fetch(`/api/superadmin/partners/${id}/unban`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { showToast(`Reinstated ${name}`); fetchData(); }
  };

  // --- Turf Actions ---
  const handleDisableTurf = async () => {
    if (modal?.type !== "disable-turf") return;
    setWorking(true);
    const res = await fetch(`/api/superadmin/turfs/${modal.turf._id}/disable`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ reason: banReason || "Disabled by admin" })
    });
    setWorking(false);
    if (res.ok) { showToast(`Turf disabled`); setModal(null); setBanReason(""); fetchData(); }
  };

  const handleEnableTurf = async (id: string, name: string) => {
    if(!confirm(`Re-enable turf: ${name}?`)) return;
    const res = await fetch(`/api/superadmin/turfs/${id}/enable`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { showToast(`Turf enabled`); fetchData(); }
  };

  const pending = partners.filter(p => !p.isApproved && !p.isBanned);
  
  // Filtered partners
  const filteredPartners = partners.filter(p => p.isApproved || p.isBanned).filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered turfs
  const filteredTurfs = turfs.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.ownerId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.ownerId?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface-container/30 flex font-sans text-on-background">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-surface-container flex flex-col fixed h-full z-20">
        <div className="p-6 flex items-center gap-3 border-b border-surface-container">
          <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg leading-tight">Admin</h1>
            <span className="text-[10px] font-black text-secondary tracking-widest uppercase">System</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "approvals", label: "Approvals", icon: CheckCircle2, badge: pending.length },
            { id: "partners", label: "Partners", icon: Users },
            { id: "turfs", label: "Turfs", icon: MapPin },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setSearchQuery(""); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                activeTab === item.id 
                  ? "bg-primary/10 text-primary" 
                  : "text-secondary hover:bg-surface-container hover:text-on-background"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {item.badge ? (
                <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] ${activeTab === item.id ? "bg-primary text-white" : "bg-orange-500 text-white"}`}>
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-surface-container">
          <button onClick={() => { logout(); navigate("/superadmin/login"); }}
            className="flex items-center gap-3 w-full px-4 py-3 text-secondary hover:text-rose-600 hover:bg-rose-50 rounded-2xl font-bold text-sm transition-all">
            <XCircle className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 lg:p-12 max-w-7xl">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-serif font-bold capitalize">
              {activeTab === 'approvals' ? 'Pending Approvals' : activeTab}
            </h2>
            <p className="text-secondary mt-1 text-sm">
              {activeTab === 'dashboard' && 'Overview of platform activity and metrics.'}
              {activeTab === 'approvals' && 'Review and verify new partner applications.'}
              {activeTab === 'partners' && 'Manage turf owners, warnings, and bans.'}
              {activeTab === 'turfs' && 'Platform-wide turf directory and control.'}
            </p>
          </div>

          {(activeTab === 'partners' || activeTab === 'turfs') && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-surface-container rounded-full text-sm font-medium focus:outline-none focus:border-primary transition-all w-64 shadow-sm"
              />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-surface-container/50 rounded-3xl" />
            <div className="h-64 bg-surface-container/50 rounded-3xl" />
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* ── Dashboard Tab ── */}
            {activeTab === "dashboard" && analytics && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Revenue", val: `₹${analytics.totalRevenue.toLocaleString()}`, icon: IndianRupee, c: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Bookings Today", val: analytics.bookingsToday, icon: CalendarCheck, c: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Active Turfs", val: analytics.activeTurfs, icon: MapPin, c: "text-primary", bg: "bg-primary/10" },
                    { label: "Total Partners", val: analytics.totalOwners, icon: Users, c: "text-amber-600", bg: "bg-amber-50" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-surface-container shadow-sm flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                        <stat.icon className={`w-6 h-6 ${stat.c}`} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">{stat.label}</p>
                        <p className="text-2xl font-serif font-bold mt-0.5">{stat.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-white p-8 rounded-3xl border border-surface-container shadow-sm mt-6">
                  <h3 className="font-serif font-bold text-lg mb-4">System Alerts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-orange-200 bg-orange-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="text-orange-500 w-5 h-5" />
                        <span className="font-bold text-sm text-orange-900">Pending Partner Approvals</span>
                      </div>
                      <span className="font-black text-xl text-orange-600">{pending.length}</span>
                    </div>
                    <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Ban className="text-rose-500 w-5 h-5" />
                        <span className="font-bold text-sm text-rose-900">Banned Partners</span>
                      </div>
                      <span className="font-black text-xl text-rose-600">{analytics.bannedOwners}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Approvals Tab ── */}
            {activeTab === "approvals" && (
              pending.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-surface-container text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-serif font-bold">Inbox Zero</h3>
                  <p className="text-secondary text-sm mt-2">No pending applications.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pending.map(partner => (
                    <div key={partner._id} className="bg-white p-6 rounded-3xl border border-orange-200 shadow-sm flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{partner.name || "Unnamed"}</h3>
                        <p className="text-secondary text-sm">{partner.email}</p>
                        <p className="text-xs text-secondary mt-1">Applied: {new Date(partner.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 text-rose-600 font-bold bg-rose-50 hover:bg-rose-100 rounded-xl text-sm transition-colors">Reject</button>
                        <button onClick={() => handleApprove(partner._id)} className="px-6 py-2 bg-primary text-white font-bold rounded-xl text-sm hover:brightness-110 transition-all shadow-md">Approve</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── Partners Tab ── */}
            {activeTab === "partners" && (
              <div className="bg-white rounded-3xl border border-surface-container overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container/30 text-[10px] font-bold text-secondary uppercase tracking-widest">
                      <th className="p-5">Partner</th>
                      <th className="p-5">Status</th>
                      <th className="p-5">Warnings</th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {filteredPartners.map(p => (
                      <tr key={p._id} className={`hover:bg-surface-container/20 ${p.isBanned ? 'bg-rose-50/50' : ''}`}>
                        <td className="p-5">
                          <p className="font-bold text-sm">{p.name || "Unnamed"}</p>
                          <p className="text-xs text-secondary">{p.email}</p>
                        </td>
                        <td className="p-5">
                          {p.isBanned ? 
                            <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-md text-[10px] font-bold">Banned</span> :
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold">Active</span>
                          }
                        </td>
                        <td className="p-5">
                          {(p.warnings?.length ?? 0) > 0 ? (
                            <button onClick={() => setModal({ type: "detail", partner: p })} className="flex items-center gap-1 text-amber-600 text-xs font-bold hover:underline">
                              <AlertTriangle className="w-3 h-3" /> {p.warnings!.length}
                            </button>
                          ) : <span className="text-secondary/50 text-xs">-</span>}
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!p.isBanned && (
                              <button onClick={() => setModal({ type: "warn", partner: p })} className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100">Warn</button>
                            )}
                            {p.isBanned ? (
                              <button onClick={() => handleUnban(p._id, p.name)} className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100">Unban</button>
                            ) : (
                              <button onClick={() => setModal({ type: "ban", partner: p })} className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100">Ban</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Turfs Tab ── */}
            {activeTab === "turfs" && (
              <div className="bg-white rounded-3xl border border-surface-container overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container/30 text-[10px] font-bold text-secondary uppercase tracking-widest">
                      <th className="p-5">Turf Name</th>
                      <th className="p-5">Owner</th>
                      <th className="p-5">Location</th>
                      <th className="p-5">Status</th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {filteredTurfs.map(t => (
                      <tr key={t._id} className={`hover:bg-surface-container/20 ${t.isDisabled ? 'bg-orange-50/50' : ''}`}>
                        <td className="p-5">
                          <p className="font-bold text-sm">{t.name}</p>
                          <p className="text-xs text-secondary">₹{t.price}/hr</p>
                        </td>
                        <td className="p-5">
                          <p className="font-semibold text-xs">{t.ownerId?.name || "Unknown"}</p>
                          <p className="text-[10px] text-secondary">{t.ownerId?.email}</p>
                          {t.ownerId?.isBanned && <span className="text-[9px] text-rose-600 font-bold uppercase mt-0.5 block">Owner Banned</span>}
                        </td>
                        <td className="p-5">
                          <p className="text-xs text-secondary">{t.location}</p>
                        </td>
                        <td className="p-5">
                          {t.isDisabled ? 
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-[10px] font-bold">Disabled</span> :
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold">Active</span>
                          }
                        </td>
                        <td className="p-5 text-right">
                          {t.isDisabled ? (
                            <button onClick={() => handleEnableTurf(t._id, t.name)} className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 flex items-center justify-end gap-1 ml-auto">
                              <Power className="w-3 h-3" /> Enable
                            </button>
                          ) : (
                            <button onClick={() => setModal({ type: "disable-turf", turf: t })} className="px-3 py-1.5 text-xs font-bold text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 flex items-center justify-end gap-1 ml-auto">
                              <PowerOff className="w-3 h-3" /> Disable
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </motion.div>
        )}
      </main>

      {/* ── Modals ── */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setModal(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-surface-container">
              
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-serif font-bold">
                  {modal.type === "warn" && "Issue Warning"}
                  {modal.type === "ban" && "Ban Partner"}
                  {modal.type === "detail" && "Warning History"}
                  {modal.type === "disable-turf" && "Disable Turf"}
                </h2>
                <button onClick={() => setModal(null)} className="p-2 hover:bg-surface-container rounded-full transition-colors"><X className="w-5 h-5 text-secondary" /></button>
              </div>

              {/* Warn Modal */}
              {modal.type === "warn" && (
                <div className="space-y-4">
                  <p className="text-sm text-secondary">Warning <strong>{modal.partner.name}</strong>. They will see this message.</p>
                  <textarea value={warnMsg} onChange={e => setWarnMsg(e.target.value)} rows={3} placeholder="Describe the policy violation..."
                    className="w-full px-4 py-3 rounded-2xl border border-surface-container text-sm resize-none focus:outline-none focus:border-amber-400" />
                  <button onClick={handleWarn} disabled={working || !warnMsg.trim()}
                    className="w-full py-3 rounded-full bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 disabled:opacity-60 transition-colors">
                    {working ? "Processing..." : "Issue Warning"}
                  </button>
                </div>
              )}

              {/* Ban Modal */}
              {modal.type === "ban" && (
                <div className="space-y-4">
                  <div className="p-4 bg-rose-50 text-rose-700 text-sm rounded-2xl border border-rose-100 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p>Banning <strong>{modal.partner.name}</strong> will instantly revoke their access and hide all their turfs.</p>
                  </div>
                  <textarea value={banReason} onChange={e => setBanReason(e.target.value)} rows={2} placeholder="Reason (for internal record)"
                    className="w-full px-4 py-3 rounded-2xl border border-surface-container text-sm resize-none focus:outline-none focus:border-rose-400" />
                  <button onClick={handleBan} disabled={working}
                    className="w-full py-3 rounded-full bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 disabled:opacity-60 transition-colors">
                    {working ? "Banning..." : "Confirm Ban"}
                  </button>
                </div>
              )}

              {/* Disable Turf Modal */}
              {modal.type === "disable-turf" && (
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 text-orange-800 text-sm rounded-2xl border border-orange-100">
                    Disabling <strong>{modal.turf.name}</strong> prevents any new bookings, but keeps the owner account active.
                  </div>
                  <textarea value={banReason} onChange={e => setBanReason(e.target.value)} rows={2} placeholder="Reason (e.g., Maintenance needed)"
                    className="w-full px-4 py-3 rounded-2xl border border-surface-container text-sm resize-none focus:outline-none focus:border-orange-400" />
                  <button onClick={handleDisableTurf} disabled={working}
                    className="w-full py-3 rounded-full bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 disabled:opacity-60 transition-colors">
                    {working ? "Disabling..." : "Disable Turf"}
                  </button>
                </div>
              )}

              {/* History Modal */}
              {modal.type === "detail" && (
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {modal.partner.warnings?.map((w, i) => (
                    <div key={i} className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm">
                      <p className="font-semibold text-amber-900">{w.message}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mt-2">By {w.warnedBy} • {new Date(w.warnedAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-on-background text-background px-6 py-3 rounded-full font-bold text-sm shadow-xl z-50">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
