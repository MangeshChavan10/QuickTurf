import { Navigate, useLocation } from "react-router-dom";
import { type ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

/** Protects regular user routes — redirects to /login if not a user */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <Spinner />;
  // Allow normal users only (not admin/superadmin on user pages)
  if (!user || user.role !== "user") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

/** Protects partner/admin routes — redirects to /admin/login if not an approved admin */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!user || user.role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

/** Protects superadmin routes — redirects to /superadmin/login if not superadmin */
export function SuperAdminRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!user || user.role !== "superadmin") {
    return <Navigate to="/superadmin/login" replace />;
  }
  return children;
}
