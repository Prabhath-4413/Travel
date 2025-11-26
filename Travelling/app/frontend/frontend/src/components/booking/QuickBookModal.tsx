import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;
    const body = document.body;
    const originalOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleSingleBooking = () => {
    if (!destination) return;
    const bookingData = {
      destinations: [destination],
      userId: user?.userId,
      timestamp: Date.now(),
    };
    localStorage.setItem("pendingBooking", JSON.stringify(bookingData));
    navigate("/start-booking");
    onClose();
  };

  const handleMultipleBooking = () => {
    navigate("/destinations");
    onClose();
  };

  const resetModal = () => {
    setBookingType(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const formattedDestinationPrice = destination
    ? destination.price.toLocaleString()
    : null;

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-xl"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-[32px] border border-white/15 bg-gradient-to-br from-[#04070c] via-[#0a141e] to-[#132433] shadow-[0_25px_80px_rgba(0,0,0,0.85)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-white/5 px-6 py-5 backdrop-blur-lg">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                  Concierge Action
                </p>
                <h2 className="text-2xl font-semibold text-white">Quick Book</h2>
                {destination && (
                  <p className="mt-2 text-sm text-white/70">
                    Choose how you want to explore
                    <span className="font-semibold text-white"> {destination.name}</span>
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white transition hover:bg-white/20"
                type="button"
                aria-label="Close quick book"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              {!bookingType ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setBookingType("single")}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-left text-white transition duration-200 hover:-translate-y-1 hover:border-white/30 hover:bg-white/10"
                    type="button"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/30 to-blue-400/10 text-xl font-bold text-blue-300">
                        1
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Book this destination</h3>
                        <p className="text-sm text-white/70">
                          Instant booking for the highlighted experience
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setBookingType("multiple")}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-left text-white transition duration-200 hover:-translate-y-1 hover:border-white/30 hover:bg-white/10"
                    type="button"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-400/10 text-2xl font-bold text-purple-200">
                        ∞
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Build a multi-stop escape</h3>
                        <p className="text-sm text-white/70">
                          Mix destinations and craft a custom adventure
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              ) : bookingType === "single" ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white">
                    <div className="text-xs uppercase tracking-[0.35em] text-white/60">
                      Selected
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <p className="text-base font-semibold">{destination?.name}</p>
                        <p className="text-sm text-white/60">Solo booking flow</p>
                      </div>
                      <span className="text-2xl font-semibold text-blue-300">
                        {formattedDestinationPrice ? `₹${formattedDestinationPrice}` : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={resetModal}
                      className="flex-1 rounded-xl border border-white/15 px-4 py-3 text-white/80 transition hover:bg-white/10"
                      type="button"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSingleBooking}
                      className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-3 text-white font-semibold shadow-lg shadow-blue-500/30 transition hover:brightness-110"
                      type="button"
                    >
                      Start Booking
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white">
                    <div className="text-xs uppercase tracking-[0.35em] text-white/60">
                      Journey Builder
                    </div>
                    <p className="mt-2 text-sm text-white/70">
                      You will be guided to select multiple destinations, compare pricing, and visualize the full route before confirming.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={resetModal}
                      className="flex-1 rounded-xl border border-white/15 px-4 py-3 text-white/80 transition hover:bg-white/10"
                      type="button"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleMultipleBooking}
                      className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-3 text-white font-semibold shadow-lg shadow-purple-500/30 transition hover:brightness-110"
                      type="button"
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
    </AnimatePresence>,
    document.body,
  );
}
