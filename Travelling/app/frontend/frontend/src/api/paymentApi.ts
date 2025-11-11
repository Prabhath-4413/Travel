import api from "../lib/api";
import {
  CreateOrderRequest,
  CreateOrderResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
} from "../types/payment";

/**
 * Payment API service for Razorpay integration
 */
export class PaymentApi {
  /**
   * Create a Razorpay order for payment
   * @param request - Contains the secure token from the payment link
   * @returns Order details for Razorpay checkout
   */
  static async createOrder(
    request: CreateOrderRequest,
  ): Promise<CreateOrderResponse> {
    const response = await api.post<CreateOrderResponse>(
      "/payment/create-order",
      request,
    );
    return response.data;
  }

  /**
   * Verify payment after successful Razorpay transaction
   * @param request - Contains Razorpay payment details and signature
   * @returns Verification response
   */
  static async verifyPayment(
    request: VerifyPaymentRequest,
  ): Promise<VerifyPaymentResponse> {
    const response = await api.post<VerifyPaymentResponse>(
      "/payment/verify-payment",
      request,
    );
    return response.data;
  }
}

/**
 * Utility function to load Razorpay checkout script dynamically
 * @returns Promise that resolves when script is loaded
 */
export const loadRazorpayScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay script"));
    document.body.appendChild(script);
  });
};

/**
 * Get Razorpay key from environment variables
 * @returns Razorpay key ID
 */
export const getRazorpayKey = (): string => {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!key) {
    throw new Error("VITE_RAZORPAY_KEY_ID environment variable is not set");
  }
  return key;
};
