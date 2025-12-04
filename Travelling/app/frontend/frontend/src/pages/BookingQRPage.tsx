import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { bookingsAPI, BookingDetails } from "../lib/api";
import { generateTicketPDF } from "../lib/ticketPdfGenerator";
import { TicketBookingData } from "../types/ticketPdf";

export default function BookingQRPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) {
        setError("Booking ID not found");
        setLoading(false);
        return;
      }

      try {
        const details = await bookingsAPI.getBookingDetails(parseInt(bookingId));
        setBookingDetails(details);

        localStorage.setItem("lastBookingId", bookingId);
        const bookingHistory = JSON.parse(
          localStorage.getItem("bookingHistory") || "[]",
        );
        if (!bookingHistory.includes(parseInt(bookingId))) {
          bookingHistory.push(parseInt(bookingId));
          localStorage.setItem("bookingHistory", JSON.stringify(bookingHistory));
        }
      } catch (err: any) {
        console.error("Error fetching booking details:", err);
        setError(err.message || "Failed to load booking details");
        toast.error("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const generateQRData = () => {
    if (!bookingDetails) return "";
    return JSON.stringify({
      bookingId: bookingDetails.bookingId,
      email: bookingDetails.email,
      date: bookingDetails.date,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const downloadTicketPDF = async () => {
    if (!bookingDetails) {
      toast.error("Unable to generate PDF - booking details not found");
      return;
    }

    setDownloadingPdf(true);
    try {
      const ticketData: TicketBookingData = {
        bookingId: bookingDetails.bookingId,
        userName: bookingDetails.userName,
        userEmail: bookingDetails.email,
        packageName: bookingDetails.packageName,
        destination: bookingDetails.packageName,
        date: bookingDetails.date,
        persons: bookingDetails.persons,
        subTotal: bookingDetails.subTotal,
        gstAmount: bookingDetails.gstAmount,
        totalAmount: bookingDetails.totalAmount,
        paymentStatus: bookingDetails.paymentStatus,
      };

      await generateTicketPDF(ticketData);
      toast.success("Ticket downloaded successfully!");
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error("Failed to download ticket");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleContinueExploring = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e1512] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#7fb539]/30 border-t-[#7fb539] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !bookingDetails) {
    return (
      <div className="min-h-screen bg-[#0e1512] flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-white/70 mb-6">{error || "Booking not found"}</p>
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
    <div className="min-h-screen bg-[#0e1512] text-white pt-20 pb-10">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
          {/* Success Header */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
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
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Booking Confirmed! 🎉</h1>
            <p className="text-white/60">
              Your travel package has been successfully booked
            </p>
          </motion.div>

          {/* QR Code Section - Preview */}
          <div className="bg-white/5 rounded-xl p-8 mb-8 border border-white/10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 mx-auto mb-8 w-fit"
            >
              <QRCode
                value={generateQRData()}
                size={200}
                level="H"
                includeMargin={true}
              />
            </motion.div>

            {/* Booking Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-white/60 text-sm font-medium mb-2">
                    Customer Name
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {bookingDetails.userName}
                  </p>
                </div>

                <div>
                  <p className="text-white/60 text-sm font-medium mb-2">
                    Email
                  </p>
                  <p className="text-lg font-semibold text-white break-all">
                    {bookingDetails.email}
                  </p>
                </div>

                <div>
                  <p className="text-white/60 text-sm font-medium mb-2">
                    Destination / Package
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {bookingDetails.packageName}
                  </p>
                </div>

                <div>
                  <p className="text-white/60 text-sm font-medium mb-2">
                    Travel Date
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {formatDate(bookingDetails.date)}
                  </p>
                </div>

                <div>
                  <p className="text-white/60 text-sm font-medium mb-2">
                    Number of Persons
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {bookingDetails.persons}{" "}
                    {bookingDetails.persons === 1 ? "Person" : "Persons"}
                  </p>
                </div>

                <div>
                  <p className="text-white/60 text-sm font-medium mb-2">
                    Payment Status
                  </p>
                  <p
                    className={`text-lg font-semibold ${
                      bookingDetails.paymentStatus === "Paid"
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {bookingDetails.paymentStatus}
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-white/10 pt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Subtotal</span>
                  <span className="text-white font-medium">
                    ₹{bookingDetails.subTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">GST (18%)</span>
                  <span className="text-white font-medium">
                    ₹{bookingDetails.gstAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                  <span className="text-white font-bold">Total Amount</span>
                  <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                    ₹{bookingDetails.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Booking ID */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-8 bg-white/5 rounded-lg p-4 border border-white/10"
          >
            <p className="text-white/60 text-sm mb-1">Booking ID</p>
            <p className="text-2xl font-mono font-bold text-[#7fb539]">
              #{bookingDetails.bookingId}
            </p>
            <p className="text-white/50 text-xs mt-2">
              Please save this for your records
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={downloadTicketPDF}
              disabled={downloadingPdf}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadingPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Ticket (PDF)
                </>
              )}
            </button>

            <button
              onClick={handleContinueExploring}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-lg hover:scale-105 transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              Continue Exploring
            </button>
          </motion.div>

          {/* Additional Info */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-white/50 text-sm mt-8"
          >
            A confirmation email has been sent to {bookingDetails.email}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
