import { Link, useLocation, useNavigate } from "react-router-dom";
import { type ReactNode } from "react";
import { LayoutDashboard, MapPin, CalendarCheck, Users, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

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

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-r border-surface-container flex flex-col flex-shrink-0">
        <div className="p-6">
          <Link to="/admin/dashboard" className="text-2xl font-serif font-bold text-primary">
            QuickTurf <span className="text-sm font-sans font-normal text-secondary ml-2 block">Partner Portal</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {user?.isApproved !== false && navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
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
        </nav>

        <div className="p-4 border-t border-surface-container">
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
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {user?.isApproved === false ? (
            <div className="bg-white p-12 rounded-[32px] border border-surface-container text-center flex flex-col items-center mt-12">
              <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6">
                <Users className="w-10 h-10 text-orange-500" />
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-on-background">Account Pending Verification</h1>
              <p className="text-secondary max-w-lg mt-4 text-lg">
                Your partner account is currently under review by QuickTurf staff. You will receive access to your dashboard and tools once approved.
              </p>
              <p className="text-sm font-bold text-primary mt-8">Please check back later.</p>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
