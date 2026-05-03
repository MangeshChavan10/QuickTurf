import { apiFetch } from "../lib/api";
import { Header, Footer } from "../components/Navigation";
import { CreditCard, Lock, ChevronLeft, Star, Verified, Smartphone, QrCode, CheckCircle2, Loader2, IndianRupee } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";

type PaymentMethod = "card" | "upi";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const turf = location.state?.turf;
  const selectedSlot = location.state?.selectedSlot;
  const selectedDate = location.state?.selectedDate || "Today";

  const isNightSlot = (timeStr: string) => {
    if (!timeStr) return false;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return false;
    let [_, hours, minutes, ampm] = match;
    let h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
    return (h * 60 + m) >= (18 * 60 + 30); // >= 18:30 (6:30 PM)
  };

  const slotsList = selectedSlot ? selectedSlot.split(',').map((s: string) => s.trim()) : [];
  const numSlots = slotsList.length || 1;
  const basePrice = (turf?.price || 0) * numSlots;
  const platformFee = 20; // flat fee, charged once regardless of slots
  const totalAmount = basePrice + platformFee;

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!turf) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-serif mb-4">No Session Selected</h1>
        <button onClick={() => navigate('/explore')} className="px-8 py-3 bg-primary text-white rounded-full">Go to Explore</button>
      </div>
    );
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      const response = await apiFetch("/api/create-payment-intent", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: totalAmount,
          turfId: turf._id || turf.id,
          date: selectedDate,
          time: selectedSlot,
        })
      });
      const data = await response.json();

      if (data.success) {
        const finalizeBooking = async (rzpPayload: any = null) => {
          await apiFetch("/api/verify-payment", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              orderId: data.orderId,
              amount: data.amount,
              turfId: turf._id || turf.id,
              date: selectedDate,
              time: selectedSlot,
              rzpPayload
            })
          });
          setIsProcessing(false);
          setIsSuccess(true);
        };

        if (data.isSimulation) {
          setTimeout(finalizeBooking, 1500);
          return;
        }

        // Real Razorpay Integration
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: "INR",
          name: "QuickTurf",
          description: `Booking for ${turf.name}`,
          order_id: data.orderId,
          handler: finalizeBooking,
          prefill: {
            name: user?.name || "Customer",
            email: user?.email || "",
            contact: "9999999999"
          },
          theme: { color: "#00A36C" },
          modal: {
            ondismiss: () => {
              // User closed the Razorpay modal — unblock UI
              setIsProcessing(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setIsProcessing(false);
      } else {
        throw new Error(data.error || "Payment failed");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setIsProcessing(false);
      alert(error.message || "Payment failed. Please try again.");
    }
  };

  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white p-12 rounded-[32px]  border border-surface-container max-w-md w-full"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-black mb-4">Booking Confirmed!</h1>
          <p className="text-secondary font-bold mb-10 leading-relaxed">
            Your turf at <span className="text-black font-bold">{turf.name}</span> has been secured. We've sent the booking details to your email.
          </p>
          <button
            onClick={() => navigate('/bookings')}
            className="w-full py-4 bg-primary text-white font-bold rounded-full  hover:brightness-110 active:scale-95 transition-all"
          >
            View My Bookings
          </button>
        </motion.div>
      </div>
    );
  }

  const formatSlotRange = (slotsStr: string) => {
    if (!slotsStr) return "";
    const slots = slotsStr.split(',').map(s => s.trim()).sort((a, b) => {
      const to24h = (t: string) => {
        const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!m) return 0;
        let hr = parseInt(m[1]);
        if (m[3].toUpperCase() === 'PM' && hr !== 12) hr += 12;
        if (m[3].toUpperCase() === 'AM' && hr === 12) hr = 0;
        return hr * 60 + parseInt(m[2]);
      };
      return to24h(a) - to24h(b);
    });
    
    if (slots.length <= 1) return slotsStr;
    
    const first = slots[0];
    const last = slots[slots.length - 1];
    
    const formatTime = (t: string) => {
      const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!m) return t;
      return parseInt(m[1]) + " " + m[3].toUpperCase();
    };
    
    const lastMatch = last.match(/(\d+):(\d+)\s*(AM|PM)/i);
    let nextH = parseInt(lastMatch?.[1] || "0") + 1;
    let nextAmpm = lastMatch?.[3]?.toUpperCase() || "";
    if (nextH === 12) {
      nextAmpm = nextAmpm === 'AM' ? 'PM' : 'AM';
    } else if (nextH > 12) {
      nextH = 1;
    }
    
    return `${formatTime(first)} to ${nextH} ${nextAmpm}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header simplified />
      
      <main className="pt-28 md:pt-32 pb-24 max-w-[640px] mx-auto px-4 md:px-6 relative">
        {isProcessing && (
          <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="font-serif font-bold text-xl text-black animate-pulse">Processing your transaction...</p>
            <p className="text-secondary text-sm mt-2">Please do not refresh the page</p>
          </div>
        )}

        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-3 hover:bg-surface-container rounded-full transition-all border border-transparent hover:border-surface-container active:scale-90">
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </button>
          <h1 className="text-3xl md:text-4xl font-serif text-black">Confirm Booking</h1>
        </div>

        {/* Single unified card */}
        <div className="bg-white border border-surface-container rounded-[32px] overflow-hidden">

          {/* Almost there — top of card */}
          <div className="p-6 md:p-8 space-y-5 border-b border-surface-container">
            <div>
              <h2 className="text-xl md:text-2xl font-serif mb-1">Almost there!</h2>
              <p className="text-secondary text-sm leading-relaxed">Review your match details below and proceed to securely pay and lock your slot.</p>
            </div>
            <div className="flex items-start gap-4 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
              <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-black">Secure Payment</h4>
                <p className="text-xs text-secondary mt-1">Processed by Razorpay via UPI, Card, Netbanking, or Wallets.</p>
              </div>
            </div>
          </div>

          {/* Turf image */}
          <div className="relative h-48 md:h-56">
            <img className="w-full h-full object-cover" src={turf.image} alt={turf.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="font-serif font-bold text-xl md:text-2xl">{turf.name}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="text-xs md:text-sm font-bold">{turf.rating} <span className="opacity-70 font-normal ml-1">({turf.reviewCount} total)</span></span>
              </div>
            </div>
          </div>

          {/* Match details + pricing + pay */}
          <div className="p-6 md:p-8 space-y-6">

            {/* Match Details */}
            <div>
              <h4 className="font-serif font-bold text-lg md:text-xl text-black mb-4">Match Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-secondary font-medium">Session</span>
                  <span className="font-bold text-primary">{formatSlotRange(selectedSlot)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-secondary font-medium">Date</span>
                  <span className="font-bold text-black">{selectedDate}</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-surface-container w-full"></div>

            {/* Investment */}
            <div>
              <h4 className="font-serif font-bold text-lg md:text-xl text-black mb-4">Price breakdown</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-secondary">
                  <span className="font-medium font-sans text-sm md:text-base">
                    Session Fee {numSlots > 1 ? `(${numSlots} slots × ₹${(turf.price || 0).toLocaleString()})` : ''}
                  </span>
                  <span className="font-bold text-black">₹{basePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-secondary">
                  <span className="font-medium font-sans text-sm md:text-base">Platform Maintenance</span>
                  <span className="font-bold text-black">₹{platformFee.toLocaleString()}</span>
                </div>
              </div>
              <div className="pt-5 border-t border-surface-container mt-4">
                <div className="flex justify-between text-xl md:text-2xl font-serif font-bold text-black">
                  <span>Total Cost</span>
                  <span className="text-primary tracking-tighter">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Assurance */}
            <div className="flex gap-4 p-5 bg-primary-container rounded-[24px] border border-primary/20 group hover:bg-primary-container/80 transition-colors">
              <Verified className="text-primary w-6 h-6 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <div className="space-y-1">
                <p className="font-bold text-primary text-xs md:text-sm">QuickTurf Assurance</p>
                <p className="text-[10px] md:text-xs text-secondary leading-relaxed font-bold">
                  If the facility is inaccessible, we provide an immediate 100% credit or refund. Verified by local staff.
                </p>
              </div>
            </div>

            {/* Pay button */}
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full py-5 bg-accent text-white font-bold text-lg rounded-full hover:brightness-110 active:scale-95 transition-all font-serif flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Proceed to Pay ₹{totalAmount.toLocaleString()}
            </button>

          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

