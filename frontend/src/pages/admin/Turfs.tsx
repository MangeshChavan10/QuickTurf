import { apiFetch } from "../../lib/api";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { AdminLayout } from "../../components/AdminLayout";
import { Plus, Star, MapPin as MapPinIcon, Pencil, X, CheckCircle2, IndianRupee } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Turf {
  _id: string;
  name: string;
  price: number;
  location: string;
  subLocation?: string;
  type?: string;
  description?: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
}

export default function Turfs() {
  const { token } = useAuth();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit state
  const [editingTurf, setEditingTurf] = useState<Turf | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Form state (populated when modal opens)
  const [form, setForm] = useState({ name: "", price: "", location: "", subLocation: "", type: "", description: "" });

  const openEdit = (turf: Turf) => {
    setEditingTurf(turf);
    setForm({
      name: turf.name || "",
      price: String(turf.price || ""),
      location: turf.location || "",
      subLocation: turf.subLocation || "",
      type: turf.type || "",
      description: turf.description || "",
    });
    setSaveSuccess(false);
    setSaveError("");
  };

  const closeEdit = () => { setEditingTurf(null); setSaveSuccess(false); setSaveError(""); };

  const handleSave = async () => {
    if (!editingTurf) return;
    setSaveError("");
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/turfs/${editingTurf._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setSaveError(data.error || "Save failed."); return; }

      // Update local state immediately
      setTurfs(prev => prev.map(t => t._id === editingTurf._id ? { ...t, ...data.turf } : t));
      setSaveSuccess(true);
      setTimeout(() => closeEdit(), 1200);
    } catch {
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    apiFetch("/api/admin/turfs", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setTurfs(d))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [token]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-on-background">My Turfs</h1>
            <p className="text-secondary mt-2">Manage your listings — edit details or add new venues.</p>
          </div>
          <Link
            to="/admin/turfs/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold hover:brightness-110 active:scale-95 transition-all shadow-md"
          >
            <Plus className="w-5 h-5" /> Add New Turf
          </Link>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-[24px] h-64 animate-pulse border border-surface-container" />)}
          </div>
        ) : turfs.length === 0 ? (
          <div className="bg-white p-12 rounded-[32px] border border-surface-container text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4">
              <MapPinIcon className="w-10 h-10 text-secondary" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-on-background">No Turfs Listed</h3>
            <p className="text-secondary max-w-md mt-2 mb-8">You haven't added any turfs yet. Add your first turf to start receiving bookings!</p>
            <Link to="/admin/turfs/new" className="px-8 py-4 bg-primary text-white rounded-full font-bold hover:brightness-110 active:scale-95 transition-all shadow-xl">
              Add First Turf
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {turfs.map((turf) => (
              <motion.div
                key={turf._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[24px] border border-surface-container overflow-hidden group hover:shadow-lg transition-all"
              >
                <div className="relative h-48 overflow-hidden">
                  <img src={turf.image} alt={turf.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-on-background">
                    ₹{turf.price}/hr
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-serif font-bold text-xl text-on-background truncate">{turf.name}</h3>
                  <div className="flex items-center gap-1.5 mt-2 text-secondary text-sm">
                    <MapPinIcon className="w-4 h-4" />
                    <span className="truncate">{turf.location}</span>
                  </div>
                  {turf.rating !== undefined && (
                    <div className="flex items-center gap-1.5 mt-2 text-sm font-bold text-on-background">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      {turf.rating} <span className="text-secondary font-normal">({turf.reviewCount} reviews)</span>
                    </div>
                  )}
                  <div className="mt-6 pt-6 border-t border-surface-container flex gap-3">
                    <Link to={`/turf/${turf._id}`} className="flex-1 py-2 text-center text-primary font-bold bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors text-sm">
                      View Public
                    </Link>
                    <button
                      onClick={() => openEdit(turf)}
                      className="flex-1 py-2 text-center text-on-background font-bold bg-surface-container rounded-xl hover:bg-black/5 transition-colors text-sm flex items-center justify-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingTurf && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && closeEdit()}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-bold text-on-background">Edit Turf</h2>
                <button onClick={closeEdit} className="p-2 rounded-full hover:bg-surface-container transition-all">
                  <X className="w-5 h-5 text-secondary" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1.5">Turf Name</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-surface-container bg-background text-sm font-medium focus:outline-none focus:border-primary transition-all"
                    placeholder="e.g. Match Point Arena"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1.5">Price per Hour (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <input
                      type="number"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-surface-container bg-background text-sm font-medium focus:outline-none focus:border-primary transition-all"
                      placeholder="500"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1.5">Location / Area</label>
                  <input
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-surface-container bg-background text-sm font-medium focus:outline-none focus:border-primary transition-all"
                    placeholder="e.g. Solapur"
                  />
                </div>

                {/* Sub Location */}
                <div>
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1.5">Sub Location / Neighbourhood</label>
                  <input
                    value={form.subLocation}
                    onChange={e => setForm(f => ({ ...f, subLocation: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-surface-container bg-background text-sm font-medium focus:outline-none focus:border-primary transition-all"
                    placeholder="e.g. Vijapur Road"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1.5">Turf Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-surface-container bg-background text-sm font-medium focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="">Select type...</option>
                    <option value="Football">Football</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Badminton">Badminton</option>
                    <option value="Multi-Sport">Multi-Sport</option>
                    <option value="Tennis">Tennis</option>
                    <option value="Basketball">Basketball</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 rounded-2xl border border-surface-container bg-background text-sm font-medium focus:outline-none focus:border-primary transition-all resize-none"
                    placeholder="Describe the turf facilities..."
                  />
                </div>

                {/* Error */}
                {saveError && <p className="text-sm text-rose-600 bg-rose-50 px-4 py-3 rounded-2xl">{saveError}</p>}

                {/* Save button */}
                <button
                  onClick={handleSave}
                  disabled={isSaving || saveSuccess}
                  className="w-full py-4 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : saveSuccess ? (
                    <><CheckCircle2 className="w-5 h-5" /> Saved!</>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
