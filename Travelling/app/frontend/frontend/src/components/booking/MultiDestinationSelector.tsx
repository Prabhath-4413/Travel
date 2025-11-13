import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useDestinations } from "../../contexts/DestinationsContext";
import { type Destination } from "../../lib/api";
import RouteModal from "./RouteModal";

export default function MultiDestinationSelector() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { destinations } = useDestinations();
  const [selectedDestinations, setSelectedDestinations] = useState<
    Destination[]
  >([]);
  const [showRouteModal, setShowRouteModal] = useState(false);

  const toggleDestination = (destination: Destination) => {
    setSelectedDestinations((prev) =>
      prev.find((d) => d.destinationId === destination.destinationId)
        ? prev.filter((d) => d.destinationId !== destination.destinationId)
        : [...prev, destination],
    );
  };

  const handleBuildRoute = () => {
    if (selectedDestinations.length < 2) return;
    setShowRouteModal(true);
  };

  const handleProceedToBooking = () => {
    if (selectedDestinations.length === 0) return;

    // Store booking data in localStorage
    const bookingData = {
      destinations: selectedDestinations,
      userId: user?.userId,
      timestamp: Date.now(),
    };
    localStorage.setItem("pendingBooking", JSON.stringify(bookingData));

    // Navigate to start booking page
    navigate("/start-booking");
  };

  const totalPrice = selectedDestinations.reduce(
    (sum, dest) => sum + dest.price,
    0,
  );

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
                Select Destinations
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/70">
              {selectedDestinations.length} selected
            </span>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-4">
            Select Multiple Destinations
          </h1>
          <p className="text-white/70 text-lg">
            Choose the destinations you'd like to include in your trip. You can
            book multiple locations at once.
          </p>
        </motion.div>

        {/* Selection Summary */}
        {selectedDestinations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Selected Destinations</h2>
              <span className="text-2xl font-bold text-green-400">
                ₹{totalPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedDestinations.map((dest) => (
                <div
                  key={dest.destinationId}
                  className="flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm"
                >
                  <span>{dest.name}</span>
                  <button
                    onClick={() => toggleDestination(dest)}
                    className="text-blue-300 hover:text-blue-100 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {destinations.map((destination, index) => {
            const isSelected = selectedDestinations.some(
              (d) => d.destinationId === destination.destinationId,
            );

            return (
              <motion.div
                key={destination.destinationId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm hover:shadow-xl hover:shadow-white/5 cursor-pointer transition-all ${
                  isSelected
                    ? "border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                    : "border-white/10 bg-white/5"
                }`}
                onClick={() => toggleDestination(destination)}
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={
                      destination.imageUrl ||
                      `https://via.placeholder.com/400x300?text=Destination`
                    }
                    alt={destination.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    loading="lazy"
                  />

                  {/* Selection Overlay */}
                  <div
                    className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                      isSelected ? "opacity-100" : "opacity-0 hover:opacity-80"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "border-blue-400 bg-blue-400"
                          : "border-white bg-white/20"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {destination.name}
                      </h3>
                      {destination.country && (
                        <p className="text-sm text-white/60">
                          {destination.country}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-white/70">
                      ₹{destination.price.toLocaleString()}
                    </span>
                  </div>

                  {destination.description && (
                    <p className="text-white/80 text-sm leading-relaxed line-clamp-2">
                      {destination.description}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Build Route Button */}
        {selectedDestinations.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-4"
          >
            <button
              onClick={handleBuildRoute}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105"
            >
              🗺️ Build Route ({selectedDestinations.length} destinations)
            </button>
            <p className="text-white/70 mt-2 text-sm">
              Visualize your travel route on the map
            </p>
          </motion.div>
        )}

        {/* Proceed Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <button
            onClick={handleProceedToBooking}
            disabled={selectedDestinations.length === 0}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-green-500/50 disabled:shadow-none transition-all hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {selectedDestinations.length === 0
              ? "Select at least one destination"
              : `Book ${selectedDestinations.length} Destination${selectedDestinations.length > 1 ? "s" : ""}`}
          </button>
          <p className="text-white/70 mt-4 text-sm">
            You'll be able to customize dates, number of guests, and complete
            payment on the next page
          </p>
        </motion.div>
      </div>

      {/* Route Modal */}
      <RouteModal
        isOpen={showRouteModal}
        onClose={() => setShowRouteModal(false)}
        destinations={selectedDestinations.map((d) => ({
          name: d.name,
          lat: d.latitude,
          lon: d.longitude,
        }))}
      />
    </div>
  );
}
