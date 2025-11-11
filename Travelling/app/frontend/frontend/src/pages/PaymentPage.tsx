import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { PaymentApi, loadRazorpayScript } from "../api/paymentApi";
import { CreateOrderResponse, RazorpayOptions, RazorpaySuccessResponse } from "../types/payment";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";

const PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderData, setOrderData] = useState<CreateOrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Extract parameters from URL
  const bookingId = searchParams.get("bookingId");
  const token = searchParams.get("token");

  useEffect(() => {
    // Validate required parameters
    if (!bookingId || !token) {
      setError("Invalid payment link. Missing booking ID or token.");
      setLoading(false);
      return;
    }

    // Load Razorpay script and create order
    initializePayment();
  }, [bookingId, token]);

  const initializePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load Razorpay script
      await loadRazorpayScript();

      // Create order from backend
      const orderResponse = await PaymentApi.createOrder({ token });
      setOrderData(orderResponse);

      // Initialize Razorpay checkout
      initializeRazorpayCheckout(orderResponse);
    } catch (err) {
      console.error("Payment initialization failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to initialize payment";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const initializeRazorpayCheckout = (order: CreateOrderResponse) => {
    const options: RazorpayOptions = {
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      order_id: order.order_id,
      name: "Travel App",
      description: `Payment for Booking #${bookingId}`,
      image: "/images/logo.png", // Optional: Add your logo
      prefill: {
        name: "", // You can get user details from context if available
        email: "",
        contact: "",
      },
      notes: {
        bookingId: bookingId || "",
      },
      theme: {
        color: "#3498db", // Primary blue color
      },
      handler: handlePaymentSuccess,
      modal: {
        confirm_close: true,
        ondismiss: handlePaymentDismiss,
      },
    };

    // Create Razorpay instance and open checkout
    const razorpayInstance = new window.Razorpay(options);
    razorpayInstance.open();
  };

  const handlePaymentSuccess = async (response: RazorpaySuccessResponse) => {
    try {
      setProcessing(true);
      toast.loading("Verifying payment...", { id: "payment-verification" });

      // Verify payment with backend
      await PaymentApi.verifyPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });

      toast.success("Payment successful! Redirecting...", { id: "payment-verification" });

      // Redirect to success page or dashboard
      setTimeout(() => {
        navigate("/dashboard", {
          state: {
            paymentSuccess: true,
            bookingId: bookingId
          }
        });
      }, 2000);

    } catch (err) {
      console.error("Payment verification failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Payment verification failed";
      toast.error(errorMessage, { id: "payment-verification" });
      setError("Payment verification failed. Please contact support.");
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentDismiss = () => {
    // User closed the payment modal without completing payment
    toast.error("Payment was cancelled");
    navigate("/dashboard");
  };

  const handleRetry = () => {
    initializePayment();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e1512] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Initializing Payment</h2>
          <p className="text-gray-400">Please wait while we set up your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0e1512] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Payment Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="min-h-screen bg-[#0e1512] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Processing Payment</h2>
          <p className="text-gray-400">Please wait while we verify your payment...</p>
        </div>
      </div>
    );
  }

  // This component mainly handles the background while Razorpay modal is open
  return (
    <div className="min-h-screen bg-[#0e1512] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 text-center">
        <CreditCard className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Complete Your Payment</h2>
        <p className="text-gray-400 mb-4">
          The payment window should open automatically. If it doesn't, please check if popups are blocked.
        </p>
        {orderData && (
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-400">Amount to pay:</p>
            <p className="text-2xl font-bold text-white">
              ₹{(orderData.amount / 100).toFixed(2)}
            </p>
          </div>
        )}
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;
