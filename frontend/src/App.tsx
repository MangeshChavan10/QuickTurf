import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { InitialLoader } from "./components/InitialLoader";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import TurfDetail from "./pages/TurfDetail";
import Checkout from "./pages/Checkout";
import Bookings from "./pages/Bookings";
import Profile from "./pages/Profile";
import PaymentStatus from "./pages/PaymentStatus";
import About from "./pages/About";
import Help from "./pages/Help";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ProtectedRoute, AdminRoute, SuperAdminRoute } from "./components/ProtectedRoute";
import Chatbot from "./components/Chatbot";
import { MobileBottomNav } from "./components/Navigation";

import AdminAuth from "./pages/admin/AdminAuth";
import Dashboard from "./pages/admin/Dashboard";
import Turfs from "./pages/admin/Turfs";
import AddTurf from "./pages/admin/AddTurf";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminUsers from "./pages/admin/AdminUsers";

import SuperAdminAuth from "./pages/superadmin/SuperAdminAuth";
import PartnerApprovals from "./pages/superadmin/PartnerApprovals";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isLoading]);

  return (
    <>
      <AnimatePresence>
        {isLoading && <div key="loader"><InitialLoader onComplete={() => setIsLoading(false)} /></div>}
      </AnimatePresence>
      <AuthProvider>
        <ToastProvider>
        <Router>
          <Routes>
            {/* ── Public / User Routes ── */}
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/turf/:id" element={<TurfDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/help" element={<Help />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* ── Protected User-only Routes ── */}
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/payment-status" element={<ProtectedRoute><PaymentStatus /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* ── Partner / Admin Routes ── */}
            <Route path="/admin/login" element={<AdminAuth />} />
            <Route path="/admin/register" element={<AdminAuth />} />
            <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="/admin/turfs" element={<AdminRoute><Turfs /></AdminRoute>} />
            <Route path="/admin/turfs/new" element={<AdminRoute><AddTurf /></AdminRoute>} />
            <Route path="/admin/bookings" element={<AdminRoute><AdminBookings /></AdminRoute>} />
            <Route path="/admin/customers" element={<AdminRoute><AdminUsers /></AdminRoute>} />

            {/* ── Super Admin Routes ── */}
            <Route path="/superadmin/login" element={<SuperAdminAuth />} />
            <Route path="/superadmin/partners" element={<SuperAdminRoute><PartnerApprovals /></SuperAdminRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          {/* Chatbot and MobileBottomNav must be inside Router to use useLocation/useNavigate */}
          <Chatbot />
          <MobileBottomNav />
        </Router>
        </ToastProvider>
      </AuthProvider>
    </>
  );
}
