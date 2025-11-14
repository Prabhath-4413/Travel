import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { type Destination } from "../lib/api";
import BookingForm from "../components/booking/BookingForm";
import EmailConfirmationModal from "../components/booking/EmailConfirmationModal";

interface PendingBooking {
  destinations: Destination[];
  userId: number;
  timestamp: number;
}

export default function StartBookingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(
    null,
  );
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  useEffect(() => {
    // Load pending booking from localStorage
    const stored = localStorage.getItem("pendingBooking");
    if (stored) {
      try {
        const booking = JSON.parse(stored);
        // Check if booking is not too old (24 hours)
        if (Date.now() - booking.timestamp < 24 * 60 * 60 * 1000) {
          setPendingBooking(booking);
        } else {
          localStorage.removeItem("pendingBooking");
        }
      } catch (error) {
        console.error("Error parsing pending booking:", error);
        localStorage.removeItem("pendingBooking");
      }
    }
  }, []);

  const handleStartBooking = () => {
    setShowBookingForm(true);
  };

  const handleBookingSuccess = (result: any) => {
    setBookingResult(result);
    setShowBookingForm(false);
    setShowEmailConfirmation(true);
    // Clear pending booking
    localStorage.removeItem("pendingBooking");
  };

  const handleBookingClose = () => {
    setShowBookingForm(false);
  };

  const handleEmailConfirmationClose = () => {
    setShowEmailConfirmation(false);
    // Navigate back to dashboard
    navigate("/dashboard");
  };

  if (!pendingBooking) {
    return (
      <div className="min-h-screen bg-[#0e1512] flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Booking Found</h2>
          <p className="text-white/70 mb-6">
            It looks like you don't have any pending bookings. Please select
            destinations first.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:scale-105 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0e1512] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10 bg-[#0e1512]/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              ✈
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                SuiteSavvy
              </span>
              <span className="text-xs text-white/60 font-medium">
                Start Booking
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-4">Ready to Book Your Trip?</h1>
          <p className="text-white/70 text-lg">
            Review your selected destinations and complete your booking details
            below.
          </p>
        </motion.div>

        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-6 mb-6"
        >
          <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Name</label>
              <p className="text-white font-medium">{user?.name}</p>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Email</label>
              <p className="text-white font-medium">{user?.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Selected Destinations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-6 mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">
            Selected Destinations ({pendingBooking.destinations.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingBooking.destinations.map((destination, index) => (
              <motion.div
                key={destination.destinationId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      destination.imageUrl ||
                      `https://via.placeholder.com/60x60?text=${destination.name}`
                    }
                    alt={destination.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-white">
                      {destination.name}
                    </h3>
                    {destination.country && (
                      <p className="text-sm text-white/70">
                        {destination.country}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-400">
                    ₹{destination.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/70">per night</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Total Price Preview */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-white/70">
                Estimated Total (base price):
              </span>
              <span className="text-2xl font-bold text-green-400">
                ₹
                {pendingBooking.destinations
                  .reduce((sum, dest) => sum + dest.price, 0)
                  .toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-white/60 mt-1">
              * Final price will be calculated based on number of guests and
              nights
            </p>
          </div>
        </motion.div>

        {/* Start Booking Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <button
            onClick={handleStartBooking}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-green-500/50 transition-all hover:scale-105"
          >
            Start Booking Process
          </button>
          <p className="text-white/70 mt-4 text-sm">
            You'll be able to customize dates, number of guests, and complete
            payment
          </p>
        </motion.div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <BookingForm
          destinations={pendingBooking.destinations}
          onClose={handleBookingClose}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Email Confirmation Modal */}
      {showEmailConfirmation && bookingResult && (
        <EmailConfirmationModal
          booking={bookingResult}
          onClose={handleEmailConfirmationClose}
        />
      )}
    </div>
  );
}
