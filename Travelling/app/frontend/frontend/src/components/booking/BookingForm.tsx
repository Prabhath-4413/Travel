import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { bookingsAPI, type Destination } from "../../lib/api";
import {
  calculateMultiDestinationPrice,
  type PricingResult,
} from "../../lib/pricing";

interface BookingFormProps {
  destinations: Destination[];
  onClose: () => void;
  onSuccess: (result: any) => void;
}

export default function BookingForm({
  destinations,
  onClose,
  onSuccess,
}: BookingFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    guests: 1,
    nights: 1,
    startDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      guests: 1,
      nights: 1,
      startDate: new Date().toISOString().slice(0, 10),
    }));
  }, [destinations]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, []);

  // Calculate dynamic pricing when form data changes
  useEffect(() => {
    const calculatePricing = async () => {
      if (destinations.length === 0) return;

      setPricingLoading(true);
      try {
        const result = await calculateMultiDestinationPrice(
          destinations,
          new Date(formData.startDate),
          formData.guests,
          formData.nights,
        );
        setPricing(result);
      } catch (error) {
        console.error("Failed to calculate pricing:", error);
        // Fallback to static pricing
        const staticPrice =
          destinations.reduce((sum, dest) => sum + dest.price, 0) *
          formData.guests *
          formData.nights;
        setPricing({
          basePrice: staticPrice,
          finalPrice: staticPrice,
          adjustments: {
            season: 0,
            weather: 0,
            demand: 0,
            weekend: 0,
            lastMinute: 0,
          },
          pricingReason: "Pricing calculation failed, showing base price",
        });
      } finally {
        setPricingLoading(false);
      }
    };

    calculatePricing();
  }, [destinations, formData.startDate, formData.guests, formData.nights]);

  const totalPrice = pricing?.finalPrice || 0;
  const formatPercent = (value: number) => {
    const rounded = Math.round(value);
    return `${rounded > 0 ? "+" : rounded < 0 ? "" : ""}${rounded}%`;
  };
  const adjustmentDetails = [
    {
      label: "Seasonal trend",
      value: pricing?.adjustments.season ?? 0,
    },
    {
      label: "Weather pattern",
      value: pricing?.adjustments.weather ?? 0,
    },
    {
      label: "Demand pulse",
      value: pricing?.adjustments.demand ?? 0,
    },
    {
      label: "Last-minute flex",
      value: pricing?.adjustments.lastMinute ?? 0,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await bookingsAPI.create({
        userId: user!.userId,
        destinationIds: destinations.map((d) => d.destinationId),
        guests: formData.guests,
        nights: formData.nights,
        startDate: new Date(formData.startDate),
      });

      // Calculate end date
      const startDate = new Date(formData.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + formData.nights);

      onSuccess({
        bookingId: response.bookingId,
        message: "Booking confirmed successfully!",
        total: response.total,
        guests: response.guests,
        nights: response.nights,
        startDate: response.startDate,
        endDate: endDate.toISOString(),
        destinations: response.destinations,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to complete booking";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-8 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.section
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/15 bg-[#05090f]/85 text-white shadow-[0_35px_90px_rgba(0,0,0,0.85)] backdrop-blur-2xl max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/80 transition hover:bg-white/20"
          type="button"
          aria-label="Close booking form"
        >
          ✕
        </button>

        <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-10 space-y-8">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">
              Review & confirm
            </p>
            <h3 className="text-3xl font-semibold leading-tight">
              Confirm Your Package
            </h3>
            <p className="text-white/70">
              Double-check destinations, travel dates, and live pricing before locking in your concierge itinerary.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-6">
                <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                        Selected destinations
                      </p>
                      <h4 className="mt-2 text-2xl font-semibold">Itinerary lineup</h4>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/70">
                      {destinations.length} spots
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {destinations.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-4 text-sm text-white/60">
                        No destinations selected. Add locations to continue.
                      </p>
                    ) : (
                      destinations.map((destination) => (
                        <div
                          key={destination.destinationId}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                        >
                          <div>
                            <p className="text-base font-semibold text-white">
                              {destination.name}
                            </p>
                            <p className="text-sm text-white/60">
                              {destination.city || destination.country || "Worldwide"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm uppercase tracking-wide text-white/60">
                              Per night
                            </p>
                            <p className="text-lg font-semibold text-blue-200">
                              ₹{destination.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                    Travel details
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="text-sm font-semibold text-white/90">
                        Start date
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-white/90">
                        Guests
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        required
                        value={formData.guests}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            guests: parseInt(e.target.value) || 1,
                          }))
                        }
                        className="mt-2 w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-white/90">
                        Nights
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        required
                        value={formData.nights}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            nights: parseInt(e.target.value) || 1,
                          }))
                        }
                        className="mt-2 w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-pink-500/10 p-6 shadow-[0_20px_60px_rgba(8,47,73,0.35)]">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/70">
                    Price intelligence
                  </p>
                  {pricingLoading ? (
                    <div className="py-10 text-center text-white/70">
                      Calculating live pricing...
                    </div>
                  ) : pricing ? (
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center justify-between text-white/85">
                        <span>Base package</span>
                        <span className="text-lg font-semibold">
                          ₹{pricing.basePrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="grid gap-3">
                        {adjustmentDetails.map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between text-sm text-white/80"
                          >
                            <span>{item.label}</span>
                            <span
                              className={
                                item.value > 0
                                  ? "text-emerald-300"
                                  : item.value < 0
                                    ? "text-rose-300"
                                    : "text-white/60"
                              }
                            >
                              {formatPercent(item.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-white/20 pt-4">
                        <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                          Estimated total
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-emerald-300">
                          ₹{totalPrice.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-xs text-white/70">
                        {pricing.pricingReason}
                      </p>
                    </div>
                  ) : (
                    <div className="py-10 text-center text-white/70">
                      Loading pricing information...
                    </div>
                  )}
                </section>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-white/80 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <span className="flex flex-col leading-tight text-center">
                        <span className="text-base font-semibold">Confirm Booking</span>
                        <span className="text-xs text-white/80">
                          ₹{totalPrice.toLocaleString()} total
                        </span>
                      </span>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </motion.section>
    </motion.div>
  );
}
