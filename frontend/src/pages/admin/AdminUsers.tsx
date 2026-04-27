import { apiFetch } from "../../lib/api";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { AdminLayout } from "../../components/AdminLayout";
import { Users as UsersIcon, IndianRupee, History, AlertTriangle, Ban, CheckCircle2, X, ShieldOff, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Customer {
  email: string;
  totalBookings: number;
  totalSpent: number;
  lastBookingDate: string;
  warnings?: { message: string; warnedBy: string; warnedAt: string }[];
  isBanned?: boolean;
  banReason?: string;
}

type Modal =
  | { type: "warn"; email: string }
  | { type: "ban"; email: string }
  | { type: "detail"; customer: Customer }
  | null;

export default function AdminUsers() {
  const { token, user: adminUser } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState<Modal>(null);
  const [warnMsg, setWarnMsg] = useState("");
  const [banReason, setBanReason] = useState("");
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCustomers = async () => {
    try {
      const res = await apiFetch("/api/admin/customers", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        // Fetch moderation status for each customer
        const enriched = await Promise.all(data.map(async (c: Customer) => {
          try {
            const detail = await fetch(`/api/admin/customers/${encodeURIComponent(c.email)}/detail`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (detail.ok) {
              const d = await detail.json();
              return { ...c, warnings: d.warnings || [], isBanned: d.isBanned, banReason: d.banReason };
            }
          } catch { /* ignore */ }
          return c;
        }));
        setCustomers(enriched);
      }
    } catch (err) {
      console.error("Failed to fetch customers", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, [token]);

  const handleWarn = async () => {
    if (!warnMsg.trim() || modal?.type !== "warn") return;
    setWorking(true);
    const res = await fetch(`/api/admin/customers/${encodeURIComponent(modal.email)}/warn`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: warnMsg })
    });
    setWorking(false);
    if (res.ok) {
      showToast(`⚠️ Warning issued to ${modal.email}`);
      setModal(null); setWarnMsg("");
      fetchCustomers();
    }
  };

  const handleBan = async () => {
    if (modal?.type !== "ban") return;
    setWorking(true);
    const res = await fetch(`/api/admin/customers/${encodeURIComponent(modal.email)}/ban`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: banReason || "Repeated policy violations" })
    });
    setWorking(false);
    if (res.ok) {
      showToast(`🚫 ${modal.email} has been banned`);
      setModal(null); setBanReason("");
      fetchCustomers();
    }
  };

  const handleUnban = async (email: string) => {
    const res = await fetch(`/api/admin/customers/${encodeURIComponent(email)}/unban`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      showToast(`✅ ${email} has been unbanned`);
      fetchCustomers();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-on-background">Customers</h1>
          <p className="text-secondary mt-2">Manage player relationships and moderate behaviour on your turfs.</p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-[32px] border border-surface-container h-64 animate-pulse" />
        ) : customers.length === 0 ? (
          <div className="bg-white p-12 rounded-[32px] border border-surface-container text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4">
              <UsersIcon className="w-10 h-10 text-secondary" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-on-background">No Customers Yet</h3>
            <p className="text-secondary max-w-md mt-2">When players book your turfs, their profiles will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary card */}
            <div className="bg-white p-6 rounded-[24px] border border-surface-container shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-secondary uppercase tracking-wider">Total Unique Customers</p>
                <h3 className="text-3xl font-serif font-bold text-on-background">{customers.length}</h3>
              </div>
              <div className="ml-auto flex gap-4 text-sm">
                <div className="text-center">
                  <p className="font-bold text-rose-500">{customers.filter(c => c.isBanned).length}</p>
                  <p className="text-secondary text-xs">Banned</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-amber-500">{customers.filter(c => (c.warnings?.length ?? 0) > 0).length}</p>
                  <p className="text-secondary text-xs">Warned</p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[32px] border border-surface-container overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container/50 border-b border-surface-container">
                      {["Customer", "Bookings", "Lifetime Value", "Warnings", "Status", "Actions"].map(h => (
                        <th key={h} className="p-4 md:p-5 text-xs font-bold text-secondary uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {customers.map((customer, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className={`hover:bg-surface-container/20 transition-colors ${customer.isBanned ? "bg-rose-50/30" : ""}`}
                      >
                        {/* Customer */}
                        <td className="p-4 md:p-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${customer.isBanned ? "bg-rose-100 text-rose-600" : "bg-primary/10 text-primary"}`}>
                              {customer.email.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-on-background text-sm">{customer.email}</span>
                          </div>
                        </td>
                        {/* Bookings */}
                        <td className="p-4 md:p-5 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm">
                            <History className="w-4 h-4 text-secondary" />
                            <span className="font-bold text-on-background">{customer.totalBookings}</span>
                          </div>
                        </td>
                        {/* Spent */}
                        <td className="p-4 md:p-5 whitespace-nowrap">
                          <div className="flex items-center gap-1 font-bold text-emerald-600 text-sm">
                            <IndianRupee className="w-3.5 h-3.5" />
                            {customer.totalSpent.toLocaleString()}
                          </div>
                        </td>
                        {/* Warnings */}
                        <td className="p-4 md:p-5 whitespace-nowrap">
                          {(customer.warnings?.length ?? 0) > 0 ? (
                            <button
                              onClick={() => setModal({ type: "detail", customer })}
                              className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold hover:bg-amber-100 transition-colors"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {customer.warnings!.length} Warning{customer.warnings!.length > 1 ? "s" : ""}
                            </button>
                          ) : (
                            <span className="text-secondary/50 text-xs">None</span>
                          )}
                        </td>
                        {/* Status */}
                        <td className="p-4 md:p-5 whitespace-nowrap">
                          {customer.isBanned ? (
                            <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                              <Ban className="w-3 h-3" /> Banned
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          )}
                        </td>
                        {/* Actions */}
                        <td className="p-4 md:p-5 whitespace-nowrap">
                          <div className="flex gap-2">
                            {!customer.isBanned && (
                              <button
                                onClick={() => setModal({ type: "warn", email: customer.email })}
                                className="px-3 py-1.5 text-xs font-bold bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors flex items-center gap-1"
                              >
                                <AlertTriangle className="w-3 h-3" /> Warn
                              </button>
                            )}
                            {customer.isBanned ? (
                              <button
                                onClick={() => handleUnban(customer.email)}
                                className="px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-1"
                              >
                                <ShieldCheck className="w-3 h-3" /> Unban
                              </button>
                            ) : (
                              <button
                                onClick={() => setModal({ type: "ban", email: customer.email })}
                                className="px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors flex items-center gap-1"
                              >
                                <ShieldOff className="w-3 h-3" /> Ban
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setModal(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-serif font-bold text-on-background">
                  {modal.type === "warn" && "Issue Warning"}
                  {modal.type === "ban" && "Ban User"}
                  {modal.type === "detail" && "Warning History"}
                </h2>
                <button onClick={() => setModal(null)} className="p-2 rounded-full hover:bg-surface-container"><X className="w-5 h-5 text-secondary" /></button>
              </div>

              {modal.type === "warn" && (
                <div className="space-y-4">
                  <p className="text-sm text-secondary">Issuing a warning to <strong>{modal.email}</strong>. They will see this if they contact support.</p>
                  <textarea
                    value={warnMsg}
                    onChange={e => setWarnMsg(e.target.value)}
                    rows={3}
                    placeholder="Describe the behaviour (e.g. 'Damaged turf equipment on 24 Apr')"
                    className="w-full px-4 py-3 rounded-2xl border border-surface-container text-sm resize-none focus:outline-none focus:border-amber-400 transition-all"
                  />
                  <button onClick={handleWarn} disabled={working || !warnMsg.trim()}
                    className="w-full py-3 rounded-full bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-60">
                    {working ? "Sending..." : "Issue Warning"}
                  </button>
                </div>
              )}

              {modal.type === "ban" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl">
                    <Ban className="w-8 h-8 text-rose-500 shrink-0" />
                    <p className="text-sm text-rose-700">Banning <strong>{modal.email}</strong> will prevent them from making any new bookings on QuickTurf.</p>
                  </div>
                  <textarea
                    value={banReason}
                    onChange={e => setBanReason(e.target.value)}
                    rows={2}
                    placeholder="Reason for ban (optional)"
                    className="w-full px-4 py-3 rounded-2xl border border-surface-container text-sm resize-none focus:outline-none focus:border-rose-400 transition-all"
                  />
                  <button onClick={handleBan} disabled={working}
                    className="w-full py-3 rounded-full bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-60">
                    {working ? "Banning..." : "Confirm Ban"}
                  </button>
                </div>
              )}

              {modal.type === "detail" && (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {modal.customer.warnings?.map((w, i) => (
                    <div key={i} className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                      <p className="text-sm font-semibold text-on-background">{w.message}</p>
                      <p className="text-xs text-secondary mt-1">By {w.warnedBy} · {new Date(w.warnedAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 32 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-on-background text-background px-6 py-3 rounded-full font-bold text-sm shadow-xl z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
