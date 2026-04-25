import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function SuperAdminAuth() {
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
      const response = await fetch("/api/superadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        navigate("/superadmin/partners");
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
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-[40px] border border-surface-container shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10"></div>
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-on-background">Super Admin</h1>
          <p className="text-secondary mt-2 text-sm">System administration portal</p>
        </div>

        {error && <div className="p-4 mb-6 bg-red-50 text-red-500 rounded-2xl text-sm font-bold border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-background border border-surface-container focus:border-primary rounded-2xl outline-none transition-all font-medium" 
              placeholder="admin@quickturf.com" 
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider">Password</label>
              <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-background border border-surface-container focus:border-primary rounded-2xl outline-none transition-all font-medium" 
              placeholder="••••••••" 
            />
            <div className="flex justify-end mt-2">
              <button type="button" onClick={() => alert("Password reset link sent to your email")} className="text-sm font-bold text-primary hover:underline">
                Forgot password?
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-on-background text-white rounded-full font-bold text-lg hover:bg-primary active:scale-95 transition-all shadow-xl flex justify-center items-center gap-2 mt-4"
          >
            {isLoading ? "Authenticating..." : "System Login"}
            {!isLoading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
