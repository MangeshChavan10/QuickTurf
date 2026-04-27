import { apiFetch } from "../../lib/api";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { AdminLayout } from "../../components/AdminLayout";
import { IndianRupee, MapPin, CalendarCheck, XCircle, TrendingUp, BarChart3 } from "lucide-react";
import { motion } from "motion/react";

interface Analytics {
  revenue: number;
  totalBookings: number;
  activeTurfs: number;
  cancellations: number;
  avgBookingValue: number;
  monthlyTrend: { month: string; revenue: number }[];
  turfBreakdown: { name: string; bookings: number; revenue: number }[];
}

export default function Dashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/admin/analytics", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [token]);

  const maxMonthly = data ? Math.max(...data.monthlyTrend.map(m => m.revenue), 1) : 1;

  const kpis = data ? [
    { label: "Total Revenue", value: `₹${data.revenue.toLocaleString()}`, icon: IndianRupee, color: "text-primary", bg: "bg-primary/10" },
    { label: "Total Bookings", value: data.totalBookings, icon: CalendarCheck, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Active Turfs", value: data.activeTurfs, icon: MapPin, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Cancellations", value: data.cancellations, icon: XCircle, color: "text-rose-500", bg: "bg-rose-50" },
    { label: "Avg. Booking Value", value: `₹${data.avgBookingValue.toLocaleString()}`, icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-50" },
  ] : [];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-on-background">Analytics</h1>
          <p className="text-secondary mt-2">A live overview of your turf business performance.</p>
        </div>

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1,2,3,4,5].map(i => <div key={i} className="bg-white h-28 rounded-[24px] border border-surface-container animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {kpis.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white p-5 rounded-[24px] border border-surface-container shadow-sm hover:shadow-md transition-all group"
              >
                <div className={`w-10 h-10 ${kpi.bg} rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">{kpi.label}</p>
                <p className="text-2xl font-serif font-bold text-on-background mt-1">{kpi.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Revenue Chart + Turf Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Monthly Revenue Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3 bg-white rounded-[32px] border border-surface-container p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-xl">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-lg text-on-background">Monthly Revenue</h2>
                <p className="text-xs text-secondary">Last 6 months</p>
              </div>
            </div>

            {isLoading ? (
              <div className="h-48 flex items-end gap-3">
                {[60,40,80,55,70,90].map((h, i) => (
                  <div key={i} className="flex-1 bg-surface-container rounded-t-lg animate-pulse" style={{ height: `${h}%` }} />
                ))}
              </div>
            ) : (
              <div className="h-52 flex items-end gap-2 mt-2">
                {data?.monthlyTrend.map((m, i) => {
                  const pct = maxMonthly > 0 ? (m.revenue / maxMonthly) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-[10px] text-secondary opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                        ₹{m.revenue.toLocaleString()}
                      </span>
                      <div className="w-full relative" style={{ height: '180px' }}>
                        <div
                          className="absolute bottom-0 w-full bg-primary/20 rounded-t-xl transition-all duration-700 group-hover:bg-primary/40"
                          style={{ height: `${Math.max(pct, 4)}%` }}
                        >
                          <div
                            className="absolute top-0 left-0 w-full bg-primary rounded-t-xl transition-all duration-700"
                            style={{ height: '4px' }}
                          />
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-secondary uppercase">{m.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Per-Turf Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-white rounded-[32px] border border-surface-container p-8 shadow-sm"
          >
            <h2 className="font-serif font-bold text-lg text-on-background mb-6">Turf Performance</h2>
            {isLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-surface-container rounded-2xl animate-pulse" />)}
              </div>
            ) : data?.turfBreakdown.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-secondary">
                <MapPin className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No turf data yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data?.turfBreakdown.map((turf, i) => (
                  <div key={i} className="p-4 bg-surface-container/50 rounded-2xl">
                    <p className="font-bold text-sm text-on-background truncate">{turf.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-secondary">{turf.bookings} bookings</span>
                      <span className="text-sm font-bold text-primary">₹{turf.revenue.toLocaleString()}</span>
                    </div>
                    {/* Mini bar */}
                    <div className="mt-2 h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{ width: `${data.turfBreakdown.length > 0 ? (turf.revenue / Math.max(...data.turfBreakdown.map(t => t.revenue), 1)) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cancellation rate */}
            {data && (data.totalBookings + data.cancellations) > 0 && (
              <div className="mt-6 pt-6 border-t border-surface-container">
                <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Cancellation Rate</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-400 rounded-full transition-all duration-700"
                      style={{ width: `${Math.round((data.cancellations / (data.totalBookings + data.cancellations)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-rose-500">
                    {Math.round((data.cancellations / (data.totalBookings + data.cancellations)) * 100)}%
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
