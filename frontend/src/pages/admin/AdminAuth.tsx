import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { MapPin, ArrowRight, Key, Mail, Building2, Lock, AlertCircle, CheckCircle2, Trophy } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { motion, AnimatePresence } from "motion/react";

export default function AdminAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await apiFetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setError("");
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/admin/login" : "/api/admin/register";
      const body = isLogin ? { email, password } : { name, email, password, otp };

      const response = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        navigate("/admin/dashboard");
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container flex flex-col md:flex-row font-sans">
      {/* Left Sidebar: Original structure with enhanced colors */}
      <div className="hidden md:flex flex-1 bg-primary text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle Gradient & Pattern Overlays */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-50"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-white rounded-full blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-accent rounded-full blur-[120px] opacity-20"></div>
        
        <Link to="/" className="flex items-center gap-4 relative z-10 group">
          <div className="relative">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.15)] group-hover:rotate-6 transition-all duration-500">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-black rounded-xl flex items-center justify-center shadow-lg border-2 border-primary group-hover:-rotate-12 transition-all duration-500">
              <Trophy className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-serif font-black tracking-tighter leading-none uppercase">QuickTurf</span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black/40">Partner Hub</span>
          </div>
        </Link>

        <div className="max-w-lg space-y-8 relative z-10">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20"
            >
              Enterprise Dashboard
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-6xl font-serif font-bold leading-tight tracking-tight"
            >
              Turn your turf into a <span className="text-[#0B3D2E] italic font-medium">thriving</span> business.
            </motion.h1>
          </div>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl opacity-90 font-medium leading-relaxed"
          >
            Join Solapur's fastest growing turf network. Manage bookings, track revenue, and grow your community in one place.
          </motion.p>

          <div className="flex flex-wrap gap-3 pt-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2"
            >
              <div className="w-2 h-2 bg-[#0B3D2E] rounded-full animate-pulse"></div>
              Digitalize your business
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2"
            >
              <div className="w-2 h-2 bg-[#0B3D2E] rounded-full"></div>
              Work Smart
            </motion.div>
          </div>
        </div>

        <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 relative z-10">
          © 2026 QUICKTURF • PARTNER DIVISION
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background rounded-t-[40px] md:rounded-none -mt-8 md:mt-0 relative z-20">
        <div className="w-full max-w-md space-y-10">
          <div className="text-center md:text-left space-y-3">
            <h2 className="text-4xl font-serif font-bold text-on-background tracking-tighter">
              {isLogin ? "Welcome Back" : "Become a Partner"}
            </h2>
            <p className="text-secondary font-medium">
              {isLogin ? "Enter your admin credentials to continue" : "Join the network and list your venue today"}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3 shadow-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {otpSent && !error && !isLogin && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-green-50 text-green-600 rounded-2xl text-sm font-bold border border-green-100 flex items-center gap-3 shadow-sm"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              Verification code sent to your email!
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.form 
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={(!isLogin && !otpSent) ? handleSendOtp : handleSubmit} 
              className="space-y-6"
            >
              <div className="space-y-5">
                {!isLogin && !otpSent && (
                  <div className="space-y-1.5 group">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-4">Business Name</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-4 pl-12 bg-surface-container border-2 border-transparent focus:border-black focus:bg-black focus:text-white focus:ring-4 focus:ring-primary/20 rounded-[24px] outline-none transition-all font-bold text-on-background shadow-sm" 
                        placeholder="e.g. Solapur Sports Arena" 
                      />
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-40 transition-transform group-focus-within:scale-110 group-focus-within:text-white" />
                    </div>
                  </div>
                )}
                
                {!otpSent || isLogin ? (
                  <div className="space-y-1.5 group">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-4">Email Address</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        required 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-4 pl-12 bg-surface-container border-2 border-transparent focus:border-black focus:bg-black focus:text-white focus:ring-4 focus:ring-primary/20 rounded-[24px] outline-none transition-all font-bold text-on-background shadow-sm" 
                        placeholder="partner@quickturf.in" 
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-40 transition-transform group-focus-within:scale-110 group-focus-within:text-white" />
                    </div>
                  </div>
                ) : null}
                
                {(isLogin || otpSent) && (
                  <>
                    {!isLogin && (
                      <div className="space-y-1.5 group">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-4">Security Code (OTP)</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            required 
                            maxLength={6}
                            value={otp} 
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full p-4 pl-12 bg-surface-container border-2 border-transparent focus:border-black focus:bg-black focus:text-white focus:ring-4 focus:ring-primary/20 rounded-[24px] outline-none transition-all font-bold text-on-background tracking-[0.5em] shadow-sm" 
                            placeholder="000000" 
                          />
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-40 transition-transform group-focus-within:scale-110 group-focus-within:text-white" />
                        </div>
                        <button type="button" onClick={() => setOtpSent(false)} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline ml-4">
                          Change Email
                        </button>
                      </div>
                    )}

                    <div className="space-y-1.5 group">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-4">Password</label>
                      <div className="relative">
                        <input 
                          type="password" 
                          required 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full p-4 pl-12 bg-surface-container border-2 border-transparent focus:border-primary focus:bg-black focus:text-white focus:ring-4 focus:ring-primary/20 rounded-[24px] outline-none transition-all font-bold text-on-background shadow-sm" 
                        placeholder="••••••••" 
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-40 transition-transform group-focus-within:scale-110 group-focus-within:text-white" />
                      </div>
                      {isLogin && (
                        <div className="flex justify-end mt-2 pr-4">
                          <button type="button" onClick={() => alert("Contact support to reset admin password")} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                            Forgot password?
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-5 bg-primary text-white rounded-full font-black text-sm uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-primary/20 flex justify-center items-center gap-3 group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{isLogin ? "Sign In" : (otpSent ? "Register" : "Verify Email")}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          <p className="text-center text-secondary font-bold text-sm uppercase tracking-widest">
            {isLogin ? "New to QuickTurf?" : "Already a partner?"}{" "}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(""); setOtpSent(false); }}
              className="text-primary hover:underline ml-1 cursor-pointer"
            >
              {isLogin ? "Register your turf" : "Sign in to dashboard"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
