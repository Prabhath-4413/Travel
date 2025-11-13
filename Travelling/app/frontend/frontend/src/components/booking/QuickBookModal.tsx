import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { type Destination } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";

interface QuickBookModalProps {
  destination?: Destination;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickBookModal({
  destination,
  isOpen,
  onClose,
}: QuickBookModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookingType, setBookingType] = useState<"single" | "multiple" | null>(
    null,
  );
  const [selectedDestinations, setSelectedDestinations] = useState<
    Destination[]
  >([]);

  const handleSingleBooking = () => {
    if (destination) {
      // Store booking data in localStorage
      const bookingData = {
        destinations: [destination],
        userId: user?.userId,
        timestamp: Date.now(),
      };
      localStorage.setItem("pendingBooking", JSON.stringify(bookingData));

      // Navigate to start booking page
      navigate("/start-booking");
      onClose();
    }
  };

  const handleMultipleBooking = () => {
    // Navigate to destination selection
    navigate("/destinations");
    onClose();
  };

  const resetModal = () => {
    setBookingType(null);
    setSelectedDestinations([]);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Quick Book</h2>
                <button
                  onClick={handleClose}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              {destination && (
                <p className="text-white/80 mt-2">
                  How would you like to book for{" "}
                  <span className="font-semibold">{destination.name}</span>?
                </p>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {!bookingType ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setBookingType("single")}
                    className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-left transition-all hover:border-white/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-blue-400 font-bold">1</span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">
                          Book This Destination
                        </h3>
                        <p className="text-white/70 text-sm">
                          Book only {destination?.name}
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setBookingType("multiple")}
                    className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-left transition-all hover:border-white/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="text-purple-400 font-bold">∞</span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">
                          Book Multiple Destinations
                        </h3>
                        <p className="text-white/70 text-sm">
                          Select multiple destinations to book together
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              ) : bookingType === "single" ? (
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/20">
                    <h3 className="text-white font-semibold mb-2">
                      Selected Destination
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-white">{destination?.name}</span>
                      <span className="text-blue-400 font-semibold">
                        ₹{destination?.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={resetModal}
                      className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSingleBooking}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold rounded-lg hover:scale-105 transition-all"
                    >
                      Start Booking
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/20">
                    <h3 className="text-white font-semibold mb-2">
                      Multiple Destinations
                    </h3>
                    <p className="text-white/70 text-sm">
                      You'll be taken to the destinations page to select
                      multiple locations for your trip.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={resetModal}
                      className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleMultipleBooking}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold rounded-lg hover:scale-105 transition-all"
                    >
                      Select Destinations
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
