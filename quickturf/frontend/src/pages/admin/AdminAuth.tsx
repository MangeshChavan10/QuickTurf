import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { MapPin, ArrowRight } from "lucide-react";

export default function AdminAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/admin/login" : "/api/admin/register";
      const body = isLogin ? { email, password } : { name, email, password };

      const response = await fetch(endpoint, {
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
    <div className="min-h-screen bg-surface-container flex flex-col md:flex-row">
      <div className="hidden md:flex flex-1 bg-primary text-white p-12 flex-col justify-between">
        <Link to="/" className="text-2xl font-serif font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-white text-primary rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          QuickTurf <span className="font-sans font-light opacity-80">Partner</span>
        </Link>
        <div className="max-w-lg space-y-6">
          <h1 className="text-5xl font-serif font-bold leading-tight">Turn your turf into a thriving business.</h1>
          <p className="text-xl opacity-80 font-medium">Join QuickTurf Partner network and manage bookings, revenue, and customers all in one place.</p>
        </div>
        <div className="text-sm opacity-60">© 2026 QuickTurf. All rights reserved.</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background rounded-t-[40px] md:rounded-none -mt-8 md:mt-0 relative z-10">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-serif font-bold text-on-background">
              {isLogin ? "Welcome back, Partner" : "Become a Partner"}
            </h2>
            <p className="text-secondary mt-2">
              {isLogin ? "Enter your details to access your dashboard" : "Create an account to list your turf"}
            </p>
          </div>

          {error && <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-sm font-bold border border-red-100">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Business Name</label>
                <input 
                  type="text" 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-4 bg-surface-container border border-transparent focus:border-primary rounded-2xl outline-none transition-all font-medium" 
                  placeholder="e.g. Match Point Solapur" 
                />
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-secondary uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-surface-container border border-transparent focus:border-primary rounded-2xl outline-none transition-all font-medium" 
                placeholder="partner@example.com" 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-secondary uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-surface-container border border-transparent focus:border-primary rounded-2xl outline-none transition-all font-medium" 
                placeholder="••••••••" 
              />
              {isLogin && (
                <div className="flex justify-end mt-2">
                  <button type="button" onClick={() => alert("Password reset link sent to your email")} className="text-sm font-bold text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-accent text-white rounded-full font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-xl flex justify-center items-center gap-2"
            >
              {isLoading ? "Please wait..." : (isLogin ? "Sign In" : "Register")}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <p className="text-center text-secondary font-medium">
            {isLogin ? "Don't have an account?" : "Already a partner?"}{" "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-bold hover:underline"
            >
              {isLogin ? "Register now" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
