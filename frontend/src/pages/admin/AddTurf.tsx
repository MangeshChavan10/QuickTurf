import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { AdminLayout } from "../../components/AdminLayout";
import { UploadCloud, CheckCircle2 } from "lucide-react";

export default function AddTurf() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [subLocation, setSubLocation] = useState("");
  const [type, setType] = useState("Cricket");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!imageFile) {
      setError("Please select a cover image for the turf.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price);
      formData.append("location", location);
      formData.append("subLocation", subLocation);
      formData.append("type", type);
      formData.append("image", imageFile);

      const res = await fetch("/api/admin/turfs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        navigate("/admin/turfs");
      } else {
        setError(data.error || "Failed to add turf");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-on-background">Add New Turf</h1>
          <p className="text-secondary mt-2">Fill in the details below to list a new turf on QuickTurf.</p>
        </div>

        {error && <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-sm font-bold border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-[32px] border border-surface-container space-y-8 shadow-sm">
          {/* Image Upload */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-xl">Cover Image</h3>
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-surface-container rounded-[24px] cursor-pointer hover:border-primary hover:bg-primary/5 transition-all relative overflow-hidden group">
              {imageFile ? (
                <>
                  <img src={URL.createObjectURL(imageFile)} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                  <div className="relative z-10 flex flex-col items-center gap-2 text-primary font-bold">
                    <CheckCircle2 className="w-8 h-8" />
                    <span>Image Selected</span>
                    <span className="text-xs text-secondary font-medium mt-1">Click to change</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-secondary group-hover:text-primary transition-colors">
                  <UploadCloud className="w-10 h-10" />
                  <div className="text-center">
                    <p className="font-bold">Click to upload image</p>
                    <p className="text-sm mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*"
                className="hidden" 
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="h-px bg-surface-container w-full"></div>

          {/* Details */}
          <div className="space-y-6">
            <h3 className="font-serif font-bold text-xl">Turf Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Turf Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-background border border-surface-container focus:border-primary rounded-2xl outline-none transition-all font-medium" placeholder="e.g. Center Court" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Price per Hour (₹)</label>
                <input required type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-4 bg-background border border-surface-container focus:border-primary rounded-2xl outline-none transition-all font-medium" placeholder="e.g. 1000" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider">City / Main Area</label>
                <input required type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-4 bg-background border border-surface-container focus:border-primary rounded-2xl outline-none transition-all font-medium" placeholder="e.g. Solapur" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Specific Location / Road</label>
                <input required type="text" value={subLocation} onChange={e => setSubLocation(e.target.value)} className="w-full p-4 bg-background border border-surface-container focus:border-primary rounded-2xl outline-none transition-all font-medium" placeholder="e.g. Civil Lines Road" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Turf Type</label>
                <select required value={type} onChange={e => setType(e.target.value)} className="w-full p-4 bg-background border border-surface-container focus:border-primary rounded-2xl outline-none transition-all font-medium appearance-none">
                  <option value="Cricket">Cricket</option>
                  <option value="Football">Football</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Multi-Sport">Multi-Sport</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button type="button" onClick={() => navigate('/admin/turfs')} className="px-6 py-4 rounded-full font-bold text-secondary hover:bg-surface-container transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-primary text-white rounded-full font-bold hover:brightness-110 active:scale-95 transition-all shadow-xl disabled:opacity-70">
              {isSubmitting ? "Saving..." : "Publish Turf"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
