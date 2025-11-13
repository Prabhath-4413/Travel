import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Thermometer, Droplets, Cloud } from "lucide-react";
import toast from "react-hot-toast";
import { type Destination } from "../lib/api";
import { weatherService, WeatherData } from "../api/weather";

interface DestinationModalProps {
  destination: Destination | null;
  isOpen: boolean;
  onClose: () => void;
}

interface StaticReview {
  name: string;
  rating: number;
  comment: string;
}

// Dynamic reviews based on destination - different counts per destination
const getReviewsForDestination = (destinationId: number): StaticReview[] => {
  const allReviews: { [key: number]: StaticReview[] } = {
    1: [
      {
        name: "Sarah Johnson",
        rating: 5,
        comment:
          "Absolutely breathtaking! The views were stunning and the experience was unforgettable.",
      },
    ],
    2: [
      {
        name: "Mike Chen",
        rating: 4,
        comment:
          "Great destination with amazing local culture. Highly recommend for nature lovers.",
      },
      {
        name: "Emma Davis",
        rating: 5,
        comment:
          "Perfect getaway spot. The scenery and hospitality made our trip memorable.",
      },
    ],
    3: [
      {
        name: "Alex Rodriguez",
        rating: 5,
        comment:
          "Exceeded all expectations! The hospitality and natural beauty were incredible.",
      },
      {
        name: "Lisa Wang",
        rating: 4,
        comment:
          "Wonderful experience with rich cultural insights. A must-visit destination.",
      },
      {
        name: "David Thompson",
        rating: 5,
        comment:
          "Truly magical place. Every moment was filled with wonder and discovery.",
      },
    ],
  };

  // Default to 2 reviews if destination not found
  return allReviews[destinationId] || allReviews[2];
};

export default function DestinationModal({
  destination,
  isOpen,
  onClose,
}: DestinationModalProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && destination) {
      fetchWeather();
    }
  }, [isOpen, destination]);

  const fetchWeather = async () => {
    if (!destination) return;

    setWeatherLoading(true);
    setWeatherError(null);

    try {
      const cityName = destination.city || destination.name;
      const weatherData = await weatherService.getWeatherByCity(cityName);
      setWeather(weatherData);
    } catch (error) {
      setWeatherError(
        error instanceof Error ? error.message : "Failed to load weather",
      );
    } finally {
      setWeatherLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 transition-colors duration-200 ${
          i < rating ? "text-yellow-400 fill-current" : "text-white/30"
        }`}
      />
    ));
  };

  if (!destination) return null;

  const reviews = destination
    ? getReviewsForDestination(destination.destinationId)
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
            className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl w-full max-w-5xl h-auto max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white transition-all duration-300 hover:scale-110"
            >
              <X size={20} />
            </button>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-6 rounded-2xl">
              {/* Left Section - Image, Name, Cost */}
              <div className="relative rounded-2xl overflow-hidden h-80 md:h-96">
                <img
                  src={
                    destination.imageUrl ||
                    `https://via.placeholder.com/400x200?text=${destination.name}`
                  }
                  alt={destination.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex flex-col">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                      {destination.name}
                    </h2>
                    {destination.country && (
                      <p className="text-white/80 text-sm uppercase tracking-wider mb-4">
                        {destination.country}
                      </p>
                    )}
                    <div className="text-2xl md:text-3xl font-bold text-white">
                      ₹{destination.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section - Details */}
              <div className="flex flex-col space-y-6 relative">
                {/* Description */}
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-4 uppercase tracking-wider">
                    About
                  </h3>
                  <p className="text-white/90 leading-relaxed text-base">
                    {destination.description ||
                      "Experience breathtaking views and create unforgettable memories at this amazing destination. Perfect for nature lovers and adventure seekers alike."}
                  </p>
                </div>

                {/* Weather Section */}
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-4 uppercase tracking-wider">
                    Current Weather
                  </h3>
                  {weatherLoading ? (
                    <div className="flex items-center justify-center p-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white"></div>
                      <span className="ml-3 text-white/80">
                        Loading weather...
                      </span>
                    </div>
                  ) : weatherError ? (
                    <div className="flex items-center text-red-300 p-6">
                      <Cloud className="w-5 h-5 mr-3" />
                      <span>{weatherError}</span>
                    </div>
                  ) : weather ? (
                    <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center space-x-4">
                        <div className="text-5xl">
                          {weather.icon.includes("01") ||
                          weather.icon.includes("02")
                            ? "☀️"
                            : weather.icon.includes("03") ||
                                weather.icon.includes("04")
                              ? "☁️"
                              : weather.icon.includes("09") ||
                                  weather.icon.includes("10")
                                ? "🌧️"
                                : weather.icon.includes("11")
                                  ? "⛈️"
                                  : weather.icon.includes("13")
                                    ? "❄️"
                                    : "☁️"}
                        </div>
                        <div>
                          <p className="font-semibold text-white capitalize text-xl">
                            {weather.description}
                          </p>
                          <p className="text-white/70 text-sm">
                            {weather.city}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-4xl font-bold text-white mb-1">
                          <Thermometer className="w-7 h-7 mr-2" />
                          {weather.temperature}°C
                        </div>
                        <div className="flex items-center text-white/70 text-sm">
                          <Droplets className="w-4 h-4 mr-2" />
                          {weather.humidity}% humidity
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Reviews Section */}
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-white mb-4 uppercase tracking-wider">
                    Guest Reviews ({reviews.length})
                  </h3>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {reviews.map((review, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className="p-4 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-white">
                            {review.name}
                          </span>
                          <div className="flex items-center space-x-1">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <p className="text-white/80 text-sm leading-relaxed">
                          {review.comment}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Book Now Button */}
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      // Handle booking logic here
                      toast.success(
                        `Your trip to ${destination.name} has been booked successfully!`,
                      );
                      onClose();
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold rounded-xl hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
