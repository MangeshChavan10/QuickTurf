import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { AdminLayout } from "../../components/AdminLayout";
import { CalendarCheck, MapPin } from "lucide-react";

export default function AdminBookings() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/admin/bookings", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBookings(data);
        }
      } catch (err) {
        console.error("Failed to fetch bookings", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, [token]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-on-background">Booking History</h1>
          <p className="text-secondary mt-2">View and manage all upcoming and past bookings across your turfs.</p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-[32px] border border-surface-container h-64 animate-pulse"></div>
        ) : bookings.length === 0 ? (
          <div className="bg-white p-12 rounded-[32px] border border-surface-container text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4">
              <CalendarCheck className="w-10 h-10 text-secondary" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-on-background">No Bookings Yet</h3>
            <p className="text-secondary max-w-md mt-2">Once customers start booking your turfs, they will appear here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border border-surface-container overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container/50 border-b border-surface-container">
                    <th className="p-4 md:p-6 text-xs font-bold text-secondary uppercase tracking-wider">Date & Time</th>
                    <th className="p-4 md:p-6 text-xs font-bold text-secondary uppercase tracking-wider">Customer</th>
                    <th className="p-4 md:p-6 text-xs font-bold text-secondary uppercase tracking-wider">Turf ID</th>
                    <th className="p-4 md:p-6 text-xs font-bold text-secondary uppercase tracking-wider">Amount</th>
                    <th className="p-4 md:p-6 text-xs font-bold text-secondary uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-surface-container/20 transition-colors group">
                      <td className="p-4 md:p-6 whitespace-nowrap">
                        <div className="font-bold text-on-background">{booking.date}</div>
                        <div className="text-sm text-secondary">{booking.time}</div>
                      </td>
                      <td className="p-4 md:p-6 whitespace-nowrap">
                        <div className="font-medium text-on-background">{booking.userEmail}</div>
                      </td>
                      <td className="p-4 md:p-6 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-secondary font-medium">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate w-24 block" title={booking.turfId}>{booking.turfId}</span>
                        </div>
                      </td>
                      <td className="p-4 md:p-6 whitespace-nowrap">
                        <div className="font-bold text-on-background">₹{booking.amount}</div>
                        <div className="text-xs text-secondary opacity-60">ID: {booking.orderId.substring(0, 12)}...</div>
                      </td>
                      <td className="p-4 md:p-6 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          booking.status === 'Confirmed' ? 'bg-primary/10 text-primary' : 
                          booking.status === 'Pending' ? 'bg-orange-500/10 text-orange-600' : 
                          'bg-red-500/10 text-red-600'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
