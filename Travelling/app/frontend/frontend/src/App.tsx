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
import LandingPage from "./pages/LandingPage";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";

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
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
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

export default function App() {
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
