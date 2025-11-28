import axios from "axios";
import { detectBackendPort } from "./backendDetector";

// Provide minimal typing for Vite's import.meta.env so TS doesn't error when a global
// declaration file (e.g. env.d.ts) is not present in the project.
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

let API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export async function initializeApiClient() {
  const detection = await detectBackendPort();

  if (detection.baseUrl) {
    API_BASE_URL = detection.baseUrl;
    api.defaults.baseURL = detection.baseUrl;
    console.log(`API client initialized with ${detection.baseUrl}`);
  } else {
    console.warn(
      `Could not detect backend. Using fallback: ${API_BASE_URL}`,
    );
  }

  return API_BASE_URL;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function updateApiBaseUrl(newUrl: string): void {
  API_BASE_URL = newUrl;
  api.defaults.baseURL = newUrl;
}

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors (auth errors and connection errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      const enhancedError = new Error(
        `Backend connection failed (${API_BASE_URL}). Make sure the .NET backend is running.`,
      );
      Object.assign(enhancedError, error);
      return Promise.reject(enhancedError);
    }

    return Promise.reject(error);
  },
);

// Types
export interface Destination {
  destinationId: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  city?: string;
}

export type CancellationStatus = "None" | "Requested" | "Approved" | "Rejected";

export interface Booking {
  bookingId: number;
  totalPrice: number;
  guests: number;
  nights: number;
  bookingDate: string;
  destinations: string[];
  cancellationStatus: CancellationStatus;
  latestCancellation?: TripCancellationDetail | null;
}

export interface UserBooking {
  bookingId: number;
  destinations: string;
  startDate: string;
  guests: number;
  nights: number;
  totalPrice: number;
  status: string;
}

export interface TripCancellationDetail {
  tripCancellationId: number;
  status: TripCancellationStatus;
  requestedAt: string;
  reviewedAt?: string | null;
  adminComment?: string | null;
  reason?: string | null;
}

export interface BookingRequest {
  userId: number;
  destinationIds: number[];
  guests: number;
  nights: number;
  startDate: Date;
}

export type TripCancellationStatus = "Pending" | "Approved" | "Rejected";

export interface TripCancellationSummary {
  tripCancellationId: number;
  bookingId: number;
  userId: number;
  userName: string;
  userEmail: string;
  status: TripCancellationStatus;
  bookingCancellationStatus: CancellationStatus;
  requestedAt: string;
  reviewedAt?: string | null;
  reason?: string | null;
  adminComment?: string | null;
  totalPrice: number;
  nights: number;
  startDate: string;
  destinations: string[];
}

export interface TripCancellationRequestPayload {
  bookingId: number;
  userId: number;
  reason?: string;
}

export interface TripCancellationDecisionPayload {
  tripCancellationId: number;
  adminComment?: string;
}

export interface ShortestPathRequest {
  points: Array<{ latitude: number; longitude: number }>;
}

export interface ShortestPathResponse {
  order: number[];
  distanceKm: number;
}

// Feedback types
export interface Feedback {
  feedbackId: number;
  id: number;
  name?: string;
  email?: string;
  message: string;
  rating: number;
  createdAt: string;
}

export interface CreateFeedbackRequest {
  name?: string;
  email?: string;
  message: string;
  rating: number;
}

// Review types
export interface Review {
  reviewId: number;
  userId: number;
  userName: string;
  destinationId: number;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ReviewRequest {
  userId: number;
  destinationId: number;
  rating: number;
  comment?: string;
}

export interface ReviewAverage {
  destinationId: number;
  averageRating: number;
  totalReviews: number;
}

// Admin stats types
export interface AdminStats {
  totalUsers: number;
  totalBookings: number;
  paidBookings: number;
  averageRating: number;
  topDestinations: TopDestination[];
}

export interface TopDestination {
  name: string;
  bookings: number;
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  register: async (name: string, email: string, password: string) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });
    return response.data;
  },

  requestPasswordReset: async (email: string) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async (payload: {
    token: string;
    password: string;
    confirmPassword: string;
  }) => {
    const response = await api.post("/auth/reset-password", payload);
    return response.data;
  },
};

// Destinations API
export const destinationsAPI = {
  getAll: async (): Promise<Destination[]> => {
    try {
      const response = await api.get<Destination[]>("/api/destinations");
      console.log("Fetched destinations:", response.data?.length ?? 0);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch destinations", error);
      throw error;
    }
  },
  getById: async (id: number): Promise<Destination> => {
    const response = await api.get<Destination>(`/api/destinations/${id}`);
    return response.data;
  },

  create: async (destination: Omit<Destination, "destinationId">) => {
    const response = await api.post("/admin/destinations", destination);
    return response.data;
  },

  update: async (id: number, destination: Partial<Destination>) => {
    const response = await api.patch(`/admin/destinations/${id}`, destination);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/admin/destinations/${id}`);
  },
};

// Bookings API
export const bookingsAPI = {
  create: async (booking: BookingRequest) => {
    const response = await api.post("/bookings", booking);
    return response.data;
  },

  getCurrentUserBookings: async (): Promise<UserBooking[]> => {
    const response = await api.get("/api/booking/user-bookings");
    return response.data;
  },

  getAll: async () => {
    const response = await api.get("/admin/bookings");
    return response.data;
  },

  sendOtp: async (bookingId: number) => {
    const response = await api.post("/api/booking/send-otp", { bookingId });
    return response.data;
  },

  verifyOtp: async (bookingId: number, otp: string) => {
    const response = await api.post("/api/booking/verify-otp", {
      bookingId,
      otp,
    });
    return response.data;
  },

  confirmBooking: async (bookingId: number, email: string) => {
    const response = await api.post("/api/booking/confirm", {
      bookingId,
      email,
    });
    return response.data;
  },

  sendRescheduleOtp: async (
    bookingId: number,
    newStartDate: Date,
    newDestinationId?: number,
  ) => {
    const response = await api.post("/api/booking/send-reschedule-otp", {
      bookingId,
      newStartDate,
      newDestinationId,
    });
    return response.data;
  },

  verifyRescheduleOtp: async (
    bookingId: number,
    otp: string,
    newStartDate: Date,
    newDestinationId?: number,
  ) => {
    const response = await api.post("/api/booking/verify-reschedule-otp", {
      bookingId,
      otp,
      newStartDate,
      newDestinationId,
    });
    return response.data;
  },

  // Package Booking API
  createPackageBooking: async (
    userId: number,
    packageId: number,
    guests: number,
    nights: number,
    startDate: Date,
  ) => {
    const response = await api.post("/api/booking/packages/create", {
      userId,
      packageId,
      guests,
      nights,
      startDate,
    });
    return response.data;
  },

  generatePackageOtp: async (bookingId: number) => {
    const response = await api.post("/api/booking/packages/generate-otp", {
      bookingId,
    });
    return response.data;
  },

  verifyPackageOtp: async (bookingId: number, otp: string) => {
    const response = await api.post("/api/booking/packages/verify-otp", {
      bookingId,
      otp,
    });
    return response.data;
  },

  confirmPackageBooking: async (bookingId: number, email: string) => {
    const response = await api.post("/api/booking/packages/confirm", {
      bookingId,
      email,
    });
    return response.data;
  },
};

// Trip Cancellation API
export const tripCancellationAPI = {
  requestCancellation: async (payload: TripCancellationRequestPayload) => {
    const response = await api.post("/api/TripCancellation/request", payload);
    return response.data;
  },
  getPending: async (): Promise<TripCancellationSummary[]> => {
    const response = await api.get("/api/TripCancellation/pending");
    return response.data;
  },
  approve: async (payload: TripCancellationDecisionPayload) => {
    const response = await api.post("/api/TripCancellation/approve", payload);
    return response.data;
  },
  reject: async (payload: TripCancellationDecisionPayload) => {
    const response = await api.post("/api/TripCancellation/reject", payload);
    return response.data;
  },
};

// Shortest path API
export const shortestPathAPI = {
  calculate: async (
    request: ShortestPathRequest,
  ): Promise<ShortestPathResponse> => {
    const response = await api.post("/shortest-path", request);
    return response.data;
  },
};

// Feedback API
export const feedbackAPI = {
  submit: async (feedback: CreateFeedbackRequest) => {
    const response = await api.post("/api/feedback", feedback);
    return response.data;
  },

  getRecent: async (limit: number = 10): Promise<Feedback[]> => {
    const response = await api.get("/api/feedback", { params: { limit } });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get("/api/feedback/stats");
    return response.data;
  },
};

// Review API
export const reviewAPI = {
  add: async (review: ReviewRequest) => {
    const response = await api.post("/api/reviews", review);
    return response.data;
  },

  getForDestination: async (destinationId: number): Promise<Review[]> => {
    const response = await api.get(`/api/reviews/${destinationId}`);
    return response.data;
  },

  getAverage: async (destinationId: number): Promise<ReviewAverage> => {
    const response = await api.get(`/api/reviews/average/${destinationId}`);
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get("/api/admin/stats");
    return response.data;
  },

  testEmail: async (
    overrides?: Partial<{ to: string; subject: string; body: string }>,
  ) => {
    const defaultPayload = {
      to: "test@example.com",
      subject: "Test email",
      body: "This is a test email from the admin panel.",
    };

    const response = await api.post("/admin/test-email", {
      ...defaultPayload,
      ...overrides,
    });
    return response.data;
  },
};

// Legacy function for backward compatibility
export const fetchDestinations = destinationsAPI.getAll;

// Export api instance for other modules
export default api;
