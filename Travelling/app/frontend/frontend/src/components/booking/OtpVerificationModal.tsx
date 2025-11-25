import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { bookingsAPI } from "../../lib/api";

interface OtpVerificationModalProps {
  bookingId: number;
  userEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OtpVerificationModal({
  bookingId,
  userEmail,
  onClose,
  onSuccess,
}: OtpVerificationModalProps) {
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
    if (!otpSendInitiatedRef.current) {
      otpSendInitiatedRef.current = true;
      sendOtpOnMount();
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0 && otpSent) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft, otpSent]);

  const sendOtpOnMount = async () => {
    setIsSendingOtp(true);
    setError("");
    try {
      const response = await bookingsAPI.sendOtp(bookingId);
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const verifyResponse = await bookingsAPI.verifyOtp(bookingId, otp);
      setSuccessMessage("OTP verified! Confirming booking...");

      setIsConfirming(true);
      const confirmResponse = await bookingsAPI.confirmBooking(
        bookingId,
        userEmail,
      );

      setSuccessMessage(
        "🎉 Booking Confirmed! Check your email for confirmation.",
      );
      setTimeout(() => {
        onSuccess();
      }, 2000);
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
        className="bg-[#0e1512] rounded-2xl border border-white/20 p-8 max-w-md w-full"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
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

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Verify Your Email
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/70 mb-6"
          >
            Please enter the OTP sent to{" "}
            <span className="font-semibold text-white">{userEmail}</span>
          </motion.p>

          {!otpSent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center py-8"
            >
              <svg
                className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4"
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
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-semibold"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Time remaining:</span>
                <span
                  className={`font-semibold ${
                    timeLeft < 60 ? "text-red-400" : "text-blue-400"
                  }`}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>

              <motion.button
                type="submit"
                disabled={
                  isLoading || isConfirming || isSendingOtp || otp.length !== 6
                }
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading || isConfirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                className="w-full py-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
