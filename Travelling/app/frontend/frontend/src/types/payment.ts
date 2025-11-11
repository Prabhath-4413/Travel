// Payment-related TypeScript interfaces

export interface CreateOrderRequest {
  token: string;
}

export interface CreateOrderResponse {
  order_id: string;
  amount: number; // Amount in paisa (smallest currency unit)
  currency: string;
  key: string; // Razorpay Key ID
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  message: string;
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayErrorResponse {
  code: string;
  description: string;
  metadata?: {
    order_id?: string;
    payment_id?: string;
  };
}

// Razorpay checkout options interface
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: {
    [key: string]: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: {
    confirm_close?: boolean;
    ondismiss?: () => void;
  };
}

// Global Razorpay interface for TypeScript
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      close: () => void;
    };
  }
}

export {};
