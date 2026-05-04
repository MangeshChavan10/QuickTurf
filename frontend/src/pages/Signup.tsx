import { apiFetch } from "../lib/api";
import { Header, Footer } from "../components/Navigation";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock, User, Phone, ArrowRight, AlertCircle, Sparkles, Key, CheckCircle2 } from "lucide-react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await apiFetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
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

  const handleVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Direct signup call (which verifies OTP on backend)
      const signupRes = await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, otp }),
      });

      const signupData = await signupRes.json();

      if (signupRes.ok) {
        login(signupData.user, signupData.token);
        navigate("/");
      } else {
        setError(signupData.error || "Signup failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header simplified />
      
      <main className="flex-1 flex items-center justify-center p-6 pt-32 pb-36 md:pb-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[32px] border border-surface-container p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          
          <div className="text-center mb-10 relative">
            <div className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-serif text-on-background mb-3">Join QuickTurf</h1>
            <p className="text-secondary font-medium italic opacity-80 text-sm">Start nesting your match sessions</p>
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

          <AnimatePresence mode="wait">
            {!otpSent ? (
              <motion.form 
                key="signup-init"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSendOtp} 
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
                      className="w-full pl-12 pr-4 py-4 bg-surface border border-surface-container rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-sans"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5 opacity-40" />
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
                      Verify Email <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="signup-verify"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleVerifyAndSignup} 
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary ml-4">Full Name</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Arjun Chavan"
                      className="w-full pl-12 pr-4 py-4 bg-surface border border-surface-container rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-sans"
                    />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5 opacity-40" />
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
                      placeholder="At least 8 characters"
                      className="w-full pl-12 pr-4 py-4 bg-surface border border-surface-container rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-sans"
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5 opacity-40" />
                  </div>
                </div>

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
                      className="w-full pl-12 pr-4 py-4 bg-surface border border-surface-container rounded-2xl focus:ring-4 focus:ring-primary/10 tracking-[0.5em] text-center font-bold outline-none transition-all font-sans"
                    />
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5 opacity-40" />
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
                      Complete Signup <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <button 
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-[10px] font-bold text-primary uppercase tracking-widest hover:underline text-center"
                >
                  Change Email
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="mt-8 text-center text-secondary font-medium text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-bold hover:underline">Log in here</Link>
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
