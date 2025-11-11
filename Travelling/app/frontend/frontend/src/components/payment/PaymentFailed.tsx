import React from "react";
import { useNavigate } from "react-router-dom";
import { XCircle, RefreshCw, Home, Phone } from "lucide-react";
import toast from "react-hot-toast";

interface PaymentFailedProps {
  error?: string;
  bookingId?: string;
  onRetry?: () => void;
}

const PaymentFailed: React.FC<PaymentFailedProps> = ({
  error = "Payment was unsuccessful",
  bookingId,
  onRetry,
}) => {
  const navigate = useNavigate();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default retry behavior - reload the page
      window.location.reload();
    }
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  const handleContactSupport = () => {
    // In a real app, this could open a chat widget or redirect to support page
    toast.success("Support contact feature coming soon!");
    // For now, you could implement email or phone contact
    window.location.href =
      "mailto:support@travelapp.com?subject=Payment Failed - Booking " +
      bookingId;
  };

  return (
    <div className="min-h-screen bg-[#0e1512] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-white mb-2">Payment Failed</h1>
        <p className="text-gray-400 mb-6">
          We couldn't process your payment. Don't worry, your booking is still
          pending.
        </p>

        {/* Error Details */}
        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-300 mb-2">Error Details:</p>
          <p className="text-sm text-gray-300">{error}</p>
          {bookingId && (
            <p className="text-xs text-gray-400 mt-2">
              Booking ID: {bookingId}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Payment Again
          </button>

          <button
            onClick={handleGoToDashboard}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </button>

          <button
            onClick={handleContactSupport}
            className="w-full bg-gray-700 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Phone className="w-5 h-5" />
            Contact Support
          </button>
        </div>

        {/* Help Information */}
        <div className="mt-6 p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/20">
          <p className="text-sm text-yellow-300 mb-2">
            <strong>Need Help?</strong>
          </p>
          <ul className="text-xs text-gray-400 space-y-1 text-left">
            <li>• Check your internet connection</li>
            <li>• Ensure your card details are correct</li>
            <li>• Try a different payment method</li>
            <li>• Contact your bank if the issue persists</li>
          </ul>
        </div>

        {/* Security Note */}
        <p className="text-xs text-gray-500 mt-4">
          Your payment information is secure and encrypted.
        </p>
      </div>
    </div>
  );
};

export default PaymentFailed;
