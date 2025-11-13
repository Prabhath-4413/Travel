import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { bookingsAPI, type Destination } from "../../lib/api";

interface BookingFormProps {
  destinations: Destination[];
  onClose: () => void;
  onSuccess: (result: any) => void;
}

export default function BookingForm({
  destinations,
  onClose,
  onSuccess,
}: BookingFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    guests: 1,
    nights: 1,
    startDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      guests: 1,
      nights: 1,
      startDate: new Date().toISOString().slice(0, 10),
    }));
  }, [destinations]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const totalPrice =
    destinations.reduce((sum, dest) => sum + dest.price, 0) *
    formData.guests *
    formData.nights;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await bookingsAPI.create({
        userId: user!.userId,
        destinationIds: destinations.map((d) => d.destinationId),
        guests: formData.guests,
        nights: formData.nights,
        startDate: new Date(formData.startDate),
      });

      // Calculate end date
      const startDate = new Date(formData.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + formData.nights);

      onSuccess({
        bookingId: response.bookingId,
        message: "Booking confirmed successfully!",
        total: response.total,
        guests: response.guests,
        nights: response.nights,
        startDate: response.startDate,
        endDate: endDate.toISOString(),
        destinations: response.destinations,
      });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to complete booking",
      );
    } finally {
      setIsLoading(false);
    }
  };

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
        className="bg-[#0e1512] rounded-2xl border border-white/20 p-8 max-w-lg w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Complete Your Booking</h3>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Selected Destinations */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3">Selected Destinations</h4>
          <div className="space-y-2">
            {destinations.map((destination) => (
              <div
                key={destination.destinationId}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
              >
                <span className="text-white">{destination.name}</span>
                <span className="text-blue-400">
                  ₹{destination.price.toLocaleString()}/night
                </span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Number of Guests *
              </label>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={formData.guests}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    guests: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Number of Nights *
              </label>
              <input
                type="number"
                min="1"
                max="30"
                required
                value={formData.nights}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    nights: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-white/5 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-white/70">
              <span>Base price per night:</span>
              <span>
                ₹
                {destinations
                  .reduce((sum, dest) => sum + dest.price, 0)
                  .toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Guests × Nights:</span>
              <span>
                {formData.guests} × {formData.nights}
              </span>
            </div>
            <div className="border-t border-white/10 pt-2">
              <div className="flex justify-between text-xl font-bold text-green-400">
                <span>Total Price:</span>
                <span>₹{totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Confirm Booking for ₹{totalPrice.toLocaleString()}
                </span>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
