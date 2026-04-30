import { apiFetch } from "../lib/api";
import { Header, Footer } from "../components/Navigation";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Clock, MapPin, ChevronRight, IndianRupee, CheckCircle2, XCircle, AlertTriangle, Star, MessageSquare } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Bookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [shakingId, setShakingId] = useState<string | null>(null);
  
  // Review Modal State
  const [reviewingBooking, setReviewingBooking] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    apiFetch(`/api/bookings?email=${user.email}`)
      .then(res => res.json())
      .then(data => {
        setMyBookings(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [user, navigate]);

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      const res = await apiFetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMyBookings(prev => prev.map(b =>
          b._id === bookingId ? { ...b, status: 'Cancelled' } : b
        ));
        alert(data.message);
      } else {
        alert(data.error || 'Failed to cancel booking.');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setCancellingId(null);
      setConfirmId(null);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() || !reviewingBooking) return;
    setIsSubmittingReview(true);

    try {
      // 1. Submit review to Turf
      const reviewRes = await apiFetch(`/api/turfs/${reviewingBooking.turfId._id || reviewingBooking.turfId.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: user?.name || "Guest User",
          rating: reviewRating,
          comment: reviewText
        })
      });

      if (!reviewRes.ok) throw new Error("Failed to submit review");

      // 2. Mark booking as reviewed
      const markRes = await apiFetch(`/api/bookings/${reviewingBooking._id}/reviewed`, {
        method: "PUT"
      });

      if (!markRes.ok) throw new Error("Failed to mark booking as reviewed");

      // 3. Update local state
      setMyBookings(prev => prev.map(b =>
        b._id === reviewingBooking._id ? { ...b, isReviewed: true } : b
      ));

      setReviewingBooking(null);
      setReviewText("");
      setReviewRating(5);
      alert("Thank you! Your review has been published.");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-on-background">Cancel this booking?</h3>
                <p className="text-secondary text-sm leading-relaxed">
                  If you're cancelling <strong>more than 12 hours</strong> before your slot, you'll get a refund minus a <strong>₹50 platform fee</strong>.<br /><br />
                  If you cancel <strong>within 12 hours</strong> of your booking, <strong>no refund</strong> will be issued.
                </p>
                <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>⚠️ Disclaimer:</strong> QuickTurf initiates your refund immediately via Razorpay. However, the actual credit to your bank account or card depends on your bank and typically takes <strong>5–7 business days</strong>. You will receive a second email once your bank confirms the transfer. For disputes, contact <strong>support@quickturf.in</strong>.
                  </p>
                </div>
                <div className="flex gap-3 w-full mt-4">
                  <button
                    onClick={() => setConfirmId(null)}
                    className="flex-1 py-3 rounded-full border border-surface-container font-bold text-sm hover:bg-surface-container transition-all"
                  >
                    Keep Booking
                  </button>
                  <button
                    onClick={() => confirmId && handleCancel(confirmId)}
                    disabled={cancellingId === confirmId}
                    className="flex-1 py-3 rounded-full bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {cancellingId === confirmId ? (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Yes, Cancel
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 pt-32 pb-20 max-w-[1280px] mx-auto px-4 md:px-6 w-full page-transition">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-on-background mb-4">My Bookings</h1>
          <p className="text-secondary font-medium italic opacity-80">Your upcoming sessions and match history.</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {myBookings.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-surface-container">
              <p className="text-secondary font-medium">No bookings yet. Time to hit the turf!</p>
            </div>
          ) : (
            myBookings.map((booking, i) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`bg-white rounded-[32px] border overflow-hidden p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center shadow-sm hover:shadow-md transition-all group ${booking.status === 'Cancelled' ? 'opacity-60 border-rose-100' : 'border-surface-container'}`}
              >
                <div className="w-full md:w-48 h-32 md:h-full shrink-0 rounded-2xl overflow-hidden shadow-inner">
                  <img src={booking.turfId?.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={booking.turfId?.name} loading="lazy" decoding="async" />
                </div>

                <div className="flex-1 space-y-4 w-full">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] uppercase tracking-[0.2em] font-black px-3 py-1 rounded-full ${booking.status === 'Confirmed' ? 'bg-primary/10 text-primary' :
                            booking.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' :
                              'bg-surface-container text-secondary'
                          }`}>
                          {booking.status}
                        </span>
                        <span className="text-[10px] text-secondary font-bold uppercase tracking-widest opacity-60">ID: {booking.orderId}</span>
                      </div>
                      <h2 className="text-2xl font-serif font-bold text-on-background group-hover:text-primary transition-colors">{booking.turfId?.name}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-serif font-bold text-primary">₹{(booking.amount || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-secondary font-bold uppercase tracking-tighter opacity-60">Total Paid</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-surface-container">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-surface-container rounded-lg text-primary"><Calendar className="w-4 h-4" /></div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest opacity-60">Date</span>
                        <span className="text-sm font-semibold">{booking.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-surface-container rounded-lg text-primary"><Clock className="w-4 h-4" /></div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest opacity-60">Time</span>
                        <span className="text-sm font-semibold">{booking.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-surface-container rounded-lg text-primary"><MapPin className="w-4 h-4" /></div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest opacity-60">Location</span>
                        <span className="text-sm font-semibold truncate max-w-[150px]">{booking.turfId?.subLocation}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto shrink-0 flex flex-col gap-2">
                  <button
                    onClick={() => navigate(`/turf/${booking.turfId?._id}`)}
                    className="px-6 py-3 rounded-full border border-surface-container font-bold text-sm hover:bg-surface-container transition-all active:scale-95 cursor-pointer"
                  >Details</button>
                  <button
                    onClick={() => {
                      const lat = booking.turfId?.coordinates?.lat;
                      const lng = booking.turfId?.coordinates?.lng;
                      if (lat && lng) window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                      else window.open(`https://www.google.com/maps/search/${encodeURIComponent(booking.turfId?.name || 'turf')}`, '_blank');
                    }}
                    className="px-6 py-3 rounded-full bg-primary text-white font-bold text-sm shadow-md hover:brightness-110 transition-all active:scale-95 cursor-pointer"
                  >Directions</button>
                  {booking.status === 'Confirmed' && (() => {
                    // Parse date like "FRI 25 APR" or "2026-04-25"
                    const friendlyDate = booking.date?.match(/(\d{1,2})\s+([A-Z]{3})/i);
                    let resolvedDate: string;
                    if (!booking.date || booking.date === 'Today') {
                      resolvedDate = new Date().toISOString().split('T')[0];
                    } else if (friendlyDate) {
                      const months: Record<string, string> = {
                        JAN:'01',FEB:'02',MAR:'03',APR:'04',MAY:'05',JUN:'06',
                        JUL:'07',AUG:'08',SEP:'09',OCT:'10',NOV:'11',DEC:'12'
                      };
                      resolvedDate = `${new Date().getFullYear()}-${months[friendlyDate[2].toUpperCase()] || '01'}-${friendlyDate[1].padStart(2,'0')}`;
                    } else {
                      resolvedDate = booking.date;
                    }

                    // Parse time like "10:00 PM" or "10:00 PM - 11:00 PM"
                    const timeParts = (booking.time || '').split(' - ');
                    const startTimeStr = timeParts[0].trim();
                    const endTimeStr = (timeParts[1] || timeParts[0]).trim(); // fallback to start if no range
                    
                    const h12 = startTimeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                    const h24 = startTimeStr.match(/^(\d{1,2}):(\d{2})$/);
                    let turfStart: Date;
                    if (h12) {
                      let hr = parseInt(h12[1]);
                      if (h12[3].toUpperCase() === 'PM' && hr !== 12) hr += 12;
                      if (h12[3].toUpperCase() === 'AM' && hr === 12) hr = 0;
                      turfStart = new Date(`${resolvedDate}T${String(hr).padStart(2,'0')}:${h12[2]}:00+05:30`);
                    } else if (h24) {
                      turfStart = new Date(`${resolvedDate}T${h24[1].padStart(2,'0')}:${h24[2]}:00+05:30`);
                    } else {
                      turfStart = new Date(NaN);
                    }

                    const h12End = endTimeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                    const h24End = endTimeStr.match(/^(\d{1,2}):(\d{2})$/);
                    let turfEnd: Date;
                    if (h12End) {
                      let hr = parseInt(h12End[1]);
                      if (h12End[3].toUpperCase() === 'PM' && hr !== 12) hr += 12;
                      if (h12End[3].toUpperCase() === 'AM' && hr === 12) hr = 0;
                      turfEnd = new Date(`${resolvedDate}T${String(hr).padStart(2,'0')}:${h12End[2]}:00+05:30`);
                    } else if (h24End) {
                      turfEnd = new Date(`${resolvedDate}T${h24End[1].padStart(2,'0')}:${h24End[2]}:00+05:30`);
                    } else {
                      turfEnd = new Date(NaN); // Fallback
                    }

                    const hoursLeft = isNaN(turfStart.getTime())
                      ? 999
                      : (turfStart.getTime() - Date.now()) / (1000 * 60 * 60);

                    const isFinished = !isNaN(turfEnd.getTime()) && Date.now() > turfEnd.getTime();

                    if (isFinished && !booking.isReviewed) {
                      return (
                        <button
                          onClick={() => setReviewingBooking(booking)}
                          className="px-6 py-3 rounded-full bg-primary text-white font-bold text-sm hover:shadow-lg hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Star className="w-4 h-4 fill-white" /> Leave a Review
                        </button>
                      );
                    }
                    
                    if (isFinished && booking.isReviewed) {
                      return (
                        <div className="px-6 py-3 rounded-full bg-surface-container/50 text-secondary font-bold text-sm cursor-default select-none flex items-center justify-center gap-2 border border-surface-container">
                          <CheckCircle2 className="w-4 h-4 text-primary" /> Reviewed
                        </div>
                      );
                    }

                    if (hoursLeft >= 0 && hoursLeft < 6) {
                      return (
                        <motion.button
                          animate={shakingId === booking._id ? { x: [0, -8, 8, -6, 6, -4, 4, 0] } : {}}
                          transition={{ duration: 0.4 }}
                          onClick={() => {
                            setShakingId(booking._id);
                            setTimeout(() => setShakingId(null), 500);
                          }}
                          className="px-6 py-3 rounded-full border border-surface-container text-secondary/40 font-bold text-sm cursor-not-allowed select-none"
                          title={hoursLeft <= 0 ? "This booking has already passed" : "Cancellation not allowed within 6 hours of start"}
                        >Cancel</motion.button>
                      );
                    }

                    return (
                      <button
                        onClick={() => setConfirmId(booking._id)}
                        className="px-6 py-3 rounded-full border border-rose-200 text-rose-600 font-bold text-sm hover:bg-rose-50 transition-all active:scale-95 cursor-pointer"
                      >Cancel</button>
                    );
                  })()}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewingBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setReviewingBooking(null)}
                className="absolute top-6 right-6 text-secondary hover:text-on-background transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
              
              <div className="flex flex-col gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-on-background">Rate your experience</h3>
                  <p className="text-secondary text-sm mt-2">How was your match at <strong>{reviewingBooking.turfId?.name}</strong>?</p>
                </div>

                <form onSubmit={handleReviewSubmit} className="space-y-6">
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star className={`w-10 h-10 ${star <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-surface-container'}`} />
                      </button>
                    ))}
                  </div>
                  
                  <div>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share details of your experience at this turf..."
                      className="w-full h-32 px-4 py-3 rounded-2xl bg-surface-container/30 border border-surface-container focus:outline-none focus:border-primary resize-none text-sm"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview || !reviewText.trim()}
                    className="w-full py-4 rounded-full bg-primary text-white font-bold tracking-widest uppercase text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingReview ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Publish Review"
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
