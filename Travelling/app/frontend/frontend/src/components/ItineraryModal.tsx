import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Calendar, Users, Thermometer, Droplets, Cloud } from "lucide-react";
import { weatherService, type WeatherData } from "../api/weather";

interface ItineraryDestination {
  id: number;
  name: string;
  city: string;
  country: string;
  imageUrl: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

interface ItineraryBooking {
  bookingId: string;
  totalPrice: number;
  currency: string;
  travelers: number;
  duration: number;
  destinations: ItineraryDestination[];
}

interface ItineraryModalProps {
  booking: ItineraryBooking | null;
  isOpen: boolean;
  onClose: () => void;
}

const InfoCard = ({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-2xl bg-white/[0.08] border border-white/15 backdrop-blur-xl p-6 transition-all duration-300 hover:bg-white/[0.12] hover:border-white/25 ${className}`}
  >
    <p className="text-xs font-semibold tracking-widest uppercase text-white/60 mb-4">
      {title}
    </p>
    {children}
  </div>
);

const DestinationCard = ({
  destination,
  index,
}: {
  destination: ItineraryDestination;
  index: number;
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoadingWeather(true);
        const weatherData = await weatherService.getWeatherByCity(
          destination.city || destination.name
        );
        setWeather(weatherData);
      } catch (error) {
        console.error("Failed to fetch weather:", error);
      } finally {
        setLoadingWeather(false);
      }
    };

    fetchWeather();
  }, [destination]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border border-white/15 backdrop-blur-xl hover:border-white/30 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={
            destination.imageUrl ||
            `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500&h=400&fit=crop`
          }
          alt={destination.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1">{destination.name}</h3>
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <MapPin size={14} />
            <span>
              {destination.city}, {destination.country}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5">
        {destination.description && (
          <p className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-2">
            {destination.description}
          </p>
        )}

        {loadingWeather ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
          </div>
        ) : weather ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs font-semibold text-white/60 uppercase mb-3">
              Current Weather
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {weather.icon.includes("01") || weather.icon.includes("02")
                    ? "☀️"
                    : weather.icon.includes("03") || weather.icon.includes("04")
                      ? "☁️"
                      : weather.icon.includes("09") || weather.icon.includes("10")
                        ? "🌧️"
                        : weather.icon.includes("11")
                          ? "⛈️"
                          : weather.icon.includes("13")
                            ? "❄️"
                            : "🌤️"}
                </span>
                <div>
                  <p className="text-white font-semibold capitalize">
                    {weather.description}
                  </p>
                  <p className="text-white/60 text-xs">{weather.temperature}°C</p>
                </div>
              </div>
              <div className="flex items-center text-white/70 text-sm">
                <Droplets size={14} className="mr-1" />
                <span>{weather.humidity}%</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
};

export default function ItineraryModal({
  booking,
  isOpen,
  onClose,
}: ItineraryModalProps) {
  if (!booking) return null;

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: booking.currency || "INR",
    minimumFractionDigits: 0,
  }).format(booking.totalPrice);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="itinerary-modal-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="itinerary-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="modal-close-btn">
              <X size={20} />
            </button>

            <div className="itinerary-modal-content">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="itinerary-header"
              >
                <h1 className="itinerary-title">Your Destinations</h1>
                <p className="itinerary-subtitle">
                  {booking.destinations.length} {booking.destinations.length === 1 ? "destination" : "destinations"} •{" "}
                  {booking.duration} days
                </p>
              </motion.div>

              <div className="itinerary-destinations-grid">
                {booking.destinations.map((destination, index) => (
                  <DestinationCard
                    key={destination.id}
                    destination={destination}
                    index={index}
                  />
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="itinerary-booking-summary"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InfoCard title="Total Travelers">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-blue-500/50">
                        <Users size={24} className="text-blue-300" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {booking.travelers}
                        </p>
                        <p className="text-xs text-white/60">
                          {booking.travelers === 1 ? "person" : "people"}
                        </p>
                      </div>
                    </div>
                  </InfoCard>

                  <InfoCard title="Trip Duration">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/50">
                        <Calendar size={24} className="text-purple-300" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {booking.duration}
                        </p>
                        <p className="text-xs text-white/60">
                          {booking.duration === 1 ? "day" : "days"}
                        </p>
                      </div>
                    </div>
                  </InfoCard>

                  <InfoCard title="Total Cost">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/30 to-red-500/30 border border-orange-500/50">
                        <span className="text-2xl">💰</span>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {formattedPrice}
                        </p>
                        <p className="text-xs text-white/60">Booking total</p>
                      </div>
                    </div>
                  </InfoCard>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="itinerary-action-buttons"
              >
                <button onClick={onClose} className="action-button action-button-primary">
                  Continue Journey
                </button>
                <button onClick={onClose} className="action-button action-button-secondary">
                  Close
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
