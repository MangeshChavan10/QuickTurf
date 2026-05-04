import { apiFetch } from "../lib/api";
import { Header, Footer } from "../components/Navigation";
import { motion } from "motion/react";
import { useState, useEffect, type ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { User, Phone, Mail, Lock, CheckCircle2, Pencil, ShieldCheck, Heart } from "lucide-react";
import { TurfCard } from "../components/TurfCard";

export default function Profile() {
  const { user, updateUser, favorites } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savedTurfs, setSavedTurfs] = useState<any[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    
    // Fetch latest profile to keep everything in sync
    apiFetch(`/api/user/profile?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.name) {
          setName(data.name);
          updateUser({ name: data.name }); // Keep AuthContext in sync
        }
        if (data.phoneNumber) setPhone(data.phoneNumber);
      });

    // Fetch all turfs to filter saved ones
    apiFetch("/api/turfs")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSavedTurfs(data.filter(t => favorites.includes(t._id || t.id)));
        }
      });
  }, [user, navigate, favorites]);

  const initials = name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  const handleSave = async () => {
    setError("");
    if (newPassword && newPassword !== confirmPassword) {
      setError("Passwords don't match."); return;
    }
    if (newPassword && newPassword.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }

    setIsSaving(true);
    try {
      const res = await apiFetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email, name, phoneNumber: phone, newPassword: newPassword || undefined })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Save failed."); return; }

      // Update AuthContext with new name instantly
      updateUser({ name: data.name });
      setSaved(true);
      setNewPassword(""); setConfirmPassword("");
      setEditingField(null);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-32 pb-36 md:pb-20 max-w-[1280px] mx-auto px-4 md:px-6 w-full page-transition">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Account Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="mb-6">
              <h1 className="text-4xl font-serif text-on-background mb-2">Your Profile</h1>
              <p className="text-secondary text-sm opacity-70">Manage your personal details and account settings.</p>
            </div>

            {/* Avatar + basic info card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] border border-surface-container p-8 flex items-center gap-6 shadow-sm"
            >
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                <span className="text-2xl font-serif font-bold text-white">{initials}</span>
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-on-background">{name || "Your Name"}</h2>
                <p className="text-secondary text-sm">{user?.email}</p>
                <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="w-3 h-3" /> {user?.role}
                </span>
              </div>
            </motion.div>

            {/* Edit form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-white rounded-[32px] border border-surface-container p-8 shadow-sm space-y-6"
            >
              <h3 className="text-lg font-serif font-bold text-on-background border-b border-surface-container pb-4">Edit Details</h3>

              <Field
                icon={<User className="w-4 h-4" />}
                label="Full Name"
                id="name"
                value={name}
                onChange={setName}
                placeholder="Your full name"
                isEditing={editingField === 'name'}
                onEdit={() => setEditingField('name')}
              />

              <div className="flex items-center gap-4 p-4 bg-surface-container/50 rounded-2xl opacity-70">
                <div className="p-2 bg-surface-container rounded-xl text-secondary"><Mail className="w-4 h-4" /></div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-0.5">Email</p>
                  <p className="text-sm font-semibold text-on-background">{user?.email}</p>
                </div>
                <span className="text-[10px] text-secondary/60 font-bold uppercase tracking-wider">Read-only</span>
              </div>

              <Field
                icon={<Phone className="w-4 h-4" />}
                label="Phone Number"
                id="phone"
                type="tel"
                value={phone}
                onChange={setPhone}
                placeholder="e.g. 9876543210"
                isEditing={editingField === 'phone'}
                onEdit={() => setEditingField('phone')}
              />

              <div className="border-t border-surface-container pt-6 space-y-4">
                <h4 className="text-sm font-bold text-on-background flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" /> Change Password
                  <span className="text-[10px] font-normal text-secondary/60">(leave blank to keep current)</span>
                </h4>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full px-4 py-3 rounded-2xl border border-surface-container bg-background text-sm font-medium focus:outline-none focus:border-primary focus:bg-black focus:text-white focus:ring-4 focus:ring-primary/20 transition-all"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 rounded-2xl border border-surface-container bg-background text-sm font-medium focus:outline-none focus:border-primary focus:bg-black focus:text-white focus:ring-4 focus:ring-primary/20 transition-all"
                />
              </div>

              {error && (
                <p className="text-sm text-rose-600 bg-rose-50 px-4 py-3 rounded-2xl">{error}</p>
              )}

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-4 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : saved ? (
                  <><CheckCircle2 className="w-5 h-5" /> Saved!</>
                ) : (
                  "Save Changes"
                )}
              </button>
            </motion.div>
          </div>

          {/* Right Column: Saved Turfs */}
          <div className="lg:col-span-7">
            <div className="mb-8">
              <h2 className="text-3xl font-serif text-on-background mb-2">Saved Venues</h2>
              <p className="text-secondary text-sm opacity-70">Quick access to your favorite turfs in Solapur.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {savedTurfs.length > 0 ? (
                savedTurfs.map(turf => (
                  <TurfCard key={turf._id || turf.id} turf={turf} />
                ))
              ) : (
                <div className="col-span-full py-16 px-8 border-2 border-dashed border-surface-container rounded-[32px] text-center bg-white/50">
                  <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4 text-secondary opacity-40">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-serif font-bold text-on-background mb-2">No saved venues yet</h4>
                  <p className="text-secondary text-sm max-w-xs mx-auto mb-6">Venues you save will appear here for easy access later.</p>
                  <button 
                    onClick={() => navigate("/explore")}
                    className="px-6 py-3 bg-primary text-white rounded-full font-bold text-sm hover:brightness-110 transition-all uppercase tracking-widest"
                  >
                    Browse Venues
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Reusable editable field component
function Field({ icon, label, id, value, onChange, placeholder, type = "text", isEditing, onEdit }: {
  icon: ReactNode; label: string; id: string; value: string;
  onChange: (v: string) => void; placeholder: string; type?: string;
  isEditing: boolean; onEdit: () => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-surface-container hover:border-primary/30 transition-all group">
      <div className="p-2 bg-surface-container rounded-xl text-primary">{icon}</div>
      <div className="flex-1">
        <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-0.5">{label}</p>
        {isEditing ? (
          <input
            id={id}
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            autoFocus
            className="w-full text-sm font-semibold text-on-background bg-transparent border-none outline-none focus:bg-black focus:text-white px-2 py-1 rounded-lg transition-all"
            placeholder={placeholder}
          />
        ) : (
          <p className="text-sm font-semibold text-on-background">{value || <span className="text-secondary/50 italic">{placeholder}</span>}</p>
        )}
      </div>
      <button onClick={onEdit} className="p-2 text-secondary/40 hover:text-primary opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-surface-container">
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
