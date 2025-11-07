import { motion } from "framer-motion";

interface EmailConfirmationModalProps {
  booking: {
    bookingId: number;
    total?: number;
    guests?: number;
    nights?: number;
    startDate?: string;
    endDate?: string;
    destinations?: string[];
    message?: string;
  };
  context?: "booking" | "cancellation";
  onClose: () => void;
}

export default function EmailConfirmationModal({
  booking,
  onClose,
  context = "booking",
}: EmailConfirmationModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-6"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-[#0e1512] rounded-2xl border border-white/20 p-8 max-w-md w-full"
      >
        <div className="text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <motion.svg
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="w-8 h-8 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </motion.svg>
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-white mb-4"
          >
            {context === "booking"
              ? "Booking Confirmed!"
              : "Cancellation Request Submitted"}
          </motion.h2>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 rounded-lg p-4 mb-6"
          >
            <div className="text-white/70 text-sm mb-2">Reference</div>
            <div className="text-xl font-bold text-blue-400 mb-4">
              #{booking.bookingId}
            </div>
            {context === "booking" && booking.total !== undefined && (
              <>
                <div className="text-white/70 text-sm mb-2">Total Amount</div>
                <div className="text-2xl font-bold text-green-400">
                  ₹{booking.total.toLocaleString()}
                </div>
              </>
            )}
            {context === "booking"
              ? booking.startDate &&
                booking.endDate && (
                  <div className="grid grid-cols-2 gap-4 mt-4 text-left">
                    <div>
                      <div className="text-white/70 text-sm">Start Date</div>
                      <div className="text-white font-medium">
                        {new Date(booking.startDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/70 text-sm">End Date</div>
                      <div className="text-white font-medium">
                        {new Date(booking.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/70 text-sm">Guests</div>
                      <div className="text-white font-medium">
                        {booking.guests}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/70 text-sm">Nights</div>
                      <div className="text-white font-medium">
                        {booking.nights}
                      </div>
                    </div>
                    {booking.destinations &&
                      booking.destinations.length > 0 && (
                        <div className="col-span-2">
                          <div className="text-white/70 text-sm">
                            Destinations
                          </div>
                          <div className="text-white font-medium">
                            {booking.destinations.join(", ")}
                          </div>
                        </div>
                      )}
                  </div>
                )
              : booking.message && (
                  <p className="text-white/70 text-sm leading-relaxed">
                    {booking.message}
                  </p>
                )}
          </motion.div>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/80 mb-6"
          >
            {context === "booking"
              ? "Your booking has been confirmed! A confirmation email has been sent to your registered email address with all the details."
              : "Your cancellation request has been submitted. Our team will review it and notify you via email once a decision is made."}
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
            >
              Continue Exploring
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
