import { apiFetch } from "../lib/api";
import { useParams, useNavigate } from "react-router-dom";
import { REVIEWS, Turf, Review } from "../mockData";
import { Header, Footer } from "../components/Navigation";
import { Star, Heart, Share2, MapPin, ShieldCheck, Shirt, Droplets, Car, PlusCircle, Building, Lightbulb, Circle as SoccerBall, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const AMENITY_ICONS: Record<string, any> = {
  "Night LED Floodlights": Lightbulb,
  "Changing Rooms & Showers": Shirt,
  "Free On-site Parking": Car,
  "Filtered Drinking Water": Droplets,
  "Spectator Stand (50 people)": Building,
  "Floodlights": Lightbulb,
  "Changing Rooms": Shirt,
  "Parking": Car,
  "Power Backup": Lightbulb,
  "Water": Droplets,
  "Refreshments": PlusCircle
};

export default function TurfDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [turf, setTurf] = useState<Turf | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [shareText, setShareText] = useState("Share");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    try {
      const response = await apiFetch(`/api/turfs/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: user?.name || "Guest User",
          rating: reviewRating,
          comment: reviewText
        })
      });

      if (!response.ok) throw new Error("Failed to submit review");
      const newReview = await response.json();
      
      setReviews([newReview, ...reviews]);
      setIsReviewModalOpen(false);
      setReviewText("");
      setReviewRating(5);
      
      // Update local turf rating state loosely (the full reload would sync it properly)
      if (turf) {
        const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0) + reviewRating;
        const newCount = reviews.length + 1;
        setTurf({
          ...turf,
          rating: Number((totalRating / newCount).toFixed(2)),
          reviewCount: newCount
        });
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: turf?.name || 'QuickTurf Venue',
          url: window.location.href,
        });
        return; // Success, exit
      }
    } catch (err) {
      console.log('Share API failed:', err);
    }

    // Fallback to clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        // Legacy fallback for insecure contexts (like 0.0.0.0)
        const textArea = document.createElement("textarea");
        textArea.value = window.location.href;
        // Make it invisible
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setShareText("Copied!");
      setTimeout(() => setShareText("Share"), 2000);
    } catch (clipErr) {
      console.log('Error copying to clipboard:', clipErr);
      alert("Failed to copy link. Please manually copy the URL from your browser.");
    }
  };
  useEffect(() => {
    Promise.all([
      apiFetch(`/api/turfs/${id}`).then(res => {
        if (!res.ok) throw new Error("Turf not found");
        return res.json();
      }),
      apiFetch(`/api/turfs/${id}/reviews`).then(res => res.json())
    ])
    .then(([turfData, reviewsData]) => {
      if (turfData.error) throw new Error(turfData.error);
      setTurf(turfData);
      if (Array.isArray(reviewsData)) {
        setReviews(reviewsData);
      }
    })
    .catch(err => {
      console.error(err);
      navigate("/explore");
    });
  }, [id, navigate]);

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        date: date.getDate().toString().padStart(2, '0'),
        month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        fullDate: date
      });
    }
    return dates;
  };
  const DATES = generateDates();

  const TIME_SLOTS = {
    "Morning": ["06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM"],
    "Afternoon": ["12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"],
    "Evening & Night": ["06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM"]
  };

  const [selectedDate, setSelectedDate] = useState(DATES[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);

  useEffect(() => {
    if (!turf) return;

    const fetchAvailability = async () => {
      setIsAvailabilityLoading(true);
      try {
        const formattedDate = `${selectedDate.day} ${selectedDate.date} ${selectedDate.month}`;
        const res = await apiFetch(`/api/turfs/${id}/availability?date=${encodeURIComponent(formattedDate)}`);
        const data = await res.json();
        if (data.bookedSlots) {
          setBookedSlots(data.bookedSlots);
        }
      } catch (err) {
        console.error("Error fetching availability:", err);
      } finally {
        setIsAvailabilityLoading(false);
      }
    };

    fetchAvailability();
  }, [id, turf, selectedDate]);

  if (!turf) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-20 bg-background">
        <section className="max-w-[1280px] mx-auto px-6 pt-8">
          <div className="flex flex-col gap-4 mb-6">
            <h1 className="text-4xl font-serif text-on-background">{turf.name}</h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span className="font-bold text-sm">{turf.rating}</span>
                  <span className="text-secondary text-sm underline decoration-surface-container underline-offset-4 cursor-pointer">({turf.reviewCount} reviews)</span>
                </div>
                <span className="text-surface-container">•</span>
                <div className="flex items-center gap-1 underline underline-offset-4 font-semibold text-sm text-secondary decoration-surface-container">{turf.location}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleShare} className="flex items-center gap-2 px-3 py-2 hover:bg-surface-container rounded-full transition-all font-semibold text-xs uppercase tracking-widest text-secondary">
                  <Share2 className="w-4 h-4" /> {shareText}
                </button>
                <button onClick={() => setIsSaved(!isSaved)} className={`flex items-center gap-2 px-3 py-2 hover:bg-surface-container rounded-full transition-all font-semibold text-xs uppercase tracking-widest ${isSaved ? 'text-primary' : 'text-secondary'}`}>
                  <Heart className={`w-4 h-4 ${isSaved ? 'fill-primary' : ''}`} /> {isSaved ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 md:gap-3 h-[350px] md:h-[500px] rounded-2xl md:rounded-[32px] overflow-hidden mb-8 md:mb-12 border border-surface-container shadow-sm bg-white p-2 md:p-3 pb-4 md:pb-3">
            <div className="md:col-span-2 md:row-span-2 overflow-hidden rounded-xl md:rounded-2xl relative group cursor-pointer h-full bg-surface-container">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                src={turf.gallery?.[0] || turf.image}
                alt="Turf 1"
                fetchPriority="high"
                decoding="async"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200";
                }}
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all"></div>
            </div>
            <div className="hidden md:block col-span-1 row-span-1 overflow-hidden rounded-xl md:rounded-2xl relative group cursor-pointer">
              <img className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" src={turf.gallery?.[1] || turf.image} alt="Turf 2" loading="lazy" decoding="async" />
            </div>
            <div className="hidden md:block col-span-1 row-span-1 overflow-hidden rounded-xl md:rounded-2xl relative group cursor-pointer">
              <img className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" src={turf.gallery?.[2] || turf.image} alt="Turf 3" loading="lazy" decoding="async" />
            </div>
            <div className="hidden md:block col-span-1 row-span-1 overflow-hidden rounded-xl md:rounded-2xl relative group cursor-pointer">
              <img className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" src={turf.gallery?.[3] || turf.image} alt="Turf 4" loading="lazy" decoding="async" />
            </div>
            <div className="hidden md:block col-span-1 row-span-1 overflow-hidden rounded-xl md:rounded-2xl relative group cursor-pointer">
              <img className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" src={turf.gallery?.[4] || turf.image} alt="Turf 5" loading="lazy" decoding="async" />
            </div>
            {/* Mobile indicator */}
            <div className="md:hidden flex gap-2 overflow-x-auto no-scrollbar py-1">
              {(turf.gallery || []).slice(1, 4).map((img, i) => (
                <div key={i} className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-surface-container bg-surface-container">
                  <img
                    className="w-full h-full object-cover"
                    src={img}
                    alt={`Turf ${i + 2}`}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800";
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-12 pb-32">
            <div className="space-y-12">
              <div className="flex justify-between items-center pb-8 border-b border-surface-container">
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif mb-1">Managed by {turf.host?.name || "Local Manager"}</h2>
                  <p className="text-secondary font-medium italic text-sm md:text-base">Host for {turf.host?.years || 1} years • Expert Turf Management</p>
                </div>
                {turf.host?.avatar && <img className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover shadow-md border-2 border-surface-container" src={turf.host.avatar} alt="Host" />}
              </div>

              {/* Responsive Date & Time Selection */}
              <div className="flex flex-col md:flex-row gap-8 md:gap-16 pt-4">
                {/* Date Slot */}
                <div className="w-full md:w-32 flex flex-col shrink-0">
                  <div className="mb-4 md:mb-6">
                    <p className="text-[10px] font-black text-secondary tracking-[0.2em] uppercase mb-1 md:mb-2">Schedule</p>
                    <h3 className="text-xl md:text-2xl font-serif text-on-background leading-none">Date</h3>
                  </div>
                  <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:h-[350px] no-scrollbar pb-2 md:pb-8 md:pr-2">
                    {DATES.map((dateObj, i) => {
                      const isSelected = selectedDate.date === dateObj.date && selectedDate.month === dateObj.month;
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedDate(dateObj);
                            setSelectedSlot(null);
                          }}
                          className={`flex-shrink-0 flex items-center justify-between px-4 py-3 transition-all border-b-2 md:border-b-0 md:border-l-2 ${isSelected
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-transparent text-secondary hover:text-on-background hover:bg-surface-container/50'
                            }`}
                        >
                          <div className="flex flex-col items-start text-left">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{dateObj.day}</span>
                            <span className={`text-lg md:text-xl font-serif ${isSelected ? 'font-bold' : 'font-light'}`}>{dateObj.date}</span>
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-widest md:rotate-[-90deg] md:origin-center opacity-60 ml-3 md:ml-0">{dateObj.month}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                <div className="relative overflow-hidden flex flex-col flex-1">
                  <div className="mb-6">
                    <p className="text-[10px] font-black text-secondary tracking-[0.2em] uppercase mb-1 md:mb-2">Availability</p>
                    <h3 className="text-xl md:text-2xl font-serif text-on-background leading-none">Time Slots</h3>
                  </div>

                  {isAvailabilityLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  <div className="space-y-8 md:space-y-10 overflow-y-auto md:h-[350px] no-scrollbar md:pr-4 pb-4">
                    {Object.entries(TIME_SLOTS).map(([session, slots]) => (
                      <div key={session} className="space-y-4 md:space-y-5">
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-on-background uppercase tracking-[0.2em]">{session}</span>
                          <div className="h-[1px] flex-1 bg-surface-container"></div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {slots.map(slot => {
                            const isBooked = bookedSlots.includes(slot);
                            const isSelected = selectedSlot === slot;
                            return (
                              <button
                                key={slot}
                                disabled={isBooked}
                                onClick={() => setSelectedSlot(slot)}
                                className={`py-4 px-2 font-mono text-xs md:text-sm transition-all border rounded-none relative overflow-hidden ${isBooked
                                    ? 'bg-surface-container/30 border-transparent text-secondary/30 cursor-not-allowed line-through decoration-secondary/20'
                                    : isSelected
                                      ? 'bg-on-background text-white border-on-background shadow-lg'
                                      : 'bg-transparent border-surface-container text-on-background hover:border-on-background'
                                  }`}
                              >
                                <span className="relative z-10">{slot}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-6 mt-auto border-t border-surface-container font-sans shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-on-background"></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full border border-surface-container"></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-surface-container/50"></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Booked</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12">
                <div className="space-y-6">
                  <h3 className="text-xl md:text-2xl font-serif border-l-4 border-primary pl-4">About this facility</h3>
                  <p className="text-on-background leading-relaxed text-base md:text-lg opacity-80">{turf.description}</p>
                </div>

                <div className="space-y-8">
                  <h3 className="text-xl md:text-2xl font-serif">Facility Amenities</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(turf.amenities || []).map((amenity, i) => {
                      const Icon = AMENITY_ICONS[amenity] || ShieldCheck;
                      return (
                        <div key={i} className="flex items-center gap-4 p-4 bg-surface-container/50 rounded-2xl border border-transparent hover:border-primary/10 transition-all">
                          <Icon className="w-5 h-5 text-primary" />
                          <span className="font-bold text-sm text-on-background/80">{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-24 border-t border-surface-container">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                  <div className="flex items-center gap-4">
                    <Star className="w-8 h-8 fill-primary text-primary" />
                    <h3 className="text-3xl font-serif">{turf.rating} <span className="text-secondary font-sans text-lg italic tracking-tight">• Verified Reviews</span></h3>
                  </div>
                  <button onClick={() => setIsReviewModalOpen(true)} className="px-8 py-3 rounded-full border border-surface-container font-bold text-sm tracking-widest uppercase hover:bg-surface-container transition-all">Write a Review</button>
                </div>
                {reviews.length > 0 ? (
                  <div className="flex overflow-x-auto gap-6 md:gap-8 pb-8 snap-x custom-scrollbar">
                    {reviews.map(r => (
                      <div key={r.id} className="min-w-[300px] md:min-w-[400px] snap-center space-y-5 p-8 bg-white rounded-[40px] border border-surface-container hover:shadow-xl transition-all duration-500 group flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full border-2 border-surface-container flex items-center justify-center bg-primary-container text-primary font-bold text-xl group-hover:border-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                              {r.author.charAt(0)}
                            </div>
                            <div><h4 className="font-bold text-on-background text-lg">{r.author}</h4><p className="text-secondary text-[10px] font-black uppercase tracking-widest opacity-40">{r.date}</p></div>
                          </div>
                          <p className="text-on-background leading-relaxed font-medium opacity-80 text-base">"{r.comment}"</p>
                        </div>
                        <div className="flex gap-1 mt-4">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-primary text-primary' : 'text-surface-container'}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center justify-center py-12 px-6 bg-surface-container/20 rounded-[40px] border border-dashed border-surface-container text-center">
                    <Star className="w-12 h-12 text-secondary/30 mb-4" />
                    <h4 className="text-xl font-serif text-on-background mb-2">No reviews yet</h4>
                    <p className="text-secondary mb-6 max-w-md">Be the first one to review {turf.name} and share your experience with other players!</p>
                    <button onClick={() => setIsReviewModalOpen(true)} className="px-6 py-3 rounded-full bg-primary text-white font-bold text-sm tracking-widest uppercase hover:shadow-lg hover:-translate-y-1 transition-all">Write the First Review</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* BookMyShow Style Fixed Bottom Bar */}
        <AnimatePresence>
          {selectedSlot && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-surface-container shadow-[0px_-10px_40px_rgba(42,52,40,0.2)]"
            >
              <div className="max-w-[1280px] mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-8">
                  <div className="hidden sm:block">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1 opacity-60">Venue</p>
                    <p className="font-bold text-on-background text-lg line-clamp-1">{turf.name}</p>
                  </div>
                  <div className="w-px h-10 bg-surface-container hidden sm:block"></div>
                  <div>
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1 opacity-60">Session</p>
                    <p className="font-bold text-primary text-lg">{selectedDate.date} {selectedDate.month} • {selectedSlot}</p>
                  </div>
                  <div className="w-px h-10 bg-surface-container hidden md:block"></div>
                  <div className="hidden md:block">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1 opacity-60">Investment</p>
                    <p className="font-serif font-bold text-2xl text-on-background">₹{(turf.price + 350).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex-1 md:hidden">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1 opacity-60">Total Cost</p>
                    <p className="font-serif font-bold text-2xl text-on-background">₹{(turf.price + 350).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => navigate('/checkout', { state: { turf, selectedSlot, selectedDate: `${selectedDate.day} ${selectedDate.date} ${selectedDate.month}` } })}
                    className="flex-[2] md:flex-none px-12 py-5 bg-accent text-white font-bold text-lg rounded-full shadow-2xl hover:brightness-110 active:scale-95 transition-all font-serif flex items-center justify-center gap-4 group"
                  >
                    Confirm Booking
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <section className="max-w-[1280px] mx-auto px-6 py-24 mb-16 border-t border-surface-container">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-3xl md:text-4xl font-serif text-on-background">Find Us</h3>
            <div className="flex items-center gap-2 px-6 py-2 bg-primary/10 rounded-full text-primary font-bold text-xs uppercase tracking-widest border border-primary/20">
              <MapPin className="w-4 h-4" /> Solapur, MH
            </div>
          </div>
          <div className="h-[500px] bg-surface-container rounded-[48px] relative overflow-hidden shadow-2xl border border-surface-container group">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(turf.name + " " + turf.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
              className="w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700"
            ></iframe>
          </div>
        </section>
      </main>
      <Footer />

      {/* Review Modal */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-surface-container hover:bg-secondary/20 transition-colors"
              >
                <X className="w-5 h-5 text-on-background" />
              </button>

              <h3 className="text-2xl font-serif font-bold mb-6">Write a Review</h3>

              <form onSubmit={handleReviewSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-secondary mb-2 uppercase tracking-widest">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star className={`w-8 h-8 ${star <= reviewRating ? 'fill-primary text-primary' : 'text-surface-container'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-secondary mb-2 uppercase tracking-widest">Your Review</label>
                  <textarea
                    required
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Tell us about your experience playing at this turf..."
                    className="w-full h-32 p-4 rounded-2xl bg-background border border-surface-container focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none custom-scrollbar transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-full bg-primary text-white font-bold tracking-widest uppercase shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:translate-y-0"
                >
                  Submit Review
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
