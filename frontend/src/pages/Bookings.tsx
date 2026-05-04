import { apiFetch } from "../lib/api";
import { Header, Footer } from "../components/Navigation";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Clock, MapPin, ChevronRight, ChevronDown, IndianRupee, CheckCircle2, XCircle, AlertTriangle, Star, MessageSquare, Share2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Bookings() {
  const { user, token } = useAuth();
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

    apiFetch(`/api/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setMyBookings(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [user, token, navigate]);

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
              className="bg-white rounded-[32px] p-8 max-w-md w-full "
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-black">Cancel this booking?</h3>
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
          <h1 className="text-4xl md:text-5xl font-serif text-black mb-4">My Bookings</h1>
          <p className="text-secondary font-bold italic opacity-80">Your upcoming sessions and match history.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
          {myBookings.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-surface-container">
              <p className="text-secondary font-bold">No bookings yet. Time to hit the turf!</p>
            </div>
          ) : (
            myBookings.map((booking, i) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`bg-white rounded-[32px] overflow-hidden flex flex-col  hover:shadow-md transition-all group ${booking.status === 'Cancelled' ? 'opacity-60' : ''}`}
              >
                {/* Hero Section */}
                <div className="relative w-full h-[200px] bg-surface-container overflow-hidden shrink-0">
                  <img src={booking.turfId?.image} alt={booking.turfId?.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  
                  {/* Top left badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <div className={`w-2 h-2 rounded-full ${booking.status === 'Confirmed' ? 'bg-green-400' : booking.status === 'Cancelled' ? 'bg-rose-400' : 'bg-amber-400'}`}></div>
                    <span className="text-white text-[10px] font-bold uppercase tracking-[0.2em]">{booking.status === 'Confirmed' ? 'Booking Confirmed' : booking.status}</span>
                  </div>

                  {/* Top right share button */}
                  <button onClick={() => {
                      const lat = booking.turfId?.coordinates?.lat;
                      const lng = booking.turfId?.coordinates?.lng;
                      const locationUrl = (lat && lng) ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : `https://www.google.com/maps/search/${encodeURIComponent(booking.turfId?.name || 'turf')}`;
                      const shareText = `Hey! I booked a slot at ${booking.turfId?.name} on ${booking.date} at ${booking.time}.\n\nLocation: ${locationUrl}`;
                      if (navigator.share) {
                        navigator.share({ title: 'QuickTurf Booking', text: shareText });
                      } else {
                        navigator.clipboard.writeText(shareText);
                        alert("Booking details copied to clipboard!");
                      }
                    }} 
                    className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/30 transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-white" />
                  </button>

                  {/* Bottom Hero Info */}
                  <div className="absolute bottom-5 left-5 right-5">
                    <h2 className="text-[22px] font-bold text-white mb-1 leading-tight">{booking.turfId?.name}</h2>
                    <div className="flex items-center gap-1.5 text-white/80">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-sm font-bold">{booking.turfId?.subLocation || 'Solapur, Maharashtra'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex flex-col gap-5 flex-1">
                  {/* Two tiles: Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-[10px] p-4 flex flex-col">
                      <span className="text-sm font-bold text-black">Date — {booking.date}</span>
                      <span className="text-xs text-secondary mt-1 font-bold">Your play day</span>
                    </div>
                    <div className="bg-white rounded-[10px] p-4 flex flex-col">
                      <span className="text-sm font-bold text-black">Time — {booking.time}</span>
                      <span className="text-xs text-secondary mt-1 font-bold">Your slot</span>
                    </div>
                  </div>

                  <div className="h-px w-full bg-white"></div>

                  {/* Total Paid Row */}
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <div className="text-[28px] font-bold text-black leading-none mb-1">₹{(booking.amount || 0).toLocaleString()}</div>
                      <div className="text-xs text-secondary font-bold">Payment successful</div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="font-mono text-[10px] text-secondary font-bold uppercase tracking-widest bg-white px-2 py-1 rounded">ID: {booking.orderId}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  {(() => {
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

                    const timeParts = (booking.time || '').split(' - ');
                    const startTimeStr = timeParts[0].trim();
                    const endTimeStr = (timeParts[1] || timeParts[0]).trim();
                    
                    const h12 = startTimeStr.match(/(\d{1,2})\s*:\s*(\d{2})\s*(AM|PM)/i);
                    const h24 = startTimeStr.match(/^(\d{1,2})\s*:\s*(\d{2})$/);
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

                    const h12End = endTimeStr.match(/(\d{1,2})\s*:\s*(\d{2})\s*(AM|PM)/i);
                    const h24End = endTimeStr.match(/^(\d{1,2})\s*:\s*(\d{2})$/);
                    let turfEnd: Date;
                    if (h12End) {
                      let hr = parseInt(h12End[1]);
                      if (h12End[3].toUpperCase() === 'PM' && hr !== 12) hr += 12;
                      if (h12End[3].toUpperCase() === 'AM' && hr === 12) hr = 0;
                      turfEnd = new Date(`${resolvedDate}T${String(hr).padStart(2,'0')}:${h12End[2]}:00+05:30`);
                    } else if (h24End) {
                      turfEnd = new Date(`${resolvedDate}T${h24End[1].padStart(2,'0')}:${h24End[2]}:00+05:30`);
                    } else {
                      turfEnd = new Date(NaN);
                    }

                    const hoursLeft = isNaN(turfStart.getTime())
                      ? 999
                      : (turfStart.getTime() - Date.now()) / (1000 * 60 * 60);

                    const isFinished = !isNaN(turfEnd.getTime()) && Date.now() > turfEnd.getTime();
                    
                    const lat = booking.turfId?.coordinates?.lat;
                    const lng = booking.turfId?.coordinates?.lng;
                    const mapsUrl = (lat && lng) ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : `https://www.google.com/maps/search/${encodeURIComponent(booking.turfId?.name || 'turf')}`;
                    
                    if (booking.status === 'Cancelled') {
                      return (
                        <div className="grid grid-cols-1 mt-2">
                          <button disabled className="py-4 bg-white text-secondary font-bold text-sm rounded-[10px] opacity-60">Cancelled</button>
                        </div>
                      );
                    }

                    if (booking.status === 'Pending') {
                      return (
                        <div className="flex flex-col gap-3 mt-2">
                          <div className="text-sm font-bold text-amber-600 bg-amber-50 p-3 rounded-[10px] text-center border border-amber-200 flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4" />
                            Time remaining to pay: <PendingCountdown createdAt={booking.createdAt} onExpire={() => {
                              if (booking.status !== 'Cancelled') {
                                handleCancel(booking._id);
                              }
                            }} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleCancel(booking._id)} disabled={cancellingId === booking._id} className="py-4 bg-rose-50 text-rose-600 font-bold text-sm rounded-[10px] hover:bg-rose-100 transition-colors">
                              {cancellingId === booking._id ? "Cancelling..." : "Cancel"}
                            </button>
                            <button onClick={() => navigate('/checkout', { state: { turf: booking.turfId, selectedSlot: booking.time, selectedDate: booking.date } })} className="py-4 bg-primary text-white font-bold text-sm rounded-[10px] hover:brightness-110 transition-colors">
                              Proceed to Payment
                            </button>
                          </div>
                        </div>
                      );
                    }

                    if (isFinished && !booking.isReviewed) {
                      return (
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <button onClick={() => window.open(mapsUrl, '_blank')} className="py-4 bg-white text-black font-bold text-sm rounded-[10px] hover:bg-surface-container/50 transition-colors">Get directions</button>
                          <button onClick={() => setReviewingBooking(booking)} className="py-4 bg-[#1B3626] text-[#4ade80] font-bold text-sm rounded-[10px] hover:brightness-110 transition-colors">Leave a review</button>
                        </div>
                      );
                    }

                    if (isFinished && booking.isReviewed) {
                       return (
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <button onClick={() => window.open(mapsUrl, '_blank')} className="py-4 bg-white text-black font-bold text-sm rounded-[10px] hover:bg-surface-container/50 transition-colors">Get directions</button>
                          <button disabled className="py-4 bg-white text-secondary font-bold text-sm rounded-[10px] flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Reviewed</button>
                        </div>
                       );
                    }

                    if (hoursLeft >= 0 && hoursLeft < 6) {
                      return (
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <button onClick={() => window.open(mapsUrl, '_blank')} className="py-4 bg-white text-black font-bold text-sm rounded-[10px] hover:bg-surface-container/50 transition-colors">Get directions</button>
                          <motion.button 
                            animate={shakingId === booking._id ? { x: [0, -8, 8, -6, 6, -4, 4, 0] } : {}}
                            transition={{ duration: 0.4 }}
                            onClick={() => { setShakingId(booking._id); setTimeout(() => setShakingId(null), 500); }}
                            className="py-4 bg-surface-container/20 text-secondary/40 font-bold text-sm rounded-[10px] cursor-not-allowed"
                            title={hoursLeft <= 0 ? "This booking has already passed" : "Cancellation not allowed within 6 hours of start"}
                          >Cancel Booking</motion.button>
                        </div>
                      );
                    }

                    // Default Confirmed state (can cancel)
                    return (
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <button onClick={() => window.open(mapsUrl, '_blank')} className="py-4 bg-white text-black font-bold text-sm rounded-[10px] hover:bg-surface-container/50 transition-colors">Get directions</button>
                        <button onClick={() => setConfirmId(booking._id)} className="py-4 bg-rose-50 text-rose-600 font-bold text-sm rounded-[10px] hover:bg-rose-100 transition-colors">Cancel Booking</button>
                      </div>
                    );
                  })()}

                  {/* Share row */}
                  {(() => {
                    const lat = booking.turfId?.coordinates?.lat;
                    const lng = booking.turfId?.coordinates?.lng;
                    const locationUrl = (lat && lng) ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : `https://www.google.com/maps/search/${encodeURIComponent(booking.turfId?.name || 'turf')}`;
                    return (
                      <a 
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hey! I booked a slot at ${booking.turfId?.name || 'the turf'} on ${booking.date} at ${booking.time}. See you there! ⚽\n\nLocation: ${locationUrl}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="mt-1 w-full flex items-center justify-between p-4 bg-[#25D366]/5 hover:bg-[#25D366]/10 rounded-[12px] border border-[#25D366]/20 transition-colors cursor-pointer group/share"
                      >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shrink-0 ">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </div>
                      <div>
                        <div className="font-medium text-[#128C7E] text-sm">Share with your team</div>
                        <div className="text-[11px] text-[#128C7E]/70 font-medium uppercase tracking-wide mt-0.5">Send booking details on WhatsApp</div>
                      </div>
                    </div>
                    <ChevronDown className="w-5 h-5 text-[#128C7E] -rotate-90 group-hover/share:translate-x-1 transition-transform" />
                  </a>
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
                  <h3 className="text-2xl font-serif font-bold text-black">Rate your experience</h3>
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
                      className="w-full h-32 px-4 py-3 rounded-2xl bg-white border border-surface-container focus:outline-none focus:border-primary resize-none text-sm"
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

export function PendingCountdown({ createdAt, onExpire }: { createdAt: string, onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const expiresAt = new Date(createdAt).getTime() + 5 * 60 * 1000;
    return Math.max(0, expiresAt - Date.now());
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const expiresAt = new Date(createdAt).getTime() + 5 * 60 * 1000;
      const left = Math.max(0, expiresAt - Date.now());
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt, onExpire]);

  if (timeLeft <= 0) return <span>Expired</span>;

  const mins = Math.floor(timeLeft / 60000);
  const secs = Math.floor((timeLeft % 60000) / 1000);
  return <span>{mins}:{secs.toString().padStart(2, '0')}</span>;
}
