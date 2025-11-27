import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bookingsAPI, type UserBooking, type Destination, type Booking } from "../../lib/api";

export interface RescheduleModalProps {
  onClose: () => void;
  destinations: Destination[];
  selectedBooking: Booking | null;
}

type ModalStep = "bookings" | "select-date" | "otp-verification" | "confirmation";

const stepOrder: ModalStep[] = ["bookings", "select-date", "otp-verification"];

const stepDetails: Record<ModalStep, { label: string; description: string }> = {
  bookings: {
    label: "Bookings List",
    description: "Choose the trip you want to reschedule",
  },
  "select-date": {
    label: "Select New Date",
    description: "Pick updated travel details and preferences",
  },
  "otp-verification": {
    label: "OTP Verification",
    description: "Secure your request with the verification code",
  },
  confirmation: {
    label: "All Set",
    description: "Your trip has been rescheduled successfully",
  },
};

export default function RescheduleModal({ onClose, destinations, selectedBooking: initialSelectedBooking }: RescheduleModalProps) {
  const [step, setStep] = useState<ModalStep>("bookings");
  const [userBookings, setUserBookings] = useState<UserBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<UserBooking | null>(null);
  const [newStartDate, setNewStartDate] = useState("");
  const [newDestinationId, setNewDestinationId] = useState<number | undefined>();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBookings, setIsFetchingBookings] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const [otpSent, setOtpSent] = useState(false);
  const otpSendInitiatedRef = useRef(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    if (step === "bookings") {
      fetchUserBookings();
    }
  }, [step]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0 && otpSent && step === "otp-verification") {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft, otpSent, step]);

  useEffect(() => {
    if (step === "otp-verification" && !otpSendInitiatedRef.current) {
      otpSendInitiatedRef.current = true;
      sendOtpOnMount();
    }
  }, [step]);

  const fetchUserBookings = async () => {
    setIsFetchingBookings(true);
    setError("");
    try {
      const bookings = await bookingsAPI.getCurrentUserBookings();
      setUserBookings(bookings);
      if (bookings.length === 0) {
        setError("No active bookings found");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch bookings");
    } finally {
      setIsFetchingBookings(false);
    }
  };

  const sendOtpOnMount = async () => {
    if (!selectedBooking || !newStartDate) return;

    setIsSendingOtp(true);
    setError("");
    try {
      await bookingsAPI.sendRescheduleOtp(
        selectedBooking.bookingId,
        new Date(newStartDate),
        newDestinationId,
      );
      setOtpSent(true);
      setTimeLeft(300);
      setSuccessMessage("OTP sent successfully to your email");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      const statusCode = err.response?.status;
      const message = err.response?.data?.message;
      if (statusCode === 429) {
        setError(message || "Too many OTP requests. Please try again later.");
      } else if (statusCode === 500 && message === "Email failed to send") {
        setError("Email server is temporarily unavailable. Please try again later.");
      } else {
        setError(message || err.message || "Failed to send OTP. Please try again.");
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSelectBooking = (booking: UserBooking) => {
    setSelectedBooking(booking);
    setNewStartDate("");
    setNewDestinationId(undefined);
    setError("");
    setOtp("");
    setOtpSent(false);
    setSuccessMessage("");
    setTimeLeft(300);
    setIsSendingOtp(false);
    otpSendInitiatedRef.current = false;
  };

  const handleConfirmDate = () => {
    if (!newStartDate) {
      setError("Please select a new date");
      return;
    }
    const selectedDate = new Date(newStartDate);
    if (selectedDate <= new Date()) {
      setError("New date must be in the future");
      return;
    }
    setError("");
    setStep("otp-verification");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a 6-digit OTP");
      return;
    }
    if (!selectedBooking) {
      setError("Booking information missing");
      return;
    }
    setIsLoading(true);
    setIsConfirming(true);
    setError("");
    try {
      await bookingsAPI.verifyRescheduleOtp(
        selectedBooking.bookingId,
        otp,
        new Date(newStartDate),
        newDestinationId,
      );
      setStep("confirmation");
      setIsConfirming(false);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Invalid OTP. Please try again.",
      );
    } finally {
      setIsLoading(false);
      setIsConfirming(false);
    }
  };

  const handleNextStep = () => {
    if (step === "bookings") {
      if (!selectedBooking) {
        setError("Select a booking to continue");
        return;
      }
      setError("");
      setStep("select-date");
    } else if (step === "select-date") {
      handleConfirmDate();
    }
  };

  const handleBack = () => {
    if (step === "select-date") {
      setStep("bookings");
      setError("");
      return;
    }
    if (step === "otp-verification") {
      setStep("select-date");
      setOtp("");
      setOtpSent(false);
      setError("");
      setSuccessMessage("");
      setTimeLeft(300);
      setIsSendingOtp(false);
      otpSendInitiatedRef.current = false;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const currentStepIndex = step === "confirmation" ? stepOrder.length : stepOrder.indexOf(step);
  const isOtpStep = step === "otp-verification";
  const primaryButtonType = isOtpStep ? "submit" : "button";
  const primaryButtonForm = isOtpStep ? "reschedule-otp-form" : undefined;

  const primaryActionLabel = (() => {
    if (step === "bookings") {
      return isFetchingBookings ? "Loading..." : "Next";
    }
    if (step === "select-date") {
      return "Next";
    }
    if (step === "otp-verification") {
      return isLoading || isConfirming ? "Verifying..." : "Verify & Reschedule";
    }
    return "Done";
  })();

  const primaryActionDisabled = (() => {
    if (step === "bookings") {
      return !selectedBooking || isFetchingBookings;
    }
    if (step === "select-date") {
      return !newStartDate;
    }
    if (step === "otp-verification") {
      return otp.length !== 6 || isLoading || isConfirming || isSendingOtp;
    }
    return false;
  })();

  const renderStepContent = () => {
    if (step === "bookings") {
      return (
        <div className="space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-[0.85rem] text-red-200"
            >
              {error}
            </motion.div>
          )}
          {isFetchingBookings ? (
            <div className="flex items-center justify-center py-12">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-transparent border-t-blue-400 text-blue-400"
              />
            </div>
          ) : userBookings.length > 0 ? (
            <div className="space-y-3">
              {userBookings.map((booking) => {
                const isActive = selectedBooking?.bookingId === booking.bookingId;
                return (
                  <motion.button
                    key={booking.bookingId}
                    type="button"
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelectBooking(booking)}
                    className={`w-full rounded-2xl border px-5 py-4 text-left text-[0.95rem] transition-all ${
                      isActive
                        ? "border-blue-400/70 bg-white/15 shadow-2xl shadow-blue-500/20"
                        : "border-white/15 bg-white/5 hover:border-purple-400/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-white">{booking.destinations}</p>
                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">Booking #{booking.bookingId}</p>
                      </div>
                      <span className="rounded-full border border-purple-400/40 bg-purple-500/10 px-3 py-1 text-[0.7rem] font-semibold text-purple-200">
                        Active
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-white/70 sm:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {new Date(booking.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <span>{booking.guests} guests</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                        <span>{booking.nights} nights</span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-[0.9rem] text-white/60">No bookings available to reschedule</p>
          )}
        </div>
      );
    }

    if (step === "select-date" && selectedBooking) {
      return (
        <div className="space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-[0.85rem] text-red-200"
            >
              {error}
            </motion.div>
          )}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-purple-500/5 p-5 text-white">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/50">Destination</p>
                <p className="text-lg font-semibold text-white">{selectedBooking.destinations}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/50">Guests</p>
                <p className="text-lg font-semibold text-white">{selectedBooking.guests}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/50">Current check-in</p>
                <p className="mt-2 text-lg font-semibold">
                  {new Date(selectedBooking.startDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/50">Duration</p>
                <p className="mt-2 text-lg font-semibold">{selectedBooking.nights} nights</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white">New travel date</label>
            <input
              type="date"
              value={newStartDate}
              min={getMinDate()}
              onChange={(e) => {
                setNewStartDate(e.target.value);
                setError("");
              }}
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-center text-lg font-semibold text-white placeholder-white/50 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white">New destination (optional)</label>
            <select
              value={newDestinationId || ""}
              onChange={(e) => {
                setNewDestinationId(e.target.value ? parseInt(e.target.value, 10) : undefined);
              }}
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-[0.95rem] text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            >
              <option value="" className="bg-[#050c0a] text-white">
                Keep current destination
              </option>
              {destinations.map((dest) => (
                <option key={dest.destinationId} value={dest.destinationId} className="bg-[#050c0a] text-white">
                  {dest.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    if (step === "otp-verification") {
      return (
        <div className="space-y-5">
          {!otpSent && (
            <div className="rounded-3xl border border-white/15 bg-white/5 px-6 py-10 text-center text-white/70">
              <motion.svg
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                className="mx-auto mb-4 h-12 w-12 text-blue-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="1.5" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 000 20" strokeWidth="1.5" />
              </motion.svg>
              Sending OTP to your email...
              {error && (
                <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-[0.85rem] text-red-200">
                  {error}
                </p>
              )}
            </div>
          )}
          {otpSent && (
            <motion.form
              id="reschedule-otp-form"
              onSubmit={handleVerifyOtp}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-[0.85rem] text-red-200"
                >
                  {error}
                </motion.div>
              )}
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-purple-400/30 bg-purple-500/10 px-4 py-3 text-[0.85rem] text-purple-200"
                >
                  {successMessage}
                </motion.div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Enter 6-digit OTP</label>
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
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center text-2xl font-semibold tracking-[0.4em] text-white placeholder-white/30 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Time remaining</span>
                <span className={timeLeft < 60 ? "text-rose-300 font-semibold" : "text-blue-300 font-semibold"}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <button
                type="button"
                onClick={sendOtpOnMount}
                disabled={timeLeft > 240 || isSendingOtp}
                className="w-full rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-blue-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSendingOtp
                  ? "Sending OTP..."
                  : timeLeft > 240
                    ? "Resend available in a moment"
                    : "Resend OTP"}
              </button>
            </motion.form>
          )}
        </div>
      );
    }

    if (step === "confirmation" && selectedBooking) {
      return (
        <div className="space-y-6 text-white">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 220 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-3xl text-white shadow-2xl shadow-blue-500/30"
          >
            ✓
          </motion.div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="grid gap-4 text-sm text-white/80">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span>Booking ID</span>
                <span className="font-semibold text-white">#{selectedBooking.bookingId}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span>Destination</span>
                <span className="font-semibold text-white">
                  {newDestinationId
                    ? destinations.find((d) => d.destinationId === newDestinationId)?.name || selectedBooking.destinations
                    : selectedBooking.destinations}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span>New check-in</span>
                <span className="font-semibold text-white">
                  {new Date(newStartDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Guests</span>
                <span className="font-semibold text-white">{selectedBooking.guests}</span>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-purple-400/20 bg-purple-500/10 px-6 py-4 text-center text-sm text-purple-100">
            A confirmation email with updated details has been sent to your inbox.
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-xl font-display"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="relative w-full max-w-[600px] overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-br from-[#050c0a] via-[#071814] to-[#050c0a] text-white shadow-[0_45px_140px_rgba(0,0,0,0.85)]"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.28),transparent_65%)] blur-2xl" />
          <div className="absolute -bottom-20 -left-12 h-60 w-60 rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.25),transparent_60%)] blur-3xl" />
          <div className="absolute inset-6 rounded-[28px] border border-white/5" />
        </div>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white/70 transition hover:bg-white/10"
          aria-label="Close reschedule modal"
        >
          ×
        </button>
        <div className="relative z-10 flex h-full max-h-[85vh] flex-col text-[0.95rem] leading-relaxed text-white/80">
          <div className="px-6 pt-9 pb-4 sm:px-8">
            <p className="text-[0.7rem] uppercase tracking-[0.45em] text-blue-200/80">Travel Planner</p>
            <div className="mt-3 flex flex-col gap-2">
              <h2 className="text-[2rem] font-semibold leading-tight text-white md:text-[2.25rem]">Reschedule Trip</h2>
              <p className="text-[0.92rem] text-white/65">{stepDetails[step].description}</p>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {stepOrder.map((item, index) => {
                const isActive = step === item;
                const isComplete = currentStepIndex > index && !isActive;
                return (
                  <div
                    key={item}
                    className={`rounded-2xl border px-4 py-3 text-center text-[0.72rem] font-semibold tracking-[0.2em] transition ${
                      isActive
                        ? "border-blue-400/70 bg-white/10 text-white"
                        : isComplete
                          ? "border-purple-400/40 bg-purple-500/10 text-purple-100"
                          : "border-white/10 bg-white/5 text-white/50"
                    }`}
                  >
                    <div className="text-lg font-bold tracking-normal">{index + 1}</div>
                    <p className="mt-1 text-[0.62rem] uppercase tracking-[0.35em]">{stepDetails[item].label}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 sm:px-8 no-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>
          {step !== "confirmation" ? (
            <div className="border-t border-white/5 px-6 pb-6 pt-5 sm:px-8">
              <div className="flex flex-col gap-3 sm:flex-row">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={step === "bookings"}
                  onClick={step === "bookings" ? undefined : handleBack}
                  className="w-full rounded-2xl border border-white/15 px-4 py-3 text-base font-semibold text-white/80 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Back
                </motion.button>
                <motion.button
                  type={primaryButtonType}
                  form={primaryButtonForm}
                  whileHover={{ scale: primaryActionDisabled ? 1 : 1.02 }}
                  whileTap={{ scale: primaryActionDisabled ? 1 : 0.98 }}
                  onClick={!isOtpStep ? handleNextStep : undefined}
                  disabled={primaryActionDisabled}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {primaryActionLabel}
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full rounded-2xl border border-white/15 px-4 py-3 text-base font-semibold text-white/80 transition hover:bg-white/5"
                >
                  Close
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="border-t border-white/5 px-6 pb-6 pt-5 sm:px-8">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/30"
              >
                Close
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
