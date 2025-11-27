import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { bookingsAPI, type Destination } from "../../lib/api";

interface PricingBreakdown {
  basePrice: number;
  seasonalAdjustment: number;
  weatherAdjustment: number;
  demandAdjustment: number;
  lastMinuteAdjustment: number;
  subtotalAfterAdjustments: number;
  gstAmount: number;
  finalPrice: number;
}

interface PackageBookingConfirmationProps {
  packageId: number;
  packageName: string;
  packageDescription?: string | null;
  destinations: Destination[];
  onClose: () => void;
  onSuccess: (result: any) => void;
}

export default function PackageBookingConfirmation({
  packageId,
  packageName,
  packageDescription,
  destinations,
  onClose,
  onSuccess,
}: PackageBookingConfirmationProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    guests: 1,
    nights: 1,
    startDate: new Date().toISOString().slice(0, 10),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  const [step, setStep] = useState<"details" | "otp" | "success">("details");

  useEffect(() => {
    console.log("[PackageBookingConfirmation] Component mounted", {
      packageId,
      packageName,
      userId: user?.userId,
    });
  }, []);

  useEffect(() => {
    console.log("[PackageBookingConfirmation] Step changed to:", step);
  }, [step]);

  // Calculate pricing based on form data
  const calculatePricing = () => {
    const basePrice = destinations.reduce((sum, dest) => sum + dest.price, 0) * formData.guests * formData.nights;
    
    // Simplified pricing calculation for frontend display
    // The actual calculation will be done on the backend
    const startDate = new Date(formData.startDate);
    const daysUntilTrip = (startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    
    let seasonalAdjustment = basePrice * 0.05;
    let weatherAdjustment = 0;
    let demandAdjustment = 0;
    let lastMinuteAdjustment = 0;

    if (daysUntilTrip <= 3 && daysUntilTrip > 0) {
      lastMinuteAdjustment = -basePrice * 0.25;
    } else if (daysUntilTrip <= 7 && daysUntilTrip > 0) {
      lastMinuteAdjustment = -basePrice * 0.20;
    }

    const subtotalAfterAdjustments = basePrice + seasonalAdjustment + weatherAdjustment + demandAdjustment + lastMinuteAdjustment;
    const gstAmount = subtotalAfterAdjustments * 0.18;
    const finalPrice = subtotalAfterAdjustments + gstAmount;

    return {
      basePrice,
      seasonalAdjustment,
      weatherAdjustment,
      demandAdjustment,
      lastMinuteAdjustment,
      subtotalAfterAdjustments,
      gstAmount,
      finalPrice,
    };
  };

  useEffect(() => {
    setPricing(calculatePricing());
  }, [formData]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[handleCreateBooking] Form submitted", { guests: formData.guests, nights: formData.nights, startDate: formData.startDate });
    setIsLoading(true);
    setError("");

    try {
      console.log("[handleCreateBooking] Calling createPackageBooking API");
      const response = await bookingsAPI.createPackageBooking(
        user!.userId,
        packageId,
        formData.guests,
        formData.nights,
        new Date(formData.startDate),
      );
      
      console.log("[handleCreateBooking] Booking created successfully", { bookingId: response.bookingId, price: response.price });
      setBookingId(response.bookingId);
      setPricing({
        basePrice: pricing?.basePrice || 0,
        seasonalAdjustment: pricing?.seasonalAdjustment || 0,
        weatherAdjustment: pricing?.weatherAdjustment || 0,
        demandAdjustment: pricing?.demandAdjustment || 0,
        lastMinuteAdjustment: pricing?.lastMinuteAdjustment || 0,
        subtotalAfterAdjustments: pricing?.subtotalAfterAdjustments || 0,
        gstAmount: pricing?.gstAmount || 0,
        finalPrice: response.price,
      });

      try {
        console.log("[handleCreateBooking] Generating OTP for booking:", response.bookingId);
        const otpResponse = await bookingsAPI.generatePackageOtp(response.bookingId);
        console.log("[handleCreateBooking] OTP generated successfully", otpResponse);
        console.log("[handleCreateBooking] Setting step to 'otp'");
        setStep("otp");
        toast.success("OTP sent to your email!");
      } catch (otpErr: any) {
        console.error("[handleCreateBooking] OTP generation failed:", otpErr);
        console.error("[handleCreateBooking] Error details:", {
          message: otpErr.message,
          responseStatus: otpErr.response?.status,
          responseData: otpErr.response?.data,
        });
        const otpErrorMessage = otpErr.response?.data?.message || otpErr.message || "Failed to send OTP";
        setError(otpErrorMessage);
        toast.error(otpErrorMessage);
        console.log("[handleCreateBooking] Error state set, staying on details form");
      }
    } catch (err: any) {
      console.error("[handleCreateBooking] Booking creation failed:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to create booking";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("[handleVerifyOtp] OTP verification started", { bookingId, otpLength: otp.length });
    
    if (otp.length !== 6) {
      setError("Please enter a 6-digit OTP");
      console.warn("[handleVerifyOtp] Invalid OTP length");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("[handleVerifyOtp] Verifying OTP");
      await bookingsAPI.verifyPackageOtp(bookingId!, otp);
      console.log("[handleVerifyOtp] OTP verified successfully");

      console.log("[handleVerifyOtp] Confirming booking");
      await bookingsAPI.confirmPackageBooking(bookingId!, user!.email);
      console.log("[handleVerifyOtp] Booking confirmed successfully");

      toast.success("✅ Booking confirmed! Check your email for details.");
      console.log("[handleVerifyOtp] Setting step to 'success'");
      setStep("success");

      setTimeout(() => {
        console.log("[handleVerifyOtp] Calling onSuccess callback");
        onSuccess({
          bookingId,
          message: "Package booking confirmed successfully!",
          total: pricing?.finalPrice,
          guests: formData.guests,
          nights: formData.nights,
          startDate: formData.startDate,
          destinations: destinations.map(d => d.name),
        });
      }, 2000);
    } catch (err: any) {
      console.error("[handleVerifyOtp] Error during verification/confirmation:", err);
      const errorMessage = err.response?.data?.message || "Invalid OTP";
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
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/75 px-4 py-8 backdrop-blur-xl"
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
          aria-label="Close booking"
        >
          ✕
        </button>

        <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-10 space-y-8">
          {step === "details" && (
            <>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                  {packageName}
                </p>
                <h3 className="text-3xl font-semibold leading-tight">
                  Complete Your Package Booking
                </h3>
                <p className="text-white/70">
                  Review your trip details and pricing before confirming with OTP verification.
                </p>
              </div>

              <form onSubmit={handleCreateBooking} className="space-y-6">
                {error && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                  {/* Left Column - Details */}
                  <div className="space-y-6">
                    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                        Package Details
                      </p>
                      <h4 className="mt-2 text-2xl font-semibold">{packageName}</h4>
                      {packageDescription && (
                        <p className="mt-3 text-sm text-white/70">{packageDescription}</p>
                      )}
                    </section>

                    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                        Destinations Included
                      </p>
                      <div className="mt-4 space-y-3">
                        {destinations.map((destination) => (
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
                        ))}
                      </div>
                    </section>

                    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                        Travel Details
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

                  {/* Right Column - Pricing Breakdown */}
                  <div className="space-y-6">
                    <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-pink-500/10 p-6 shadow-[0_20px_60px_rgba(8,47,73,0.35)]">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/70">
                        Price Breakdown
                      </p>
                      {pricing && (
                        <div className="mt-4 space-y-4">
                          <div className="flex items-center justify-between text-white/85">
                            <span>Base price</span>
                            <span className="text-lg font-semibold">
                              ₹{pricing.basePrice.toLocaleString()}
                            </span>
                          </div>

                          <div className="space-y-2 border-t border-white/20 pt-3">
                            {pricing.seasonalAdjustment !== 0 && (
                              <div className="flex items-center justify-between text-sm text-white/80">
                                <span>Seasonal adjustment</span>
                                <span className={pricing.seasonalAdjustment > 0 ? "text-emerald-300" : "text-rose-300"}>
                                  {pricing.seasonalAdjustment > 0 ? "+" : ""}
                                  ₹{Math.abs(pricing.seasonalAdjustment).toLocaleString()}
                                </span>
                              </div>
                            )}
                            {pricing.demandAdjustment !== 0 && (
                              <div className="flex items-center justify-between text-sm text-white/80">
                                <span>Demand adjustment</span>
                                <span className={pricing.demandAdjustment > 0 ? "text-emerald-300" : "text-rose-300"}>
                                  {pricing.demandAdjustment > 0 ? "+" : ""}
                                  ₹{Math.abs(pricing.demandAdjustment).toLocaleString()}
                                </span>
                              </div>
                            )}
                            {pricing.lastMinuteAdjustment !== 0 && (
                              <div className="flex items-center justify-between text-sm text-white/80">
                                <span>Last-minute discount</span>
                                <span className="text-rose-300">
                                  ₹{Math.abs(pricing.lastMinuteAdjustment).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-white/20 pt-3">
                            <div className="flex items-center justify-between text-white/80 mb-2">
                              <span>Subtotal</span>
                              <span className="font-semibold">
                                ₹{pricing.subtotalAfterAdjustments.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-white/70 mb-3">
                              <span>GST (18%)</span>
                              <span>₹{pricing.gstAmount.toLocaleString()}</span>
                            </div>
                            <div className="border-t border-white/20 pt-3 flex items-center justify-between">
                              <p className="text-sm uppercase tracking-[0.35em] text-white/60">
                                Total Amount
                              </p>
                              <p className="text-3xl font-semibold text-emerald-300">
                                ₹{pricing.finalPrice.toLocaleString()}
                              </p>
                            </div>
                          </div>
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
                        {isLoading ? "Processing..." : "Proceed to OTP Verification"}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </form>
            </>
          )}

          {step === "otp" && (
            <div className="space-y-6 max-w-md mx-auto">
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto"
                >
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="w-8 h-8 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </motion.svg>
                </motion.div>

                <h2 className="text-2xl font-bold text-white">Verify Your Email</h2>
                <p className="text-white/70">
                  Please enter the 6-digit OTP sent to <span className="font-semibold text-white">{user?.email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      if (value.length <= 6) {
                        setOtp(value);
                      }
                    }}
                    maxLength={6}
                    placeholder="000000"
                    className="w-full px-4 py-3 text-center text-2xl tracking-widest bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-semibold"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </motion.button>

                <button
                  type="button"
                  onClick={() => setStep("details")}
                  disabled={isLoading}
                  className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg transition-colors border border-white/10"
                >
                  Back
                </button>
              </form>
            </div>
          )}

          {step === "success" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto"
              >
                <svg
                  className="w-10 h-10 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.div>

              <div>
                <h2 className="text-3xl font-bold text-green-400 mb-2">
                  🎉 Booking Confirmed!
                </h2>
                <p className="text-white/70">
                  Your package booking has been confirmed. A confirmation email has been sent to {user?.email}
                </p>
              </div>

              <div className="text-center space-y-2 bg-white/5 rounded-2xl p-6 border border-white/10">
                <p className="text-sm text-white/60">Booking ID</p>
                <p className="text-2xl font-bold text-white">#{bookingId}</p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition"
              >
                Close
              </button>
            </motion.div>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
