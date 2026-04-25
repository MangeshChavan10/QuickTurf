import { Header, Footer } from "../components/Navigation";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

export default function PaymentStatus() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const orderId = searchParams.get("orderId");

  const isSuccess = status === "success";

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      <Header />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-20 md:mt-24">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-surface-container shadow-sm text-center flex flex-col items-center space-y-6">
          {isSuccess ? (
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          )}

          <div>
            <h1 className="text-3xl font-serif mb-2">
              {isSuccess ? "Payment Successful" : "Payment Failed"}
            </h1>
            <p className="text-secondary">
              {isSuccess 
                ? "Your turf booking has been confirmed! We have sent a confirmation to your email."
                : "Unfortunately, your payment could not be processed. Please try again or use a different payment method."
              }
            </p>
          </div>

          <div className="w-full bg-surface-container/30 rounded-2xl p-4 flex justify-between items-center text-sm font-medium">
            <span className="text-secondary">Order ID</span>
            <span className="font-mono">{orderId || "N/A"}</span>
          </div>

          <Link
            to={isSuccess ? "/bookings" : "/explore"}
            className="w-full py-4 bg-primary text-white rounded-full font-bold tracking-wide hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mt-4"
          >
            {isSuccess ? "View My Bookings" : "Return to Explore"}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
