import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { bookingsAPI, type UserBooking, type Destination } from "../../lib/api";

interface RescheduleModalProps {
  onClose: () => void;
  destinations: Destination[];
}

type ModalStep = "bookings" | "select-date" | "otp-verification" | "success" | "confirmation";

export default function RescheduleModal({
  onClose,
  destinations,
}: RescheduleModalProps) {
  const [step, setStep] = useState<ModalStep>("bookings");
  const [userBookings, setUserBookings] = useState<UserBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<UserBooking | null>(
    null,
  );
  const [newStartDate, setNewStartDate] = useState<string>("");
  const [newDestinationId, setNewDestinationId] = useState<
    number | undefined
  >();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const [otpSent, setOtpSent] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const otpSendInitiatedRef = useRef(false);

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
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const sendOtpOnMount = async () => {
    if (!selectedBooking) return;

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
      setSuccessMessage("OTP sent successfully to your email!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      const statusCode = err.response?.status;
      const message = err.response?.data?.message;

      if (statusCode === 429) {
        setError(message || "Too many OTP requests. Please try again later.");
      } else if (statusCode === 500 && message === "Email failed to send") {
        setError(
          "Email server is temporarily unavailable. Please try again later.",
        );
      } else {
        setError(
          message || err.message || "Failed to send OTP. Please try again.",
        );
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
    otpSendInitiatedRef.current = false;
    setStep("select-date");
  };

  const handleConfirmDate = async () => {
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
        err.response?.data?.message ||
          err.message ||
          "Invalid OTP. Please try again.",
      );
    } finally {
      setIsLoading(false);
      setIsConfirming(false);
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
        className="bg-gradient-to-br from-[#0e1512] via-[#0f1613] to-[#0e1512] rounded-3xl border border-white/20 shadow-2xl shadow-black/50 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-xl"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <motion.svg
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="w-8 h-8 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </motion.svg>
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-white mb-2"
          >
            {step === "bookings" && "Reschedule Your Trip"}
            {step === "select-date" && "Choose New Date"}
            {step === "otp-verification" && "Verify Your Email"}
            {step === "confirmation" && "Trip Rescheduled Successfully!"}
            {step === "success" && "Success!"}
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/70 mb-6"
          >
            {step === "bookings" && "Select a booking to reschedule"}
            {step === "select-date" && "Pick a new travel date"}
            {step === "otp-verification" && "Enter the OTP sent to your email"}
            {step === "confirmation" && "Your booking has been updated successfully"}
            {step === "success" && "Your trip has been rescheduled"}
          </motion.p>

          {/* Bookings Selection */}
          {step === "bookings" && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <svg
                    className="animate-spin h-12 w-12 text-purple-500"
                    viewBox="0 0 24 24"
                  >
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
                </div>
              ) : userBookings.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {userBookings.map((booking) => (
                    <motion.button
                      key={booking.bookingId}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectBooking(booking)}
                      className="w-full p-6 rounded-xl bg-gradient-to-r from-white/5 to-white/10 border border-white/20 hover:border-purple-500/50 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 transition-all text-left group shadow-lg hover:shadow-purple-500/20"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-white text-lg group-hover:text-purple-300 transition-colors">
                              {booking.destinations}
                            </p>
                            <p className="text-sm text-white/60">
                              Booking #{booking.bookingId}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="w-2 h-2 bg-green-400 rounded-full mb-1"></div>
                          <span className="text-xs text-green-400 font-medium">Active</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-white/70">
                            {new Date(booking.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          <span className="text-white/70">{booking.guests} guests</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                          </svg>
                          <span className="text-white/70">{booking.nights} nights</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <p className="text-white/70">
                  No bookings available to reschedule
                </p>
              )}
            </motion.div>
          )}

          {/* Date Selection */}
          {step === "select-date" && selectedBooking && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Current Booking Details</h3>
                </div>

                <div className="grid gap-3">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/70 text-sm">Destination</span>
                    <span className="font-semibold text-white">{selectedBooking.destinations}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/70 text-sm">Check-in Date</span>
                    <span className="font-semibold text-white">
                      {new Date(selectedBooking.startDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/70 text-sm">Duration</span>
                    <span className="font-semibold text-white">{selectedBooking.nights} nights</span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-white/70 text-sm">Guests</span>
                    <span className="font-semibold text-white">{selectedBooking.guests} guests</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <label className="text-sm font-semibold text-white/90">
                    New Travel Date
                  </label>
                </div>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => {
                    setNewStartDate(e.target.value);
                    setError("");
                  }}
                  min={getMinDate()}
                  className="w-full px-4 py-4 bg-gradient-to-r from-white/5 to-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder-white/50 text-center font-medium"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <label className="text-sm font-semibold text-white/90">
                    New Destination (Optional)
                  </label>
                </div>
                <select
                  value={newDestinationId || ""}
                  onChange={(e) => {
                    setNewDestinationId(
                      e.target.value ? parseInt(e.target.value) : undefined,
                    );
                  }}
                  className="w-full px-4 py-4 bg-gradient-to-r from-white/5 to-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                >
                  <option value="" className="bg-gray-800">Keep current destination</option>
                  {destinations.map((dest) => (
                    <option key={dest.destinationId} value={dest.destinationId} className="bg-gray-800">
                      {dest.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setStep("bookings");
                    otpSendInitiatedRef.current = false;
                  }}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
                >
                  Back
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmDate}
                  disabled={isLoading || !newStartDate}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Loading..." : "Confirm"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* OTP Verification */}
          {step === "otp-verification" && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              {!otpSent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-center py-8"
                >
                  <svg
                    className="animate-spin h-12 w-12 text-purple-500 mx-auto mb-4"
                    viewBox="0 0 24 24"
                  >
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
                  <p className="text-white/70">Sending OTP to your email...</p>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {otpSent && (
                <motion.form
                  onSubmit={handleVerifyOtp}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-4"
                >
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm"
                    >
                      {successMessage}
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/90 mb-2">
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
                      className="w-full px-4 py-3 text-center text-2xl tracking-widest bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-semibold"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Time remaining:</span>
                    <span
                      className={`font-semibold ${
                        timeLeft < 60 ? "text-red-400" : "text-purple-400"
                      }`}
                    >
                      {formatTime(timeLeft)}
                    </span>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={
                      isLoading ||
                      isConfirming ||
                      isSendingOtp ||
                      otp.length !== 6
                    }
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading || isConfirming ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                        >
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
                        {isConfirming ? "Confirming..." : "Verifying..."}
                      </span>
                    ) : (
                      "Verify OTP"
                    )}
                  </motion.button>

                  <button
                    type="button"
                    onClick={sendOtpOnMount}
                    disabled={
                      timeLeft > 240 || isSendingOtp || error.includes("rate")
                    }
                    className="w-full py-2 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={error.includes("rate") ? error : ""}
                  >
                    {isSendingOtp
                      ? "Sending OTP..."
                      : timeLeft > 240
                        ? "Resend OTP (wait to resend)"
                        : error.includes("rate")
                          ? "Rate limit exceeded"
                          : "Resend OTP"}
                  </button>
                </motion.form>
              )}
            </motion.div>
          )}

          {/* Confirmation Success */}
          {step === "confirmation" && selectedBooking && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-6"
            >
              {/* Success Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30"
              >
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </motion.div>

              {/* Updated Booking Details */}
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Updated Booking Details
                </h3>

                <div className="grid gap-4">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/70">Booking ID</span>
                    <span className="font-semibold text-white">#{selectedBooking.bookingId}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/70">Destination</span>
                    <span className="font-semibold text-white">
                      {newDestinationId
                        ? destinations.find(d => d.destinationId === newDestinationId)?.name || selectedBooking.destinations
                        : selectedBooking.destinations
                      }
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/70">New Check-in</span>
                    <span className="font-semibold text-white">
                      {new Date(newStartDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/70">Duration</span>
                    <span className="font-semibold text-white">{selectedBooking.nights} nights</span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-white/70">Guests</span>
                    <span className="font-semibold text-white">{selectedBooking.guests} guests</span>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 text-center"
              >
                <p className="text-white/90 font-medium mb-2">🎉 Your trip has been rescheduled successfully!</p>
                <p className="text-white/70 text-sm">A confirmation email has been sent to your inbox with all the details.</p>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/30"
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Close Button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            onClick={onClose}
            className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg transition-colors border border-white/10"
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
