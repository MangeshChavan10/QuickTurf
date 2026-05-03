import { Link, useLocation, useNavigate } from "react-router-dom";
import { type ReactNode, useState } from "react";
import { LayoutDashboard, MapPin, CalendarCheck, Users, LogOut, Clock, CheckCircle2, Mail, ShieldCheck, Menu, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isApproved = user?.isApproved === true;

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "My Turfs", path: "/admin/turfs", icon: MapPin },
    { name: "Bookings", path: "/admin/bookings", icon: CalendarCheck },
    { name: "Customers", path: "/admin/customers", icon: Users },
  ];

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const steps = [
    { icon: CheckCircle2, label: "Account Created", done: true },
    { icon: Mail, label: "Email Verified", done: true },
    { icon: ShieldCheck, label: "Admin Approval", done: false },
    { icon: LayoutDashboard, label: "Dashboard Access", done: false },
  ];

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {isApproved && navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={onNavigate}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${
            location.pathname.startsWith(item.path)
              ? "bg-primary text-white shadow-md"
              : "text-secondary hover:bg-surface-container hover:text-on-background"
          }`}
        >
          <item.icon className="w-5 h-5" />
          {item.name}
        </Link>
      ))}
      {!isApproved && (
        <div className="px-4 py-3 rounded-2xl bg-orange-50 border border-orange-100 text-sm text-orange-600 font-medium">
          Awaiting approval
        </div>
      )}
    </>
  );

  const PendingScreen = () => (
    <div className="h-full flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-4"
      >
        {/* Main card */}
        <div className="bg-white rounded-[24px] border border-surface-container shadow-sm overflow-hidden">
          {/* Top banner - more compact */}
          <div className="bg-primary p-5 text-white text-center relative overflow-hidden">
            <div className="absolute top-[-30%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center mx-auto mb-2 backdrop-blur-sm border border-white/20">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-serif font-bold">Under Review</h1>
              <p className="text-white/70 text-xs mt-0.5 font-medium">Your application is being processed</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Welcome message */}
            <div className="text-center">
              <p className="text-on-background font-bold text-base">Welcome, {user?.name?.split(" ")[0]}! 👋</p>
              <p className="text-secondary text-xs mt-1 leading-relaxed">
                Verification in progress. You'll get access soon.
              </p>
            </div>

            {/* Progress steps - more compact */}
            <div className="grid grid-cols-1 gap-2">
              {steps.map((step, i) => (
                <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl ${step.done ? 'bg-primary/5 border border-primary/10' : 'bg-surface-container/50 border border-surface-container'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-primary text-white' : 'bg-surface-container text-secondary'}`}>
                    <step.icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-xs font-bold ${step.done ? 'text-primary' : 'text-secondary'}`}>{step.label}</span>
                  {step.done && <span className="ml-auto text-[9px] font-black text-primary uppercase tracking-wider">Done</span>}
                  {!step.done && i === 2 && (
                    <span className="ml-auto flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div>
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider">Pending</span>
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* ETA badge & Sign out - side by side to save space */}
            <div className="flex items-center gap-3">
              <div className="flex-1 p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-center">
                <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest leading-none">ETA</p>
                <p className="text-amber-800 font-bold text-xs mt-0.5">24–48h</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-secondary hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer border border-surface-container"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-secondary font-medium">
          Support: <span className="font-bold text-primary">partners@quickturf.in</span>
        </p>
      </motion.div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col md:flex-row">

      {/* ── Mobile Top Bar ── */}
      <header className="md:hidden flex items-center justify-between bg-white border-b border-surface-container px-4 py-3 flex-shrink-0 z-40">
        <Link to="/admin/dashboard" className="text-lg font-serif font-bold text-primary">
          QuickTurf <span className="text-xs font-sans font-normal text-secondary">Partner</span>
        </Link>
        <button
          onClick={() => setMobileNavOpen(v => !v)}
          className="p-2 rounded-xl hover:bg-surface-container transition-colors cursor-pointer"
          aria-label="Toggle navigation"
        >
          {mobileNavOpen ? <X className="w-5 h-5 text-on-background" /> : <Menu className="w-5 h-5 text-on-background" />}
        </button>
      </header>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 md:hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-surface-container flex items-center justify-between flex-shrink-0">
                <Link to="/admin/dashboard" onClick={() => setMobileNavOpen(false)} className="text-xl font-serif font-bold text-primary">
                  QuickTurf <span className="text-xs font-sans font-normal text-secondary block">Partner Portal</span>
                </Link>
                <button onClick={() => setMobileNavOpen(false)} className="p-2 rounded-xl hover:bg-surface-container cursor-pointer">
                  <X className="w-4 h-4 text-secondary" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                <NavLinks onNavigate={() => setMobileNavOpen(false)} />
              </nav>
              <div className="p-4 border-t border-surface-container flex-shrink-0">
                <div className="px-4 py-3 mb-3 flex items-center gap-3 bg-surface-container rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-background truncate">{user?.name}</p>
                    <p className="text-xs text-secondary truncate">{user?.email}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl font-medium transition-colors cursor-pointer text-sm">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-64 bg-white border-r border-surface-container flex-col flex-shrink-0 h-full">
        <div className="p-6 border-b border-surface-container flex-shrink-0">
          <Link to="/admin/dashboard" className="text-2xl font-serif font-bold text-primary">
            QuickTurf <span className="text-sm font-sans font-normal text-secondary ml-2 block">Partner Portal</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-surface-container flex-shrink-0">
          <div className="px-4 py-3 mb-4 flex items-center gap-3 bg-surface-container rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-on-background truncate">{user?.name}</p>
              <p className="text-xs text-secondary truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content — only this scrolls ── */}
      <main className="flex-1 overflow-y-auto bg-background">
        {!isApproved ? (
          <PendingScreen />
        ) : (
          <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}
