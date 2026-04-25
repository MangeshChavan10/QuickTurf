import { Map as MapIcon, Star, Heart, SlidersHorizontal, CreditCard, Droplets, Layers, Menu, X, List, Search } from "lucide-react";
import { Header, Footer } from "../components/Navigation";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Turf } from "../mockData";
import TargetPractice from "../components/TargetPractice";

export default function Explore() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    
    fetch("/api/turfs")
      .then(res => res.json())
      .then(data => {
        setTurfs(data);
        setIsLoading(false);
      });

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Filter Logic
  const filteredTurfs = turfs.filter(turf => {
    const matchesSearch = turf.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          turf.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          turf.subLocation.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (activeFilter === "Football") {
      matchesFilter = turf.description.toLowerCase().includes("football") || turf.name.toLowerCase().includes("football");
    } else if (activeFilter === "Cricket") {
      matchesFilter = turf.description.toLowerCase().includes("cricket") || turf.name.toLowerCase().includes("cricket");
    }
    // "All" or other filters don't strictly filter out in this mock

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />

      <main className="pt-20 flex flex-1 overflow-hidden relative">
        {/* Full Width List Section */}
        <section className="w-full flex flex-col bg-background overflow-y-auto custom-scrollbar transition-all duration-500">
          <div className="sticky top-0 bg-background/95 backdrop-blur-md z-20 px-4 md:px-8 py-4 border-b border-surface-container">
            <div className="max-w-[1400px] mx-auto flex flex-col gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary opacity-50" />
                <input 
                  type="text" 
                  placeholder="Search by name, area, or location in Solapur..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-surface-container rounded-full py-3.5 pl-12 pr-6 text-sm font-bold text-on-background placeholder:text-secondary/50 placeholder:font-normal focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                />
              </div>
              
              {/* Filter Pills */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar scrollbar-hide">
                {[
                  { label: "All", icon: Layers },
                  { label: "Football", icon: "⚽" },
                  { label: "Cricket", icon: "🏏" },
                  { label: "Price Range", icon: CreditCard },
                  { label: "Amenities", icon: SlidersHorizontal }
                ].map((filter, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveFilter(filter.label)}
                    className={`flex items-center gap-2 border rounded-full px-4 py-2 hover:border-primary cursor-pointer transition-all active:scale-95 whitespace-nowrap ${activeFilter === filter.label ? 'bg-primary text-on-primary border-primary shadow-md' : 'bg-white border-surface-container text-on-background shadow-sm'}`}
                  >
                    {typeof filter.icon === 'string' ? <span className="text-lg">{filter.icon}</span> : <filter.icon className={`w-4 h-4 ${activeFilter === filter.label ? 'text-on-primary' : 'text-primary'}`} />}
                    <span className="text-xs md:text-sm font-bold uppercase tracking-wider">{filter.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 px-4 md:px-8 py-8 max-w-[1400px] mx-auto w-full">
            <div className="mb-10 text-center lg:text-left">
              <h1 className="text-3xl md:text-5xl font-serif text-on-background mb-3">Solapur's Elite Turfs</h1>
              <p className="text-secondary font-medium italic opacity-80 text-sm md:text-base leading-relaxed">Curated selection of high-performance venues for every sport.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
              {filteredTurfs.length === 0 ? (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-surface-container rounded-2xl">
                  <p className="text-secondary font-medium">No turfs found matching your search criteria.</p>
                  <button onClick={() => {setSearchQuery(''); setActiveFilter('All');}} className="mt-4 text-primary font-bold hover:underline">Clear Filters</button>
                </div>
              ) : (
                filteredTurfs.map(turf => (
                  <Link to={`/turf/${turf._id || turf.id}`} key={turf._id || turf.id} className="group cursor-pointer block p-4 bg-white rounded-[24px] border border-surface-container hover:shadow-xl hover:-translate-y-1 transition-all active:scale-[0.98]">
                  <div className="relative aspect-[4/3] rounded-[20px] overflow-hidden mb-4 bg-surface-container">
                    <img
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      src={turf.image}
                      alt={turf.name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="absolute top-3 right-3 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-accent hover:text-white transition-all shadow-lg active:scale-90">
                      <Heart className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-3 flex gap-2">
                      <span className="bg-primary/90 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">Verified</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-serif font-bold text-xl leading-tight group-hover:text-primary transition-colors line-clamp-1">{turf.name}</h3>
                      <p className="text-secondary text-xs md:text-sm font-bold mt-1 opacity-70">{turf.subLocation} • {turf.distance}</p>
                      <div className="flex items-center gap-1.5 mt-3">
                        <div className="flex items-center bg-primary-container text-primary px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-primary" />
                          <span className="text-xs font-bold ml-1">4.9</span>
                        </div>
                        <span className="text-secondary text-[10px] font-bold uppercase tracking-widest opacity-60">124 Reviews</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-serif font-bold text-xl text-primary">₹{turf.price}</p>
                      <span className="text-secondary font-bold text-[10px] uppercase tracking-tighter opacity-70">/ hour</span>
                    </div>
                  </div>
                </Link>
                ))
              )}
            </div>
          </div>

          <Footer />
        </section>
      </main>

      {/* Trailing Football Cursor */}
      <motion.div 
        className="fixed top-0 left-0 pointer-events-none z-[100] hidden lg:flex text-xl drop-shadow-sm"
        animate={{ 
          x: mousePos.x + 16, 
          y: mousePos.y + 16,
          rotate: mousePos.x * 0.5
        }}
        transition={{ type: "spring", damping: 20, stiffness: 300, mass: 0.2 }}
      >
        ⚽
      </motion.div>
    </div>
  );
}
