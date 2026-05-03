import { apiFetch } from "../lib/api";
import { Header, Footer } from "../components/Navigation";
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock, User, Phone, ArrowRight, AlertCircle, Sparkles, Key, CheckCircle2 } from "lucide-react";

type LoginType = "email" | "otp";

export default function Login() {
  const [loginType, setLoginType] = useState<LoginType>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailForOtp, setEmailForOtp] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.user, data.token);
        navigate(from, { replace: true });
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await apiFetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForOtp }),
      });

      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
        startResendTimer();
        if (data.otp) {
          setOtp(data.otp);
        }
        setError(""); 
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isLoading) return;
    setIsLoading(true);
    setError("");
    setOtp("");
    try {
      const res = await apiFetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForOtp }),
      });
      const data = await res.json();
      if (res.ok) {
        startResendTimer();
        setError("");
      } else {
        setError(data.error || "Failed to resend OTP");
      }
    } catch {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await apiFetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForOtp, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.token) {
          login(data.user, data.token);
          navigate(from, { replace: true });
        } else {
          setError("Account not found. Please Sign Up to create your account.");
        }
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header simplified />
      
      <main className="flex-1 flex items-center justify-center p-6 pt-32 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-[32px] border border-surface-container p-8 md:p-12 shadow-xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif text-on-background mb-3">Welcome Back</h1>
            <p className="text-secondary font-medium italic opacity-80 text-sm">Continue your athletic journey</p>
          </div>

          <div className="flex bg-surface-container p-1 rounded-2xl mb-8">
            <button 
              onClick={() => { setLoginType("email"); setError(""); setOtpSent(false); }}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${loginType === 'email' ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-on-background'}`}
            >
              Email Login
            </button>
            <button 
              onClick={() => { setLoginType("otp"); setError(""); }}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${loginType === 'otp' ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-on-background'}`}
            >
              OTP Login
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {otpSent && !error && (
            <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-2xl flex items-center gap-3 text-sm font-bold border border-green-100">
              <CheckCircle2 className="w-5 h-5" />
              OTP sent successfully!
            </div>
          )}

          {otpSent && !error && (
            <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-2xl flex items-center gap-3 text-sm font-bold border border-green-100">
              <CheckCircle2 className="w-5 h-5" />
              OTP sent to your email!
            </div>
          )}

          <AnimatePresence mode="wait">
            {loginType === "email" ? (
              <motion.form 
                key="email-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleEmailSubmit} 
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary ml-4">Email Address</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-12 pr-4 py-4 bg-surface border border-surface-container rounded-2xl focus:border-primary focus:bg-black focus:text-white focus:ring-4 focus:ring-primary/20 outline-none transition-all font-sans"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5 opacity-40" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary ml-4">Password</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-4 bg-surface border border-surface-container rounded-2xl focus:border-primary focus:bg-black focus:text-white focus:ring-4 focus:ring-primary/20 outline-none transition-all font-sans"
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5 opacity-40" />
                  </div>
                  <div className="flex justify-end mt-2 pr-2">
                    <button type="button" onClick={() => alert("Password reset link sent to your email")} className="text-xs font-bold text-primary hover:underline">
                      Forgot password?
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-5 bg-primary text-white font-bold rounded-full shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Connect <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="otp-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} 
                className="space-y-6"
              >
                {!otpSent ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary ml-4">Email Address</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        required
                        value={emailForOtp}
                        onChange={(e) => setEmailForOtp(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-12 pr-4 py-4 bg-surface border border-surface-container rounded-2xl focus:border-primary focus:bg-black focus:text-white focus:ring-4 focus:ring-primary/20 outline-none transition-all font-sans"
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5 opacity-40" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary ml-4">Enter 6-Digit OTP</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="0 0 0 0 0 0"
                        className="w-full pl-12 pr-4 py-4 bg-surface border border-surface-container rounded-2xl focus:border-primary focus:bg-black focus:text-white focus:ring-4 focus:ring-primary/20 outline-none transition-all font-sans tracking-[0.5em] text-center font-bold"
                      />
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5 opacity-40" />
                    </div>
                    <div className="flex items-center justify-between mt-3 px-1">
                      <button 
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                      >
                        Change Email
                      </button>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resendTimer > 0 || isLoading}
                        className="text-[10px] font-bold uppercase tracking-widest transition-all disabled:cursor-not-allowed"
                        style={{ color: resendTimer > 0 ? 'var(--text-dimmed)' : '#6bcf6b' }}
                      >
                        {resendTimer > 0
                          ? `Resend in ${resendTimer}s`
                          : 'Resend OTP'}
                      </button>
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-5 bg-primary text-white font-bold rounded-full shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {otpSent ? "Verify & Login" : "Send OTP"} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="mt-8 text-center text-secondary font-medium text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-bold hover:underline">Sign up for free</Link>
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
