import { Star, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function TurfCard({ turf }: { turf: any }) {
  const id = turf._id || turf.id;
  const { user, favorites, toggleFavorite } = useAuth();
  const isSaved = favorites.includes(id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
  };

  return (
    <Link to={`/turf/${id}`} className="group cursor-pointer block p-4 bg-white rounded-xl border border-surface-container hover:shadow-lg transition-all active:scale-[0.98]">
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-4">
        <img 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          src={turf.image} 
          alt={turf.name} 
          loading="lazy"
          decoding="async"
        />
        {user && (
          <button 
            onClick={handleFavorite}
            className={`absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-full shadow-lg hover:scale-110 transition-all active:scale-90 ${isSaved ? 'text-primary' : 'text-white'}`}
          >
            <Heart className={`w-5 h-5 ${isSaved ? 'fill-primary' : ''}`} />
          </button>
        )}
      </div>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-serif font-bold text-on-background text-lg group-hover:text-primary transition-colors">{turf.name}</h3>
          <p className="text-secondary text-sm font-sans">{turf.location}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-bold text-on-background">₹{turf.price.toLocaleString()}</span>
            <span className="text-secondary text-xs uppercase tracking-wider">/ hour</span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-primary-container px-2 py-1 rounded-full">
          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
          <span className="font-bold text-xs text-primary">{turf.rating}</span>
        </div>
      </div>
    </Link>
  );
}
