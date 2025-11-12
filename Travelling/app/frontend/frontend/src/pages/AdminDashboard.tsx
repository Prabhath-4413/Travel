import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import {
  destinationsAPI,
  bookingsAPI,
  adminAPI,
  tripCancellationAPI,
  type Destination,
  type TripCancellationSummary,
  type TripCancellationDecisionPayload,
  type AdminStats,
} from "../lib/api";
import { useDestinations } from "../contexts/DestinationsContext";
import UserDashboard from "./UserDashboard";

interface BookingSummary {
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
}

interface BookingItem {
  bookingId: number;
  userName: string;
  userEmail: string;
  destinations: string[];
  guests: number;
  nights: number;
  totalPrice: number;
  bookingDate: string;
}

interface BookingsData {
  summary: BookingSummary;
  recentBookings: BookingItem[];
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const { destinations, refresh: refreshDestinations } = useDestinations();

  const [bookings, setBookings] = useState<BookingsData | null>(null);
  const [pendingCancellations, setPendingCancellations] = useState<
    TripCancellationSummary[]
  >([]);
  const [selectedCancellation, setSelectedCancellation] =
    useState<TripCancellationSummary | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [decisionComment, setDecisionComment] = useState("");
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [moderationResult, setModerationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [decisionSuccessMessage, setDecisionSuccessMessage] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  useEffect(() => {
    console.log("AdminDashboard mounted, user:", user);
    return () => {
      console.log("AdminDashboard unmounting");
    };
  }, []);

  useEffect(() => {
    console.log("AdminDashboard user changed:", user);
  }, [user]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [newDestination, setNewDestination] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    latitude: "",
    longitude: "",
  });

  // Fetch bookings
  const loadBookings = useCallback(async () => {
    try {
      const data = await bookingsAPI.getAll();
      setBookings(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load booking data.");
    }
  }, []);

  const loadPendingCancellations = useCallback(async () => {
    try {
      const pending = await tripCancellationAPI.getPending();
      setPendingCancellations(pending);
    } catch (err) {
      console.error("Failed to load pending cancellations", err);
      setModerationResult({
        success: false,
        message: "Failed to load pending cancellations.",
      });
    }
  }, []);

  const loadAdminStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const stats = await adminAPI.getStats();
      setAdminStats(stats);
    } catch (err) {
      console.error("Failed to load admin stats", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadBookings(),
          loadPendingCancellations(),
          loadAdminStats(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loadBookings, loadPendingCancellations, loadAdminStats]);

  useEffect(() => {
    if (!moderationResult) return;
    const timer = window.setTimeout(() => setModerationResult(null), 5000);
    return () => window.clearTimeout(timer);
  }, [moderationResult]);

  useEffect(() => {
    if (!decisionSuccessMessage) return;
    const timer = window.setTimeout(
      () => setDecisionSuccessMessage(null),
      4000,
    );
    return () => window.clearTimeout(timer);
  }, [decisionSuccessMessage]);

  useEffect(() => {
    const pollInterval = window.setInterval(() => {
      loadPendingCancellations();
    }, 10000);

    return () => window.clearInterval(pollInterval);
  }, [loadPendingCancellations]);

  const openModerationDrawer = (entry: TripCancellationSummary) => {
    setSelectedCancellation(entry);
    setDecisionComment(entry.adminComment || "");
    setDecisionError(null);
    setModerationResult(null);
  };

  const closeModerationDrawer = () => {
    if (decisionLoading) return;
    setSelectedCancellation(null);
    setDecisionComment("");
    setDecisionError(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/landing", {
      replace: true,
      state: {
        notification: {
          type: "admin",
          message: "Admin logged out successfully",
        },
      },
    });
  };

  const handleDecision = async (action: "approve" | "reject") => {
    if (!selectedCancellation) return;

    try {
      setDecisionLoading(true);
      setDecisionError(null);
      const payload: TripCancellationDecisionPayload = {
        tripCancellationId: selectedCancellation.tripCancellationId,
        adminComment: decisionComment.trim() || undefined,
      };

      if (action === "approve") {
        const response = await tripCancellationAPI.approve(payload);
        setDecisionSuccessMessage(
          response?.message || "Cancellation approved successfully.",
        );
      } else {
        const response = await tripCancellationAPI.reject(payload);
        setDecisionSuccessMessage(
          response?.message || "Cancellation rejected successfully.",
        );
      }

      setModerationResult(null);
      await loadPendingCancellations();
      await loadBookings();
      closeModerationDrawer();
    } catch (err: any) {
      console.error(`Failed to ${action} cancellation`, err);
      const message =
        err.response?.data?.message || err.message || "Something went wrong.";
      setDecisionError(message);
      setModerationResult({ success: false, message });
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleAddDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAdding(true);
      await destinationsAPI.create({
        name: newDestination.name.trim(),
        description: newDestination.description.trim() || undefined,
        price: parseFloat(newDestination.price) || 0,
        imageUrl: newDestination.imageUrl.trim() || undefined,
        latitude: newDestination.latitude
          ? parseFloat(newDestination.latitude)
          : undefined,
        longitude: newDestination.longitude
          ? parseFloat(newDestination.longitude)
          : undefined,
      });

      // Reset form
      setNewDestination({
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        latitude: "",
        longitude: "",
      });
      setShowAddForm(false);
      await refreshDestinations();
    } catch (err) {
      console.error("Error adding destination:", err);
      alert("Failed to add destination.");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteDestination = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this destination?"))
      return;
    try {
      await destinationsAPI.delete(id);
      await refreshDestinations();
    } catch (err) {
      console.error("Error deleting destination:", err);
      alert("Failed to delete destination.");
    }
  };

  const handleTestEmail = async () => {
    try {
      setTestingEmail(true);
      setEmailTestResult(null);
      const result = await adminAPI.testEmail();
      setEmailTestResult({ success: true, message: result.message });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to send test email";
      setEmailTestResult({ success: false, message: errorMessage });
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e1512] flex items-center justify-center text-white">
        Loading Admin Dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0e1512] flex flex-col items-center justify-center text-white">
        <p className="mb-4">{error}</p>
        <button
          onClick={loadBookings}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg border border-blue-500/30"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e1512] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10 bg-[#0e1512]/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              ✈
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                SuiteSavvy
              </span>
              <span className="text-xs text-white/60 font-medium">
                Admin Dashboard
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/80 font-medium">
              Welcome, {user?.name}
            </span>
            <button
              onClick={handleTestEmail}
              disabled={testingEmail}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-blue-400 rounded-lg border border-blue-500/30 transition-all disabled:opacity-50 font-medium hover:shadow-lg hover:shadow-blue-500/20"
              title="Test email configuration"
            >
              {testingEmail ? "📧 Sending..." : "📧 Test Email"}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-red-400 rounded-lg border border-red-500/30 transition-all font-medium hover:shadow-lg hover:shadow-red-500/20"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Decision success message */}
        <AnimatePresence>
          {decisionSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300"
            >
              <div className="flex items-center justify-between">
                <span>{decisionSuccessMessage}</span>
                <button
                  onClick={() => setDecisionSuccessMessage(null)}
                  className="text-white/70 hover:text-white"
                  aria-label="Dismiss success message"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Moderation Result */}
        {moderationResult && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              moderationResult.success
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{moderationResult.message}</span>
              <button
                onClick={() => setModerationResult(null)}
                className="text-white/50 hover:text-white"
                aria-label="Dismiss moderation message"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Email Test Result */}
        {emailTestResult && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              emailTestResult.success
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{emailTestResult.message}</span>
              <button
                onClick={() => setEmailTestResult(null)}
                className="text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Analytics Dashboard */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Analytics Dashboard
            </h2>
            <button
              onClick={loadAdminStats}
              disabled={statsLoading}
              className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-blue-400 rounded-lg border border-blue-500/30 transition-all disabled:opacity-50"
            >
              {statsLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {adminStats ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <SummaryCard
                  label="Total Users"
                  value={adminStats.totalUsers}
                  color="text-blue-400"
                />
                <SummaryCard
                  label="Total Bookings"
                  value={adminStats.totalBookings}
                  color="text-green-400"
                />
                <SummaryCard
                  label="Paid Bookings"
                  value={adminStats.paidBookings}
                  color="text-purple-400"
                />
                <SummaryCard
                  label="Average Rating"
                  value={adminStats.averageRating.toFixed(1)}
                  color="text-yellow-400"
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Top Destinations Bar Chart */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Top 5 Destinations by Bookings
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={adminStats.topDestinations}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="name"
                        stroke="#9CA3AF"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#F9FAFB",
                        }}
                      />
                      <Bar
                        dataKey="bookings"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Paid vs Unpaid Pie Chart */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Booking Payment Status
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Paid",
                            value: adminStats.paidBookings,
                            color: "#10B981",
                          },
                          {
                            name: "Unpaid",
                            value:
                              adminStats.totalBookings -
                              adminStats.paidBookings,
                            color: "#EF4444",
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) =>
                          percent !== undefined
                            ? `${name} ${(percent * 100).toFixed(0)}%`
                            : name
                        }
                      >
                        {[
                          {
                            name: "Paid",
                            value: adminStats.paidBookings,
                            color: "#10B981",
                          },
                          {
                            name: "Unpaid",
                            value:
                              adminStats.totalBookings -
                              adminStats.paidBookings,
                            color: "#EF4444",
                          },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#F9FAFB",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Mock Line Chart for Bookings per Month */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Bookings Trend (Last 6 Months)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={[
                      { month: "Jun", bookings: 45 },
                      { month: "Jul", bookings: 52 },
                      { month: "Aug", bookings: 38 },
                      { month: "Sep", bookings: 61 },
                      { month: "Oct", bookings: 55 },
                      { month: "Nov", bookings: 67 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#F9FAFB",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bookings"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-sm text-white/60 mt-2">
                  * Sample data - integrate with real monthly booking data
                </p>
              </div>
            </>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center text-white/70">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-xl font-semibold mb-2 text-white">
                Loading Analytics...
              </p>
              <p>Fetching dashboard statistics</p>
            </div>
          )}
        </section>

        {/* Bookings Summary */}
        {bookings?.summary && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Booking Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <SummaryCard
                label="Total Bookings"
                value={bookings.summary.totalBookings}
                color="text-blue-400"
              />
              <SummaryCard
                label="Total Revenue"
                value={`₹${bookings.summary.totalRevenue.toLocaleString()}`}
                color="text-green-400"
              />
              <SummaryCard
                label="Average Booking"
                value={`₹${bookings.summary.averageBookingValue.toLocaleString()}`}
                color="text-purple-400"
              />
            </div>

            <RecentBookings recent={bookings.recentBookings || []} />
          </section>
        )}

        {/* Trip Cancellation Moderation */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Trip Cancellation Moderation
              </h2>
              <p className="text-white/60 mt-2 max-w-2xl">
                Review and decide on pending cancellation requests. Decisions
                will update the associated booking and notify the traveler.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full text-sm text-amber-300 font-medium">
                Pending: {pendingCancellations.length}
              </span>
              <button
                onClick={loadPendingCancellations}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105"
              >
                Refresh
              </button>
            </div>
          </div>

          {pendingCancellations.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center text-white/70">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-xl font-semibold mb-2 text-white">
                No pending cancellations
              </p>
              <p>All trip cancellation requests have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingCancellations.map((request) => (
                <motion.div
                  key={request.tripCancellationId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 hover:border-white/20 hover:shadow-xl hover:shadow-white/5 transition-all"
                >
                  <div className="space-y-3 text-sm text-white/70">
                    <div className="flex flex-wrap items-center gap-3 text-base text-white">
                      <span className="font-semibold text-white/90">
                        #{request.tripCancellationId}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold uppercase tracking-wide">
                        {request.status}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 border border-white/10 text-xs uppercase tracking-wide">
                        Booking #{request.bookingId}
                      </span>
                    </div>

                    <p>
                      <span className="text-white/80 font-medium">
                        Traveler:
                      </span>{" "}
                      {request.userName} ({request.userEmail})
                    </p>
                    <p>
                      <span className="text-white/80 font-medium">
                        Requested:
                      </span>{" "}
                      {new Date(request.requestedAt).toLocaleString()}
                    </p>
                    {request.reason && (
                      <p className="text-white/60 italic">“{request.reason}”</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs text-white/60">
                      {request.destinations.map((destination) => (
                        <span
                          key={destination}
                          className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full"
                        >
                          {destination}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="md:text-right space-y-4 md:space-y-3 md:min-w-[220px]">
                    <div className="text-white/70 text-sm">
                      <p>
                        <span className="text-white/80 font-medium">
                          Nights:
                        </span>{" "}
                        {request.nights}
                      </p>
                      <p>
                        <span className="text-white/80 font-medium">
                          Total Price:
                        </span>{" "}
                        ₹{request.totalPrice.toLocaleString()}
                      </p>
                      <p>
                        <span className="text-white/80 font-medium">
                          Travel Date:
                        </span>{" "}
                        {new Date(request.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => openModerationDrawer(request)}
                      className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105"
                    >
                      Review Request
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Manage Destinations */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Manage Destinations
            </h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all transform hover:scale-105"
            >
              + Add Destination
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((destination) => (
              <motion.div
                key={destination.destinationId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-white/20 hover:shadow-xl hover:shadow-white/5 transition-all"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={
                      destination.imageUrl ||
                      `https://picsum.photos/800/600?random=${destination.destinationId}`
                    }
                    alt={destination.name}
                    onError={(e) => {
                      // Use a data URI as fallback to avoid network errors
                      e.currentTarget.src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect width="800" height="600" fill="%23374151"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239CA3AF"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                    {destination.name}
                  </h3>
                  <p className="text-white/70 text-sm mb-4 line-clamp-2">
                    {destination.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      ₹{destination.price.toLocaleString()}
                    </span>
                    <span className="text-white/60 text-sm">per night</span>
                  </div>
                  <button
                    onClick={() =>
                      handleDeleteDestination(destination.destinationId)
                    }
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-red-400 rounded-lg border border-red-500/30 transition-all font-medium hover:shadow-lg hover:shadow-red-500/20"
                  >
                    Delete
                  </button>
                  <p className="mt-3 text-xs text-white/60 italic text-center">
                    Admins cannot make bookings.
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* User Dashboard View */}
        <section className="mb-12 pt-8 border-t border-white/10">
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            User Dashboard Preview
          </h2>
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <UserDashboard isAdminView={true} />
          </div>
        </section>
      </div>

      {/* Moderation Drawer */}
      <AnimatePresence>
        {selectedCancellation && (
          <ModerationDrawer
            cancellation={selectedCancellation}
            decisionComment={decisionComment}
            setDecisionComment={setDecisionComment}
            decisionLoading={decisionLoading}
            decisionError={decisionError}
            onClose={closeModerationDrawer}
            onApprove={() => handleDecision("approve")}
            onReject={() => handleDecision("reject")}
          />
        )}
      </AnimatePresence>

      {/* Add Destination Modal */}
      <AnimatePresence>
        {showAddForm && (
          <AddDestinationModal
            adding={adding}
            newDestination={newDestination}
            setNewDestination={setNewDestination}
            onClose={() => setShowAddForm(false)}
            onSubmit={handleAddDestination}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------- Subcomponents ---------------- //

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: any;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-white/20 hover:shadow-xl hover:shadow-white/5 transition-all"
    >
      <h3 className="text-white/70 text-sm font-medium mb-2 uppercase tracking-wide">
        {label}
      </h3>
      <div className={`text-4xl font-bold ${color}`}>{value}</div>
    </motion.div>
  );
}

function RecentBookings({ recent }: { recent: BookingItem[] }) {
  if (recent.length === 0) {
    return (
      <div className="text-center py-16 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
        <div className="text-6xl mb-4">📋</div>
        <p className="text-white/70 text-lg">No recent bookings yet</p>
      </div>
    );
  }
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all">
      <h3 className="text-xl font-semibold mb-4">Recent Bookings</h3>
      <div className="space-y-4">
        {recent.map((b) => (
          <div
            key={b.bookingId}
            className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
          >
            <div>
              <div className="font-semibold">#{b.bookingId}</div>
              <div className="text-white/70 text-sm">
                {b.userName} ({b.userEmail})
              </div>
              <div className="text-white/70 text-sm">
                {b.destinations.join(", ")} • {b.guests} guests • {b.nights}{" "}
                nights
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-400">
                ₹{b.totalPrice.toLocaleString()}
              </div>
              <div className="text-white/70 text-sm">
                {new Date(b.bookingDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ModerationDrawerProps {
  cancellation: TripCancellationSummary;
  decisionComment: string;
  setDecisionComment: React.Dispatch<React.SetStateAction<string>>;
  decisionLoading: boolean;
  decisionError: string | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

function ModerationDrawer({
  cancellation,
  decisionComment,
  setDecisionComment,
  decisionLoading,
  decisionError,
  onClose,
  onApprove,
  onReject,
}: ModerationDrawerProps) {
  const destinations = cancellation.destinations;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-[#0e1512] border-l border-white/10 shadow-2xl"
        aria-label="Trip cancellation moderation drawer"
      >
        <div className="h-full flex flex-col">
          <header className="px-6 py-5 border-b border-white/10 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Review Cancellation
              </h2>
              <p className="text-white/60 text-sm mt-1">
                Booking #{cancellation.bookingId} • Traveler{" "}
                {cancellation.userName}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={decisionLoading}
              className="text-white/50 hover:text-white disabled:opacity-50"
              aria-label="Close moderation drawer"
            >
              ✕
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <section className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap gap-3 items-center text-sm">
                <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full uppercase tracking-wide">
                  {cancellation.status}
                </span>
                <span className="px-3 py-1 bg-white/10 text-white/70 border border-white/10 rounded-full uppercase tracking-wide">
                  Cancellation #{cancellation.tripCancellationId}
                </span>
                <span className="px-3 py-1 bg-white/10 text-white/70 border border-white/10 rounded-full uppercase tracking-wide">
                  Booking #{cancellation.bookingId}
                </span>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-white/80">
                <div>
                  <dt className="text-white/60 text-xs uppercase tracking-wide">
                    Requested At
                  </dt>
                  <dd>{new Date(cancellation.requestedAt).toLocaleString()}</dd>
                </div>
                {cancellation.reviewedAt && (
                  <div>
                    <dt className="text-white/60 text-xs uppercase tracking-wide">
                      Reviewed At
                    </dt>
                    <dd>
                      {new Date(cancellation.reviewedAt).toLocaleString()}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-white/60 text-xs uppercase tracking-wide">
                    Total Price
                  </dt>
                  <dd>₹{cancellation.totalPrice.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-white/60 text-xs uppercase tracking-wide">
                    Nights
                  </dt>
                  <dd>{cancellation.nights}</dd>
                </div>
                <div>
                  <dt className="text-white/60 text-xs uppercase tracking-wide">
                    Travel Date
                  </dt>
                  <dd>
                    {new Date(cancellation.startDate).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="text-lg font-semibold text-white">
                Traveler Reason
              </h3>
              <p className="text-white/70 text-sm whitespace-pre-wrap">
                {cancellation.reason ?? "No reason provided."}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-white/60">
                {destinations.map((destination) => (
                  <span
                    key={destination}
                    className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full"
                  >
                    {destination}
                  </span>
                ))}
              </div>
            </section>

            <section className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="admin-comment"
                  className="text-sm font-medium text-white"
                >
                  Admin Comment (optional)
                </label>
                <textarea
                  id="admin-comment"
                  value={decisionComment}
                  onChange={(event) => setDecisionComment(event.target.value)}
                  rows={4}
                  placeholder="Provide any notes to share with the traveler."
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  disabled={decisionLoading}
                />
              </div>
              {decisionError && (
                <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg">
                  {decisionError}
                </div>
              )}
            </section>
          </div>

          <footer className="px-6 py-5 border-t border-white/10 bg-black/20 backdrop-blur flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <button
              onClick={onReject}
              disabled={decisionLoading}
              className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-red-300 border border-red-500/30 rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed font-medium hover:shadow-lg hover:shadow-red-500/20"
            >
              {decisionLoading ? "Processing..." : "Reject Request"}
            </button>
            <button
              onClick={onApprove}
              disabled={decisionLoading}
              className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white border border-green-500/30 rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed font-medium hover:shadow-lg hover:shadow-green-500/50 transform hover:scale-105"
            >
              {decisionLoading ? "Processing..." : "Approve Request"}
            </button>
          </footer>
        </div>
      </motion.aside>
    </>
  );
}

function AddDestinationModal({
  adding,
  newDestination,
  setNewDestination,
  onClose,
  onSubmit,
}: {
  adding: boolean;
  newDestination: any;
  setNewDestination: React.Dispatch<React.SetStateAction<any>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
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
        className="bg-[#0e1512] backdrop-blur-xl rounded-2xl border border-white/20 p-8 max-w-md w-full shadow-2xl"
      >
        <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Add New Destination
        </h3>
        <form onSubmit={onSubmit} className="space-y-4">
          {[
            "name",
            "description",
            "price",
            "imageUrl",
            "latitude",
            "longitude",
          ].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-white/90 mb-2 capitalize">
                {field === "imageUrl" ? "Image URL" : field}
              </label>
              <input
                type={
                  field === "price" ||
                  field === "latitude" ||
                  field === "longitude"
                    ? "number"
                    : "text"
                }
                step={
                  field === "latitude" || field === "longitude"
                    ? "any"
                    : undefined
                }
                required={field === "name" || field === "price"}
                value={(newDestination as any)[field]}
                onChange={(e) =>
                  setNewDestination((prev: any) => ({
                    ...prev,
                    [field]: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder={`Enter ${field}`}
              />
            </div>
          ))}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-red-400 rounded-lg border border-red-500/30 transition-all font-medium hover:shadow-lg hover:shadow-red-500/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg border border-green-500/30 transition-all disabled:opacity-50 font-medium hover:shadow-lg hover:shadow-green-500/50 transform hover:scale-105"
            >
              {adding ? "Adding..." : "Add Destination"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
