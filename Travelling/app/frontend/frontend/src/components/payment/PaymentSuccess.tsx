import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Download, Home } from "lucide-react";
import toast from "react-hot-toast";

interface PaymentSuccessProps {
  bookingId?: string;
  amount?: number;
  transactionId?: string;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  bookingId,
  amount,
  transactionId,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get data from navigation state if not provided as props
  const stateData = location.state as {
    paymentSuccess?: boolean;
    bookingId?: string;
    amount?: number;
    transactionId?: string;
  };

  const finalBookingId = bookingId || stateData?.bookingId;
  const finalAmount = amount || stateData?.amount;
  const finalTransactionId = transactionId || stateData?.transactionId;

  useEffect(() => {
    // Show success toast when component mounts
    toast.success("Payment completed successfully!", {
      duration: 5000,
      icon: "🎉",
    });
  }, []);

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  const handleDownloadReceipt = () => {
    // In a real app, this would generate/download a receipt
    toast.success("Receipt download feature coming soon!");
  };

  return (
    <div className="min-h-screen bg-[#0e1512] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-white mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-400 mb-6">
          Your booking has been confirmed. You will receive a confirmation email
          shortly.
        </p>

        {/* Payment Details */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6 space-y-2">
          {finalBookingId && (
            <div className="flex justify-between">
              <span className="text-gray-400">Booking ID:</span>
              <span className="text-white font-medium">{finalBookingId}</span>
            </div>
          )}
          {finalAmount && (
            <div className="flex justify-between">
              <span className="text-gray-400">Amount Paid:</span>
              <span className="text-white font-medium">
                ₹{finalAmount.toFixed(2)}
              </span>
            </div>
          )}
          {finalTransactionId && (
            <div className="flex justify-between">
              <span className="text-gray-400">Transaction ID:</span>
              <span className="text-white font-medium text-sm">
                {finalTransactionId}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-400">Payment Date:</span>
            <span className="text-white font-medium">
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoToDashboard}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </button>

          <button
            onClick={handleDownloadReceipt}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Receipt
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-500/20">
          <p className="text-sm text-blue-300">
            <strong>What happens next?</strong>
          </p>
          <ul className="text-xs text-gray-400 mt-2 space-y-1 text-left">
            <li>• Check your email for booking confirmation</li>
            <li>• Your booking details are saved in your dashboard</li>
            <li>• Contact support if you need any assistance</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
