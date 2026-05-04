import React from "react";
import { Star, Heart, ArrowRight } from "lucide-react";
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
    <Link to={`/turf/${id}`} className="group cursor-pointer block bg-white rounded-2xl border border-surface-container hover:shadow-xl transition-all duration-300 active:scale-[0.98] overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          src={turf.image}
          alt={turf.name}
          loading="lazy"
          decoding="async"
        />

        {/* Gradient overlay — always visible on mobile, hover-only on desktop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />

        {/* Book Now CTA — always visible on mobile, slides up on desktop hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center justify-center gap-2 bg-primary text-white py-2.5 px-4 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg">
            Book Now <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Heart button */}
        {user && (
          <button
            onClick={handleFavorite}
            className={`absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-full shadow-lg hover:scale-110 transition-all active:scale-90 cursor-pointer ${isSaved ? 'text-primary' : 'text-white'}`}
          >
            <Heart className={`w-5 h-5 ${isSaved ? 'fill-primary' : ''}`} />
          </button>
        )}

        {/* Rating badge — amber star + amber text */}
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">
          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
          <span className="font-bold text-xs text-amber-600">{turf.rating}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-serif font-bold text-on-background text-lg group-hover:text-primary transition-colors leading-tight">{turf.name}</h3>
        <p className="text-secondary text-sm font-sans mt-0.5">{turf.location}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-on-background text-lg">₹{turf.price.toLocaleString()}</span>
            <span className="text-secondary text-xs uppercase tracking-wider">/ hr</span>
          </div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-full">View Slots →</span>
        </div>
      </div>
    </Link>
  );
}
