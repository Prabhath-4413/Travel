import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DestinationsProvider } from "./contexts/DestinationsContext";
import { initializeApiClient } from "./lib/api";
import { createHealthCheckListener } from "./lib/backendDetector";
import LandingPage from "./pages/LandingPage";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PaymentPage from "./pages/PaymentPage";
import StartBookingPage from "./pages/StartBookingPage";
import MultiDestinationSelector from "./components/booking/MultiDestinationSelector";
import BackendConnectionError from "./components/BackendConnectionError";

// ✅ Protected Route Component
function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    console.log("ProtectedRoute: No user, redirecting to login");
    const redirectTo = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to="/login"
        replace
        state={{ redirectTo, redirectState: location.state }}
      />
    );
  }

  // ✅ Check role-based access
  if (requireAdmin) {
    if (user.role !== "admin") {
      console.log("ProtectedRoute: Access denied - User is not admin");
      return <Navigate to="/dashboard" replace />;
    }
    console.log("ProtectedRoute: Admin access granted for", user.name);
  } else {
    if (user.role === "admin") {
      console.log(
        "ProtectedRoute: Admin user accessing user route, redirecting to admin dashboard",
      );
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
}

// ✅ Public Route Component
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (user) {
    const redirectTo = user.role === "admin" ? "/admin" : "/dashboard";
    console.log(
      "PublicRoute: User already logged in, redirecting to",
      redirectTo,
    );
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* ✅ Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />{" "}
      {/* Added landing route */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      {/* ✅ Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/start-booking"
        element={
          <ProtectedRoute>
            <StartBookingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/destinations"
        element={
          <ProtectedRoute>
            <MultiDestinationSelector />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      {/* ✅ Payment routes */}
      <Route path="/payment" element={<PaymentPage />} />
      {/* ✅ Catch-all redirect */}
      <Route
        path="*"
        element={
          user ? (
            <Navigate
              to={user.role === "admin" ? "/admin" : "/dashboard"}
              replace
            />
          ) : (
            <Navigate to="/landing" replace />
          )
        }
      />
    </Routes>
  );
}

function AppWithHealthCheck() {
  const [backendStatus, setBackendStatus] = useState<
    "loading" | "healthy" | "unhealthy"
  >("loading");

  useEffect(() => {
    let unsubscribeHealthCheck: (() => void) | null = null;

    const initializeApp = async () => {
      try {
        await initializeApiClient();
        setBackendStatus("healthy");

        unsubscribeHealthCheck = await createHealthCheckListener((status) => {
          setBackendStatus(status === "healthy" ? "healthy" : "unhealthy");
        });
      } catch (error) {
        console.error("Failed to initialize API client:", error);
        setBackendStatus("unhealthy");
      }
    };

    initializeApp();

    return () => {
      if (unsubscribeHealthCheck) {
        unsubscribeHealthCheck();
      }
    };
  }, []);

  if (backendStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0e1512]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7fb539] mx-auto mb-4"></div>
          <p className="text-white">Initializing application...</p>
        </div>
      </div>
    );
  }

  if (backendStatus === "unhealthy") {
    return (
      <BackendConnectionError
        message="Unable to connect to the backend server. Please ensure your .NET backend is running."
        onRetry={() => window.location.reload()}
        isFullScreen={true}
      />
    );
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <DestinationsProvider>
          <Router>
            <div className="min-h-screen bg-[#0e1512] text-white font-display">
              <AppRoutes />
            </div>
          </Router>
        </DestinationsProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default function App() {
  return <AppWithHealthCheck />;
}
